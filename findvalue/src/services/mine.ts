import { runInAction } from 'mobx';
import { Alert } from 'react-native';
import { BusinessError } from '../utils/axios';
import * as MineApi from '../api/mine';
import type { UserInfo } from '../types/user';

/**
 * 菜单项接口
 */
export interface MenuItem {
  icon: string;
  title: string;
  action: () => void;
  badge?: number;
  vipOnly?: boolean;
}

/**
 * 用户统计数据接口
 */
export interface UserStats {
  totalOperations: number;
  currentStatus: string;
  userType: string;
  level: number;
  vipStatus: boolean;
}

/**
 * 我的页面业务逻辑
 */
export class Mine {
  /**
   * 获取登录用户的菜单项
   */
  static getLoggedInMenuItems(navigation: any): MenuItem[] {
    return [
      { icon: '👤', title: '个人信息', action: () => navigation.navigate('Details', { from: 'Mine-UserInfo' }) },
      { icon: '⚙️', title: '设置', action: () => navigation.navigate('Details', { from: 'Mine-Settings' }) },
      { icon: '📊', title: '统计', action: () => navigation.navigate('Details', { from: 'Mine-Stats' }) },
      { icon: '🔔', title: '通知', badge: 3, action: () => navigation.navigate('Details', { from: 'Mine-Notifications' }) },
      { icon: '💎', title: 'VIP特权', action: () => navigation.navigate('Details', { from: 'Mine-VIP' }), vipOnly: true },
      { icon: '❓', title: '帮助', action: () => navigation.navigate('Details', { from: 'Mine-Help' }) },
      { icon: '📞', title: '联系我们', action: () => navigation.navigate('Details', { from: 'Mine-Contact' }) },
    ];
  }

  /**
   * 获取未登录用户的菜单项
   */
  static getGuestMenuItems(navigation: any): MenuItem[] {
    return [
      { icon: '❓', title: '帮助', action: () => navigation.navigate('Details', { from: 'Mine-Help' }) },
      { icon: '📞', title: '联系我们', action: () => navigation.navigate('Details', { from: 'Mine-Contact' }) },
      { icon: '📋', title: '用户协议', action: () => navigation.navigate('Details', { from: 'Mine-Terms' }) },
      { icon: '🔒', title: '隐私政策', action: () => navigation.navigate('Details', { from: 'Mine-Privacy' }) },
    ];
  }

  /**
   * 计算用户统计数据
   */
  static calculateUserStats(
    counterValue: number,
    isPositive: boolean,
    isVip: boolean,
    userLevel: number
  ): UserStats {
    return {
      totalOperations: Math.abs(counterValue),
      currentStatus: isPositive ? '正数' : '负数',
      userType: isVip ? 'VIP' : '普通',
      level: userLevel,
      vipStatus: isVip
    };
  }

  /**
   * 处理登出逻辑
   */
  static async handleLogout(
    logoutHook: () => Promise<boolean>
  ): Promise<void> {
    return new Promise((resolve) => {
      Alert.alert(
        '确认登出',
        '您确定要退出登录吗？',
        [
          { text: '取消', style: 'cancel', onPress: () => resolve() },
          {
            text: '确定',
            style: 'destructive',
            onPress: async () => {
              runInAction(async () => {
                const success = await logoutHook();
                if (success) {
                  Alert.alert('提示', '已成功退出登录');
                } else {
                  Alert.alert('错误', '退出登录失败，请重试');
                }
                resolve();
              });
            },
          },
        ]
      );
    });
  }

  /**
   * 处理VIP功能点击
   */
  static handleVipFeatureClick(): void {
    Alert.alert('VIP功能', '该功能仅对VIP用户开放');
  }

  /**
   * 获取用户显示名称
   */
  static getUserDisplayName(userInfo: UserInfo | null): string {
    if (!userInfo) return '未登录';
    return userInfo.nickname || userInfo.username || userInfo.email || '用户';
  }

  /**
   * 获取用户头像显示
   */
  static getUserAvatarDisplay(userInfo: UserInfo | null, isVip: boolean): string {
    if (!userInfo) return '👤';
    return userInfo.avatar || (isVip ? '👑' : '👤');
  }

  /**
   * 检查菜单项是否应该显示
   */
  static shouldShowMenuItem(
    item: MenuItem,
    isAuthenticated: boolean,
    isVip: boolean
  ): boolean {
    // VIP专属功能对未登录用户不显示
    if (item.vipOnly === true && !isAuthenticated) {
      return false;
    }
    return true;
  }

  /**
   * 检查菜单项是否应该禁用
   */
  static shouldDisableMenuItem(
    item: MenuItem,
    isAuthenticated: boolean,
    isVip: boolean
  ): boolean {
    // VIP专属功能且用户不是VIP时禁用
    return item.vipOnly === true && isAuthenticated && !isVip;
  }

  /**
   * 格式化用户等级显示
   */
  static formatUserLevel(level: number): string {
    return `Lv.${level}`;
  }

  /**
   * 格式化用户信息显示
   */
  static formatUserInfo(userInfo: UserInfo | null, level: number): string {
    if (!userInfo) return '';
    return `等级 ${this.formatUserLevel(level)} | ${userInfo.email}`;
  }

  /**
   * 获取应用版本信息
   */
  static getAppVersion(): string {
    return 'FindValue v1.0.0';
  }

  /**
   * 获取应用描述
   */
  static getAppDescription(): string {
    return '让计数变得更有价值';
  }

  /**
   * 生成欢迎消息
   */
  static getWelcomeMessage(displayName: string): string {
    return `欢迎回来，${displayName}！`;
  }

  // ==================== 业务对象相关方法 ====================

  /**
   * 获取业务对象列表
   */
  static async getBizObjects(params: MineApi.ObjectQueryParams = {}) {
    try {
      const result = await MineApi.queryBizObjects(params);
      return result.data;
    } catch (error) {
      if (error instanceof BusinessError) {
        throw error;
      }
      throw new BusinessError('获取业务对象列表失败');
    }
  }

  /**
   * 获取单个业务对象
   */
  static async getBizObject(objectCode: string) {
    try {
      const result = await MineApi.getSingleBizObject(objectCode);
      return result.data;
    } catch (error) {
      if (error instanceof BusinessError) {
        throw error;
      }
      throw new BusinessError('获取业务对象失败');
    }
  }

  /**
   * 创建业务对象
   */
  static async createBizObject(data: MineApi.CreateObjectRequest) {
    try {
      const result = await MineApi.createBizObject(data);
      return result.data;
    } catch (error) {
      if (error instanceof BusinessError) {
        throw error;
      }
      throw new BusinessError('创建业务对象失败');
    }
  }

  /**
   * 更新业务对象
   */
  static async updateBizObject(objectId: string, data: MineApi.UpdateObjectRequest) {
    try {
      const result = await MineApi.updateBizObject(objectId, data);
      return result.data;
    } catch (error) {
      if (error instanceof BusinessError) {
        throw error;
      }
      throw new BusinessError('更新业务对象失败');
    }
  }

  /**
   * 删除业务对象
   */
  static async deleteBizObject(objectId: string) {
    try {
      await MineApi.deleteBizObject(objectId);
    } catch (error) {
      if (error instanceof BusinessError) {
        throw error;
      }
      throw new BusinessError('删除业务对象失败');
    }
  }
} 