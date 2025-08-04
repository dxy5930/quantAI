export interface TaskContext {
  taskType?: string;
  webResources?: WebResource[];
  charts?: ChartResource[];
  files?: FileResource[];
  databases?: DatabaseResource[];
  apis?: ApiResource[];
}

export interface AgentStatus {
  currentStep: number;
  totalSteps: number;
  agents: AgentInfo[];
  isRunning: boolean;
  startTime?: Date;
}

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  progress: number;
  outputs?: string[];
  logs?: LogEntry[];
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

export interface WebResource {
  id: string;
  title: string;
  url: string;
  description?: string;
  timestamp: Date;
  status: 'loading' | 'loaded' | 'error';
}

export interface ChartResource {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'candlestick' | 'scatter';
  description?: string;
  dataUrl?: string;
  imageUrl?: string;
  timestamp: Date;
}

export interface FileResource {
  id: string;
  name: string;
  type: string;
  size: string;
  downloadUrl: string;
  timestamp: Date;
}

export interface DatabaseResource {
  id: string;
  name: string;
  tables: string[];
  description?: string;
  queryUrl?: string;
}

export interface ApiResource {
  id: string;
  name: string;
  endpoint: string;
  method: string;
  description?: string;
  documentation?: string;
} 