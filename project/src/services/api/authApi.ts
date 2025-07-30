import { httpClient } from '../../utils/httpClient';
import {  LoginRequest, RegisterRequest, AuthResponse, UserInfo } from './types';
import { UnifiedApiResponse as ApiResponse } from '../../types';
// 获取 API 前缀
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

// 认证API
export const authApi = {
  // 用户登录
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return httpClient.post(`${API_PREFIX}/auth/login`, data);
  },

  // 用户注册
  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return httpClient.post(`${API_PREFIX}/auth/register`, data);
  },

  // 刷新token
  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthResponse>> {
    return httpClient.post(`${API_PREFIX}/auth/refresh`, {
      refreshToken: refreshToken,
    });
  },

  // 获取当前用户信息
  async getCurrentUser(): Promise<ApiResponse<UserInfo>> {
    return httpClient.post(`${API_PREFIX}/auth/me`);
  },

  // 登出
  async logout(): Promise<ApiResponse<void>> {
    return httpClient.post(`${API_PREFIX}/auth/logout`);
  },

  // 忘记密码
  async forgotPassword(data: { email: string }): Promise<ApiResponse<{ message: string }>> {
    return httpClient.post(`${API_PREFIX}/auth/forgot-password`, data);
  },

  // 重置密码
  async resetPassword(data: { token: string; password: string; confirmPassword: string }): Promise<ApiResponse<{ message: string }>> {
    return httpClient.post(`${API_PREFIX}/auth/reset-password`, data);
  },
};

export default authApi; 