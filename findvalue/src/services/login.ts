import {runInAction} from 'mobx';
import {BusinessError} from '../utils/axios';
import * as AuthApi from '../api/auth';
import type {UserInfo} from '../types/user';

/**
 * 登录服务层
 *
 * 负责登录业务逻辑处理，调用 Auth API 层
 */

// ==================== Service 层数据类型 ====================

export interface LoginData {
  userInfo: UserInfo;
  authToken: string;
  refreshToken?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// ==================== 业务逻辑处理 ====================

export class Login {
  /**
   * 验证登录表单
   */
  static validateForm(
    username: string,
    password: string,
  ): {isValid: boolean; message?: string} {
    if (!username.trim()) {
      return {isValid: false, message: '请输入用户名'};
    }

    if (username.length < 3) {
      return {isValid: false, message: '用户名至少需要3个字符'};
    }

    if (!password.trim()) {
      return {isValid: false, message: '请输入密码'};
    }

    if (password.length < 6) {
      return {isValid: false, message: '密码至少需要6个字符'};
    }

    return {isValid: true};
  }

  /**
   * 调用登录API
   */
  static async callApi(request: LoginRequest): Promise<LoginData> {
    // 验证表单
    const validation = this.validateForm(request.username, request.password);
    if (!validation.isValid) {
      throw new BusinessError(validation.message!);
    }

    try {
      // 调用 Auth API
      const result = await AuthApi.login({
        username: request.username.trim(),
        password: request.password,
      });

      return {
        userInfo: result.data.userInfo,
        authToken: result.data.authToken,
        refreshToken: result.data.refreshToken,
      };
    } catch (error) {
      // 如果是BusinessError，直接抛出（已经被axios处理过了）
      if (error instanceof BusinessError) {
        throw error;
      }
      // 其他未知错误
      throw new BusinessError('登录失败，请稍后重试');
    }
  }

  /**
   * 模拟登录API (开发阶段使用)
   */
  static async simulateApi(request: LoginRequest): Promise<LoginData> {
    // 验证表单
    const validation = this.validateForm(request.username, request.password);
    if (!validation.isValid) {
      throw new BusinessError(validation.message!);
    }

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 模拟用户数据
    const userInfo: UserInfo = {
      id: Date.now().toString(),
      username: request.username,
      email: `${request.username}@findvalue.com`,
      nickname: `用户${request.username}`,
      avatar: '',
      phone: '138****8888',
      isVip: Math.random() > 0.5,
      level: Math.floor(Math.random() * 10) + 1,
    };

    const authToken = `token_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const refreshToken = `refresh_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    return {
      userInfo,
      authToken,
      refreshToken,
    };
  }

  /**
   * 执行登录流程
   */
  static async perform(
    request: LoginRequest,
    loginHook: (data: LoginData) => Promise<boolean>,
    onLoadingChange: (loading: boolean) => void,
    useSimulation: boolean = true, // 开发阶段使用模拟API
  ): Promise<{success: boolean; message?: string}> {
    try {
      // 设置加载状态
      runInAction(() => {
        onLoadingChange(true);
      });

      // 调用登录API（模拟或真实）
      // const loginData = useSimulation
      //   ? await this.simulateApi(request)
      //   : await this.callApi(request);
      const loginData = await this.simulateApi(request);
      // 保存登录信息
      const saveSuccess = await loginHook(loginData);

      if (!saveSuccess) {
        throw new BusinessError('保存用户信息失败，请重试');
      }

      return {success: true};
    } catch (error) {
      console.log('error', error);
      // BusinessError已经包含了友好的错误消息
      const message =
        error instanceof BusinessError ? error.message : '登录失败，请稍后重试';

      return {
        success: false,
        message,
      };
    } finally {
      // 清除加载状态
      runInAction(() => {
        onLoadingChange(false);
      });
    }
  }

  /**
   * 获取快速登录用户数据
   */
  static getQuickData(type: 'demo' | 'vip'): LoginRequest {
    if (type === 'demo') {
      return {
        username: 'demo',
        password: '123456',
      };
    } else {
      return {
        username: 'vipuser',
        password: 'vip123456',
      };
    }
  }
}
