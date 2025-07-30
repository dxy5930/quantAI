import React, { memo } from 'react';
import { observer } from 'mobx-react-lite';
import { ArrowUpDown, ChevronDown } from 'lucide-react';
import { useStore } from '../../hooks/useStore';

interface SortOption {
  value: string;
  label: string;
}

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options?: SortOption[];
  className?: string;
  disabled?: boolean;
  showIcon?: boolean;
  onBlur?: (event: React.FocusEvent<HTMLSelectElement>) => void;
}

export const SortDropdown: React.FC<SortDropdownProps> = observer(({
  value,
  onChange,
  options,
  className = '',
  disabled = false,
  showIcon = true,
  onBlur,
}) => {
  const { meta } = useStore();

  // 获取当前可用的排序选项数据
  const sortOptions = options || meta.getSortOptions();
  const loading = !options && meta.isLoading;
  const error = !options && meta.error;
  const loaded = options || meta.isLoaded;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {showIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
            <ArrowUpDown className="text-gray-500 dark:text-gray-400 w-4 h-4" />
          </div>
        )}
        <select
          value={error || !loaded ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={`
            w-full
            ${showIcon ? 'pl-10' : 'pl-4'} pr-10 py-3
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
            <option value="">选择排序</option>
          ) : !loaded ? (
            <option value="">选择排序</option>
          ) : sortOptions.length > 0 ? (
            sortOptions.map(option => (
              <option 
                key={option.value} 
                value={option.value}
                className="bg-white dark:bg-gray-800 py-2"
              >
                {option.label}
              </option>
            ))
          ) : (
            <option value="">选择排序</option>
          )}
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <ChevronDown className="text-gray-500 dark:text-gray-400 w-4 h-4" />
        </div>
      </div>
    </div>
  );
}); 