-- 为 backtest_history 表添加回测结果指标列
-- 这些列用于存储关键的回测指标，便于查询和排序

-- 添加总收益率列
ALTER TABLE `backtest_history` 
ADD COLUMN `totalReturn` DECIMAL(10,6) NULL COMMENT '总收益率' AFTER `minTradeAmount`;

-- 添加年化收益率列
ALTER TABLE `backtest_history` 
ADD COLUMN `annualReturn` DECIMAL(10,6) NULL COMMENT '年化收益率' AFTER `totalReturn`;

-- 添加夏普比率列
ALTER TABLE `backtest_history` 
ADD COLUMN `sharpeRatio` DECIMAL(10,6) NULL COMMENT '夏普比率' AFTER `annualReturn`;

-- 添加最大回撤列
ALTER TABLE `backtest_history` 
ADD COLUMN `maxDrawdown` DECIMAL(10,6) NULL COMMENT '最大回撤' AFTER `sharpeRatio`;

-- 添加胜率列
ALTER TABLE `backtest_history` 
ADD COLUMN `winRate` DECIMAL(10,6) NULL COMMENT '胜率' AFTER `maxDrawdown`;

-- 添加总交易次数列
ALTER TABLE `backtest_history` 
ADD COLUMN `totalTrades` INT NULL COMMENT '总交易次数' AFTER `winRate`;

-- 添加平均持仓天数列
ALTER TABLE `backtest_history` 
ADD COLUMN `avgHoldingDays` DECIMAL(10,2) NULL COMMENT '平均持仓天数' AFTER `totalTrades`;

-- 添加波动率列
ALTER TABLE `backtest_history` 
ADD COLUMN `volatility` DECIMAL(10,6) NULL COMMENT '波动率' AFTER `avgHoldingDays`;

-- 添加信息比率列
ALTER TABLE `backtest_history` 
ADD COLUMN `informationRatio` DECIMAL(10,6) NULL COMMENT '信息比率' AFTER `volatility`;

-- 添加索提诺比率列
ALTER TABLE `backtest_history` 
ADD COLUMN `sortinoRatio` DECIMAL(10,6) NULL COMMENT '索提诺比率' AFTER `informationRatio`;

-- 为关键查询字段添加索引
CREATE INDEX `idx_backtest_totalReturn` ON `backtest_history` (`totalReturn`);
CREATE INDEX `idx_backtest_sharpeRatio` ON `backtest_history` (`sharpeRatio`);
CREATE INDEX `idx_backtest_status_totalReturn` ON `backtest_history` (`status`, `totalReturn`);
CREATE INDEX `idx_backtest_createdAt_totalReturn` ON `backtest_history` (`createdAt`, `totalReturn`);