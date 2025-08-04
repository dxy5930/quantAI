import { makeAutoObservable } from 'mobx';

// 简单市场数据接口
export interface SimpleMarketData {
  value: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

export class HomeStore {
  // 基础市场数据
  marketSummary = {
    trend: 'up' as const,
    summary: '市场整体呈现稳定发展趋势',
    recommendations: ['建议关注科技股投资机会', '保持适度仓位管理'],
    indices: {
      shanghai: {
        value: 3200.45,
        change: 1.2,
        trend: 'up' as const
      },
      shenzhen: {
        value: 12500.67,
        change: 0.8,
        trend: 'up' as const
      },
      chuangye: {
        value: 2600.89,
        change: -0.3,
        trend: 'down' as const
      }
    }
  };

  // 市场统计数据
  marketStats = {
    totalUsers: 8520,
    activeToday: 1200,
    avgReturn: 12.5,
    totalValue: 2.8e9
  };

  constructor() {
    makeAutoObservable(this);
  }

  // 获取市场摘要
  getMarketSummary = () => {
    return this.marketSummary;
  };

  // 获取市场统计
  getMarketStats = () => {
    return this.marketStats;
  };

  // 更新市场数据
  updateMarketData = (data: Partial<typeof this.marketSummary>) => {
    Object.assign(this.marketSummary, data);
  };
}