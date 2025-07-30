import { makeAutoObservable, runInAction } from 'mobx';
import { Strategy, StrategyConfig, BacktestResult, SharedStrategy, MyStrategy } from '../types';
import { 
  STRATEGY_TYPE_OPTIONS, 
  STRATEGY_DEFAULTS, 
  SortField, 
  SortOrder,
  STRATEGY_FILTER_VALUES
} from '../constants/strategyTypes';
import { strategyApi } from '../services/api/strategyApi';
import { scrollToTopSmooth } from '../utils/scrollToTop';

export class StrategyStore {
  // 策略相关状态
  strategies: Strategy[] = [];
  selectedStrategy: Strategy | null = null;
  searchTerm: string = STRATEGY_DEFAULTS.SEARCH_TERM;
  selectedCategory: string = STRATEGY_DEFAULTS.SELECTED_CATEGORY;
  selectedStrategyType: string = STRATEGY_DEFAULTS.SELECTED_STRATEGY_TYPE;
  sortBy: string = STRATEGY_DEFAULTS.SORT_BY;
  sortOrder: SortOrder = STRATEGY_DEFAULTS.SORT_ORDER;
  
  // 分页相关状态
  currentPage: number = 1;
  pageSize: number = 12;
  totalCount: number = 0;
  hasMore: boolean = true;
  
  // 分享策略相关状态
  sharedStrategies: SharedStrategy[] = [];
  myStrategies: MyStrategy[] = [];
  favoriteStrategies: SharedStrategy[] = [];
  
  // 我的策略加载状态
  myStrategiesLoading: boolean = false;
  myStrategiesError: string | null = null;
  myStrategiesTotalCount: number = 0;
  
  // 回测相关状态
  backtestResults: BacktestResult | null = null;
  isBacktesting: boolean = false;
  backtestHistory: BacktestResult[] = [];
  
  // 数据加载状态
  strategiesLoading: boolean = false;
  strategiesError: string | null = null;
  
  // 加载更多状态（独立于主加载状态）
  loadingMore: boolean = false;

  // 策略类型和分类元数据
  strategyTypes: { value: string; label: string }[] = [];
  categories: { value: string; label: string }[] = [];
  
