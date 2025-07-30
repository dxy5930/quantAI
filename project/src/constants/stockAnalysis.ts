// 投资建议映射
export const RECOMMENDATION_MAP = {
  'strong_buy': '强烈买入',
  'buy': '买入',
  'hold': '持有',
  'sell': '卖出',
  'strong_sell': '强烈卖出'
} as const;

// 风险等级文本映射
export const RISK_TEXT_MAP = {
  'low': '低风险',
  'medium': '中风险',
  'high': '高风险'
} as const;

// 风险等级颜色映射
export const RISK_COLOR_MAP = {
  'low': 'text-green-600 dark:text-green-400',
  'medium': 'text-yellow-600 dark:text-yellow-400',
  'high': 'text-red-600 dark:text-red-400'
} as const;

// 类型定义
export type RecommendationType = keyof typeof RECOMMENDATION_MAP;
export type RiskLevelType = keyof typeof RISK_TEXT_MAP; 