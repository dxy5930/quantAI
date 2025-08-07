import React, { useState, useEffect, useCallback } from 'react';
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
import { workflowApi } from '../../../services/workflowApi';

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
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [remoteResources, setRemoteResources] = useState<WorkflowResource[]>([]);
  // 【移除】不再需要的消息时间戳状态，改为纯SSE推送
  // const [lastMessageTimestamp, setLastMessageTimestamp] = useState<string | null>(null);
  // 【新增】实时轮询控制
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState<boolean>(true);

  // 获取远程资源的函数
  const fetchRemoteResources = useCallback(async () => {
    if (!workflowId) return;
    
    try {
      setIsRefreshing(true);
      const response = await workflowApi.getWorkflowResources(workflowId);
      const transformedResources = response.map((r: any) => ({
        id: r.id,
        type: r.resource_type,
        title: r.title,
        description: r.description,
        timestamp: new Date(r.created_at),
        data: r.data,
        category: r.category,
        sourceStepId: r.source_step_id
      }));
      setRemoteResources(transformedResources);
    } catch (error) {
      console.error('获取工作流资源失败:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [workflowId]);

  // 实时轮询资源更新 - 更频繁的轮询
  useEffect(() => {
    if (!workflowId) return;
    
    // 立即获取一次资源
    fetchRemoteResources();
    
    // 【修改】简化为仅初始加载和手动刷新，实时更新通过SSE推送
    // 移除轮询机制，减少服务器压力，完全依赖SSE推送
    
  }, [workflowId, fetchRemoteResources]);

  // 【简化】移除复杂的消息检查轮询，改为纯SSE推送响应
  // checkForUpdates函数已不再需要

  // 【新增】注册全局刷新函数，供SSE事件调用
  useEffect(() => {
    // 注册全局刷新函数
    (window as any).workflowResourceRefresh = () => {
      if (workflowId && isRealTimeEnabled) {
        console.log('SSE触发工作流资源实时刷新');
        fetchRemoteResources();
      }
    };

    // 清理函数
    return () => {
      if ((window as any).workflowResourceRefresh) {
        delete (window as any).workflowResourceRefresh;
      }
    };
  }, [workflowId, isRealTimeEnabled, fetchRemoteResources]);

  // 【新增】当工作流状态变化时，重新启用实时轮询
  useEffect(() => {
    if (workflowId) {
      setIsRealTimeEnabled(true);
      // setLastMessageTimestamp(null); // 移除此行
    }
  }, [workflowId]);

  // 聚合所有类型的资源
  useEffect(() => {
    const allResources: WorkflowResource[] = [];
    
    // 添加远程工作流资源
    if (remoteResources.length > 0) {
      allResources.push(...remoteResources);
    }
    
    // 添加传入的本地资源
    if (workflowResources.length > 0) {
      // 过滤掉重复的资源（基于ID）
      const existingIds = new Set(allResources.map(r => r.id));
      const uniqueWorkflowResources = workflowResources.filter(r => !existingIds.has(r.id));
      allResources.push(...uniqueWorkflowResources);
    }
    
    // 从任务上下文添加资源
    if (taskContext) {
      // Web资源
      const webResources: WorkflowResource[] = taskContext.webResources?.map(web => ({
        id: web.id,
        type: 'web' as const,
        title: web.title,
        description: web.description,
        timestamp: web.timestamp,
        data: {
          url: web.url,
          status: web.status,
          description: web.description
        },
        workflowId: workflowId || '',
        category: 'browser'
      })) || [];

      // Database资源
      const databaseResources: WorkflowResource[] = taskContext.databases?.map(db => ({
        id: db.id,
        type: 'database' as const,
        title: db.name,
        description: db.description,
        timestamp: new Date(),
        data: {
          tables: db.tables,
          queryUrl: db.queryUrl,
          description: db.description
        },
        workflowId: workflowId || '',
        category: 'database'
      })) || [];

      // API资源
      const apiResources: WorkflowResource[] = taskContext.apis?.map(api => ({
        id: api.id,
        type: 'api' as const,
        title: api.name,
        description: api.description,
        timestamp: new Date(),
        data: {
          endpoint: api.endpoint,
          method: api.method,
          documentation: api.documentation,
          description: api.description
        },
        workflowId: workflowId || '',
        category: 'api'
      })) || [];

      // 过滤重复资源并添加
      const existingIds = new Set(allResources.map(r => r.id));
      const contextResources = [...webResources, ...databaseResources, ...apiResources];
      const uniqueContextResources = contextResources.filter(r => !existingIds.has(r.id));
      allResources.push(...uniqueContextResources);
    }
    
    // 按时间戳降序排序（最新的在前）
    allResources.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    setResources(allResources);
  }, [remoteResources, workflowResources, taskContext, workflowId]);

  // 过滤资源
  const filteredResources = filterType === 'all' 
    ? resources 
    : resources.filter(resource => resource.type === filterType);

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

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('zh-CN', {
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
          {/* 【新增】实时更新开关 */}
          <button
            onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
            className={`p-1 rounded transition-colors ${
              isRealTimeEnabled 
                ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
            }`}
            title={isRealTimeEnabled ? '实时更新已启用' : '实时更新已禁用'}
          >
            <div className={`w-2 h-2 rounded-full ${isRealTimeEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          </button>
          
          <button 
            onClick={fetchRemoteResources}
            disabled={isRefreshing}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
            title="手动刷新资源列表"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          {isRefreshing && (
            <span className="text-xs text-gray-500">更新中...</span>
          )}
          {/* 【新增】实时状态指示 */}
          {isRealTimeEnabled && (
            <span className="text-xs text-green-600 dark:text-green-400">实时</span>
          )}
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