-- 修复回测股票权重字段精度问题
-- 将权重字段从 decimal(5,4) 改为 decimal(6,2)

-- 修改 backtest_stocks 表的权重字段
ALTER TABLE backtest_stocks 
MODIFY COLUMN weight DECIMAL(6,2) COMMENT '权重';

-- 更新已有数据：将小数权重转换为百分比权重
-- 例如: 0.1 -> 10.0 (10%)
UPDATE backtest_stocks 
SET weight = weight * 100 
WHERE weight < 1; 