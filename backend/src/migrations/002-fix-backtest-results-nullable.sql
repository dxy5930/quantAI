-- 修复回测历史表中results字段的可空性问题
-- 解决 "Field 'results' doesn't have a default value" 错误

-- 修改backtest_history表的results字段，设置为可空
ALTER TABLE `backtest_history` 
MODIFY COLUMN `results` JSON NULL COMMENT '回测结果数据（JSON格式）';

-- 为现有的运行中状态的记录设置results为NULL（如果有的话）
UPDATE `backtest_history` 
SET `results` = NULL 
WHERE `status` = 'running' AND `results` IS NOT NULL; 