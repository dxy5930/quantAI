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

  // 模拟初始任务流消息
  useEffect(() => {
    if (workflowId) {
      const initialMessages: TaskMessage[] = [
        {
          id: '1',
          type: 'system',
          content: `已加载工作流: ${workflowId === '1' ? '股票分析工作流' : '工作流'} ${workflowId}`,
          timestamp: new Date()
        },
        {
          id: '2',
          type: 'task',
          content: '搜索相关网页资料...',
          timestamp: new Date(),
          status: 'completed'
        },
        {
          id: '3',
          type: 'task',
          content: '分析股票数据库信息...',
          timestamp: new Date(),
          status: 'completed'
        },
        {
          id: '4',
          type: 'task',
          content: '调用财经API接口获取实时数据...',
          timestamp: new Date(),
          status: 'completed'
        },
        {
          id: '5',
          type: 'task',
          content: '生成分析图表和文件资源...',
          timestamp: new Date(),
          status: 'completed'
        },
        {
          id: '6',
          type: 'system',
          content: '工作流已准备就绪，请输入指令开始执行任务',
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

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsRunning(true);

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

  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case 'browser':
        return <Globe className="w-5 h-5 text-blue-600" />;
      case 'database':
        return <Database className="w-5 h-5 text-green-600" />;
      case 'api':
        return <Zap className="w-5 h-5 text-purple-600" />;
      case 'file':
        return <FileText className="w-5 h-5 text-orange-600" />;
      default:
        return <Bot className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNodeStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'running':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'pending':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'failed':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-gray-300 bg-gray-50 dark:bg-gray-900/20';
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