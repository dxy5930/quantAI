import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 存储管理器 - 纯粹的AsyncStorage封装，不包含业务逻辑
 */
export class StorageManager {
  private static instance: StorageManager;
  private cache: Map<string, any> = new Map();
  private pendingOperations: Map<string, Promise<any>> = new Map();

  private constructor() {}

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * 获取数据
   */
  async getItem<T = any>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      // 检查是否有正在进行的操作
      if (this.pendingOperations.has(key)) {
        await this.pendingOperations.get(key);
      }

      // 先检查内存缓存
      if (this.cache.has(key)) {
        return this.cache.get(key);
      }

      const operation = this._getItemFromStorage<T>(key, defaultValue);
      this.pendingOperations.set(key, operation);

      try {
        const result = await operation;
        this.cache.set(key, result);
        return result;
      } finally {
        this.pendingOperations.delete(key);
      }
    } catch (error) {
      console.error(`获取存储数据失败 (key: ${key}):`, error);
      return defaultValue ?? null;
    }
  }

  /**
   * 设置数据
   */
  async setItem<T = any>(key: string, value: T): Promise<boolean> {
    try {
      // 等待任何正在进行的操作完成
      if (this.pendingOperations.has(key)) {
        await this.pendingOperations.get(key);
      }

      const operation = this._setItemToStorage(key, value);
      this.pendingOperations.set(key, operation);

      try {
        await operation;
        this.cache.set(key, value);
        return true;
      } finally {
        this.pendingOperations.delete(key);
      }
    } catch (error) {
      console.error(`保存存储数据失败 (key: ${key}):`, error);
      return false;
    }
  }

  /**
   * 删除数据
   */
  async removeItem(key: string): Promise<boolean> {
    try {
      // 等待任何正在进行的操作完成
      if (this.pendingOperations.has(key)) {
        await this.pendingOperations.get(key);
      }

      const operation = this._removeItemFromStorage(key);
      this.pendingOperations.set(key, operation);

      try {
        await operation;
        this.cache.delete(key);
        return true;
      } finally {
        this.pendingOperations.delete(key);
      }
    } catch (error) {
      console.error(`删除存储数据失败 (key: ${key}):`, error);
      return false;
    }
  }

  /**
   * 批量获取数据
   */
  async multiGet<T = any>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      const results: Record<string, T | null> = {};
      
      // 并行获取所有数据
      const promises = keys.map(async (key) => {
        const value = await this.getItem<T>(key);
        results[key] = value;
      });

      await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('批量获取存储数据失败:', error);
      return {};
    }
  }

  /**
   * 批量设置数据
   */
  async multiSet(items: Record<string, any>): Promise<boolean> {
    try {
      const promises = Object.entries(items).map(([key, value]) => 
        this.setItem(key, value)
      );

      const results = await Promise.all(promises);
      return results.every(result => result);
    } catch (error) {
      console.error('批量设置存储数据失败:', error);
      return false;
    }
  }

  /**
   * 批量删除数据
   */
  async multiRemove(keys: string[]): Promise<boolean> {
    try {
      const promises = keys.map(key => this.removeItem(key));
      const results = await Promise.all(promises);
      return results.every(result => result);
    } catch (error) {
      console.error('批量删除存储数据失败:', error);
      return false;
    }
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      this.cache.clear();
      this.pendingOperations.clear();
      return true;
    } catch (error) {
      console.error('清空存储数据失败:', error);
      return false;
    }
  }

  /**
   * 获取所有键
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return [...keys];
    } catch (error) {
      console.error('获取键列表失败:', error);
      return [];
    }
  }

  /**
   * 检查键是否存在
   */
  async hasKey(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch (error) {
      console.error(`检查键是否存在失败 (key: ${key}):`, error);
      return false;
    }
  }

  /**
   * 获取存储使用情况（仅支持部分平台）
   */
  async getStorageInfo(): Promise<{
    totalSize?: number;
    usedSize?: number;
    availableSize?: number;
  } | null> {
    try {
      // React Native AsyncStorage 不直接提供存储信息
      // 这里可以根据需要实现估算逻辑
      return null;
    } catch (error) {
      console.error('获取存储信息失败:', error);
      return null;
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 清除指定key的缓存
   */
  clearCacheForKey(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * 检查是否有待处理的操作
   */
  hasPendingOperations(): boolean {
    return this.pendingOperations.size > 0;
  }

  /**
   * 等待所有待处理的操作完成
   */
  async waitForPendingOperations(): Promise<void> {
    if (this.pendingOperations.size === 0) return;

    await Promise.all(Array.from(this.pendingOperations.values()));
  }

  /**
   * 刷新指定key的缓存（强制从存储重新读取）
   */
  async refreshKey<T>(key: string, defaultValue?: T): Promise<T | null> {
    this.clearCacheForKey(key);
    return await this.getItem<T>(key, defaultValue);
  }

  /**
   * 获取缓存的所有键
   */
  getCachedKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * 获取缓存中的值（不访问存储）
   */
  getCachedValue<T>(key: string): T | undefined {
    return this.cache.get(key);
  }

  /**
   * 预加载多个键到缓存
   */
  async preloadKeys(keys: string[]): Promise<void> {
    const promises = keys.map(key => this.getItem(key));
    await Promise.all(promises);
  }

  // 私有方法
  private async _getItemFromStorage<T>(key: string, defaultValue?: T): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      try {
        return JSON.parse(value);
      } catch (error) {
        console.warn(`解析存储数据失败 (key: ${key}):`, error);
        return defaultValue ?? null;
      }
    }
    return defaultValue ?? null;
  }

  private async _setItemToStorage<T>(key: string, value: T): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
    } catch (error) {
      console.error(`序列化存储数据失败 (key: ${key}):`, error);
      throw error;
    }
  }

  private async _removeItemFromStorage(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}

// 导出单例实例
export const storageManager = StorageManager.getInstance(); 