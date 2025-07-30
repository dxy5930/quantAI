/**
 * 股票分析内容精简显示工具
 */

interface AnalysisObject {
  technical?: string;
  fundamental?: string;
  summary?: string;
  [key: string]: any;
}

/**
 * 精简分析内容，限制显示长度
 * @param analysis - 原始分析内容
 * @param maxLength - 最大显示长度，默认5000字符
 * @returns 精简后的分析文本
 */
export function formatAnalysisText(analysis: string | AnalysisObject | null | undefined, maxLength: number = 5000): string {
  if (!analysis) {
    return '暂无详细分析内容';
  }

  let analysisText = '';

  if (typeof analysis === 'object') {
    // 如果是对象，提取关键信息组成简洁描述
    const summary = [];
    
    if (analysis.technical) {
      summary.push(`技术面：${String(analysis.technical).substring(0, 50)}`);
    }
    if (analysis.fundamental) {
      summary.push(`基本面：${String(analysis.fundamental).substring(0, 50)}`);
    }
    if (analysis.summary) {
      summary.push(String(analysis.summary).substring(0, 100));
    }
    
    // 如果没有提取到有效信息，使用默认描述
    if (summary.length === 0) {
      // 尝试提取其他字段
      const keys = Object.keys(analysis);
      for (const key of keys) {
        if (analysis[key] && typeof analysis[key] === 'string') {
          summary.push(`${key}：${String(analysis[key]).substring(0, 60)}`);
          if (summary.length >= 2) break; // 最多提取2个字段
        }
      }
    }
    
    analysisText = summary.length > 0 
      ? summary.join('；') 
      : '综合分析显示该股票具有一定投资价值，建议关注技术面和基本面指标变化';
  } else if (typeof analysis === 'string') {
    // 如果是字符串，直接使用
    analysisText = analysis;
  } else {
    analysisText = '暂无详细分析内容';
  }

  // 限制最大长度
  if (analysisText.length > maxLength) {
    return analysisText.substring(0, maxLength) + '...';
  }

  return analysisText;
}

/**
 * 精简文本数组，限制显示数量和长度
 * @param items - 文本数组
 * @param maxCount - 最大显示数量
 * @param maxItemLength - 单个项目最大长度
 * @returns 精简后的数组和剩余数量
 */
export function formatTextArray(items: string[], maxCount: number = 3, maxItemLength: number = 80): {
  displayItems: string[];
  remainingCount: number;
} {
  if (!Array.isArray(items)) {
    return { displayItems: [], remainingCount: 0 };
  }

  const displayItems = items.slice(0, maxCount).map(item => {
    const text = String(item);
    return text.length > maxItemLength ? text.substring(0, maxItemLength) + '...' : text;
  });

  const remainingCount = Math.max(0, items.length - maxCount);

  return { displayItems, remainingCount };
} 