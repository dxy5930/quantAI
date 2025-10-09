import { makeAutoObservable, runInAction } from 'mobx';
import { storageManager } from '../utils/StorageManager';
import { UserInfo, USER_STORAGE_KEYS, LoginData } from '../types/user';

/**
 * 用户状态管理器 - 基于 MobX 的响应式状态管理
 */
export class UserStore {
  // 状态数据
  userInfo: UserInfo | null = null;
  authToken: string = '';
  refreshToken: string = '';
  isLoggedIn: boolean = false;
  isLoading: boolean = false;
  error: string | null = null;

  // 初始化状态
  private isInitialized: boolean = false;
  
  // 状态监听器
  private listeners: Set<() => void> = new Set();

  constructor() {
    makeAutoObservable(this);
    this.initializeFromStorage();
  }

  // 计算属性
  get isAuthenticated(): boolean {
    return !!(this.isLoggedIn && this.authToken && this.userInfo);
  }

  get displayName(): string {
    if (!this.userInfo) return '';
    return this.userInfo.nickname || this.userInfo.username || this.userInfo.email || '';
  }

  get isVipUser(): boolean {
    return this.userInfo?.isVip || false;
  }

  get userLevel(): number {
    return this.userInfo?.level || 0;
  }

  /**
   * 订阅状态变化
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('State listener error:', error);
      }
    });
  }

  /**
   * 获取当前状态的快照
   */
  getSnapshot(): {
    userInfo: UserInfo | null;
    authToken: string;
    refreshToken: string;
    isLoggedIn: boolean;
    isLoading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    displayName: string;
    isVipUser: boolean;
    userLevel: number;
  } {
    return {
      userInfo: this.userInfo,
      authToken: this.authToken,
      refreshToken: this.refreshToken,
      isLoggedIn: this.isLoggedIn,
      isLoading: this.isLoading,
      error: this.error,
      isAuthenticated: this.isAuthenticated,
      displayName: this.displayName,
      isVipUser: this.isVipUser,
      userLevel: this.userLevel,
    };
  }

