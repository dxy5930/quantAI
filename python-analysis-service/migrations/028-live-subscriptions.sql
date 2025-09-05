-- 028-live-subscriptions.sql
-- 目的：增加老师与订阅关系，用于直播间付费权限校验

SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results = utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

-- 老师表
CREATE TABLE IF NOT EXISTS teachers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(500) NULL,
  bio TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户订阅表（购买课程/订阅）
CREATE TABLE IF NOT EXISTS user_teacher_subscriptions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  teacher_id VARCHAR(64) NOT NULL,
  start_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_teacher (user_id, teacher_id),
  INDEX idx_user_id (user_id),
  INDEX idx_teacher_id (teacher_id),
  CONSTRAINT fk_user_teacher_sub_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_teacher_sub_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 为直播频道增加 teacher_id（兼容旧版本 MySQL）
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'live_channels' AND COLUMN_NAME = 'teacher_id'
);
SET @ddl := IF(@col_exists = 0, 'ALTER TABLE live_channels ADD COLUMN teacher_id VARCHAR(64) NULL AFTER name', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 为 teacher_id 添加索引（兼容旧版本 MySQL）
SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'live_channels' AND INDEX_NAME = 'idx_live_teacher_id'
);
SET @ddl := IF(@idx_exists = 0, 'ALTER TABLE live_channels ADD INDEX idx_live_teacher_id (teacher_id)', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 为 teacher_id 添加外键（兼容旧版本 MySQL）
SET @fk_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'live_channels' AND CONSTRAINT_NAME = 'fk_live_channel_teacher'
);
SET @ddl := IF(@fk_exists = 0, 'ALTER TABLE live_channels ADD CONSTRAINT fk_live_channel_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt; 