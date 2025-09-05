-- 027-seed-live-channels.sql
-- 目的：为 live_channels 表插入一些默认频道数据（幂等）

-- 强制当前会话使用 utf8mb4，避免中文插入报错 1366
SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results = utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

-- 确保表存在（若使用自动建表，可忽略此段。此处仅防御，不会覆盖已存在表）
CREATE TABLE IF NOT EXISTS live_channels (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  stream_url TEXT NOT NULL,
  room VARCHAR(128) NULL,
  `order` INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 再次确保该表字符集/排序规则为 utf8mb4（处理历史已存在且字符集不一致的情况）
ALTER TABLE live_channels CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 插入默认数据（如果不存在）
INSERT INTO live_channels (id, name, stream_url, room, `order`, is_active)
SELECT 'market', '市场直播', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'room_market', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM live_channels WHERE id = 'market');

-- 替换不可用的 pts_dash 测试地址为稳定 HLS 源
INSERT INTO live_channels (id, name, stream_url, room, `order`, is_active)
SELECT 'edu', '教学频道', 'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/hls.m3u8', 'room_edu', 2, 1
WHERE NOT EXISTS (SELECT 1 FROM live_channels WHERE id = 'edu');

-- 替换 news 为另一条稳定 HLS 源
INSERT INTO live_channels (id, name, stream_url, room, `order`, is_active)
SELECT 'news', '财经快讯', 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8', 'room_news', 3, 1
WHERE NOT EXISTS (SELECT 1 FROM live_channels WHERE id = 'news'); 