import { useState, useCallback } from 'react';

export interface UseAsyncActionResult {
  isLoading: boolean;
  execute: (fn: () => Promise<void>) => Promise<void>;
  setLoading: (loading: boolean) => void;
}

/**
 * 异步操作防抖 Hook
 * 只负责管理一个 loading 状态，防止重复点击
 * @returns loading状态和执行方法
 */
export const useAsyncAction = (): UseAsyncActionResult => {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 执行异步操作，自动管理loading状态
   * @param fn 要执行的异步函数
   */
  const execute = useCallback(async (fn: () => Promise<void>) => {
    if (isLoading || !fn) return;
    
    try {
      setIsLoading(true);
      await fn();
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  return {
    isLoading,
    execute,
    setLoading: setIsLoading,
  };
}; 