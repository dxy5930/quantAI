-- 029-live-orders.sql
-- 目的：新增直播订单表（模拟支付）

SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results = utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS live_orders (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  channel_id VARCHAR(64) NOT NULL,
  teacher_id VARCHAR(64) NULL,
  duration_days INT NOT NULL,
  amount_cents INT NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'CNY',
  pay_method VARCHAR(20) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING/PAID/CANCELED
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_channel_id (channel_id),
  INDEX idx_teacher_id (teacher_id),
  CONSTRAINT fk_live_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_live_orders_channel FOREIGN KEY (channel_id) REFERENCES live_channels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 