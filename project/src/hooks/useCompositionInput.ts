import { useState, useCallback, useRef, useEffect } from 'react';

interface UseCompositionInputOptions {
  onChange: (value: string) => void;
  debounceMs?: number;
}

/**
 * 中文输入法优化Hook
 * 处理组合输入事件，避免在输入过程中触发搜索
 */
export const useCompositionInput = ({
  onChange,
  debounceMs = 300
}: UseCompositionInputOptions) => {
  const [isComposing, setIsComposing] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // 防抖处理
  const debouncedOnChange = useCallback((newValue: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  }, [onChange, debounceMs]);

  // 处理输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // 如果正在组合输入（中文输入法），不触发防抖的onChange
    if (!isComposing) {
      debouncedOnChange(newValue);
    }
  }, [isComposing, debouncedOnChange]);

  // 开始组合输入（中文输入法开始）
  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  // 结束组合输入（中文输入法结束）
  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    const newValue = (e.target as HTMLInputElement).value;
    
    // 组合输入结束后，立即触发onChange
    onChange(newValue);
  }, [onChange]);

  return {
    isComposing,
    handleInputChange,
    handleCompositionStart,
    handleCompositionEnd
  };
};

export default useCompositionInput; 