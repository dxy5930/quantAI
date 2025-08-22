/**
 * 复盘数据库模板
 * Review Database Templates
 * 预定义的复盘表格模板，模仿飞书多维表格的模板系统
 */

import { 
  DatabaseTemplate, 
  FieldType, 
  ViewType, 
  FieldDefinition, 
  ViewDefinition,
  FieldOption 
} from './types';

// ==================== 字段选项预设 ====================

/**
 * 交易结果选项
 */
export const TRADE_RESULT_OPTIONS: FieldOption[] = [
  { id: 'profit', name: '盈利', color: '#22c55e' },
  { id: 'loss', name: '亏损', color: '#ef4444' },
  { id: 'breakeven', name: '保本', color: '#6b7280' },
  { id: 'partial', name: '部分成交', color: '#f59e0b' },
];

/**
 * 市场状态选项
 */
export const MARKET_STATUS_OPTIONS: FieldOption[] = [
  { id: 'bull', name: '牛市', color: '#22c55e' },
  { id: 'bear', name: '熊市', color: '#ef4444' },
  { id: 'sideways', name: '震荡', color: '#6b7280' },
  { id: 'volatile', name: '高波动', color: '#f59e0b' },
];

/**
 * 交易策略选项
 */
export const TRADING_STRATEGY_OPTIONS: FieldOption[] = [
  { id: 'trend_following', name: '趋势跟踪', color: '#3b82f6' },
  { id: 'mean_reversion', name: '均值回归', color: '#8b5cf6' },
  { id: 'momentum', name: '动量策略', color: '#10b981' },
  { id: 'arbitrage', name: '套利', color: '#f59e0b' },
  { id: 'scalping', name: '剥头皮', color: '#ef4444' },
  { id: 'swing', name: '波段交易', color: '#06b6d4' },
  { id: 'day_trading', name: '日内交易', color: '#84cc16' },
  { id: 'position', name: '持仓交易', color: '#a855f7' },
];

/**
 * 情绪状态选项
 */
export const EMOTION_OPTIONS: FieldOption[] = [
  { id: 'calm', name: '冷静', color: '#22c55e' },
  { id: 'confident', name: '自信', color: '#3b82f6' },
  { id: 'anxious', name: '焦虑', color: '#f59e0b' },
  { id: 'greedy', name: '贪婪', color: '#ef4444' },
  { id: 'fearful', name: '恐惧', color: '#8b5cf6' },
  { id: 'neutral', name: '中性', color: '#6b7280' },
];

/**
 * 复盘完成度选项
 */
export const COMPLETION_STATUS_OPTIONS: FieldOption[] = [
  { id: 'draft', name: '草稿', color: '#6b7280' },
  { id: 'in_progress', name: '进行中', color: '#f59e0b' },
  { id: 'review', name: '待审核', color: '#3b82f6' },
  { id: 'completed', name: '已完成', color: '#22c55e' },
  { id: 'archived', name: '已归档', color: '#8b5cf6' },
];

// ==================== 复盘模板定义 ====================

/**
 * 股票交易复盘模板
 */
