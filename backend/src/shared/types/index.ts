// 导入用户常量
import { USER_CONSTANTS, STRATEGY_CONSTANTS } from "../constants";

// 用户等级枚举
export enum UserLevel {
  NORMAL = 1,    // 普通用户
  PREMIUM = 2,   // 高级用户
  SUPER = 3,     // 超级用户
}

// 用户等级映射
export const USER_LEVEL_MAP = {
  [UserLevel.NORMAL]: '普通用户',
  [UserLevel.PREMIUM]: '高级用户',
  [UserLevel.SUPER]: '超级用户',
} as const;

// 用户等级权限配置
export const USER_LEVEL_PERMISSIONS = {
  [UserLevel.NORMAL]: USER_CONSTANTS.LEVEL_PERMISSIONS.NORMAL,
  [UserLevel.PREMIUM]: USER_CONSTANTS.LEVEL_PERMISSIONS.PREMIUM,
  [UserLevel.SUPER]: USER_CONSTANTS.LEVEL_PERMISSIONS.SUPER,
} as const;

// 用户相关类型
export interface UserProfile {
  displayName: string;
  bio?: string;
  location?: string;
  website?: string;
  tradingExperience: "beginner" | "intermediate" | "advanced" | "expert";
  preferredMarkets: string[];
  riskTolerance: "low" | "medium" | "high";
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: any;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// 策略相关类型
export interface Parameter {
  key: string;
  label: string;
  type: "number" | "select" | "boolean";
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
}

export interface StockPosition {
  symbol: string;
  name: string;
  weight: number;
  sector?: string;
  marketCap?: number;
}

export interface BacktestPeriod {
  startDate: string;
  endDate: string;
  symbol?: string;
  symbols?: StockPosition[];
  initialCapital: number;
  backtestType: "single" | "portfolio";
  rebalanceFrequency?: "daily" | "weekly" | "monthly" | "quarterly";
}

export interface TradeRecord {
  date: string;
  type: "buy" | "sell";
  price: number;
  quantity: number;
  profit?: number;
}

export interface StockBacktestResult {
  symbol: string;
  name: string;
  totalReturn: number;
  annualReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades?: number;
  weight?: number;
  contribution?: number;
  equity?: { date: string; value: number }[];
  trades?: TradeRecord[];
}

export interface BacktestResult {
  totalReturn: number;
  annualReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades?: number;
  avgTradeReturn?: number;
  profitFactor?: number;
  calmarRatio?: number;
  equity?: { date: string; value: number }[];
  trades?: TradeRecord[];
  backtestType: "single" | "portfolio";
  portfolioComposition?: StockPosition[];
  individualResults?: StockBacktestResult[];
  correlationMatrix?: number[][];
  diversificationRatio?: number;
  volatility?: number;
  beta?: number;
  alpha?: number;
  informationRatio?: number;
}

// 买卖条件类型
export interface TradingCondition {
  type: "price" | "technical" | "fundamental" | "time";
  operator: ">" | "<" | ">=" | "<=" | "=" | "cross_above" | "cross_below";
  value: number | string;
  indicator?: string; // 技术指标名称，如 "RSI", "MACD", "MA"
  period?: number; // 指标周期
  description?: string; // 条件描述
}

export interface TradingRule {
  // 买入条件
  buyConditions: TradingCondition[];
  buyAmount: number; // 买入金额（元）或比例（0-1）
  buyAmountType: "fixed" | "percentage"; // 固定金额或按比例
  
  // 卖出条件
  sellConditions: TradingCondition[];
  sellAmount: number; // 卖出数量（股）或比例（0-1）
  sellAmountType: "fixed" | "percentage"; // 固定数量或按比例
  
  // 止损止盈
  stopLoss?: number; // 止损比例（如 -0.1 表示 -10%）
  takeProfit?: number; // 止盈比例（如 0.2 表示 +20%）
  
  // 其他规则
  maxPositionSize?: number; // 最大持仓比例（0-1）
  minHoldingPeriod?: number; // 最小持有天数
  maxHoldingPeriod?: number; // 最大持有天数
}

export interface StrategyConfig {
  strategyId: string;
  parameters: Record<string, any>;
  symbol?: string;
  symbols?: StockPosition[];
  backtestType: "single" | "portfolio";
  startDate: string;
  endDate: string;
  initialCapital: number;
  rebalanceFrequency?: "daily" | "weekly" | "monthly" | "quarterly";
  
  // 新增交易规则
  tradingRules?: TradingRule;
  
