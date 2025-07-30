import React, { memo, useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useCompositionInput } from '../../hooks/useCompositionInput';

interface StrategySearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  debounceMs?: number;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  [key: string]: any;
}

/**
 * 通用带icon的搜索输入框组件
 * 支持中文输入法优化
 */
export const StrategySearchInput: React.FC<StrategySearchInputProps> = memo(({
  value,
  onChange,
  placeholder = '搜索...',
  icon = <Search className="w-4 h-4" />,
  className = '',
  disabled = false,
  debounceMs = 300,
  onBlur,
  onFocus,
  ...rest
}) => {
  const [inputValue, setInputValue] = useState(value);

  // 同步外部value到内部state
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const {
    isComposing,
    handleInputChange,
    handleCompositionStart,
    handleCompositionEnd
  } = useCompositionInput({
    onChange,
    debounceMs
  });

  // 处理输入变化，立即更新显示值
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    handleInputChange(e);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 text-gray-500 dark:text-gray-400">
        {icon}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onBlur={onBlur}
        onFocus={onFocus}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full 
          pl-10 pr-4 py-3 
          bg-white dark:bg-gray-800 
          border border-gray-300 dark:border-gray-700 
          rounded-xl 
          text-gray-900 dark:text-white 
          text-sm font-medium
          placeholder-gray-500 dark:placeholder-gray-400 
          focus:outline-none 
          focus:border-blue-500 
          focus:ring-2 
          focus:ring-blue-500/20 
          transition-all duration-300 
          shadow-sm
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-md'}
          ${isComposing ? 'border-yellow-400 dark:border-yellow-500' : ''}
        `}
        {...rest}
      />
    </div>
  );
});

export default StrategySearchInput; 