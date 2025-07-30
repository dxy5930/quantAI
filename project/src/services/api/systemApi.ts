import { httpClient } from '../../utils/httpClient';
import { UnifiedApiResponse } from '../../types';

// 获取 API 前缀
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

// 系统健康检查数据接口
export interface SystemHealth {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

// 系统统计数据接口
export interface SystemStats {
  overview: {
    totalStrategies: number;
    publicStrategies: number;
    totalUsers: number;
    activeUsers: number;
    totalBacktests: number;
    successfulBacktests: number;
    avgRating: string;
    uptime: string;
  };
  stats: Array<{
    label: string;
    value: string;
    icon: string;
    trend?: string;
    trendUp?: boolean;
  }>;
  popularStrategies: Array<any>;
  recentStrategies: Array<any>;
}

// 系统API
export const systemApi = {
  // 获取系统统计数据
  async getSystemStats(): Promise<UnifiedApiResponse<SystemStats>> {
    return httpClient.get(`${API_PREFIX}/system/stats`);
  },

  // 系统健康检查
  async healthCheck(): Promise<UnifiedApiResponse<SystemHealth>> {
    return httpClient.get(`${API_PREFIX}/system/health`);
  },
};

export default systemApi; 