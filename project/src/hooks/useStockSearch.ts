import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { stocksApi, StockOption } from '../services/api/stocksApi';

interface UseStockSearchOptions {
  debounceMs?: number;
  minSearchLength?: number;
}

interface UseStockSearchReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchResults: StockOption[];
  isLoading: boolean;
  error: string | null;
  clearSearch: () => void;
}

export const useStockSearch = (options: UseStockSearchOptions = {}): UseStockSearchReturn => {
  const {
    debounceMs = 300,
    minSearchLength = 1
  } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<StockOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 防抖处理搜索词
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  // 搜索股票
  const searchStocks = useCallback(async (term: string) => {
    if (!term || term.length < minSearchLength) {
      setSearchResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await stocksApi.searchStocks({
        q: term
      });

      if (response.success && response.data) {
        setSearchResults(response.data);
      } else {
        setSearchResults([]);
        setError(response.message || '搜索失败');
      }
    } catch (err) {
      console.error('股票搜索错误:', err);
      setSearchResults([]);
      setError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }, [minSearchLength]);

  // 当防抖后的搜索词变化时执行搜索
  useEffect(() => {
    searchStocks(debouncedSearchTerm);
  }, [debouncedSearchTerm, searchStocks]);

  // 清除搜索
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchResults([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    isLoading,
    error,
    clearSearch
  };
}; 