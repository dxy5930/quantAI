import { httpClient } from '../../utils/httpClient';
import { UnifiedApiResponse } from '../../types';

// 获取 API 前缀
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

// AI工作流相关类型定义
export interface WorkflowRequest {
  query: string;
  userId?: string;
  context?: Record<string, any>;
}

export interface WorkflowResponse {
  workflowId: string;
  executionId?: string;
  status: 'started' | 'running' | 'completed' | 'error';
  message: string;
  agents?: AgentStatus[];
  nodeStatuses?: Record<string, any>;
  results?: WorkflowResults;
  progress?: number;
  currentNode?: string;
}

export interface AgentStatus {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  message?: string;
  result?: any;
  startTime?: string;
  endTime?: string;
}

export interface WorkflowResults {
  marketAnalysis?: {
    trend: string;
    sentiment: string;
    volatility: string;
    keyFactors: string[];
  };
  stockRecommendations?: {
    symbol: string;
    name: string;
    score: number;
    reason: string;
    targetPrice?: number;
    riskLevel: 'low' | 'medium' | 'high';
    sector: string;
  }[];
  strategies?: {
    name: string;
    description: string;
    expectedReturn: string;
    riskLevel: 'low' | 'medium' | 'high';
    stocks: string[];
    allocation: Record<string, number>;
  }[];
  riskAssessment?: {
    overallRisk: 'low' | 'medium' | 'high';
    factors: string[];
    recommendations: string[];
  };
  summary?: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  workflowId?: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  context?: Record<string, any>;
}

export interface ChatResponse {
  message: ChatMessage;
  conversationId: string;
  shouldStartWorkflow?: boolean;
  workflowQuery?: string;
}

// 新增工作流画布相关类型定义
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  status: 'idle' | 'running' | 'completed' | 'error';
  createdAt: Date;
  updatedAt: Date;
  config?: Record<string, any>;
  metadata?: Record<string, any>;
  tags?: string[];
  version?: number;
}

export interface WorkflowNode {
  id: string;
  type: 'data' | 'analysis' | 'strategy' | 'risk' | 'output' | 'custom';
  name: string;
  description: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  inputs: string[];
  outputs: string[];
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  result?: any;
}

export interface WorkflowConnection {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePort: string;
  targetPort: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  nodeCount: number;
}

export interface WorkflowSaveRequest {
  workflow: WorkflowDefinition;
  userId?: string;
}

export interface WorkflowRunRequest {
  workflowDefinition: WorkflowDefinition;
  userId?: string;
  context?: Record<string, any>;
}

export interface WorkflowValidationRequest {
  workflow: WorkflowDefinition;
}

export interface WorkflowValidationResponse {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

class AIWorkflowApi {

  /**
   * 启动AI工作流
   */
  async startWorkflow(request: WorkflowRequest): Promise<UnifiedApiResponse<WorkflowResponse>> {
    return httpClient.post(`${API_PREFIX}/ai-workflow/start`, request);
  }

  /**
   * 获取工作流状态
   */
  async getWorkflowStatus(workflowId: string): Promise<UnifiedApiResponse<WorkflowResponse>> {
    return httpClient.get(`${API_PREFIX}/ai-workflow/status/${workflowId}`);
  }

  /**
   * 获取工作流执行状态
   */
  async getWorkflowExecutionStatus(executionId: string): Promise<UnifiedApiResponse<WorkflowResponse>> {
    return httpClient.get(`${API_PREFIX}/ai-workflow/execution/status/${executionId}`);
  }

  /**
   * 停止工作流
   */
  async stopWorkflow(workflowId: string): Promise<UnifiedApiResponse<{ message: string }>> {
    return httpClient.post(`${API_PREFIX}/ai-workflow/stop/${workflowId}`);
  }

  /**
   * 获取工作流结果
   */
  async getWorkflowResults(workflowId: string): Promise<UnifiedApiResponse<WorkflowResults>> {
    return httpClient.get(`${API_PREFIX}/ai-workflow/results/${workflowId}`);
  }

  /**
   * 发送聊天消息
   */
  async sendChatMessage(request: ChatRequest): Promise<UnifiedApiResponse<ChatResponse>> {
    return httpClient.post(`${API_PREFIX}/ai-workflow/chat`, request);
  }

  /**
   * 获取聊天历史
   */
  async getChatHistory(conversationId: string): Promise<UnifiedApiResponse<ChatMessage[]>> {
    return httpClient.get(`${API_PREFIX}/ai-workflow/chat/history/${conversationId}`);
  }

  /**
   * 获取智能体列表
   */
  async getAgents(): Promise<UnifiedApiResponse<AgentStatus[]>> {
    return httpClient.get(`${API_PREFIX}/ai-workflow/agents`);
  }