  // 防抖定时器
  private searchDebounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    try {
      makeAutoObservable(this, {}, { autoBind: true });
      this.initializeStore();
    } catch (error) {
      console.error('StrategyStore 初始化失败:', error);
      throw error;
    }
  }

  private initializeStore() {
    runInAction(() => {
      this.strategies = [];
      this.sharedStrategies = [];
      this.selectedStrategy = null;
      this.searchTerm = STRATEGY_DEFAULTS.SEARCH_TERM;
      this.selectedCategory = STRATEGY_DEFAULTS.SELECTED_CATEGORY;
      this.selectedStrategyType = STRATEGY_DEFAULTS.SELECTED_STRATEGY_TYPE;
      this.sortBy = STRATEGY_DEFAULTS.SORT_BY;
      this.sortOrder = STRATEGY_DEFAULTS.SORT_ORDER;
      this.currentPage = 1;
      this.pageSize = 12;
      this.totalCount = 0;
      this.hasMore = true;
      this.backtestResults = null;
      this.isBacktesting = false;
      this.backtestHistory = [];
      this.myStrategies = [];
      this.favoriteStrategies = [];
      this.strategiesLoading = false;
      this.strategiesError = null;
      this.loadingMore = false;
    });
    
    // 不再自动加载元数据，由全局MetaStore管理
  }

  // 分页操作
  resetPagination = () => {
    runInAction(() => {
      this.currentPage = 1;
      this.hasMore = true;
      this.strategies = [];
      this.loadingMore = false;
      this.totalCount = 0;
    });
  }

  // 加载更多策略
  loadMoreStrategies = async (): Promise<boolean> => {
    
    // 先检查是否能够加载更多
    if (!this.hasMore) {
      return false;
    }
    
    if (this.strategiesLoading || this.loadingMore) {
      return this.hasMore; // 返回当前hasMore状态，避免useLoadMore认为已结束
    }
    
    runInAction(() => {
      this.currentPage += 1;
      this.loadingMore = true;
    });
    
    try {
      await this.loadStrategies({
        search: this.searchTerm,
        category: this.selectedCategory === STRATEGY_FILTER_VALUES.ALL ? undefined : this.selectedCategory,
        strategyType: this.selectedStrategyType === STRATEGY_FILTER_VALUES.ALL ? undefined : this.selectedStrategyType,
        sortBy: this.sortBy,
        sortOrder: this.sortOrder,
        page: this.currentPage,
        limit: this.pageSize,
      }, true);
      
      return this.hasMore;
    } finally {
      runInAction(() => {
        this.loadingMore = false;
      });
    }
  }

  // 策略操作
  setSelectedStrategy = (strategy: Strategy | null) => {
    runInAction(() => {
      this.selectedStrategy = strategy;
    });
  }

  setSearchTerm = (term: string) => {
    runInAction(() => {
      this.searchTerm = term;
    });
    
    // 清除之前的定时器
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    
    // 设置防抖，500ms后执行搜索
    this.searchDebounceTimer = setTimeout(() => {
      this.resetPagination();
      this.loadStrategies({
        search: term,
        category: this.selectedCategory === STRATEGY_FILTER_VALUES.ALL ? undefined : this.selectedCategory,
        strategyType: this.selectedStrategyType === STRATEGY_FILTER_VALUES.ALL ? undefined : this.selectedStrategyType,
        sortBy: this.sortBy,
        sortOrder: this.sortOrder,
        page: 1,
        limit: this.pageSize,
      });
      
      // 滚动到顶部
      scrollToTopSmooth();
    }, 500);
  }

  // 仅更新状态，不触发请求的方法
  updateSearchTerm = (term: string) => {
    runInAction(() => {
      this.searchTerm = term;
    });
    // 清除防抖定时器，避免自动触发请求
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }
  }

  setSelectedCategory = (category: string) => {
    runInAction(() => {
      this.selectedCategory = category;
    });
    // 触发接口请求以获取筛选后的数据
    this.resetPagination();
    this.loadStrategies({
      search: this.searchTerm,
      category: category === STRATEGY_FILTER_VALUES.ALL ? undefined : category,
      strategyType: this.selectedStrategyType === STRATEGY_FILTER_VALUES.ALL ? undefined : this.selectedStrategyType,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      page: 1,
      limit: this.pageSize,
    });
    
    // 滚动到顶部
    scrollToTopSmooth();
  }

  // 仅更新分类状态，不触发请求的方法
  updateSelectedCategory = (category: string) => {
    runInAction(() => {
      this.selectedCategory = category;
    });
  }

  setSelectedStrategyType = (strategyType: string) => {
    runInAction(() => {
      this.selectedStrategyType = strategyType;
    });
    // 触发接口请求以获取筛选后的数据
    this.resetPagination();
    this.loadStrategies({
      search: this.searchTerm,
      category: this.selectedCategory === STRATEGY_FILTER_VALUES.ALL ? undefined : this.selectedCategory,
      strategyType: strategyType === STRATEGY_FILTER_VALUES.ALL ? undefined : strategyType,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      page: 1,
      limit: this.pageSize,
    });
    
    // 滚动到顶部
    scrollToTopSmooth();
  }

  // 仅更新策略类型状态，不触发请求的方法
  updateSelectedStrategyType = (strategyType: string) => {
    runInAction(() => {
      this.selectedStrategyType = strategyType;
    });
  }

  setSortBy = (sortBy: string) => {
    runInAction(() => {
      this.sortBy = sortBy;
    });
    // 触发接口请求以获取排序后的数据
    this.resetPagination();
    this.loadStrategies({
      search: this.searchTerm,
      category: this.selectedCategory === STRATEGY_FILTER_VALUES.ALL ? undefined : this.selectedCategory,
      strategyType: this.selectedStrategyType === STRATEGY_FILTER_VALUES.ALL ? undefined : this.selectedStrategyType,
      sortBy: sortBy,
      sortOrder: this.sortOrder,
      page: 1,
      limit: this.pageSize,
    });
    
    // 滚动到顶部
    scrollToTopSmooth();
  }

  // 仅更新排序状态，不触发请求的方法
  updateSortBy = (sortBy: string) => {
    runInAction(() => {
      this.sortBy = sortBy;
    });
  }

  setSortOrder = (sortOrder: SortOrder) => {
    runInAction(() => {
      this.sortOrder = sortOrder;
    });
    // 自动请求接口
    this.resetPagination();
    this.loadStrategies({
      search: this.searchTerm,
      category: this.selectedCategory === STRATEGY_FILTER_VALUES.ALL ? undefined : this.selectedCategory,
      strategyType: this.selectedStrategyType === STRATEGY_FILTER_VALUES.ALL ? undefined : this.selectedStrategyType,
      sortBy: this.sortBy,
      sortOrder: sortOrder,
      page: 1,
      limit: this.pageSize,
    });
    
    // 滚动到顶部
    scrollToTopSmooth();
  }

  // 从API加载策略数据
  loadStrategies = async (params?: {
    strategyType?: string;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: SortOrder;
    page?: number;
    limit?: number;
  }, append: boolean = false) => {
    console.log('loadStrategies被调用:', { append, params, strategiesLoading: this.strategiesLoading, loadingMore: this.loadingMore });
    // 修复拦截逻辑：
    // 1. 普通加载时只检查strategiesLoading
    // 2. 追加加载时只检查strategiesLoading（不检查loadingMore，因为它是由loadMoreStrategies设置的）
    if (!append && this.strategiesLoading) {
      return;
    }
    if (append && this.strategiesLoading) {
      return;
    }
    
    runInAction(() => {
      if (!append) {
        this.strategiesLoading = true;
      }
      this.strategiesError = null;
    });

    try {
      const filteredParams = params ? {
        search: params.search,
        category: params.category === STRATEGY_FILTER_VALUES.ALL ? undefined : params.category,
        strategyType: params.strategyType === STRATEGY_FILTER_VALUES.ALL ? undefined : params.strategyType,
        sortBy: params.sortBy,
        page: params.page || this.currentPage,
        limit: params.limit || this.pageSize,
      } : { page: this.currentPage, limit: this.pageSize };
      
      const response = await strategyApi.getStrategies(filteredParams);
      
      runInAction(() => {
        if (response && response.success && response.data) {
          if (response.data.data && Array.isArray(response.data.data)) {
            const newStrategies = this.transformApiStrategies(response.data.data);
            
            if (append) {
              const existingIds = new Set(this.strategies.map(s => s.id));
              const actualNewStrategies = newStrategies.filter(s => !existingIds.has(s.id));
              if (actualNewStrategies.length > 0) {
                this.strategies = [...this.strategies, ...actualNewStrategies];
              }
            } else {
              this.strategies = newStrategies;
            }
            
            const newTotalCount = response.data.total || 0;
            const currentPage = response.data.page || this.currentPage;
            const totalPages = response.data.total_pages || Math.ceil(newTotalCount / this.pageSize);
            
            this.totalCount = newTotalCount;
            this.hasMore = currentPage < totalPages;
            this.strategiesError = null;
          }
        } else {
          this.strategiesError = response?.message || '获取策略列表失败';
        }
      });
    } catch (error: any) {
      runInAction(() => {
        this.strategiesError = '网络错误，无法获取策略列表';
      });
    } finally {
      runInAction(() => {
        if (!append) {
          this.strategiesLoading = false;
        }
      });
    }
  }

  // // 加载热门策略
  // loadPopularStrategies = async (limit: number = 10) => {
  //   try {
  //     const response = await strategyApi.getPopularStrategies({ limit });
      
  //     runInAction(() => {
  //       if (response && response.success && response.data && Array.isArray(response.data)) {
  //         const popularStrategies = this.transformApiStrategies(response.data);
  //         this.strategies = [...this.strategies, ...popularStrategies.filter(ps => 
  //           !this.strategies.find(s => s.id === ps.id)
  //         )];
  //         console.log('热门策略数据加载成功:', response);
  //       }
  //     });
  // } catch (error) {
  //   console.error('加载热门策略失败:', error);
  // }
  // }

  // // 加载最新策略
  // loadRecentStrategies = async (limit: number = 10) => {
  //   try {
  //     const response = await strategyApi.getRecentStrategies({ limit });
      
  //     runInAction(() => {
  //       if (response && response.success && response.data && Array.isArray(response.data)) {
  //         const recentStrategies = this.transformApiStrategies(response.data);
  //         this.strategies = [...this.strategies, ...recentStrategies.filter(rs => 
  //           !this.strategies.find(s => s.id === rs.id)
  //         )];
  //         console.log('最新策略数据加载成功:', response);
  //       }
  //     });
  //   } catch (error) {
  //     console.error('加载最新策略失败:', error);
  //   }
  // }

  // 分享策略操作
  shareStrategy = (strategyId: string, shareConfig: { isPublic: boolean; allowModification: boolean; shareMessage?: string }) => {
    runInAction(() => {
      const strategy = this.myStrategies.find(s => s.id === strategyId);
      if (strategy) {
        strategy.isShared = true;
        strategy.shareId = `${strategyId}-${Date.now()}`;
        strategy.sharedAt = new Date().toISOString();
        strategy.isPublic = shareConfig.isPublic;
        strategy.updatedAt = new Date().toISOString();
      }
    });
  }

  unshareStrategy = (strategyId: string) => {
    runInAction(() => {
      const strategy = this.myStrategies.find(s => s.id === strategyId);
      if (strategy) {
        strategy.isShared = false;
        strategy.shareId = undefined;
        strategy.sharedAt = undefined;
        strategy.isPublic = false;
        strategy.updatedAt = new Date().toISOString();
      }
    });
  }

  // 收藏操作（切换模式）
  addToFavorites = async (strategyId: string) => {
    try {
      this.strategiesLoading = true;
      const response = await strategyApi.favoriteStrategy(strategyId);
      
      if (response.success) {
        const isFavorited = response.data; // 后端返回true表示收藏，false表示取消收藏
        runInAction(() => {
          const strategy = this.sharedStrategies.find(s => s.id === strategyId);
          if (strategy && 'favorites' in strategy) {
            if (isFavorited) {
              (strategy as any).favorites += 1;
              // 添加到收藏列表
              if (!this.favoriteStrategies.find(s => s.id === strategyId)) {
                this.favoriteStrategies.push(strategy as SharedStrategy);
              }
            } else {
              (strategy as any).favorites = Math.max(0, (strategy as any).favorites - 1);
              // 从收藏列表移除
              this.favoriteStrategies = this.favoriteStrategies.filter(s => s.id !== strategyId);
            }
          }
        });
        return isFavorited;
      }
      return false;
    } catch (error) {
      console.error('收藏操作失败:', error);
      throw error;
    } finally {
      runInAction(() => {
        this.strategiesLoading = false;
      });
    }
  }

  // 保留这个方法以兼容现有代码，但实际上调用addToFavorites
  removeFromFavorites = async (strategyId: string) => {
    return await this.addToFavorites(strategyId);
  }

  // 点赞操作（切换模式）
  likeStrategy = async (strategyId: string) => {
    try {
      this.strategiesLoading = true;
      const response = await strategyApi.likeStrategy(strategyId);
      
      if (response.success) {
        const isLiked = response.data; // 后端返回true表示点赞，false表示取消点赞
        runInAction(() => {
          const strategy = this.sharedStrategies.find(s => s.id === strategyId);
          if (strategy && 'likes' in strategy) {
            if (isLiked) {
              (strategy as any).likes += 1;
            } else {
              (strategy as any).likes = Math.max(0, (strategy as any).likes - 1);
            }
          }
        });
        return isLiked;
      }
      return false;
    } catch (error) {
      console.error('点赞操作失败:', error);
      throw error;
    } finally {
      runInAction(() => {
        this.strategiesLoading = false;
      });
    }
  }

  // 保留这个方法以兼容现有代码，但实际上调用likeStrategy
  unlikeStrategy = async (strategyId: string) => {
    return await this.likeStrategy(strategyId);
  }

  // 增加使用次数
  incrementUsageCount = (strategyId: string) => {
    runInAction(() => {
      const strategy = this.sharedStrategies.find(s => s.id === strategyId);
      if (strategy) {
        strategy.usageCount += 1;
      }
    });
  }

  // 获取用户收藏的策略列表
  loadMyFavorites = async (page: number = 1, limit: number = 10) => {
    try {
      this.strategiesLoading = true;
      const response = await strategyApi.getMyFavorites({ page, limit });
      
      if (response.success && response.data) {
        runInAction(() => {
          this.favoriteStrategies = response.data!.data as any[];
        });
      }
    } catch (error) {
      console.error('加载收藏策略失败:', error);
      throw error;
    } finally {
      runInAction(() => {
        this.strategiesLoading = false;
      });
    }
  }

  // 加载我的所有策略
  loadMyStrategies = async (params?: {
    search?: string;
    category?: string;
    strategyType?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    try {
      runInAction(() => {
        this.myStrategiesLoading = true;
        this.myStrategiesError = null;
      });
      
      const apiParams = {
        search: params?.search,
        category: params?.category,
        strategyType: params?.strategyType,
        sortBy: params?.sortBy || 'updatedAt',
        sortOrder: params?.sortOrder || 'DESC',
      };
      
      const response = await strategyApi.getMyAllStrategies(apiParams);
      
      if (response && response.success && response.data) {
        runInAction(() => {
          this.myStrategies = response.data!.data as any[];
          this.myStrategiesTotalCount = response.data!.total || 0;
        });
      } else {
        runInAction(() => {
          this.myStrategiesError = response?.message || '获取策略数据失败';
        });
      }
    } catch (error: any) {
      console.error('加载我的策略失败:', error);
      runInAction(() => {
        if (error.code === 'ERR_NETWORK' || error.message?.includes('ERR_CONNECTION_REFUSED')) {
          this.myStrategiesError = '无法连接到服务器，请检查后端服务是否启动';
        } else if (error.response?.status === 401) {
          this.myStrategiesError = '请先登录后再查看我的策略';
        } else {
          this.myStrategiesError = error.message || '网络错误，无法加载我的策略';
        }
      });
    } finally {
      runInAction(() => {
        this.myStrategiesLoading = false;
      });
    }
  }


  // 我的策略管理
  createMyStrategy = (strategyData: Omit<MyStrategy, 'id' | 'createdAt' | 'updatedAt'>) => {
    runInAction(() => {
      const newStrategy: MyStrategy = {
        ...strategyData,
        id: `my-strategy-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.myStrategies.push(newStrategy);
    });
  }

  updateMyStrategy = (strategyId: string, updates: Partial<MyStrategy>) => {
    runInAction(() => {
      const index = this.myStrategies.findIndex(s => s.id === strategyId);
      if (index !== -1) {
        this.myStrategies[index] = { 
          ...this.myStrategies[index], 
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
    });
  }

  deleteMyStrategy = (strategyId: string) => {
    runInAction(() => {
      this.myStrategies = this.myStrategies.filter(s => s.id !== strategyId);
      // 如果删除的是当前选中的策略，清空选中状态
      if (this.selectedStrategy?.id === strategyId) {
        this.selectedStrategy = null;
      }
    });
  }

  // 回测操作
  setBacktestResults = (results: BacktestResult | null) => {
    runInAction(() => {
      this.backtestResults = results;
      // 如果有新的回测结果，添加到历史记录
      if (results && !this.backtestHistory.find(r => JSON.stringify(r) === JSON.stringify(results))) {
        this.backtestHistory.unshift(results);
        // 限制历史记录数量
        if (this.backtestHistory.length > 10) {
          this.backtestHistory = this.backtestHistory.slice(0, 10);
        }
      }
    });
  }

  setIsBacktesting = (isBacktesting: boolean) => {
    runInAction(() => {
      this.isBacktesting = isBacktesting;
    });
  }

  clearBacktestResults = () => {
    runInAction(() => {
      this.backtestResults = null;
    });
  }

  clearBacktestHistory = () => {
    runInAction(() => {
      this.backtestHistory = [];
    });
  }

  // 策略管理
  addStrategy = (strategy: Strategy) => {
    runInAction(() => {
      this.strategies.push(strategy);
    });
  }

  updateStrategy = (strategyId: string, updates: Partial<Strategy>) => {
    runInAction(() => {
      const index = this.strategies.findIndex(s => s.id === strategyId);
      if (index !== -1) {
        this.strategies[index] = { ...this.strategies[index], ...updates };
      }
    });
  }

  deleteStrategy = (strategyId: string) => {
    runInAction(() => {
      this.strategies = this.strategies.filter(s => s.id !== strategyId);
      // 如果删除的是当前选中的策略，清空选中状态
      if (this.selectedStrategy?.id === strategyId) {
        this.selectedStrategy = null;
      }
    });
  }

  // 搜索和筛选
  resetFilters = () => {
    runInAction(() => {
      this.searchTerm = STRATEGY_DEFAULTS.SEARCH_TERM;
      this.selectedCategory = STRATEGY_DEFAULTS.SELECTED_CATEGORY;
      this.selectedStrategyType = STRATEGY_DEFAULTS.SELECTED_STRATEGY_TYPE;
      this.sortBy = STRATEGY_DEFAULTS.SORT_BY;
      this.sortOrder = STRATEGY_DEFAULTS.SORT_ORDER;
    });
    
    // 清除防抖定时器
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }
  }
  
  // 清理方法，用于组件卸载时清除定时器
  dispose = () => {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }
  }



  // 计算属性
  get filteredStrategies() {
    // 后端已经处理了搜索、分类、策略类型过滤和排序，直接返回数据
    return this.strategies;
  }

  get filteredSharedStrategies() {
    // 如果将来从后端获取分享策略数据，应该移除此过滤逻辑
    return this.sharedStrategies;
  }

  get filteredMyStrategies() {
    // 如果将来从后端获取我的策略数据，应该移除此过滤逻辑
    return this.myStrategies;
  }

  get totalStrategies() {
    return this.strategies.length;
  }

  get popularStrategies() {
    return [...this.strategies]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5);
  }

  get strategiesByCategory() {
    const categorized: Record<string, Strategy[]> = {};
    this.strategies.forEach(strategy => {
      if (!categorized[strategy.category]) {
        categorized[strategy.category] = [];
      }
      categorized[strategy.category].push(strategy);
    });
    return categorized;
  }

  get strategiesByDifficulty() {
    const byDifficulty: Record<string, Strategy[]> = {
      easy: [],
      medium: [],
      hard: []
    };
    this.strategies.forEach(strategy => {
      byDifficulty[strategy.difficulty].push(strategy);
    });
    return byDifficulty;
  }

  get mySharedStrategies() {
    return this.myStrategies.filter(s => s.isShared);
  }

  get myPrivateStrategies() {
    return this.myStrategies.filter(s => !s.isShared);
  }

  // 获取策略详情
  getStrategyById = (id: string): Strategy | undefined => {
    return this.strategies.find(strategy => strategy.id === id);
  }

  getSharedStrategyById = (id: string): SharedStrategy | undefined => {
    return this.sharedStrategies.find(strategy => strategy.id === id);
  }

  getSharedStrategyByShareId = (shareId: string): SharedStrategy | undefined => {
    return this.sharedStrategies.find(strategy => strategy.shareId === shareId);
  }

  getMyStrategyById = (id: string): MyStrategy | undefined => {
    return this.myStrategies.find(strategy => strategy.id === id);
  }

  // 转换API数据为前端格式
  private transformApiStrategies = (apiStrategies: any[]): Strategy[] => {
    
    return apiStrategies.map(apiStrategy => {
      
      const strategy: Strategy = {
        id: apiStrategy.id,
        name: apiStrategy.name,
        description: apiStrategy.description,
        icon: apiStrategy.icon || 'Activity',
        category: apiStrategy.category || '技术指标',
        strategyType: apiStrategy.strategyType || apiStrategy.strategy_type || 'backtest', // 处理不同的字段名
        difficulty: apiStrategy.difficulty || 'medium',
        popularity: apiStrategy.popularity || 0,
        parameters: apiStrategy.parameters || [],
        tags: apiStrategy.tags || [],
        isPublic: apiStrategy.isPublic || apiStrategy.is_public || false,
        isShared: apiStrategy.isShared || apiStrategy.is_shared || false,
        shareId: apiStrategy.shareId || apiStrategy.share_id,
        sharedAt: apiStrategy.sharedAt || apiStrategy.shared_at,
        likes: apiStrategy.likes || 0,
        favorites: apiStrategy.favorites || 0,
        usageCount: apiStrategy.usageCount || apiStrategy.usage_count || 0,
        rating: typeof apiStrategy.rating === 'string' ? parseFloat(apiStrategy.rating) : (apiStrategy.rating || 0),
        author: apiStrategy.author ? {
          id: apiStrategy.author.id,
          username: apiStrategy.author.displayName || apiStrategy.author.username,
          avatar: apiStrategy.author.avatar
        } : undefined,
        stockRecommendations: apiStrategy.stockRecommendations || apiStrategy.stock_recommendations,
        selectionCriteria: apiStrategy.selectionCriteria || apiStrategy.selection_criteria,
        lastScreeningDate: apiStrategy.lastScreeningDate || apiStrategy.last_screening_date,
        totalStocksScreened: apiStrategy.totalStocksScreened || apiStrategy.total_stocks_screened,
        recommendedStocksCount: apiStrategy.recommendedStocksCount || apiStrategy.recommended_stocks_count,
        backtestResults: apiStrategy.backtestResults || apiStrategy.backtest_results,
        backtestPeriod: apiStrategy.backtestPeriod || apiStrategy.backtest_period,
        lastBacktestDate: apiStrategy.lastBacktestDate || apiStrategy.last_backtest_date,
        createdAt: apiStrategy.createdAt || apiStrategy.created_at,
        updatedAt: apiStrategy.updatedAt || apiStrategy.updated_at
      };
      
      return strategy;
    });
  }

  // 获取相似策略
  getSimilarStrategies = (strategy: Strategy, limit: number = 3): Strategy[] => {
    return this.strategies
      .filter(s => s.id !== strategy.id && s.category === strategy.category)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  // 搜索建议
  getSearchSuggestions = (term: string): string[] => {
    if (!term || term.length < 2) return [];
    
    const suggestions = new Set<string>();
    const lowerTerm = term.toLowerCase();
    
    this.strategies.forEach(strategy => {
      // 策略名称匹配
      if (strategy.name.toLowerCase().includes(lowerTerm)) {
        suggestions.add(strategy.name);
      }
      
      // 分类匹配
      if (strategy.category.toLowerCase().includes(lowerTerm)) {
        suggestions.add(strategy.category);
      }
      
      // 描述关键词匹配
      const descWords = strategy.description.toLowerCase().split(/\s+/);
      descWords.forEach(word => {
        if (word.includes(lowerTerm) && word.length > 2) {
          suggestions.add(word);
        }
      });
    });
    
    return Array.from(suggestions).slice(0, 8);
  }

  // 加载策略类型和分类元数据
  loadMeta = async () => {
    try {
      const res = await strategyApi.getStrategyMeta();
      if (res.success && res.data) {
        this.strategyTypes = res.data.types;
        this.categories = res.data.categories;
      }
    } catch (e) {
      console.error('获取策略类型和分类失败', e);
    }
  }
}

export const strategyStore = new StrategyStore(); 