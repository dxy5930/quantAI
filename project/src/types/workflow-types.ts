// 节点类型定义
export type NodeType = 
  | 'browser'        // 浏览器类型
  | 'database'       // 数据库类型  
  | 'api'            // API接口类型
  | 'file'           // 文件处理类型
  | 'chart'          // 图表生成类型
  | 'analysis'       // 分析计算类型
  | 'crawler'        // 爬虫采集类型
  | 'notification';  // 通知类型

// 工作流节点定义
export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  config?: Record<string, any>;
}

// 浏览器资源
export interface BrowserResource {
  id: string;
  type: 'browser';
  tabs: BrowserTab[];
  activeTabId?: string;
}

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  status: 'loading' | 'loaded' | 'error';
  screenshot?: string;
  content?: string;
  timestamp: Date;
}

// 数据库资源
export interface DatabaseResource {
  id: string;
  type: 'database';
  name: string;
  connectionInfo: {
    host: string;
    database: string;
    status: 'connected' | 'disconnected' | 'error';
  };
  tables: DatabaseTable[];
  queries: DatabaseQuery[];
}

export interface DatabaseTable {
  id: string;
  name: string;
  rowCount: number;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
  }>;
}

export interface DatabaseQuery {
  id: string;
  sql: string;
  timestamp: Date;
  status: 'executing' | 'completed' | 'error';
  results?: any[];
  rowCount?: number;
  executionTime?: number;
}

// API资源
export interface ApiResource {
  id: string;
  type: 'api';
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requests: ApiRequest[];
  documentation?: string;
}

export interface ApiRequest {
  id: string;
  timestamp: Date;
  status: 'pending' | 'success' | 'error';
  responseTime?: number;
  request: {
    headers?: Record<string, string>;
    body?: any;
    params?: Record<string, string>;
  };
  response?: {
    status: number;
    headers?: Record<string, string>;
    body?: any;
  };
}

// 文件资源
export interface FileResource {
  id: string;
  type: 'file';
  files: ProcessedFile[];
  operations: FileOperation[];
}

export interface ProcessedFile {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  status: 'processing' | 'completed' | 'error';
  preview?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface FileOperation {
  id: string;
  type: 'read' | 'write' | 'transform' | 'analyze';
  status: 'pending' | 'running' | 'completed' | 'error';
  input: string;
  output?: string;
  timestamp: Date;
}

// 图表资源
export interface ChartResource {
  id: string;
  type: 'chart';
  charts: GeneratedChart[];
  templates: ChartTemplate[];
}

export interface GeneratedChart {
  id: string;
  title: string;
  chartType: 'line' | 'bar' | 'pie' | 'candlestick' | 'scatter' | 'heatmap';
  dataSource: string;
  config: Record<string, any>;
  imageUrl?: string;
  dataUrl?: string;
  timestamp: Date;
  status: 'generating' | 'completed' | 'error';
}

export interface ChartTemplate {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  preview?: string;
}

// 分析资源
export interface AnalysisResource {
  id: string;
  type: 'analysis';
  reports: AnalysisReport[];
  metrics: AnalysisMetric[];
}

export interface AnalysisReport {
  id: string;
  title: string;
  type: 'technical' | 'fundamental' | 'sentiment' | 'risk';
  status: 'analyzing' | 'completed' | 'error';
  content: string;
  insights: string[];
  confidence: number;
  timestamp: Date;
}

export interface AnalysisMetric {
  id: string;
  name: string;
  value: number;
  unit?: string;
  change?: number;
  trend: 'up' | 'down' | 'stable';
  timestamp: Date;
}

// 爬虫资源
export interface CrawlerResource {
  id: string;
  type: 'crawler';
  targets: CrawlerTarget[];
  data: CrawledData[];
  logs: CrawlerLog[];
}

export interface CrawlerTarget {
  id: string;
  url: string;
  selector?: string;
  status: 'pending' | 'crawling' | 'completed' | 'error';
  itemsCollected: number;
  lastRun?: Date;
}

export interface CrawledData {
  id: string;
  source: string;
  data: Record<string, any>;
  timestamp: Date;
  quality: 'high' | 'medium' | 'low';
}

export interface CrawlerLog {
  id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
}

// 通知资源
export interface NotificationResource {
  id: string;
  type: 'notification';
  channels: NotificationChannel[];
  messages: NotificationMessage[];
}

export interface NotificationChannel {
  id: string;
  type: 'email' | 'sms' | 'webhook' | 'slack' | 'dingtalk';
  name: string;
  config: Record<string, any>;
  status: 'active' | 'inactive' | 'error';
}

export interface NotificationMessage {
  id: string;
  channelId: string;
  title: string;
  content: string;
  status: 'pending' | 'sent' | 'failed';
  timestamp: Date;
  retryCount?: number;
}

// 节点资源联合类型
export type NodeResource = 
  | BrowserResource
  | DatabaseResource 
  | ApiResource
  | FileResource
  | ChartResource
  | AnalysisResource
  | CrawlerResource
  | NotificationResource;

// 节点状态更新事件
export interface NodeStatusUpdate {
  nodeId: string;
  status: WorkflowNode['status'];
  progress: number;
  message?: string;
  timestamp: Date;
} 