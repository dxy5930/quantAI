

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
  backtestResults: { totalReturn: number; annualReturn: number; sharpeRatio: number; maxDrawdown: number; winRate: number; totalTrades: number; backtestType: string; volatility: number; beta: number; alpha: number; };
  backtestPeriod: { startDate: string; endDate: string; initialCapital: number; backtestType: string; symbols: { symbol: string; name: string; weight: number; sector: string; }[]; };
  backtestStocks: { symbol: string; name: string; weight: number; sector: string; performance: number; contribution: number; trades: number; avgPrice: number; }[];
  lastBacktestDate: string;
  stockRecommendations: import("c:/Users/hsayit/Downloads/chaogu/project/src/types/index").StockRecommendation[];
  selectionCriteria: { minMarketCap: number; sectors: string[]; minScore: number; maxRisk: string; };
  lastScreeningDate: string;
  recommendedStocksCount: number;
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
  performance?: StrategyPerformance;
}

// 策略性能类型
export interface StrategyPerformance {
  total_return: number;
  annual_return: number;
  max_drawdown: number;
  sharpe_ratio: number;
  win_rate: number;
  profit_factor: number;
}

// 回测请求类型
export interface BacktestRequest {
  strategy_id: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  symbols: string[];
  // 扩展字段：权重信息（按symbols顺序对应）
  weights?: number[];
  // 扩展字段：再平衡频率
  rebalance_frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  // 扩展字段：手续费
  commission?: number;
}

// AI分析结果类型
export interface AIAnalysis {
  analysis_text: string;
  investment_rating: 'strongly_buy' | 'buy' | 'hold' | 'sell' | 'strongly_sell' | '强烈推荐' | '推荐' | '中性' | '谨慎' | '不推荐';
  risk_warnings: string[];
  optimization_suggestions: string[];
  generated_at: string;
}

// 回测结果类型
export interface BacktestResult {
  id?: string;
  strategy_id: string;
  performance?: StrategyPerformance;
  trades: Trade[];
  equity_curve: EquityPoint[];
  created_at?: string;
  // AI分析结果
  ai_analysis?: AIAnalysis;
  // 兼容直接在根级别的性能指标
  total_return?: number;
  annual_return?: number;
  max_drawdown?: number;
  sharpe_ratio?: number;
  win_rate?: number;
  profit_factor?: number;
  volatility?: number;
}

// 交易记录类型
export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: string;
  pnl: number;
}

// 权益曲线点类型
export interface EquityPoint {
  date: string;
  value: number;
}

// 股票信息类型
export interface StockInfo {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  market_cap: number;
  price: number;
  change: number;
  change_percent: number;
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

 