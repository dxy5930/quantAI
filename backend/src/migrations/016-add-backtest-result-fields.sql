-- 为backtest_history表添加回测结果相关字段
-- 这些字段用于快速查询回测结果，避免每次都解析JSON数据

ALTER TABLE backtest_history ADD COLUMN totalReturn DECIMAL(8,4) NULL COMMENT '总收益率';
ALTER TABLE backtest_history ADD COLUMN sharpeRatio DECIMAL(8,4) NULL COMMENT '夏普比率';
ALTER TABLE backtest_history ADD COLUMN maxDrawdown DECIMAL(8,4) NULL COMMENT '最大回撤';
ALTER TABLE backtest_history ADD COLUMN winRate DECIMAL(5,2) NULL COMMENT '胜率(%)';
ALTER TABLE backtest_history ADD COLUMN totalTrades INT NULL COMMENT '总交易次数';

-- 创建索引以提高查询性能
CREATE INDEX idx_backtest_history_total_return ON backtest_history(totalReturn);
CREATE INDEX idx_backtest_history_status_created ON backtest_history(status, createdAt); 