export const STOCK_TRADING_TEMPLATE: DatabaseTemplate = {
  id: 'stock_trading_review',
  name: '股票交易复盘',
  description: '用于记录和分析股票交易的复盘表格，包含详细的交易数据和AI分析',
  category: '交易复盘',
  icon: '📈',
  tags: ['股票', '交易', 'AI分析'],
  
  fields: [
    {
      name: '复盘标题',
      type: FieldType.TEXT,
      isPrimary: true,
      config: { required: true, maxLength: 100 },
      order: 0,
    },
    {
      name: '交易日期',
      type: FieldType.DATE,
      config: { required: true, dateFormat: 'YYYY-MM-DD' },
      order: 1,
    },
    {
      name: '股票代码',
      type: FieldType.TEXT,
      config: { required: true, maxLength: 10 },
      order: 2,
    },
    {
      name: '股票名称',
      type: FieldType.TEXT,
      config: { required: true, maxLength: 50 },
      order: 3,
    },
    {
      name: '交易策略',
      type: FieldType.SELECT,
      config: { 
        required: true,
        options: TRADING_STRATEGY_OPTIONS,
      },
      order: 4,
    },
    {
      name: '买入价格',
      type: FieldType.CURRENCY,
      config: { 
        currency: 'CNY',
        precision: 2,
        min: 0,
      },
      order: 5,
    },
    {
      name: '卖出价格',
      type: FieldType.CURRENCY,
      config: { 
        currency: 'CNY',
        precision: 2,
        min: 0,
      },
      order: 6,
    },
    {
      name: '交易数量',
      type: FieldType.NUMBER,
      config: { 
        precision: 0,
        min: 0,
      },
      order: 7,
    },
    {
      name: '盈亏金额',
      type: FieldType.FORMULA,
      config: {
        expression: '(卖出价格 - 买入价格) * 交易数量',
      },
      order: 8,
    },
    {
      name: '盈亏率',
      type: FieldType.PERCENT,
      config: {
        precision: 2,
      },
      order: 9,
    },
    {
      name: '交易结果',
      type: FieldType.SELECT,
      config: {
        required: true,
        options: TRADE_RESULT_OPTIONS,
      },
      order: 10,
    },
    {
      name: '市场状态',
      type: FieldType.SELECT,
      config: {
        options: MARKET_STATUS_OPTIONS,
      },
      order: 11,
    },
    {
      name: '情绪状态',
      type: FieldType.MULTI_SELECT,
      config: {
        options: EMOTION_OPTIONS,
      },
      order: 12,
    },
    {
      name: '信心度',
      type: FieldType.RATING,
      config: {
        maxRating: 5,
        icon: '⭐',
      },
      order: 13,
    },
    {
      name: '复盘状态',
      type: FieldType.SELECT,
      config: {
        required: true,
        options: COMPLETION_STATUS_OPTIONS,
        defaultValue: 'draft',
      },
      order: 14,
    },
    {
      name: '经验教训',
      type: FieldType.TEXT,
      config: {
        multiline: true,
        maxLength: 2000,
      },
      order: 15,
    },
    {
      name: '改进建议',
      type: FieldType.TEXT,
      config: {
        multiline: true,
        maxLength: 2000,
      },
      order: 16,
    },
    {
      name: 'AI分析摘要',
      type: FieldType.AI_GENERATED,
      config: {
        aiPrompt: '基于交易数据和市场状况，生成这次交易的深度分析摘要',
        aiModel: 'gpt-4',
        autoUpdate: true,
      },
      order: 17,
    },
    {
      name: 'AI评分',
      type: FieldType.RATING,
      config: {
        maxRating: 10,
        icon: '🤖',
      },
      order: 18,
    },
    {
      name: '截图附件',
      type: FieldType.ATTACHMENT,
      config: {},
      order: 19,
    },
    {
      name: '创建时间',
      type: FieldType.CREATED_TIME,
      order: 20,
    },
    {
      name: '最后修改',
      type: FieldType.LAST_MODIFIED_TIME,
      order: 21,
    },
  ],
  
  views: [
    {
      name: '所有复盘',
      type: ViewType.GRID,
      isDefault: true,
      config: {
        visibleFields: [
          'title', 'tradingDate', 'stockCode', 'stockName', 
          'strategy', 'result', 'profit', 'profitRate', 'status'
        ],
        sorts: [{ fieldId: 'tradingDate', direction: 'desc' }],
      },
      order: 0,
    },
    {
      name: '盈亏看板',
      type: ViewType.KANBAN,
      config: {
        groupByField: 'result',
        cardFields: ['title', 'tradingDate', 'profit', 'profitRate'],
        sorts: [{ fieldId: 'profit', direction: 'desc' }],
      },
      order: 1,
    },
    {
      name: '交易日历',
      type: ViewType.CALENDAR,
      config: {
        dateField: 'tradingDate',
        titleField: 'title',
        colorField: 'result',
      },
      order: 2,
    },
    {
      name: '策略分析',
      type: ViewType.GRID,
      config: {
        visibleFields: [
          'strategy', 'result', 'profit', 'profitRate', 
          'confidence', 'emotion', 'aiScore'
        ],
        groups: [{ fieldId: 'strategy' }],
        sorts: [{ fieldId: 'aiScore', direction: 'desc' }],
      },
      order: 3,
    },
    {
      name: '待完成复盘',
      type: ViewType.GRID,
      config: {
        filters: [
          {
            fieldId: 'status',
            operator: 'in',
            value: ['draft', 'in_progress'],
          },
        ],
        sorts: [{ fieldId: 'tradingDate', direction: 'desc' }],
      },
      order: 4,
    },
  ],
  
  sampleData: [
    {
      data: {
        title: '2024-01-15 平安银行短线交易',
        tradingDate: '2024-01-15',
        stockCode: '000001',
        stockName: '平安银行',
        strategy: 'day_trading',
        buyPrice: 10.50,
        sellPrice: 10.80,
        quantity: 1000,
        result: 'profit',
        confidence: 4,
        emotion: ['confident'],
        status: 'completed',
        lessons: '市场开盘后快速拉升，及时止盈是关键',
        improvements: '下次可以考虑分批建仓，降低风险',
      },
    },
    {
      data: {
        title: '2024-01-16 贵州茅台波段操作',
        tradingDate: '2024-01-16',
        stockCode: '600519',
        stockName: '贵州茅台',
        strategy: 'swing',
        buyPrice: 1650.00,
        sellPrice: 1620.00,
        quantity: 100,
        result: 'loss',
        confidence: 3,
        emotion: ['anxious', 'fearful'],
        status: 'completed',
        lessons: '没有严格执行止损，情绪化交易导致亏损扩大',
        improvements: '设置明确的止损位，严格执行交易纪律',
      },
    },
  ],
};

