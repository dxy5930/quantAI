-- 添加示例回测策略数据
-- 007-add-sample-backtest-data.sql

-- 更新现有策略，添加回测股票集数据
UPDATE strategies 
SET 
  backtest_stocks = '[
    {
      "symbol": "AAPL",
      "name": "苹果公司",
      "weight": 0.2,
      "sector": "科技",
      "performance": 15.6,
      "contribution": 3.12,
      "trades": 8,
      "avgPrice": 175.50
    },
    {
      "symbol": "MSFT", 
      "name": "微软公司",
      "weight": 0.18,
      "sector": "科技",
      "performance": 22.3,
      "contribution": 4.01,
      "trades": 6,
      "avgPrice": 380.25
    },
    {
      "symbol": "GOOGL",
      "name": "谷歌",
      "weight": 0.15,
      "sector": "科技", 
      "performance": 18.7,
      "contribution": 2.81,
      "trades": 5,
      "avgPrice": 142.80
    },
    {
      "symbol": "TSLA",
      "name": "特斯拉",
      "weight": 0.12,
      "sector": "汽车",
      "performance": 35.2,
      "contribution": 4.22,
      "trades": 12,
      "avgPrice": 248.90
    },
    {
      "symbol": "AMZN",
      "name": "亚马逊", 
      "weight": 0.1,
      "sector": "电商",
      "performance": 12.8,
      "contribution": 1.28,
      "trades": 4,
      "avgPrice": 155.30
    }
  ]'
WHERE strategy_type = 'backtest';

-- 更新选股策略，添加股票推荐数据
UPDATE strategies 
SET 
  stock_recommendations = '[
    {
      "symbol": "AAPL",
      "name": "苹果公司",
      "score": 88,
      "reason": "技术指标良好，基本面稳健",
      "targetPrice": 200.0,
      "riskLevel": "medium",
      "sector": "科技",
      "marketCap": 3000000000000,
      "updatedAt": "2024-01-15T10:00:00Z"
    },
    {
      "symbol": "MSFT",
      "name": "微软公司", 
      "score": 85,
      "reason": "云业务增长强劲，AI布局领先",
      "targetPrice": 420.0,
      "riskLevel": "low",
      "sector": "科技",
      "marketCap": 2800000000000,
      "updatedAt": "2024-01-15T10:00:00Z"
    },
    {
      "symbol": "GOOGL",
      "name": "谷歌",
      "score": 82,
      "reason": "搜索业务稳定，AI技术先进",
      "targetPrice": 160.0,
      "riskLevel": "medium",
      "sector": "科技",
      "marketCap": 1800000000000,
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]',
  selection_criteria = '{
    "minMarketCap": 1000000000,
    "sectors": ["科技", "金融", "医疗"],
    "minScore": 75,
    "maxRisk": "medium"
  }',
  recommended_stocks_count = 3
WHERE strategy_type = 'stock_selection';

