import React, { memo } from 'react';
import { Search, Filter, Settings, ArrowUpDown, Sparkles } from 'lucide-react';
import { StrategySearchInput } from './StrategySearchInput';
import { CategoryDropdown } from './CategoryDropdown';
import { StrategyTypeDropdown } from './StrategyTypeDropdown';
import { SortDropdown } from './SortDropdown';

interface BeautifulFilterProps {
  // 搜索
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchPlaceholder?: string;
  
  // 分类筛选
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  categories?: { value: string; label: string }[];
  
  // 策略类型筛选
  selectedStrategyType?: string;
  onStrategyTypeChange?: (strategyType: string) => void;
  strategyTypes?: { value: string; label: string }[];
  
  // 排序
  sortBy?: string;
  onSortChange?: (sortBy: string) => void;
  sortOptions?: { value: string; label: string }[];
  
  // 显示控制
  showStrategyTypes?: boolean;
  showSort?: boolean;
  showCategories?: boolean;
  
  // 样式
  className?: string;
  compact?: boolean;
}

export const BeautifulFilter: React.FC<BeautifulFilterProps> = memo(({
  searchTerm,
  onSearchChange,
  searchPlaceholder = '搜索策略...',
  selectedCategory,
  onCategoryChange,
  categories,
  selectedStrategyType,
  onStrategyTypeChange,
  strategyTypes,
  sortBy,
  onSortChange,
  sortOptions,
  showStrategyTypes = false,
  showSort = false,
  showCategories = true,
  className = '',
  compact = false,
}) => {
  const containerClass = compact 
    ? `p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm ${className}`
    : `p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm shadow-gray-200/50 dark:shadow-gray-800/50 ${className}`;

  return (
    <div className={`${containerClass} animate-slide-up`}>
      {/* 标题区域 */}
      {!compact && (
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <span className="font-medium">智能筛选</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-blue-500/20 to-transparent"></div>
        </div>
      )}

      {/* 筛选内容 */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* 搜索框 */}
        <div className="flex-1 min-w-0">
          <StrategySearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="w-full"
          />
        </div>
        
        {/* 筛选器组 */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* 分类筛选 */}
          {showCategories && selectedCategory !== undefined && onCategoryChange && (
            <CategoryDropdown
              value={selectedCategory}
              onChange={onCategoryChange}
              options={categories}
              className="min-w-[140px]"
            />
          )}
          
          {/* 策略类型筛选 */}
          {showStrategyTypes && selectedStrategyType !== undefined && onStrategyTypeChange && (
            <StrategyTypeDropdown
              value={selectedStrategyType}
              onChange={onStrategyTypeChange}
              options={strategyTypes}
              className="min-w-[140px]"
            />
          )}
          
          {/* 排序 */}
          {showSort && sortBy !== undefined && onSortChange && (
            <SortDropdown
              value={sortBy}
              onChange={onSortChange}
              options={sortOptions}
              className="min-w-[140px]"
            />
          )}
        </div>
      </div>

      {/* 快速筛选标签 */}
      {!compact && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">快速筛选:</span>
          <button className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
            热门策略
          </button>
          <button className="px-3 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
            高评分
          </button>
          <button className="px-3 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
            新发布
          </button>
        </div>
      )}
    </div>
  );
}); 