-- 设置字符集，确保中文字符正确处理
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 创建便利贴笔记表
CREATE TABLE IF NOT EXISTS `sticky_notes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '笔记ID，主键',
  `user_id` bigint(20) unsigned NOT NULL COMMENT '用户ID，关联用户表',
  `note_id` varchar(100) NOT NULL COMMENT '便利贴唯一标识符',
  `title` varchar(255) NOT NULL DEFAULT 'My Sticky Note' COMMENT '笔记标题',
  `content` longtext NULL COMMENT '笔记内容，支持富文本HTML格式',
  `position_x` int(11) NOT NULL DEFAULT 100 COMMENT '便利贴X坐标位置',
  `position_y` int(11) NOT NULL DEFAULT 100 COMMENT '便利贴Y坐标位置',
  `width` int(11) NOT NULL DEFAULT 400 COMMENT '便利贴宽度',
  `height` int(11) NOT NULL DEFAULT 300 COMMENT '便利贴高度',
  `color` enum('yellow','pink','blue','green','orange') NOT NULL DEFAULT 'yellow' COMMENT '便利贴颜色主题',
  `is_minimized` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否最小化，0-展开，1-最小化',
  `z_index` int(11) NOT NULL DEFAULT 1 COMMENT '层级索引，用于控制显示顺序',
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否删除，0-未删除，1-已删除',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_note` (`user_id`, `note_id`) COMMENT '用户和便利贴ID的唯一索引',
  KEY `idx_user_id` (`user_id`) COMMENT '用户ID索引',
  KEY `idx_created_at` (`created_at`) COMMENT '创建时间索引',
  KEY `idx_updated_at` (`updated_at`) COMMENT '更新时间索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='便利贴笔记表，存储用户的便利贴数据';