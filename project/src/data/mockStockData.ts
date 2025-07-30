import { StockRecommendation } from '../types';

// 模拟股票推荐数据
export const mockStockRecommendations: StockRecommendation[] = [
  {
    symbol: 'AAPL',
    name: '苹果公司',
    score: 92,
    reason: '基于技术分析，该股票呈现强劲上升趋势，RSI指标显示超买状态即将结束，MACD金叉信号明确。公司基本面良好，iPhone销量稳定增长，服务业务持续扩张。',
    targetPrice: 195.50,
    riskLevel: 'medium',
    sector: '科技',
    marketCap: 3000000000000,
    updatedAt: new Date().toISOString(),
    
    // 技术分析数据
    technicalAnalysis: {
      rsi: 68.5,
      macd: {
        macd: 1.23,
        signal: 0.98,
        histogram: 0.25
      },
      movingAverages: {
        ma5: 192.5,
        ma10: 189.2,
        ma20: 185.8,
        ma50: 182.1
      },
      support: 180.0,
      resistance: 200.0,
      trend: 'bullish',
      strength: 'strong'
    },
    
    // 基本面分析数据
    fundamentalAnalysis: {
      peRatio: 28.5,
      pbRatio: 4.2,
      roe: 26.8,
      roa: 18.3,
      debtToEquity: 0.31,
      currentRatio: 1.9,
      quickRatio: 1.5,
      grossMargin: 0.43,
      operatingMargin: 0.30,
      netMargin: 0.25
    },
    
    // 趋势数据
    trendData: {
      period: '30d',
      summary: {
        trend: 'upward',
        volatility: 'medium',
        momentum: 'positive',
        avgVolume: 45000000,
        priceChange: 8.5,
        priceChangePercent: '4.6%'
      }
    },
    
    // 推荐详情
    recommendation: {
      rating: 'BUY',
      score: 92,
      reasons: [
        '技术指标显示强劲上升趋势',
        'RSI为68.5，处于强势但未超买区间',
        '基本面数据优秀，ROE达26.8%',
        '科技行业前景看好，创新能力强'
      ]
    }
  },
  {
    symbol: 'TSLA',
    name: '特斯拉',
    score: 88,
    reason: '电动汽车行业领导者，自动驾驶技术不断突破，中国市场表现强劲。技术指标显示突破前期阻力位，成交量放大，短期内有望继续上涨。',
    targetPrice: 280.00,
    riskLevel: 'high',
    sector: '汽车',
    marketCap: 800000000000,
    updatedAt: new Date().toISOString(),
    
    technicalAnalysis: {
      rsi: 72.3,
      macd: {
        macd: 2.15,
        signal: 1.88,
        histogram: 0.27
      },
      movingAverages: {
        ma5: 275.2,
        ma10: 268.5,
        ma20: 262.1,
        ma50: 255.8
      },
      support: 250.0,
      resistance: 290.0,
      trend: 'bullish',
      strength: 'strong'
    },
    
    fundamentalAnalysis: {
      peRatio: 65.2,
      pbRatio: 8.5,
      roe: 19.3,
      roa: 8.7,
      debtToEquity: 0.18,
      currentRatio: 1.4,
      quickRatio: 1.1,
      grossMargin: 0.21,
      operatingMargin: 0.08,
      netMargin: 0.07
    },
    
    trendData: {
      period: '30d',
      summary: {
        trend: 'upward',
        volatility: 'high',
        momentum: 'positive',
        avgVolume: 89000000,
        priceChange: 25.8,
        priceChangePercent: '10.2%'
      }
    },
    
    recommendation: {
      rating: 'BUY',
      score: 88,
      reasons: [
        '技术指标显示突破前期阻力位',
        'RSI为72.3，处于强势区间',
        '电动汽车行业前景广阔',
        '自动驾驶技术领先优势明显'
      ]
    }
  },
  {
    symbol: 'MSFT',
    name: '微软',
    score: 85,
    reason: '云计算业务Azure持续高速增长，AI技术投入显著，与OpenAI合作深化。股价在关键支撑位获得支撑，布林带收窄后有望迎来突破。',
    targetPrice: 420.00,
    riskLevel: 'low',
    sector: '科技',
    marketCap: 2800000000000,
    updatedAt: new Date().toISOString(),
    
    technicalAnalysis: {
      rsi: 58.7,
      macd: {
        macd: 0.85,
        signal: 0.72,
        histogram: 0.13
      },
      movingAverages: {
        ma5: 415.8,
        ma10: 412.3,
        ma20: 408.9,
        ma50: 405.2
      },
      support: 400.0,
      resistance: 430.0,
      trend: 'bullish',
      strength: 'moderate'
    },
    
    fundamentalAnalysis: {
      peRatio: 32.1,
      pbRatio: 5.8,
      roe: 18.7,
      roa: 12.4,
      debtToEquity: 0.47,
      currentRatio: 2.5,
      quickRatio: 2.3,
      grossMargin: 0.69,
      operatingMargin: 0.42,
      netMargin: 0.36
    },
    
    trendData: {
      period: '30d',
      summary: {
        trend: 'upward',
        volatility: 'low',
        momentum: 'positive',
        avgVolume: 28000000,
        priceChange: 12.3,
        priceChangePercent: '3.0%'
      }
    },
    
    recommendation: {
      rating: 'BUY',
      score: 85,
      reasons: [
        '云计算业务Azure持续高速增长',
        'AI技术投入显著，与OpenAI合作深化',
        '基本面稳健，ROE达18.7%',
        '股价在关键支撑位获得支撑'
      ]
    }
  },
  {
    symbol: 'NVDA',
    name: '英伟达',
    score: 94,
    reason: 'AI芯片需求爆发式增长，数据中心业务营收创历史新高。技术面显示强势整理后再次启动，多项技术指标共振向上。',
    targetPrice: 550.00,
    riskLevel: 'high',
    sector: '半导体',
    marketCap: 1200000000000,
    updatedAt: new Date().toISOString(),
    
    technicalAnalysis: {
      rsi: 75.2,
      macd: {
        macd: 3.45,
        signal: 2.98,
        histogram: 0.47
      },
      movingAverages: {
        ma5: 545.8,
        ma10: 538.2,
        ma20: 528.9,
        ma50: 515.3
      },
      support: 520.0,
      resistance: 580.0,
      trend: 'bullish',
      strength: 'strong'
    },
    
    fundamentalAnalysis: {
      peRatio: 58.3,
      pbRatio: 12.7,
      roe: 35.8,
      roa: 22.1,
      debtToEquity: 0.25,
      currentRatio: 3.8,
      quickRatio: 3.5,
      grossMargin: 0.75,
      operatingMargin: 0.32,
      netMargin: 0.28
    },
    
    trendData: {
      period: '30d',
      summary: {
        trend: 'upward',
        volatility: 'high',
        momentum: 'positive',
        avgVolume: 125000000,
        priceChange: 45.2,
        priceChangePercent: '8.9%'
      }
    },
    
    recommendation: {
      rating: 'BUY',
      score: 94,
      reasons: [
        'AI芯片需求爆发式增长',
        '数据中心业务营收创历史新高',
        '技术面显示强势整理后再次启动',
        '多项技术指标共振向上'
      ]
    }
  },
  {
    symbol: 'GOOGL',
    name: '谷歌',
    score: 82,
    reason: '搜索业务稳定增长，云计算业务快速发展，AI技术应用广泛。股价在长期上升通道中运行，当前位置具备较好的风险收益比。',
    targetPrice: 175.00,
    riskLevel: 'medium',
    sector: '科技',
    marketCap: 2100000000000,
    updatedAt: new Date().toISOString(),
    
    technicalAnalysis: {
      rsi: 62.4,
      macd: {
        macd: 1.12,
        signal: 0.89,
        histogram: 0.23
      },
      movingAverages: {
        ma5: 172.3,
        ma10: 169.8,
        ma20: 166.5,
        ma50: 162.1
      },
      support: 160.0,
      resistance: 180.0,
      trend: 'bullish',
      strength: 'moderate'
    },
    
    fundamentalAnalysis: {
      peRatio: 26.8,
      pbRatio: 4.1,
      roe: 15.3,
      roa: 11.2,
      debtToEquity: 0.12,
      currentRatio: 2.8,
      quickRatio: 2.6,
      grossMargin: 0.57,
      operatingMargin: 0.25,
      netMargin: 0.21
    },
    
    trendData: {
      period: '30d',
      summary: {
        trend: 'upward',
        volatility: 'medium',
        momentum: 'positive',
        avgVolume: 32000000,
        priceChange: 8.9,
        priceChangePercent: '5.4%'
      }
    },
    
    recommendation: {
      rating: 'BUY',
      score: 82,
      reasons: [
        '搜索业务稳定增长',
        '云计算业务快速发展',
        'AI技术应用广泛',
        '股价在长期上升通道中运行'
      ]
    }
  },
  {
    symbol: 'AMZN',
    name: '亚马逊',
    score: 79,
    reason: '电商业务恢复增长，AWS云服务保持领先地位，物流网络优势明显。技术指标显示底部形态确立，有望迎来反弹行情。',
    targetPrice: 165.00,
    riskLevel: 'medium',
    sector: '电商',
    marketCap: 1600000000000,
    updatedAt: new Date().toISOString(),
    
    technicalAnalysis: {
      rsi: 45.8,
      macd: {
        macd: -0.25,
        signal: -0.48,
        histogram: 0.23
      },
      movingAverages: {
        ma5: 158.9,
        ma10: 156.2,
        ma20: 153.8,
        ma50: 151.3
      },
      support: 150.0,
      resistance: 170.0,
      trend: 'bearish',
      strength: 'weak'
    },
    
    fundamentalAnalysis: {
      peRatio: 45.2,
      pbRatio: 6.8,
      roe: 12.8,
      roa: 5.2,
      debtToEquity: 0.58,
      currentRatio: 1.1,
      quickRatio: 0.9,
      grossMargin: 0.48,
      operatingMargin: 0.05,
      netMargin: 0.03
    },
    
    trendData: {
      period: '30d',
      summary: {
        trend: 'downward',
        volatility: 'medium',
        momentum: 'negative',
        avgVolume: 38000000,
        priceChange: -5.2,
        priceChangePercent: '-3.2%'
      }
    },
    
    recommendation: {
      rating: 'HOLD',
      score: 79,
      reasons: [
        '电商业务恢复增长',
        'AWS云服务保持领先地位',
        '物流网络优势明显',
        '技术指标显示底部形态确立'
      ]
    }
  }
];

