CREATE TABLE IF NOT EXISTS strategy_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(50) NOT NULL,
  description TEXT,
  "order" INT DEFAULT 0
);

INSERT INTO strategy_types (value, label, description, "order") VALUES
  ('stock_selection', '选股策略', '基于条件筛选股票的策略', 1),
  ('backtest', '技术指标', '基于技术指标的量化回测策略', 2)
ON CONFLICT (value) DO NOTHING; 