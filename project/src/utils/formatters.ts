/**
 * 安全地将值转换为字符串
 * @param value 要转换的值
 * @param defaultValue 默认值（当value为null/undefined时）
 * @returns 字符串结果
 */
export function safeToString(value: any, defaultValue: string = '0'): string {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  return String(value);
}

/**
 * 安全地调用toFixed方法
 * @param value 数字值
 * @param digits 小数位数
 * @param defaultValue 默认值
 * @returns 格式化后的字符串
 */
export function safeToFixed(value: number | null | undefined, digits: number = 2, defaultValue: string = '-'): string {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return defaultValue;
  }
  return numValue.toFixed(digits);
}

/**
 * 安全地格式化百分比
 * @param value 数值（0-1之间）
 * @param digits 小数位数
 * @param defaultValue 默认值
 * @returns 格式化后的百分比字符串
 */
export function safeToPercent(value: number | null | undefined, digits: number = 2, defaultValue: string = '-'): string {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return defaultValue;
  }
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return defaultValue;
  }
  return `${(numValue * 100).toFixed(digits)}%`;
}

/**
 * 安全地格式化已经是百分比值的数据
 * @param value 百分比数值（如 50 表示 50%）
 * @param digits 小数位数
 * @param defaultValue 默认值
 * @returns 格式化后的百分比字符串
 */
export function safePercentValue(value: number | null | undefined, digits: number = 2, defaultValue: string = '-'): string {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return defaultValue;
  }
  return `${numValue.toFixed(digits)}%`;
}

/**
 * 安全地格式化货币
 * @param value 数值
 * @param defaultValue 默认值
 * @returns 格式化后的货币字符串
 */
export function safeToCurrency(value: number | null | undefined, defaultValue: string = '0'): string {
  if (value === null || value === undefined || isNaN(value)) {
    return defaultValue;
  }
  return `${value.toLocaleString()}`;
}

/**
 * 安全地格式化市值
 * @param marketCap 市值
 * @param defaultValue 默认值
 * @returns 格式化后的市值字符串
 */
export function safeFormatMarketCap(marketCap: number | null | undefined, defaultValue: string = '未知'): string {
  if (!marketCap || marketCap === 0) {
    return defaultValue;
  }
  if (marketCap >= 1000000000000) {
    return `${(marketCap / 1000000000000).toFixed(1)}万亿`;
  } else if (marketCap >= 1000000000) {
    return `${(marketCap / 1000000000).toFixed(0)}亿`;
  } else if (marketCap >= 1000000) {
    return `${(marketCap / 1000000).toFixed(0)}百万`;
  }
  return marketCap.toString();
}

/**
 * 安全地格式化数量（K, M格式）
 * @param value 数值
 * @param defaultValue 默认值
 * @returns 格式化后的数量字符串
 */
export function safeFormatVolume(value: number | null | undefined, defaultValue: string = '0'): string {
  if (!value || value === 0) {
    return defaultValue;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * 安全地获取对象属性值
 * @param obj 对象
 * @param path 属性路径（如 'user.profile.name'）
 * @param defaultValue 默认值
 * @returns 属性值或默认值
 */
export function safeGet(obj: any, path: string, defaultValue: any = undefined): any {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result !== undefined ? result : defaultValue;
}

/**
 * 检查值是否为有效数字
 * @param value 要检查的值
 * @returns 是否为有效数字
 */
export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
} 