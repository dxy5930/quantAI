-- 026-fix-workflow-message-fields.sql
-- 为 workflow_messages 表添加缺失的字段

-- 检查并添加 created_at 字段
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'workflow_messages'
    AND COLUMN_NAME = 'created_at'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE workflow_messages ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    'SELECT "created_at 字段已存在" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 updated_at 字段
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'workflow_messages'
    AND COLUMN_NAME = 'updated_at'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE workflow_messages ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    'SELECT "updated_at 字段已存在" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 为现有数据设置默认值（如果字段是新添加的）
UPDATE workflow_messages 
SET created_at = COALESCE(created_at, timestamp),
    updated_at = COALESCE(updated_at, timestamp)
WHERE created_at IS NULL OR updated_at IS NULL;

-- 验证字段是否添加成功
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'workflow_messages'
    AND COLUMN_NAME IN ('created_at', 'updated_at')
ORDER BY COLUMN_NAME; 