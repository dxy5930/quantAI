-- 更新用户表的avatar字段，支持base64数据存储
-- 将varchar类型改为text类型以支持更长的base64字符串

-- 修改avatar字段类型为text
ALTER TABLE users MODIFY COLUMN avatar TEXT COMMENT '用户头像URL地址或base64编码的图片数据';