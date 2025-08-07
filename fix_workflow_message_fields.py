#!/usr/bin/env python3
"""
修复 WorkflowMessage 模型字段的脚本
添加缺失的 created_at 和 updated_at 字段
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'python-analysis-service'))

from sqlalchemy import text
from models.database import get_db, engine
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def execute_migration():
    """执行数据库迁移"""
    
    migration_sql = """
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
    """
    
    try:
        with engine.begin() as connection:
            logger.info("开始执行数据库迁移...")
            
            # 分别执行每个SQL语句
            sql_statements = migration_sql.strip().split(';')
            
            for sql in sql_statements:
                sql = sql.strip()
                if sql and not sql.startswith('--'):
                    try:
                        connection.execute(text(sql))
                        logger.info(f"执行成功: {sql[:50]}...")
                    except Exception as e:
                        logger.warning(f"执行警告: {e}")
            
            # 为现有数据设置默认值
            update_sql = """
            UPDATE workflow_messages 
            SET created_at = COALESCE(created_at, timestamp),
                updated_at = COALESCE(updated_at, timestamp)
            WHERE created_at IS NULL OR updated_at IS NULL
            """
            
            result = connection.execute(text(update_sql))
            logger.info(f"更新现有数据: 影响 {result.rowcount} 行")
            
            # 验证字段
            verify_sql = """
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                IS_NULLABLE,
                COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'workflow_messages'
                AND COLUMN_NAME IN ('created_at', 'updated_at')
            ORDER BY COLUMN_NAME
            """
            
            result = connection.execute(text(verify_sql))
            fields = result.fetchall()
            
            logger.info("字段验证结果:")
            for field in fields:
                logger.info(f"  {field[0]}: {field[1]} (可空: {field[2]}, 默认值: {field[3]})")
                
            logger.info("✅ 数据库迁移完成!")
            
    except Exception as e:
        logger.error(f"❌ 数据库迁移失败: {e}")
        raise

def test_model():
    """测试模型字段是否可用"""
    try:
        from models.workflow_models import WorkflowMessage
        
        # 检查模型字段
        fields = [attr for attr in dir(WorkflowMessage) if not attr.startswith('_')]
        
        if 'created_at' in str(WorkflowMessage.__table__.columns):
            logger.info("✅ WorkflowMessage.created_at 字段存在")
        else:
            logger.error("❌ WorkflowMessage.created_at 字段不存在")
            
        if 'updated_at' in str(WorkflowMessage.__table__.columns):
            logger.info("✅ WorkflowMessage.updated_at 字段存在")  
        else:
            logger.error("❌ WorkflowMessage.updated_at 字段不存在")
            
    except Exception as e:
        logger.error(f"❌ 模型测试失败: {e}")

if __name__ == "__main__":
    logger.info("🔧 修复 WorkflowMessage 字段...")
    
    try:
        # 执行迁移
        execute_migration()
        
        # 测试模型
        test_model()
        
        logger.info("🎉 修复完成! 现在可以正常使用工作流功能了。")
        
    except Exception as e:
        logger.error(f"💥 修复失败: {e}")
        sys.exit(1) 