import { httpClient } from '../../utils/httpClient';
import { ApiResponse } from './types';

// 获取 API 前缀
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

// 股票选项类型
export interface StockOption {
  symbol: string;
  name: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  market?: string;
  peRatio?: number;
  pbRatio?: number;
}

// 股票搜索请求类型
export interface StockSearchRequest {
  q: string;
}

// 股票列表请求类型
export interface StockListRequest {
  page?: number;
  limit?: number;
  search?: string;
  sector?: string;
  industry?: string;
  minMarketCap?: number;
  maxMarketCap?: number;
}

// 股票列表响应类型
export interface StockListResponse {
  data: StockOption[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 股票API
export const stocksApi = {
  // 搜索股票（模糊匹配）
  async searchStocks(data: StockSearchRequest): Promise<ApiResponse<StockOption[]>> {
    return httpClient.post(`${API_PREFIX}/stocks/search`, data);
  },

  // 获取股票列表（支持分页和筛选）
  async getStockList(params: StockListRequest): Promise<ApiResponse<StockListResponse>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    return httpClient.get(`${API_PREFIX}/stocks/list?${queryParams.toString()}`);
  },

  // 通过akshare搜索股票
  async searchStockByAkshare(keyword: string): Promise<ApiResponse<StockOption[]>> {
    return httpClient.post(`${API_PREFIX}/stocks/akshare/search`, { keyword });
  },

  // 获取股票详情
  async getStockData(symbol: string): Promise<ApiResponse<any>> {
    return httpClient.post(`${API_PREFIX}/stocks/${symbol}`, {});
  },

  // 获取股票实时数据
  async getStockRealtime(symbols: string[]): Promise<ApiResponse<any[]>> {
    return httpClient.post(`${API_PREFIX}/stocks/realtime`, { symbols: symbols.join(',') });
  },
};

export default stocksApi; 