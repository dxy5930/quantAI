import { Strategy, SharedStrategy } from '../types';

export const strategies: Strategy[] = [
  {
    id: 'ma-crossover',
    name: '移动平均交叉',
    description: '当短期移动平均线上穿长期移动平均线时买入，下穿时卖出',
    icon: 'TrendingUp',
    category: '趋势跟踪',
    strategyType: 'backtest',
    difficulty: 'easy',
    popularity: 95,
    parameters: [
      {
        key: 'shortPeriod',
        label: '短期周期',
        type: 'number',
        default: 10,
        min: 5,
        max: 50,
        step: 1
      },
      {
        key: 'longPeriod',
        label: '长期周期',
        type: 'number',
        default: 30,
        min: 20,
        max: 100,
        step: 1
      },
      {
        key: 'maType',
        label: '平均线类型',
        type: 'select',
        default: 'SMA',
        options: [
          { label: '简单移动平均(SMA)', value: 'SMA' },
          { label: '指数移动平均(EMA)', value: 'EMA' }
        ]
      }
    ],
    backtestResults: {
      totalReturn: 0.245,
      annualReturn: 0.187,
      sharpeRatio: 1.85,
      maxDrawdown: 0.08,
      winRate: 0.65,
      totalTrades: 156,
      avgTradeReturn: 0.0157,
      profitFactor: 2.34,
      calmarRatio: 2.34,
      backtestType: 'single',
      equity: [
        { date: '2023-01-01', value: 100000 },
        { date: '2023-02-01', value: 103500 },
        { date: '2023-03-01', value: 107200 },
        { date: '2023-04-01', value: 105800 },
        { date: '2023-05-01', value: 112400 },
        { date: '2023-06-01', value: 118900 },
        { date: '2023-07-01', value: 115600 },
        { date: '2023-08-01', value: 122300 },
        { date: '2023-09-01', value: 119700 },
        { date: '2023-10-01', value: 126800 },
        { date: '2023-11-01', value: 131200 },
        { date: '2023-12-01', value: 124500 }
      ],
      trades: [
        { date: '2023-01-15', type: 'buy', price: 150.25, quantity: 100, profit: 0 },
        { date: '2023-02-03', type: 'sell', price: 158.40, quantity: 100, profit: 815 },
        { date: '2023-02-28', type: 'buy', price: 162.10, quantity: 100, profit: 0 },
        { date: '2023-03-15', type: 'sell', price: 168.75, quantity: 100, profit: 665 },
        { date: '2023-04-12', type: 'buy', price: 171.30, quantity: 100, profit: 0 },
        { date: '2023-04-28', type: 'sell', price: 169.85, quantity: 100, profit: -145 }
      ]
    },
    backtestPeriod: {
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      symbol: 'SPY',
      initialCapital: 100000,
      backtestType: 'single'
    },
    lastBacktestDate: '2024-02-15T09:00:00Z'
  },
  {
    id: 'rsi-oversold',
    name: 'RSI超卖反弹',
    description: '当RSI低于超卖线时买入，高于超买线时卖出',
    icon: 'Activity',
    category: '技术指标',
    strategyType: 'stock_selection',
    difficulty: 'easy',
    popularity: 88,
    parameters: [
      {
        key: 'period',
        label: 'RSI周期',
        type: 'number',
        default: 14,
        min: 10,
        max: 30,
        step: 1
      },
      {
        key: 'oversold',
        label: '超卖线',
        type: 'number',
        default: 30,
        min: 20,
        max: 35,
        step: 1
      },
      {
        key: 'overbought',
        label: '超买线',
        type: 'number',
        default: 70,
        min: 65,
        max: 80,
        step: 1
      }
    ],
    stockRecommendations: [
      {
        symbol: 'AAPL',
        name: '苹果公司',
        score: 85,
        reason: 'RSI为28，处于超卖状态，技术面反弹信号强烈',
        targetPrice: 185.50,
        riskLevel: 'medium',
        sector: '科技',
        marketCap: 2800000000000,
        updatedAt: '2024-02-15T10:30:00Z'
      },
      {
        symbol: 'MSFT',
        name: '微软公司',
        score: 78,
        reason: 'RSI为25，严重超卖，基本面良好支撑反弹',
        targetPrice: 420.00,
        riskLevel: 'low',
        sector: '科技',
        marketCap: 3100000000000,
        updatedAt: '2024-02-15T10:30:00Z'
      },
      {
        symbol: 'GOOGL',
        name: '谷歌A类',
        score: 72,
        reason: 'RSI为29，接近超卖，盈利能力稳定',
        targetPrice: 145.00,
        riskLevel: 'medium',
        sector: '科技',
        marketCap: 1800000000000,
        updatedAt: '2024-02-15T10:30:00Z'
      }
    ],
    selectionCriteria: {
      minMarketCap: 100000000000,
      sectors: ['科技', '消费'],
      minScore: 70,
      maxRisk: 'medium'
    },
    lastScreeningDate: '2024-02-15T10:30:00Z',
    totalStocksScreened: 500,
    recommendedStocksCount: 3
  },
  {
    id: 'bollinger-bands',
    name: '布林带策略',
    description: '价格触及下轨时买入，触及上轨时卖出',
    icon: 'BarChart3',
    category: '均值回归',
    strategyType: 'backtest',
    difficulty: 'medium',
    popularity: 76,
    parameters: [
      {
        key: 'period',
        label: '计算周期',
        type: 'number',
        default: 20,
        min: 10,
        max: 50,
        step: 1
      },
      {
        key: 'stdDev',
        label: '标准差倍数',
        type: 'number',
        default: 2,
        min: 1,
        max: 3,
        step: 0.1
      }
    ],
    backtestResults: {
      totalReturn: 0.198,
      annualReturn: 0.152,
      sharpeRatio: 1.67,
      maxDrawdown: 0.12,
      winRate: 0.58,
      totalTrades: 89,
      avgTradeReturn: 0.0223,
      profitFactor: 1.89,
      calmarRatio: 1.27,
      backtestType: 'single',
      equity: [
        { date: '2023-01-01', value: 100000 },
        { date: '2023-02-01', value: 101800 },
        { date: '2023-03-01', value: 105600 },
        { date: '2023-04-01', value: 103200 },
        { date: '2023-05-01', value: 108900 },
        { date: '2023-06-01', value: 112400 },
        { date: '2023-07-01', value: 109800 },
        { date: '2023-08-01', value: 115200 },
        { date: '2023-09-01', value: 113600 },
        { date: '2023-10-01', value: 117900 },
        { date: '2023-11-01', value: 119800 },
        { date: '2023-12-01', value: 119800 }
      ],
      trades: [
        { date: '2023-01-20', type: 'buy', price: 145.80, quantity: 100, profit: 0 },
        { date: '2023-02-08', type: 'sell', price: 152.30, quantity: 100, profit: 650 },
        { date: '2023-03-05', type: 'buy', price: 149.20, quantity: 100, profit: 0 },
        { date: '2023-03-22', type: 'sell', price: 156.90, quantity: 100, profit: 770 }
      ]
    },
    backtestPeriod: {
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      symbol: 'QQQ',
      initialCapital: 100000,
      backtestType: 'single'
    },
    lastBacktestDate: '2024-02-15T09:30:00Z'
  },
  {
    id: 'macd-signal',
    name: 'MACD信号',
    description: 'MACD线上穿信号线时买入，下穿时卖出',
    icon: 'LineChart',
    category: '技术指标',
    strategyType: 'stock_selection',
    difficulty: 'medium',
    popularity: 82,
    parameters: [
      {
        key: 'fastPeriod',
        label: '快线周期',
        type: 'number',
        default: 12,
        min: 8,
        max: 20,
        step: 1
      },
      {
        key: 'slowPeriod',
        label: '慢线周期',
        type: 'number',
        default: 26,
        min: 20,
        max: 35,
        step: 1
      },
      {
        key: 'signalPeriod',
        label: '信号线周期',
        type: 'number',
        default: 9,
        min: 5,
        max: 15,
        step: 1
      }
    ],
    stockRecommendations: [
      {
        symbol: 'TSLA',
        name: '特斯拉',
        score: 92,
        reason: 'MACD金叉形成，成交量放大，突破信号明确',
        targetPrice: 220.00,
        riskLevel: 'high',
        sector: '汽车',
        marketCap: 700000000000,
        updatedAt: '2024-02-15T11:00:00Z'
      },
      {
        symbol: 'NVDA',
        name: '英伟达',
        score: 88,
        reason: 'MACD线上穿信号线，AI概念持续强势',
        targetPrice: 800.00,
        riskLevel: 'high',
        sector: '半导体',
        marketCap: 1800000000000,
        updatedAt: '2024-02-15T11:00:00Z'
      },
      {
        symbol: 'AMD',
        name: '超微半导体',
        score: 81,
        reason: 'MACD背离修复，技术面转强',
        targetPrice: 160.00,
        riskLevel: 'medium',
        sector: '半导体',
        marketCap: 250000000000,
        updatedAt: '2024-02-15T11:00:00Z'
      }
    ],
    selectionCriteria: {
      minMarketCap: 50000000000,
      sectors: ['科技', '半导体', '汽车'],
      minScore: 75,
      maxRisk: 'high'
    },
    lastScreeningDate: '2024-02-15T11:00:00Z',
    totalStocksScreened: 800,
    recommendedStocksCount: 3
  },
  {
    id: 'grid-trading',
    name: '网格交易',
    description: '在价格区间内设置多个买卖点，低买高卖',
    icon: 'Grid3x3',
    category: '套利策略',
    strategyType: 'backtest',
    difficulty: 'hard',
    popularity: 65,
    parameters: [
      {
        key: 'gridSize',
        label: '网格大小(%)',
        type: 'number',
        default: 2,
        min: 0.5,
        max: 5,
        step: 0.1
      },
      {
        key: 'gridLevels',
        label: '网格层数',
        type: 'number',
        default: 10,
        min: 5,
        max: 20,
        step: 1
      },
      {
        key: 'basePrice',
        label: '基准价格',
        type: 'number',
        default: 100,
        min: 1,
        max: 1000,
        step: 1
      }
    ],
    backtestResults: {
      totalReturn: 0.156,
      annualReturn: 0.128,
      sharpeRatio: 1.42,
      maxDrawdown: 0.06,
      winRate: 0.78,
      totalTrades: 245,
      avgTradeReturn: 0.0064,
      profitFactor: 1.67,
      calmarRatio: 2.13,
      backtestType: 'single',
      equity: [
        { date: '2023-01-01', value: 100000 },
        { date: '2023-02-01', value: 101200 },
        { date: '2023-03-01', value: 103800 },
        { date: '2023-04-01', value: 105600 },
        { date: '2023-05-01', value: 107200 },
        { date: '2023-06-01', value: 109800 },
        { date: '2023-07-01', value: 108400 },
        { date: '2023-08-01', value: 111600 },
        { date: '2023-09-01', value: 113200 },
        { date: '2023-10-01', value: 114800 },
        { date: '2023-11-01', value: 116400 },
        { date: '2023-12-01', value: 115600 }
      ],
      trades: [
        { date: '2023-01-05', type: 'buy', price: 98.50, quantity: 100, profit: 0 },
        { date: '2023-01-08', type: 'sell', price: 100.50, quantity: 100, profit: 200 },
        { date: '2023-01-12', type: 'buy', price: 98.00, quantity: 100, profit: 0 },
        { date: '2023-01-15', type: 'sell', price: 100.00, quantity: 100, profit: 200 },
        { date: '2023-01-18', type: 'buy', price: 97.50, quantity: 100, profit: 0 },
        { date: '2023-01-22', type: 'sell', price: 99.50, quantity: 100, profit: 200 },
        { date: '2023-01-25', type: 'buy', price: 97.00, quantity: 100, profit: 0 },
        { date: '2023-01-28', type: 'sell', price: 99.00, quantity: 100, profit: 200 }
      ]
    },
    backtestPeriod: {
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      symbol: 'ETH-USDT',
      initialCapital: 100000,
      backtestType: 'single'
    },
    lastBacktestDate: '2024-02-15T10:00:00Z'
  },
  {
    id: 'momentum',
    name: '动量策略',
    description: '基于价格动量进行交易，追涨杀跌',
    icon: 'Zap',
    category: '趋势跟踪',
    strategyType: 'stock_selection',
    difficulty: 'medium',
    popularity: 71,
    parameters: [
      {
        key: 'lookback',
        label: '动量周期',
        type: 'number',
        default: 20,
        min: 10,
        max: 50,
        step: 1
      },
      {
        key: 'threshold',
        label: '触发阈值(%)',
        type: 'number',
        default: 5,
        min: 1,
        max: 10,
        step: 0.5
      }
    ],
    stockRecommendations: [
      {
        symbol: 'META',
        name: 'Meta平台',
        score: 89,
        reason: '20日动量指标达到8.5%，社交媒体业务复苏强劲',
        targetPrice: 380.00,
        riskLevel: 'medium',
        sector: '科技',
        marketCap: 950000000000,
        updatedAt: '2024-02-15T11:30:00Z'
      },
      {
        symbol: 'NFLX',
        name: '奈飞',
        score: 84,
        reason: '动量突破6.2%，订阅用户增长超预期',
        targetPrice: 520.00,
        riskLevel: 'medium',
        sector: '媒体',
        marketCap: 230000000000,
        updatedAt: '2024-02-15T11:30:00Z'
      },
      {
        symbol: 'CRM',
        name: 'Salesforce',
        score: 79,
        reason: '动量指标5.8%，云服务需求持续增长',
        targetPrice: 280.00,
        riskLevel: 'low',
        sector: '软件',
        marketCap: 270000000000,
        updatedAt: '2024-02-15T11:30:00Z'
      }
    ],
    selectionCriteria: {
      minMarketCap: 100000000000,
      sectors: ['科技', '媒体', '软件'],
      minScore: 75,
      maxRisk: 'medium'
    },
    lastScreeningDate: '2024-02-15T11:30:00Z',
    totalStocksScreened: 600,
    recommendedStocksCount: 3
  },
  {
    id: 'tech-portfolio',
    name: '科技股组合策略',
    description: '基于技术指标的科技股组合投资策略，采用等权重配置',
    icon: 'Layers',
    category: '组合投资',
    strategyType: 'backtest',
    difficulty: 'medium',
    popularity: 89,
    parameters: [
      {
        key: 'rebalanceFrequency',
        label: '再平衡频率',
        type: 'select',
        default: 'monthly',
        options: [
          { label: '每日', value: 'daily' },
          { label: '每周', value: 'weekly' },
          { label: '每月', value: 'monthly' },
          { label: '每季度', value: 'quarterly' }
        ]
      },
      {
        key: 'riskLevel',
        label: '风险等级',
        type: 'select',
        default: 'medium',
        options: [
          { label: '低风险', value: 'low' },
          { label: '中风险', value: 'medium' },
          { label: '高风险', value: 'high' }
        ]
      },
      {
        key: 'maxPositions',
        label: '最大持仓数',
        type: 'number',
        default: 5,
        min: 3,
        max: 10,
        step: 1
      }
    ],
    backtestResults: {
      totalReturn: 0.325,
      annualReturn: 0.285,
      sharpeRatio: 1.95,
      maxDrawdown: 0.15,
      winRate: 0.62,
      totalTrades: 245,
      avgTradeReturn: 0.0132,
      profitFactor: 2.15,
      calmarRatio: 1.90,
      backtestType: 'portfolio',
      portfolioComposition: [
        { symbol: 'AAPL', name: '苹果公司', weight: 0.2, sector: '科技', marketCap: 3000000000000 },
        { symbol: 'MSFT', name: '微软公司', weight: 0.2, sector: '科技', marketCap: 2800000000000 },
        { symbol: 'GOOGL', name: '谷歌A类', weight: 0.2, sector: '科技', marketCap: 1800000000000 },
        { symbol: 'NVDA', name: '英伟达', weight: 0.2, sector: '半导体', marketCap: 1200000000000 },
        { symbol: 'META', name: 'Meta平台', weight: 0.2, sector: '科技', marketCap: 950000000000 }
      ],
      individualResults: [
        {
          symbol: 'AAPL',
          name: '苹果公司',
          totalReturn: 0.28,
          annualReturn: 0.25,
          sharpeRatio: 1.8,
          maxDrawdown: 0.12,
          winRate: 0.65,
          totalTrades: 45,
          weight: 0.2,
          contribution: 0.056
        },
        {
          symbol: 'MSFT',
          name: '微软公司',
          totalReturn: 0.35,
          annualReturn: 0.32,
          sharpeRatio: 2.1,
          maxDrawdown: 0.10,
          winRate: 0.68,
          totalTrades: 42,
          weight: 0.2,
          contribution: 0.070
        },
        {
          symbol: 'GOOGL',
          name: '谷歌A类',
          totalReturn: 0.22,
          annualReturn: 0.20,
          sharpeRatio: 1.5,
          maxDrawdown: 0.18,
          winRate: 0.58,
          totalTrades: 38,
          weight: 0.2,
          contribution: 0.044
        },
        {
          symbol: 'NVDA',
          name: '英伟达',
          totalReturn: 0.45,
          annualReturn: 0.40,
          sharpeRatio: 2.3,
          maxDrawdown: 0.22,
          winRate: 0.60,
          totalTrades: 52,
          weight: 0.2,
          contribution: 0.090
        },
        {
          symbol: 'META',
          name: 'Meta平台',
          totalReturn: 0.32,
          annualReturn: 0.28,
          sharpeRatio: 1.9,
          maxDrawdown: 0.16,
          winRate: 0.62,
          totalTrades: 48,
          weight: 0.2,
          contribution: 0.064
        }
      ],
      volatility: 0.18,
      beta: 1.15,
      alpha: 12.5,
      informationRatio: 1.58,
      diversificationRatio: 1.25,
      correlationMatrix: [
        [1.0, 0.65, 0.58, 0.42, 0.55],
        [0.65, 1.0, 0.72, 0.38, 0.62],
        [0.58, 0.72, 1.0, 0.45, 0.68],
        [0.42, 0.38, 0.45, 1.0, 0.35],
        [0.55, 0.62, 0.68, 0.35, 1.0]
      ],
      equity: [
        { date: '2023-01-01', value: 100000 },
        { date: '2023-02-01', value: 105200 },
        { date: '2023-03-01', value: 108900 },
        { date: '2023-04-01', value: 106800 },
        { date: '2023-05-01', value: 114500 },
        { date: '2023-06-01', value: 118200 },
        { date: '2023-07-01', value: 115800 },
        { date: '2023-08-01', value: 122600 },
        { date: '2023-09-01', value: 119400 },
        { date: '2023-10-01', value: 126800 },
        { date: '2023-11-01', value: 130200 },
        { date: '2023-12-01', value: 132500 }
      ]
    },
    backtestPeriod: {
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      backtestType: 'portfolio',
      symbols: [
        { symbol: 'AAPL', name: '苹果公司', weight: 0.2, sector: '科技', marketCap: 3000000000000 },
        { symbol: 'MSFT', name: '微软公司', weight: 0.2, sector: '科技', marketCap: 2800000000000 },
        { symbol: 'GOOGL', name: '谷歌A类', weight: 0.2, sector: '科技', marketCap: 1800000000000 },
        { symbol: 'NVDA', name: '英伟达', weight: 0.2, sector: '半导体', marketCap: 1200000000000 },
        { symbol: 'META', name: 'Meta平台', weight: 0.2, sector: '科技', marketCap: 950000000000 }
      ],
      initialCapital: 100000,
      rebalanceFrequency: 'monthly'
    },
    lastBacktestDate: '2024-02-15T14:30:00Z'
  },
  {
    id: 'arbitrage-combo-12',
    name: '套利组合策略12',
    description: '基于动量策略的量化交易策略，通过动量策略实现稳定收益。该策略适合初级投资者使用。',
    icon: 'Grid3x3',
    category: '套利策略',
    strategyType: 'backtest',
    difficulty: 'easy',
    popularity: 78,
    parameters: [
      {
        key: 'momentum_period',
        label: '动量周期',
        type: 'number',
        default: 20,
        min: 10,
        max: 50,
        step: 1
      },
      {
        key: 'rebalance_frequency',
        label: '再平衡频率',
        type: 'select',
        default: 'monthly',
        options: [
          { label: '每日', value: 'daily' },
          { label: '每周', value: 'weekly' },
          { label: '每月', value: 'monthly' }
        ]
      },
      {
        key: 'position_size',
        label: '仓位大小(%)',
        type: 'number',
        default: 20,
        min: 5,
        max: 50,
        step: 5
      }
    ],
    backtestResults: {
      totalReturn: 0.285,
      annualReturn: 0.156,
      sharpeRatio: 1.24,
      maxDrawdown: 0.087,
      winRate: 0.62,
      totalTrades: 45,
      avgTradeReturn: 0.018,
      profitFactor: 1.85,
      calmarRatio: 1.79,
      backtestType: 'single',
      volatility: 0.125,
      beta: 0.95,
      alpha: 0.045,
      informationRatio: 0.36,
      equity: [
        { date: '2023-01-01', value: 100000 },
        { date: '2023-06-01', value: 115000 },
        { date: '2023-12-31', value: 128500 }
      ],
      trades: [
        { date: '2023-02-15', type: 'buy', price: 150, quantity: 100, profit: 0 },
        { date: '2023-03-10', type: 'sell', price: 165, quantity: 100, profit: 1500 }
      ]
    },
    backtestPeriod: {
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      symbol: 'SPY',
      initialCapital: 100000,
      backtestType: 'single'
    },
    lastBacktestDate: '2024-01-20T14:30:00Z'
  }
];

