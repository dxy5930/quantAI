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
  // 【移除】实时轮询控制与开关
  // const [isRealTimeEnabled, setIsRealTimeEnabled] = useState<boolean>(true);

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
        timestamp: new Date(r.created_at || Date.now()),
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

  // 初始化与切换workflow时拉取一次
  useEffect(() => {
    if (!workflowId) return;
    fetchRemoteResources();
  }, [workflowId, fetchRemoteResources]);

  // 注册全局刷新函数，供SSE事件调用（始终刷新）
  useEffect(() => {
    (window as any).workflowResourceRefresh = () => {
      if (workflowId) {
        console.log('SSE触发工作流资源实时刷新');
        fetchRemoteResources();
      }
    };
    return () => {
      if ((window as any).workflowResourceRefresh) {
        delete (window as any).workflowResourceRefresh;
      }
    };
  }, [workflowId, fetchRemoteResources]);

  // 当工作流状态变化时，确保刷新可用
  useEffect(() => {
    if (workflowId) {
      // nothing，保持实时
    }
  }, [workflowId]);

  // 聚合资源：仅使用远程资源（去除本地上下文和临时资源，避免重复）
  useEffect(() => {
    // 合并远程与本地资源，远程优先（在前面）
    const combined: WorkflowResource[] = [
      ...(remoteResources || []),
      ...(workflowResources || [])
    ];

    // 按资源“语义主键”去重，避免同一链接/接口重复
    const makeKey = (r: WorkflowResource) => {
      try {
        const data: any = r.data || {};
        switch (r.type) {
          case 'web':
            return `web:${data.url || data.link || data.queryUrl || r.title}`;
          case 'api':
            return `api:${data.endpoint || data.documentation || r.title}`;
          case 'database':
            return `db:${data.name || r.title}`;
          case 'file':
            return `file:${data.downloadUrl || data.file_path || r.title}`;
          default:
            return `${r.type}:${r.id || r.title}`;
        }
      } catch {
        return r.id;
      }
    };

    const map = new Map<string, WorkflowResource>();
    for (const r of combined) {
      const key = makeKey(r);
      if (!map.has(key)) map.set(key, r);
    }

    const merged = Array.from(map.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
    setResources(merged);
  }, [remoteResources, workflowResources]);

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
    const openIfHttp = (u?: string) => {
      if (typeof u === 'string' && /^https?:\/\//.test(u)) {
        const w = window.open(u, '_blank', 'noopener,noreferrer');
        if (w) w.opener = null;
        return true;
      }
      return false;
    };

    // 优先使用标准化 urls 数组中的第一个
    const urls: string[] = Array.isArray((resource as any).data?.urls)
      ? (resource as any).data.urls
      : Array.isArray((resource as any).urls)
        ? (resource as any).urls
        : [];
    for (const u of urls) {
      if (openIfHttp(u)) return;
    }

    const maybeUrl = resource?.data?.url || resource?.data?.link || resource?.data?.queryUrl;

    if (resource.type === 'web') {
      if (openIfHttp(maybeUrl)) return;
    }

    if (resource.type === 'file' && (resource as any).data?.downloadUrl) {
      const url = (resource as any).data?.downloadUrl || (resource as any).data?.file_path;
      if (openIfHttp(url)) return;
    }

    if (resource.type === 'api') {
      const docUrl = (resource as any).data?.documentation;
      if (openIfHttp(docUrl)) return;
    }

    // 对于通用资源里携带的url，也尝试打开
    if (openIfHttp(maybeUrl)) return;
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
          {/* 实时指示点（无开关） */}
          <div className="p-1 rounded bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400" title="实时更新">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <button 
            onClick={fetchRemoteResources}
            disabled={isRefreshing || !workflowId}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
            title={!workflowId ? '请先选择左侧工作流' : '手动刷新资源列表'}
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          {isRefreshing && (
            <span className="text-xs text-gray-500">更新中...</span>
          )}
          <span className="text-xs text-green-600 dark:text-green-400">实时</span>
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
                        const url = resource.data?.url;
                        if (typeof url === 'string' && url.startsWith('http')) {
                          const w = window.open(url, '_blank', 'noopener,noreferrer');
                          if (w) w.opener = null;
                        }
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
                        const url = resource.data?.downloadUrl || resource.data?.file_path;
                        if (typeof url === 'string' && url) {
                          const w = window.open(url, '_blank', 'noopener,noreferrer');
                          if (w) w.opener = null;
                        }
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