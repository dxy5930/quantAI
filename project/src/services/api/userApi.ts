import { httpClient } from '../../utils/httpClient';
import { UnifiedApiResponse as ApiResponse } from '../../types';
import { UserInfo } from './types';

// 获取 API 前缀
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

// 用户API
export const userApi = {

  // 获取用户资料
  async getProfile(): Promise<ApiResponse<UserInfo>> {
    return httpClient.post(`${API_PREFIX}/users/profile`);
  },

  // 获取用户资料选项
  async getProfileOptions(): Promise<ApiResponse<{
    tradingExperience: Array<{ value: string; label: string }>;
    riskTolerance: Array<{ value: string; label: string }>;
  }>> {
    return httpClient.post(`${API_PREFIX}/users/profile/options`);
  },

  // 更新用户资料
  async updateProfile(data: Partial<UserInfo>): Promise<ApiResponse<UserInfo>> {
    return httpClient.put(`${API_PREFIX}/users/profile`, data);
  },

  // 获取用户统计信息
  async getUserStats(): Promise<ApiResponse<any>> {
    return httpClient.post(`${API_PREFIX}/users/stats`);
  },

  // 根据ID获取用户信息
  async getUserById(id: string): Promise<ApiResponse<UserInfo>> {
    return httpClient.post(`${API_PREFIX}/users/${id}`);
  },

  // 上传头像
  async uploadAvatar(file: File): Promise<ApiResponse<{ avatar_url: string }>> {
    const formData = new FormData();
    formData.append('avatar', file);
    return httpClient.post(`${API_PREFIX}/users/avatar`, formData);
  },

  // 修改密码
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return httpClient.put(`${API_PREFIX}/users/change-password`, data);
  },
};

export default userApi; 