-- 插入示例策略数据
-- 003-insert-sample-strategies.sql

-- 首先确保有测试用户（如果没有的话）
INSERT IGNORE INTO users (id, username, email, password, display_name, level, created_at, updated_at)
VALUES 
  ('test-user-1', 'test', 'test1@example.com', '$2b$10$example_hash', '测试用户1', 1, NOW(), NOW()),
  ('test-user-2', 'testuser2', 'test2@example.com', '$2b$10$example_hash', '测试用户2', 2, NOW(), NOW());

-- 插入示例策略数据
INSERT INTO strategies (
  id, name, description, icon, category, strategy_type, difficulty, 
  popularity, parameters, tags, is_public, is_shared, likes, favorites, 
  usage_count, rating, stock_recommendations, selection_criteria, 
  last_screening_date, total_stocks_screened, recommended_stocks_count,
  backtest_results, backtest_period, last_backtest_date, 
  author_id, created_at, updated_at
) VALUES 
-- 移动平均交叉策略
(
  'ma-crossover',
  '移动平均交叉',
  '当短期移动平均线上穿长期移动平均线时买入，下穿时卖出',
  'TrendingUp',
  '趋势跟踪',
  'backtest',
  'easy',
  95,
  '[
    {"key": "shortPeriod", "label": "短期周期", "type": "number", "default": 10, "min": 5, "max": 50, "step": 1},
    {"key": "longPeriod", "label": "长期周期", "type": "number", "default": 30, "min": 20, "max": 100, "step": 1},
    {"key": "maType", "label": "平均线类型", "type": "select", "default": "SMA", "options": [{"label": "简单移动平均(SMA)", "value": "SMA"}, {"label": "指数移动平均(EMA)", "value": "EMA"}]}
  ]',
  '["移动平均", "交叉", "趋势跟踪", "技术指标"]',
  true,
  true,
  156,
  89,
  245,
  4.2,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '{
    "totalReturn": 0.245,
    "annualReturn": 0.187,
    "sharpeRatio": 1.85,
    "maxDrawdown": 0.08,
    "winRate": 0.65,
    "totalTrades": 156,
    "avgTradeReturn": 0.0157,
    "profitFactor": 2.34,
    "calmarRatio": 2.34,
    "backtestType": "single",
    "equity": [
      {"date": "2023-01-01", "value": 100000},
      {"date": "2023-02-01", "value": 103500},
      {"date": "2023-03-01", "value": 107200},
      {"date": "2023-04-01", "value": 105800},
      {"date": "2023-05-01", "value": 112400},
      {"date": "2023-06-01", "value": 118900},
      {"date": "2023-07-01", "value": 115600},
      {"date": "2023-08-01", "value": 122300},
      {"date": "2023-09-01", "value": 119700},
      {"date": "2023-10-01", "value": 126800},
      {"date": "2023-11-01", "value": 131200},
      {"date": "2023-12-01", "value": 124500}
    ]
  }',
  '{
    "startDate": "2023-01-01",
    "endDate": "2023-12-31",
    "symbol": "SPY",
    "initialCapital": 100000,
    "backtestType": "single"
  }',
  '2024-02-15 09:00:00',
  'test-user-1',
  NOW(),
  NOW()
),

