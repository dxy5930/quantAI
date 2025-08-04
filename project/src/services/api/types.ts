

// 分页参数类型
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// 分页响应类型
export interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// 用户等级枚举
export enum UserLevel {
  NORMAL = 1,    // 普通用户
  PREMIUM = 2,   // 高级用户
  SUPER = 3,     // 超级用户
}

// 用户信息类型
export interface UserInfo {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  role: 'user' | 'admin';
  level?: UserLevel; // 用户等级
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  // 支持嵌套和平铺两种结构
  profile?: {
    displayName: string;
    tradingExperience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    riskTolerance: 'low' | 'medium' | 'high';
  };
  // 后端直接返回的平铺字段
  displayName?: string;
  tradingExperience?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  riskTolerance?: 'low' | 'medium' | 'high';
}

// 策略类型
export interface Strategy {
  favorites: any;
  likes: any;
  icon: any;
  id: string;
  name: string;
  description: string;
  type: string;
  parameters: Record<string, any>;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
}



// AI分析结果类型
export interface AIAnalysis {
  analysis_text: string;
  investment_rating: 'strongly_buy' | 'buy' | 'hold' | 'sell' | 'strongly_sell' | '强烈推荐' | '推荐' | '中性' | '谨慎' | '不推荐';
  risk_warnings: string[];
  optimization_suggestions: string[];
  generated_at: string;
}



// 认证相关类型
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  username?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: UserInfo;
}

// 通知类型
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: any;
}

// 系统状态类型
export interface SystemStatus {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
    queue: 'up' | 'down';
  };
}

 