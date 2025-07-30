import React, { useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { useStore, useLoadMore, useMetaData, useSearchFilter } from '../../hooks';
import {
  SearchFilterContainer,
  AdvancedMasonryGrid,
  EnhancedStrategyCard,
  StrategyStatistics,
  SkeletonLoader,
  EmptyState,
  LoadMoreIndicator
} from '../../components';
import { Strategy } from '../../types';
import { Share2, Search } from 'lucide-react';
import { SortOrder, STRATEGY_FILTER_VALUES } from '../../constants/strategyTypes';
import { SearchFilterState } from '../../hooks/useSearchFilter';

const StrategySquarePage: React.FC = observer(() => {
  const { strategy, user, app } = useStore();
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

  // 处理筛选条件变化的回调函数
  const handleFilterChange = useCallback((filters: SearchFilterState) => {
    // 同步搜索状态到 StrategyStore（使用 update 方法避免重复请求）
    strategy.updateSearchTerm(filters.searchTerm);
    strategy.updateSelectedCategory(filters.selectedCategory);
    strategy.updateSelectedStrategyType(filters.selectedStrategyType);
    strategy.updateSortBy(filters.sortBy);
    
    // 当筛选条件变化时，重置分页并重新加载数据
    strategy.resetPagination();
    
    // 重置加载更多状态
    resetLoadMore();
    
    strategy.loadStrategies({
      search: filters.searchTerm,
              category: filters.selectedCategory === STRATEGY_FILTER_VALUES.ALL ? undefined : filters.selectedCategory,
      strategyType: filters.selectedStrategyType === STRATEGY_FILTER_VALUES.ALL ? undefined : filters.selectedStrategyType,
      sortBy: filters.sortBy,
      sortOrder: SortOrder.DESC,
      page: 1,
      limit: strategy.pageSize,
    });
  }, [strategy, resetLoadMore]);

  // 使用独立的搜索筛选状态
  const searchFilter = useSearchFilter({
    initialSearchTerm: '',
    initialCategory: 'all',
    initialStrategyType: 'all',
    initialSortBy: 'popularity',
    debounceMs: 500,
    onFilterChange: handleFilterChange
  });

  // 页面初始化时加载数据
  useEffect(() => {
    // 重置分页状态
    strategy.resetPagination();
    
    // 重置加载更多状态
    resetLoadMore();
    
    // 加载策略数据
    strategy.loadStrategies();
  }, [strategy, resetLoadMore]);

  const handleStrategyClick = useCallback((strategyItem: Strategy) => {
    strategy.setSelectedStrategy(strategyItem);
    navigate(`/strategy/${strategyItem.id}`);
  }, [strategy, navigate]);

  const handleClearFilters = useCallback(() => {
    searchFilter.resetFilters();
  }, [searchFilter]);

  // 获取筛选后的策略列表
  const filteredStrategies = strategy.filteredStrategies;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
            <Share2 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">策略广场</h1>
            <p className="text-gray-600 dark:text-gray-400">发现和分享优秀的量化策略</p>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <StrategyStatistics />

      {/* 搜索和筛选 */}
      <SearchFilterContainer
        searchTerm={searchFilter.searchTerm}
        onSearchChange={searchFilter.setSearchTerm}
        selectedCategory={searchFilter.selectedCategory}
        onCategoryChange={searchFilter.setSelectedCategory}
        selectedStrategyType={searchFilter.selectedStrategyType}
        onStrategyTypeChange={searchFilter.setSelectedStrategyType}
        sortBy={searchFilter.sortBy}
        onSortChange={searchFilter.setSortBy}
        searchPlaceholder="搜索策略名称、描述、作者或标签..."
        config={{
          categories: categories,
          strategyTypes: strategyTypes,
          sortOptions: sortOptions,
          showStrategyTypes: true,
          showSort: true,
        }}
      />

      {/* 策略列表 - 瀑布流布局 */}
      {strategy.strategiesLoading && strategy.filteredStrategies.length === 0 ? (
        <SkeletonLoader variant="grid" count={8} />
      ) : (
        <>
          {filteredStrategies.length > 0 ? (
            <>
              <AdvancedMasonryGrid
                columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
                gap={24}
                className="w-full"
                itemClassName="w-full"
              >
                {filteredStrategies.map((strategyItem) => (
                  <EnhancedStrategyCard
                    key={strategyItem.id}
                    strategy={strategyItem}
                    onSelect={handleStrategyClick}
                    variant="shared"
                  />
                ))}
              </AdvancedMasonryGrid>
              
              {/* 加载更多指示器 */}
              <LoadMoreIndicator 
                isLoading={isLoadingMore || strategy.loadingMore} 
                isEnd={isEnd || !strategy.hasMore}
                itemCount={filteredStrategies.length}
                loadingText="加载更多策略中..."
                endText="已加载全部策略"
                className="mt-8"
              />
            </>
          ) : (
            <EmptyState
              title="暂无策略"
              description="当前筛选条件下没有找到匹配的策略"
              icon={Search}
              action={{
                label: "清除筛选",
                onClick: handleClearFilters
              }}
            />
          )}
        </>
      )}
    </div>
  );
});

export default StrategySquarePage; 