import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { 
  Send, 
  Bot, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Play,
  Pause,
  Square,
  RotateCcw,
  Globe,
  Database,
  Zap,
  FileText,
  Loader2
} from 'lucide-react';
import { createStreamingChat } from '../../services/pythonApiClient';
import { pythonApiClient } from '../../services/pythonApiClient';
import { 
  getResourceTypeConfig, 
  getStepCategoryConfig, 
  getResourceTypeClasses, 
  getStepCategoryClasses,
  type ResourceType,
  type StepCategory 
} from '../../constants/workflowConfig';

interface TaskMessage {
  id: string;
  type: 'user' | 'system' | 'task' | 'result' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  data?: {
    isLoading?: boolean;
    isAssistantLoading?: boolean; // 新增：助手loading状态
    taskId?: string;
    isStep?: boolean;
    step?: ExecutionStep;
    category?: string;
    results?: string[];
  };
  isComplete?: boolean;
  isStreaming?: boolean;
  steps?: ExecutionStep[];
  currentStep?: ExecutionStep;
}

interface ExecutionStep {
  id: string;
  content: string;
  stepNumber: number;
  totalSteps: number;
  category: 'analysis' | 'strategy' | 'general' | 'result' | 'error';
  resourceType?: 'browser' | 'database' | 'api' | 'general'; // 新增：资源类型
  timestamp: Date;
  isClickable?: boolean;
  isCompleted?: boolean; // 新增：标识步骤是否已完成
  results?: any[]; // 新增：步骤执行结果
}

interface StreamChunk {
  type: 'start' | 'content' | 'progress' | 'complete' | 'error' | 'task_info';
  content?: string;
  step?: number;
  totalSteps?: number;
  stepId?: string;
  category?: string;
  resourceType?: string; // 新增：资源类型
  results?: any[]; // 新增：步骤结果
  error?: string;
  // 任务信息
  taskTitle?: string;
  taskDescription?: string;
}

