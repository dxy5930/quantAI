import React, { useEffect, useMemo, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import {
  SearchFilterContainer,
  LoadMoreIndicator,
  LoadingSpinner,
  AdvancedMasonryGrid,
  SkeletonLoader,
} from "../../components/common";
import { EnhancedStrategyCard } from "../../components/strategy/EnhancedStrategyCard";
import { useStore, useLoadMore, useMetaData } from "../../hooks";
import { Strategy } from "../../types";
import { SortOrder } from "../../constants/strategyTypes";

export const StrategyListPage: React.FC = observer(() => {
  const { strategy } = useStore();
  const navigate = useNavigate();
  
  // 使用自定义hook加载meta数据
  const { categories, strategyTypes, sortOptions } = useMetaData();

  // 加载更多功能
  const { 
    isLoading: isLoadingMore, 
    isEnd, 
    reset: resetLoadMore 
  } = useLoadMore(
    async () => {
      return await strategy.loadMoreStrategies();
    },
    {
      threshold: 200,
      enabled: true,
      debounceDelay: 300,
    }
  );

  // 处理搜索词变化（防抖）
  const handleSearchChange = useCallback((searchTerm: string) => {
    strategy.setSearchTerm(searchTerm);
    resetLoadMore();
  }, [strategy, resetLoadMore]);

  // 处理分类变化
  const handleCategoryChange = useCallback((category: string) => {
    strategy.setSelectedCategory(category);
    resetLoadMore();
  }, [strategy, resetLoadMore]);

  // 处理策略类型变化
  const handleStrategyTypeChange = useCallback((strategyType: string) => {
    strategy.setSelectedStrategyType(strategyType);
    resetLoadMore();
  }, [strategy, resetLoadMore]);

  // 处理排序变化
  const handleSortChange = useCallback((sortBy: string) => {
    strategy.setSortBy(sortBy);
    resetLoadMore();
  }, [strategy, resetLoadMore]);

  // 复用的搜索过滤器配置 - 减少依赖项
  const searchFilterConfig = useMemo(() => ({
    categories,
    strategyTypes,
    sortOptions,
    showStrategyTypes: true,
    showSort: true,
  }), [categories, strategyTypes, sortOptions]);

  // 优化回调函数，避免重新创建
  const handleStrategySelect = useCallback((strategyItem: Strategy) => {
    strategy.setSelectedStrategy(strategyItem);
    navigate(`/strategy/${strategyItem.id}`);
  }, [strategy, navigate]);

  // 搜索过滤器组件 - 使用Store状态
  const SearchFilterComponent = useMemo(() => (
    <SearchFilterContainer
      searchTerm={strategy.searchTerm}
      onSearchChange={handleSearchChange}
      selectedCategory={strategy.selectedCategory}
      onCategoryChange={handleCategoryChange}
      selectedStrategyType={strategy.selectedStrategyType}
      onStrategyTypeChange={handleStrategyTypeChange}
      sortBy={strategy.sortBy}
      onSortChange={handleSortChange}
      config={searchFilterConfig}
      searchPlaceholder="搜索策略名称、描述或标签..."
    />
  ), [
    strategy.searchTerm,
    strategy.selectedCategory,
    strategy.selectedStrategyType,
    strategy.sortBy,
    searchFilterConfig,
    handleSearchChange,
    handleCategoryChange,
    handleStrategyTypeChange,
    handleSortChange,
  ]);

  useEffect(() => {
    // 重置加载更多状态
    resetLoadMore();
    
    // 初始化加载策略列表
    strategy.loadStrategies();
  }, [strategy, resetLoadMore]);

  // 页面标题组件
  const PageTitle = useCallback(() => (
    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
      策略列表
    </h1>
  ), []);

  // 如果正在加载初始数据，显示loading
  if (strategy.strategiesLoading && strategy.filteredStrategies.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <PageTitle />
          {SearchFilterComponent}
        </div>

        {/* 加载状态 */}
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            正在加载策略列表...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <PageTitle />
        {SearchFilterComponent}
      </div>

      {/* 策略列表加载状态和内容 */}
      {strategy.strategiesLoading && strategy.filteredStrategies.length === 0 ? (
        <SkeletonLoader variant="grid" count={8} />
      ) : (
        <>
          {/* 策略列表 - 瀑布流布局 */}
          {strategy.filteredStrategies.length > 0 && (
            <AdvancedMasonryGrid
              columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
              gap={24}
              className="w-full"
              itemClassName="w-full"
            >
              {strategy.filteredStrategies.map((strategyItem) => (
                <EnhancedStrategyCard
                  key={strategyItem.id}
                  strategy={strategyItem}
                  onSelect={handleStrategySelect}
                  variant="default"
                />
              ))}
            </AdvancedMasonryGrid>
          )}

          {/* 空状态 */}
          {!strategy.strategiesLoading &&
            strategy.filteredStrategies.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-600 dark:text-gray-400 text-lg">
                  未找到匹配的策略
                </div>
                <div className="text-gray-500 dark:text-gray-500 mt-2">
                  尝试调整搜索条件或选择不同的分类
                </div>
              </div>
            )}

          {/* 加载更多指示器 */}
          <LoadMoreIndicator
            isLoading={isLoadingMore || strategy.loadingMore}
            isEnd={isEnd || !strategy.hasMore}
            itemCount={strategy.filteredStrategies.length}
            loadingText="加载更多策略中..."
            endText="已加载全部策略"
          />
        </>
      )}
    </div>
  );
});
