import { BusinessError } from '../utils/axios';
import * as UserApi from '../api/user';
import type { UserInfo } from '../types/user';

/**
 * 用户服务层
 * 
 * 负责业务逻辑处理，调用 API 层获取数据
 * - 数据验证和转换
 * - 业务规则处理
 * - 错误处理已在 axios 层统一处理
 */

// ==================== Service 层数据类型 ====================

export interface UpdateProfileRequest {
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserPreferences {
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

// ==================== 业务逻辑处理 ====================

export class UserService {
  /**
   * 获取用户信息
   */
  static async getUserInfo(userId: string): Promise<UserInfo> {
    const result = await UserApi.getUserInfo(userId);
    return result.data;
  }

  /**
   * 更新用户资料
   */
  static async updateProfile(userId: string, data: UpdateProfileRequest): Promise<UserInfo> {
    // 客户端验证
    if (data.email && !this.isValidEmail(data.email)) {
      throw new BusinessError('邮箱格式不正确');
    }
    
    if (data.phone && !this.isValidPhone(data.phone)) {
      throw new BusinessError('手机号格式不正确');
    }

    // 数据清理
    const cleanData: UserApi.UpdateProfileRequest = {
      nickname: data.nickname?.trim(),
      email: data.email?.trim(),
      phone: data.phone?.trim(),
      avatar: data.avatar
    };

    const result = await UserApi.updateProfile(userId, cleanData);
    return result.data;
  }

  /**
   * 修改密码
   */
  static async changePassword(userId: string, data: ChangePasswordRequest): Promise<void> {
    // 客户端验证
    if (data.newPassword !== data.confirmPassword) {
      throw new BusinessError('两次输入的密码不一致');
    }
    
    if (data.newPassword.length < 6) {
      throw new BusinessError('新密码至少需要6个字符');
    }
    
    if (data.oldPassword === data.newPassword) {
      throw new BusinessError('新密码不能与旧密码相同');
    }

    // 调用 API
    await UserApi.changePassword(userId, {
      oldPassword: data.oldPassword,
      newPassword: data.newPassword
    });
  }

  /**
   * 获取用户偏好设置
   */
  static async getUserPreferences(userId: string): Promise<UserPreferences> {
    const result = await UserApi.getUserPreferences(userId);
    return result.data;
  }

  /**
   * 更新用户偏好设置
   */
  static async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const result = await UserApi.updateUserPreferences(userId, preferences);
    return result.data;
  }

  /**
   * 上传用户头像
   */
  static async uploadAvatar(userId: string, imageUri: string): Promise<{ avatarUrl: string }> {
    // 简单验证
    if (!imageUri || !imageUri.trim()) {
      throw new BusinessError('请选择要上传的图片');
    }

    const result = await UserApi.uploadAvatar(userId, imageUri);
    return result.data;
  }

  /**
   * 获取用户统计数据
   */
  static async getUserStats(userId: string): Promise<{
    totalLogins: number;
    lastLoginAt: string;
    accountAge: number;
    activityScore: number;
  }> {
    const result = await UserApi.getUserStats(userId);
    return result.data;
  }

  /**
   * 注销账户
   */
  static async deleteAccount(userId: string, password: string): Promise<void> {
    if (!password.trim()) {
      throw new BusinessError('请输入密码以确认注销');
    }

    await UserApi.deleteAccount(userId, password);
  }

  // ==================== 工具方法 ====================

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidPhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }
}

/**
 * 使用示例：
 * 
 * ```typescript
 * // 在组件中使用
 * try {
 *   const userInfo = await UserService.getUserInfo(userId);
 *   setUserInfo(userInfo); // 直接拿到数据
 * } catch (error) {
 *   // 错误已经被 axios 统一处理，这里只需要展示给用户
 *   if (error instanceof BusinessError) {
 *     showErrorMessage(error.message);
 *   }
 * }
 * 
 * // 更新资料
 * try {
 *   const updatedUser = await UserService.updateProfile(userId, {
 *     nickname: 'newNickname',
 *     email: 'new@email.com'
 *   });
 *   setUserInfo(updatedUser);
 *   showSuccessMessage('资料更新成功');
 * } catch (error) {
 *   // 错误处理
 * }
 * ```
 */ 