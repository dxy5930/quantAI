-- 014-create-stock-performance-table.sql
-- 创建股票收益率表，用于存储不同时间周期的收益率和绩效指标

CREATE TABLE IF NOT EXISTS `stock_performance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `symbol` varchar(20) NOT NULL COMMENT '股票代码',
  `name` varchar(100) NOT NULL COMMENT '股票名称',
  `period` varchar(10) NOT NULL COMMENT '时间周期(1m,3m,6m,1y,2y,3y,5y)',
  `baseDate` date NOT NULL COMMENT '计算基准日期',
  `updateDate` date NOT NULL COMMENT '数据更新日期',
  
  -- 收益率指标
  `totalReturn` decimal(10,4) DEFAULT NULL COMMENT '总收益率(%)',
  `annualizedReturn` decimal(10,4) DEFAULT NULL COMMENT '年化收益率(%)',
  `cumulativeReturn` decimal(10,4) DEFAULT NULL COMMENT '累计收益率(%)',
  `cagr` decimal(10,4) DEFAULT NULL COMMENT '复合年增长率CAGR(%)',
  
  -- 风险指标
  `maxDrawdown` decimal(10,4) DEFAULT NULL COMMENT '最大回撤(%)',
  `volatility` decimal(10,4) DEFAULT NULL COMMENT '波动率(%)',
  `downwardRisk` decimal(10,4) DEFAULT NULL COMMENT '下行风险(%)',
  `var95` decimal(10,4) DEFAULT NULL COMMENT 'VaR风险价值(%)',
  
  -- 风险调整收益指标
  `sharpeRatio` decimal(10,4) DEFAULT NULL COMMENT '夏普比率',
  `sortinoRatio` decimal(10,4) DEFAULT NULL COMMENT '索提诺比率',
  `calmarRatio` decimal(10,4) DEFAULT NULL COMMENT '卡尔马比率',
  `informationRatio` decimal(10,4) DEFAULT NULL COMMENT '信息比率',
  
  -- 基准比较
  `relativeReturn` decimal(10,4) DEFAULT NULL COMMENT '相对基准收益率(%)',
  `beta` decimal(10,4) DEFAULT NULL COMMENT 'Beta系数',
  `alpha` decimal(10,4) DEFAULT NULL COMMENT 'Alpha系数',
  `trackingError` decimal(10,4) DEFAULT NULL COMMENT '跟踪误差(%)',
  
  -- 价格指标
  `startPrice` decimal(10,2) DEFAULT NULL COMMENT '期初价格',
  `endPrice` decimal(10,2) DEFAULT NULL COMMENT '期末价格',
  `highestPrice` decimal(10,2) DEFAULT NULL COMMENT '最高价格',
  `lowestPrice` decimal(10,2) DEFAULT NULL COMMENT '最低价格',
  
  -- 统计指标
  `tradingDays` int DEFAULT NULL COMMENT '交易日数量',
  `upDays` int DEFAULT NULL COMMENT '上涨天数',
  `downDays` int DEFAULT NULL COMMENT '下跌天数',
  `winRate` decimal(10,4) DEFAULT NULL COMMENT '胜率(%)',
  
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_stock_performance_symbol_period` (`symbol`, `period`),
  KEY `IDX_stock_performance_symbol` (`symbol`),
  KEY `IDX_stock_performance_period` (`period`),
  KEY `IDX_stock_performance_base_date` (`baseDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='股票收益率表：存储股票在不同时间周期的收益率和绩效指标数据';

-- 插入示例数据（可选）
INSERT INTO `stock_performance` 
(`symbol`, `name`, `period`, `baseDate`, `updateDate`, `totalReturn`, `annualizedReturn`, `maxDrawdown`) 
VALUES 
('000001', '平安银行', '1y', '2024-01-01', '2024-12-31', 15.23, 15.23, -8.45),
('000002', '万科A', '1y', '2024-01-01', '2024-12-31', -2.15, -2.15, -18.20),
('000858', '五粮液', '1y', '2024-01-01', '2024-12-31', 8.67, 8.67, -12.30)
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `updateDate` = VALUES(`updateDate`),
  `totalReturn` = VALUES(`totalReturn`),
  `annualizedReturn` = VALUES(`annualizedReturn`),
  `maxDrawdown` = VALUES(`maxDrawdown`),
  `updatedAt` = CURRENT_TIMESTAMP; 