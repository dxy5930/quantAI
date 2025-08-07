import React, { useEffect, useState } from 'react';
import { Activity, Globe, Database, CheckCircle, Clock, Play, AlertCircle } from 'lucide-react';
import { TaskContext, AgentStatus } from '../types';

interface ExecutionStep {
  id: string;
  content: string;
  stepNumber: number;
  totalSteps: number;
  category: 'analysis' | 'strategy' | 'general' | 'result' | 'error';
  timestamp: Date;
  isClickable?: boolean;
}

interface InfoTabProps {
  taskContext?: TaskContext;
  currentAgent?: AgentStatus;
  selectedStep?: ExecutionStep | null;
  messageId?: string;
}

export const InfoTab: React.FC<InfoTabProps> = ({
  taskContext,
  currentAgent,
  selectedStep,
  messageId
}) => {
  const [currentStep, setCurrentStep] = useState<ExecutionStep | null>(selectedStep || null);
  const [isTaskRunning, setIsTaskRunning] = useState<boolean>(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  // 监听全局事件以接收步骤详情和任务状态
  useEffect(() => {
    const handleWorkspacePanelUpdate = (event: any) => {
      if (event.detail?.type === 'step_details') {
        setCurrentStep(event.detail.step);
      }
    };

    // 监听自定义事件
    if ((window as any).updateWorkspacePanel) {
      const originalFunction = (window as any).updateWorkspacePanel;
      (window as any).updateWorkspacePanel = (data: any) => {
        if (data.type === 'step_details') {
          setCurrentStep(data.step);
        } else if (data.type === 'current_step') {
          // 实时跟随当前执行步骤
          setCurrentStep(data.step);
          setIsTaskRunning(true);
          setCurrentTaskId(data.taskId);
        } else if (data.type === 'task_complete') {
          // 任务完成
          setIsTaskRunning(false);
          setCurrentTaskId(null);
        }
        
        if (originalFunction !== (window as any).updateWorkspacePanel) {
          originalFunction(data);
        }
      };
    } else {
      (window as any).updateWorkspacePanel = (data: any) => {
        if (data.type === 'step_details') {
          setCurrentStep(data.step);
        } else if (data.type === 'current_step') {
          setCurrentStep(data.step);
          setIsTaskRunning(true);
          setCurrentTaskId(data.taskId);
        } else if (data.type === 'task_complete') {
          setIsTaskRunning(false);
          setCurrentTaskId(null);
        }
      };
    }

    window.addEventListener('workspacePanelUpdate', handleWorkspacePanelUpdate);
    
    return () => {
      window.removeEventListener('workspacePanelUpdate', handleWorkspacePanelUpdate);
    };
  }, []);

  // 当selectedStep变化时更新当前步骤
  useEffect(() => {
    if (selectedStep) {
      setCurrentStep(selectedStep);
    }
  }, [selectedStep]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStepIcon = (category: string) => {
    switch (category) {
      case 'analysis':
        return <Database className="w-5 h-5 text-green-600" />;
      case 'strategy':
        return <Activity className="w-5 h-5 text-purple-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Play className="w-5 h-5 text-blue-600" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'analysis':
        return '数据分析';
      case 'strategy':
        return '策略制定';
      case 'error':
        return '错误处理';
      case 'result':
        return '结果输出';
      default:
        return '通用处理';
    }
  };

  // 如果有选中的步骤，显示步骤详情
  if (currentStep) {
    const isRealTimeStep = isTaskRunning && currentTaskId;
    
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 dark:text-white">
            {isRealTimeStep ? '🔄 实时执行中' : '📝 执行分析'}
          </h3>
          {!isRealTimeStep && (
            <button
              onClick={() => setCurrentStep(null)}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              返回总览
            </button>
          )}
        </div>
        
        {/* 步骤执行卡片 */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {/* 步骤进度条 */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                {getStepIcon(currentStep.category)}
                <span className="font-medium">步骤 {currentStep.stepNumber}</span>
              </div>
              <div className="text-sm opacity-90">
                {currentStep.stepNumber} / {currentStep.totalSteps}
              </div>
            </div>
            <div className="mt-2 bg-white bg-opacity-20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300"
                style={{ width: `${(currentStep.stepNumber / currentStep.totalSteps) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* 执行内容分析 */}
            <div>
              <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                <Play className="w-4 h-4 mr-2 text-blue-600" />
                执行内容分析
              </h5>
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {currentStep.content}
                </p>
              </div>
            </div>

            {/* 执行状态和影响 */}
            <div className="grid grid-cols-1 gap-3">
              {/* 执行状态 */}
              <div className={`p-3 rounded-lg border ${
                isRealTimeStep 
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
                  : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {isRealTimeStep ? (
                    <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    isRealTimeStep 
                      ? 'text-amber-800 dark:text-amber-200'
                      : 'text-green-800 dark:text-green-200'
                  }`}>
                    {isRealTimeStep ? '执行状态: 进行中' : '执行状态: 已完成'}
                  </span>
                </div>
                <p className={`text-xs ${
                  isRealTimeStep 
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-green-700 dark:text-green-300'
                }`}>
                  {isRealTimeStep 
                    ? 'AI正在处理此步骤，预计完成后会生成相关分析结果...'
                    : '此步骤已完成，相关数据和分析结果已生成并存储。'
                  }
                </p>
              </div>

              {/* 业务影响分析 */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    预期影响
                  </span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {getCategoryName(currentStep.category)}类型的处理，会为您的投资决策提供{
                    currentStep.category === 'analysis' ? '深度分析数据' :
                    currentStep.category === 'strategy' ? '策略建议' :
                    currentStep.category === 'result' ? '结果总结' :
                    '有价值的信息'
                  }。
                </p>
              </div>
            </div>

            {/* 时间线 */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>开始时间: {formatDate(currentStep.timestamp)}</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  currentStep.category === 'analysis' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  currentStep.category === 'strategy' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                  currentStep.category === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                }`}>
                  {getCategoryName(currentStep.category)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 相关提示 */}
        {!isRealTimeStep && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                  💡 查看步骤产生的资源
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  此步骤执行过程中可能产生了网页、数据或API资源，您可以点击上方的"资源"标签页查看具体内容。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 原有的实时跟随逻辑
  if (!currentAgent?.isRunning && !isTaskRunning) {
    return (
      <div className="p-4 space-y-4">
        <h3 className="font-medium text-gray-900 dark:text-white">实时跟随</h3>
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">没有正在执行的任务</p>
          <p className="text-xs mt-1">在左侧对话框发起AI分析，或点击执行步骤查看详情</p>
        </div>
        
        {/* 功能说明 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            💡 使用提示
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>• 在左侧输入投资问题，查看AI实时分析步骤</li>
            <li>• 点击对话中的执行步骤，查看详细信息</li>
            <li>• 其他标签页可查看历史任务资源</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-medium text-gray-900 dark:text-white">实时跟随</h3>
      
      {/* 根据任务类型显示不同的实时内容 */}
      {taskContext?.taskType === 'web-search' && (
        <div>
          <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">正在搜索网页...</h4>
          <div className="space-y-2">
            {taskContext.webResources?.slice(0, 3).map((resource: { title: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; url: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; timestamp: Date; }, index: React.Key | null | undefined) => (
              <div key={index} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {resource.title}
                  </span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 truncate">
                  {resource.url}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  发现时间: {formatDate(resource.timestamp)}
                </p>
              </div>
            ))}
            {taskContext.webResources && taskContext.webResources.length > 3 && (
              <div className="text-xs text-gray-500 text-center py-2">
                还有 {taskContext.webResources.length - 3} 个网页正在处理...
              </div>
            )}
          </div>
        </div>
      )}

      {taskContext?.taskType === 'data-analysis' && (
        <div>
          <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">正在分析数据...</h4>
          <div className="space-y-2">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Database className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  处理数据源
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                已处理 {Math.floor(Math.random() * 1000)} 条记录
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 默认显示通用进度 */}
      {!taskContext?.taskType && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse" />
          <p className="text-sm">任务执行中...</p>
        </div>
      )}
    </div>
  );
}; 