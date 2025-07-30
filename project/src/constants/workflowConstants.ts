// 节点类型标签映射
export const NODE_TYPE_LABELS: Record<string, string> = {
  data: '数据节点',
  analysis: '分析节点', 
  strategy: '策略节点',
  risk: '风险节点',
  output: '输出节点',
  custom: '自定义节点'
};

// 配置字段标签映射
export const CONFIG_FIELD_LABELS: Record<string, string> = {
  strategyType: '策略类型',
  riskLevel: '风险等级',
  timeHorizon: '投资期限', 
  outputFormat: '输出格式',
  benchmarks: '基准类型',
  threshold: '阈值',
  period: '周期',
  symbols: '股票代码',
  indicators: '技术指标',
  minReturn: '最小收益率',
  maxDrawdown: '最大回撤',
  sharpeRatio: '夏普比率',
  volatility: '波动率',
  correlation: '相关性',
  beta: '贝塔系数',
  alpha: '阿尔法系数',
  // 风险评估相关字段
  riskMetrics: '风险指标',
  VaR: '风险价值',
  Sharpe: '夏普比率',
  MaxDrawdown: '最大回撤',
  backtestPeriod: '回测周期',
  // 更多常见配置字段
  dataSource: '数据源',
  dataSources: '数据源',
  timeRange: '时间范围',
  includeCharts: '包含图表',
  metrics: '指标',
  startDate: '开始日期',
  endDate: '结束日期',
  frequency: '频率',
  leverage: '杠杆倍数',
  commission: '手续费',
  slippage: '滑点',
  initialCapital: '初始资金',
  positionSize: '仓位大小',
  stopLoss: '止损',
  takeProfit: '止盈',
  riskManagement: '风险管理',
  portfolioSize: '组合规模',
  rebalanceFreq: '再平衡频率'
};

// 配置选项映射
export const CONFIG_OPTIONS: Record<string, string[]> = {
  strategyType: ['动量策略', '均值回归', '趋势跟踪', '价值投资', '成长投资'],
  riskLevel: ['低风险', '中等风险', '高风险'],
  timeHorizon: ['短期', '中期', '长期'],
  outputFormat: ['摘要', '详细报告', 'JSON格式', 'CSV格式'],
  benchmarks: ['市场基准', '行业基准', '自定义基准'],
  riskMetrics: ['VaR', 'Sharpe', 'MaxDrawdown', '波动率', '相关性'],
  backtestPeriod: ['1年', '2年', '3年', '5年', '自定义'],
  dataSource: ['历史数据', '实时数据', '模拟数据'],
  frequency: ['日频', '周频', '月频', '季频', '年频'],
  leverage: ['1倍', '2倍', '3倍', '5倍', '10倍'],
  positionSize: ['等权重', '市值加权', '风险平价', '自定义权重'],
  riskManagement: ['固定止损', '跟踪止损', '时间止损', '波动率止损'],
  rebalanceFreq: ['每日', '每周', '每月', '每季度', '每年']
};

// 节点状态标签映射
export const NODE_STATUS_LABELS: Record<string, string> = {
  idle: '空闲',
  running: '执行中',
  completed: '已完成',
  error: '执行失败'
}; 