// 股票分析组件配置文件
// 避免硬编码，集中管理所有样式和标签

import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Shield,
  ShieldCheck,
} from "lucide-react";

// 投资建议配置
export const RECOMMENDATION_CONFIG = {
  BUY: {
    label: "买入",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
  },
  HOLD: {
    label: "持有", 
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
  },
  SELL: {
    label: "卖出",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
  }
} as const;

// 风险等级配置
export const RISK_LEVEL_CONFIG = {
  low: {
    label: "低风险",
    icon: ShieldCheck,
    className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    iconClassName: "w-4 h-4 text-green-500"
  },
  medium: {
    label: "中等风险", 
    icon: Shield,
    className: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
    iconClassName: "w-4 h-4 text-orange-500"
  },
  high: {
    label: "高风险",
    icon: AlertTriangle,
    className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300", 
    iconClassName: "w-4 h-4 text-red-500"
  }
} as const;

// 趋势配置
export const TREND_CONFIG = {
  upward: { icon: TrendingUp, className: "w-4 h-4 text-green-500", label: "上升" },
  bullish: { icon: TrendingUp, className: "w-4 h-4 text-green-500", label: "看涨" },
  downward: { icon: TrendingDown, className: "w-4 h-4 text-red-500", label: "下降" },
  bearish: { icon: TrendingDown, className: "w-4 h-4 text-red-500", label: "看跌" },
  neutral: { icon: Activity, className: "w-4 h-4 text-gray-500", label: "中性" }
} as const;

// 波动性配置
export const VOLATILITY_CONFIG = {
  high: { label: "高", className: "text-red-600" },
  medium: { label: "中", className: "text-yellow-600" },
  low: { label: "低", className: "text-green-600" }
} as const;

// 动量配置
export const MOMENTUM_CONFIG = {
  positive: { label: "正向", className: "text-green-600" },
  negative: { label: "负向", className: "text-red-600" },
  neutral: { label: "中性", className: "text-gray-600" }
} as const;

// 辅助函数
export const getRecommendationConfig = (rating: string) => {
  return RECOMMENDATION_CONFIG[rating as keyof typeof RECOMMENDATION_CONFIG] || {
    label: rating,
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
  };
};

export const getRiskConfig = (riskLevel: string) => {
  return RISK_LEVEL_CONFIG[riskLevel as keyof typeof RISK_LEVEL_CONFIG] || RISK_LEVEL_CONFIG.medium;
};

export const getTrendConfig = (trend: string) => {
  return TREND_CONFIG[trend as keyof typeof TREND_CONFIG] || TREND_CONFIG.neutral;
};

export const getVolatilityConfig = (volatility: string) => {
  return VOLATILITY_CONFIG[volatility as keyof typeof VOLATILITY_CONFIG] || VOLATILITY_CONFIG.medium;
};

export const getMomentumConfig = (momentum: string) => {
  return MOMENTUM_CONFIG[momentum as keyof typeof MOMENTUM_CONFIG] || MOMENTUM_CONFIG.neutral;
}; 