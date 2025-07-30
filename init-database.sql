-- FindValue 数据库初始化脚本
-- 在宝塔面板 MySQL 中执行

-- 创建数据库
CREATE DATABASE IF NOT EXISTS find_value CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER IF NOT EXISTS 'find_value_user'@'localhost' IDENTIFIED BY 'FindValue123';
CREATE USER IF NOT EXISTS 'find_value_user'@'%' IDENTIFIED BY 'FindValue123';

-- 授权
GRANT ALL PRIVILEGES ON find_value.* TO 'find_value_user'@'localhost';
GRANT ALL PRIVILEGES ON find_value.* TO 'find_value_user'@'%';

-- 刷新权限
FLUSH PRIVILEGES;

-- 使用数据库
USE find_value;

-- 显示创建结果
SELECT 'Database find_value created successfully' as status;
SHOW GRANTS FOR 'find_value_user'@'localhost';