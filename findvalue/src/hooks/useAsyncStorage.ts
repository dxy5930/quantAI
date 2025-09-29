import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UseAsyncStorageOptions {
  defaultValue?: any;
  serializer?: {
    stringify: (value: any) => string;
    parse: (value: string) => any;
  };
}

// 独立的存储工具类，可在非 React 环境中使用（如 MobX store）
export class AsyncStorageUtil {
  private static defaultSerializer = {
    stringify: JSON.stringify,
    parse: JSON.parse,
  };

  // 获取数据
  static async getItem<T = any>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        return this.defaultSerializer.parse(value);
      }
      return defaultValue ?? null;
    } catch (error) {
      console.error(`获取存储数据失败 (key: ${key}):`, error);
      return defaultValue ?? null;
    }
  }

  // 设置数据
  static async setItem<T = any>(key: string, value: T): Promise<boolean> {
    try {
      const stringValue = this.defaultSerializer.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
      return true;
    } catch (error) {
      console.error(`保存存储数据失败 (key: ${key}):`, error);
      return false;
    }
  }

  // 删除数据
  static async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`删除存储数据失败 (key: ${key}):`, error);
      return false;
    }
  }

  // 批量获取数据
  static async multiGet<T = any>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      const results = await AsyncStorage.multiGet(keys);
      const data: Record<string, T | null> = {};
      
      results.forEach(([key, value]) => {
        if (value !== null) {
          try {
            data[key] = this.defaultSerializer.parse(value);
          } catch (parseError) {
            console.error(`解析存储数据失败 (key: ${key}):`, parseError);
            data[key] = null;
          }
        } else {
          data[key] = null;
        }
      });
      
      return data;
    } catch (error) {
      console.error('批量获取存储数据失败:', error);
      return {};
    }
  }

  // 批量删除数据
  static async multiRemove(keys: string[]): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      console.error('批量删除存储数据失败:', error);
      return false;
    }
  }

  // 清空所有数据
  static async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('清空存储数据失败:', error);
      return false;
    }
  }
}

export function useAsyncStorage<T = any>(
  key: string,
  options: UseAsyncStorageOptions = {}
) {
  const {
    defaultValue,
    serializer = {
      stringify: JSON.stringify,
      parse: JSON.parse,
    },
  } = options;

  const [data, setData] = useState<T | undefined>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 使用 useRef 防止内存泄漏
  const isMountedRef = useRef(true);
  const pendingPromisesRef = useRef<Set<Promise<any>>>(new Set());

  // 创建带有清理机制的异步操作包装器
  const createSafeAsyncOperation = useCallback(<T>(promise: Promise<T>): Promise<T> => {
    pendingPromisesRef.current.add(promise);
    
    return promise.finally(() => {
      if (pendingPromisesRef.current.has(promise)) {
        pendingPromisesRef.current.delete(promise);
      }
    });
  }, []);

  // 获取数据 - 使用 AsyncStorageUtil 的逻辑但保持 hook 的状态管理
  const getData = useCallback(async () => {
    if (!isMountedRef.current) return defaultValue;
    
    try {
      setLoading(true);
      setError(null);
      
      const asyncOperation = AsyncStorage.getItem(key);
      const value = await createSafeAsyncOperation(asyncOperation);
      
      if (!isMountedRef.current) return defaultValue;
      
      if (value !== null) {
        const parsedValue = serializer.parse(value);
        setData(parsedValue);
        return parsedValue;
      } else {
        setData(defaultValue);
        return defaultValue;
      }
    } catch (err) {
      if (!isMountedRef.current) return defaultValue;
      
      const error = err instanceof Error ? err : new Error('获取数据失败');
      setError(error);
      setData(defaultValue);
      return defaultValue;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [key, defaultValue, serializer, createSafeAsyncOperation]);

  // 设置数据 - 使用 AsyncStorageUtil 的逻辑但保持 hook 的状态管理
  const setStorageData = useCallback(
    async (value: T) => {
      if (!isMountedRef.current) return false;
      
      try {
        setError(null);
        const stringValue = serializer.stringify(value);
        
        const asyncOperation = AsyncStorage.setItem(key, stringValue);
        await createSafeAsyncOperation(asyncOperation);
        
        if (isMountedRef.current) {
          setData(value);
        }
        return true;
      } catch (err) {
        if (!isMountedRef.current) return false;
        
        const error = err instanceof Error ? err : new Error('保存数据失败');
        setError(error);
        return false;
      }
    },
    [key, serializer, createSafeAsyncOperation]
  );

  // 删除数据
  const removeData = useCallback(async () => {
    if (!isMountedRef.current) return false;
    
    try {
      setError(null);
      
      const asyncOperation = AsyncStorage.removeItem(key);
      await createSafeAsyncOperation(asyncOperation);
      
      if (isMountedRef.current) {
        setData(defaultValue);
      }
      return true;
    } catch (err) {
      if (!isMountedRef.current) return false;
      
      const error = err instanceof Error ? err : new Error('删除数据失败');
      setError(error);
      return false;
    }
  }, [key, defaultValue, createSafeAsyncOperation]);

  // 清空所有数据
  const clearAll = useCallback(async () => {
    if (!isMountedRef.current) return false;
    
    try {
      setError(null);
      
      const asyncOperation = AsyncStorage.clear();
      await createSafeAsyncOperation(asyncOperation);
      
      if (isMountedRef.current) {
        setData(defaultValue);
      }
      return true;
    } catch (err) {
      if (!isMountedRef.current) return false;
      
      const error = err instanceof Error ? err : new Error('清空数据失败');
      setError(error);
      return false;
    }
  }, [defaultValue, createSafeAsyncOperation]);

  // 获取所有键
  const getAllKeys = useCallback(async () => {
    if (!isMountedRef.current) return [];
    
    try {
      setError(null);
      
      const asyncOperation = AsyncStorage.getAllKeys();
      const keys = await createSafeAsyncOperation(asyncOperation);
      
      return keys;
    } catch (err) {
      if (!isMountedRef.current) return [];
      
      const error = err instanceof Error ? err : new Error('获取键列表失败');
      setError(error);
      return [];
    }
  }, [createSafeAsyncOperation]);

  // 组件挂载时获取数据，添加清理机制
  useEffect(() => {
    isMountedRef.current = true;
    
    const loadData = async () => {
      if (isMountedRef.current) {
        await getData();
      }
    };
    
    loadData();
    
    // 清理函数
    return () => {
      isMountedRef.current = false;
      // 清理所有待处理的Promise引用
      pendingPromisesRef.current.clear();
    };
  }, [getData]);

  return {
    data,
    loading,
    error,
    setData: setStorageData,
    removeData,
    clearAll,
    getAllKeys,
    refresh: getData,
  };
}

// 简化版本的hook，只用于基本的get/set操作
export function useSimpleStorage<T = string>(
  key: string,
  defaultValue?: T
) {
  const { data, setData, loading, error } = useAsyncStorage<T>(key, {
    defaultValue,
  });

  return [data, setData, { loading, error }] as const;
} 