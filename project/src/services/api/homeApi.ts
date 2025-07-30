import { httpClient } from '../../utils/httpClient';
import { UnifiedApiResponse } from '../../types';

// 获取 API 前缀
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

// 首页相关类型定义
export interface MarketSentiment {
  index: number; // 0-100的情绪指数
  level: 'bearish' | 'neutral' | 'bullish'; // 情绪等级
  description: string; // 情绪描述
  factors: string[]; // 影响因素
  lastUpdated: string; // 最后更新时间
}

export interface AIMarketAnalysis {
  currentStatus: string; // 当前分析状态
  sentiment: MarketSentiment; // 市场情绪
  insights: string[]; // AI洞察
  recommendations: string[]; // 投资建议
  hotSectors: string[]; // 热点板块
  lastUpdated: string; // 最后更新时间
}

export interface AIStockAnalysis {
  technical_score: number;
  fundamental_score: number;
  symbol: string; // 股票代码
  name: string; // 股票名称
  analysis: string; // AI分析结果
  rating: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D'; // 评级
  technicalScore: number; // 技术面评分 0-100
  fundamentalScore: number; // 基本面评分 0-100
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell'; // 推荐操作
  targetPrice?: number; // 目标价格
  riskLevel: 'low' | 'medium' | 'high'; // 风险等级
  keyPoints: string[]; // 关键要点
  warnings: string[]; // 风险提示
  generatedAt: string; // 生成时间
}

export interface StrategyPerformanceData {
  id: string;
  name: string;
  type: string;
  return30d: number; // 30天收益率
  return7d: number; // 7天收益率
  return1d: number; // 1天收益率
  sharpeRatio: number; // 夏普比率
  maxDrawdown: number; // 最大回撤
  winRate: number; // 胜率
  totalTrades: number; // 总交易次数
  lastUpdated: string; // 最后更新时间
}

export interface HomePageData {
  marketAnalysis: AIMarketAnalysis;
  topStrategies: StrategyPerformanceData[];
  marketStats: {
    totalStrategies: number;
    activeUsers: number;
    totalBacktests: number;
    avgReturn: number;
  };
}

class HomeApi {
  /**
   * 获取首页综合数据
   */
  async getHomePageData(): Promise<UnifiedApiResponse<HomePageData>> {
    return httpClient.get(`${API_PREFIX}/home/data`);
  }

  /**
   * 获取AI市场分析（调用Python服务）
   */
  async getMarketAnalysis(): Promise<UnifiedApiResponse<AIMarketAnalysis>> {
    return httpClient.get(`${API_PREFIX}/home/market-analysis`);
  }

  /**
   * AI股票分析（调用Python服务）
   */
  async analyzeStock(symbol: string): Promise<UnifiedApiResponse<AIStockAnalysis>> {
    return httpClient.post(`${API_PREFIX}/home/analyze-stock`, { symbol });
  }

  /**
   * 获取策略收益排行（从数据库获取）
   */
  async getTopStrategies(limit: number = 3): Promise<UnifiedApiResponse<StrategyPerformanceData[]>> {
    return httpClient.get(`${API_PREFIX}/home/top-strategies`, { params: { limit } });
  }

  /**
   * 获取市场情绪指数（从数据库计算）
   */
  async getMarketSentiment(): Promise<UnifiedApiResponse<MarketSentiment>> {
    return httpClient.get(`${API_PREFIX}/home/market-sentiment`);
  }

  /**
   * 获取实时分析状态列表
   */
  async getAnalysisStates(): Promise<UnifiedApiResponse<string[]>> {
    return httpClient.get(`${API_PREFIX}/home/analysis-states`);
  }
}

export const homeApi = new HomeApi();
export default homeApi;