// 分享策略数据
export const sharedStrategies: SharedStrategy[] = [
  {
    id: 'shared-ma-enhanced',
    name: '增强双均线策略',
    description: '结合成交量确认的双均线策略，提高信号准确性，减少假突破',
    icon: 'TrendingUp',
    category: '趋势跟踪',
    strategyType: 'backtest',
    difficulty: 'medium',
    popularity: 156,
    author: {
      id: 'user-001',
      name: '量化大师',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=master'
    },
    isShared: true,
    shareId: 'ma-enhanced-2024',
    sharedAt: '2024-01-15T10:30:00Z',
    likes: 234,
    favorites: 89,
    usageCount: 456,
    rating: 4.8,
    tags: ['双均线', '成交量', '趋势跟踪', '中等难度'],
    backtestResults: {
      totalReturn: 0.342,
      annualReturn: 0.285,
      sharpeRatio: 2.1,
      maxDrawdown: 0.08,
      winRate: 0.65,
      backtestType: 'single'
    },
    isPublic: true,
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    parameters: [
      {
        key: 'shortPeriod',
        label: '短期周期',
        type: 'number',
        default: 12,
        min: 5,
        max: 50,
        step: 1
      },
      {
        key: 'longPeriod',
        label: '长期周期',
        type: 'number',
        default: 26,
        min: 20,
        max: 100,
        step: 1
      },
      {
        key: 'volumeConfirm',
        label: '成交量确认',
        type: 'boolean',
        default: true
      },
      {
        key: 'volumeThreshold',
        label: '成交量阈值',
        type: 'number',
        default: 1.5,
        min: 1.0,
        max: 3.0,
        step: 0.1
      }
    ]
  },
  {
    id: 'shared-rsi-advanced',
    name: '高级RSI反转策略',
    description: '多时间框架RSI策略，结合支撑阻力位，提高胜率',
    icon: 'Activity',
    category: '技术指标',
    strategyType: 'stock_selection',
    difficulty: 'hard',
    popularity: 198,
    author: {
      id: 'user-002',
      name: '技术分析师',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=analyst'
    },
    isShared: true,
    shareId: 'rsi-advanced-2024',
    sharedAt: '2024-01-20T14:15:00Z',
    likes: 312,
    favorites: 125,
    usageCount: 789,
    rating: 4.9,
    tags: ['RSI', '多时间框架', '支撑阻力', '高级策略'],
    stockRecommendations: [
      {
        symbol: 'AAPL',
        name: '苹果公司',
        score: 92,
        reason: 'RSI为26，多时间框架确认超卖，支撑位强劲',
        targetPrice: 185.50,
        riskLevel: 'medium',
        sector: '科技',
        marketCap: 2800000000000,
        updatedAt: '2024-02-15T10:30:00Z'
      },
      {
        symbol: 'MSFT',
        name: '微软公司',
        score: 89,
        reason: 'RSI为24，严重超卖，基本面支撑反弹',
        targetPrice: 420.00,
        riskLevel: 'low',
        sector: '科技',
        marketCap: 3100000000000,
        updatedAt: '2024-02-15T10:30:00Z'
      },
      {
        symbol: 'GOOGL',
        name: '谷歌A类',
        score: 85,
        reason: 'RSI为28，接近超卖，多时间框架对齐',
        targetPrice: 145.00,
        riskLevel: 'medium',
        sector: '科技',
        marketCap: 1800000000000,
        updatedAt: '2024-02-15T10:30:00Z'
      },
      {
        symbol: 'NVDA',
        name: '英伟达',
        score: 88,
        reason: 'RSI为25，超卖反弹，AI概念支撑',
        targetPrice: 800.00,
        riskLevel: 'high',
        sector: '半导体',
        marketCap: 1800000000000,
        updatedAt: '2024-02-15T10:30:00Z'
      },
      {
        symbol: 'META',
        name: 'Meta平台',
        score: 82,
        reason: 'RSI为29，超卖修复，社交媒体复苏',
        targetPrice: 380.00,
        riskLevel: 'medium',
        sector: '科技',
        marketCap: 950000000000,
        updatedAt: '2024-02-15T10:30:00Z'
      },
      {
        symbol: 'TSLA',
        name: '特斯拉',
        score: 79,
        reason: 'RSI为30，超卖边缘，电动车前景乐观',
        targetPrice: 220.00,
        riskLevel: 'high',
        sector: '汽车',
        marketCap: 700000000000,
        updatedAt: '2024-02-15T10:30:00Z'
      }
    ],
    selectionCriteria: {
      minMarketCap: 500000000000,
      sectors: ['科技', '半导体', '汽车'],
      minScore: 75,
      maxRisk: 'high'
    },
    lastScreeningDate: '2024-02-15T10:30:00Z',
    totalStocksScreened: 1000,
    recommendedStocksCount: 6,
    isPublic: true,
    createdAt: '2024-01-18T09:00:00Z',
    updatedAt: '2024-01-20T14:15:00Z',
    parameters: [
      {
        key: 'rsiPeriod',
        label: 'RSI周期',
        type: 'number',
        default: 14,
        min: 10,
        max: 30,
        step: 1
      },
      {
        key: 'oversoldLevel',
        label: '超卖线',
        type: 'number',
        default: 25,
        min: 15,
        max: 35,
        step: 1
      },
      {
        key: 'overboughtLevel',
        label: '超买线',
        type: 'number',
        default: 75,
        min: 65,
        max: 85,
        step: 1
      },
      {
        key: 'useMultiTimeframe',
        label: '多时间框架',
        type: 'boolean',
        default: true
      },
      {
        key: 'supportResistance',
        label: '支撑阻力确认',
        type: 'boolean',
        default: true
      }
    ]
  },
  {
    id: 'shared-bollinger-pro',
    name: '专业布林带策略',
    description: '结合布林带宽度和价格位置的专业策略，适合震荡市场',
    icon: 'BarChart3',
    category: '均值回归',
    strategyType: 'backtest',
    difficulty: 'medium',
    popularity: 143,
    author: {
      id: 'user-003',
      name: '波段猎手',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hunter'
    },
    isShared: true,
    shareId: 'bollinger-pro-2024',
    sharedAt: '2024-01-25T16:45:00Z',
    likes: 189,
    favorites: 67,
    usageCount: 334,
    rating: 4.6,
    tags: ['布林带', '震荡市场', '均值回归', '专业策略'],
    backtestResults: {
      totalReturn: 0.267,
      annualReturn: 0.223,
      sharpeRatio: 1.8,
      maxDrawdown: 0.09,
      winRate: 0.68,
      backtestType: 'single'
    },
    isPublic: true,
    createdAt: '2024-01-22T11:30:00Z',
    updatedAt: '2024-01-25T16:45:00Z',
    parameters: [
      {
        key: 'period',
        label: '计算周期',
        type: 'number',
        default: 20,
        min: 10,
        max: 50,
        step: 1
      },
      {
        key: 'stdDev',
        label: '标准差倍数',
        type: 'number',
        default: 2.0,
        min: 1.5,
        max: 2.5,
        step: 0.1
      },
      {
        key: 'bandwidthFilter',
        label: '带宽过滤',
        type: 'boolean',
        default: true
      },
      {
        key: 'minBandwidth',
        label: '最小带宽',
        type: 'number',
        default: 0.02,
        min: 0.01,
        max: 0.05,
        step: 0.001
      }
    ]
  },
  {
    id: 'shared-grid-smart',
    name: '智能网格策略',
    description: '动态调整网格间距的智能网格策略，适应市场波动',
    icon: 'Grid3x3',
    category: '套利策略',
    strategyType: 'backtest',
    difficulty: 'hard',
    popularity: 87,
    author: {
      id: 'user-004',
      name: '网格专家',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=grid'
    },
    isShared: true,
    shareId: 'grid-smart-2024',
    sharedAt: '2024-01-28T12:20:00Z',
    likes: 156,
    favorites: 78,
    usageCount: 267,
    rating: 4.7,
    tags: ['网格交易', '动态调整', '智能策略', '高级算法'],
    backtestResults: {
      totalReturn: 0.198,
      annualReturn: 0.165,
      sharpeRatio: 1.6,
      maxDrawdown: 0.05,
      winRate: 0.75,
      backtestType: 'single'
    },
    isPublic: true,
    createdAt: '2024-01-26T15:00:00Z',
    updatedAt: '2024-01-28T12:20:00Z',
    parameters: [
      {
        key: 'baseGridSize',
        label: '基础网格大小(%)',
        type: 'number',
        default: 2.0,
        min: 0.5,
        max: 5.0,
        step: 0.1
      },
      {
        key: 'gridLevels',
        label: '网格层数',
        type: 'number',
        default: 12,
        min: 5,
        max: 20,
        step: 1
      },
      {
        key: 'dynamicAdjustment',
        label: '动态调整',
        type: 'boolean',
        default: true
      },
      {
        key: 'volatilityFactor',
        label: '波动率因子',
        type: 'number',
        default: 1.2,
        min: 0.8,
        max: 2.0,
        step: 0.1
      }
    ]
  },
  {
    id: 'shared-momentum-ml',
    name: '机器学习动量策略',
    description: '基于机器学习的动量策略，自动识别趋势强度',
    icon: 'Zap',
    category: '趋势跟踪',
    strategyType: 'stock_selection',
    difficulty: 'hard',
    popularity: 245,
    author: {
      id: 'user-005',
      name: 'AI量化',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ai'
    },
    isShared: true,
    shareId: 'momentum-ml-2024',
    sharedAt: '2024-02-01T09:30:00Z',
    likes: 423,
    favorites: 178,
    usageCount: 612,
    rating: 4.9,
    tags: ['机器学习', '动量策略', '趋势识别', '人工智能'],
    stockRecommendations: [
      {
        symbol: 'NVDA',
        name: '英伟达',
        score: 95,
        reason: 'ML模型预测动量强度0.85，AI芯片需求旺盛',
        targetPrice: 850.00,
        riskLevel: 'high',
        sector: '半导体',
        marketCap: 1800000000000,
        updatedAt: '2024-02-15T11:00:00Z'
      },
      {
        symbol: 'TSLA',
        name: '特斯拉',
        score: 91,
        reason: 'ML算法识别强趋势，动量指标0.82',
        targetPrice: 230.00,
        riskLevel: 'high',
        sector: '汽车',
        marketCap: 700000000000,
        updatedAt: '2024-02-15T11:00:00Z'
      },
      {
        symbol: 'META',
        name: 'Meta平台',
        score: 87,
        reason: 'ML模型显示趋势强度0.78，社交媒体复苏',
        targetPrice: 390.00,
        riskLevel: 'medium',
        sector: '科技',
        marketCap: 950000000000,
        updatedAt: '2024-02-15T11:00:00Z'
      },
      {
        symbol: 'AMZN',
        name: '亚马逊',
        score: 84,
        reason: 'AI模型预测动量0.75，云服务增长强劲',
        targetPrice: 160.00,
        riskLevel: 'medium',
        sector: '电商',
        marketCap: 1500000000000,
        updatedAt: '2024-02-15T11:00:00Z'
      },
      {
        symbol: 'GOOGL',
        name: '谷歌A类',
        score: 82,
        reason: 'ML算法识别上升趋势，动量指标0.72',
        targetPrice: 150.00,
        riskLevel: 'medium',
        sector: '科技',
        marketCap: 1800000000000,
        updatedAt: '2024-02-15T11:00:00Z'
      },
      {
        symbol: 'MSFT',
        name: '微软公司',
        score: 80,
        reason: 'ML模型显示稳定趋势，动量强度0.70',
        targetPrice: 430.00,
        riskLevel: 'low',
        sector: '科技',
        marketCap: 3100000000000,
        updatedAt: '2024-02-15T11:00:00Z'
      }
    ],
    selectionCriteria: {
      minMarketCap: 500000000000,
      sectors: ['科技', '半导体', '汽车', '电商'],
      minScore: 80,
      maxRisk: 'high'
    },
    lastScreeningDate: '2024-02-15T11:00:00Z',
    totalStocksScreened: 1200,
    recommendedStocksCount: 6,
    isPublic: true,
    createdAt: '2024-01-30T10:00:00Z',
    updatedAt: '2024-02-01T09:30:00Z',
    parameters: [
      {
        key: 'lookbackPeriod',
        label: '回看周期',
        type: 'number',
        default: 30,
        min: 10,
        max: 60,
        step: 1
      },
      {
        key: 'trendThreshold',
        label: '趋势阈值',
        type: 'number',
        default: 0.6,
        min: 0.3,
        max: 0.9,
        step: 0.05
      },
      {
        key: 'mlModel',
        label: 'ML模型',
        type: 'select',
        default: 'RandomForest',
        options: [
          { label: '随机森林', value: 'RandomForest' },
          { label: '支持向量机', value: 'SVM' },
          { label: '神经网络', value: 'NeuralNetwork' }
        ]
      },
      {
        key: 'featureSet',
        label: '特征集',
        type: 'select',
        default: 'extended',
        options: [
          { label: '基础特征', value: 'basic' },
          { label: '扩展特征', value: 'extended' },
          { label: '全部特征', value: 'all' }
        ]
      }
    ]
  },
  {
    id: 'shared-momentum-king',
    name: '动量之王策略',
    description: '多因子动量策略，结合价格、成交量、资金流向等多个维度',
    icon: 'Zap',
    category: '趋势跟踪',
    strategyType: 'stock_selection',
    difficulty: 'hard',
    popularity: 189,
    author: {
      id: 'user-006',
      name: '动量专家',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=momentum'
    },
    isShared: true,
    shareId: 'momentum-king-2024',
    sharedAt: '2024-02-05T11:00:00Z',
    likes: 387,
    favorites: 156,
    usageCount: 543,
    rating: 4.8,
    tags: ['多因子', '动量策略', '趋势识别', '高级算法'],
    stockRecommendations: [
      {
        symbol: 'AAPL',
        name: '苹果公司',
        score: 93,
        reason: '多因子模型显示强势，价格动量0.8，资金流入明显',
        targetPrice: 190.00,
        riskLevel: 'medium',
        sector: '科技',
        marketCap: 2800000000000,
        updatedAt: '2024-02-15T11:30:00Z'
      },
      {
        symbol: 'MSFT',
        name: '微软公司',
        score: 90,
        reason: '多因子综合评分最高，各项指标均衡',
        targetPrice: 440.00,
        riskLevel: 'low',
        sector: '科技',
        marketCap: 3100000000000,
        updatedAt: '2024-02-15T11:30:00Z'
      },
      {
        symbol: 'NVDA',
        name: '英伟达',
        score: 89,
        reason: '价格因子0.85，成交量因子0.78，AI概念强势',
        targetPrice: 820.00,
        riskLevel: 'high',
        sector: '半导体',
        marketCap: 1800000000000,
        updatedAt: '2024-02-15T11:30:00Z'
      },
      {
        symbol: 'GOOGL',
        name: '谷歌A类',
        score: 85,
        reason: '多因子模型显示稳定上升，资金流向积极',
        targetPrice: 148.00,
        riskLevel: 'medium',
        sector: '科技',
        marketCap: 1800000000000,
        updatedAt: '2024-02-15T11:30:00Z'
      },
      {
        symbol: 'META',
        name: 'Meta平台',
        score: 83,
        reason: '成交量因子突出，价格动量恢复',
        targetPrice: 385.00,
        riskLevel: 'medium',
        sector: '科技',
        marketCap: 950000000000,
        updatedAt: '2024-02-15T11:30:00Z'
      },
      {
        symbol: 'AMZN',
        name: '亚马逊',
        score: 81,
        reason: '多因子模型显示底部反弹，资金流入增加',
        targetPrice: 155.00,
        riskLevel: 'medium',
        sector: '电商',
        marketCap: 1500000000000,
        updatedAt: '2024-02-15T11:30:00Z'
      }
    ],
    selectionCriteria: {
      minMarketCap: 500000000000,
      sectors: ['科技', '半导体', '电商'],
      minScore: 80,
      maxRisk: 'high'
    },
    lastScreeningDate: '2024-02-15T11:30:00Z',
    totalStocksScreened: 900,
    recommendedStocksCount: 6,
    isPublic: true,
    createdAt: '2024-02-02T10:00:00Z',
    updatedAt: '2024-02-05T11:00:00Z',
    parameters: [
      {
        key: 'priceFactor',
        label: '价格因子权重',
        type: 'number',
        default: 0.4,
        min: 0.2,
        max: 0.6,
        step: 0.05
      },
      {
        key: 'volumeFactor',
        label: '成交量因子权重',
        type: 'number',
        default: 0.3,
        min: 0.2,
        max: 0.4,
        step: 0.05
      },
      {
        key: 'fundFlowFactor',
        label: '资金流向因子权重',
        type: 'number',
        default: 0.3,
        min: 0.2,
        max: 0.4,
        step: 0.05
      },
      {
        key: 'lookbackPeriod',
        label: '回看周期',
        type: 'number',
        default: 40,
        min: 20,
        max: 80,
        step: 1
      },
      {
        key: 'threshold',
        label: '触发阈值',
        type: 'number',
        default: 0.5,
        min: 0.3,
        max: 0.7,
        step: 0.05
      }
    ]
  },
  {
    id: 'shared-grid-master',
    name: '网格大师策略',
    description: '智能网格交易策略，自动调整网格间距，适合横盘市场',
    icon: 'Grid3x3',
    category: '套利策略',
    strategyType: 'backtest',
    difficulty: 'hard',
    popularity: 167,
    author: {
      id: 'user-007',
      name: '网格大师',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=grid-master'
    },
    isShared: true,
    shareId: 'grid-master-2024',
    sharedAt: '2024-02-10T14:30:00Z',
    likes: 298,
    favorites: 112,
    usageCount: 396,
    rating: 4.7,
    tags: ['智能网格', '横盘市场', '高级算法', '网格交易'],
    backtestResults: {
      totalReturn: 0.234,
      annualReturn: 0.198,
      sharpeRatio: 1.7,
      maxDrawdown: 0.07,
      winRate: 0.72,
      backtestType: 'single'
    },
    isPublic: true,
    createdAt: '2024-02-08T10:00:00Z',
    updatedAt: '2024-02-10T14:30:00Z',
    parameters: [
      {
        key: 'baseGridSize',
        label: '基础网格大小(%)',
        type: 'number',
        default: 1.8,
        min: 0.5,
        max: 5.0,
        step: 0.1
      },
      {
        key: 'gridLevels',
        label: '网格层数',
        type: 'number',
        default: 15,
        min: 5,
        max: 25,
        step: 1
      },
      {
        key: 'dynamicAdjustment',
        label: '动态调整',
        type: 'boolean',
        default: true
      },
      {
        key: 'volatilityFactor',
        label: '波动率因子',
        type: 'number',
        default: 1.1,
        min: 0.7,
        max: 1.5,
        step: 0.05
      },
      {
        key: 'minGridSize',
        label: '最小网格大小(%)',
        type: 'number',
        default: 0.5,
        min: 0.2,
        max: 1.0,
        step: 0.05
      }
    ]
  }
];