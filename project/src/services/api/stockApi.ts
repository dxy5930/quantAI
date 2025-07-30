import { httpClient } from '../../utils/httpClient';
import { ApiResponse, StockInfo, PaginationParams, ListResponse } from './types';

// 获取 API 前缀
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

// 股票API
export const stockApi = {
  // 获取股票列表
  async getStockList(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sector?: string;
    industry?: string;
    minMarketCap?: number;
    maxMarketCap?: number;
  }): Promise<ApiResponse<ListResponse<StockInfo>>> {
    return httpClient.get(`${API_PREFIX}/stocks/list`, { params });
  },

  // 获取股票推荐
  async getRecommendations(params?: {
    strategyType?: string;
    marketCapMin?: number;
    marketCapMax?: number;
    sector?: string;
    limit?: number;
  }): Promise<ApiResponse<StockInfo[]>> {
    return httpClient.post(`${API_PREFIX}/stocks/recommendations`, params);
  },

  // 股票筛选
  async screenStocks(params?: {
    market_cap_min?: number;
    market_cap_max?: number;
    price_min?: number;
    price_max?: number;
    sector?: string;
    industry?: string;
    volume_min?: number;
    pe_ratio_max?: number;
    pb_ratio_max?: number;
    dividend_yield_min?: number;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<ListResponse<StockInfo>>> {
    return httpClient.post(`${API_PREFIX}/stocks/screen`, params);
  },

  // 搜索股票
  async searchStocks(query: string): Promise<ApiResponse<StockInfo[]>> {
    return httpClient.post(`${API_PREFIX}/stocks/search`, { q: query });
  },

  // 根据代码获取股票信息
  async getStockBySymbol(symbol: string): Promise<ApiResponse<StockInfo>> {
    return httpClient.post(`${API_PREFIX}/stocks/${symbol}`);
  },

  // 获取股票历史数据
  async getStockHistory(symbol: string, params?: {
    start_date?: string;
    end_date?: string;
    interval?: '1d' | '1w' | '1m';
  }): Promise<ApiResponse<any[]>> {
    return httpClient.post(`${API_PREFIX}/stocks/${symbol}/history`, params);
  },

  // 获取股票实时数据
  async getStockRealtime(symbols: string[]): Promise<ApiResponse<StockInfo[]>> {
    return httpClient.post(`${API_PREFIX}/stocks/realtime`, { symbols: symbols.join(',') });
  },
};

export default stockApi; 