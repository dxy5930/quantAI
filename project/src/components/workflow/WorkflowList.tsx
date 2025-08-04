import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { 
  Plus, 
  Bot,
  History,
  Search
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  avatar: string;
  description: string;
  category: 'stock' | 'analysis' | 'risk' | 'news';
}

interface TaskHistory {
  id: string;
  title: string;
  agentName: string;
  timestamp: Date;
  status: 'completed' | 'running' | 'failed';
  messageCount: number;
}

interface WorkflowListProps {
  selectedWorkflowId: string | null;
  onWorkflowSelect: (workflowId: string) => void;
}

export const WorkflowList: React.FC<WorkflowListProps> = observer(({
  selectedWorkflowId,
  onWorkflowSelect
}) => {
  const [activeSection, setActiveSection] = useState<'agents' | 'history'>('agents');
  const [searchTerm, setSearchTerm] = useState('');

  // 智能体数据
  const agents: Agent[] = [
    {
      id: 'stockai',
      name: 'AI选股助手',
      avatar: '🤖',
      description: '基于大数据挖掘和机器学习的智能选股系统，提供个性化投资建议和风险评估。',
      category: 'stock'
    },
    {
      id: 'deeptrip',
      name: 'DeepTrip 旅行专家',
      avatar: '🌎',
      description: '实时监控市场动态，提供技术分析和趋势预测，帮助把握投资时机。',
      category: 'analysis'
    },
    {
      id: 'newsai',
      name: '舆情分析专家',
      avatar: '📰',
      description: 'AI自动解读财经新闻，分析事件对市场的影响，提供投资参考。',
      category: 'news'
    },
    {
      id: 'riskguard',
      name: '风险控制专家',
      avatar: '🛡️',
      description: '专业的风险管理工具，帮助识别投资风险，制定风险控制策略。',
      category: 'risk'
    }
  ];

  // 任务历史数据
  const taskHistory: TaskHistory[] = [
    {
      id: '1',
      title: '获取其他确诊日K线图数据',
      agentName: 'AI选股助手',
      timestamp: new Date(Date.now() - 3600000), // 1小时前
      status: 'completed',
      messageCount: 15
    },
    {
      id: '2',
      title: '分析科技股板块趋势',
      agentName: 'DeepTrip 旅行专家',
      timestamp: new Date(Date.now() - 7200000), // 2小时前
      status: 'completed',
      messageCount: 23
    },
    {
      id: '3',
      title: '评估投资组合风险',
      agentName: '风险控制专家',
      timestamp: new Date(Date.now() - 14400000), // 4小时前
      status: 'running',
      messageCount: 8
    },
    {
      id: '4',
      title: '市场新闻情绪分析',
      agentName: '舆情分析专家',
      timestamp: new Date(Date.now() - 86400000), // 1天前
      status: 'completed',
      messageCount: 31
    }
  ];

  const getStatusColor = (status: TaskHistory['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'running': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'failed': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusText = (status: TaskHistory['status']) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'running': return '运行中';
      case 'failed': return '失败';
      default: return '未知';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '刚刚';
    if (diffInHours < 24) return `${diffInHours}小时前`;
    return `${Math.floor(diffInHours / 24)}天前`;
  };

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistory = taskHistory.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.agentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-900">
      {/* 新建任务按钮 */}
      <div className="p-4">
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>新任务</span>
        </button>
      </div>

      {/* 标签切换 */}
      <div className="px-4 mb-4">
        <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setActiveSection('agents')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center space-x-1 ${
              activeSection === 'agents'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>AI 专家</span>
          </button>
          <button
            onClick={() => setActiveSection('history')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center space-x-1 ${
              activeSection === 'history'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>任务</span>
          </button>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={activeSection === 'agents' ? '搜索AI专家...' : '搜索任务历史...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-4 scrollbar-thin">
        {activeSection === 'agents' ? (
          <div className="space-y-3">
            {filteredAgents.map(agent => (
              <div
                key={agent.id}
                onClick={() => onWorkflowSelect(agent.id)}
                className={`bg-white dark:bg-slate-800 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all border ${
                  selectedWorkflowId === agent.id
                    ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                    {agent.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                      {agent.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {agent.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map(task => (
              <div
                key={task.id}
                onClick={() => onWorkflowSelect(task.id)}
                className={`bg-white dark:bg-slate-800 rounded-lg p-3 cursor-pointer hover:shadow-md border ${
                  selectedWorkflowId === task.id
                    ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate flex-1 mr-2">
                    {task.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default WorkflowList; 