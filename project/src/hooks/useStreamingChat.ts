import { useState, useRef, useCallback } from 'react';
import { createStreamingChat, pythonApiClient } from '../services/pythonApiClient';
import { workflowResourceManager } from '../services/workflowResourceManager';

export interface ExecutionStep {
  id: string;
  content: string;
  stepNumber: number;
  totalSteps: number;
  category: 'analysis' | 'strategy' | 'general' | 'result' | 'error';
  resourceType?: 'browser' | 'database' | 'api' | 'general';
  timestamp: Date;
  isClickable?: boolean;
  isCompleted?: boolean;
  results?: any[];
  executionDetails?: Record<string, any>;
  urls?: string[];
  files?: string[];
}

export interface TaskMessage {
  id: string;
  type: 'user' | 'system' | 'task' | 'result' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  data?: {
    isLoading?: boolean;
    isAssistantLoading?: boolean;
    taskId?: string;
    isStep?: boolean;
    step?: ExecutionStep;
    category?: string;
    results?: string[];
    relatedStepId?: string;
    progressLines?: string[];
  };
  isComplete?: boolean;
  isStreaming?: boolean;
  steps?: ExecutionStep[];
  currentStep?: ExecutionStep;
}

interface StreamChunk {
  type: 'start' | 'content' | 'progress' | 'complete' | 'error' | 'task_info' | 'workflow_created' | 'workflow_updated' | 'resource_updated';
  content?: string;
  step?: number;
  totalSteps?: number;
  stepId?: string;
  category?: string;
  resourceType?: string;
  results?: any[];
  executionDetails?: Record<string, any>;
  urls?: string[];
  files?: string[];
  status?: 'running' | 'completed' | 'thinking';
  error?: string;
  taskTitle?: string;
  taskDescription?: string;
  workflow_id?: string;
  title?: string;
  description?: string;
  trigger?: string;
  messageId?: string;
  workflowId?: string;
  stepNumber?: number;
}

interface UseStreamingChatOptions {
  workflowId: string | null;
  onMessagesUpdate: (updater: (prev: TaskMessage[]) => TaskMessage[]) => void;
  onStepsUpdate: (updater: (prev: ExecutionStep[]) => ExecutionStep[]) => void;
  onSuggestionsUpdate: (suggestions: any[]) => void;
}

interface StreamingChatState {
  isStreaming: boolean;
  isRunning: boolean;
  currentTaskId: string | null;
}

