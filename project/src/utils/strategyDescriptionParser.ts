// 策略描述智能解析器
export interface StrategyCondition {
  type: 'technical_indicator' | 'price_condition' | 'volume_condition' | 'fundamental' | 'market_condition';
  indicator?: string;
  operator?: 'greater_than' | 'less_than' | 'between' | 'crossover' | 'crossunder' | 'equal';
  value?: number | string;
  period?: number;
  description: string;
  confidence: number; // 0-1 置信度
}

export interface ParsedStrategy {
  structuredConditions: any[]; // 结构化条件数组，与前端组件保持一致
  conditions: StrategyCondition[];
  strategyType: 'trend_following' | 'mean_reversion' | 'momentum' | 'value' | 'growth' | 'mixed';
  riskLevel: 'low' | 'medium' | 'high';
  timeframe: 'short_term' | 'medium_term' | 'long_term';
  sectors: string[];
}

// 技术指标关键词映射
const TECHNICAL_INDICATORS = {
  'rsi': { name: 'RSI', type: 'momentum', typical_period: 14 },
  'macd': { name: 'MACD', type: 'momentum', typical_period: 26 },
  'ma': { name: '移动平均', type: 'trend', typical_period: 20 },
  'sma': { name: '简单移动平均', type: 'trend', typical_period: 20 },
  'ema': { name: '指数移动平均', type: 'trend', typical_period: 20 },
  'kdj': { name: 'KDJ', type: 'momentum', typical_period: 9 },
  'boll': { name: '布林带', type: 'volatility', typical_period: 20 },
  'bollinger': { name: '布林带', type: 'volatility', typical_period: 20 },
  'atr': { name: 'ATR', type: 'volatility', typical_period: 14 },
  'volume': { name: '成交量', type: 'volume', typical_period: 20 },
  'pe': { name: '市盈率', type: 'fundamental', typical_period: 0 },
  'pb': { name: '市净率', type: 'fundamental', typical_period: 0 },
  'roe': { name: '净资产收益率', type: 'fundamental', typical_period: 0 },
};

// 价格条件关键词
const PRICE_CONDITIONS = {
  '突破': 'breakout',
  '跌破': 'breakdown',
  '上穿': 'crossover',
  '下穿': 'crossunder',
  '金叉': 'golden_cross',
  '死叉': 'death_cross',
  '超买': 'overbought',
  '超卖': 'oversold',
  '反弹': 'bounce',
  '回调': 'pullback',
};

// 行业/板块关键词
const SECTORS = {
  '科技': 'technology',
  '金融': 'finance',
  '医药': 'healthcare',
  '消费': 'consumer',
  '制造': 'manufacturing',
  '能源': 'energy',
  '房地产': 'real_estate',
  '电信': 'telecom',
  '公用事业': 'utilities',
  '材料': 'materials',
};

// 时间框架关键词
const TIMEFRAMES = {
  '短期': 'short_term',
  '中期': 'medium_term',
  '长期': 'long_term',
  '日内': 'intraday',
  '周': 'weekly',
  '月': 'monthly',
};

export class StrategyDescriptionParser {
  
  /**
   * 解析策略描述
   */
  static parseDescription(description: string): ParsedStrategy {
    const conditions: StrategyCondition[] = [];
    const lowerDesc = description.toLowerCase();
    
    // 提取技术指标条件
    conditions.push(...this.extractTechnicalIndicators(description));
    
    // 提取价格条件
    conditions.push(...this.extractPriceConditions(description));
    
    // 提取成交量条件
    conditions.push(...this.extractVolumeConditions(description));
    
    // 提取基本面条件
    conditions.push(...this.extractFundamentalConditions(description));
    
    // 推断策略类型
    const strategyType = this.inferStrategyType(description, conditions);
    
    // 推断风险等级
    const riskLevel = this.inferRiskLevel(description, conditions);
    
    // 推断时间框架
    const timeframe = this.inferTimeframe(description);
    
    // 提取行业偏好
    const sectors = this.extractSectors(description);
    
    return {
      conditions,
      strategyType,
      riskLevel,
      timeframe,
      sectors,
      structuredConditions: [], // 添加缺少的属性，本地解析器暂不支持结构化条件
    };
  }
  
