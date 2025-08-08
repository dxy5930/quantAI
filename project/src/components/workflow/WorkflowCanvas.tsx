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
  Loader2,
  X
} from 'lucide-react';
import { createStreamingChat } from '../../services/pythonApiClient';
import { pythonApiClient } from '../../services/pythonApiClient';
import { workflowResourceManager } from '../../services/workflowResourceManager';
import { workflowApi, type WorkflowState, getWorkflowHistory } from '../../services/workflowApi';
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
  executionDetails?: Record<string, any>; // 新增：执行详情
  urls?: string[]; // 新增：相关URL列表
  files?: string[]; // 新增：相关文件列表
}

interface StreamChunk {
  type: 'start' | 'content' | 'progress' | 'complete' | 'error' | 'task_info' | 'workflow_created' | 'workflow_updated' | 'resource_updated';
  content?: string;
  step?: number;
  totalSteps?: number;
  stepId?: string;
  category?: string;
  resourceType?: string; // 新增：资源类型
  results?: any[]; // 新增：步骤结果
  executionDetails?: Record<string, any>; // 新增：执行详情
  urls?: string[]; // 新增：URL列表
  files?: string[]; // 新增：文件列表
  error?: string;
  // 任务信息
  taskTitle?: string;
  taskDescription?: string;
  // 工作流事件
  workflow_id?: string;
  title?: string;
  description?: string;
}

interface WorkflowCanvasProps {
  workflowId: string | null;
  onNodeClick?: (nodeId: string, nodeType: string) => void;
  selectedNodeId?: string | null;
}

// 统一的步骤排序：按步骤号升序，其次按时间升序，保证展示稳定
const sortSteps = (steps: ExecutionStep[]) => {
  return [...steps].sort((a, b) => {
    const byNo = (a.stepNumber || 0) - (b.stepNumber || 0);
    if (byNo !== 0) return byNo;
    const at = a.timestamp ? a.timestamp.getTime() : 0;
    const bt = b.timestamp ? b.timestamp.getTime() : 0;
    return at - bt;
  });
};

