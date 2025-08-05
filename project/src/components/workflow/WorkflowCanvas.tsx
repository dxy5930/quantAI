import React, { useState, useRef, useEffect } from 'react';
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
  FileText
} from 'lucide-react';

interface TaskMessage {
  id: string;
  type: 'user' | 'system' | 'task' | 'result';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  data?: any;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 调试：显示当前workflowId
  React.useEffect(() => {
    console.log('WorkflowCanvas接收到的workflowId:', workflowId);
  }, [workflowId]);

  // 模拟任务节点
  const taskNodes = [
    { 
      id: 'node-1', 
      type: 'browser', 
      name: '网页抓取', 
      status: 'completed',
      description: '从Yahoo Finance抓取股票数据'
    },
    { 
      id: 'node-2', 
      type: 'database', 
      name: '数据存储', 
      status: 'running',
      description: '将数据保存到数据库'
    },
    { 
      id: 'node-3', 
      type: 'api', 
      name: 'API调用', 
      status: 'pending',
      description: '调用分析服务API'
    }
  ];

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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !workflowId) return;

    const userMessage: TaskMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    // 检查是否是第一条用户消息（过滤掉系统消息）
    const isFirstMessage = messages.filter(m => m.type === 'user').length === 0;
    const messageContent = inputMessage;

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsRunning(true);

    // 如果是第一条消息，生成并更新任务名称
    if (isFirstMessage && workflowId) {
      const taskTitle = generateTaskTitle(messageContent);
      const taskDescription = generateTaskDescription(messageContent);
      
      console.log('更新任务:', { workflowId, taskTitle, taskDescription, isFirstMessage });
      
      // 更新侧边栏中的任务名称
      if ((window as any).updateSidebarTask) {
        (window as any).updateSidebarTask(workflowId, taskTitle, taskDescription);
        console.log('已调用updateSidebarTask');
      } else {
        console.log('updateSidebarTask不存在');
      }
    }

    // 模拟AI处理和任务执行
    setTimeout(() => {
      const taskMessage: TaskMessage = {
        id: (Date.now() + 1).toString(),
        type: 'task',
        content: '正在分析请求...',
        timestamp: new Date(),
        status: 'running'
      };
      setMessages(prev => [...prev, taskMessage]);

      setTimeout(() => {
        const resultMessage: TaskMessage = {
          id: (Date.now() + 2).toString(),
          type: 'result',
          content: '任务执行完成！已生成分析报告。',
          timestamp: new Date(),
          status: 'completed',
          data: {
            type: 'analysis',
            results: ['分析结果1', '分析结果2', '分析结果3']
          }
        };
        setMessages(prev => {
          const newMessages = [...prev];
          // 更新任务状态为完成
          const taskIndex = newMessages.findIndex(m => m.id === taskMessage.id);
          if (taskIndex !== -1) {
            newMessages[taskIndex] = { ...taskMessage, status: 'completed' };
          }
          return [...newMessages, resultMessage];
        });
        setIsRunning(false);
      }, 2000);
    }, 1000);
  };

  // 根据用户输入生成任务标题
  const generateTaskTitle = (message: string): string => {
    const keywords = message.toLowerCase();
    
    if (keywords.includes('股票') || keywords.includes('股价') || keywords.includes('投资')) {
      return '股票分析任务';
    } else if (keywords.includes('数据') || keywords.includes('分析')) {
      return '数据分析任务';
    } else if (keywords.includes('策略') || keywords.includes('交易')) {
      return '投资策略任务';
    } else if (keywords.includes('风险') || keywords.includes('评估')) {
      return '风险评估任务';
    } else if (keywords.includes('预测') || keywords.includes('趋势')) {
      return '趋势预测任务';
    } else {
      return 'AI智能任务';
    }
  };

  // 根据用户输入生成任务描述
  const generateTaskDescription = (message: string): string => {
    if (message.length > 50) {
      return message.substring(0, 47) + '...';
    }
    return message;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 处理任务点击
  const handleTaskClick = (message: TaskMessage) => {
    if (message.type === 'task' && onNodeClick) {
      // 根据任务内容确定跳转的tab类型
      let tabType = 'resources'; // 默认
      
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
    switch (message.type) {
      case 'user':
        return <User className="w-5 h-5 text-blue-600" />;
      case 'system':
        return <Bot className="w-5 h-5 text-green-600" />;
      case 'task':
        return getTaskStatusIcon(message.status);
      case 'result':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
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
    switch (message.type) {
      case 'user':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'system':
        // 普通对话 - 绿色背景
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'task':
        // 任务 - 红色背景
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'result':
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
                  message.type === 'task' ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
                }`}
                onClick={() => message.type === 'task' ? handleTaskClick(message) : undefined}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {message.type === 'user' ? '用户' : 
                     message.type === 'system' ? '系统' :
                     message.type === 'task' ? '任务' : '结果'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {message.content}
                </p>
                
                {message.data && (
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
                disabled={isRunning}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed scrollbar-thin"
              />
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isRunning}
              className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex-shrink-0"
              title="发送指令"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
         
        </div>
        
      )}
    </div>
  );
});

export default WorkflowCanvas; 