  // 交易设置
  commission?: number; // 手续费率（如 0.001 表示 0.1%）
  slippage?: number; // 滑点（如 0.001 表示 0.1%）
  minTradeAmount?: number; // 最小交易金额
}

// 股票推荐相关类型
export interface StockRecommendation {
  symbol: string;
  name: string;
  score: number;
  reason: string;
  targetPrice?: number;
  riskLevel: "low" | "medium" | "high";
  sector: string;
  marketCap: number;
  updatedAt: string;
}

export interface SelectionCriteria {
  minMarketCap?: number;
  maxMarketCap?: number;
  sectors?: string[];
  minScore?: number;
  maxRisk?: "low" | "medium" | "high";
}

// 分页相关类型
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

// 排序相关类型
export type SortField = typeof STRATEGY_CONSTANTS.SORT_FIELDS[number];
export type SortOrder = typeof STRATEGY_CONSTANTS.SORT_ORDERS[number];

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  total_pages?: number;
}

// 统一错误响应格式
export interface ErrorResponse {
  code: number | string;
  message: string;
  data?: any;
  success: false;
  timestamp?: string;
  path?: string;
}

// 统一成功响应格式
export interface SuccessResponse<T = any> {
  code: number | string;
  message: string;
  data: T;
  success: true;
  timestamp?: string;
}

// 统一API响应类型
export type UnifiedApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// API响应类型 (保持向后兼容)
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

// 错误类型枚举
export enum ErrorCode {
  // 通用错误 1000-1999
  UNKNOWN_ERROR = 1000,
  VALIDATION_ERROR = 1001,
  PERMISSION_DENIED = 1002,
  RESOURCE_NOT_FOUND = 1003,
  
  // 认证相关 2000-2099
  UNAUTHORIZED = 2000,
  TOKEN_EXPIRED = 2001,
  INVALID_CREDENTIALS = 2002,
  
  // 用户相关 2100-2199
  USER_NOT_FOUND = 2100,
  USERNAME_EXISTS = 2101,
  EMAIL_EXISTS = 2102,
  
  // 策略相关 3000-3099
  STRATEGY_NOT_FOUND = 3000,
  STRATEGY_PERMISSION_DENIED = 3001,
  
  // 回测相关 4000-4099
  BACKTEST_LIMIT_EXCEEDED = 4000,
  BACKTEST_FAILED = 4001,
  
  // 股票相关 5000-5099
  STOCK_NOT_FOUND = 5000,
  STOCK_DATA_UNAVAILABLE = 5001,
  
  // 系统相关 9000-9999
  DATABASE_ERROR = 9000,
  EXTERNAL_SERVICE_ERROR = 9001,
  NETWORK_ERROR = 9002
}

// 错误消息映射
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // 通用错误
  [ErrorCode.UNKNOWN_ERROR]: '未知错误',
  [ErrorCode.VALIDATION_ERROR]: '参数验证失败',
  [ErrorCode.PERMISSION_DENIED]: '权限不足',
  [ErrorCode.RESOURCE_NOT_FOUND]: '资源不存在',
  
  // 认证相关
  [ErrorCode.UNAUTHORIZED]: '未授权访问',
  [ErrorCode.TOKEN_EXPIRED]: '登录已过期',
  [ErrorCode.INVALID_CREDENTIALS]: '用户名或密码错误',
  
  // 用户相关
  [ErrorCode.USER_NOT_FOUND]: '用户不存在',
  [ErrorCode.USERNAME_EXISTS]: '用户名已存在',
  [ErrorCode.EMAIL_EXISTS]: '邮箱已被使用',
  
  // 策略相关
  [ErrorCode.STRATEGY_NOT_FOUND]: '策略不存在',
  [ErrorCode.STRATEGY_PERMISSION_DENIED]: '无权访问该策略',
  
  // 回测相关
  [ErrorCode.BACKTEST_LIMIT_EXCEEDED]: '回测次数已达上限',
  [ErrorCode.BACKTEST_FAILED]: '回测执行失败',
  
  // 股票相关
  [ErrorCode.STOCK_NOT_FOUND]: '股票不存在',
  [ErrorCode.STOCK_DATA_UNAVAILABLE]: '股票数据不可用',
  
  // 系统相关
  [ErrorCode.DATABASE_ERROR]: '数据库错误',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: '外部服务错误',
  [ErrorCode.NETWORK_ERROR]: '网络连接错误'
};

// 其他已有的类型定义...
