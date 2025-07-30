import { api, LoginRequest, RegisterRequest, AuthResponse, UserInfo } from './api';
import { httpClient } from '../utils/httpClient';

// 认证服务类
class AuthService {
  // 用户登录
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.auth.login(credentials);
      
      if (response.success && response.data) {
        // 保存认证信息
        this.saveAuthData(response.data);
        return response.data;
      }
      
      throw new Error(response.message || '登录失败');
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // 用户注册
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await api.auth.register(userData);
      
      if (response.success && response.data) {
        // 保存认证信息
        this.saveAuthData(response.data);
        return response.data;
      }
      
      throw new Error(response.message || '注册失败');
    } catch (error: any) {
      console.error('Register error:', error);
      throw error;
    }
  }

  // 刷新token
  async refreshToken(): Promise<AuthResponse | null> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        return null;
      }

      const response = await api.auth.refreshToken(refreshToken);
      
      if (response.success && response.data) {
        this.saveAuthData(response.data);
        return response.data;
      }
      
      return null;
    } catch (error: any) {
      console.error('Refresh token error:', error);
      this.logout();
      return null;
    }
  }

  // 获取当前用户信息
  async getCurrentUser(): Promise<UserInfo | null> {
    try {
      const response = await api.auth.getCurrentUser();
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error: any) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // 用户登出
  async logout(): Promise<void> {
    try {
      // 调用后端登出接口
      await api.auth.logout();
    } catch (error: any) {
      console.error('Logout error:', error);
    } finally {
      // 清除本地认证数据
      this.clearAuthData();
    }
  }

  // 检查是否已登录
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }

    // 检查token是否过期
    try {
      const payload = this.parseJwtPayload(token);
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  // 获取访问token
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // 获取刷新token
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  // 获取用户信息
  getUserInfo(): UserInfo | null {
    const userStr = localStorage.getItem('user_info');
    if (!userStr) {
      return null;
    }

    try {
      return JSON.parse(userStr);
    } catch (error) {
      return null;
    }
  }

  // 保存认证数据
  private saveAuthData(authData: AuthResponse): void {
    localStorage.setItem('access_token', authData.access_token);
    localStorage.setItem('refresh_token', authData.refresh_token);
    localStorage.setItem('user_info', JSON.stringify(authData.user));
    
    // 设置token到HTTP客户端
    httpClient.setAuthToken(authData.access_token);
    httpClient.setRefreshToken(authData.refresh_token);
  }

  // 清除认证数据
  private clearAuthData(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('returnUrl');
    
    // 清除HTTP客户端的token
    httpClient.clearAuthToken();
  }

  // 解析JWT payload
  private parseJwtPayload(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token');
    }

    const payload = parts[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  }

  // 获取重定向路径
  getRedirectPath(): string | null {
    return localStorage.getItem('redirect_path');
  }

  // 清除重定向路径
  clearRedirectPath(): void {
    localStorage.removeItem('redirect_path');
  }

  // 初始化认证状态
  initializeAuth(): void {
    const token = this.getAccessToken();
    if (token) {
      // 检查token是否有效
      if (this.isAuthenticated()) {
        httpClient.setAuthToken(token);
        
        const refreshToken = this.getRefreshToken();
        if (refreshToken) {
          httpClient.setRefreshToken(refreshToken);
        }
      } else {
        // token已过期，尝试刷新
        this.refreshToken().catch(() => {
          // 刷新失败，清除无效token
          this.clearAuthData();
        });
      }
    }
  }

  // 忘记密码
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await api.auth.forgotPassword({ email });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || '请求失败');
    } catch (error: any) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  // 重置密码
  async resetPassword(token: string, password: string, confirmPassword: string): Promise<{ message: string }> {
    try {
      const response = await api.auth.resetPassword({ token, password, confirmPassword });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || '重置失败');
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw error;
    }
  }
}

// 创建认证服务实例
export const authService = new AuthService();

// 默认导出
export default authService; 