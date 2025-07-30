import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

export interface PythonApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

export interface WorkflowStartRequest {
  workflow_id: string;
  query: string;
  user_id?: string;
  context?: Record<string, any>;
}

export interface WorkflowDefinitionRunRequest {
  execution_id: string;
  workflow_definition: any;
  user_id?: string;
  context?: Record<string, any>;
}

export interface ChatAnalyzeRequest {
  message: string;
  context?: Record<string, any>;
}

export interface StockAnalyzeRequest {
  symbol: string;
}

export interface StrategyGenerateRequest {
  riskTolerance: string;
  investmentGoal: string;
  timeHorizon: string;
  sectors?: string[];
  excludeStocks?: string[];
  userId?: string;
}

export interface KeywordExtractionRequest {
  query: string;
  max_keywords?: number;
}

export interface StockRecommendationRequest {
  query: string;
  limit?: number;
  min_market_cap?: number;
  min_roe?: number;
  structured_conditions?: Array<{
    field: string;
    operator: string;
    value: any;
    period?: string;
  }>;
}

export interface TradingCondition {
  type: "price" | "technical" | "fundamental" | "time";
  operator: ">" | "<" | ">=" | "<=" | "=" | "cross_above" | "cross_below";
  value: number | string;
  indicator?: string;
  period?: number;
  description?: string;
}

export interface TradingRule {
  buyConditions: TradingCondition[];
  buyAmount: number;
  buyAmountType: "fixed" | "percentage";
  sellConditions: TradingCondition[];
  sellAmount: number;
  sellAmountType: "fixed" | "percentage";
  stopLoss?: number;
  takeProfit?: number;
  maxPositionSize?: number;
  minHoldingPeriod?: number;
  maxHoldingPeriod?: number;
}

export interface BacktestRequest {
  strategy_id: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  symbols: string[];
  weights?: number[];
  rebalance_frequency?: string;
  commission?: number;
  backtest_type?: string;
  parameters?: Record<string, any>;
  
  // 新增交易规则
  trading_rules?: TradingRule;
  slippage?: number;
  min_trade_amount?: number;
}

@Injectable()
export class PythonApiClient {
  private readonly config: PythonApiConfig;

  constructor(
    private readonly configService: ConfigService
  ) {
    // 构建Python服务配置
    const protocol =
      this.configService.get<string>("PYTHON_SERVICE_PROTOCOL") || "http";
    const host =
      this.configService.get<string>("PYTHON_SERVICE_HOST") || "localhost";
    const port =
      this.configService.get<string>("PYTHON_SERVICE_PORT") || "8000";

    // 优先使用完整URL配置，否则使用分离的配置
    // 注意：baseUrl不包含API前缀，因为具体的API路径已经包含了完整前缀
    const baseUrl =
      this.configService.get<string>("PYTHON_SERVICE_URL") ||
      `${protocol}://${host}:${port}`;

    this.config = {
      baseUrl,
      timeout:
        this.configService.get<number>("PYTHON_SERVICE_TIMEOUT") || 300000, // 5分钟超时，适配回测服务
      retries: this.configService.get<number>("PYTHON_SERVICE_RETRIES") || 2, // 减少重试次数
    };

    console.log(
      `Python API客户端初始化，服务URL: ${this.config.baseUrl}, 超时: ${this.config.timeout}ms`
    );
  }

  /**
   * 工作流相关API
   */
  async startWorkflow(request: WorkflowStartRequest): Promise<any> {
    return this.makeRequest("POST", "/api/v1/workflow/start", request);
  }

  async getWorkflowStatus(workflowId: string): Promise<any> {
    return this.makeRequest("GET", `/api/v1/workflow/status/${workflowId}`);
  }

  async stopWorkflow(workflowId: string): Promise<any> {
    return this.makeRequest("POST", `/api/v1/workflow/stop/${workflowId}`);
  }

  async getWorkflowResults(workflowId: string): Promise<any> {
    return this.makeRequest("GET", `/api/v1/workflow/results/${workflowId}`);
  }

  async getWorkflowHistory(userId: string): Promise<any> {
    return this.makeRequest("GET", `/api/v1/workflow/history/${userId}`);
  }

  /**
   * 工作流画布相关API
   */
  async runWorkflowDefinition(request: WorkflowDefinitionRunRequest): Promise<any> {
    return this.makeRequest("POST", "/api/v1/workflow/definition/run", request);
  }

  async getWorkflowExecutionStatus(executionId: string): Promise<any> {
    return this.makeRequest("GET", `/api/v1/workflow/execution/status/${executionId}`);
  }

  async stopWorkflowExecution(executionId: string): Promise<any> {
    return this.makeRequest("POST", `/api/v1/workflow/execution/stop/${executionId}`);
  }

  async getWorkflowExecutionResults(executionId: string): Promise<any> {
    return this.makeRequest("GET", `/api/v1/workflow/execution/results/${executionId}`);
  }

  async validateWorkflowDefinition(workflowDefinition: any): Promise<any> {
    return this.makeRequest("POST", "/api/v1/workflow/definition/validate", {
      workflow_definition: workflowDefinition
    });
  }

