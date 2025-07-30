-- 添加密码重置相关字段
-- 迁移文件：005-add-password-reset-fields.sql
-- 创建时间：2024-01-01
-- 描述：为用户表添加密码重置令牌和过期时间字段

-- 添加密码重置令牌字段
ALTER TABLE users ADD COLUMN resetPasswordToken TEXT NULL;

-- 添加密码重置令牌过期时间字段
ALTER TABLE users ADD COLUMN resetPasswordExpires TIMESTAMP NULL;

-- 添加索引以提高查询性能
CREATE INDEX idx_users_reset_password_token ON users(resetPasswordToken);
CREATE INDEX idx_users_reset_password_expires ON users(resetPasswordExpires);

-- 添加注释
COMMENT ON COLUMN users.resetPasswordToken IS '密码重置令牌';
COMMENT ON COLUMN users.resetPasswordExpires IS '密码重置令牌过期时间'; 