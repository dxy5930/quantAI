import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { scrollToTopSmooth } from '../utils/scrollToTop';

export interface SearchFilterState {
  searchTerm: string;
  selectedCategory: string;
  selectedStrategyType: string;
  sortBy: string;
}

export interface SearchFilterConfig {
  categories?: { value: string; label: string }[];
  strategyTypes?: { value: string; label: string; description?: string }[];
  sortOptions?: { value: string; label: string }[];
  showStrategyTypes?: boolean;
  showSort?: boolean;
  showCategories?: boolean;
}

export interface UseSearchFilterOptions {
  initialSearchTerm?: string;
  initialCategory?: string;
  initialStrategyType?: string;
  initialSortBy?: string;
  debounceMs?: number;
  onFilterChange?: (filters: SearchFilterState) => void;
}

export const useSearchFilter = (options: UseSearchFilterOptions = {}) => {
  const {
    initialSearchTerm = '',
    initialCategory = 'all',
    initialStrategyType = 'all',
    initialSortBy = 'popularity',
    debounceMs = 300,
    onFilterChange
  } = options;

  // 本地状态管理
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedStrategyType, setSelectedStrategyType] = useState(initialStrategyType);
  const [sortBy, setSortBy] = useState(initialSortBy);

  // 防抖搜索
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  // 当前筛选状态
  const currentFilters = useMemo(() => ({
    searchTerm: debouncedSearchTerm,
    selectedCategory,
    selectedStrategyType,
    sortBy
  }), [debouncedSearchTerm, selectedCategory, selectedStrategyType, sortBy]);

  // 处理搜索词变化
  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // 处理分类变化
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  // 处理策略类型变化
  const handleStrategyTypeChange = useCallback((strategyType: string) => {
    setSelectedStrategyType(strategyType);
  }, []);

  // 处理排序变化
  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort);
  }, []);

  // 重置所有筛选条件
  const resetFilters = useCallback(() => {
    setSearchTerm(initialSearchTerm);
    setSelectedCategory(initialCategory);
    setSelectedStrategyType(initialStrategyType);
    setSortBy(initialSortBy);
  }, [initialSearchTerm, initialCategory, initialStrategyType, initialSortBy]);

  // 清除搜索词
  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  // 当筛选条件变化时触发回调
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(currentFilters);
      // 筛选条件变化时滚动到顶部
      scrollToTopSmooth();
    }
  }, [currentFilters, onFilterChange]);

  return {
    // 状态
    searchTerm,
    selectedCategory,
    selectedStrategyType,
    sortBy,
    debouncedSearchTerm,
    currentFilters,
    
    // 操作方法
    setSearchTerm: handleSearchChange,
    setSelectedCategory: handleCategoryChange,
    setSelectedStrategyType: handleStrategyTypeChange,
    setSortBy: handleSortChange,
    resetFilters,
    clearSearch,
    
    // 判断是否有筛选条件
    hasActiveFilters: searchTerm || selectedCategory !== 'all' || selectedStrategyType !== 'all',
    
    // 判断是否有搜索词
    hasSearchTerm: !!searchTerm,
  };
}; 