import React, { useEffect } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { observer } from 'mobx-react-lite';

interface CategoryDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options?: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onBlur?: (event: React.FocusEvent<HTMLSelectElement>) => void;
}

export const CategoryDropdown: React.FC<CategoryDropdownProps> = observer(({
  value,
  onChange,
  options,
  placeholder = '选择分类',
  className = '',
  disabled = false,
  onBlur,
}) => {
  const { meta } = useStore();

  // 获取当前可用的分类数据
  const categories = options || meta.getStrategyCategories();
  const loading = !options && meta.isLoading;
  const error = !options && meta.error;
  const loaded = options || meta.isLoaded;


  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
          <Filter className="text-gray-500 dark:text-gray-400 w-4 h-4" />
        </div>
        <select
          value={error || !loaded ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={`
            w-full
            pl-10 pr-10 py-3
            bg-white dark:bg-gray-800 
            border border-gray-300 dark:border-gray-700 
            rounded-xl 
            text-gray-900 dark:text-white 
            text-sm font-medium
            focus:outline-none 
            focus:border-blue-500 
            focus:ring-2 
            focus:ring-blue-500/20 
            transition-all duration-300 
            shadow-sm
            appearance-none
            cursor-pointer
            ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-md'}
          `}
          disabled={disabled || loading}
        >
          {loading ? (
            <option value="">加载中...</option>
          ) : error ? (
            <option value="">{placeholder}</option>
          ) : !loaded ? (
            <option value="">{placeholder}</option>
          ) : categories.length > 0 ? (
            categories.map(option => (
              <option 
                key={option.value} 
                value={option.value}
                className="bg-white dark:bg-gray-800 py-2"
              >
                {option.label}
              </option>
            ))
          ) : (
            <option value="">{placeholder}</option>
          )}
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <ChevronDown className="text-gray-500 dark:text-gray-400 w-4 h-4" />
        </div>
      </div>
    </div>
  );
});