-- 添加一些新的示例策略
INSERT INTO strategies (
  id, name, description, icon, category, strategy_type, difficulty, 
  popularity, parameters, tags, is_public, likes, favorites, usage_count, 
  rating, author_id, created_at, updated_at,
  backtest_results, backtest_period, backtest_stocks, last_backtest_date
) VALUES 
(
  'sample-backtest-1',
  '多因子量化策略',
  '基于多个技术指标和基本面因子的量化回测策略，适合中长期投资',
  'BarChart3',
  '量化交易',
  'backtest',
  'medium',
  850,
  '[
    {"key": "lookback_period", "label": "回看周期", "type": "number", "default": 20, "min": 5, "max": 100},
    {"key": "risk_level", "label": "风险等级", "type": "select", "default": "medium", "options": [{"label": "低风险", "value": "low"}, {"label": "中风险", "value": "medium"}, {"label": "高风险", "value": "high"}]}
  ]',
  '["量化交易", "技术分析", "多股票", "中长期"]',
  true,
  156,
  89,
  342,
  4.2,
  (SELECT id FROM users LIMIT 1),
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '2 days',
  '{
    "totalReturn": 0.285,
    "annualReturn": 0.156,
    "sharpeRatio": 1.24,
    "maxDrawdown": 0.087,
    "winRate": 0.62,
    "totalTrades": 45,
    "backtestType": "portfolio",
    "volatility": 0.15,
    "beta": 0.95,
    "alpha": 0.08
  }',
  '{
    "startDate": "2023-01-01",
    "endDate": "2024-01-01", 
    "initialCapital": 100000,
    "backtestType": "portfolio"
  }',
  '[
    {"symbol": "AAPL", "name": "苹果公司", "weight": 0.2, "sector": "科技", "performance": 15.6, "contribution": 3.12, "trades": 8, "avgPrice": 175.50},
    {"symbol": "MSFT", "name": "微软公司", "weight": 0.18, "sector": "科技", "performance": 22.3, "contribution": 4.01, "trades": 6, "avgPrice": 380.25},
    {"symbol": "GOOGL", "name": "谷歌", "weight": 0.15, "sector": "科技", "performance": 18.7, "contribution": 2.81, "trades": 5, "avgPrice": 142.80},
    {"symbol": "TSLA", "name": "特斯拉", "weight": 0.12, "sector": "汽车", "performance": 35.2, "contribution": 4.22, "trades": 12, "avgPrice": 248.90},
    {"symbol": "NVDA", "name": "英伟达", "weight": 0.1, "sector": "科技", "performance": 45.6, "contribution": 4.56, "trades": 9, "avgPrice": 520.75}
  ]',
  NOW() - INTERVAL '1 day'
),
(
  'sample-stock-selection-1', 
  '价值投资选股策略',
  '基于基本面分析的价值投资选股策略，专注于低估值高质量股票',
  'Target',
  '价值投资',
  'stock_selection',
  'easy',
  720,
  '[
    {"key": "pe_ratio_max", "label": "最大市盈率", "type": "number", "default": 20, "min": 5, "max": 50},
    {"key": "pb_ratio_max", "label": "最大市净率", "type": "number", "default": 3, "min": 0.5, "max": 10}
  ]',
  '["基本面分析", "价值投资", "成长股", "蓝筹股"]',
  true,
  98,
  67,
  234,
  4.0,
  (SELECT id FROM users LIMIT 1),
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '1 day',
  NULL,
  NULL,
  NULL,
  NULL
);

-- 为选股策略添加股票推荐数据
UPDATE strategies 
SET 
  stock_recommendations = '[
    {
      "symbol": "BRK.B",
      "name": "伯克希尔哈撒韦B",
      "score": 90,
      "reason": "巴菲特旗舰公司，价值投资典范",
      "targetPrice": 380.0,
      "riskLevel": "low",
      "sector": "金融",
      "marketCap": 800000000000,
      "updatedAt": "2024-01-15T10:00:00Z"
    },
    {
      "symbol": "JNJ",
      "name": "强生公司",
      "score": 87,
      "reason": "医疗健康龙头，分红稳定",
      "targetPrice": 170.0,
      "riskLevel": "low", 
      "sector": "医疗",
      "marketCap": 450000000000,
      "updatedAt": "2024-01-15T10:00:00Z"
    },
    {
      "symbol": "KO",
      "name": "可口可乐",
      "score": 84,
      "reason": "消费品巨头，现金流稳定",
      "targetPrice": 65.0,
      "riskLevel": "low",
      "sector": "消费",
      "marketCap": 260000000000,
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]',
  selection_criteria = '{
    "minMarketCap": 10000000000,
    "sectors": ["金融", "医疗", "消费"],
    "minScore": 80,
    "maxRisk": "low"
  }',
  recommended_stocks_count = 3,
  last_screening_date = NOW() - INTERVAL '1 day'
WHERE id = 'sample-stock-selection-1';