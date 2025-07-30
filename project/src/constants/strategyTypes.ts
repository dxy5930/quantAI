// 策略类型枚举
export enum StrategyType {
  STOCK_SELECTION = 'stock_selection',
  BACKTEST = 'backtest'
}

// 策略难度级别枚举
export enum StrategyDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

// 排序字段枚举
export enum SortField {
  POPULARITY = 'popularity',
  LIKES = 'likes',
  RATING = 'rating',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  USAGE_COUNT = 'usageCount'
}

// 排序方向枚举
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC'
}

// 特殊值常量
export const STRATEGY_FILTER_VALUES = {
  ALL: 'all'
} as const;

// 默认值常量
export const STRATEGY_DEFAULTS = {
  SELECTED_CATEGORY: STRATEGY_FILTER_VALUES.ALL,
  SELECTED_STRATEGY_TYPE: STRATEGY_FILTER_VALUES.ALL,
  SORT_BY: SortField.POPULARITY,
  SORT_ORDER: SortOrder.DESC,
  SEARCH_TERM: '',
  DIFFICULTY: StrategyDifficulty.MEDIUM,
  PAGE_SIZE: 20,
  PAGE: 1
} as const;

// 风险级别枚举
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// 市值格式化常量
export const MARKET_CAP_THRESHOLDS = {
  TRILLION: 1000000000000,  // 1T
  BILLION: 1000000000,      // 1B
  MILLION: 1000000,         // 1M
} as const;

// 格式化常量
export const FORMAT_CONSTANTS = {
  PERCENTAGE_MULTIPLIER: 100,
  DEFAULT_PERCENTAGE_DECIMALS: 1,
  DEFAULT_NUMBER_DECIMALS: 2,
  DECIMAL_PLACES: {
    PERCENTAGE: 1,
    NUMBER: 2,
    MARKET_CAP: 1,
  }
} as const;

// 策略类型显示名称映射
export const STRATEGY_TYPE_LABELS = {
  [StrategyType.STOCK_SELECTION]: '选股策略',
  [StrategyType.BACKTEST]: '回测策略'
} as const;

// 策略难度级别显示名称映射
export const STRATEGY_DIFFICULTY_LABELS = {
  [StrategyDifficulty.EASY]: '简单',
  [StrategyDifficulty.MEDIUM]: '中等',
  [StrategyDifficulty.HARD]: '困难'
} as const;

// 策略难度级别配置
export const STRATEGY_DIFFICULTY_CONFIG = {
  [StrategyDifficulty.EASY]: { 
    label: '简单', 
    color: 'text-green-500 bg-green-100 dark:bg-green-900/30' 
  },
  [StrategyDifficulty.MEDIUM]: { 
    label: '中等', 
    color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' 
  },
  [StrategyDifficulty.HARD]: { 
    label: '困难', 
    color: 'text-red-500 bg-red-100 dark:bg-red-900/30' 
  }
} as const;

// 风险级别映射
export const RISK_LEVEL_LABELS = {
  [RiskLevel.LOW]: '低风险',
  [RiskLevel.MEDIUM]: '中风险',
  [RiskLevel.HIGH]: '高风险'
} as const;

// 排序字段显示名称映射
export const SORT_FIELD_LABELS = {
  [SortField.POPULARITY]: '按热度排序',
  [SortField.LIKES]: '按点赞数排序',
  [SortField.RATING]: '按评分排序',
  [SortField.CREATED_AT]: '按创建时间排序',
  [SortField.UPDATED_AT]: '按更新时间排序',
  [SortField.USAGE_COUNT]: '按使用次数排序'
} as const;

// 策略类型颜色映射
export const STRATEGY_TYPE_COLORS = {
  [StrategyType.STOCK_SELECTION]: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  [StrategyType.BACKTEST]: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
} as const;

// 策略类型图标映射
export const STRATEGY_TYPE_ICONS = {
  [StrategyType.STOCK_SELECTION]: 'Target',
  [StrategyType.BACKTEST]: 'BarChart3'
} as const;

// 策略类型描述映射
export const STRATEGY_TYPE_DESCRIPTIONS = {
  [StrategyType.STOCK_SELECTION]: '基于技术指标和基本面分析筛选优质股票',
  [StrategyType.BACKTEST]: '通过历史数据验证策略的有效性和收益率'
} as const;

// 所有策略类型选项（用于下拉框等）
export const STRATEGY_TYPE_OPTIONS = [
  { value: STRATEGY_FILTER_VALUES.ALL, label: '全部' },
  { value: StrategyType.STOCK_SELECTION, label: STRATEGY_TYPE_LABELS[StrategyType.STOCK_SELECTION] },
  { value: StrategyType.BACKTEST, label: STRATEGY_TYPE_LABELS[StrategyType.BACKTEST] }
] as const;

// 策略难度选项
export const STRATEGY_DIFFICULTY_OPTIONS = [
  { value: StrategyDifficulty.EASY, label: STRATEGY_DIFFICULTY_LABELS[StrategyDifficulty.EASY] },
  { value: StrategyDifficulty.MEDIUM, label: STRATEGY_DIFFICULTY_LABELS[StrategyDifficulty.MEDIUM] },
  { value: StrategyDifficulty.HARD, label: STRATEGY_DIFFICULTY_LABELS[StrategyDifficulty.HARD] }
] as const;