/**
 * 期货交易复盘模板
 */
export const FUTURES_TRADING_TEMPLATE: DatabaseTemplate = {
  id: 'futures_trading_review',
  name: '期货交易复盘',
  description: '专为期货交易设计的复盘表格，包含杠杆、保证金等期货特有指标',
  category: '交易复盘',
  icon: '📊',
  tags: ['期货', '杠杆', 'AI分析'],
  
  fields: [
    {
      name: '复盘标题',
      type: FieldType.TEXT,
      isPrimary: true,
      config: { required: true },
      order: 0,
    },
    {
      name: '交易日期',
      type: FieldType.DATE,
      config: { required: true },
      order: 1,
    },
    {
      name: '合约代码',
      type: FieldType.TEXT,
      config: { required: true },
      order: 2,
    },
    {
      name: '合约名称',
      type: FieldType.TEXT,
      config: { required: true },
      order: 3,
    },
    {
      name: '方向',
      type: FieldType.SELECT,
      config: {
        required: true,
        options: [
          { id: 'long', name: '多头', color: '#22c55e' },
          { id: 'short', name: '空头', color: '#ef4444' },
        ],
      },
      order: 4,
    },
    {
      name: '开仓价格',
      type: FieldType.CURRENCY,
      order: 5,
    },
    {
      name: '平仓价格',
      type: FieldType.CURRENCY,
      order: 6,
    },
    {
      name: '交易手数',
      type: FieldType.NUMBER,
      order: 7,
    },
    {
      name: '杠杆倍数',
      type: FieldType.NUMBER,
      config: { precision: 1 },
      order: 8,
    },
    {
      name: '保证金',
      type: FieldType.CURRENCY,
      order: 9,
    },
    {
      name: '盈亏金额',
      type: FieldType.CURRENCY,
      order: 10,
    },
    {
      name: '盈亏率',
      type: FieldType.PERCENT,
      order: 11,
    },
    {
      name: '最大回撤',
      type: FieldType.PERCENT,
      order: 12,
    },
    {
      name: '持仓时间',
      type: FieldType.TEXT,
      order: 13,
    },
    {
      name: 'AI风险评估',
      type: FieldType.AI_GENERATED,
      config: {
        aiPrompt: '分析本次期货交易的风险控制情况和杠杆使用合理性',
      },
      order: 14,
    },
  ],
  
  views: [
    {
      name: '全部交易',
      type: ViewType.GRID,
      isDefault: true,
      config: {},
      order: 0,
    },
    {
      name: '多空对比',
      type: ViewType.KANBAN,
      config: {
        groupByField: 'direction',
      },
      order: 1,
    },
  ],
};

/**
 * 投资组合复盘模板
 */
