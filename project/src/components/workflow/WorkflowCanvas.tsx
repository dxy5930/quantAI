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
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import ChatMessageItem, { ExecutionStep as InlineStep } from './ChatMessageItem';


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
    relatedStepId?: string; // 新增：关联的步骤ID
    progressLines?: string[]; // 新增：进度行
  };
  isComplete?: boolean;
  isStreaming?: boolean;
  steps?: ExecutionStep[];
  currentStep?: ExecutionStep;
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
  status?: 'running' | 'completed' | 'thinking'; // 新增：步骤状态
  error?: string;
  // 任务信息
  taskTitle?: string;
  taskDescription?: string;
  // 工作流事件
  workflow_id?: string;
  title?: string;
  description?: string;
  // 新增：来自后端SSE的扩展字段
  trigger?: string;
  messageId?: string;
  workflowId?: string;
  stepNumber?: number;
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

  // 辅助：从URL生成简短标题
  const formatUrlTitle = (url: string) => {
    try {
      const u = new URL(url);
      return `${u.hostname}${u.pathname}`;
    } catch {
      return url;
    }
  };

  // 辅助：从文件路径提取文件名
  const getFilename = (path: string) => {
    const parts = path.split('/');
    return parts[parts.length - 1] || path;
  };

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
        
        setMessages(mergedMessages as unknown as TaskMessage[]);
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
        isAssistantLoading: true, // 标识助手正在loading
        progressLines: [
          `正在思考：${generateCompactTitleFromFirstSentence(message)}`
        ]
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
                const title = generateCompactTitleFromFirstSentence(message);
                // 只在首次设置
                ensureSidebarTitle(chunk.workflow_id, title);
              }
              break;

            case 'workflow_updated':
              // 处理工作流更新确认
              console.log('工作流标题和描述已更新:', chunk);
              if ((window as any).updateSidebarTask && chunk.workflow_id) {
                const title = generateCompactTitleFromFirstSentence(message);
                // 只在首次设置
                ensureSidebarTitle(chunk.workflow_id, title);
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
                      data: { 
                        ...msg.data, 
                        isAssistantLoading: false,
                        progressLines: Array.isArray((msg.data as any)?.progressLines) 
                          ? (msg.data as any).progressLines 
                          : [`正在思考：${generateCompactTitleFromFirstSentence(message)}`]
                      } // 清除loading状态并确保进度行存在
                    }
                  : msg
              ));

              // 基于用户原始问题，先生成一个更贴近的临时标题/简介，避免通用标题
              try {
                if (workflowId && typeof message === 'string') {
                  const title = generateCompactTitleFromFirstSentence(message);
                  // 只在首次设置
                  ensureSidebarTitle(workflowId, title);
                }
              } catch (e) {
                console.warn('预更新任务标题失败:', e);
              }

              // 通知右侧面板任务开始，拉起面板
              if ((window as any).updateWorkspacePanel) {
                (window as any).updateWorkspacePanel({
                  type: 'task_start',
                  taskId: aiMessageId,
                  messageId: aiMessageId
                });
              }

              // 新增：在对话中加入“开始思考”提示
              // setMessages(prev => [
              //   ...prev,
              //   {
              //     id: `thinking-start-${Date.now()}`,
              //     type: 'system',
              //     content: '开始思考',
              //     timestamp: new Date(),
              //     data: { isStep: false }
              //   }
              // ]);

              console.log('任务开始，已清除loading状态');
              break;
              
            case 'task_info':
              // 处理任务信息，更新左侧任务列表
              console.log('接收到任务信息:', chunk.taskTitle, chunk.taskDescription);
              if (workflowId) {
                const title = generateCompactTitleFromFirstSentence(message);
                // 只在首次设置
                ensureSidebarTitle(workflowId, title);
                console.log('已更新任务标题(基于首句):', title);
              }
              break;
              
            case 'progress':
              // 更新进度信息和执行步骤（就地替换，不新增多条消息）
              if (chunk.step && chunk.totalSteps && (chunk.content || chunk.status)) {
                // 更新Coze风格进度行
                const stepKey = String(chunk.stepId || `step_${chunk.step}`);
                const runningText = chunk.status === 'thinking' || chunk.status === 'running';
                const baseText = (chunk.content || `第${chunk.step}步`);
                const runningLine = `正在${baseText}`;
                const doneLine = `${baseText} 已完成`;

                setMessages(prev => prev.map(m => {
                  if (m.id !== aiMessageId) return m;
                  const data: any = { ...(m.data || {}) };
                  const lines: string[] = Array.isArray(data.progressLines) ? [...data.progressLines] : [];
                  const runningMap: Record<string, number> = data._progressRunningIndex || {};
                  const doneMap: Record<string, boolean> = data._progressDone || {};

                  if (runningText) {
                    // 首次出现该步骤时追加“正在…”，后续保持不改写
                    if (runningMap[stepKey] === undefined) {
                      runningMap[stepKey] = lines.length;
                      if (!lines.includes(runningLine)) lines.push(runningLine);
                    }
                  } else {
                    // 完成时仅追加“…已完成”，不改写“正在…”行
                    if (!doneMap[stepKey]) {
                      if (!lines.includes(doneLine)) lines.push(doneLine);
                      doneMap[stepKey] = true;
                    }
                  }

                  return {
                    ...m,
                    data: { ...data, progressLines: lines, _progressRunningIndex: runningMap, _progressDone: doneMap }
                  } as TaskMessage;
                }));
                // 如果是第一个步骤，清除AI消息的loading状态
                if (chunk.step === 1) {
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { 
                          ...msg, 
                          // 保留占位文案，避免出现空白气泡
                          content: msg.content && msg.content.trim() ? msg.content : '正在分析处理中...',
                          data: { ...msg.data, isAssistantLoading: false } 
                        }
                      : msg
                  ));
                }
                
                const stepId = chunk.stepId || `step_${chunk.step}`;
                const isCompletedNow = chunk.status === 'completed';
                const isThinking = chunk.status === 'thinking';
                const stepText = isThinking
                  ? `正在思考：${chunk.content || ''}`
                  : (chunk.content || '');
                
                const newStep: ExecutionStep = {
                  id: stepId,
                  content: stepText,
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
                  isCompleted: !!isCompletedNow
                };
                
                // 更新步骤集合（同 stepId / stepNumber 就地替换）
                setCurrentExecutionSteps(prev => {
                  const updated = prev.map(s => {
                    const same = (s.id && s.id === newStep.id) || (!!s.stepNumber && s.stepNumber === newStep.stepNumber);
                    if (!same) return s;
                    // 替换为最新状态与内容
                    return { ...newStep };
                  });
                  const exists = updated.some(s => s.id === newStep.id || s.stepNumber === newStep.stepNumber);
                  const merged = exists ? updated : [...updated, newStep];
                  return sortSteps(merged);
                });
                
                // 同步更新聊天中的步骤消息（若已存在同一步骤，则替换内容与完成态；否则插入一条步骤消息）
                setMessages(prev => {
                  const stepMsgId = `step-${stepId}`;
                  let found = false;
                  const replaced = prev.map(m => {
                    if (m.id !== stepMsgId) return m;
                    found = true;
                    return {
                      ...m,
                      content: newStep.content,
                      data: {
                        ...(m.data || {}),
                        isStep: true,
                        step: newStep,
                        taskId: aiMessageId,
                        category: newStep.category
                      }
                    } as TaskMessage;
                  });
                  if (found) return replaced;
                  // 插入新的步骤消息（保持后端顺序：追加在末尾）
                  const stepMessage: TaskMessage = {
                    id: stepMsgId,
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
                  return [...replaced, stepMessage];
                });
                
                // 添加资源消息保持不变
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
                  if ((window as any).workflowResourceRefresh) {
                    (window as any).workflowResourceRefresh();
                  }
                }
                
                // 通知右侧面板当前步骤
                if ((window as any).updateWorkspacePanel) {
                  (window as any).updateWorkspacePanel({
                    type: 'current_step',
                    step: newStep,
                    taskId: aiMessageId,
                    isFirstStep: newStep.stepNumber === 1,
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
              // 更新AI消息内容，保持原有消息相对顺序
              if (chunk.content) {
                setMessages(prev => {
                  const updated = prev.map(msg => {
                    if (msg.id !== aiMessageId) return msg;
                    const isLoadingText = msg.content === '正在思考中...' || msg.content === '正在分析处理中...';
                    const newContent = isLoadingText ? (chunk.content || '') : (msg.content + (chunk.content || ''));
                    return {
                      ...msg,
                      content: newContent,
                      steps: sortSteps(currentExecutionSteps),
                      currentStep: sortSteps(currentExecutionSteps)[sortSteps(currentExecutionSteps).length - 1],
                      data: {
                        ...msg.data,
                        isAssistantLoading: false
                      }
                    } as TaskMessage;
                  });
                  return updated;
                });
              }
              break;
              
            case 'complete':
              // 完成流式响应：就地更新 AI 消息，保持原顺序
              setCurrentExecutionSteps(prev => prev.map(step => ({
                ...step,
                isCompleted: true,
                content: step.isCompleted ? step.content : step.content.replace(/^正在/, '已完成')
              })));
              
              setMessages(prev => {
                const sortedStepsFinal = sortSteps(currentExecutionSteps).map(step => ({
                  ...step,
                  isCompleted: true,
                  content: step.isCompleted ? step.content : step.content.replace(/^正在/, '已完成')
                }));
                const allStepResults: any[] = sortedStepsFinal
                  .map(s => (Array.isArray(s.results) ? s.results : (s.results ? [s.results] : [])))
                  .flat();
                return prev.map(msg => {
                  if (msg.id !== aiMessageId) return msg;
                  // 规范化进度行：将所有“正在…”改为“已完成…”，并追加“报告已生成”
                  const data: any = { ...(msg.data || {}) };
                  const oldLines: string[] = Array.isArray(data.progressLines) ? [...data.progressLines] : [];
                  const normalizedLines = oldLines.map(line => line.replace(/^正在/, '已完成'));
                  if (!normalizedLines.includes('报告已生成')) normalizedLines.push('报告已生成');
                  return {
                    ...msg,
                    isComplete: true,
                    isStreaming: false,
                    steps: sortedStepsFinal,
                    data: {
                      ...(data || {}),
                      results: allStepResults,
                      isAssistantLoading: false,
                      progressLines: normalizedLines
                    }
                  } as TaskMessage;
                });
              });
              
              setCurrentExecutionSteps([]);
              setCurrentTaskId(null);
              setIsStreaming(false);
              setIsRunning(false);
              
              // 新增：在对话中加入“总结分析”提示
              // setMessages(prev => [
              //   ...prev,
              //   {
              //     id: `thinking-summary-${Date.now()}`,
              //     type: 'system',
              //     content: '总结分析',
              //     timestamp: new Date(),
              //     data: { isStep: false }
              //   }
              // ]);
              
              // 任务完成后，生成更精准的工作流标题和描述（仅首次会生效）
              if (workflowId) {
                // 延迟执行，确保messages状态已更新
                setTimeout(() => {
                  setMessages(currentMessages => {
                    const aiMsg = currentMessages.find(msg => msg.id === aiMessageId);
                    if (aiMsg && aiMsg.content) {
                      const title = generateCompactTitleFromFirstSentence(message);
                      console.log('任务完成，尝试更新最终标题(仅首次):', title);
                      ensureSidebarTitle(workflowId, title);
                    }
                    return currentMessages;
                  });
                }, 100);
              }

              // 新增：将AI最终内容导出为 Markdown 文件并加入右侧资源
              try {
                // 再次从最新messages中获取AI消息内容
                setTimeout(async () => {
                  const latest = (function collectLatest(ms: TaskMessage[]) {
                    return ms.find(m => m.id === aiMessageId);
                  })(messages as any);
                  const finalContent = latest?.content || '';
                  if (workflowId && finalContent) {
                    const mdText = `# 分析总结\n\n${finalContent}`;
                    const blob = new Blob([mdText], { type: 'text/markdown;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const filename = `analysis_${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
                    await (workflowResourceManager as any).addLocalFileResource({
                      workflowId,
                      title: '分析报告（Markdown）',
                      filename,
                      fileUrl: url,
                      description: 'AI 分析的 Markdown 导出，可下载保存',
                      category: 'general',
                      stepId: aiMessageId
                    });
                  }
                }, 200);
              } catch (e) {
                console.warn('导出Markdown资源失败:', e);
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
              // 不再向对话追加“资源已更新”提示，保持界面简洁
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
                      data: { 
                        ...msg.data, 
                        isAssistantLoading: false, 
                        progressLines: [
                          ...((msg.data as any)?.progressLines || []),
                          `❌ 出错：${chunk.error}`
                        ]
                      } // 清除loading状态并记录错误
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

  // 基于用户首句生成简洁标题（不保存简介）
  const generateCompactTitleFromFirstSentence = (text: string) => {
    try {
      if (!text) return '新任务';
      // 取首句
      const firstSentence = (text || '')
        .split(/[\n。！？.!?]/)[0]
        .trim();
      // 去掉常见客套或无效前缀
      const cleaned = firstSentence
        .replace(/^请?帮?我?(分析|看看|推荐|筛选|找找|找一下|研究|处理|查询|总结)?/,'')
        .replace(/^想要?/,'')
        .replace(/^需要?/,'')
        .replace(/^关于/,'')
        .trim();
      const base = cleaned || firstSentence || text.trim();
      const maxLen = 24; // 更紧凑
      return base.length > maxLen ? base.slice(0, maxLen - 1) + '…' : base;
    } catch {
      return '新任务';
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

  // 确保只在本对话首次输入时设置侧栏标题（普通函数，避免额外的 Hook）
  const ensureSidebarTitle = (wfId: string | null | undefined, title: string) => {
    if (!wfId || !title) return;
    const globalMap: Record<string, boolean> = (window as any).__workflowTitleLocked || ((window as any).__workflowTitleLocked = {});
    if (globalMap[wfId]) return;
    if ((window as any).updateSidebarTask) {
      (window as any).updateSidebarTask(wfId, title);
      globalMap[wfId] = true;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">



      {/* 消息列表（精简：Coze 风格） */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-elegant">
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
              disabled={isRunning || isStreaming}
              className="flex-1 h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
            {(isStreaming || isRunning) ? (
              <button
                onClick={forceStopAllConnections}
                className="h-10 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                title="停止"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSendMessage}
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