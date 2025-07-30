import { appStore } from '../stores/AppStore';
import { strategyStore } from '../stores/StrategyStore';
import { userStore } from '../stores/UserStore';
import { metaStore } from '../stores/MetaStore';
import { homeStore } from '../stores/HomeStore';

// 主要的store hook，返回所有store的组合
export const useStore = () => {
  return {
    app: appStore,
    strategy: strategyStore,
    user: userStore,
    meta: metaStore,
    home: homeStore
  };
};

// 单独的store hooks，用于只需要特定store的组件
export const useAppStore = () => {
  if (!appStore) {
    throw new Error('AppStore 未正确初始化');
  }
  return appStore;
};

export const useStrategyStore = () => {
  if (!strategyStore) {
    throw new Error('StrategyStore 未正确初始化');
  }
  return strategyStore;
};

export const useUserStore = () => {
  if (!userStore) {
    throw new Error('UserStore 未正确初始化');
  }
  return userStore;
};

// 为了向后兼容，保留原有的接口
export const useStoreCompat = () => {
  // 返回一个兼容原有AppStore接口的对象
  return {
    // 策略相关方法代理到strategyStore
    strategies: strategyStore.strategies,
    selectedStrategy: strategyStore.selectedStrategy,
    searchTerm: strategyStore.searchTerm,
    selectedCategory: strategyStore.selectedCategory,
    filteredStrategies: strategyStore.filteredStrategies,
    categories: strategyStore.categories,
    setSelectedStrategy: strategyStore.setSelectedStrategy,
    setSearchTerm: strategyStore.setSearchTerm,
    setSelectedCategory: strategyStore.setSelectedCategory,
    
    // 回测相关方法代理到strategyStore
    backtestResults: strategyStore.backtestResults,
    isBacktesting: strategyStore.isBacktesting,
    setBacktestResults: strategyStore.setBacktestResults,
    setIsBacktesting: strategyStore.setIsBacktesting,
    
    // UI相关方法代理到appStore
    currentView: appStore.currentView,
    setCurrentView: appStore.setCurrentView,
    stats: appStore.stats,
    
    // 用户相关方法代理到userStore
    isLoggedIn: userStore.isLoggedIn,
    currentUser: userStore.currentUser
  };
};