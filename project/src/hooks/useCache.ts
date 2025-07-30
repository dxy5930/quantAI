import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheOptions {
  ttl?: number; // 缓存时间（毫秒）
  maxSize?: number; // 最大缓存数量
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  set(key: string, data: T, ttl = 5 * 60 * 1000): void {
    // 如果缓存已满，删除最旧的项
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// 全局缓存实例
const globalCache = new MemoryCache(200);

// 缓存Hook
export const useCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) => {
  const { ttl = 5 * 60 * 1000, maxSize = 100 } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef(new MemoryCache<T>(maxSize));

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // 检查缓存
      if (!forceRefresh) {
        const cachedData = cacheRef.current.get(key);
        if (cachedData !== null) {
          setData(cachedData);
          setLoading(false);
          return cachedData;
        }
      }

      // 获取新数据
      const newData = await fetcher();
      
      // 存入缓存
      cacheRef.current.set(key, newData, ttl);
      setData(newData);
      
      return newData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const clearCache = useCallback(() => {
    cacheRef.current.delete(key);
    setData(null);
  }, [key]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    clearCache,
    refetch: fetchData,
  };
};

// 全局缓存Hook
export const useGlobalCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) => {
  const { ttl = 5 * 60 * 1000 } = options;
  const [data, setData] = useState<T | null>(() => globalCache.get(key));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // 检查全局缓存
      if (!forceRefresh) {
        const cachedData = globalCache.get(key);
        if (cachedData !== null) {
          setData(cachedData);
          setLoading(false);
          return cachedData;
        }
      }

      // 获取新数据
      const newData = await fetcher();
      
      // 存入全局缓存
      globalCache.set(key, newData, ttl);
      setData(newData);
      
      return newData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const clearCache = useCallback(() => {
    globalCache.delete(key);
    setData(null);
  }, [key]);

  useEffect(() => {
    // 只在没有缓存数据时才获取
    if (data === null) {
      fetchData();
    }
  }, [fetchData, data]);

  return {
    data,
    loading,
    error,
    refresh,
    clearCache,
    refetch: fetchData,
  };
};

// 缓存管理工具
export const cacheManager = {
  clear: () => globalCache.clear(),
  delete: (key: string) => globalCache.delete(key),
  has: (key: string) => globalCache.has(key),
  size: () => globalCache.size(),
};