// 排序选项
export const SORT_OPTIONS = [
  { value: SortField.POPULARITY, label: SORT_FIELD_LABELS[SortField.POPULARITY] },
  { value: SortField.LIKES, label: SORT_FIELD_LABELS[SortField.LIKES] },
  { value: SortField.RATING, label: SORT_FIELD_LABELS[SortField.RATING] },
  { value: SortField.CREATED_AT, label: SORT_FIELD_LABELS[SortField.CREATED_AT] },
  { value: SortField.UPDATED_AT, label: SORT_FIELD_LABELS[SortField.UPDATED_AT] },
  { value: SortField.USAGE_COUNT, label: SORT_FIELD_LABELS[SortField.USAGE_COUNT] }
] as const;

// 策略类型验证函数
export const isValidStrategyType = (type: string): type is StrategyType => {
  return Object.values(StrategyType).includes(type as StrategyType);
};

// 策略难度验证函数
export const isValidStrategyDifficulty = (difficulty: string): difficulty is StrategyDifficulty => {
  return Object.values(StrategyDifficulty).includes(difficulty as StrategyDifficulty);
};

// 排序字段验证函数
export const isValidSortField = (field: string): field is SortField => {
  return Object.values(SortField).includes(field as SortField);
};

// 排序方向验证函数
export const isValidSortOrder = (order: string): order is SortOrder => {
  return Object.values(SortOrder).includes(order as SortOrder);
};

// 获取策略类型标签
export const getStrategyTypeLabel = (type: StrategyType): string => {
  return STRATEGY_TYPE_LABELS[type] || '未知类型';
};

// 获取策略类型颜色
export const getStrategyTypeColor = (type: StrategyType): string => {
  return STRATEGY_TYPE_COLORS[type] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
};

// 获取策略类型图标
export const getStrategyTypeIcon = (type: StrategyType): string => {
  return STRATEGY_TYPE_ICONS[type] || 'HelpCircle';
};

// 获取策略类型描述
export const getStrategyTypeDescription = (type: StrategyType): string => {
  return STRATEGY_TYPE_DESCRIPTIONS[type] || '暂无描述';
};

// 获取策略难度标签
export const getStrategyDifficultyLabel = (difficulty: StrategyDifficulty): string => {
  return STRATEGY_DIFFICULTY_LABELS[difficulty] || '未知难度';
};

// 获取策略难度颜色
export const getStrategyDifficultyColor = (difficulty: StrategyDifficulty): string => {
  return STRATEGY_DIFFICULTY_CONFIG[difficulty]?.color || 'text-gray-500 bg-gray-100 dark:bg-gray-900/30';
};

// 获取风险级别标签
export const getRiskLevelLabel = (riskLevel: RiskLevel): string => {
  return RISK_LEVEL_LABELS[riskLevel] || '未知风险';
}; 

// 获取排序字段标签
export const getSortFieldLabel = (field: SortField): string => {
  return SORT_FIELD_LABELS[field] || '未知排序';
}; 

// 排行榜排序类型枚举
export enum RankingSortType {
  POPULARITY = 'popularity',
  LIKES = 'likes',
  USAGE_COUNT = 'usageCount', 
  RATING = 'rating'
}

// 排行榜排序类型标签映射
export const RANKING_SORT_LABELS = {
  [RankingSortType.POPULARITY]: '热度',
  [RankingSortType.LIKES]: '点赞',
  [RankingSortType.USAGE_COUNT]: '使用',
  [RankingSortType.RATING]: '评分'
} as const;

// 排行榜排序类型图标映射
export const RANKING_SORT_ICONS = {
  [RankingSortType.POPULARITY]: 'Activity',
  [RankingSortType.LIKES]: 'ThumbsUp',
  [RankingSortType.USAGE_COUNT]: 'Users',
  [RankingSortType.RATING]: 'Star'
} as const;

// 排行榜配置
export const RANKING_CONFIG = {
  DEFAULT_SORT: RankingSortType.POPULARITY,
  DEFAULT_LIMIT: 5,
  RANK_COLORS: {
    FIRST: 'text-yellow-500',
    SECOND: 'text-gray-400', 
    THIRD: 'text-orange-400',
    DEFAULT: 'text-blue-500'
  }
} as const;

// 排行榜排序选项
export const RANKING_SORT_OPTIONS = [
  RankingSortType.POPULARITY,
  RankingSortType.LIKES,
  RankingSortType.USAGE_COUNT,
  RankingSortType.RATING
] as const;

// 获取排行榜排序标签
export const getRankingSortLabel = (sortType: RankingSortType): string => {
  return RANKING_SORT_LABELS[sortType] || '热度';
};

// 获取排行榜排序图标
export const getRankingSortIcon = (sortType: RankingSortType): string => {
  return RANKING_SORT_ICONS[sortType] || 'Activity';
};

// 获取排名颜色
export const getRankColor = (index: number): string => {
  if (index === 0) return RANKING_CONFIG.RANK_COLORS.FIRST;
  if (index === 1) return RANKING_CONFIG.RANK_COLORS.SECOND;
  if (index === 2) return RANKING_CONFIG.RANK_COLORS.THIRD;
  return RANKING_CONFIG.RANK_COLORS.DEFAULT;
};

// 排行榜排序类型验证函数
export const isValidRankingSortType = (type: string): type is RankingSortType => {
  return Object.values(RankingSortType).includes(type as RankingSortType);
}; 