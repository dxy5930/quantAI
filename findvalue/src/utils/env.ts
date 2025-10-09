/**
 * 环境配置工具
 * 直接使用环境变量，无需额外配置文件
 */

// 获取环境变量
export const getEnvVar = (key: string, defaultValue: string = ''): string => {
  return process.env[key] || defaultValue;
};

// 获取布尔环境变量
export const getBooleanEnvVar = (key: string, defaultValue: boolean = false): boolean => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
};

// 获取数字环境变量
export const getNumberEnvVar = (key: string, defaultValue: number = 0): number => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// 环境配置
export const envConfig = {
  // 基础配置
  NODE_ENV: getEnvVar('NODE_ENV', 'production'),
  API_BASE_URL: getEnvVar('API_BASE_URL', 'https://api.findvalue.com'),
  API_TIMEOUT: getNumberEnvVar('API_TIMEOUT', 30000),
  DEBUG_MODE: getBooleanEnvVar('DEBUG_MODE', false),
  
  // 环境判断
  get isDevelopment() {
    return this.NODE_ENV === 'development';
  },
  get isTest() {
    return this.NODE_ENV === 'test';
  },
  get isStaging() {
    return this.NODE_ENV === 'staging';
  },
  get isProduction() {
    return this.NODE_ENV === 'production';
  },
};

// 日志工具
export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (envConfig.DEBUG_MODE) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    console.info(`[INFO] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
};

// 导出环境信息
export const { isDevelopment, isTest, isStaging, isProduction } = envConfig;

export default envConfig;
