/**
 * 应用程序常量配置
 * 统一管理所有硬编码值，提高可维护性和可配置性
 */

// ==================== 业务常量 ====================

/**
 * 用户相关常量
 */
export const USER_CONSTANTS = {
  // 字段长度限制
  USERNAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 100,
  DISPLAY_NAME_MAX_LENGTH: 100,
  AVATAR_URL_MAX_LENGTH: 500,
  LOCATION_MAX_LENGTH: 100,
  BIO_MAX_LENGTH: 500,
  WEBSITE_MAX_LENGTH: 200,
  
  // 密码相关
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  
  // 交易经验选项
  TRADING_EXPERIENCE_OPTIONS: [
    { value: 'beginner', label: '初学者' },
    { value: 'intermediate', label: '中级' },
    { value: 'advanced', label: '高级' },
    { value: 'expert', label: '专家' }
  ] as const,
  
  // 风险承受能力选项
  RISK_TOLERANCE_OPTIONS: [
    { value: 'low', label: '保守' },
    { value: 'medium', label: '中等' },
    { value: 'high', label: '激进' }
  ] as const,
  
  // 用户等级权限
  LEVEL_PERMISSIONS: {
    NORMAL: {
      maxStrategies: 50,
      maxBacktestPerDay: 100,
      canExportData: false,
      canShareStrategy: true,
      canAccessAdvancedFeatures: false,
      canAccessPremiumFeatures: false, // 兼容性属性
    },
    PREMIUM: {
      maxStrategies: 200,
      maxBacktestPerDay: 500,
      canExportData: true,
      canShareStrategy: true,
      canAccessAdvancedFeatures: true,
      canAccessPremiumFeatures: true, // 兼容性属性
    },
    SUPER: {
      maxStrategies: -1, // 无限制
      maxBacktestPerDay: -1, // 无限制
      canExportData: true,
      canShareStrategy: true,
      canAccessAdvancedFeatures: true,
      canAccessPremiumFeatures: true, // 兼容性属性
    },
  },
} as const;

/**
 * 策略相关常量
 */
export const STRATEGY_CONSTANTS = {
  // 字段长度限制
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 1000,
  ICON_MAX_LENGTH: 50,
  CATEGORY_MAX_LENGTH: 50,
  
  // 策略类型
  TYPES: {
    STOCK_SELECTION: 'stock_selection',
    BACKTEST: 'backtest'
  } as const,
  
  // 策略难度
  DIFFICULTIES: {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard'
  } as const,
  
  // 业务限制
  MAX_STOCKS_PER_STRATEGY: 100,
  DEFAULT_INITIAL_CAPITAL: 100000,
  MIN_INITIAL_CAPITAL: 10000,
  MAX_INITIAL_CAPITAL: 10000000,
  
  // 查询限制
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE_SIZE: 20,
  
  // 排序配置
  SORT_FIELDS: [
    'popularity',
    'likes', 
    'createdAt',
    'updatedAt',
    'rating',
    'usageCount'
  ] as const,
  
  SORT_ORDERS: ['ASC', 'DESC'] as const,
  
  DEFAULT_SORT_BY: 'popularity' as const,
  DEFAULT_SORT_ORDER: 'DESC' as const,
  
  // 排序选项配置（用于前端显示）
  SORT_OPTIONS: [
    { value: 'popularity', label: '按热度排序' },
    { value: 'likes', label: '按点赞数排序' },
    { value: 'rating', label: '按评分排序' },
    { value: 'createdAt', label: '按创建时间排序' },
    { value: 'updatedAt', label: '按更新时间排序' },
    { value: 'usageCount', label: '按使用次数排序' }
  ] as const,
} as const;

/**
 * 回测相关常量
 */
export const BACKTEST_CONSTANTS = {
  // 交易日计算
  TRADING_DAYS_PER_YEAR: 252,
  
  // 模拟参数
  MIN_TRADES_SIMULATION: 50,
  MAX_TRADES_SIMULATION: 150,
  
  // 性能指标
  SHARPE_RATIO_RISK_FREE_RATE: 0.02, // 2%无风险利率
  MAX_DRAWDOWN_THRESHOLD: 0.2, // 20%最大回撤阈值
  
  // 时间相关
  SIMULATION_DELAY_MS: 2000, // 模拟回测延迟
  
  // 百分比计算精度
  PERCENTAGE_DECIMAL_PLACES: 2,
} as const;

/**
 * 股票数据相关常量
 */
export const STOCK_CONSTANTS = {
  // 市值相关
  LARGE_CAP_THRESHOLD: 100000000000, // 1000亿市值
  MEGA_CAP_THRESHOLD: 1000000000000, // 1万亿市值
  
  // 价格相关
  MIN_STOCK_PRICE: 0.01,
  MAX_STOCK_PRICE: 10000,
  
  // 成交量相关
  MIN_DAILY_VOLUME: 1000,
  DEFAULT_VOLUME: 1000000,
  
  // 数据更新频率
  PRICE_UPDATE_INTERVAL_MS: 5000, // 5秒更新一次
  
  // 筛选限制
  MAX_SCREENING_RESULTS: 1000,
} as const;

