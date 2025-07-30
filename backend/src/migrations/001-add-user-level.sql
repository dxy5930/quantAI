-- 添加用户等级字段的迁移脚本
-- 执行时间：2024-01-01
-- 描述：为用户表添加用户等级字段，用于区分不同等级的用户权限

-- 1. 为用户表添加用户等级字段
ALTER TABLE users 
ADD COLUMN level INT NOT NULL DEFAULT 1 COMMENT '用户等级：1-普通用户，2-高级用户，3-超级用户';

-- 2. 为现有用户设置默认等级
UPDATE users SET level = 1 WHERE level IS NULL;

-- 3. 添加索引以提高查询性能
CREATE INDEX idx_users_level ON users(level);

-- 4. 为所有表添加注释（如果数据库支持）
ALTER TABLE users COMMENT = '用户信息表，存储系统用户的基本信息、权限、个人资料等数据';
ALTER TABLE strategies COMMENT = '策略信息表，存储用户创建的交易策略信息，包括选股策略和回测策略';
ALTER TABLE backtest_history COMMENT = '回测历史表，存储用户执行回测的历史记录，包括回测配置、结果、状态等信息';

-- 5. 验证数据完整性
-- 检查是否有用户等级字段为空的记录
SELECT COUNT(*) as null_level_count FROM users WHERE level IS NULL;

-- 检查用户等级分布
SELECT 
    level,
    COUNT(*) as user_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users), 2) as percentage
FROM users 
GROUP BY level 
ORDER BY level;

-- 6. 创建用户等级权限视图（可选）
CREATE VIEW user_level_permissions AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.level,
    CASE 
        WHEN u.level = 1 THEN '普通用户'
        WHEN u.level = 2 THEN '高级用户'
        WHEN u.level = 3 THEN '超级用户'
        ELSE '未知等级'
    END as level_name,
    CASE 
        WHEN u.level = 1 THEN 10
        WHEN u.level = 2 THEN 50
        WHEN u.level = 3 THEN -1
        ELSE 0
    END as max_strategies,
    CASE 
        WHEN u.level = 1 THEN 20
        WHEN u.level = 2 THEN 100
        WHEN u.level = 3 THEN -1
        ELSE 0
    END as max_backtest_per_day,
    CASE 
        WHEN u.level >= 2 THEN 1
        ELSE 0
    END as can_share_strategy,
    CASE 
        WHEN u.level >= 2 THEN 1
        ELSE 0
    END as can_export_data,
    CASE 
        WHEN u.level >= 2 THEN 1
        ELSE 0
    END as can_access_premium_features
FROM users u;

-- 7. 创建用户等级统计函数（可选）
DELIMITER $$

CREATE FUNCTION get_user_level_stats()
RETURNS JSON
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE result JSON;
    
    SELECT JSON_OBJECT(
        'total_users', COUNT(*),
        'normal_users', SUM(CASE WHEN level = 1 THEN 1 ELSE 0 END),
        'premium_users', SUM(CASE WHEN level = 2 THEN 1 ELSE 0 END),
        'super_users', SUM(CASE WHEN level = 3 THEN 1 ELSE 0 END),
        'normal_percentage', ROUND(SUM(CASE WHEN level = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2),
        'premium_percentage', ROUND(SUM(CASE WHEN level = 2 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2),
        'super_percentage', ROUND(SUM(CASE WHEN level = 3 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2)
    ) INTO result
    FROM users;
    
    RETURN result;
END$$

DELIMITER ;

-- 8. 插入一些测试数据（可选，仅用于开发环境）
-- INSERT INTO users (username, email, password, level) VALUES
-- ('test_premium', 'premium@test.com', 'hashed_password', 2),
-- ('test_super', 'super@test.com', 'hashed_password', 3);

-- 迁移完成提示
SELECT 'User level migration completed successfully!' as message; 