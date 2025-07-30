import { strategyApi } from './api/strategyApi';

export interface MetaData {
  types: { value: string; label: string; description?: string }[];
  categories: { value: string; label: string }[];
  sortOptions: { value: string; label: string }[];
}

/**
 * MetaService - 策略元数据服务
 * 
 * 注意：推荐使用 MetaStore 来管理元数据，而不是直接使用此服务
 * MetaStore 提供了更好的状态管理和响应式更新
 */
class MetaService {
  private cache: MetaData | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 获取策略元数据（类型、分类、排序选项）
   */
  async getStrategyMeta(): Promise<MetaData> {
    const now = Date.now();
    
    // 如果缓存有效，直接返回
    if (this.cache && now < this.cacheExpiry) {
      return this.cache;
    }

    try {
      const response = await strategyApi.getStrategyMeta();
      if (response.success && response.data) {
        this.cache = response.data;
        this.cacheExpiry = now + this.CACHE_DURATION;
        return response.data;
      }
    } catch (error) {
      console.error('获取策略元数据失败:', error);
    }

    // 如果API调用失败，返回默认数据
    return this.getDefaultMeta();
  }

  /**
   * 获取策略类型选项
   */
  async getStrategyTypes(): Promise<{ value: string; label: string; description?: string }[]> {
    const meta = await this.getStrategyMeta();
    return meta.types;
  }

  /**
   * 获取策略分类选项
   */
  async getStrategyCategories(): Promise<{ value: string; label: string }[]> {
    const meta = await this.getStrategyMeta();
    return meta.categories;
  }

  /**
   * 获取排序选项
   */
  async getSortOptions(): Promise<{ value: string; label: string }[]> {
    const meta = await this.getStrategyMeta();
    return meta.sortOptions;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
  }

  /**
   * 获取默认元数据（作为备用）
   */
  private getDefaultMeta(): MetaData {
    return {
      types: [
        { value: 'all', label: '全部类型' },
        { value: 'stock_selection', label: '选股策略' },
        { value: 'backtest', label: '回测策略' }
      ],
      categories: [
        { value: 'all', label: '全部分类' }
      ],
      sortOptions: [
        { value: 'popularity', label: '按热度排序' },
        { value: 'likes', label: '按点赞数排序' },
        { value: 'rating', label: '按评分排序' },
        { value: 'createdAt', label: '按创建时间排序' },
        { value: 'updatedAt', label: '按更新时间排序' },
        { value: 'usageCount', label: '按使用次数排序' }
      ]
    };
  }
}

export const metaService = new MetaService();
export default metaService; 