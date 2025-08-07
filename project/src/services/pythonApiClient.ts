/**
 * Python分析服务API客户端
 * 使用axios和环境变量配置
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';

// 从环境变量获取配置
const PYTHON_API_BASE_URL = import.meta.env.VITE_PYTHON_API_BASE_URL || 'http://localhost:8000';
const PYTHON_API_TIMEOUT = parseInt(import.meta.env.VITE_PYTHON_API_TIMEOUT || '60000');

export class PythonApiClient {
  private axiosInstance: AxiosInstance;
  private activeConnections: Set<EventSource> = new Set();
  private static instance: PythonApiClient | null = null;

  constructor(baseUrl: string = PYTHON_API_BASE_URL) {
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      timeout: 30000, // 30秒超时
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Python API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 获取单例实例
   */
  static getInstance(): PythonApiClient {
    if (!PythonApiClient.instance) {
      PythonApiClient.instance = new PythonApiClient();
    }
    return PythonApiClient.instance;
  }

  /**
   * 创建流式对话连接 - 优化版本
   */
  createStreamingChat(params: {
    message: string;
    conversationId?: string;
    context?: Record<string, any>;
    workflowId?: string;  // 新增：工作流ID支持
  }): EventSource {
    const queryParams = new URLSearchParams({
      message: params.message,
      conversation_id: params.conversationId || `conv-${Date.now()}`,
      context: JSON.stringify(params.context || {}),
      ...(params.workflowId && { workflow_id: params.workflowId })  // 添加workflow_id参数
    });

    const url = `${this.axiosInstance.defaults.baseURL}/api/v1/chat/stream?${queryParams.toString()}`;
    
    // 创建EventSource并进行优化配置
    const eventSource = new EventSource(url);
    
    // 添加到活跃连接池
    this.activeConnections.add(eventSource);
    
    // 设置连接超时
    const connectionTimeout = setTimeout(() => {
      console.warn('EventSource连接超时，自动关闭');
      this.closeConnection(eventSource);
    }, 120000); // 2分钟超时
    
    // 监听连接状态
    eventSource.onopen = () => {
      console.log('SSE连接已建立');
      clearTimeout(connectionTimeout);
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE连接错误:', error);
      clearTimeout(connectionTimeout);
      this.closeConnection(eventSource);
    };
    
    // 添加关闭事件监听
    const originalClose = eventSource.close.bind(eventSource);
    eventSource.close = () => {
      clearTimeout(connectionTimeout);
      this.activeConnections.delete(eventSource);
      originalClose();
    };
    
    return eventSource;
  }

  /**
   * 关闭指定连接
   */
  private closeConnection(eventSource: EventSource) {
    try {
      eventSource.close();
      this.activeConnections.delete(eventSource);
    } catch (error) {
      console.error('关闭SSE连接失败:', error);
    }
  }

  /**
   * 关闭所有活跃连接
   */
  closeAllConnections() {
    console.log(`关闭${this.activeConnections.size}个活跃连接`);
    this.activeConnections.forEach(connection => {
      try {
        connection.close();
      } catch (error) {
        console.error('关闭连接失败:', error);
      }
    });
    this.activeConnections.clear();
  }

  /**
   * 关闭特定会话的连接
   */
  closeConnectionsByConversationId(conversationId: string) {
    // 注意：EventSource API没有直接方法获取URL参数
    // 这里我们关闭所有连接作为安全措施
    console.log(`关闭会话 ${conversationId} 的连接`);
    this.closeAllConnections();
  }

  /**
   * 获取活跃连接数
   */
  getActiveConnectionCount(): number {
    return this.activeConnections.size;
  }

  /**
   * 发送普通聊天消息（非流式）
   */
  async sendChatMessage(params: {
    message: string;
    conversationId?: string;
    context?: Record<string, any>;
  }) {
    const response = await this.axiosInstance.post('/api/v1/chat/message', {
      message: params.message,
      conversation_id: params.conversationId,
      context: params.context
    });

    return response.data;
  }

  /**
   * 获取聊天历史
   */
  async getChatHistory(conversationId: string) {
    const response = await this.axiosInstance.get(`/api/v1/chat/history/${conversationId}`);
    return response.data;
  }

  /**
   * 启动AI工作流
   */
  async startWorkflow(params: {
    workflowId: string;
    query: string;
    userId?: string;
    context?: Record<string, any>;
  }) {
    const response = await this.axiosInstance.post('/api/v1/workflow/start', {
      workflow_id: params.workflowId,
      query: params.query,
      user_id: params.userId,
      context: params.context
    });

    return response.data;
  }

  /**
   * 获取工作流状态
   */
  async getWorkflowStatus(workflowId: string) {
    const response = await this.axiosInstance.get(`/api/v1/workflow/status/${workflowId}`);
    return response.data;
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      const response = await this.axiosInstance.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Python API health check failed:', error);
      return false;
    }
  }

  /**
   * 获取股票推荐
   */
  async getStockRecommendation(params: {
    keywords: string;
    limit?: number;
    userPreferences?: Record<string, any>;
  }) {
    const response = await this.axiosInstance.post('/api/v1/stock-recommendation/recommend', {
      keywords: params.keywords,
      limit: params.limit || 10,
      user_preferences: params.userPreferences || {}
    });

    return response.data;
  }

  /**
   * 智能股票分析
   */
  async smartStockAnalysis(params: {
    query: string;
    analysisType?: string;
    includeRecommendations?: boolean;
  }) {
    const response = await this.axiosInstance.post('/api/v1/smart-stock/analyze', {
      query: params.query,
      analysis_type: params.analysisType || 'comprehensive',
      include_recommendations: params.includeRecommendations ?? true
    });

    return response.data;
  }
}

// 创建默认实例
export const pythonApiClient = PythonApiClient.getInstance();

// 导出便捷方法
export const createStreamingChat = (params: {
  message: string;
  conversationId?: string;
  context?: Record<string, any>;
  workflowId?: string;  // 新增：工作流ID支持
}) => pythonApiClient.createStreamingChat(params);

export const sendChatMessage = (params: {
  message: string;
  conversationId?: string;
  context?: Record<string, any>;
}) => pythonApiClient.sendChatMessage(params);

export const getChatHistory = (conversationId: string) => 
  pythonApiClient.getChatHistory(conversationId);

export const startWorkflow = (params: {
  workflowId: string;
  query: string;
  userId?: string;
  context?: Record<string, any>;
}) => pythonApiClient.startWorkflow(params);

export const getWorkflowStatus = (workflowId: string) => 
  pythonApiClient.getWorkflowStatus(workflowId);

export default pythonApiClient; 