interface WorkflowCanvasProps {
  workflowId: string | null;
  onNodeClick?: (nodeId: string, nodeType: string) => void;
  selectedNodeId?: string | null;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = observer(({ 
  workflowId, 
  onNodeClick,
  selectedNodeId 
}) => {
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentExecutionSteps, setCurrentExecutionSteps] = useState<ExecutionStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<ExecutionStep | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isUnmountingRef = useRef(false);

  // 调试：显示当前workflowId
  React.useEffect(() => {
    console.log('WorkflowCanvas接收到的workflowId:', workflowId);
  }, [workflowId]);

  // 初始化对话消息
  useEffect(() => {
    if (workflowId) {
      // 创建新任务时，只显示欢迎消息
      const initialMessages: TaskMessage[] = [
        {
          id: 'welcome',
          type: 'system',
          content: '欢迎使用 FindValue AI 工作流！请输入您的任务需求，我将为您创建专属的工作流程。',
          timestamp: new Date()
        }
      ];
      setMessages(initialMessages);
    } else {
      setMessages([
        {
          id: 'welcome',
          type: 'system',
          content: '欢迎使用 FindValue AI 工作流！请从左侧选择一个工作流开始。',
          timestamp: new Date()
        }
      ]);
    }
  }, [workflowId]);

  // 组件卸载时关闭EventSource
  useEffect(() => {
    return () => {
      isUnmountingRef.current = true;
      if (eventSourceRef.current) {
        console.log('组件卸载，关闭SSE连接');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // 监听路由变化，切换workflowId时关闭之前的连接
  useEffect(() => {
    // 当workflowId变化时，立即断开之前的连接
    if (eventSourceRef.current) {
      console.log('工作流切换，立即关闭当前SSE连接:', eventSourceRef.current.readyState);
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      
      // 重置相关状态
      setIsStreaming(false);
      setIsRunning(false);
      setCurrentExecutionSteps([]);
      setCurrentTaskId(null);
    }
    
    // 同时关闭全局的活跃连接（保险措施）
    try {
      if (pythonApiClient.getActiveConnectionCount() > 0) {
        console.log('检测到活跃连接，全部关闭');
        pythonApiClient.closeAllConnections();
      }
    } catch (error) {
      console.error('关闭全局连接失败:', error);
    }
    
    return () => {
      if (eventSourceRef.current) {
        console.log('工作流切换清理，关闭当前SSE连接');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [workflowId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentExecutionSteps]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !workflowId || isStreaming) return;

    const userMessage: TaskMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    const messageContent = inputMessage;
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // 开始流式对话
    startStreamingChat(messageContent);
  };

  const startStreamingChat = async (message: string) => {
    setIsStreaming(true);
    setIsRunning(true);

    // 创建用户消息
    const userMessage: TaskMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    const aiMessageId = `ai-${Date.now()}`;
    const aiMessage: TaskMessage = {
      id: aiMessageId,
      type: 'assistant',
      content: '正在思考中...',
      timestamp: new Date(),
      isComplete: false,
      isStreaming: true,
      data: {
        isAssistantLoading: true // 新增：标识助手正在loading
      }
    };

    setMessages(prev => [...prev, aiMessage]);

    try {
      // 强制关闭之前的连接和清理全局连接
      if (eventSourceRef.current) {
        console.log('强制关闭之前的连接:', eventSourceRef.current.readyState);
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      // 清理全局活跃连接
      try {
        if (pythonApiClient.getActiveConnectionCount() > 0) {
          console.log('开始新连接前，清理所有活跃连接');
          pythonApiClient.closeAllConnections();
        }
      } catch (error) {
        console.error('清理全局连接失败:', error);
      }
      
      // 等待一小段时间确保连接完全关闭
      await new Promise(resolve => setTimeout(resolve, 100));

      // 使用Python API客户端创建流式连接
      const eventSource = createStreamingChat({
        message: message,
        conversationId: workflowId || `workflow-${Date.now()}`,
        context: { workflowId }
      });
      eventSourceRef.current = eventSource;

      // 处理流式消息
      eventSource.onmessage = (event) => {
        // 检查组件是否已卸载或连接是否已关闭
        if (isUnmountingRef.current || eventSourceRef.current !== eventSource) {
          console.log('组件已卸载或连接已更换，忽略消息');
          return;
        }
        
        try {
          const chunk: StreamChunk = JSON.parse(event.data);
          
          switch (chunk.type) {
            case 'start':
              console.log('开始接收流式响应');
              setCurrentExecutionSteps([]);
              setCurrentTaskId(aiMessageId);
              
              // 通知右侧面板任务开始，拉起面板
              if ((window as any).updateWorkspacePanel) {
                (window as any).updateWorkspacePanel({
                  type: 'task_start',
                  taskId: aiMessageId,
                  messageId: aiMessageId
                });
              }
              
              // 保持loading状态，等待第一个progress或content事件再清除
              console.log('任务开始，保持loading状态直到收到内容');
              break;
              
            case 'task_info':
              // 处理任务信息，更新左侧任务列表
              console.log('接收到任务信息:', chunk.taskTitle, chunk.taskDescription);
              if (chunk.taskTitle && chunk.taskDescription && workflowId) {
                // 更新侧边栏中的任务名称和描述
                if ((window as any).updateSidebarTask) {
                  (window as any).updateSidebarTask(workflowId, chunk.taskTitle, chunk.taskDescription);
                  console.log('已更新任务信息:', chunk.taskTitle, chunk.taskDescription);
                }
              }
              break;
              
            case 'progress':
              // 更新进度信息和执行步骤
              if (chunk.step && chunk.totalSteps && chunk.content) {
                // 如果是第一个步骤，清除AI消息的loading状态
                if (chunk.step === 1) {
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { 
                          ...msg, 
                          content: '', // 清空loading文本
                          data: { ...msg.data, isAssistantLoading: false } 
                        }
                      : msg
                  ));
                }
                
                const newStep: ExecutionStep = {
                  id: chunk.stepId || `step_${chunk.step}`,
                  content: chunk.content,
                  stepNumber: chunk.step,
                  totalSteps: chunk.totalSteps,
                  category: (chunk.category as ExecutionStep['category']) || 'general',
                  resourceType: (chunk.resourceType as ExecutionStep['resourceType']) || 'general',
                  results: chunk.results || [],
                  timestamp: new Date(),
                  isClickable: true,
                  isCompleted: false // 新步骤默认未完成
                };
                
                setCurrentExecutionSteps(prev => {
                  // 标记之前的步骤为已完成，并更新文案
                  const updatedSteps = prev.map(step => {
                    if (step.stepNumber < newStep.stepNumber && !step.isCompleted) {
                      return {
                        ...step,
                        isCompleted: true,
                        content: step.content.replace(/^正在/, '已完成') // 将"正在xxx"改为"已完成xxx"
                      };
                    }
                    return step;
                  });
                  
                  const existing = updatedSteps.find(s => s.id === newStep.id);
                  if (existing) {
                    return updatedSteps.map(s => s.id === newStep.id ? newStep : s);
                  } else {
                    return [...updatedSteps, newStep];
                  }
                });
                
                // 同步更新消息中的步骤状态
                setMessages(prev => prev.map(msg => {
                  if (msg.data?.isStep && msg.data?.step && msg.data.step.stepNumber < newStep.stepNumber && !msg.data.step.isCompleted) {
                    return {
                      ...msg,
                      content: msg.content.replace(/^正在/, '已完成'),
                      data: {
                        ...msg.data,
                        step: {
                          ...msg.data.step,
                          isCompleted: true,
                          content: msg.data.step.content.replace(/^正在/, '已完成')
                        }
                      }
                    };
                  }
                  return msg;
                }));
                
                // 将新步骤作为独立的系统消息添加到对话中
                const stepMessage: TaskMessage = {
                  id: `step-${newStep.id}`,
                  type: 'system',
                  content: newStep.content,
                  timestamp: new Date(),
                  data: {
                    isStep: true,
                    step: newStep,
                    taskId: aiMessageId,
                    category: newStep.category
                  }
                };
                
                setMessages(prev => {
                  // 检查是否已存在相同步骤，如果存在则更新，否则添加
                  const existingIndex = prev.findIndex(m => m.id === stepMessage.id);
                  if (existingIndex !== -1) {
                    const newMessages = [...prev];
                    newMessages[existingIndex] = stepMessage;
                    return newMessages;
                  } else {
                    return [...prev, stepMessage];
                  }
                });
                
                // 通知右侧面板显示当前步骤，如果是第一个步骤则拉起面板
                if ((window as any).updateWorkspacePanel) {
                  (window as any).updateWorkspacePanel({
                    type: 'current_step',
                    step: newStep,
                    taskId: aiMessageId,
                    isFirstStep: newStep.stepNumber === 1, // 标识是否为第一个步骤
                    resourceType: newStep.resourceType,
                    results: newStep.results
                  });
                }
              }
              break;
              
            case 'content':
              // 更新AI消息内容，确保AI消息在步骤消息之后
              if (chunk.content) {
                setMessages(prev => {
                  // 找到AI消息和相关的步骤消息
                  const aiMsgIndex = prev.findIndex(msg => msg.id === aiMessageId);
                  const stepMessages = prev.filter(msg => 
                    msg.data?.isStep && msg.data?.taskId === aiMessageId
                  );
                  const otherMessages = prev.filter(msg => 
                    msg.id !== aiMessageId && 
                    !(msg.data?.isStep && msg.data?.taskId === aiMessageId)
                  );
                  
                  if (aiMsgIndex !== -1) {
                    const currentAiMsg = prev[aiMsgIndex];
                    const updatedAiMsg = {
                      ...currentAiMsg,
                      content: currentAiMsg.content + chunk.content,
                      steps: currentExecutionSteps,
                      currentStep: currentExecutionSteps[currentExecutionSteps.length - 1],
                      data: { 
                        ...currentAiMsg.data, 
                        isAssistantLoading: false // 收到内容时清除loading状态
                      }
                    };
                    
                    // 重新排序：其他消息 + 步骤消息 + AI消息
                    return [...otherMessages, ...stepMessages, updatedAiMsg];
                  }
                  
                  return prev;
                });
              }
              break;
              
            case 'complete':
              // 完成流式响应，标记最后一个步骤为已完成，重新整理消息顺序
              setCurrentExecutionSteps(prev => prev.map(step => ({
                ...step,
                isCompleted: true,
                content: step.isCompleted ? step.content : step.content.replace(/^正在/, '已完成')
              })));
              
              setMessages(prev => {
                const aiMsgIndex = prev.findIndex(msg => msg.id === aiMessageId);
                const stepMessages = prev.filter(msg => 
                  msg.data?.isStep && msg.data?.taskId === aiMessageId
                ).map(msg => ({
                  ...msg,
                  content: msg.content.replace(/^正在/, '已完成'),
                  data: {
                    ...msg.data,
                    step: msg.data?.step ? {
                      ...msg.data.step,
                      isCompleted: true,
                      content: msg.data.step.content.replace(/^正在/, '已完成')
                    } : msg.data?.step
                  }
                }));
                const otherMessages = prev.filter(msg => 
                  msg.id !== aiMessageId && 
                  !(msg.data?.isStep && msg.data?.taskId === aiMessageId) &&
                  !msg.data?.isLoading
                );
                
                if (aiMsgIndex !== -1) {
                  const completedAiMsg = {
                    ...prev[aiMsgIndex],
                    isComplete: true, 
                    isStreaming: false,
                    steps: currentExecutionSteps.map(step => ({
                      ...step,
                      isCompleted: true,
                      content: step.isCompleted ? step.content : step.content.replace(/^正在/, '已完成')
                    }))
                  };
                  
                  // 最终排序：其他消息 + 步骤消息 + 完成的AI消息
                  return [...otherMessages, ...stepMessages, completedAiMsg];
                }
                
                return prev;
              });
              
              setCurrentExecutionSteps([]);
              setCurrentTaskId(null);
              setIsStreaming(false);
              setIsRunning(false);
              
              // 清理连接引用
              if (eventSourceRef.current === eventSource) {
                eventSourceRef.current = null;
              }
              
              // 安全关闭连接
              try {
                eventSource.close();
              } catch (closeError) {
                console.error('关闭EventSource失败:', closeError);
              }
              
              // 通知右侧面板任务完成
              if ((window as any).updateWorkspacePanel) {
                (window as any).updateWorkspacePanel({
                  type: 'task_complete',
                  taskId: aiMessageId
                });
              }
              break;
              
            case 'error':
              // 处理错误
              console.error('流式响应错误:', chunk.error);
              setMessages(prev => prev.map(msg => 
                msg.id === aiMessageId 
                  ? { 
                      ...msg, 
                      content: msg.content + `\n\n❌ 发生错误: ${chunk.error}`,
                      isComplete: true, 
                      isStreaming: false,
                      steps: currentExecutionSteps,
                      data: { ...msg.data, isAssistantLoading: false } // 清除loading状态
                    }
                  : msg
              ));
              setCurrentExecutionSteps([]);
              setCurrentTaskId(null);
              setIsStreaming(false);
              setIsRunning(false);
              eventSource.close();
              break;
          }
        } catch (error) {
          console.error('解析流式消息失败:', error);
        }
      };

      // 处理连接错误
      eventSource.onerror = (error) => {
        console.error('EventSource连接错误:', error);
        
        // 检查是否还是当前连接
        if (eventSourceRef.current !== eventSource || isUnmountingRef.current) {
          console.log('连接已更换或组件已卸载，忽略错误处理');
          return;
        }
        
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                content: msg.content + '\n\n❌ 连接中断，请检查网络或服务状态',
                isComplete: true, 
                isStreaming: false,
                data: { ...msg.data, isAssistantLoading: false } // 清除loading状态
              }
            : msg
        ));
        setCurrentExecutionSteps([]);
        setCurrentTaskId(null);
        setIsStreaming(false);
        setIsRunning(false);
        
        // 清理连接引用
        if (eventSourceRef.current === eventSource) {
          eventSourceRef.current = null;
        }
        
        // 安全关闭连接
        try {
          eventSource.close();
        } catch (closeError) {
          console.error('关闭EventSource失败:', closeError);
        }
      };

    } catch (error) {
      console.error('启动流式对话失败:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { 
              ...msg, 
              content: `❌ 启动对话失败: ${error}`,
              isComplete: true, 
              isStreaming: false,
              data: { ...msg.data, isAssistantLoading: false } // 清除loading状态
            }
          : msg
      ));
      setCurrentExecutionSteps([]);
      setCurrentTaskId(null);
      setIsStreaming(false);
      setIsRunning(false);
    }
  };



  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStepClick = (step: ExecutionStep, messageId: string) => {
    console.log('点击执行步骤:', step);
    setSelectedStep(step);
    
    // 根据resourceType使用配置映射确定跳转的tab类型
    const resourceConfig = getResourceTypeConfig(step.resourceType as ResourceType || 'general');
    const tabType = resourceConfig.tabType;
    
    // 通知右侧面板显示步骤详情并跳转到对应tab
    if (onNodeClick) {
      onNodeClick(messageId, tabType);
    }
    
    // 也可以通过全局事件通知
    if ((window as any).updateWorkspacePanel) {
      (window as any).updateWorkspacePanel({
        type: 'step_details',
        step: step,
        messageId: messageId,
        tabType: tabType,
        results: step.results || []
      });
    }
  };

  const handleStepMessageClick = (message: TaskMessage) => {
    if (message.data?.isStep && message.data?.step) {
      handleStepClick(message.data.step, message.id);
    }
  };

  // 处理任务点击
  const handleTaskClick = (message: TaskMessage) => {
    if (message.type === 'task' && onNodeClick) {
      // 根据任务内容确定跳转的tab类型
      let tabType = 'info'; // 默认
      
      if (message.content.includes('网页') || message.content.includes('搜索') || message.content.includes('浏览')) {
        tabType = 'browser';
      } else if (message.content.includes('数据') || message.content.includes('分析')) {
        tabType = 'database';
      } else if (message.content.includes('API') || message.content.includes('接口')) {
        tabType = 'apis';
      }
      
      // 调用父组件的 onNodeClick 来跳转到对应tab
      onNodeClick(message.id, tabType);
    }
  };



  const getMessageIcon = (message: TaskMessage) => {
    if (message.data?.isLoading) {
      return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
    }
    
    // 新增：助手loading状态的特殊图标
    if (message.data?.isAssistantLoading) {
      return <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />;
    }
    
    switch (message.type) {
      case 'user':
        return <User className="w-5 h-5 text-blue-600" />;
      case 'system':
        return <Bot className="w-5 h-5 text-green-600" />;
      case 'task':
        return getTaskStatusIcon(message.status);
      case 'result':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'assistant':
        return <Bot className="w-5 h-5 text-purple-600" />;
      default:
        return <Bot className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTaskStatusIcon = (status?: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'running':
        return <Play className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getMessageBgColor = (message: TaskMessage) => {
    // 如果是loading消息，使用特殊样式
    if (message.data?.isLoading) {
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
    
    // 新增：助手loading状态的特殊样式
    if (message.data?.isAssistantLoading) {
      return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 animate-pulse';
    }
    
    // 如果是步骤消息，根据类别设置不同颜色
    if (message.data?.isStep) {
      const category = message.data.category;
      switch (category) {
        case 'analysis':
          return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
        case 'strategy':
          return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
        case 'error':
          return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
        default:
          return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      }
    }
    
    switch (message.type) {
      case 'user':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'system':
        // 普通系统消息 - 绿色背景
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'task':
        // 任务 - 红色背景
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'result':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'assistant':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">



      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-elegant">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {getMessageIcon(message)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div 
                className={`p-3 rounded-lg border ${getMessageBgColor(message)} ${
                  message.type === 'task' || message.data?.isStep ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
                }`}
                onClick={() => {
                  if (message.type === 'task') {
                    handleTaskClick(message);
                  } else if (message.data?.isStep) {
                    handleStepMessageClick(message);
                  }
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      {message.data?.isLoading ? '系统' :
                       message.data?.isAssistantLoading ? '助手' :
                       message.data?.isStep ? '执行步骤' :
                       message.type === 'user' ? '用户' : 
                       message.type === 'system' ? '系统' :
                       message.type === 'task' ? '任务' : 
                       message.type === 'assistant' ? '助手' : '结果'}
                    </span>
                    {message.data?.isLoading && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded animate-pulse">
                        正在处理
                      </span>
                    )}
                    {message.data?.isAssistantLoading && (
                      <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded animate-pulse flex items-center space-x-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>思考中</span>
                      </span>
                    )}
                    {message.data?.isStep && (
                      <>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                          {message.data.step?.stepNumber}/{message.data.step?.totalSteps}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${getStepCategoryClasses(message.data.category as StepCategory || 'general')}`}>
                          {getStepCategoryConfig(message.data.category as StepCategory || 'general').label}
                        </span>
                        {message.data.step?.resourceType && (
                          <span className={`text-xs px-2 py-1 rounded ${getResourceTypeClasses(message.data.step.resourceType as ResourceType)}`}>
                            {getResourceTypeConfig(message.data.step.resourceType as ResourceType).label}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap flex-1">
                    {message.data?.isAssistantLoading ? (
                      <span className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="animate-pulse">正在分析您的问题...</span>
                      </span>
                    ) : (
                      message.content
                    )}
                  </p>
                  
                  {/* 步骤消息右侧显示loading或完成状态 */}
                  {message.data?.isStep && (
                    <div className="flex-shrink-0 ml-3">
                      {message.data?.step?.isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      )}
                    </div>
                  )}
                </div>
                
                {/* 只有步骤完成后才显示查看详情提示 */}
                {message.data?.isStep && message.data?.step?.isCompleted && (
                  <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 flex items-center">
                    <Play className="w-3 h-3 mr-1" />
                    点击查看执行详情 →
                  </div>
                )}
                
                {/* 原有的执行步骤显示逻辑保持不变，但只对非步骤消息生效 */}
                {!message.data?.isStep && message.steps && message.steps.length > 0 && (
                  <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded border">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                      <Play className="w-3 h-3 mr-1" />
                      执行步骤
                    </div>
                    <div className="space-y-2">
                      {message.steps.map((step, index) => (
                        <div
                          key={step.id}
                          className={`p-2 rounded text-sm transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 ${
                            selectedStep?.id === step.id 
                              ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700' 
                              : 'bg-gray-50 dark:bg-slate-700'
                          }`}
                          onClick={() => handleStepClick(step, message.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                步骤 {step.stepNumber}/{step.totalSteps}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${getStepCategoryClasses(step.category as StepCategory || 'general')}`}>
                                {getStepCategoryConfig(step.category as StepCategory || 'general').label}
                              </span>
                              {step.resourceType && (
                                <span className={`text-xs px-2 py-1 rounded ${getResourceTypeClasses(step.resourceType as ResourceType)}`}>
                                  {getResourceTypeConfig(step.resourceType as ResourceType).label}
                                </span>
                              )}
                              {/* 显示步骤完成状态 */}
                              {step.isCompleted && (
                                <CheckCircle className="w-3 h-3 text-green-600" />
                              )}
                            </div>
                            <span className="text-xs text-gray-400">
                              {formatTime(step.timestamp)}
                            </span>
                          </div>
                          <div className="mt-1 text-gray-700 dark:text-gray-300">
                            {step.content}
                          </div>
                          {/* 所有步骤都显示查看详情链接，不管是否完成 */}
                          <div className="mt-1 text-xs text-blue-600 dark:text-blue-400 flex items-center">
                            <Play className="w-3 h-3 mr-1" />
                            点击查看详细信息 →
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {message.data && !message.data.isStep && (
                  <div className="mt-3 p-2 bg-white dark:bg-slate-800 rounded border">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                      执行结果
                    </div>
                    {message.data.results && (
                      <ul className="space-y-1">
                        {message.data.results.map((result: string, index: number) => (
                          <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                            • {result}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      {workflowId && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800">
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入任务指令..."
                rows={2}
                disabled={isRunning || isStreaming}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed scrollbar-thin"
              />
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isRunning || isStreaming}
              className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex-shrink-0"
              title="发送指令"
            >
              {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          
        </div>
        
      )}
    </div>
  );
});

export default WorkflowCanvas; 