  /**
   * 获取用户的工作流历史（不分页，获取所有记录）
   */
  async getWorkflowHistory(): Promise<UnifiedApiResponse<{
    workflows: WorkflowResponse[];
    total: number;
  }>> {
    return httpClient.post(`${API_PREFIX}/ai-workflow/history`, {});
  }

  /**
   * 分析股票或策略
   */
  async analyzeStock(symbol: string): Promise<UnifiedApiResponse<{
    analysis: any;
    recommendations: string[];
  }>> {
    return httpClient.post(`${API_PREFIX}/ai-workflow/analyze/stock`, { symbol });
  }

  /**
   * 生成投资策略
   */
  async generateStrategy(request: {
    riskTolerance: 'low' | 'medium' | 'high';
    investmentGoal: string;
    timeHorizon: 'short' | 'medium' | 'long';
    sectors?: string[];
    excludeStocks?: string[];
  }): Promise<UnifiedApiResponse<{
    strategies: WorkflowResults['strategies'];
    reasoning: string;
  }>> {
    return httpClient.post(`${API_PREFIX}/ai-workflow/generate/strategy`, request);
  }

  /**
   * 获取市场洞察
   */
  async getMarketInsights(): Promise<UnifiedApiResponse<{
    insights: {
      title: string;
      content: string;
      type: 'bullish' | 'bearish' | 'neutral';
      confidence: number;
      timestamp: string;
    }[];
    marketSummary: WorkflowResults['marketAnalysis'];
  }>> {
    return httpClient.get(`${API_PREFIX}/ai-workflow/insights`);
  }

  // 新增工作流画布相关方法

  /**
   * 创建新工作流定义
   */
  async createWorkflow(request: WorkflowSaveRequest): Promise<UnifiedApiResponse<WorkflowDefinition>> {
    return httpClient.post(`${API_PREFIX}/ai-workflow/workflow/create`, request);
  }

  /**
   * 更新现有工作流定义
   */
  async updateWorkflow(workflowId: string, request: WorkflowSaveRequest): Promise<UnifiedApiResponse<WorkflowDefinition>> {
    return httpClient.put(`${API_PREFIX}/ai-workflow/workflow/${workflowId}`, request);
  }

  /**
   * 运行工作流定义
   */
  async runWorkflow(request: WorkflowRunRequest): Promise<UnifiedApiResponse<WorkflowResponse>> {
    return httpClient.post(`${API_PREFIX}/ai-workflow/workflow/run`, request);
  }

  /**
   * 获取工作流定义
   */
  async getWorkflow(workflowId: string): Promise<UnifiedApiResponse<WorkflowDefinition>> {
    return httpClient.get(`${API_PREFIX}/ai-workflow/workflow/${workflowId}`);
  }

  /**
   * 获取工作流模板列表
   */
  async getWorkflowTemplates(): Promise<UnifiedApiResponse<WorkflowTemplate[]>> {
    return httpClient.get(`${API_PREFIX}/ai-workflow/workflow/templates/list`);
  }

  /**
   * 验证工作流定义
   */
  async validateWorkflow(request: WorkflowValidationRequest): Promise<UnifiedApiResponse<WorkflowValidationResponse>> {
    return httpClient.post(`${API_PREFIX}/ai-workflow/workflow/validate`, request);
  }

  /**
   * 删除工作流定义
   */
  async deleteWorkflow(workflowId: string): Promise<UnifiedApiResponse<{ message: string }>> {
    return httpClient.delete(`${API_PREFIX}/ai-workflow/workflow/${workflowId}`);
  }

  /**
   * 复制工作流定义
   */
  async duplicateWorkflow(workflowId: string, newName?: string): Promise<UnifiedApiResponse<WorkflowDefinition>> {
    return httpClient.post(`${API_PREFIX}/ai-workflow/workflow/${workflowId}/duplicate`, { newName });
  }

  /**
   * 获取用户的工作流定义列表
   */
  async getUserWorkflows(page = 1, limit = 20): Promise<UnifiedApiResponse<{
    workflows: WorkflowDefinition[];
    total: number;
    page: number;
    limit: number;
  }>> {
    return httpClient.get(`${API_PREFIX}/ai-workflow/workflow/list`, {
      params: { page, limit }
    });
  }



  /**
   * 导入工作流定义
   */
  async importWorkflow(workflowData: WorkflowDefinition): Promise<UnifiedApiResponse<WorkflowDefinition>> {
    return httpClient.post(`${API_PREFIX}/ai-workflow/workflow/import`, { workflow: workflowData });
  }

  /**
   * 导出工作流定义
   */
  async exportWorkflow(workflowId: string): Promise<UnifiedApiResponse<WorkflowDefinition>> {
    return httpClient.get(`${API_PREFIX}/ai-workflow/workflow/${workflowId}/export`);
  }
}

export const aiWorkflowApi = new AIWorkflowApi();
export default aiWorkflowApi;