  /**
   * 聊天相关API
   */
  async analyzeChatMessage(request: ChatAnalyzeRequest): Promise<any> {
    return this.makeRequest("POST", "/api/v1/chat/analyze", request);
  }

  async sendChatMessage(request: any): Promise<any> {
    return this.makeRequest("POST", "/api/v1/chat/message", request);
  }

  async getChatHistory(conversationId: string): Promise<any> {
    return this.makeRequest("GET", `/api/v1/chat/history/${conversationId}`);
  }

  /**
   * 智能体相关API
   */
  async getAgents(): Promise<any> {
    return this.makeRequest("GET", "/api/v1/agents");
  }

  /**
   * 分析相关API
   */
  async analyzeStock(request: StockAnalyzeRequest): Promise<any> {
    return this.makeRequest("POST", "/api/v1/analyze/stock", request);
  }

  async generateStrategy(request: StrategyGenerateRequest): Promise<any> {
    return this.makeRequest("POST", "/api/v1/generate/strategy", request);
  }

  /**
   * 关键词提取API
   */
  async extractKeywords(request: KeywordExtractionRequest): Promise<any> {
    return this.makeRequest(
      "POST",
      "/api/v1/stock-recommendation/analyze-keywords",
      request
    );
  }

  /**
   * 股票推荐API
   */
  async recommendStocks(request: StockRecommendationRequest): Promise<any> {
    return this.makeRequest(
      "POST",
      "/api/v1/stock-recommendation/recommend",
      request
    );
  }

  /**
   * 回测相关API
   */
  async runBacktest(request: BacktestRequest): Promise<any> {
    console.log(`[PythonAPI] 发起回测请求:`, {
      strategy_id: request.strategy_id,
      symbols: request.symbols,
      start_date: request.start_date,
      end_date: request.end_date,
    });

    return this.makeRequest("POST", "/api/v1/backtest/run", request);
  }

  /**
   * 股票详情API
   */
  async getStockDetail(symbol: string): Promise<any> {
    return this.makeRequest("GET", `/api/v1/smart-stock/detail/${symbol}`);
  }

  /**
   * 市场相关API
   */
  async getMarketInsights(): Promise<any> {
    return this.makeRequest("GET", "/api/v1/market/insights");
  }

  /**
   * 通用请求方法 - 使用直接的axios调用
   */
  private async makeRequest(
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    data?: any,
    retryCount = 0
  ): Promise<any> {
    try {
      const url = `${this.config.baseUrl}${endpoint}`;

      console.log(
        `[PythonAPI] ${method} ${url}`,
        data ? { dataKeys: Object.keys(data) } : ""
      );

      const requestConfig = {
        timeout: this.config.timeout,
        headers: {
          "Content-Type": "application/json",
        },
      };

      let response: any;

      // 使用直接的axios调用，避免NestJS HttpService的潜在问题
      switch (method) {
        case "GET":
          response = await axios.get(url, requestConfig);
          break;
        case "POST":
          response = await axios.post(url, data, requestConfig);
          break;
        case "PUT":
          response = await axios.put(url, data, requestConfig);
          break;
        case "DELETE":
          response = await axios.delete(url, requestConfig);
          break;
      }

      console.log(`[PythonAPI] ${method} ${url} - 成功:`, response.status);
      console.log(`[PythonAPI] 响应数据结构:`, {
        hasData: !!response.data,
        dataType: typeof response.data,
        hasSuccess: response.data?.success !== undefined,
        successValue: response.data?.success,
      });

      return response.data;
    } catch (error: any) {
      console.error(`[PythonAPI] ${method} ${endpoint} - 失败:`, {
        errorType: error.constructor.name,
        status: error.response?.status,
        message: error.message,
        code: error.code,
        data: error.response?.data,
      });

      // 重试逻辑
      if (retryCount < this.config.retries && this.shouldRetry(error)) {
        console.log(
          `[PythonAPI] 重试 ${retryCount + 1}/${this.config.retries}: ${method} ${endpoint}`
        );
        await this.delay(1000 * (retryCount + 1)); // 递增延迟
        return this.makeRequest(method, endpoint, data, retryCount + 1);
      }

      // 抛出标准化错误
      throw this.createStandardError(error, endpoint);
    }
  }

  /**
   * 判断是否应该重试
   */
  private shouldRetry(error: any): boolean {
    // 网络错误或5xx服务器错误可以重试
    if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
      return true;
    }

    if (error.response?.status >= 500) {
      return true;
    }

    return false;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 创建标准化错误
   */
  private createStandardError(error: any, endpoint: string): Error {
    const message =
      error.response?.data?.message ||
      error.message ||
      `Python API调用失败: ${endpoint}`;

    const standardError = new Error(message);
    (standardError as any).status = error.response?.status || 500;
    (standardError as any).endpoint = endpoint;
    (standardError as any).originalError = error;

    return standardError;
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest("GET", "/api/v1/health");
      return true;
    } catch (error) {
      console.error("[PythonAPI] 健康检查失败:", error);
      return false;
    }
  }

  /**
   * 获取服务信息
   */
  getServiceInfo(): PythonApiConfig {
    return { ...this.config };
  }
}