export const PORTFOLIO_REVIEW_TEMPLATE: DatabaseTemplate = {
  id: 'portfolio_review',
  name: '投资组合复盘',
  description: '用于分析整体投资组合表现的复盘表格',
  category: '投资分析',
  icon: '💼',
  tags: ['组合', '分析', '风险'],
  
  fields: [
    {
      name: '复盘期间',
      type: FieldType.TEXT,
      isPrimary: true,
      order: 0,
    },
    {
      name: '开始日期',
      type: FieldType.DATE,
      order: 1,
    },
    {
      name: '结束日期',
      type: FieldType.DATE,
      order: 2,
    },
    {
      name: '组合价值',
      type: FieldType.CURRENCY,
      order: 3,
    },
    {
      name: '期间收益率',
      type: FieldType.PERCENT,
      order: 4,
    },
    {
      name: '年化收益率',
      type: FieldType.PERCENT,
      order: 5,
    },
    {
      name: '最大回撤',
      type: FieldType.PERCENT,
      order: 6,
    },
    {
      name: '夏普比率',
      type: FieldType.NUMBER,
      config: { precision: 2 },
      order: 7,
    },
    {
      name: '胜率',
      type: FieldType.PERCENT,
      order: 8,
    },
    {
      name: 'AI组合诊断',
      type: FieldType.AI_GENERATED,
      config: {
        aiPrompt: '基于组合数据分析投资组合的整体表现和优化建议',
      },
      order: 9,
    },
  ],
  
  views: [
    {
      name: '组合概览',
      type: ViewType.GRID,
      isDefault: true,
      config: {},
      order: 0,
    },
    {
      name: '收益时间线',
      type: ViewType.TIMELINE,
      config: {
        dateField: 'startDate',
      },
      order: 1,
    },
  ],
};

/**
 * 市场观察复盘模板
 */
export const MARKET_OBSERVATION_TEMPLATE: DatabaseTemplate = {
  id: 'market_observation',
  name: '市场观察复盘',
  description: '用于记录和分析市场整体走势的观察复盘',
  category: '市场分析',
  icon: '🔍',
  tags: ['市场', '趋势', '宏观'],
  
  fields: [
    {
      name: '观察日期',
      type: FieldType.DATE,
      isPrimary: true,
      order: 0,
    },
    {
      name: '主要指数表现',
      type: FieldType.TEXT,
      config: { multiline: true },
      order: 1,
    },
    {
      name: '热点板块',
      type: FieldType.MULTI_SELECT,
      config: {
        options: [
          { id: 'tech', name: '科技股', color: '#3b82f6' },
          { id: 'finance', name: '金融股', color: '#ef4444' },
          { id: 'consumer', name: '消费股', color: '#22c55e' },
          { id: 'healthcare', name: '医药股', color: '#8b5cf6' },
          { id: 'energy', name: '能源股', color: '#f59e0b' },
        ],
        allowOther: true,
      },
      order: 2,
    },
    {
      name: '市场情绪',
      type: FieldType.SELECT,
      config: {
        options: [
          { id: 'extremely_bullish', name: '极度乐观', color: '#22c55e' },
          { id: 'bullish', name: '乐观', color: '#84cc16' },
          { id: 'neutral', name: '中性', color: '#6b7280' },
          { id: 'bearish', name: '悲观', color: '#f59e0b' },
          { id: 'extremely_bearish', name: '极度悲观', color: '#ef4444' },
        ],
      },
      order: 3,
    },
    {
      name: '重要新闻事件',
      type: FieldType.TEXT,
      config: { multiline: true },
      order: 4,
    },
    {
      name: 'AI市场解读',
      type: FieldType.AI_GENERATED,
      config: {
        aiPrompt: '综合市场数据和新闻事件，分析当前市场状况和未来趋势',
      },
      order: 5,
    },
  ],
  
  views: [
    {
      name: '市场日历',
      type: ViewType.CALENDAR,
      isDefault: true,
      config: {
        dateField: 'observationDate',
        colorField: 'marketSentiment',
      },
      order: 0,
    },
    {
      name: '情绪趋势',
      type: ViewType.GRID,
      config: {
        sorts: [{ fieldId: 'observationDate', direction: 'desc' }],
      },
      order: 1,
    },
  ],
};

// ==================== 模板导出 ====================

/**
 * 所有复盘模板
 */
export const REVIEW_TEMPLATES: DatabaseTemplate[] = [
  STOCK_TRADING_TEMPLATE,
  FUTURES_TRADING_TEMPLATE,
  PORTFOLIO_REVIEW_TEMPLATE,
  MARKET_OBSERVATION_TEMPLATE,
];

/**
 * 根据ID获取模板
 */
export function getTemplateById(id: string): DatabaseTemplate | undefined {
  return REVIEW_TEMPLATES.find(template => template.id === id);
}

/**
 * 根据分类获取模板
 */
export function getTemplatesByCategory(category: string): DatabaseTemplate[] {
  return REVIEW_TEMPLATES.filter(template => template.category === category);
}

/**
 * 获取所有模板分类
 */
export function getTemplateCategories(): string[] {
  return [...new Set(REVIEW_TEMPLATES.map(template => template.category))];
}