// 历史/恢复消息的排序：优先按步骤号（若为步骤消息），否则按时间
const sortMessagesForHistory = (messages: TaskMessage[]) => {
  return [...messages].sort((a, b) => {
    const aStep = a.data?.isStep ? (a.data?.step?.stepNumber || 0) : null;
    const bStep = b.data?.isStep ? (b.data?.step?.stepNumber || 0) : null;
    if (aStep !== null && bStep !== null && aStep !== bStep) {
      return aStep - bStep;
    }
    const at = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const bt = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return at - bt;
  });
};

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
  const [isRestoring, setIsRestoring] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isUnmountingRef = useRef(false);
  const currentConnectionIdRef = useRef<string | null>(null);

  // 调试：显示当前workflowId
  React.useEffect(() => {
    console.log('WorkflowCanvas接收到的workflowId:', workflowId);
  }, [workflowId]);

  // 尝试恢复工作流状态
  const restoreWorkflowState = async (workflowId: string) => {
    try {
      setIsRestoring(true);
      const workflowState = await workflowApi.getWorkflowState(workflowId);
      
      if (workflowState) {
        console.log('恢复工作流状态:', workflowState);
        
        // 恢复消息
        const restoredMessages: TaskMessage[] = Array.isArray(workflowState.messages) 
          ? workflowState.messages.map(msg => ({
              id: msg.message_id,
              type: msg.message_type as TaskMessage['type'],
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              status: msg.status as any,
              data: msg.data
            }))
          : [];
        const sortedRestoredMessages = sortMessagesForHistory(restoredMessages);
        
        // 恢复步骤
        const restoredSteps: ExecutionStep[] = Array.isArray(workflowState.steps)
          ? workflowState.steps.map(step => ({
              id: step.step_id,
              content: step.content,
              stepNumber: step.step_number,
              totalSteps: workflowState.workflow.total_steps,
              category: step.category as ExecutionStep['category'],
              resourceType: step.resource_type as ExecutionStep['resourceType'],
              timestamp: new Date(step.created_at),
              isClickable: true,
              isCompleted: step.status === 'completed',
              results: step.results || [],
              executionDetails: step.execution_details || {},
              urls: step.urls || [],
              files: step.files || []
            }))
          : [];
        
        // 恢复后先排序，确保展示顺序稳定
        const sortedRestoredSteps = sortSteps(restoredSteps);
        
        // 恢复资源到资源管理器
        if (Array.isArray(workflowState.resources)) {
          workflowState.resources.forEach(resource => {
          // 将数据库资源转换为前端资源格式
          const frontendResource = {
            id: resource.id,
            type: resource.resource_type,
            title: resource.title,
            description: resource.description,
            timestamp: new Date(),
            data: resource.data,
            workflowId: workflowId
          };
          
                      // 直接添加到资源管理器（绕过addResourcesFromStep的重复检查）
            const currentResources = workflowResourceManager.getWorkflowResources(workflowId);
            const exists = currentResources.find(r => r.id === resource.id);
            if (!exists) {
              // 这里需要直接操作资源管理器的内部状态
              (workflowResourceManager as any).resources.set(workflowId, [...currentResources, frontendResource]);
            }
          });
        }
        
        setMessages(sortedRestoredMessages);
        setCurrentExecutionSteps(sortedRestoredSteps);
        
        // 恢复的工作流不应该立即设置为运行状态，因为没有活跃的流式连接
        // 用户需要手动输入新指令来继续工作流
        // if (workflowState.workflow.status === 'running') {
        //   setIsRunning(true);
        // }
        
        console.log('工作流状态恢复完成');
      } else {
        // 没有找到已保存的状态，显示欢迎消息
        const initialMessages: TaskMessage[] = [
          {
            id: 'welcome',
            type: 'system',
            content: '欢迎使用 FindValue AI 工作流！请输入您的任务需求，我将为您创建专属的工作流程。',
            timestamp: new Date()
          }
        ];
        setMessages(initialMessages);
      }
    } catch (error) {
      console.error('恢复工作流状态失败:', error);
      // 恢复失败，显示欢迎消息
      const initialMessages: TaskMessage[] = [
        {
          id: 'welcome',
          type: 'system',
          content: '欢迎使用 FindValue AI 工作流！请输入您的任务需求，我将为您创建专属的工作流程。',
          timestamp: new Date()
        }
      ];
      setMessages(initialMessages);
    } finally {
      setIsRestoring(false);
    }
  };

  // 加载工作流历史
  useEffect(() => {
    const loadWorkflowHistory = async () => {
      if (!workflowId) return;
      
      try {
        console.log('开始加载工作流历史:', workflowId);
        const historyData = await getWorkflowHistory(workflowId);
        
        if (historyData && historyData.steps && historyData.steps.length > 0) {
          // 将历史步骤转换为ExecutionStep格式
          const maxStepNo = Math.max(...historyData.steps.map((s: any) => Number(s.step_number || 0)), 0);
          const totalStepsFromWorkflow = Number(historyData.workflow.total_steps || 0);
          const totalStepsSafe = Math.max(totalStepsFromWorkflow, maxStepNo) || maxStepNo || 1;
          const historicalSteps: ExecutionStep[] = historyData.steps.map((step: any) => ({
            id: step.step_id,
            content: step.content,
            stepNumber: Number(step.step_number || 0) || 1,
            totalSteps: totalStepsSafe,
            category: step.category as ExecutionStep['category'],
            resourceType: step.resource_type as ExecutionStep['resourceType'],
            timestamp: new Date(step.created_at),
            isClickable: true,
            isCompleted: step.status === 'completed',
            results: Array.isArray(step.results) ? step.results : (step.results ? [step.results] : []),
            executionDetails: step.execution_details || {},
            urls: Array.isArray(step.urls) ? step.urls : (step.urls ? [step.urls] : []),
            files: Array.isArray(step.files) ? step.files : (step.files ? [step.files] : [])
          }));
          
          // 历史步骤按顺序展示
          setCurrentExecutionSteps(sortSteps(historicalSteps));
          console.log('加载历史步骤成功:', historicalSteps.length, '个步骤');
        }
        
        if (historyData && historyData.messages && historyData.messages.length > 0) {
          // 将历史消息转换为TaskMessage格式
          const historicalMessages: TaskMessage[] = historyData.messages.map((msg: any) => ({
            id: msg.message_id,
            type: msg.message_type as TaskMessage['type'],
            content: msg.content,
            timestamp: new Date(msg.created_at),
            isComplete: msg.status === 'completed',
            isStreaming: false,
            data: msg.data
          }));
          
          setMessages(sortMessagesForHistory(historicalMessages));
          console.log('加载历史消息成功:', historicalMessages.length, '条消息');
        }
        
      } catch (error) {
        console.error('加载工作流历史失败:', error);
      }
    };
    
    loadWorkflowHistory();
  }, [workflowId]);

  // 初始化对话消息
  useEffect(() => {
    // 重置所有状态（包括loading状态和组件卸载状态）
    isUnmountingRef.current = false;
    setIsStreaming(false);
    setIsRunning(false);
    setCurrentExecutionSteps([]);
    setCurrentTaskId(null);
    setSelectedStep(null);
    
    if (workflowId) {
      // 清理资源管理器中的旧数据
      workflowResourceManager.clearWorkflowResources(workflowId);
      
      // 尝试恢复工作流状态
      restoreWorkflowState(workflowId);
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

  // 组件挂载时重置卸载状态
  useEffect(() => {
    isUnmountingRef.current = false; // 重置卸载状态
    
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
    // 工作流切换时确保组件处于活跃状态
    isUnmountingRef.current = false;
    
    // 当workflowId变化时，立即断开之前的连接
    if (eventSourceRef.current) {
      console.log('工作流切换，立即关闭当前SSE连接:', eventSourceRef.current.readyState);
      try {
        eventSourceRef.current.close();
      } catch (error) {
        console.error('关闭SSE连接失败:', error);
      }
      eventSourceRef.current = null;
    }
    
    // 重置所有相关状态（不管是否有连接）
    setIsStreaming(false);
    setIsRunning(false);
    setCurrentExecutionSteps([]);
    setCurrentTaskId(null);
    currentConnectionIdRef.current = null;
    
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
        try {
          eventSourceRef.current.close();
        } catch (error) {
          console.error('清理连接失败:', error);
        }
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
    console.log('开始流式对话，message:', message);
    
    // 确保组件处于活跃状态（修复StrictMode下的双重卸载问题）
    isUnmountingRef.current = false;
    
    // 创建唯一的连接ID
    const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 首先强制关闭任何现有连接
    if (eventSourceRef.current) {
      console.log('关闭现有SSE连接');
      try {
        eventSourceRef.current.close();
      } catch (error) {
        console.error('关闭现有连接失败:', error);
      }
      eventSourceRef.current = null;
    }
    
    // 清理全局连接池
    try {
      if (pythonApiClient.getActiveConnectionCount() > 0) {
        console.log('清理全局连接池，当前连接数:', pythonApiClient.getActiveConnectionCount());
        pythonApiClient.closeAllConnections();
      }
    } catch (error) {
      console.error('清理全局连接池失败:', error);
    }
    
    setIsStreaming(true);
    setIsRunning(true);
    currentConnectionIdRef.current = connectionId;

    // 创建AI消息（不重复添加用户消息，因为在handleSendMessage中已经添加了）
    const aiMessageId = `ai-${Date.now()}`;
    const aiMessage: TaskMessage = {
      id: aiMessageId,
      type: 'assistant',
      content: '正在思考中...',
      timestamp: new Date(),
      isComplete: false,
      isStreaming: true,
      data: {
        isAssistantLoading: true // 标识助手正在loading
      }
    };

    setMessages(prev => [...prev, aiMessage]);

    try {
      // 强制关闭之前的连接和清理全局连接
      if (eventSourceRef.current) {
        console.log('强制关闭之前的连接');
        try {
          (eventSourceRef.current as EventSource).close();
        } catch (error) {
          console.error('关闭连接失败:', error);
        }
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
        context: { workflowId },
        workflowId: workflowId || undefined  // 传递工作流ID以支持立即落库
      });
      eventSourceRef.current = eventSource;

      // 处理流式消息
      eventSource.onmessage = (event) => {
        // 检查组件是否已卸载
        if (isUnmountingRef.current) {
          console.log('组件已卸载，忽略消息');
          return;
        }
        
        // 检查是否为当前活跃连接
        if (currentConnectionIdRef.current !== connectionId) {
          console.log('非当前活跃连接，忽略消息');
          return;
        }
        
        // 检查连接状态
        if (eventSource.readyState !== EventSource.OPEN) {
          console.log('连接已关闭，忽略消息');
          return;
        }
        
        try {
          const chunk: StreamChunk = JSON.parse(event.data);
          
                    switch (chunk.type) {
            case 'workflow_created':
              // 处理工作流创建确认
              console.log('工作流已创建并落库:', chunk);
              if ((window as any).updateSidebarTask && chunk.workflow_id) {
                (window as any).updateSidebarTask(
                  chunk.workflow_id, 
                  chunk.title || '新建工作流...', 
                  chunk.description || '正在生成工作流描述...'
                );
              }
              break;

            case 'workflow_updated':
              // 处理工作流更新确认
              console.log('工作流标题和描述已更新:', chunk);
              if ((window as any).updateSidebarTask && chunk.workflow_id) {
                (window as any).updateSidebarTask(
                  chunk.workflow_id, 
                  chunk.title, 
                  chunk.description
                );
              }
              break;

            case 'start':
              console.log('开始接收流式响应');
              setCurrentExecutionSteps([]);
              setCurrentTaskId(aiMessageId);

              // 立即清除AI消息的loading状态
              setMessages(prev => prev.map(msg => 
                msg.id === aiMessageId 
                  ? { 
                      ...msg, 
                      content: '正在分析处理中...', // 更新为实际的处理状态
                      data: { ...msg.data, isAssistantLoading: false } // 清除loading状态
                    }
                  : msg
              ));

              // 通知右侧面板任务开始，拉起面板
              if ((window as any).updateWorkspacePanel) {
                (window as any).updateWorkspacePanel({
                  type: 'task_start',
                  taskId: aiMessageId,
                  messageId: aiMessageId
                });
              }

              console.log('任务开始，已清除loading状态');
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
                  executionDetails: chunk.executionDetails || {},
                  urls: chunk.urls || [],
                  files: chunk.files || [],
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
                  const merged = existing
                    ? updatedSteps.map(s => (s.id === newStep.id ? newStep : s))
                    : [...updatedSteps, newStep];
                  // 统一排序，避免乱序
                  return sortSteps(merged);
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
                
                // 添加资源到资源管理器
                if (workflowId) {
                  workflowResourceManager.addResourcesFromStep(
                    workflowId,
                    newStep.id,
                    {
                      content: newStep.content,
                      category: newStep.category,
                      resourceType: newStep.resourceType,
                      results: newStep.results,
                      executionDetails: newStep.executionDetails,
                      urls: newStep.urls,
                      files: newStep.files
                    }
                  );
                  
                  // 【新增】立即触发右侧资源列表刷新
                  if ((window as any).workflowResourceRefresh) {
                    (window as any).workflowResourceRefresh();
                  }
                }

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
                
                
                
                // 通知右侧面板显示当前步骤，如果是第一个步骤则拉起面板
                if ((window as any).updateWorkspacePanel) {
                  (window as any).updateWorkspacePanel({
                    type: 'current_step',
                    step: newStep,
                    taskId: aiMessageId,
                    isFirstStep: newStep.stepNumber === 1, // 标识是否为第一个步骤
                    resourceType: newStep.resourceType,
                    results: newStep.results,
                    executionDetails: newStep.executionDetails,
                    urls: newStep.urls,
                    files: newStep.files
                  });
                }
              }
              break;
              
            case 'content':
              // 更新AI消息内容，确保AI消息在步骤消息之后
              if (chunk.content) {
                setMessages(prev => {
                  // 先去重（基于id）避免重复 key 警告
                  const deduped = Array.from(new Map(prev.map(m => [m.id, m])).values());
                  // 找到AI消息和相关的步骤消息
                  const aiMsgIndex = deduped.findIndex(msg => msg.id === aiMessageId);
                  const stepMessages = deduped
                    .filter(msg => msg.data?.isStep && msg.data?.taskId === aiMessageId)
                    .sort((a, b) => {
                      const as = a.data?.step?.stepNumber || 0;
                      const bs = b.data?.step?.stepNumber || 0;
                      return as - bs;
                    });
                  const otherMessages = deduped.filter(msg => 
                    msg.id !== aiMessageId && 
                    !(msg.data?.isStep && msg.data?.taskId === aiMessageId)
                  );
                  
                  if (aiMsgIndex !== -1) {
                    const currentAiMsg = deduped[aiMsgIndex];
                    // 如果当前内容是loading文本，则替换；否则追加
                    const isLoadingText = currentAiMsg.content === '正在思考中...' || currentAiMsg.content === '正在分析处理中...';
                    const newContent = isLoadingText ? (chunk.content || '') : currentAiMsg.content + (chunk.content || '');
                    
                    const updatedAiMsg = {
                      ...currentAiMsg,
                      content: newContent,
                      steps: sortSteps(currentExecutionSteps),
                      currentStep: sortSteps(currentExecutionSteps)[sortSteps(currentExecutionSteps).length - 1],
                      data: { 
                        ...currentAiMsg.data, 
                        isAssistantLoading: false // 收到内容时清除loading状态
                      }
                    };
                    
                    // 重新排序：其他消息 + 步骤消息 + AI消息
                    return [...otherMessages, ...stepMessages, updatedAiMsg];
                  }
                  
                  return deduped;
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
                // 先去重（基于id）避免重复 key 警告
                const deduped = Array.from(new Map(prev.map(m => [m.id, m])).values());
                const aiMsgIndex = deduped.findIndex(msg => msg.id === aiMessageId);
                const stepMessages: TaskMessage[] = [];
                const otherMessages = deduped.filter(msg => 
                  msg.id !== aiMessageId && 
                  !(msg.data?.isStep && msg.data?.taskId === aiMessageId) &&
                  !msg.data?.isLoading
                );
                
                if (aiMsgIndex !== -1) {
                  const sortedStepsFinal = sortSteps(currentExecutionSteps);
                  // 汇总所有步骤的 results 展示到最终 AI 消息
                  const allStepResults: any[] = sortedStepsFinal
                    .map(s => (Array.isArray(s.results) ? s.results : (s.results ? [s.results] : [])))
                    .flat();
                  const prevAi = deduped[aiMsgIndex];
                  const completedAiMsg = {
                    ...prevAi,
                    isComplete: true, 
                    isStreaming: false,
                    steps: sortedStepsFinal.map(step => ({
                      ...step,
                      isCompleted: true,
                      content: step.isCompleted ? step.content : step.content.replace(/^正在/, '已完成')
                    })),
                    data: {
                      ...(prevAi.data || {}),
                      results: allStepResults
                    }
                  } as TaskMessage;
                  
                  // 最终排序：其他消息 +（可选）步骤消息 + 完成的AI消息
                  return [...otherMessages, ...stepMessages, completedAiMsg];
                }
                
                return deduped;
              });
              
              setCurrentExecutionSteps([]);
              setCurrentTaskId(null);
              setIsStreaming(false);
              setIsRunning(false);
              
              // 任务完成后，生成更精准的工作流标题和描述
              if (workflowId && (window as any).updateSidebarTask) {
                // 延迟执行，确保messages状态已更新
                setTimeout(() => {
                  setMessages(currentMessages => {
                    const aiMsg = currentMessages.find(msg => msg.id === aiMessageId);
                    if (aiMsg && aiMsg.content) {
                      // 基于AI回复内容生成精准的标题和描述
                      const { title, description } = generateFinalWorkflowTitle(message, aiMsg.content);
                      
                      console.log('任务完成，更新最终标题:', title, description);
                      (window as any).updateSidebarTask(workflowId, title, description);
                    }
                    return currentMessages;
                  });
                }, 100);
              }
              
              // 安全关闭连接
              try {
                eventSource.close();
              } catch (closeError) {
                console.error('关闭EventSource失败:', closeError);
              }
              
              // 清理连接引用
              if (eventSourceRef.current === eventSource) {
                eventSourceRef.current = null;
              }
              
              // 清理连接ID
              if (currentConnectionIdRef.current === connectionId) {
                currentConnectionIdRef.current = null;
              }
              
              // 通知右侧面板任务完成
              if ((window as any).updateWorkspacePanel) {
                (window as any).updateWorkspacePanel({
                  type: 'task_complete',
                  taskId: aiMessageId
                });
              }
              break;
              
            // 【新增】监听资源更新事件
            case 'resource_updated':
              console.log('收到资源更新事件:', chunk);
              // 直接触发ResourcesTab刷新
              if ((window as any).workflowResourceRefresh) {
                (window as any).workflowResourceRefresh();
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
              
              // 安全关闭连接
              try {
                eventSource.close();
              } catch (closeError) {
                console.error('关闭EventSource失败:', closeError);
              }
              
              // 清理连接引用
              if (eventSourceRef.current === eventSource) {
                eventSourceRef.current = null;
              }
              
              // 清理连接ID
              if (currentConnectionIdRef.current === connectionId) {
                currentConnectionIdRef.current = null;
              }
              break;
          }
        } catch (error) {
          console.error('解析流式消息失败:', error);
        }
      };

      // 处理连接错误
      eventSource.onerror = (error) => {
        console.error('EventSource连接错误:', error);
        console.log('EventSource连接状态:', eventSource.readyState);
        
        // 检查组件是否已卸载
        if (isUnmountingRef.current) {
          console.log('组件已卸载，忽略错误处理');
          return;
        }
        
        // 检查是否为当前活跃连接
        if (currentConnectionIdRef.current !== connectionId) {
          console.log('非当前活跃连接，忽略错误处理');
          return;
        }
        
        // 检查连接是否已经关闭
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('连接已关闭，忽略错误处理');
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
        
        // 安全关闭连接
        try {
          eventSource.close();
        } catch (closeError) {
          console.error('关闭EventSource失败:', closeError);
        }
        
        // 清理连接引用
        if (eventSourceRef.current === eventSource) {
          eventSourceRef.current = null;
        }
        
        // 清理连接ID
        if (currentConnectionIdRef.current === connectionId) {
          currentConnectionIdRef.current = null;
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
      
      // 清理连接ID
      if (currentConnectionIdRef.current === connectionId) {
        currentConnectionIdRef.current = null;
      }
    }
  };



  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 生成最终工作流标题的函数
  const generateFinalWorkflowTitle = (userMessage: string, aiContent: string) => {
    // 提取关键词来生成更精准的标题
    const userMsgLower = userMessage.toLowerCase();
    const aiContentLower = aiContent.toLowerCase();
    
    // 检查是否包含股票代码
    const stockPattern = /[0-9]{6}|[A-Z]{2,5}/g;
    const stocks = userMessage.match(stockPattern) || [];
    
    // 检查行业板块
    const sectors = [];
    const sectorKeywords = {
      '科技股': ['科技', '技术', '互联网', '软件', '芯片', 'AI', '人工智能'],
      '医药股': ['医药', '医疗', '生物', '制药', '健康'],
      '金融股': ['银行', '保险', '证券', '金融', '券商'],
      '新能源': ['新能源', '电动车', '光伏', '风电', '锂电池'],
      '消费股': ['消费', '零售', '食品', '饮料', '白酒', '家电']
    };
    
    for (const [sector, keywords] of Object.entries(sectorKeywords)) {
      if (keywords.some(kw => userMsgLower.includes(kw))) {
        sectors.push(sector);
        break; // 只取第一个匹配的板块
      }
    }
    
    // 检查分析类型
    let analysisType = '';
    if (userMsgLower.includes('分析') || userMsgLower.includes('研究')) {
      analysisType = '分析';
    } else if (userMsgLower.includes('推荐') || userMsgLower.includes('选择')) {
      analysisType = '推荐';
    } else if (userMsgLower.includes('策略') || userMsgLower.includes('投资')) {
      analysisType = '策略';
    } else if (userMsgLower.includes('风险') || userMsgLower.includes('评估')) {
      analysisType = '风险评估';
    } else {
      analysisType = '咨询';
    }
    
    // 生成标题
    let title = '';
    if (stocks.length > 0) {
      title = `${stocks[0]}${analysisType}`;
    } else if (sectors.length > 0) {
      title = `${sectors[0]}${analysisType}`;
    } else {
      title = `智能投资${analysisType}`;
    }
    
    // 生成描述（基于用户原始问题，但更简洁）
    let description = userMessage.trim();
    if (description.length > 40) {
      description = description.substring(0, 37) + '...';
    }
    
    // 如果AI回复中包含具体建议，更新描述
    if (aiContentLower.includes('建议') && aiContentLower.includes('推荐')) {
      description = '已生成投资建议和分析报告';
    } else if (aiContentLower.includes('分析') && aiContentLower.includes('数据')) {
      description = '已完成数据分析和市场研究';
    } else if (aiContentLower.includes('风险') && aiContentLower.includes('评估')) {
      description = '已完成风险评估分析';
    }
    
    return { title, description };
  };

  // 强制停止所有连接
  const forceStopAllConnections = () => {
    console.log('用户手动强制停止所有连接');
    
    // 停止当前连接
    if (eventSourceRef.current) {
      console.log('强制关闭当前SSE连接');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    // 清理全局连接池
    try {
      pythonApiClient.closeAllConnections();
      console.log('已清理全部连接');
    } catch (error) {
      console.error('清理连接失败:', error);
    }
    
    // 重置所有状态
    setIsStreaming(false);
    setIsRunning(false);
    setCurrentExecutionSteps([]);
    setCurrentTaskId(null);
    
    // 清除所有消息中的loading状态
    setMessages(prev => prev.map(msg => ({
      ...msg,
      data: {
        ...msg.data,
        isLoading: false,
        isAssistantLoading: false
      },
      isStreaming: false
    })));
    
    // 显示停止消息
    setMessages(prev => [...prev, {
      id: `stop-${Date.now()}`,
      type: 'system',
      content: '⏹️ 所有连接已手动停止',
      timestamp: new Date()
    }]);
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
        results: step.results || [],
        executionDetails: step.executionDetails || {},
        urls: step.urls || [],
        files: step.files || [],
        resourceType: step.resourceType
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

  // 如果正在恢复状态，显示加载界面
  if (isRestoring) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-slate-900">
        <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-lg">正在恢复工作流状态...</span>
        </div>
      </div>
    );
  }

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
                {/* {message.data?.isStep && message.data?.step?.isCompleted && (
                  <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 flex items-center">
                    <Play className="w-3 h-3 mr-1" />
                    点击查看执行详情 →
                  </div>
                )} */}
                
                {/* 步骤列表渲染已移除（聊天中不再展示执行步骤） */}
                
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
            
            {/* 强制停止按钮 */}
            {(isStreaming || isRunning) && (
              <button
                onClick={forceStopAllConnections}
                className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex-shrink-0"
                title="强制停止所有连接"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
        </div>
        
      )}
    </div>
  );
});

export default WorkflowCanvas; 