export const useStreamingChat = (options: UseStreamingChatOptions) => {
  const { workflowId, onMessagesUpdate, onStepsUpdate, onSuggestionsUpdate } = options;
  
  const [state, setState] = useState<StreamingChatState>({
    isStreaming: false,
    isRunning: false,
    currentTaskId: null
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const isUnmountingRef = useRef(false);
  const currentConnectionIdRef = useRef<string | null>(null);
  // 新增：记录已生成建议的消息ID，防止重复生成
  const suggestionsGeneratedRef = useRef<Set<string>>(new Set());
  // 新增：记录已生成分析报告的消息ID，防止重复生成
  const reportsGeneratedRef = useRef<Set<string>>(new Set());
  // 新增：本次会话内是否已收到任何数据/是否已完成
  const hasAnyDataRef = useRef<boolean>(false);
  const hasCompletedRef = useRef<boolean>(false);

  // 统一的步骤排序
  const sortSteps = useCallback((steps: ExecutionStep[]) => {
    return [...steps].sort((a, b) => {
      const byNo = (a.stepNumber || 0) - (b.stepNumber || 0);
      if (byNo !== 0) return byNo;
      const at = a.timestamp ? a.timestamp.getTime() : 0;
      const bt = b.timestamp ? b.timestamp.getTime() : 0;
      return at - bt;
    });
  }, []);

  // 生成简洁标题
  const generateCompactTitleFromFirstSentence = useCallback((text: string) => {
    try {
      if (!text) return '新任务';
      const firstSentence = text.split(/[\n。！？.!?]/)[0].trim();
      const cleaned = firstSentence
        .replace(/^请?帮?我?(分析|看看|推荐|筛选|找找|找一下|研究|处理|查询|总结)?/,'')
        .replace(/^想要?/,'')
        .replace(/^需要?/,'')
        .replace(/^关于/,'')
        .trim();
      const base = cleaned || firstSentence || text.trim();
      const maxLen = 24;
      return base.length > maxLen ? base.slice(0, maxLen - 1) + '…' : base;
    } catch {
      return '新任务';
    }
  }, []);

  // 确保侧栏标题只设置一次（只在第一次提问时设置）
  const ensureSidebarTitle = useCallback((wfId: string | null | undefined, title: string) => {
    if (!wfId || !title) return;
    
    // 使用更严格的锁定机制，确保标题只设置一次（内存 + localStorage 双保险）
    const titleLockKey = `title_set_${wfId}`;
    const globalTitleLocks: Record<string, boolean> = (window as any).__workflowTitleLocks || ((window as any).__workflowTitleLocks = {});
    const persistedLock = (() => { try { return localStorage.getItem(titleLockKey) === '1'; } catch { return false; } })();
    
    if (globalTitleLocks[titleLockKey] || persistedLock) {
      return;
    }
    
    if ((window as any).updateSidebarTask) {
      (window as any).updateSidebarTask(wfId, title);
      globalTitleLocks[titleLockKey] = true;
      try { localStorage.setItem(titleLockKey, '1'); } catch {}
    }
  }, []);

  // 处理流式消息的核心逻辑
  const handleStreamMessage = useCallback((chunk: StreamChunk, aiMessageId: string, connectionId: string, userMessage: string) => {
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

    switch (chunk.type) {
      case 'workflow_created':
      case 'workflow_updated':
        console.log('工作流事件:', chunk);
        if ((window as any).updateSidebarTask && chunk.workflow_id) {
          const title = generateCompactTitleFromFirstSentence(userMessage);
          ensureSidebarTitle(chunk.workflow_id, title);
        }
        break;

      case 'start':
        hasAnyDataRef.current = true;
        console.log('开始接收流式响应');
        onStepsUpdate(() => []);
        setState(prev => ({ ...prev, currentTaskId: aiMessageId }));

        // 清除AI消息的loading状态
        onMessagesUpdate(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                content: '正在分析处理中...',
                data: { 
                  ...msg.data, 
                  isAssistantLoading: false,
                  progressLines: Array.isArray((msg.data as any)?.progressLines) 
                    ? (msg.data as any).progressLines 
                    : [`正在思考：${generateCompactTitleFromFirstSentence(userMessage)}`]
                }
              }
            : msg
        ));

        // 更新侧栏标题
        if (workflowId && typeof userMessage === 'string') {
          const title = generateCompactTitleFromFirstSentence(userMessage);
          ensureSidebarTitle(workflowId, title);
        }

        // 通知右侧面板任务开始
        if ((window as any).updateWorkspacePanel) {
          (window as any).updateWorkspacePanel({
            type: 'task_start',
            taskId: aiMessageId,
            messageId: aiMessageId
          });
        }
        break;

      case 'progress':
        hasAnyDataRef.current = true;
        if (chunk.step && chunk.totalSteps && (chunk.content || chunk.status)) {
          // 更新进度行
          const stepKey = String(chunk.stepId || `step_${chunk.step}`);
          const runningText = chunk.status === 'thinking' || chunk.status === 'running';
          const baseText = (chunk.content || `第${chunk.step}步`);
          const runningLine = `正在${baseText}`;
          const doneLine = `${baseText} 已完成`;

          onMessagesUpdate(prev => prev.map(m => {
            if (m.id !== aiMessageId) return m;
            const data: any = { ...(m.data || {}) };
            const lines: string[] = Array.isArray(data.progressLines) ? [...data.progressLines] : [];
            const runningMap: Record<string, number> = data._progressRunningIndex || {};
            const doneMap: Record<string, boolean> = data._progressDone || {};

            if (runningText) {
              if (runningMap[stepKey] === undefined) {
                runningMap[stepKey] = lines.length;
                if (!lines.includes(runningLine)) lines.push(runningLine);
              }
            } else {
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

          // 清除loading状态
          if (chunk.step === 1) {
            onMessagesUpdate(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? { 
                    ...msg, 
                    content: msg.content && msg.content.trim() ? msg.content : '正在分析处理中...',
                    data: { ...msg.data, isAssistantLoading: false } 
                  }
                : msg
            ));
          }
          
          // 创建步骤对象
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
          
          // 更新步骤集合
          onStepsUpdate(prev => {
            const updated = prev.map(s => {
              const same = (s.id && s.id === newStep.id) || (!!s.stepNumber && s.stepNumber === newStep.stepNumber);
              if (!same) return s;
              return { ...newStep };
            });
            const exists = updated.some(s => s.id === newStep.id || s.stepNumber === newStep.stepNumber);
            const merged = exists ? updated : [...updated, newStep];
            return sortSteps(merged);
          });
          
          // 同步更新聊天中的步骤消息
          onMessagesUpdate(prev => {
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
            
            // 插入新的步骤消息
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
          
          // 添加资源
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
        hasAnyDataRef.current = true;
        if (chunk.content) {
          onMessagesUpdate(prev => prev.map(msg => {
            if (msg.id !== aiMessageId) return msg;
            const isLoadingText = msg.content === '正在思考中...' || msg.content === '正在分析处理中...';
            const newContent = isLoadingText ? (chunk.content || '') : (msg.content + (chunk.content || ''));
            return {
              ...msg,
              content: newContent,
              data: {
                ...msg.data,
                isAssistantLoading: false
              }
            } as TaskMessage;
          }));
        }
        break;

      case 'complete':
        hasAnyDataRef.current = true;
        hasCompletedRef.current = true;
        // 完成处理
        onStepsUpdate(prev => prev.map(step => ({
          ...step,
          isCompleted: true,
          content: step.isCompleted ? step.content : step.content.replace(/^正在/, '已完成')
        })));
        
        onMessagesUpdate(prev => {
          return prev.map(msg => {
            if (msg.id !== aiMessageId) return msg;
            const data: any = { ...(msg.data || {}) };
            const oldLines: string[] = Array.isArray(data.progressLines) ? [...data.progressLines] : [];
            const normalizedLines = oldLines.map(line => line.replace(/^正在/, '已完成'));
            if (!normalizedLines.includes('报告已生成')) normalizedLines.push('报告已生成');
            
            return {
              ...msg,
              isComplete: true,
              isStreaming: false,
              data: {
                ...(data || {}),
                isAssistantLoading: false,
                progressLines: normalizedLines
              }
            } as TaskMessage;
          });
        });
        
        setState(prev => ({
          ...prev,
          currentTaskId: null,
          isStreaming: false,
          isRunning: false
        }));
        
        // 只在AI回答完成后导出Markdown分析报告（添加防重复检查）
        try {
          setTimeout(async () => {
            // 检查是否已经为该消息生成过分析报告
            if (reportsGeneratedRef.current.has(aiMessageId)) {
              console.log(`消息 ${aiMessageId} 已生成过分析报告，跳过`);
              return;
            }
            
            onMessagesUpdate(currentMessages => {
              const aiMsg = currentMessages.find(m => m.id === aiMessageId);
              const finalContent = aiMsg?.content || '';
              // 只有当内容足够长且不是加载状态时才生成分析报告
              if (workflowId && finalContent && finalContent.length > 50 && 
                  finalContent !== '正在思考中...' && finalContent !== '正在分析处理中...') {
                
                // 标记为已处理，防止重复生成
                reportsGeneratedRef.current.add(aiMessageId);
                
                const mdText = `# AI分析报告\n\n${finalContent}`;
                const blob = new Blob([mdText], { type: 'text/markdown;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const filename = `ai_analysis_${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
                (workflowResourceManager as any).addLocalFileResource({
                  workflowId,
                  title: 'AI分析报告（Markdown）',
                  filename,
                  fileUrl: url,
                  description: 'AI 分析的 Markdown 导出，可下载保存',
                  category: 'general',
                  stepId: aiMessageId
                }).catch((e: any) => {
                  console.warn('导出Markdown资源失败:', e);
                  // 失败时移除标记，允许重试
                  reportsGeneratedRef.current.delete(aiMessageId);
                });
              }
              return currentMessages;
            });
          }, 200);
        } catch (e) {
          console.warn('导出Markdown资源失败:', e);
          // 失败时移除标记，允许重试
          reportsGeneratedRef.current.delete(aiMessageId);
        }
        
        // 通知右侧面板任务完成
        if ((window as any).updateWorkspacePanel) {
          (window as any).updateWorkspacePanel({
            type: 'task_complete',
            taskId: aiMessageId
          });
        }
        
        // 生成建议选项（添加防重复检查）
        setTimeout(async () => {
          try {
            // 检查是否已经为该消息生成过建议
            if (suggestionsGeneratedRef.current.has(aiMessageId)) {
              console.log(`消息 ${aiMessageId} 已生成过建议，跳过`);
              return;
            }
            
            onMessagesUpdate(currentMessages => {
              const aiMsg = currentMessages.find(msg => msg.id === aiMessageId);
              const userMsg = currentMessages.find(msg => msg.type === 'user' && msg.timestamp <= aiMsg!.timestamp);
              
              if (aiMsg && aiMsg.content && aiMsg.content !== '正在思考中...' && aiMsg.content !== '正在分析处理中...' && aiMsg.content.length > 10) {
                console.log('开始调用后端API生成建议...');
                
                // 标记为已处理，防止重复生成
                suggestionsGeneratedRef.current.add(aiMessageId);
                
                // 首先检查Python后端服务是否正常
                pythonApiClient.healthCheck().then(isHealthy => {
                  if (!isHealthy) {
                    console.warn('Python后端服务不可用，跳过建议生成');
                    return;
                  }
                  
                  // 后端服务可用，调用建议生成API
                  return pythonApiClient.generateSuggestions({
                    aiContent: aiMsg.content,
                    userMessage: userMsg?.content || '',
                    context: {
                      workflowId: workflowId,
                      messageId: aiMessageId,
                      timestamp: new Date().toISOString()
                    }
                  });
                }).then(suggestionsResponse => {
                  if (suggestionsResponse && suggestionsResponse.success && suggestionsResponse.data.suggestions) {
                    const suggestions = suggestionsResponse.data.suggestions;
                    onSuggestionsUpdate(suggestions);
                    console.log('后端AI生成建议成功:', suggestions.length, '个建议');
                  } else {
                    console.warn('后端API返回空或错误，不显示建议');
                  }
                }).catch(error => {
                  console.error('调用后端AI建议生成失败:', error);
                  // 发生错误时从已处理集合中移除，允许重试
                  suggestionsGeneratedRef.current.delete(aiMessageId);
                });
              }
              
              return currentMessages;
            });
          } catch (error) {
            console.error('生成建议选项失败:', error);
            // 发生错误时从已处理集合中移除，允许重试
            suggestionsGeneratedRef.current.delete(aiMessageId);
          }
        }, 300);
        
        // 主动关闭连接，避免触发onerror事件
        setTimeout(() => {
          if (eventSourceRef.current && eventSourceRef.current.readyState !== EventSource.CLOSED) {
            console.log('主动关闭流式连接');
            try {
              eventSourceRef.current.close();
              eventSourceRef.current = null;
            } catch (error) {
              console.error('主动关闭连接失败:', error);
            }
          }
          
          if (currentConnectionIdRef.current === connectionId) {
            currentConnectionIdRef.current = null;
          }
        }, 500);
        break;

      case 'resource_updated':
        console.log('收到资源更新事件:', chunk);
        if ((window as any).workflowResourceRefresh) {
          (window as any).workflowResourceRefresh();
        }
        break;

      case 'error':
        console.error('流式响应错误:', chunk.error);
        onMessagesUpdate(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                content: msg.content + `\n\n❌ 发生错误: ${chunk.error}`,
                isComplete: true, 
                isStreaming: false,
                data: { 
                  ...msg.data, 
                  isAssistantLoading: false, 
                  progressLines: [
                    ...((msg.data as any)?.progressLines || []),
                    `❌ 出错：${chunk.error}`
                  ]
                }
              }
            : msg
        ));
        
        setState(prev => ({
          ...prev,
          currentTaskId: null,
          isStreaming: false,
          isRunning: false
        }));
        break;
    }
  }, [workflowId, onMessagesUpdate, onStepsUpdate, onSuggestionsUpdate, sortSteps, generateCompactTitleFromFirstSentence, ensureSidebarTitle]);

  // 开始流式对话
  const startStreamingChat = useCallback(async (message: string) => {
    console.log('开始流式对话，message:', message);
    
    // 重置会话标记
    hasAnyDataRef.current = false;
    hasCompletedRef.current = false;
    
    // 清空建议选项
    onSuggestionsUpdate([]);
    
    // 清空已生成建议的记录，为新对话做准备
    suggestionsGeneratedRef.current.clear();
    
    // 清空已生成分析报告的记录，为新对话做准备
    reportsGeneratedRef.current.clear();
    
    // 确保组件处于活跃状态
    isUnmountingRef.current = false;
    
    // 创建唯一的连接ID
    const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 关闭现有连接
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
    
    setState(prev => ({
      ...prev,
      isStreaming: true,
      isRunning: true
    }));
    currentConnectionIdRef.current = connectionId;

    // 创建AI消息
    const aiMessageId = `ai-${Date.now()}`;
    const aiMessage: TaskMessage = {
      id: aiMessageId,
      type: 'assistant',
      content: '正在思考中...',
      timestamp: new Date(),
      isComplete: false,
      isStreaming: true,
      data: {
        isAssistantLoading: true,
        progressLines: [
          `正在思考：${generateCompactTitleFromFirstSentence(message)}`
        ]
      }
    };

    onMessagesUpdate(prev => [...prev, aiMessage]);

    try {
      // 等待确保连接完全关闭
      await new Promise(resolve => setTimeout(resolve, 100));

      // 创建流式连接
      const eventSource = createStreamingChat({
        message: message,
        conversationId: workflowId || `workflow-${Date.now()}`,
        context: { workflowId },
        workflowId: workflowId || undefined
      });
      eventSourceRef.current = eventSource;

      // 处理流式消息
      eventSource.onmessage = (event) => {
        // 检查连接状态
        if (eventSource.readyState !== EventSource.OPEN) {
          console.log('连接已关闭，忽略消息');
          return;
        }
        
        try {
          const chunk: StreamChunk = JSON.parse(event.data);
          handleStreamMessage(chunk, aiMessageId, connectionId, message);
        } catch (error) {
          console.error('解析流式消息失败:', error);
        }
      };

      // 处理连接错误
      eventSource.onerror = (error) => {
        // 若会话已收到数据或已完成，静默处理，避免控制台误红
        if (hasCompletedRef.current || hasAnyDataRef.current) {
          console.debug('EventSource已结束/已有数据，忽略错误');
        } else {
          console.warn('EventSource连接错误:', error);
        }
        
        if (isUnmountingRef.current || currentConnectionIdRef.current !== connectionId) {
          return;
        }
        
        if (!(hasCompletedRef.current || hasAnyDataRef.current)) {
          onMessagesUpdate(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { 
                  ...msg, 
                  content: msg.content + '\n\n❗ 连接异常，请重试或检查网络',
                  isComplete: true, 
                  isStreaming: false,
                  data: { ...msg.data, isAssistantLoading: false }
                }
              : msg
          ));
        }
        
        setState(prev => ({
          ...prev,
          currentTaskId: null,
          isStreaming: false,
          isRunning: false
        }));
        
        try { eventSource.close(); } catch {}
        if (eventSourceRef.current === eventSource) eventSourceRef.current = null;
        if (currentConnectionIdRef.current === connectionId) currentConnectionIdRef.current = null;
      };

    } catch (error) {
      console.error('启动流式对话失败:', error);
      onMessagesUpdate(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { 
              ...msg, 
              content: `❌ 启动对话失败: ${error}`,
              isComplete: true, 
              isStreaming: false,
              data: { ...msg.data, isAssistantLoading: false }
            }
          : msg
      ));
      
      setState(prev => ({
        ...prev,
        currentTaskId: null,
        isStreaming: false,
        isRunning: false
      }));
      
      if (currentConnectionIdRef.current === connectionId) {
        currentConnectionIdRef.current = null;
      }
    }
  }, [workflowId, onMessagesUpdate, onStepsUpdate, onSuggestionsUpdate, generateCompactTitleFromFirstSentence, handleStreamMessage]);

  // 强制停止所有连接
  const forceStopAllConnections = useCallback(() => {
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
    setState(prev => ({
      ...prev,
      isStreaming: false,
      isRunning: false,
      currentTaskId: null
    }));
    
    // 清除所有消息中的loading状态
    onMessagesUpdate(prev => prev.map(msg => ({
      ...msg,
      data: {
        ...msg.data,
        isLoading: false,
        isAssistantLoading: false
      },
      isStreaming: false
    })));
    
    // 显示停止消息
    onMessagesUpdate(prev => [...prev, {
      id: `stop-${Date.now()}`,
      type: 'system',
      content: '⏹️ 所有连接已手动停止',
      timestamp: new Date()
    }]);
  }, [onMessagesUpdate]);

  // 清理函数
  const cleanup = useCallback(() => {
    isUnmountingRef.current = true;
    // 清空建议生成记录
    suggestionsGeneratedRef.current.clear();
    // 清空分析报告生成记录
    reportsGeneratedRef.current.clear();
    if (eventSourceRef.current) {
      console.log('清理SSE连接');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  return {
    state,
    startStreamingChat,
    forceStopAllConnections,
    cleanup
  };
};