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
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import ChatMessageItem, { ExecutionStep as InlineStep } from './ChatMessageItem';
import SuggestionOptions from './SuggestionOptions';
import { useStreamingChat, type TaskMessage, type ExecutionStep } from '../../hooks/useStreamingChat';


// 建议选项接口
interface SuggestionOption {
  id: string;
  text: string;
  description?: string;
  category: 'followup' | 'analysis' | 'action' | 'question';
  content: string; // 点击后要发送的实际内容
}

// 合并历史中的分段助手消息（message_id 形如 `${aiId}_content_xxx`）
function mergeStreamingAssistantRawMessages(rawMessages: any[]): any[] {
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) return rawMessages || [];
  // 先按时间排序，保证合并顺序正确
  const sorted = [...rawMessages].sort((a, b) => {
    const at = new Date(a.created_at || a.timestamp || 0).getTime();
    const bt = new Date(b.created_at || b.timestamp || 0).getTime();
    return at - bt;
  });

  const contentGroups = new Map<string, { parts: string[]; sample: any; lastTime: string }>();
  const others: any[] = [];

  for (const msg of sorted) {
    const mid: string = msg.message_id || msg.id || '';
    const isAssistant = (msg.message_type || msg.type) === 'assistant';
    const m = typeof mid === 'string' ? mid.match(/^(.+)_content_/i) : null;
    if (isAssistant && m) {
      const base = m[1];
      const g = contentGroups.get(base) || { parts: [] as string[], sample: msg, lastTime: (msg.created_at || msg.timestamp) as string };
      if (msg.content && typeof msg.content === 'string') g.parts.push(msg.content);
      g.lastTime = msg.created_at || msg.timestamp || g.lastTime;
      contentGroups.set(base, g);
    } else {
      others.push(msg);
    }
  }

  // 移除原有的 base 结尾消息（如“分析完成”），用合并后的替换
  const cleaned = others.filter(m => {
    const mid: string = m.message_id || m.id || '';
    return !contentGroups.has(mid); // 若为base本体，则丢弃，稍后用合并内容替换
  });

  for (const [base, g] of contentGroups.entries()) {
    const merged = {
      ...(g.sample || {}),
      message_id: base,
      message_type: 'assistant',
      content: g.parts.join('\n\n'),
      status: 'completed',
      timestamp: g.lastTime || (g.sample ? g.sample.timestamp : undefined),
      created_at: g.lastTime || (g.sample ? g.sample.created_at : undefined),
      data: {
        ...(g.sample?.data || {}),
        type: 'content'
      }
    };
    cleaned.push(merged);
  }

  return cleaned;
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
  const [currentExecutionSteps, setCurrentExecutionSteps] = useState<ExecutionStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<ExecutionStep | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionOption[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 辅助函数：排序步骤
  const sortSteps = (steps: ExecutionStep[]) => {
    return [...steps].sort((a, b) => {
      const byNo = (a.stepNumber || 0) - (b.stepNumber || 0);
      if (byNo !== 0) return byNo;
      const at = a.timestamp ? a.timestamp.getTime() : 0;
      const bt = b.timestamp ? b.timestamp.getTime() : 0;
      return at - bt;
    });
  };
  const streamingChat = useStreamingChat({
    workflowId,
    onMessagesUpdate: setMessages,
    onStepsUpdate: setCurrentExecutionSteps,
    onSuggestionsUpdate: setSuggestions
  });

  // 调试：监听建议选项变化
  useEffect(() => {
    console.log('建议选项更新:', suggestions);
  }, [suggestions]);



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
              data: {
                ...(msg.data || {}),
                // 归一：后端若提供 stepId，则作为关联ID参与排序
                relatedStepId: (msg.data && (msg.data.relatedStepId || msg.data.stepId)) || undefined,
                // 归一：支持后端提供的顺序号
                sequence: (msg.data && msg.data.sequence) || (typeof (msg as any).sequence === 'number' ? (msg as any).sequence : undefined)
              }
            }))
          : [];
        // 合并历史中的分段助手消息（不再在前端排序，保持后端顺序）
        const mergedMessages = mergeStreamingAssistantRawMessages(restoredMessages) as any[];
        // 直接使用后端顺序（后端已按 sequence,timestamp 排序）
        const sortedMessages = mergedMessages;
           
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
        
        setMessages(sortedMessages);
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
            data: {
              ...(msg.data || {}),
              relatedStepId: (msg.data && (msg.data.relatedStepId || msg.data.stepId)) || undefined,
              sequence: (msg.data && msg.data.sequence) || (typeof (msg as any).sequence === 'number' ? (msg as any).sequence : undefined)
            }
          }));
          
          // 合并历史中的分段助手消息
          const mergedMessages = mergeStreamingAssistantRawMessages(historicalMessages) as any[];
          setMessages(mergedMessages as unknown as TaskMessage[]);
          console.log('加载历史消息成功:', historicalMessages.length, '条消息');
        }
        
      } catch (error) {
        console.error('加载工作流历史失败:', error);
      }
    };
    
    loadWorkflowHistory();
  }, [workflowId]);

  // 优化：基于历史AI回答动态生成建议选项
  useEffect(() => {
    const generateSuggestionsFromHistory = async () => {
      // 只在有workflowId且没有正在进行的对话时加载建议
      if (!workflowId || streamingChat.state.isStreaming || suggestions.length > 0) {
        console.log('跳过历史建议生成:', { workflowId, isStreaming: streamingChat.state.isStreaming, suggestionsCount: suggestions.length });
        return;
      }
      
      // 查找最近一次AI回答
      const latestAIMessage = messages
        .filter(msg => msg.type === 'assistant' && 
                      msg.content && 
                      msg.content !== '正在思考中...' && 
                      msg.content !== '正在分析处理中...' &&
                      msg.content.length > 50)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
      
      if (latestAIMessage) {
        console.log('发现历史AI回答，基于此生成建议:', latestAIMessage.content.substring(0, 100) + '...');
        
        try {
          // 基于历史AI回答生成建议
          const response = await pythonApiClient.generateSuggestions({
            aiContent: latestAIMessage.content,
            userMessage: '', // 历史回答不需要用户消息上下文
            context: {
              workflowId: workflowId,
              messageId: latestAIMessage.id,
              timestamp: new Date().toISOString(),
              isHistoryBased: true // 标记为基于历史的建议
            }
          });
          
          if (response && response.success && response.data.suggestions) {
            setSuggestions(response.data.suggestions);
            console.log('基于历史AI回答生成建议成功:', response.data.suggestions.length, '个建议');
          } else {
            console.warn('基于历史AI回答生成建议失败，尝试加载默认建议');
            // 如果基于历史的建议生成失败，再尝试加载默认建议
            await loadDefaultSuggestions();
          }
        } catch (error) {
          console.error('基于历史AI回答生成建议出错:', error);
          // 出错时尝试加载默认建议
          await loadDefaultSuggestions();
        }
      } else {
        console.log('没有找到合适的历史AI回答，加载默认建议');
        // 没有历史AI回答时，加载默认建议
        await loadDefaultSuggestions();
      }
    };
    
    // 延迟执行，确保消息加载完成
    const timer = setTimeout(() => {
      generateSuggestionsFromHistory();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [workflowId, messages.length, streamingChat.state.isStreaming]);
  
  // 加载默认建议的辅助函数
  const loadDefaultSuggestions = async () => {
    try {
      console.log('开始加载默认金融问题建议...');
      const defaultResponse = await pythonApiClient.getDefaultSuggestions();
      
      console.log('默认建议 API 响应:', defaultResponse);
      
      if (defaultResponse.success && defaultResponse.data.suggestions) {
        // 再次检查状态，确保在异步调用期间状态没有变化
        if (!streamingChat.state.isStreaming && suggestions.length === 0) {
          setSuggestions(defaultResponse.data.suggestions);
          console.log('加载默认建议成功:', defaultResponse.data.suggestions.length, '个问题');
        } else {
          console.log('异步调用期间状态已变化，取消设置默认建议');
        }
      } else {
        console.warn('默认建议 API 返回空或错误:', defaultResponse);
      }
    } catch (error) {
      console.warn('加载默认建议失败:', error);
    }
  };

  // 初始化对话消息
  useEffect(() => {
    setCurrentExecutionSteps([]);
    setSelectedStep(null);
    
    // 重要：切换工作流时清空建议选项
    setSuggestions([]);
    
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

  // 暴露全局追加日志函数（仅作用于当前 workflowId）
  useEffect(() => {
    (window as any).appendWorkflowLog = (payload: { workflowId?: string | null; content: string }) => {
      try {
        const { workflowId: wid, content } = payload || ({} as any);
        if (!content) return;
        if (!wid || wid === workflowId) {
          const logMsg: TaskMessage = {
            id: `log-${Date.now()}`,
            type: 'system',
            content: content,
            timestamp: new Date(),
            data: { isStep: false }
          };
          setMessages(prev => [...prev, logMsg]);
        }
      } catch {}
    };
    return () => {
      if ((window as any).appendWorkflowLog) delete (window as any).appendWorkflowLog;
    };
  }, [workflowId]);



  useEffect(() => {
    scrollToBottom();
  }, [messages, currentExecutionSteps]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (messageContent?: string) => {
    const message = messageContent || inputMessage.trim();
    if (!message || !workflowId || streamingChat.state.isStreaming) return;

    // 清空建议
    setSuggestions([]);

    const userMessage: TaskMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    // 只有在没有传入messageContent时才清空输入框
    if (!messageContent) {
      setInputMessage('');
    }

    // 开始流式对话
    streamingChat.startStreamingChat(message);
  };

  // 组件卸载时清理连接
  useEffect(() => {
    return () => {
      streamingChat.cleanup();
    };
  }, [streamingChat.cleanup]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 处理建议选项点击
  const handleSuggestionClick = (suggestion: SuggestionOption) => {
    // 清空当前建议
    setSuggestions([]);
    
    // 直接发送消息，不填充到输入框
    handleSendMessage(suggestion.content);
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
      {/* 对话区域容器 - 使用相对定位作为建议选项的参考系 */}
      <div className="flex-1 relative overflow-hidden">
        {/* 消息列表（精简：Coze 风格） */}
        <div className="h-full overflow-y-auto p-4 space-y-4 scrollbar-elegant" style={{ paddingBottom: suggestions.length > 0 ? '180px' : '16px' }}>
          {messages.map((message) => (
            <ChatMessageItem
              key={message.id}
              message={{
                ...message,
                currentStep: message.currentStep as InlineStep | undefined,
                steps: message.steps as InlineStep[] | undefined,
              }}
              onStepClick={(step) => handleStepClick(step as any, message.id)}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 建议选项（相对于对话区域的绝对定位） */}
        {workflowId && suggestions.length > 0 && (
          <SuggestionOptions 
            suggestions={suggestions} 
            onSuggestionClick={handleSuggestionClick}
          />
        )}
      </div>

      {/* 输入区域：Coze 风格底栏 */}
      {workflowId && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="输入内容，按 Enter 发送"
              disabled={streamingChat.state.isRunning || streamingChat.state.isStreaming}
              className="flex-1 h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
            {(streamingChat.state.isStreaming || streamingChat.state.isRunning) ? (
              <button
                onClick={streamingChat.forceStopAllConnections}
                className="h-10 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                title="停止"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim()}
                className="h-10 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                title="发送"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default WorkflowCanvas; 