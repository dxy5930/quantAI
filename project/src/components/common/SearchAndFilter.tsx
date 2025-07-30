import React from 'react';
import { StrategySearchInput } from './StrategySearchInput';
import { CategoryDropdown } from './CategoryDropdown';
import { StrategyTypeDropdown } from './StrategyTypeDropdown';

interface SearchAndFilterProps {
  searchTerm: string;
  selectedCategory: string;
  selectedStrategyType?: string;
  categories?: { value: string; label: string }[];
  strategyTypes?: { value: string; label: string }[];
  onSearchChange: (term: string) => void;
  onCategoryChange: (category: string) => void;
  onStrategyTypeChange?: (strategyType: string) => void;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchTerm,
  selectedCategory,
  selectedStrategyType,
  categories,
  strategyTypes,
  onSearchChange,
  onCategoryChange,
  onStrategyTypeChange
}) => {
  return (
    <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm shadow-gray-200/50 dark:shadow-gray-800/50 animate-slide-up">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        <div className="flex-1 min-w-0">
          <StrategySearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="搜索策略..."
            className="w-full"
          />
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {strategyTypes && onStrategyTypeChange && (
            <StrategyTypeDropdown
              value={selectedStrategyType || ''}
              onChange={onStrategyTypeChange}
              options={strategyTypes}
              className="min-w-[140px]"
            />
          )}
          <CategoryDropdown
            value={selectedCategory}
            onChange={onCategoryChange}
            options={categories}
            className="min-w-[140px]"
          />
        </div>
      </div>
    </div>
  );
};