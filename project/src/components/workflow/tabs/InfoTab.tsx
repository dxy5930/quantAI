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
            {isRealTimeStep ? '实时执行跟随' : '执行步骤详情'}
          </h3>
          {!isRealTimeStep && (
            <button
              onClick={() => setCurrentStep(null)}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              返回
            </button>
          )}
        </div>
        
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          {/* 步骤头部信息 */}
          <div className="flex items-center space-x-3 mb-4">
            {getStepIcon(currentStep.category)}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                步骤 {currentStep.stepNumber} / {currentStep.totalSteps}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getCategoryName(currentStep.category)}
              </p>
            </div>
            {isRealTimeStep && (
              <div className="ml-auto">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  正在执行
                </span>
              </div>
            )}
          </div>

          {/* 步骤内容 */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
              执行内容
            </h5>
            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700 p-3 rounded">
              {currentStep.content}
            </p>
          </div>

          {/* 时间信息 */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>执行时间: {formatDate(currentStep.timestamp)}</span>
              <span className={`px-2 py-1 rounded ${
                currentStep.category === 'analysis' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                currentStep.category === 'strategy' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                currentStep.category === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
              }`}>
                {getCategoryName(currentStep.category)}
              </span>
            </div>
          </div>

          {/* 实时执行或历史状态信息 */}
          <div className={`mt-4 p-3 rounded ${
            isRealTimeStep 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'
              : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {isRealTimeStep ? (
                <Activity className="w-4 h-4 text-green-600 animate-pulse" />
              ) : (
                <CheckCircle className="w-4 h-4 text-blue-600" />
              )}
              <span className={`text-sm font-medium ${
                isRealTimeStep 
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-blue-800 dark:text-blue-200'
              }`}>
                {isRealTimeStep ? '正在执行' : '步骤状态'}
              </span>
            </div>
            <p className={`text-sm ${
              isRealTimeStep 
                ? 'text-green-700 dark:text-green-300'
                : 'text-blue-700 dark:text-blue-300'
            }`}>
              {isRealTimeStep 
                ? '此步骤正在实时执行中，请等待AI处理完成...'
                : '此步骤已完成执行，您可以在左侧查看相关的AI分析结果。'
              }
            </p>
          </div>
        </div>
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