  /**
   * 提取技术指标条件
   */
  private static extractTechnicalIndicators(description: string): StrategyCondition[] {
    const conditions: StrategyCondition[] = [];
    const lowerDesc = description.toLowerCase();
    
    // RSI 相关
    if (lowerDesc.includes('rsi')) {
      const rsiMatch = lowerDesc.match(/rsi.*?(\d+)/);
      const period = rsiMatch ? parseInt(rsiMatch[1]) : 14;
      
      if (lowerDesc.includes('超买') || lowerDesc.includes('overbought')) {
        conditions.push({
          type: 'technical_indicator',
          indicator: 'RSI',
          operator: 'greater_than',
          value: 70,
          period,
          description: `RSI(${period}) > 70 (超买区域)`,
          confidence: 0.8,
        });
      }
      
      if (lowerDesc.includes('超卖') || lowerDesc.includes('oversold')) {
        conditions.push({
          type: 'technical_indicator',
          indicator: 'RSI',
          operator: 'less_than',
          value: 30,
          period,
          description: `RSI(${period}) < 30 (超卖区域)`,
          confidence: 0.8,
        });
      }
    }
    
    // MACD 相关
    if (lowerDesc.includes('macd')) {
      if (lowerDesc.includes('金叉') || lowerDesc.includes('上穿')) {
        conditions.push({
          type: 'technical_indicator',
          indicator: 'MACD',
          operator: 'crossover',
          description: 'MACD金叉信号',
          confidence: 0.7,
        });
      }
      
      if (lowerDesc.includes('死叉') || lowerDesc.includes('下穿')) {
        conditions.push({
          type: 'technical_indicator',
          indicator: 'MACD',
          operator: 'crossunder',
          description: 'MACD死叉信号',
          confidence: 0.7,
        });
      }
    }
    
    // 移动平均线相关
    if (lowerDesc.includes('均线') || lowerDesc.includes('ma') || lowerDesc.includes('移动平均')) {
      const maMatch = lowerDesc.match(/(\d+).*?均线|ma.*?(\d+)/);
      const period = maMatch ? parseInt(maMatch[1] || maMatch[2]) : 20;
      
      if (lowerDesc.includes('突破') || lowerDesc.includes('上穿')) {
        conditions.push({
          type: 'technical_indicator',
          indicator: 'MA',
          operator: 'crossover',
          period,
          description: `价格突破${period}日均线`,
          confidence: 0.6,
        });
      }
      
      if (lowerDesc.includes('跌破') || lowerDesc.includes('下穿')) {
        conditions.push({
          type: 'technical_indicator',
          indicator: 'MA',
          operator: 'crossunder',
          period,
          description: `价格跌破${period}日均线`,
          confidence: 0.6,
        });
      }
    }
    
    // 布林带相关
    if (lowerDesc.includes('布林') || lowerDesc.includes('boll')) {
      if (lowerDesc.includes('上轨') || lowerDesc.includes('突破')) {
        conditions.push({
          type: 'technical_indicator',
          indicator: 'BOLL',
          operator: 'greater_than',
          description: '价格突破布林带上轨',
          confidence: 0.6,
        });
      }
      
      if (lowerDesc.includes('下轨') || lowerDesc.includes('跌破')) {
        conditions.push({
          type: 'technical_indicator',
          indicator: 'BOLL',
          operator: 'less_than',
          description: '价格跌破布林带下轨',
          confidence: 0.6,
        });
      }
    }
    
    return conditions;
  }
  
  /**
   * 提取价格条件
   */
  private static extractPriceConditions(description: string): StrategyCondition[] {
    const conditions: StrategyCondition[] = [];
    const lowerDesc = description.toLowerCase();
    
    // 价格区间
    const priceRangeMatch = lowerDesc.match(/(\d+).*?元.*?(\d+).*?元/);
    if (priceRangeMatch) {
      const min = parseInt(priceRangeMatch[1]);
      const max = parseInt(priceRangeMatch[2]);
      conditions.push({
        type: 'price_condition',
        operator: 'between',
        value: `${min}-${max}`,
        description: `价格区间: ${min}-${max}元`,
        confidence: 0.9,
      });
    }
    
    // 涨跌幅条件
    const changeMatch = lowerDesc.match(/涨幅.*?(\d+)%|跌幅.*?(\d+)%/);
    if (changeMatch) {
      const percent = parseInt(changeMatch[1] || changeMatch[2]);
      const isRise = lowerDesc.includes('涨幅');
      conditions.push({
        type: 'price_condition',
        operator: isRise ? 'greater_than' : 'less_than',
        value: percent,
        description: `${isRise ? '涨幅' : '跌幅'}超过${percent}%`,
        confidence: 0.8,
      });
    }
    
    return conditions;
  }
  
  /**
   * 提取成交量条件
   */
  private static extractVolumeConditions(description: string): StrategyCondition[] {
    const conditions: StrategyCondition[] = [];
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('放量') || lowerDesc.includes('成交量放大')) {
      conditions.push({
        type: 'volume_condition',
        operator: 'greater_than',
        description: '成交量放大',
        confidence: 0.7,
      });
    }
    
