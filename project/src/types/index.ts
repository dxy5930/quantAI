// 股票推荐接口
export interface StockRecommendation {
  symbol: string;
  name: string;
  score: number;
  reason: string;
  targetPrice?: number;
  riskLevel: 'low' | 'medium' | 'high';
  sector: string;
  marketCap: number;
  updatedAt: string;
  
  // 技术分析数据
  technicalAnalysis?: {
    rsi: number;
    macd: {
      macd: number;
      signal: number;
      histogram: number;
    };
    movingAverages: {
      ma5: number;
      ma10: number;
      ma20: number;
      ma50: number;
    };
    support: number;
    resistance: number;
    trend: string;
    strength: string;
  };
  
  // 基本面分析数据
  fundamentalAnalysis?: {
    peRatio: number;
    pbRatio: number;
    roe: number;
    roa: number;
    debtToEquity: number;
    currentRatio: number;
    quickRatio: number;
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
  };
  
  // 趋势数据
  trendData?: {
    period: string;
    summary: {
      trend: string;
      volatility: string;
      momentum: string;
      avgVolume: number;
      priceChange: number;
      priceChangePercent: string;
    };
  };
  
  // 推荐详情
  recommendation?: {
    rating: string;
    score: number;
    reasons: string[];
  };
}

// 选股条件接口
export interface SelectionCriteria {
  minMarketCap?: number;
  maxMarketCap?: number;
  sectors?: string[];
  minScore?: number;
  maxRisk?: 'low' | 'medium' | 'high';
  originalQuery?: string;
  keywords?: Array<{
    id: string;
    text: string;
    type?: string;
    confidence?: number;
  }>;
}

// 交易记录接口
export interface TradeRecord {
  date: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  profit?: number;
}

// 个股回测结果
export interface StockBacktestResult {
  symbol: string;
  name: string;
  totalReturn: number;
  annualReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades?: number;
  weight?: number; // 在组合中的权重
  contribution?: number; // 对组合收益的贡献
  equity?: { date: string; value: number }[];
  trades?: TradeRecord[];
}

// AI分析结果接口
export interface AIAnalysis {
  analysis_text: string;
  investment_rating: 'strongly_buy' | 'buy' | 'hold' | 'sell' | 'strongly_sell' | '强烈推荐' | '推荐' | '中性' | '谨慎' | '不推荐';
  risk_warnings: string[];
  optimization_suggestions: string[];
  generated_at: string;
}

// 回测结果接口
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
  backtestType: 'single' | 'portfolio'; // 回测类型
  // AI分析结果
  ai_analysis?: AIAnalysis;
  // 组合回测专用字段
  portfolioComposition?: StockPosition[]; // 组合构成
  individualResults?: StockBacktestResult[]; // 个股回测结果
  correlationMatrix?: number[][]; // 相关性矩阵
  diversificationRatio?: number; // 多样化比率
  // 风险分析
  volatility?: number; // 波动率
  beta?: number; // 贝塔系数
  alpha?: number; // 阿尔法
  informationRatio?: number; // 信息比率
}

// 股票持仓配置
export interface StockPosition {
  symbol: string;
  name: string;
  weight: number; // 权重 (0-1)
  sector?: string;
  marketCap?: number;
  quantity?: number;
}

// 回测股票接口
export interface BacktestStock {
  symbol: string;
  name: string;
  weight?: number; // 在组合中的权重
  sector?: string;
  performance?: number; // 在回测期间的表现 (百分比)
  contribution?: number; // 对总收益的贡献
  trades?: number; // 交易次数
  avgPrice?: number; // 平均成交价
}

// 回测配置接口
export interface BacktestPeriod {
  commission: number | undefined;
  startDate: string;
  endDate: string;
  symbol?: string; // 单股票回测时使用
  symbols?: StockPosition[]; // 多股票组合回测时使用
  initialCapital: number;
  backtestType: 'single' | 'portfolio'; // 回测类型
  rebalanceFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly'; // 再平衡频率
}