-- RSI超卖反弹策略
(
  'rsi-oversold',
  'RSI超卖反弹',
  '当RSI低于超卖线时买入，高于超买线时卖出',
  'Activity',
  '技术指标',
  'stock_selection',
  'easy',
  88,
  '[
    {"key": "period", "label": "RSI周期", "type": "number", "default": 14, "min": 10, "max": 30, "step": 1},
    {"key": "oversold", "label": "超卖线", "type": "number", "default": 30, "min": 20, "max": 35, "step": 1},
    {"key": "overbought", "label": "超买线", "type": "number", "default": 70, "min": 65, "max": 80, "step": 1}
  ]',
  '["RSI", "超卖", "反弹", "技术指标"]',
  true,
  true,
  134,
  67,
  189,
  3.8,
  '[
    {"symbol": "AAPL", "name": "苹果公司", "score": 85, "reason": "RSI为28，处于超卖状态，技术面反弹信号强烈", "targetPrice": 185.50, "riskLevel": "medium", "sector": "科技", "marketCap": 2800000000000, "updatedAt": "2024-02-15T10:30:00Z"},
    {"symbol": "MSFT", "name": "微软公司", "score": 78, "reason": "RSI为25，严重超卖，基本面良好支撑反弹", "targetPrice": 420.00, "riskLevel": "low", "sector": "科技", "marketCap": 3100000000000, "updatedAt": "2024-02-15T10:30:00Z"},
    {"symbol": "GOOGL", "name": "谷歌A类", "score": 72, "reason": "RSI为29，接近超卖，盈利能力稳定", "targetPrice": 145.00, "riskLevel": "medium", "sector": "科技", "marketCap": 1800000000000, "updatedAt": "2024-02-15T10:30:00Z"}
  ]',
  '{
    "minMarketCap": 100000000000,
    "sectors": ["科技", "消费"],
    "minScore": 70,
    "maxRisk": "medium"
  }',
  '2024-02-15 10:30:00',
  500,
  3,
  NULL,
  NULL,
  NULL,
  'test-user-1',
  NOW(),
  NOW()
),

-- 布林带策略
(
  'bollinger-bands',
  '布林带策略',
  '价格触及下轨时买入，触及上轨时卖出',
  'BarChart3',
  '均值回归',
  'backtest',
  'medium',
  76,
  '[
    {"key": "period", "label": "计算周期", "type": "number", "default": 20, "min": 10, "max": 50, "step": 1},
    {"key": "stdDev", "label": "标准差倍数", "type": "number", "default": 2, "min": 1, "max": 3, "step": 0.1}
  ]',
  '["布林带", "均值回归", "波动率", "技术指标"]',
  true,
  true,
  98,
  45,
  167,
  3.6,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '{
    "totalReturn": 0.198,
    "annualReturn": 0.152,
    "sharpeRatio": 1.67,
    "maxDrawdown": 0.12,
    "winRate": 0.58,
    "totalTrades": 89,
    "avgTradeReturn": 0.0223,
    "profitFactor": 1.89,
    "calmarRatio": 1.27,
    "backtestType": "single",
    "equity": [
      {"date": "2023-01-01", "value": 100000},
      {"date": "2023-02-01", "value": 101800},
      {"date": "2023-03-01", "value": 105600},
      {"date": "2023-04-01", "value": 103200},
      {"date": "2023-05-01", "value": 108900},
      {"date": "2023-06-01", "value": 112400},
      {"date": "2023-07-01", "value": 109800},
      {"date": "2023-08-01", "value": 115200},
      {"date": "2023-09-01", "value": 113600},
      {"date": "2023-10-01", "value": 117900},
      {"date": "2023-11-01", "value": 119800},
      {"date": "2023-12-01", "value": 119800}
    ]
  }',
  '{
    "startDate": "2023-01-01",
    "endDate": "2023-12-31",
    "symbol": "QQQ",
    "initialCapital": 100000,
    "backtestType": "single"
  }',
  '2024-02-15 09:30:00',
  'test-user-1',
  NOW(),
  NOW()
),