// ==================== 技术常量 ====================

/**
 * 认证相关常量
 */
export const AUTH_CONSTANTS = {
  // JWT过期时间（秒）
  JWT_EXPIRES_IN_SECONDS: 24 * 60 * 60, // 24小时
  JWT_REFRESH_EXPIRES_IN_SECONDS: 7 * 24 * 60 * 60, // 7天
  
  // 密码加密
  BCRYPT_SALT_ROUNDS: 12,
  
  // 登录尝试限制
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_DURATION_MINUTES: 15,
} as const;

/**
 * 缓存相关常量
 */
export const CACHE_CONSTANTS = {
  // 缓存时间（秒）
  USER_CACHE_TTL: 5 * 60, // 5分钟
  STRATEGY_CACHE_TTL: 10 * 60, // 10分钟
  STOCK_DATA_CACHE_TTL: 30, // 30秒
  BACKTEST_CACHE_TTL: 60 * 60, // 1小时
  
  // 缓存键前缀
  USER_CACHE_PREFIX: 'user:',
  STRATEGY_CACHE_PREFIX: 'strategy:',
  STOCK_CACHE_PREFIX: 'stock:',
  BACKTEST_CACHE_PREFIX: 'backtest:',
} as const;

/**
 * 限流相关常量
 */
export const THROTTLE_CONSTANTS = {
  // 全局限流
  GLOBAL_TTL_SECONDS: 60,
  GLOBAL_LIMIT: 100,
  
  // API特定限流
  AUTH_TTL_SECONDS: 60,
  AUTH_LIMIT: 5,
  
  BACKTEST_TTL_SECONDS: 60,
  BACKTEST_LIMIT: 10,
  
  STOCK_DATA_TTL_SECONDS: 10,
  STOCK_DATA_LIMIT: 30,
} as const;

/**
 * 数据库相关常量
 */
export const DATABASE_CONSTANTS = {
  // 连接配置
  CONNECTION_TIMEOUT_MS: 60000, // 60秒
  QUERY_TIMEOUT_MS: 300000, // 5分钟
  
  // 批量操作
  BATCH_SIZE: 1000,
  MAX_BATCH_SIZE: 5000,
  
  // 分页
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE_SIZE: 20,
} as const;

/**
 * 文件上传相关常量
 */
export const FILE_CONSTANTS = {
  // 文件大小限制（字节）
  MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_STRATEGY_EXPORT_SIZE: 50 * 1024 * 1024, // 50MB
  
  // 支持的文件类型
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  SUPPORTED_EXPORT_TYPES: ['application/json', 'text/csv', 'application/xlsx'],
  
  // 文件路径
  UPLOAD_PATH: 'uploads/',
  AVATAR_PATH: 'uploads/avatars/',
  EXPORT_PATH: 'uploads/exports/',
} as const;

// ==================== 环境相关常量 ====================

/**
 * 开发环境常量
 */
export const DEV_CONSTANTS = {
  // 默认端口
  DEFAULT_PORT: 3001,
  DEFAULT_FRONTEND_PORT: 5174,
  
  // 本地地址
  LOCAL_HOST: 'localhost',
  LOCAL_API_URL: 'http://localhost:3001',
  LOCAL_FRONTEND_URL: 'http://localhost:5174',
  
  // 调试相关
  LOG_LEVEL: 'debug',
  ENABLE_QUERY_LOGGING: true,
} as const;

/**
 * 生产环境常量
 */
export const PROD_CONSTANTS = {
  // 性能相关
  COMPRESSION_THRESHOLD: 1024, // 1KB
  STATIC_FILE_CACHE_MAX_AGE: 31536000, // 1年
  
  // 安全相关
  HELMET_CONFIG: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  },
  
  // 日志相关
  LOG_LEVEL: 'info',
  ENABLE_QUERY_LOGGING: false,
} as const;

// ==================== 导出所有常量 ====================

export const APP_CONSTANTS = {
  USER: USER_CONSTANTS,
  STRATEGY: STRATEGY_CONSTANTS,
  BACKTEST: BACKTEST_CONSTANTS,
  STOCK: STOCK_CONSTANTS,
  AUTH: AUTH_CONSTANTS,
  CACHE: CACHE_CONSTANTS,
  THROTTLE: THROTTLE_CONSTANTS,
  DATABASE: DATABASE_CONSTANTS,
  FILE: FILE_CONSTANTS,
  DEV: DEV_CONSTANTS,
  PROD: PROD_CONSTANTS,
} as const;

// 类型定义
export type AppConstants = typeof APP_CONSTANTS;
export type UserConstants = typeof USER_CONSTANTS;
export type StrategyConstants = typeof STRATEGY_CONSTANTS;
export type BacktestConstants = typeof BACKTEST_CONSTANTS;
export type StockConstants = typeof STOCK_CONSTANTS; 