-- 添加回测股票集字段
-- 008-add-backtest-stocks-field.sql

-- 为策略表添加回测股票集字段
ALTER TABLE strategies 
ADD COLUMN backtest_stocks JSON COMMENT '回测股票集数据';