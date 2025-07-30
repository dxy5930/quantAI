import { httpClient } from '../../utils/httpClient';
import { UnifiedApiResponse as ApiResponse } from '../../types';

// 获取 API 前缀
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

// 关键词标签类型
export interface KeywordTag {
  id: string;
  text: string;
  type: 'sector' | 'metric' | 'condition' | 'other';
}

// 股票选项类型 (用于选股策略的股票配置)
export interface StockOption {
  symbol: string;
  name: string;
  sector?: string;
  marketCap?: number;
  weight?: number; // 可选的权重字段，主要用于回测策略
}

// 策略配置数据类型
export interface StrategyConfigData {
  originalQuery?: string;
  keywords?: KeywordTag[];
  selectedStocks?: StockOption[];
}

// AI提取关键词请求类型
export interface ExtractKeywordsRequest {
  input: string;
}

// AI提取关键词响应类型
export interface ExtractKeywordsResponse {
  id: string;
  text: string;
  type?: string;
}

// AI推荐股票请求类型
export interface RecommendStocksRequest {
  keywords: Array<{ text: string; confidence: number }>;
}

// AI推荐股票响应类型
export interface RecommendStocksResponse {
  symbol: string;
  name: string;
  matchScore: number;
  matchReasons: string[];
  riskLevel: string;
  investmentHighlights: string[];
  riskWarnings: string[];
  // key-value格式的详细信息
  details: Record<string, string>;
  // 为了兼容性保留的字段
  price: number;
  change: number;
  changePercent: number;
  sector: string;
  marketCap: string;
  pe: number;
  volume: number;
}

// AI分析策略请求类型
export interface AnalyzeStrategyRequest {
  input: string;
  strategyId?: string;
}

// AI分析策略响应类型
export interface AnalyzeStrategyResponse {
  keywords: Array<{ id: string; text: string; confidence: number }>;
  recommendations: RecommendStocksResponse[];
  structured_conditions: Array<{
    field: string;
    operator: string;
    value: any;
    period?: string;
  }>;
}

// 保存策略请求类型
export interface SaveStrategyRequest {
  strategyType: string;
  originalQuery?: string;
  keywords?: KeywordTag[];
  selectedStocks?: StockOption[];
}

// 发布策略响应类型
export interface PublishStrategyResponse {
  message: string;
}

// 分享链接响应类型
export interface ShareLinkResponse {
  shareUrl: string;
}

// 选股配置API
export const stockSelectionApi = {
  // 获取策略配置
  async getStrategyConfig(strategyId: string): Promise<ApiResponse<StrategyConfigData>> {
    return httpClient.post(`${API_PREFIX}/strategies/${strategyId}/config`, {});
  },

  // AI提取关键词
  async extractKeywords(data: ExtractKeywordsRequest): Promise<ApiResponse<ExtractKeywordsResponse[]>> {
    return httpClient.post(`${API_PREFIX}/strategies/ai/extract-keywords`, data);
  },

  // AI推荐股票
  async recommendStocks(data: RecommendStocksRequest): Promise<ApiResponse<RecommendStocksResponse[]>> {
    return httpClient.post(`${API_PREFIX}/strategies/ai/recommend-stocks`, data);
  },

  // AI分析策略（合并的接口）
  async analyzeStrategy(data: AnalyzeStrategyRequest): Promise<ApiResponse<AnalyzeStrategyResponse>> {
    return httpClient.post(`${API_PREFIX}/strategies/ai/analyze-strategy`, data);
  },

  // 保存策略配置
  async saveStrategy(strategyId: string, data: SaveStrategyRequest): Promise<ApiResponse<void>> {
    return httpClient.post(`${API_PREFIX}/strategies/${strategyId}/save`, data);
  },

  // 发布策略到广场
  async publishToSquare(strategyId: string): Promise<ApiResponse<PublishStrategyResponse>> {
    return httpClient.post(`${API_PREFIX}/strategies/${strategyId}/publish`, {});
  },

  // 生成分享链接
  async generateShareLink(strategyId: string): Promise<ApiResponse<ShareLinkResponse>> {
    return httpClient.post(`${API_PREFIX}/strategies/${strategyId}/generate-share-link`, {});
  },
};

export default stockSelectionApi; 