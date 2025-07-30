import React from 'react';
import { EnhancedSearchFilter } from './EnhancedSearchFilter';

interface SearchFilterContainerProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  selectedStrategyType?: string;
  onStrategyTypeChange?: (strategyType: string) => void;
  sortBy?: string;
  onSortChange?: (sortBy: string) => void;
  searchPlaceholder?: string;
  config: {
    categories?: { value: string; label: string }[];
    strategyTypes?: { value: string; label: string; description?: string }[];
    sortOptions?: { value: string; label: string }[];
    showStrategyTypes?: boolean;
    showSort?: boolean;
  };
  className?: string;
}

export const SearchFilterContainer: React.FC<SearchFilterContainerProps> = ({
  className = '',
  ...filterProps
}) => {
  return (
    <div className={`sticky top-20 z-40 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
      <EnhancedSearchFilter {...filterProps} />
    </div>
  );
}; 