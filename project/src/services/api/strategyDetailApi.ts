import { httpClient } from '../../utils/httpClient';

// 获取 API 前缀
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';
console.log('StrategyDetailApi API_PREFIX:', API_PREFIX);

export interface StrategyDetailResponse {
  success: boolean;
  data: any;
  message: string;
}

export interface StrategyChartsResponse {
  success: boolean;
  data: {
    strategyId: string;
    strategyType: string;
    period: string;
    charts: any;
    summary: any;
    updatedAt: string;
  };
  message: string;
}

export interface StockAnalysisResponse {
  success: boolean;
  data: {
    symbol: string;
    strategyId?: string;
    technicalAnalysis: {
      rsi: number;
      macd: {
        macd: number;
        signal: number;
        histogram: number;
      };
      movingAverages: {
        ma5: number;
        ma10: number;
        ma20: number;
        ma50: number;
      };
      support: number;
      resistance: number;
      trend: string;
      strength: string;
    };
    fundamentalAnalysis: {
      peRatio: number;
      pbRatio: number;
      roe: number;
      roa: number;
      debtToEquity: number;
      currentRatio: number;
      quickRatio: number;
      grossMargin: number;
      operatingMargin: number;
      netMargin: number;
    };
    recommendation: {
      rating: string;
      score: number;
      reasons: string[];
    };
    updatedAt: string;
  };
  message: string;
}

export interface StockTrendResponse {
  success: boolean;
  data: {
    symbol: string;
    period: string;
    trends: Array<{
      date: string;
      price: number;
      volume: number;
      change: number;
      changePercent: number;
    }>;
    summary: {
      trend: string;
      volatility: string;
      momentum: string;
      avgVolume: number;
      priceChange: number;
      priceChangePercent: string;
    };
    updatedAt: string;
  };
  message: string;
}

// 批量股票趋势响应类型
export interface BatchStockTrendResponse {
  success: boolean;
  data: Array<{
    symbol: string;
    period: string;
    summary: {
      trend: string;
      volatility: string;
      momentum: string;
      avgVolume: number;
      priceChange: number;
      priceChangePercent: string;
    };
    updatedAt: string;
  }>;
  message: string;
}

export interface StockChartsResponse {
  success: boolean;
  data: {
    symbol: string;
    period: string;
    candlestickData: any[];
    technicalIndicators: any;
    summary: any;
    updatedAt: string;
  };
  message: string;
}

// 批量股票分析响应类型
export interface BatchStockAnalysisResponse {
  success: boolean;
  data: Array<{
    symbol: string;
    strategyId?: string;
    technicalAnalysis: {
      rsi: number;
      macd: {
        macd: number;
        signal: number;
        histogram: number;
      };
      movingAverages: {
        ma5: number;
        ma10: number;
        ma20: number;
        ma50: number;
      };
      support: number;
      resistance: number;
      trend: string;
      strength: string;
    };
    fundamentalAnalysis: {
      peRatio: number;
      pbRatio: number;
      roe: number;
      roa: number;
      debtToEquity: number;
      currentRatio: number;
      quickRatio: number;
      grossMargin: number;
      operatingMargin: number;
      netMargin: number;
    };
    recommendation: {
      rating: string;
      score: number;
      reasons: string[];
    };
    updatedAt: string;
  }>;
  message: string;
}

class StrategyDetailApi {
  /**
   * 获取策略详情
   */
  async getStrategyDetail(strategyId: string): Promise<StrategyDetailResponse> {
    try {
      const response = await httpClient.post(`${API_PREFIX}/strategies/${strategyId}/detail`);
      return response.data;
    } catch (error) {
      console.error('获取策略详情失败:', error);
      throw error;
    }
  }

  /**
   * 获取策略图表数据
   */
  async getStrategyCharts(strategyId: string, period: string = '1y'): Promise<StrategyChartsResponse> {
    try {
      const response = await httpClient.post(`${API_PREFIX}/strategies/${strategyId}/charts`, {
        period
      });
      return response;
    } catch (error) {
      console.error('获取策略图表数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取股票分析数据
   */
  async getStockAnalysis(symbol: string, strategyId?: string): Promise<StockAnalysisResponse> {
    try {
      const response = await httpClient.post(`${API_PREFIX}/stocks/${symbol}/analysis`, {
        strategyId
      });
      return response.data;
    } catch (error) {
      console.error('获取股票分析数据失败:', error);
      throw error;
    }
  }

  /**
   * 批量获取股票分析数据
   */
  async getBatchStockAnalysis(symbols: string[], strategyId?: string): Promise<BatchStockAnalysisResponse> {
    try {
      const response = await httpClient.post(`${API_PREFIX}/stocks/batch-analysis`, {
        symbols,
        strategyId
      });
      return response.data;
    } catch (error) {
      console.error('批量获取股票分析数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取股票趋势数据
   */
  async getStockTrend(symbol: string): Promise<StockTrendResponse> {
    try {
      const response = await httpClient.post(`${API_PREFIX}/stocks/${symbol}/trend`);
      return response.data;
    } catch (error) {
      console.error('获取股票趋势数据失败:', error);
      throw error;
    }
  }

  /**
   * 批量获取股票趋势汇总信息
   */
  async getBatchStockTrends(symbols: string[]): Promise<BatchStockTrendResponse> {
    try {
      const response = await httpClient.post(`${API_PREFIX}/stocks/batch-trends`, {
        symbols,
        period: '30d' // 默认30天
      });
      return response.data;
    } catch (error) {
      console.error('批量获取股票趋势汇总信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取股票图表数据
   */
  async getStockCharts(symbol: string, period: string = '1y'): Promise<StockChartsResponse> {
    try {
      const response = await httpClient.post(`${API_PREFIX}/stocks/${symbol}/charts`, {
        period
      });
      return response.data;
    } catch (error) {
      console.error('获取股票图表数据失败:', error);
      throw error;
    }
  }
}

export const strategyDetailApi = new StrategyDetailApi();
export default strategyDetailApi; 