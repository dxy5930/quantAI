import { makeAutoObservable, runInAction } from 'mobx';
import { User, LoginCredentials, RegisterData } from '../types';
import { authService } from '../services/authService';
import { HttpError } from '../utils/httpClient';
import { UserInfo } from '../services/api/types';

export class UserStore {
  // 用户状态
  currentUser: User | null = null;
  isAuthenticated: boolean = false;
  isLoading: boolean = false;
  error: string | null = null;
  
  // 添加初始化状态标记
  isInitialized: boolean = false;
  
  // 登录表单状态
  loginForm: LoginCredentials = {
    username: '',
    password: ''
  };
  
  // 注册表单状态
  registerForm: RegisterData = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.initializeAuth();
  }

  /**
   * 将API返回的UserInfo转换为应用的User类型
   */
  private convertUserInfoToUser(userInfo: UserInfo): User {
    // 优先使用嵌套的profile对象，如果没有则使用平铺的字段
    const profile = userInfo.profile || {
      displayName: userInfo.displayName || userInfo.username,
      tradingExperience: userInfo.tradingExperience || 'beginner',
      riskTolerance: userInfo.riskTolerance || 'medium'
    };

    return {
      id: userInfo.id,
      username: userInfo.username,
      email: userInfo.email,
      avatar: userInfo.avatar,
      role: userInfo.role || 'user',
      level: userInfo.level || 1, // 默认为普通用户
      createdAt: userInfo.createdAt,
      lastLoginAt: userInfo.lastLoginAt || new Date().toISOString(),
      profile: {
        displayName: profile.displayName || userInfo.username,
        tradingExperience: profile.tradingExperience || 'beginner',
        riskTolerance: profile.riskTolerance || 'medium'
      }
    };
  }

  /**
   * 初始化认证状态
   */
  private async initializeAuth() {
    try {
      // 暂时跳过后端认证检查
      // if (authService.isAuthenticated()) {
      //   await this.loadCurrentUser();
      // }
    } catch (error) {
      console.error('初始化认证状态失败:', error);
    } finally {
      runInAction(() => {
        this.isInitialized = true;
      });
    }
  }

  /**
   * 加载当前用户信息
   */
  private async loadCurrentUser() {
    try {
      const userInfo = await authService.getCurrentUser();
      runInAction(() => {
        if (userInfo) {
          this.currentUser = this.convertUserInfoToUser(userInfo);
          this.isAuthenticated = true;
        } else {
          // 如果获取用户信息失败，清除认证状态
          this.currentUser = null;
          this.isAuthenticated = false;
          // 清除可能已过期的token
          authService.logout();
        }
      });
    } catch (error) {
      console.error('加载用户信息失败:', error);
      runInAction(() => {
        this.currentUser = null;
        this.isAuthenticated = false;
      });
      // 清除可能已过期的token
      authService.logout();
    }
  }

  /**
   * 用户登录
   */
  async login(credentials?: LoginCredentials) {
    const loginData = credentials || this.loginForm;
    
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      // 暂时跳过后端验证，直接模拟登录成功
      await new Promise(resolve => setTimeout(resolve, 500)); // 模拟网络延迟
      
      // 创建模拟用户数据
      const mockUser = {
        id: '1',
        username: loginData.username || 'demo_user',
        email: 'demo@example.com',
        avatar: '',
        role: 'user' as const,
        level: 1,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        profile: {
          displayName: loginData.username || 'Demo User',
          tradingExperience: 'intermediate' as const,
          riskTolerance: 'medium' as const
        }
      };
      
      runInAction(() => {
        this.currentUser = mockUser;
        this.isAuthenticated = true;
        this.isLoading = false;
        this.clearLoginForm();
      });

      return { user: mockUser, token: 'mock-token', refreshToken: 'mock-refresh-token' };
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
        if (error instanceof HttpError) {
          this.error = error.message;
        } else {
          this.error = '登录失败，请稍后重试';
        }
      });
      throw error;
    }
  }

  /**
   * 用户注册
   */
  async register(data?: RegisterData) {
    const registerData = data || this.registerForm;
    
    // 转换为API需要的格式
    const apiRegisterData = {
      email: registerData.email,
      password: registerData.password,
      confirmPassword: registerData.confirmPassword,
      username: registerData.username
    };
    
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const response = await authService.register(apiRegisterData);
      
      runInAction(() => {
        this.currentUser = this.convertUserInfoToUser(response.user);
        this.isAuthenticated = true;
        this.isLoading = false;
        this.clearRegisterForm();
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
        if (error instanceof HttpError) {
          this.error = error.message;
        } else {
          this.error = '注册失败，请稍后重试';
        }
      });
      throw error;
    }
  }

  /**
   * 用户登出
   */
  async logout() {
    runInAction(() => {
      this.isLoading = true;
    });

    try {
      await authService.logout();
      
      runInAction(() => {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.isLoading = false;
        this.error = null;
      });
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
        this.error = '登出失败，请稍后重试';
      });
      throw error;
    }
  }

  /**
   * 更新用户资料
   */
  async updateProfile(profileData: Partial<UserInfo>) {
    if (!this.currentUser) {
      throw new Error('用户未登录');
    }

    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      // 使用userApi更新用户资料
      const { userApi } = await import('../services/api/userApi');
      const response = await userApi.updateProfile(profileData);
      
      runInAction(() => {
        if (this.currentUser && response.data) {
          // 更新用户信息 - 创建新的用户对象确保MobX检测到变化
          console.log('UserStore: API响应数据', response.data);
          console.log('UserStore: 更新前的用户数据', JSON.stringify(this.currentUser, null, 2));
          
          const updatedUser = this.convertUserInfoToUser(response.data);
          console.log('UserStore: 转换后的用户数据', JSON.stringify(updatedUser, null, 2));
          
          this.currentUser = updatedUser;
          
          console.log('UserStore: 更新后的当前用户数据', JSON.stringify(this.currentUser, null, 2));
        }
        this.isLoading = false;
      });

      return this.currentUser;
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
        if (error instanceof HttpError) {
          this.error = error.message;
        } else {
          this.error = '更新资料失败，请稍后重试';
        }
      });
      throw error;
    }
  }

  /**
   * 刷新token
   */
  async refreshToken() {
    try {
      await authService.refreshToken();
      await this.loadCurrentUser();
    } catch (error) {
      // token刷新失败，清除用户状态
      runInAction(() => {
        this.currentUser = null;
        this.isAuthenticated = false;
      });
      throw error;
    }
  }

  // 表单操作方法
  setLoginForm = (form: Partial<LoginCredentials>) => {
    runInAction(() => {
      this.loginForm = { ...this.loginForm, ...form };
    });
  }

  setRegisterForm = (form: Partial<RegisterData>) => {
    runInAction(() => {
      this.registerForm = { ...this.registerForm, ...form };
    });
  }

  clearLoginForm = () => {
    runInAction(() => {
      this.loginForm = { username: '', password: '' };
    });
  }

  clearRegisterForm = () => {
    runInAction(() => {
      this.registerForm = {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      };
    });
  }

  clearError = () => {
    runInAction(() => {
      this.error = null;
    });
  }

  // 计算属性
  get isLoggedIn() {
    return this.isAuthenticated && !!this.currentUser;
  }

  // 检查是否已初始化并且已登录
  get isInitializedAndLoggedIn() {
    return this.isInitialized && this.isLoggedIn;
  }

  get userDisplayName() {
    return this.currentUser?.profile?.displayName || this.currentUser?.username || '';
  }

  get userAvatar() {
    return this.currentUser?.avatar || '';
  }

  get isAdmin() {
    return this.currentUser?.role === 'admin';
  }

  get hasProfile() {
    return !!this.currentUser?.profile;
  }
}

export const userStore = new UserStore(); 