// 用户接口
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
  level: UserLevel;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  profile?: UserProfile;
}

// 用户资料接口
export interface UserProfile {
  displayName?: string;
  tradingExperience?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  riskTolerance?: 'low' | 'medium' | 'high';
}

// 用户等级枚举（与API类型保持一致）
export enum UserLevel {
  NORMAL = 1,    // 普通用户
  PREMIUM = 2,   // 高级用户
  SUPER = 3,     // 超级用户
}

// 登录凭据接口（用于Store）
export interface LoginCredentials {
  username: string;
  password: string;
}

// 注册数据接口（用于Store）
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// 登录请求接口
export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

// 注册请求接口
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// 重置密码请求接口
export interface ResetPasswordRequest {
  email: string;
  newPassword: string;
  confirmPassword: string;
  token: string;
}

// 忘记密码请求接口
export interface ForgotPasswordRequest {
  email: string;
}

// 修改密码请求接口
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// 更新用户资料请求接口
export interface UpdateProfileRequest {
  username?: string;
  email?: string;
  avatar?: string;
}

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分页参数接口
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// 分页响应接口
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 统一API响应格式
export interface UnifiedApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

// 便签接口
export interface StickyNote {
  id: string;
  title: string;
  content: string;
  color: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

// 创建便签DTO
export interface CreateStickyNoteDto {
  title: string;
  content: string;
  color?: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

// 更新便签DTO
export interface UpdateStickyNoteDto {
  title?: string;
  content?: string;
  color?: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  zIndex?: number;
  isMinimized?: boolean;
}

// AI工作流相关接口
export interface AIWorkflowNode {
  id: string;
  type: string;
  data: any;
  position: { x: number; y: number };
}

export interface AIWorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface AIWorkflow {
  id: string;
  name: string;
  description?: string;
  nodes: AIWorkflowNode[];
  edges: AIWorkflowEdge[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

// 错误接口
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// 错误代码枚举
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED', 
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  STOCK_NOT_FOUND = 'STOCK_NOT_FOUND'
}

// 导出工作流类型
export * from './workflow-types';