    if (lowerDesc.includes('缩量') || lowerDesc.includes('成交量萎缩')) {
      conditions.push({
        type: 'volume_condition',
        operator: 'less_than',
        description: '成交量萎缩',
        confidence: 0.7,
      });
    }
    
    return conditions;
  }
  
  /**
   * 提取基本面条件
   */
  private static extractFundamentalConditions(description: string): StrategyCondition[] {
    const conditions: StrategyCondition[] = [];
    const lowerDesc = description.toLowerCase();
    
    // 市盈率
    const peMatch = lowerDesc.match(/市盈率.*?(\d+)/);
    if (peMatch) {
      const pe = parseInt(peMatch[1]);
      conditions.push({
        type: 'fundamental',
        indicator: 'PE',
        operator: 'less_than',
        value: pe,
        description: `市盈率 < ${pe}`,
        confidence: 0.8,
      });
    }
    
    // 市净率
    const pbMatch = lowerDesc.match(/市净率.*?(\d+)/);
    if (pbMatch) {
      const pb = parseInt(pbMatch[1]);
      conditions.push({
        type: 'fundamental',
        indicator: 'PB',
        operator: 'less_than',
        value: pb,
        description: `市净率 < ${pb}`,
        confidence: 0.8,
      });
    }
    
    // 净资产收益率
    if (lowerDesc.includes('roe') || lowerDesc.includes('净资产收益率')) {
      const roeMatch = lowerDesc.match(/roe.*?(\d+)|净资产收益率.*?(\d+)/);
      if (roeMatch) {
        const roe = parseInt(roeMatch[1] || roeMatch[2]);
        conditions.push({
          type: 'fundamental',
          indicator: 'ROE',
          operator: 'greater_than',
          value: roe,
          description: `ROE > ${roe}%`,
          confidence: 0.8,
        });
      }
    }
    
    return conditions;
  }
  
  /**
   * 推断策略类型
   */
  private static inferStrategyType(description: string, conditions: StrategyCondition[]): ParsedStrategy['strategyType'] {
    const lowerDesc = description.toLowerCase();
    
    // 趋势跟踪
    if (lowerDesc.includes('趋势') || lowerDesc.includes('突破') || lowerDesc.includes('均线')) {
      return 'trend_following';
    }
    
    // 均值回归
    if (lowerDesc.includes('反转') || lowerDesc.includes('超买') || lowerDesc.includes('超卖') || lowerDesc.includes('布林')) {
      return 'mean_reversion';
    }
    
    // 动量策略
    if (lowerDesc.includes('动量') || lowerDesc.includes('强势') || lowerDesc.includes('涨幅')) {
      return 'momentum';
    }
    
    // 价值投资
    if (lowerDesc.includes('价值') || lowerDesc.includes('市盈率') || lowerDesc.includes('市净率')) {
      return 'value';
    }
    
    // 成长投资
    if (lowerDesc.includes('成长') || lowerDesc.includes('增长') || lowerDesc.includes('roe')) {
      return 'growth';
    }
    
    return 'mixed';
  }
  
  /**
   * 推断风险等级
   */
  private static inferRiskLevel(description: string, conditions: StrategyCondition[]): ParsedStrategy['riskLevel'] {
    const lowerDesc = description.toLowerCase();
    
    // 高风险指标
    if (lowerDesc.includes('突破') || lowerDesc.includes('动量') || lowerDesc.includes('短期')) {
      return 'high';
    }
    
    // 低风险指标
    if (lowerDesc.includes('价值') || lowerDesc.includes('稳健') || lowerDesc.includes('长期')) {
      return 'low';
    }
    
    return 'medium';
  }
  
  /**
   * 推断时间框架
   */
  private static inferTimeframe(description: string): ParsedStrategy['timeframe'] {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('短期') || lowerDesc.includes('日内') || lowerDesc.includes('快速')) {
      return 'short_term';
    }
    
    if (lowerDesc.includes('长期') || lowerDesc.includes('价值') || lowerDesc.includes('基本面')) {
      return 'long_term';
    }
    
    return 'medium_term';
  }
  
  /**
   * 提取行业偏好
   */
  private static extractSectors(description: string): string[] {
    const sectors: string[] = [];
    const lowerDesc = description.toLowerCase();
    
    Object.entries(SECTORS).forEach(([chinese, english]) => {
      if (lowerDesc.includes(chinese)) {
        sectors.push(chinese);
      }
    });
    
    return sectors;
  }
  
  /**
   * 生成策略条件的自然语言描述
   */
  static generateConditionDescription(conditions: StrategyCondition[]): string {
    if (conditions.length === 0) return '未识别到具体条件';
    
    const descriptions = conditions
      .filter(c => c.confidence > 0.5)
      .sort((a, b) => b.confidence - a.confidence)
      .map(c => c.description);
    
    return descriptions.join(' 且 ');
  }
} 