import { api } from '../../utils/axios';
import type { UserInfo } from '../../types/user';

/**
 * 用户模块 API 接口封装
 */

// ==================== 请求参数类型 ====================

export interface UpdateProfileRequest {
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface UserPreferencesRequest {
  theme?: 'light' | 'dark' | 'auto';
  language?: 'zh-CN' | 'en-US';
  notifications?: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  privacy?: {
    showProfile: boolean;
    showActivity: boolean;
  };
}

// ==================== 响应数据类型 ====================

export interface UserStatsResponse {
  totalLogins: number;
  lastLoginAt: string;
  accountAge: number;
  activityScore: number;
}

export interface UserPreferencesResponse {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  privacy: {
    showProfile: boolean;
    showActivity: boolean;
  };
}

export interface UploadAvatarResponse {
  avatarUrl: string;
}

// ==================== API 接口封装 ====================

/**
 * 获取用户信息
 */
export const getUserInfo = (userId: string) => {
  return api.get<UserInfo>(`/users/${userId}`);
};

/**
 * 更新用户资料
 */
export const updateProfile = (userId: string, data: UpdateProfileRequest) => {
  return api.put<UserInfo>(`/users/${userId}/profile`, data);
};

/**
 * 修改密码
 */
export const changePassword = (userId: string, data: ChangePasswordRequest) => {
  return api.post<void>(`/users/${userId}/change-password`, data);
};

/**
 * 获取用户偏好设置
 */
export const getUserPreferences = (userId: string) => {
  return api.get<UserPreferencesResponse>(`/users/${userId}/preferences`);
};

/**
 * 更新用户偏好设置
 */
export const updateUserPreferences = (userId: string, preferences: UserPreferencesRequest) => {
  return api.put<UserPreferencesResponse>(`/users/${userId}/preferences`, preferences);
};

/**
 * 上传用户头像
 */
export const uploadAvatar = (userId: string, imageUri: string) => {
  return api.upload<UploadAvatarResponse>(`/users/${userId}/avatar`, imageUri, {
    name: 'avatar.jpg',
    type: 'image/jpeg'
  });
};

/**
 * 获取用户统计数据
 */
export const getUserStats = (userId: string) => {
  return api.get<UserStatsResponse>(`/users/${userId}/stats`);
};

/**
 * 注销账户
 */
export const deleteAccount = (userId: string, password: string) => {
  return api.delete<void>(`/users/${userId}`, {
    data: { password }
  });
}; 