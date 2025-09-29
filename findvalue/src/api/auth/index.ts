import { api } from '../../utils/axios';
import type { UserInfo } from '../../types/user';

/**
 * 认证模块 API 接口封装
 */

// ==================== 请求参数类型 ====================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ==================== 响应数据类型 ====================

export interface LoginResponse {
  userInfo: UserInfo;
  authToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  userInfo: UserInfo;
  authToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  authToken: string;
  refreshToken: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  userInfo: UserInfo;
}

// ==================== API 接口封装 ====================

/**
 * 用户登录
 */
export const login = (data: LoginRequest) => {
  return api.post<LoginResponse>('/auth/login', data);
};

/**
 * 用户注册
 */
export const register = (data: RegisterRequest) => {
  return api.post<RegisterResponse>('/auth/register', data);
};

/**
 * 用户登出
 */
export const logout = () => {
  return api.post<void>('/auth/logout');
};

/**
 * 刷新Token
 */
export const refreshToken = (data: RefreshTokenRequest) => {
  return api.post<RefreshTokenResponse>('/auth/refresh', data);
};

/**
 * 忘记密码
 */
export const forgotPassword = (data: ForgotPasswordRequest) => {
  return api.post<void>('/auth/forgot-password', data);
};

/**
 * 重置密码
 */
export const resetPassword = (data: ResetPasswordRequest) => {
  return api.post<void>('/auth/reset-password', data);
};

/**
 * 验证Token是否有效
 */
export const validateToken = () => {
  return api.get<ValidateTokenResponse>('/auth/validate');
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = () => {
  return api.get<UserInfo>('/auth/me');
}; 