  /**
   * 从存储初始化用户状态
   */
  private async initializeFromStorage(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.setLoading(true);
      this.setError(null);

      const userData = await storageManager.multiGet([
        USER_STORAGE_KEYS.USER_INFO,
        USER_STORAGE_KEYS.AUTH_TOKEN,
        USER_STORAGE_KEYS.REFRESH_TOKEN,
        USER_STORAGE_KEYS.IS_LOGGED_IN
      ]);
      
      runInAction(() => {
        this.userInfo = userData[USER_STORAGE_KEYS.USER_INFO] || null;
        this.authToken = userData[USER_STORAGE_KEYS.AUTH_TOKEN] || '';
        this.refreshToken = userData[USER_STORAGE_KEYS.REFRESH_TOKEN] || '';
        this.isLoggedIn = userData[USER_STORAGE_KEYS.IS_LOGGED_IN] || false;
        this.isInitialized = true;
      });

      this.notifyListeners();
    } catch (error) {
      this.setError('初始化用户状态失败');
      console.error('初始化用户状态失败:', error);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * 等待初始化完成
   */
  async waitForInitialization(): Promise<void> {
    while (!this.isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * 用户登录
   */
  async login(userData: LoginData): Promise<boolean> {
    try {
      this.setLoading(true);
      this.setError(null);

      const success = await storageManager.multiSet({
        [USER_STORAGE_KEYS.USER_INFO]: userData.userInfo,
        [USER_STORAGE_KEYS.AUTH_TOKEN]: userData.authToken,
        [USER_STORAGE_KEYS.REFRESH_TOKEN]: userData.refreshToken || '',
        [USER_STORAGE_KEYS.IS_LOGGED_IN]: true,
      });
      
      if (success) {
        runInAction(() => {
          this.userInfo = userData.userInfo;
          this.authToken = userData.authToken;
          this.refreshToken = userData.refreshToken || '';
          this.isLoggedIn = true;
        });
        this.notifyListeners();
      } else {
        this.setError('登录失败：数据保存失败');
      }

      return success;
    } catch (error) {
      this.setError('登录失败');
      console.error('登录失败:', error);
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<boolean> {
    try {
      this.setLoading(true);
      this.setError(null);

      const success = await storageManager.multiRemove([
        USER_STORAGE_KEYS.USER_INFO,
        USER_STORAGE_KEYS.AUTH_TOKEN,
        USER_STORAGE_KEYS.REFRESH_TOKEN,
        USER_STORAGE_KEYS.IS_LOGGED_IN
      ]);
      
      if (success) {
        runInAction(() => {
          this.userInfo = null;
          this.authToken = '';
          this.refreshToken = '';
          this.isLoggedIn = false;
        });
        this.notifyListeners();
      } else {
        this.setError('登出失败：数据清理失败');
      }

      return success;
    } catch (error) {
      this.setError('登出失败');
      console.error('登出失败:', error);
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * 更新用户信息
   */
  async updateUserInfo(newUserInfo: Partial<UserInfo>): Promise<boolean> {
    if (!this.userInfo) {
      this.setError('用户未登录');
      return false;
    }

    try {
      this.setLoading(true);
      this.setError(null);

      const updatedUserInfo = { ...this.userInfo, ...newUserInfo };
      const success = await storageManager.setItem(USER_STORAGE_KEYS.USER_INFO, updatedUserInfo);
      
      if (success) {
        runInAction(() => {
          this.userInfo = updatedUserInfo;
        });
        this.notifyListeners();
      } else {
        this.setError('更新用户信息失败：数据保存失败');
      }

      return success;
    } catch (error) {
      this.setError('更新用户信息失败');
      console.error('更新用户信息失败:', error);
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * 更新认证令牌
   */
  async updateTokens(newAuthToken: string, newRefreshToken?: string): Promise<boolean> {
    try {
      this.setLoading(true);
      this.setError(null);

      const updates: Record<string, any> = {
        [USER_STORAGE_KEYS.AUTH_TOKEN]: newAuthToken,
      };
      
      if (newRefreshToken) {
        updates[USER_STORAGE_KEYS.REFRESH_TOKEN] = newRefreshToken;
      }

      const success = await storageManager.multiSet(updates);
      
      if (success) {
        runInAction(() => {
          this.authToken = newAuthToken;
          if (newRefreshToken) {
            this.refreshToken = newRefreshToken;
          }
        });
        this.notifyListeners();
      } else {
        this.setError('更新令牌失败：数据保存失败');
      }

      return success;
    } catch (error) {
      this.setError('更新令牌失败');
      console.error('更新令牌失败:', error);
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * 刷新用户状态（从存储重新加载）
   */
  async refresh(): Promise<boolean> {
    try {
      this.setLoading(true);
      this.setError(null);

      const userData = await storageManager.multiGet([
        USER_STORAGE_KEYS.USER_INFO,
        USER_STORAGE_KEYS.AUTH_TOKEN,
        USER_STORAGE_KEYS.REFRESH_TOKEN,
        USER_STORAGE_KEYS.IS_LOGGED_IN
      ]);
      
      runInAction(() => {
        this.userInfo = userData[USER_STORAGE_KEYS.USER_INFO] || null;
        this.authToken = userData[USER_STORAGE_KEYS.AUTH_TOKEN] || '';
        this.refreshToken = userData[USER_STORAGE_KEYS.REFRESH_TOKEN] || '';
        this.isLoggedIn = userData[USER_STORAGE_KEYS.IS_LOGGED_IN] || false;
      });

      this.notifyListeners();
      return true;
    } catch (error) {
      this.setError('刷新用户状态失败');
      console.error('刷新用户状态失败:', error);
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * 检查认证状态（异步验证）
   */
  async checkAuthStatus(): Promise<boolean> {
    try {
      const userData = await storageManager.multiGet([
        USER_STORAGE_KEYS.USER_INFO,
        USER_STORAGE_KEYS.AUTH_TOKEN,
        USER_STORAGE_KEYS.IS_LOGGED_IN
      ]);

      const isAuthenticated = !!(
        userData[USER_STORAGE_KEYS.IS_LOGGED_IN] && 
        userData[USER_STORAGE_KEYS.AUTH_TOKEN] && 
        userData[USER_STORAGE_KEYS.USER_INFO]
      );
      
      if (!isAuthenticated && this.isAuthenticated) {
        // 存储状态与内存状态不一致，同步状态
        await this.refresh();
      }
      
      return this.isAuthenticated;
    } catch (error) {
      console.error('检查认证状态失败:', error);
      return false;
    }
  }

  /**
   * 清除所有用户数据（紧急情况使用）
   */
  async clearAllData(): Promise<boolean> {
    try {
      this.setLoading(true);
      const success = await storageManager.multiRemove([
        USER_STORAGE_KEYS.USER_INFO,
        USER_STORAGE_KEYS.AUTH_TOKEN,
        USER_STORAGE_KEYS.REFRESH_TOKEN,
        USER_STORAGE_KEYS.IS_LOGGED_IN
      ]);
      
      if (success) {
        runInAction(() => {
          this.userInfo = null;
          this.authToken = '';
          this.refreshToken = '';
          this.isLoggedIn = false;
          this.error = null;
        });
        this.notifyListeners();
      }

      return success;
    } catch (error) {
      console.error('清除用户数据失败:', error);
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  // 私有方法
  setLoading(loading: boolean): void {
    this.isLoading = loading;
  }

  setError(error: string | null): void {
    this.error = error;
  }

  // 便捷方法
  getUserAvatar(): string {
    if (!this.userInfo) return '👤';
    return this.userInfo.avatar || (this.isVipUser ? '👑' : '👤');
  }

  getUserDisplayInfo(): string {
    if (!this.userInfo) return '';
    return `等级 Lv.${this.userLevel} | ${this.userInfo.email}`;
  }

  hasError(): boolean {
    return !!this.error;
  }

  clearError(): void {
    this.setError(null);
  }
}

// 创建单例实例
export const userStore = new UserStore(); 