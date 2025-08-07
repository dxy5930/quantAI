#!/usr/bin/env python3
"""
简化版的 WorkflowMessage 字段修复脚本
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'python-analysis-service'))

from sqlalchemy import text
from models.database import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_fields_simple():
    """简单直接添加字段"""
    try:
        with engine.begin() as connection:
            logger.info("开始添加 WorkflowMessage 字段...")
            
            # 尝试添加 created_at 字段
            try:
                connection.execute(text("""
                    ALTER TABLE workflow_messages 
                    ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                """))
                logger.info("✅ created_at 字段添加成功")
            except Exception as e:
                if "Duplicate column name" in str(e):
                    logger.info("✅ created_at 字段已存在")
                else:
                    logger.warning(f"created_at 字段添加失败: {e}")
            
            # 尝试添加 updated_at 字段
            try:
                connection.execute(text("""
                    ALTER TABLE workflow_messages 
                    ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                """))
                logger.info("✅ updated_at 字段添加成功")
            except Exception as e:
                if "Duplicate column name" in str(e):
                    logger.info("✅ updated_at 字段已存在")
                else:
                    logger.warning(f"updated_at 字段添加失败: {e}")
            
            # 为现有数据设置值
            try:
                result = connection.execute(text("""
                    UPDATE workflow_messages 
                    SET created_at = COALESCE(created_at, timestamp),
                        updated_at = COALESCE(updated_at, timestamp)
                    WHERE created_at IS NULL OR updated_at IS NULL
                """))
                logger.info(f"✅ 更新现有数据完成，影响 {result.rowcount} 行")
            except Exception as e:
                logger.warning(f"更新现有数据失败: {e}")
            
            # 验证字段
            result = connection.execute(text("""
                SHOW COLUMNS FROM workflow_messages LIKE '%_at'
            """))
            
            columns = result.fetchall()
            logger.info("工作流消息表的时间字段:")
            for col in columns:
                logger.info(f"  {col[0]}: {col[1]}")
                
            logger.info("🎉 字段修复完成!")
            
    except Exception as e:
        logger.error(f"❌ 修复失败: {e}")
        raise

def test_api():
    """测试API是否正常工作"""
    try:
        import requests
        
        # 测试获取工作流历史
        response = requests.get("http://localhost:8000/api/v1/workflows", timeout=5)
        if response.status_code == 200:
            logger.info("✅ API测试成功")
            return True
        else:
            logger.warning(f"⚠️ API返回状态码: {response.status_code}")
            return False
    except Exception as e:
        logger.warning(f"⚠️ API测试失败: {e}")
        return False

if __name__ == "__main__":
    logger.info("🔧 开始修复 WorkflowMessage 字段...")
    
    try:
        add_fields_simple()
        
        # 重启Python服务以应用模型更改
        logger.info("📋 请重启Python分析服务以应用模型更改")
        
        logger.info("✅ 修复完成!")
        
    except Exception as e:
        logger.error(f"💥 修复失败: {e}")
        sys.exit(1) 