// K线数据接口
export interface CandlestickData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 生成模拟K线数据
export const generateMockCandlestickData = (days: number = 30): CandlestickData[] => {
  const data: CandlestickData[] = [];
  let currentPrice = 100;
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const open = currentPrice;
    const volatility = 0.02; // 2% 波动率
    const trend = (Math.random() - 0.5) * 0.01; // 随机趋势
    
    const high = open * (1 + Math.random() * volatility + Math.max(0, trend));
    const low = open * (1 - Math.random() * volatility + Math.min(0, trend));
    const close = low + Math.random() * (high - low);
    
    currentPrice = close;
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000) + 100000,
    });
  }
  
  return data;
};

// 生成模拟资金曲线数据
export interface EquityData {
  date: string;
  value: number;
  benchmark?: number;
}

export const generateMockEquityData = (days: number = 90): EquityData[] => {
  const data: EquityData[] = [];
  let portfolioValue = 100000; // 初始资金10万
  let benchmarkValue = 100000;
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // 策略收益率（稍微优于基准）
    const portfolioReturn = (Math.random() - 0.48) * 0.02; // 轻微正偏
    const benchmarkReturn = (Math.random() - 0.5) * 0.015; // 市场收益
    
    portfolioValue *= (1 + portfolioReturn);
    benchmarkValue *= (1 + benchmarkReturn);
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Number(portfolioValue.toFixed(2)),
      benchmark: Number(benchmarkValue.toFixed(2)),
    });
  }
  
  return data;
};

// 模拟交易记录数据
export interface TradeData {
  id: string;
  date: string;
  symbol: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  amount: number;
  profit?: number;
  profitPercent?: number;
}

export const generateMockTradeData = (): TradeData[] => {
  const symbols = ['AAPL', 'TSLA', 'MSFT', 'NVDA', 'GOOGL'];
  const trades: TradeData[] = [];
  
  for (let i = 0; i < 20; i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const isBuy = Math.random() > 0.5;
    const price = 100 + Math.random() * 200;
    const quantity = Math.floor(Math.random() * 100) + 10;
    const amount = price * quantity;
    
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    trades.push({
      id: `trade_${i}`,
      date: date.toISOString().split('T')[0],
      symbol,
      type: isBuy ? 'buy' : 'sell',
      price: Number(price.toFixed(2)),
      quantity,
      amount: Number(amount.toFixed(2)),
      profit: isBuy ? undefined : Number(((Math.random() - 0.3) * amount * 0.1).toFixed(2)),
      profitPercent: isBuy ? undefined : Number(((Math.random() - 0.3) * 10).toFixed(2)),
    });
  }
  
  return trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}; 