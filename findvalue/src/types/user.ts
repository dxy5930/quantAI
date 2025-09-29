// 用户信息类型定义
export interface UserInfo {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  nickname?: string;
  phone?: string;
  isVip?: boolean;
  level?: number;
}

// 用户登录信息
export interface LoginData {
  userInfo: UserInfo;
  authToken: string;
  refreshToken?: string;
}

// 用户存储键名常量
export const USER_STORAGE_KEYS = {
  USER_INFO: 'userInfo',
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  IS_LOGGED_IN: 'isLoggedIn',
} as const; 