// 策略接口
export interface Strategy {
  id: string;
  name: string;
  description: string;
  icon: string;
  parameters: Parameter[];
  category: string;
  strategyType: 'stock_selection' | 'backtest';
  difficulty: 'easy' | 'medium' | 'hard';
  popularity: number;
  // 分享策略相关字段
  author?: {
    id: string;
    username: string;
    avatar?: string;
  };
  isShared?: boolean;
  shareId?: string; // 分享链接ID
  sharedAt?: string; // 分享时间
  likes?: number; // 点赞数
  favorites?: number; // 收藏数
  usageCount?: number; // 使用次数
  rating?: number; // 评分
  tags?: string[]; // 标签
  isPublic?: boolean; // 是否公开
  createdAt?: string; // 创建时间
  updatedAt?: string; // 更新时间
  
  // 选股策略特有字段
  stockRecommendations?: StockRecommendation[];
  selectionCriteria?: SelectionCriteria;
  lastScreeningDate?: string;
  totalStocksScreened?: number;
  recommendedStocksCount?: number;
  
  // 回测策略特有字段
  backtestResults?: BacktestResult;
  backtestPeriod?: BacktestPeriod;
  backtestStocks?: BacktestStock[]; // 回测股票集
  lastBacktestDate?: string;
}

export interface Parameter {
  key: string;
  label: string;
  type: 'number' | 'select' | 'boolean';
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
}

// 用户等级枚举（与API类型保持一致）
export enum UserLevel {
  NORMAL = 1,    // 普通用户
  PREMIUM = 2,   // 高级用户
  SUPER = 3,     // 超级用户
}

// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
  level?: UserLevel; // 用户等级
  createdAt: string;
  lastLoginAt: string;
  profile: UserProfile;
}

export interface UserProfile {
  displayName: string;
  tradingExperience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  riskTolerance: 'low' | 'medium' | 'high';
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
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

// 策略广场相关类型
export interface SharedStrategy extends Strategy {
  defaultTradingRules: any;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  isShared: true;
  shareId: string;
  sharedAt: string;
  likes: number;
  favorites: number;
  usageCount: number;
  rating: number;
  tags: string[];
  backtestResults?: BacktestResult;
  isPublic: true;
  createdAt: string;
  updatedAt: string;
}

// 我的策略类型
export interface MyStrategy extends Strategy {
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  isShared: boolean;
  shareId?: string;
  sharedAt?: string;
  likes: number;
  favorites: number;
  usageCount: number;
  rating?: number;
  tags: string[];
  backtestResults?: BacktestResult;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// 策略创建/编辑表单数据
export interface StrategyFormData {
  name: string;
  description: string;
  icon: string;
  category: string;
  strategyType: 'stock_selection' | 'backtest';
  difficulty: 'easy' | 'medium' | 'hard';
  parameters: Parameter[];
  tags: string[];
  isPublic: boolean;
}

// 策略分享配置
export interface StrategyShareConfig {
  strategyId: string;
  isPublic: boolean;
  allowModification: boolean;
  shareMessage?: string;
}

export interface StrategyConfig {
  strategyId: string;
  parameters: Record<string, any>;
  // 单股票回测配置
  symbol?: string;
  // 组合回测配置
  symbols?: StockPosition[];
  backtestType: 'single' | 'portfolio';
  startDate: string;
  endDate: string;
  initialCapital: number;
  rebalanceFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

// 图表数据类型
export interface ChartData {
  date: string;
  value: number;
  [key: string]: any;
}

// K线数据类型
export interface CandlestickData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 资金曲线数据类型
export interface EquityData {
  date: string;
  value: number;
  benchmark?: number;
}

// 交易记录数据类型
export interface TradeData {
  id: string;
  date: string;
  symbol: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  amount: number;
  profit?: number;
  profitPercent?: number;
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

// 错误代码枚举
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
  
  // AI服务相关 6000-6099
  AI_SERVICE_UNAVAILABLE = 6000,
  AI_QUOTA_EXCEEDED = 6001,
  
  // 系统相关 9000-9999
  DATABASE_ERROR = 9000,
  EXTERNAL_SERVICE_ERROR = 9001,
  NETWORK_ERROR = 9002
}