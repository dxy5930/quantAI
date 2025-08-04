import React from 'react';
import { BarChart3, FileText, Eye, Download, File, Table } from 'lucide-react';
import { BrowserResourcePanel } from '../BrowserResourcePanel';
import { TaskContext, ChartResource, FileResource } from '../types';

interface ResourcesTabProps {
  taskContext?: TaskContext;
  nodeResource?: any;
  selectedNodeId?: string | null;
}

export const ResourcesTab: React.FC<ResourcesTabProps> = ({
  taskContext,
  nodeResource,
  selectedNodeId
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChartTypeIcon = (type: string) => {
    switch (type) {
      case 'line': return <BarChart3 className="w-4 h-4" />;
      case 'bar': return <BarChart3 className="w-4 h-4" />;
      case 'pie': return <BarChart3 className="w-4 h-4" />;
      case 'candlestick': return <BarChart3 className="w-4 h-4" />;
      case 'scatter': return <BarChart3 className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getFileTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return <FileText className="w-4 h-4 text-red-600" />;
      case 'excel': return <Table className="w-4 h-4 text-green-600" />;
      case 'csv': return <Table className="w-4 h-4 text-blue-600" />;
      default: return <File className="w-4 h-4 text-gray-600" />;
    }
  };

  // 优先显示节点资源
  if (nodeResource) {
    return (
      <div className="h-full">
        {nodeResource.type === 'browser' && (
          <BrowserResourcePanel resource={nodeResource} />
        )}
        {nodeResource.type === 'database' && (
          <div className="p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">数据库资源</h3>
            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                数据库资源显示组件开发中...
              </p>
            </div>
          </div>
        )}
        {nodeResource.type === 'api' && (
          <div className="p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">API资源</h3>
            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                API资源显示组件开发中...
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* 图表部分 */}
      {taskContext?.charts && taskContext.charts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>生成图表</span>
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {taskContext.charts?.length || 0} 个图表
            </span>
          </div>
          
          <div className="space-y-3">
            {taskContext.charts?.map((chart: ChartResource) => (
              <div key={chart.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getChartTypeIcon(chart.type)}
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {chart.title}
                      </h4>
                      <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 px-2 py-0.5 rounded-full">
                        {chart.type}
                      </span>
                    </div>
                    
                    {chart.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {chart.description}
                      </p>
                    )}
                    
                    <div className="text-xs text-gray-400">
                      生成时间: {formatDate(chart.timestamp)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-2">
                    <button 
                      className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                      title="预览图表"
                    >
                      <Eye className="w-3 h-3 text-gray-400" />
                    </button>
                    <button 
                      onClick={() => {
                        if (chart.imageUrl) {
                          const link = document.createElement('a');
                          link.href = chart.imageUrl;
                          link.download = `${chart.title}.png`;
                          link.click();
                        }
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                      title="下载图表"
                    >
                      <Download className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 文件部分 */}
      {taskContext?.files && taskContext.files.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>生成文件</span>
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {taskContext.files?.length || 0} 个文件
            </span>
          </div>
          
          <div className="space-y-3">
            {taskContext.files?.map((file: FileResource) => (
              <div key={file.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getFileTypeIcon(file.type)}
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {file.name}
                      </h4>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{file.type}</span>
                      <span>{file.size}</span>
                      <span>{formatDate(file.timestamp)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-2">
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = file.downloadUrl;
                        link.download = file.name;
                        link.click();
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                      title="下载文件"
                    >
                      <Download className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {(!taskContext?.charts || taskContext.charts.length === 0) && 
       (!taskContext?.files || taskContext.files.length === 0) && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>暂无资源</p>
          <p className="text-sm">当前任务未生成图表或文件</p>
        </div>
      )}
    </div>
  );
}; 