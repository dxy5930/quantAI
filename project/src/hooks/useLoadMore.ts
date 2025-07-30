import { useEffect, useRef, useCallback, useState } from "react";

export interface LoadMoreOptions {
  threshold?: number;
  enabled?: boolean;
  debounceDelay?: number;
}

export interface LoadMoreResult {
  isLoading: boolean;
  isEnd: boolean;
  loadMore: () => void;
  reset: () => void;
}

export function useLoadMore(
  onLoadMore: () => Promise<boolean> | boolean,
  options: LoadMoreOptions = {}
): LoadMoreResult {
  const {
    threshold = 200,
    enabled = true,
    debounceDelay = 300,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [isEnd, setIsEnd] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || isEnd) return;

    console.log('开始loadMore');
    setIsLoading(true);
    try {
      console.log('调用onLoadMore');
      const hasMore = await onLoadMore();
      console.log('onLoadMore返回:', hasMore);
      if (!hasMore) {
        console.log('设置isEnd=true');
        setIsEnd(true);
      }
    } catch (error) {
      console.error("加载更多失败:", error);
    } finally {
      setIsLoading(false);
      console.log('loadMore完成');
    }
  }, [onLoadMore, isLoading, isEnd]);

  const handleScroll = useCallback(() => {
    if (!enabled || isLoading || isEnd) {
      console.log('滚动被阻止:', { enabled, isLoading, isEnd });
      return;
    }

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;

    console.log('滚动:', { distanceToBottom, threshold, isLoading, isEnd, enabled });

    if (distanceToBottom <= threshold) {
      console.log('触发加载更多');
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (!isLoading && !isEnd && enabled) {
          console.log('执行loadMore');
          loadMore();
        }
      }, debounceDelay);
    }
  }, [enabled, threshold, debounceDelay, loadMore, isLoading, isEnd]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsEnd(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [handleScroll, enabled]);

  return {
    isLoading,
    isEnd,
    loadMore,
    reset,
  };
}
