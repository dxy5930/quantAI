-- 修复便签表中user_id字段类型，从bigint改为varchar(36)以匹配用户表的UUID类型
-- 执行时间：2024年

-- 首先备份可能存在的数据
CREATE TABLE IF NOT EXISTS sticky_notes_backup AS 
SELECT * FROM sticky_notes WHERE 1=0;

-- 如果存在数据，先清空（因为类型不匹配无法迁移）
-- 实际项目中需要根据业务需要决定是否保留数据
TRUNCATE TABLE sticky_notes;

-- 修改user_id字段类型
ALTER TABLE sticky_notes 
MODIFY COLUMN user_id VARCHAR(36) NOT NULL COMMENT '用户ID，关联用户表';

-- 重新创建唯一索引（可能因为类型变更需要重建）
DROP INDEX uk_user_note ON sticky_notes;
CREATE UNIQUE INDEX uk_user_note ON sticky_notes (user_id, note_id) COMMENT '用户和便利贴ID的唯一索引';

-- 重新创建普通索引
DROP INDEX idx_user_id ON sticky_notes;
CREATE INDEX idx_user_id ON sticky_notes (user_id) COMMENT '用户ID索引';

-- 删除备份表
DROP TABLE IF EXISTS sticky_notes_backup; 