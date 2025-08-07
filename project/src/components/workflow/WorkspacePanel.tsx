import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { 
  Activity, 
  FileText,
  Database,
  Globe,
  Code
} from 'lucide-react';
import { InfoTab, BrowserTab, ResourcesTab, DatabaseTab, ApiTab } from './tabs';
import PythonApiStatus from '../common/PythonApiStatus';
import { workflowResourceManager } from '../../services/workflowResourceManager';
import { TaskContext, AgentStatus } from './types';

interface ExecutionStep {
  id: string;
  content: string;
  stepNumber: number;
  totalSteps: number;
  category: 'analysis' | 'strategy' | 'general' | 'result' | 'error';
  timestamp: Date;
  isClickable?: boolean;
  isCompleted?: boolean; // 新增：标识步骤是否已完成
}

interface WorkspacePanelProps {
  selectedWorkflowId: string | null;
  taskContext?: TaskContext;
  currentAgent?: AgentStatus;
  nodeResource?: any; // 临时类型，稍后会用正确的类型
  selectedNodeId?: string | null;
  targetTab?: string | null;
}

export const WorkspacePanel: React.FC<WorkspacePanelProps> = observer(({
  selectedWorkflowId,
  taskContext,
  currentAgent,
  nodeResource,
  selectedNodeId,
  targetTab
}) => {
  const [activeTab, setActiveTab] = useState<string>('info');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['current-agent']));
  const [selectedStep, setSelectedStep] = useState<ExecutionStep | null>(null);

  // 监听全局的步骤选择事件
  useEffect(() => {
    const handleStepSelection = (data: any) => {
      if (data.type === 'step_details') {
        setSelectedStep(data.step);
        setActiveTab('info'); // 自动切换到info标签页
      } else if (data.type === 'current_step') {
        // 处理当前执行步骤
        setSelectedStep(data.step);
        setActiveTab('info');
        
        // 如果是第一个步骤，确保面板显示在实时跟随标签页
        if (data.isFirstStep) {
          console.log('第一个步骤开始，切换到实时跟随标签页');
          setActiveTab('info');
        }
      } else if (data.type === 'task_start') {
        // 任务开始时，切换到实时跟随
        setActiveTab('info');
      }
    };

    // 设置全局函数以接收步骤选择
    (window as any).updateWorkspacePanel = handleStepSelection;

    return () => {
      if ((window as any).updateWorkspacePanel === handleStepSelection) {
        delete (window as any).updateWorkspacePanel;
      }
    };
  }, []);

  // 当选择节点时，自动切换到对应资源标签页
  useEffect(() => {
    if (nodeResource && selectedNodeId) {
      setActiveTab('resources');
    }
  }, [nodeResource, selectedNodeId]);

  // 根据任务状态自动切换tab
  useEffect(() => {
    if (currentAgent) {
      if (currentAgent.isRunning) {
        // 任务运行中，显示实时跟随
        setActiveTab('info');
      } else {
        // 任务完成，根据任务类型跳转到对应tab
        if (taskContext?.taskType === 'web-search') {
          setActiveTab('browser');
        } else if (taskContext?.taskType === 'data-analysis') {
          setActiveTab('database');
        } else {
          setActiveTab('resources');
        }
      }
    }
  }, [currentAgent?.isRunning, taskContext?.taskType]);

  // 监听目标tab变化，直接切换
  useEffect(() => {
    if (targetTab) {
      setActiveTab(targetTab);
    }
  }, [targetTab]);

  // 模拟实时Agent状态
  const mockAgentStatus: AgentStatus = currentAgent || {
    currentStep: 2,
    totalSteps: 5,
    isRunning: true,
    startTime: new Date(Date.now() - 120000), // 2分钟前开始
    agents: [
      {
        id: 'data-collector',
        name: '数据收集器',
        description: '从多个数据源收集股票相关信息',
        status: 'completed',
        startTime: new Date(Date.now() - 120000),
        endTime: new Date(Date.now() - 90000),
        duration: 30,
        progress: 100,
        outputs: ['成功获取AAPL股票数据', '收集了Yahoo Finance数据', '获取东方财富网数据'],
        logs: [
          {
            id: '1',
            timestamp: new Date(Date.now() - 120000),
            level: 'info',
            message: '开始收集股票数据...'
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 100000),
            level: 'success',
            message: 'Yahoo Finance API调用成功'
          },
          {
            id: '3',
            timestamp: new Date(Date.now() - 90000),
            level: 'success',
            message: '数据收集完成'
          }
        ]
      },
      {
        id: 'data-analyzer',
        name: '数据分析器',
        description: '分析股票技术指标和基本面数据',
        status: 'running',
        startTime: new Date(Date.now() - 90000),
        progress: 65,
        outputs: ['正在计算RSI指标...', '正在分析MACD走势...'],
        logs: [
          {
            id: '4',
            timestamp: new Date(Date.now() - 90000),
            level: 'info',
            message: '开始数据分析...'
          },
          {
            id: '5',
            timestamp: new Date(Date.now() - 60000),
            level: 'info',
            message: '计算技术指标中...'
          },
          {
            id: '6',
            timestamp: new Date(Date.now() - 30000),
            level: 'warning',
            message: '检测到异常波动，需要进一步分析'
          }
        ]
      },
      {
        id: 'chart-generator',
        name: '图表生成器',
        description: '生成各种技术分析图表',
        status: 'pending',
        progress: 0
      },
      {
        id: 'report-writer',
        name: '报告撰写器',
        description: '基于分析结果生成投资建议报告',
        status: 'pending',
        progress: 0
      },
      {
        id: 'risk-assessor',
        name: '风险评估器',
        description: '评估投资风险并提供风险控制建议',
        status: 'pending',
        progress: 0
      }
    ]
  };

  // 使用传入的任务上下文或空数据
  const defaultTaskContext: TaskContext = {
    taskType: 'general',
    webResources: [],
    charts: [],
    files: [],
    databases: [],
    apis: []
  };
  
  const currentTaskContext = taskContext || defaultTaskContext;

  // 动态生成标签页
  const getDynamicTabs = () => {
    const baseTabs = [];
    
    // 只有任务运行中时才显示实时跟随
    if (currentAgent?.isRunning) {
      baseTabs.push({ id: 'info', label: '实时跟随', icon: Activity });
    }
    
    // 始终显示所有tab类型（移除chat标签页）
    baseTabs.push({ id: 'browser', label: '网页', icon: Globe });
    baseTabs.push({ id: 'database', label: '数据', icon: Database });
    baseTabs.push({ id: 'apis', label: 'API', icon: Code });
    baseTabs.push({ id: 'resources', label: '资源', icon: FileText });

    return baseTabs;
  };

  const dynamicTabs = getDynamicTabs();

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };



  if (!selectedWorkflowId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>选择一个工作流</p>
          <p className="text-sm">查看任务资源</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Python API状态显示 */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <PythonApiStatus />
      </div>

      {/* 动态标签页头部 */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {dynamicTabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-1">
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 标签页内容 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {activeTab === 'info' && (
          <InfoTab 
            taskContext={currentTaskContext} 
            currentAgent={currentAgent}
            selectedStep={selectedStep}
          />
        )}

        {activeTab === 'browser' && (
          <BrowserTab taskContext={currentTaskContext} />
        )}

        {activeTab === 'resources' && (
          <ResourcesTab 
            taskContext={currentTaskContext} 
            workflowId={selectedWorkflowId}
            workflowResources={selectedWorkflowId ? workflowResourceManager.getWorkflowResources(selectedWorkflowId) : []}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseTab />
        )}

        {activeTab === 'apis' && (
          <ApiTab />
        )}
      </div>
    </div>
  );
});

export default WorkspacePanel; 