import React, { memo } from 'react';
import { Search, Filter, Settings, ArrowUpDown, ChevronDown } from 'lucide-react';
import { CategoryDropdown } from './CategoryDropdown';
import { StrategyTypeDropdown } from './StrategyTypeDropdown';
import { SortDropdown } from './SortDropdown';
import { StrategySearchInput } from './StrategySearchInput';

interface FilterConfig {
  categories?: { value: string; label: string }[];
  showStrategyTypes?: boolean;
  strategyTypes?: { value: string; label: string }[];
  sortOptions?: { value: string; label: string }[];
  showSort?: boolean;
}

interface EnhancedSearchFilterProps {
  // 搜索相关
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchPlaceholder?: string;
  
  // 分类筛选
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  
  // 策略类型筛选
  selectedStrategyType?: string;
  onStrategyTypeChange?: (strategyType: string) => void;
  
  // 排序
  sortBy?: string;
  onSortChange?: (sortBy: string) => void;
  
  // 配置
  config?: FilterConfig;
  
  // 样式
  className?: string;
  layout?: 'horizontal' | 'vertical';
}

export const EnhancedSearchFilter: React.FC<EnhancedSearchFilterProps> = memo(({
  searchTerm,
  onSearchChange,
  searchPlaceholder = '搜索...',
  selectedCategory,
  onCategoryChange,
  selectedStrategyType,
  onStrategyTypeChange,
  sortBy,
  onSortChange,
  config = {},
  className = '',
  layout = 'horizontal',
}) => {
  const {
    categories,
    showStrategyTypes = false,
    strategyTypes,
    sortOptions,
    showSort = false,
  } = config;

  const containerClasses = `
    ${layout === 'horizontal' ? 'flex flex-col lg:flex-row gap-4 lg:gap-6' : 'flex flex-col gap-4'}
    ${className}
  `;

  return (
    <div className={containerClasses}>
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
        {selectedCategory !== undefined && onCategoryChange && (
          <div className="relative">
            <CategoryDropdown
              value={selectedCategory}
              onChange={onCategoryChange}
              options={categories}
              className="min-w-[140px]"
            />
          </div>
        )}
        
        {/* 策略类型筛选 */}
        {showStrategyTypes && selectedStrategyType !== undefined && onStrategyTypeChange && (
          <div className="relative">
            <StrategyTypeDropdown
              value={selectedStrategyType}
              onChange={onStrategyTypeChange}
              options={strategyTypes}
              className="min-w-[140px]"
            />
          </div>
        )}
        
        {/* 排序 */}
        {showSort && sortBy !== undefined && onSortChange && (
          <div className="relative">
            <SortDropdown
              value={sortBy}
              onChange={onSortChange}
              options={sortOptions}
              className="min-w-[140px]"
            />
          </div>
        )}
      </div>
    </div>
  );
}); 