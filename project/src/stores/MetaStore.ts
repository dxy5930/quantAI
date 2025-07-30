import { makeAutoObservable, runInAction } from 'mobx';
import { strategyApi } from '../services/api/strategyApi';
import { STRATEGY_FILTER_VALUES } from '../constants/strategyTypes';

export interface MetaData {
  types: { value: string; label: string; description?: string }[];
  categories: { value: string; label: string }[];
  sortOptions: { value: string; label: string }[];
}

export class MetaStore {
  // 元数据状态
  types: { value: string; label: string; description?: string }[] = [];
  categories: { value: string; label: string }[] = [];
  sortOptions: { value: string; label: string }[] = [];
  
  // 加载状态
  isLoading: boolean = false;
  isLoaded: boolean = false;
  error: string | null = null;
  
  // 缓存时间
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  /**
   * 加载策略元数据
   */
  loadMeta = async (force: boolean = false) => {
    const now = Date.now();
    
    // 如果已经加载且缓存有效，且不是强制刷新，直接返回
    if (this.isLoaded && now < this.cacheExpiry && !force) {
      return;
    }

    // 如果正在加载，直接返回
    if (this.isLoading) {
      return;
    }

    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const response = await strategyApi.getStrategyMeta();
      
      runInAction(() => {
        if (response.success && response.data) {
          this.types = response.data.types || [];
          this.categories = response.data.categories || [];
          this.sortOptions = response.data.sortOptions || [];
          this.isLoaded = true;
          this.cacheExpiry = now + this.CACHE_DURATION;
          this.error = null;
        } else {
          this.error = response.message || '获取元数据失败';
          this.loadDefaultMeta();
        }
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = '网络错误，无法获取元数据';
        this.loadDefaultMeta();
        console.error('加载策略元数据失败:', error);
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /**
   * 加载默认元数据
   */
  private loadDefaultMeta = () => {
    runInAction(() => {
      this.types = [
        { value: STRATEGY_FILTER_VALUES.ALL, label: '全部类型' },
        { value: 'backtest', label: '回测策略' },
        { value: 'stock_selection', label: '选股策略' }
      ];
      this.categories = [
        { value: STRATEGY_FILTER_VALUES.ALL, label: '全部分类' },
        { value: '趋势跟踪', label: '趋势跟踪' },
        { value: '技术指标', label: '技术指标' },
        { value: '均值回归', label: '均值回归' },
        { value: '套利策略', label: '套利策略' }
      ];
      this.sortOptions = [
        { value: 'popularity', label: '热度排序' },
        { value: 'rating', label: '评分排序' },
        { value: 'createdAt', label: '创建时间' },
        { value: 'updatedAt', label: '更新时间' }
      ];
      this.isLoaded = true;
    });
  }

  /**
   * 清除缓存
   */
  clearCache = () => {
    runInAction(() => {
      this.isLoaded = false;
      this.cacheExpiry = 0;
      this.types = [];
      this.categories = [];
      this.sortOptions = [];
    });
  }

  /**
   * 获取策略类型选项
   */
  getStrategyTypes = () => {
    return this.types;
  }

  /**
   * 获取策略分类选项
   */
  getStrategyCategories = () => {
    return this.categories;
  }

  /**
   * 获取排序选项
   */
  getSortOptions = () => {
    return this.sortOptions;
  }
}

export const metaStore = new MetaStore(); 