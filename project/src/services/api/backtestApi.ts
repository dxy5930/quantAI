import { httpClient } from '../../utils/httpClient';
import { BacktestRequest, BacktestResult, PaginationParams, ListResponse } from './types';
import { UnifiedApiResponse } from '../../types';

// 获取 API 前缀
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

// 回测API
export const backtestApi = {
  // 运行回测
  async runBacktest(data: BacktestRequest): Promise<UnifiedApiResponse<BacktestResult>> {
    console.log('=== BacktestApi.runBacktest ===');
    console.log('API前缀:', API_PREFIX);
    console.log('请求URL:', `${API_PREFIX}/backtest/run`);
    console.log('请求数据:', data);
    
    const result = await httpClient.post(`${API_PREFIX}/backtest/run`, data);
    
    console.log('API响应结果:', result);
    return result;
  },

  // 获取回测历史
  async getBacktestHistory(params?: PaginationParams & {
    strategy_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<UnifiedApiResponse<ListResponse<BacktestResult>>> {
    return httpClient.post(`${API_PREFIX}/backtest/history`, params);
  },

  // 根据ID获取回测结果
  async getBacktestResult(id: string): Promise<UnifiedApiResponse<BacktestResult>> {
    return httpClient.post(`${API_PREFIX}/backtest/${id}`);
  },

  // 删除回测结果
  async deleteBacktestResult(id: string): Promise<UnifiedApiResponse<void>> {
    return httpClient.delete(`${API_PREFIX}/backtest/${id}`);
  },

  // 导出回测结果
  async exportBacktestResult(id: string, format: 'csv' | 'xlsx' = 'csv'): Promise<void> {
    // 直接使用window.open下载文件
    const url = `${API_PREFIX}/backtest/${id}/export?format=${format}`;
    window.open(url, '_blank');
  },
};

export default backtestApi; 