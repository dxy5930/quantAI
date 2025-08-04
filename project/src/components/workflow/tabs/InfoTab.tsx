import React from 'react';
import { Activity, Globe, Database } from 'lucide-react';
import { TaskContext, AgentStatus } from '../types';

interface InfoTabProps {
  taskContext?: TaskContext;
  currentAgent?: AgentStatus;
}

export const InfoTab: React.FC<InfoTabProps> = ({
  taskContext,
  currentAgent
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!currentAgent?.isRunning) {
    return null;
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