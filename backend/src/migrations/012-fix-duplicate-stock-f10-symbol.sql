-- 修复股票F10表重复symbol问题
-- 012-fix-duplicate-stock-f10-symbol.sql
-- 创建时间：2025-07-19
-- 描述：处理stock_f10表中重复的symbol键值，保留最新的记录

-- 1. 临时删除唯一索引约束
ALTER TABLE `stock_f10` DROP INDEX `symbol`;

-- 2. 删除重复的记录，保留每个symbol的最新记录（基于updatedAt）
DELETE t1 FROM `stock_f10` t1
INNER JOIN `stock_f10` t2 
WHERE t1.symbol = t2.symbol 
  AND t1.updatedAt < t2.updatedAt;

-- 3. 删除重复的记录，保留每个symbol的最小id记录（如果updatedAt相同）
DELETE t1 FROM `stock_f10` t1
INNER JOIN `stock_f10` t2 
WHERE t1.symbol = t2.symbol 
  AND t1.id > t2.id;

-- 4. 重新添加唯一索引约束
ALTER TABLE `stock_f10` ADD UNIQUE KEY `symbol` (`symbol`);

-- 5. 验证修复结果，查看是否还有重复记录
SELECT symbol, COUNT(*) as duplicate_count 
FROM `stock_f10` 
GROUP BY symbol 
HAVING COUNT(*) > 1; 