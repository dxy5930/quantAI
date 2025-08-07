import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { 
  Globe, 
  Database, 
  Zap, 
  FileText, 
  BarChart3,
  Download,
  ExternalLink,
  RefreshCw,
  Filter,
  Calendar,
  Clock
} from 'lucide-react';
import { TaskContext, WebResource, DatabaseResource, ApiResource, FileResource, ChartResource } from '../types';

interface WorkflowResource {
  id: string;
  type: 'web' | 'database' | 'api' | 'file' | 'chart' | 'general';
  title: string;
  description?: string;
  timestamp: Date;
  data: any;
  stepId?: string;
  category?: string;
  workflowId?: string;
  resourceType?: string;
  executionDetails?: Record<string, any>;
}

interface ResourcesTabProps {
  taskContext?: TaskContext;
  workflowId?: string;
  workflowResources?: WorkflowResource[];
}

export const ResourcesTab: React.FC<ResourcesTabProps> = observer(({ 
  taskContext, 
  workflowId,
  workflowResources = []
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [resources, setResources] = useState<WorkflowResource[]>([]);

  // 聚合所有类型的资源
  useEffect(() => {
    const aggregatedResources: WorkflowResource[] = [];

    // 聚合来自taskContext的资源
    if (taskContext) {
      // Web资源
      taskContext.webResources?.forEach(web => {
        aggregatedResources.push({
          id: web.id,
          type: 'web',
          title: web.title,
          description: web.description,
          timestamp: web.timestamp,
          data: web
        });
      });

      // 数据库资源
      taskContext.databases?.forEach(db => {
        aggregatedResources.push({
          id: db.id,
          type: 'database',
          title: db.name,
          description: db.description,
          timestamp: new Date(),
          data: db
        });
      });

      // API资源
      taskContext.apis?.forEach(api => {
        aggregatedResources.push({
          id: api.id,
          type: 'api',
          title: api.name,
          description: api.description,
          timestamp: new Date(),
          data: api
        });
      });

      // 文件资源
      taskContext.files?.forEach(file => {
        aggregatedResources.push({
          id: file.id,
          type: 'file',
          title: file.name,
          description: `${file.type} - ${file.size}`,
          timestamp: file.timestamp,
          data: file
        });
      });

      // 图表资源
      taskContext.charts?.forEach(chart => {
        aggregatedResources.push({
          id: chart.id,
          type: 'chart',
          title: chart.title,
          description: chart.description,
          timestamp: chart.timestamp,
          data: chart
        });
      });
    }

    // 聚合来自workflowResources的资源
    aggregatedResources.push(...workflowResources);

    // 按时间倒序排列
    aggregatedResources.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    setResources(aggregatedResources);
  }, [taskContext, workflowResources]);

  // 过滤资源
  const filteredResources = resources.filter(resource => {
    const matchesType = filterType === 'all' || resource.type === filterType;
    return matchesType;
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'web':
        return <Globe className="w-5 h-5 text-blue-600" />;
      case 'database':
        return <Database className="w-5 h-5 text-yellow-600" />;
      case 'api':
        return <Zap className="w-5 h-5 text-green-600" />;
      case 'file':
        return <FileText className="w-5 h-5 text-purple-600" />;
      case 'chart':
        return <BarChart3 className="w-5 h-5 text-orange-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getResourceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      web: '网页',
      database: '数据库',
      api: 'API',
      file: '文件',
      chart: '图表',
      general: '通用'
    };
    return labels[type] || type;
  };

  const getResourceTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      web: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      database: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      api: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      file: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      chart: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      general: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const handleResourceClick = (resource: WorkflowResource) => {
    if (resource.type === 'web' && resource.data.url) {
      window.open(resource.data.url, '_blank');
    } else if (resource.type === 'file' && resource.data.downloadUrl) {
      window.open(resource.data.downloadUrl, '_blank');
    } else if (resource.type === 'api' && resource.data.documentation) {
      window.open(resource.data.documentation, '_blank');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('zh-CN', { 
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const resourceTypes = [
    { value: 'all', label: '全部', count: resources.length },
    { value: 'web', label: '网页', count: resources.filter(r => r.type === 'web').length },
    { value: 'database', label: '数据库', count: resources.filter(r => r.type === 'database').length },
    { value: 'api', label: 'API', count: resources.filter(r => r.type === 'api').length },
    { value: 'file', label: '文件', count: resources.filter(r => r.type === 'file').length },
    { value: 'chart', label: '图表', count: resources.filter(r => r.type === 'chart').length },
    { value: 'general', label: '通用', count: resources.filter(r => r.type === 'general').length }
  ].filter(type => type.count > 0);

  return (
    <div className="h-full flex flex-col">
      {/* 标题和操作栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-medium text-gray-900 dark:text-white">工作流资源</h3>
        <div className="flex items-center space-x-2">
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors">
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* 类型过滤 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {/* 类型过滤标签 */}
        <div className="flex flex-wrap gap-2">
          {resourceTypes.map(type => (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                filterType === type.value
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {type.label} ({type.count})
            </button>
          ))}
        </div>
      </div>

      {/* 资源列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {filteredResources.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <FileText className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              暂无资源
            </p>
          </div>
        ) : (
          filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              onClick={() => handleResourceClick(resource)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* 资源标题和类型 */}
                  <div className="flex items-center space-x-2 mb-2">
                    {getResourceIcon(resource.type)}
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate flex-1">
                      {resource.title}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${getResourceTypeBadgeColor(resource.type)}`}>
                      {getResourceTypeLabel(resource.type)}
                    </span>
                  </div>

                  {/* 描述 */}
                  {resource.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                      {resource.description}
                    </p>
                  )}

                  {/* 资源特定信息 */}
                  <div className="space-y-1">
                    {resource.type === 'web' && resource.data.url && (
                      <div className="text-xs text-gray-400 truncate flex items-center">
                        <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                        {resource.data.url}
                      </div>
                    )}
                    
                    {resource.type === 'database' && resource.data.tables && (
                      <div className="text-xs text-gray-400">
                        表数量: {resource.data.tables.length}
                      </div>
                    )}
                    
                    {resource.type === 'api' && resource.data.method && resource.data.endpoint && (
                      <div className="text-xs text-gray-400 font-mono">
                        {resource.data.method} {resource.data.endpoint}
                      </div>
                    )}
                    
                    {resource.type === 'file' && (
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <Download className="w-3 h-3" />
                        <span>{resource.data.size}</span>
                      </div>
                    )}
                  </div>

                  {/* 时间戳 */}
                  <div className="flex items-center space-x-1 mt-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(resource.timestamp)}</span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center space-x-1 ml-2">
                  {resource.type === 'web' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(resource.data.url, '_blank');
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                      title="打开链接"
                    >
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </button>
                  )}
                  
                  {resource.type === 'file' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(resource.data.downloadUrl, '_blank');
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                      title="下载文件"
                    >
                      <Download className="w-3 h-3 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

export default ResourcesTab; 