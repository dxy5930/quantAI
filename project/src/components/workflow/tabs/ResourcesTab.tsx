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
  Clock,
  Copy,
  Code,
  Play,
  Table as TableIcon
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // 【移除】实时轮询控制与开关
  // const [isRealTimeEnabled, setIsRealTimeEnabled] = useState<boolean>(true);

  // 记录上次已知资源ID集合，用于检测新增
  const prevResourceIdsRef = React.useRef<Set<string>>(new Set());

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const buildCurl = (resource: any) => {
    try {
      const method = String(resource?.data?.method || 'GET').toUpperCase();
      const endpoint = String(resource?.data?.endpoint || resource?.data?.url || '');
      let cmd = `curl -X ${method} '${endpoint}'`;
      const headers = resource?.data?.headers || {};
      const headerParts = Object.entries(headers).map(([k, v]) => `-H '${k}: ${v}'`);
      if (headerParts.length > 0) cmd += ' ' + headerParts.join(' ');
      const body = resource?.data?.body;
      if (body && method !== 'GET') {
        cmd += ` -H 'Content-Type: application/json' -d '${JSON.stringify(body)}'`;
      }
      return cmd;
    } catch {
      return 'curl --help';
    }
  };

  const renderJsonPreview = (obj: any) => {
    try {
      const text = JSON.stringify(obj, null, 2);
      return (
        <pre className="mt-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded p-2 overflow-x-auto">
          <code>{text}</code>
        </pre>
      );
    } catch {
      return null;
    }
  };

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

      // 检测新增项
      const prevIds = prevResourceIdsRef.current;
      const currentIds = new Set<string>(transformedResources.map((r: any) => String(r.id)));
      const newItems = transformedResources.filter((r: any) => !prevIds.has(String(r.id)));
      // 更新引用
      prevResourceIdsRef.current = currentIds;

      setRemoteResources(transformedResources);

      // 如有新增，通知聊天区
      if (newItems.length > 0 && (window as any).appendWorkflowLog) {
        const names = newItems.slice(0, 3).map((r: any) => r.title || r.id);
        const more = newItems.length > 3 ? ` 等共 ${newItems.length} 条` : '';
        (window as any).appendWorkflowLog({
          workflowId,
          content: `资源新增：${names.join('、')}${more}`
        });
      }
    } catch (error) {
      console.error('获取工作流资源失败:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [workflowId]);

  // 初始化与切换workflow时拉取一次
  useEffect(() => {
    if (!workflowId) return;
    // 切换工作流时清空已知集合，避免跨工作流误判
    prevResourceIdsRef.current = new Set();
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

    // 网页类型资源
    if (resource.type === 'web') {
      if (openIfHttp(maybeUrl)) return;
    }

    // 文件类型资源
    if (resource.type === 'file') {
      const downloadUrl = (resource as any).data?.downloadUrl || (resource as any).data?.file_path;
      if (downloadUrl) {
        // 如果是blob URL或http URL，直接打开
        if (downloadUrl.startsWith('blob:') || openIfHttp(downloadUrl)) {
          const w = window.open(downloadUrl, '_blank');
          if (w) w.opener = null;
          return;
        }
      }
    }

    // API类型资源
    if (resource.type === 'api') {
      const docUrl = (resource as any).data?.documentation;
      if (openIfHttp(docUrl)) return;
      
      // 如果没有文档链接，展示详细信息
      setExpandedId(expandedId === resource.id ? null : resource.id);
      return;
    }

    // 图表类型资源
    if (resource.type === 'chart') {
      const imageUrl = resource.data?.imageUrl || resource.data?.dataUrl;
      if (imageUrl) {
        const w = window.open(imageUrl, '_blank');
        if (w) w.opener = null;
        return;
      }
    }

    // 数据库类型资源
    if (resource.type === 'database') {
      // 展示数据库详细信息
      setExpandedId(expandedId === resource.id ? null : resource.id);
      return;
    }

    // 通用类型资源
    if (resource.type === 'general') {
      // 尝试打开URL
      if (openIfHttp(maybeUrl)) return;
      
      // 如果有文件下载链接
      const downloadUrl = resource.data?.downloadUrl || resource.data?.fileUrl;
      if (downloadUrl) {
        if (downloadUrl.startsWith('blob:') || openIfHttp(downloadUrl)) {
          const w = window.open(downloadUrl, '_blank');
          if (w) w.opener = null;
          return;
        }
      }
      
      // 如果有内容，展示详细信息
      if (resource.data?.content || resource.description) {
        setExpandedId(expandedId === resource.id ? null : resource.id);
        return;
      }
    }

    // 默认行为：切换详细信息显示
    setExpandedId(expandedId === resource.id ? null : resource.id);
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
                    
                    {resource.type === 'database' && (
                      <div className="text-xs text-gray-400 flex items-center flex-wrap gap-1">
                        <TableIcon className="w-3 h-3 mr-1" />
                        {Array.isArray(resource.data?.tables) && resource.data.tables.length > 0 ? (
                          <>
                            <span>表:</span>
                            {resource.data.tables.slice(0, 6).map((t: any, idx: number) => (
                              <span key={idx} className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{String(t)}</span>
                            ))}
                            {resource.data.tables.length > 6 && (
                              <span className="text-gray-400">…{resource.data.tables.length - 6}更多</span>
                            )}
                          </>
                        ) : (
                          <span>数据源: {String(resource.data?.name || '未知')}</span>
                        )}
                      </div>
                    )}
                    
                    {resource.type === 'api' && resource.data.method && resource.data.endpoint && (
                      <div className="text-xs text-gray-400 font-mono">
                        {resource.data.method} {resource.data.endpoint}
                      </div>
                    )}
                    
                    {resource.type === 'chart' && resource.data?.imageUrl && (
                      <div className="mt-2">
                        <img src={resource.data.imageUrl} alt={resource.title} className="max-h-40 rounded border border-gray-200 dark:border-gray-700" />
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
                  {/* 通用详情按钮 */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === resource.id ? null : resource.id); }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                    title={expandedId === resource.id ? '收起详情' : '查看详情'}
                  >
                    <Code className="w-3 h-3 text-gray-400" />
                  </button>
                  
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

                  {resource.type === 'chart' && (resource.data?.imageUrl || resource.data?.dataUrl) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = resource.data?.imageUrl || resource.data?.dataUrl;
                        if (typeof url === 'string') {
                          const w = window.open(url, '_blank', 'noopener,noreferrer');
                          if (w) w.opener = null;
                        }
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                      title="下载图表"
                    >
                      <Download className="w-3 h-3 text-gray-400" />
                    </button>
                  )}
                  
                  {resource.type === 'general' && resource.data?.downloadUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = resource.data.downloadUrl;
                        if (url) {
                          const w = window.open(url, '_blank');
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

              {/* 详情展开区：API / 数据库 */}
              {expandedId === resource.id && (
                <div className="mt-3 border-t border-dashed border-gray-200 dark:border-gray-700 pt-3 text-xs">
                  {resource.type === 'api' && (
                    <div className="space-y-2">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 font-mono">{String(resource.data?.method || 'GET')}</span>
                        <span className="font-mono break-all">{String(resource.data?.endpoint || resource.data?.url || '')}</span>
                      </div>
                      {resource.data?.params && (
                        <div>
                          <div className="text-gray-500 mb-1">请求参数</div>
                          {renderJsonPreview(resource.data.params)}
                        </div>
                      )}
                      {(resource.data?.sampleResponse || resource.data?.response || resource.data?.example) && (
                        <div>
                          <div className="text-gray-500 mb-1">响应示例</div>
                          {renderJsonPreview(resource.data.sampleResponse || resource.data.response || resource.data.example)}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                          onClick={(e) => { e.stopPropagation(); copyText(buildCurl(resource)); }}
                          title="复制 cURL"
                        >
                          <span className="inline-flex items-center gap-1"><Copy className="w-3 h-3"/>复制 cURL</span>
                        </button>
                        {resource.data?.documentation && (
                          <button
                            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                            onClick={(e) => { e.stopPropagation(); const w = window.open(resource.data.documentation, '_blank', 'noopener,noreferrer'); if (w) w.opener = null; }}
                            title="打开文档"
                          >
                            <span className="inline-flex items-center gap-1"><ExternalLink className="w-3 h-3"/>文档</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {resource.type === 'database' && (
                    <div className="space-y-2">
                      <div className="text-gray-500">数据源：{String(resource.data?.name || '未知')}</div>
                      {Array.isArray(resource.data?.tables) && resource.data.tables.length > 0 && (
                        <div>
                          <div className="text-gray-500 mb-1">表列表</div>
                          <div className="flex flex-wrap gap-1">
                            {resource.data.tables.map((t: any, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">{String(t)}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {resource.data?.preview && (
                        <div>
                          <div className="text-gray-500 mb-1">数据预览</div>
                          {renderJsonPreview(resource.data.preview)}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {resource.data?.queryUrl && (
                          <button
                            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                            onClick={(e) => { e.stopPropagation(); const w = window.open(resource.data.queryUrl, '_blank', 'noopener,noreferrer'); if (w) w.opener = null; }}
                            title="打开查询页面"
                          >
                            <span className="inline-flex items-center gap-1"><ExternalLink className="w-3 h-3"/>打开查询</span>
                          </button>
                        )}
                        {resource.data?.dsn && (
                          <button
                            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                            onClick={(e) => { e.stopPropagation(); copyText(String(resource.data.dsn)); }}
                            title="复制连接串"
                          >
                            <span className="inline-flex items-center gap-1"><Copy className="w-3 h-3"/>复制连接</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {resource.type === 'general' && (
                    <div className="space-y-2">
                      {resource.data?.content && (
                        <div>
                          <div className="text-gray-500 mb-1">内容预览</div>
                          <div className="text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded p-2 max-h-40 overflow-y-auto">
                            <pre className="whitespace-pre-wrap break-words">{String(resource.data.content).slice(0, 500)}{String(resource.data.content).length > 500 ? '...' : ''}</pre>
                          </div>
                        </div>
                      )}
                      {resource.data?.format && (
                        <div className="text-gray-500">格式：{String(resource.data.format)}</div>
                      )}
                      <div className="flex items-center gap-2">
                        {resource.data?.downloadUrl && (
                          <button
                            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                            onClick={(e) => { e.stopPropagation(); const w = window.open(resource.data.downloadUrl, '_blank'); if (w) w.opener = null; }}
                            title="下载文件"
                          >
                            <span className="inline-flex items-center gap-1"><Download className="w-3 h-3"/>下载</span>
                          </button>
                        )}
                        {resource.data?.content && (
                          <button
                            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                            onClick={(e) => { e.stopPropagation(); copyText(String(resource.data.content)); }}
                            title="复制内容"
                          >
                            <span className="inline-flex items-center gap-1"><Copy className="w-3 h-3"/>复制内容</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
});

export default ResourcesTab; 