-- MACD信号策略
(
  'macd-signal',
  'MACD信号',
  'MACD线上穿信号线时买入，下穿时卖出',
  'LineChart',
  '技术指标',
  'stock_selection',
  'medium',
  82,
  '[
    {"key": "fastPeriod", "label": "快速周期", "type": "number", "default": 12, "min": 8, "max": 20, "step": 1},
    {"key": "slowPeriod", "label": "慢速周期", "type": "number", "default": 26, "min": 20, "max": 40, "step": 1},
    {"key": "signalPeriod", "label": "信号周期", "type": "number", "default": 9, "min": 5, "max": 15, "step": 1}
  ]',
  '["MACD", "信号线", "动量", "技术指标"]',
  true,
  true,
  112,
  56,
  203,
  3.9,
  '[
    {"symbol": "TSLA", "name": "特斯拉", "score": 89, "reason": "MACD金叉形成，动量强劲", "targetPrice": 250.00, "riskLevel": "high", "sector": "汽车", "marketCap": 800000000000, "updatedAt": "2024-02-15T11:00:00Z"},
    {"symbol": "NVDA", "name": "英伟达", "score": 92, "reason": "MACD柱状图转正，买入信号明确", "targetPrice": 750.00, "riskLevel": "medium", "sector": "半导体", "marketCap": 1800000000000, "updatedAt": "2024-02-15T11:00:00Z"}
  ]',
  '{
    "minMarketCap": 50000000000,
    "sectors": ["科技", "汽车", "半导体"],
    "minScore": 80,
    "maxRisk": "high"
  }',
  '2024-02-15 11:00:00',
  800,
  2,
  NULL,
  NULL,
  NULL,
  'test-user-2',
  NOW(),
  NOW()
),

-- 动量策略
(
  'momentum-strategy',
  '动量策略',
  '基于价格动量进行交易，追涨杀跌',
  'Zap',
  '动量策略',
  'backtest',
  'hard',
  69,
  '[
    {"key": "lookbackPeriod", "label": "回看周期", "type": "number", "default": 20, "min": 10, "max": 60, "step": 1},
    {"key": "threshold", "label": "动量阈值", "type": "number", "default": 0.05, "min": 0.01, "max": 0.2, "step": 0.01},
    {"key": "holdingPeriod", "label": "持有周期", "type": "number", "default": 5, "min": 1, "max": 20, "step": 1}
  ]',
  '["动量", "趋势", "追涨杀跌", "短线"]',
  true,
  false,
  78,
  34,
  145,
  3.4,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '{
    "totalReturn": 0.156,
    "annualReturn": 0.121,
    "sharpeRatio": 1.23,
    "maxDrawdown": 0.18,
    "winRate": 0.52,
    "totalTrades": 234,
    "avgTradeReturn": 0.0067,
    "profitFactor": 1.45,
    "calmarRatio": 0.67,
    "backtestType": "single",
    "equity": [
      {"date": "2023-01-01", "value": 100000},
      {"date": "2023-02-01", "value": 98500},
      {"date": "2023-03-01", "value": 102300},
      {"date": "2023-04-01", "value": 105600},
      {"date": "2023-05-01", "value": 103200},
      {"date": "2023-06-01", "value": 108900},
      {"date": "2023-07-01", "value": 112400},
      {"date": "2023-08-01", "value": 109800},
      {"date": "2023-09-01", "value": 114500},
      {"date": "2023-10-01", "value": 117800},
      {"date": "2023-11-01", "value": 115600},
      {"date": "2023-12-01", "value": 115600}
    ]
  }',
  '{
    "startDate": "2023-01-01",
    "endDate": "2023-12-31",
    "symbol": "IWM",
    "initialCapital": 100000,
    "backtestType": "single"
  }',
  '2024-02-15 08:45:00',
  'test-user-2',
  NOW(),
  NOW()
)

ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  icon = VALUES(icon),
  category = VALUES(category),
  strategy_type = VALUES(strategy_type),
  difficulty = VALUES(difficulty),
  popularity = VALUES(popularity),
  parameters = VALUES(parameters),
  tags = VALUES(tags),
  is_public = VALUES(is_public),
  is_shared = VALUES(is_shared),
  likes = VALUES(likes),
  favorites = VALUES(favorites),
  usage_count = VALUES(usage_count),
  rating = VALUES(rating),
  stock_recommendations = VALUES(stock_recommendations),
  selection_criteria = VALUES(selection_criteria),
  last_screening_date = VALUES(last_screening_date),
  total_stocks_screened = VALUES(total_stocks_screened),
  recommended_stocks_count = VALUES(recommended_stocks_count),
  backtest_results = VALUES(backtest_results),
  backtest_period = VALUES(backtest_period),
  last_backtest_date = VALUES(last_backtest_date),
  updated_at = NOW(); 