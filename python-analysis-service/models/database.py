"""
数据库连接和基础配置
"""

from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import config
import logging

logger = logging.getLogger(__name__)

# 创建数据库引擎 - 添加 MySQL 特定配置
engine = create_engine(
    config.DATABASE_URL,
    echo=config.DEBUG,
    pool_pre_ping=True,
    pool_recycle=300,
    # MySQL 特定配置
    connect_args={
        "charset": "utf8mb4",
        "use_unicode": True
    }
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基础模型类
Base = declarative_base()

# 元数据
metadata = MetaData()

def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_database_connection():
    """测试数据库连接"""
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            result.fetchone()
            logger.info("数据库连接测试成功")
            return True
    except Exception as e:
        logger.error(f"数据库连接测试失败: {str(e)}")
        return False

def create_tables_safely():
    """安全地按依赖顺序创建表 - 只在表不存在时创建"""
    try:
        # 检查是否已有表存在
        with engine.connect() as conn:
            existing_tables = conn.execute(text("SHOW TABLES")).fetchall()
            table_names = [table[0] for table in existing_tables]
            
            # 检查核心表是否存在
            core_tables = ['users', 'workflow_instances', 'workflow_steps', 'workflow_messages']
            existing_core_tables = [t for t in core_tables if t in table_names]
            
            if existing_core_tables:
                logger.info(f"数据库表已存在: {table_names}")
                logger.info("跳过表创建，使用现有数据库结构")
                return True
        
        # 如果没有核心表，则创建所有表
        logger.info("未找到核心表，开始创建数据库表...")
        
        # 使用 SQLAlchemy 创建所有表
        Base.metadata.create_all(bind=engine)
        
        # 验证表创建
        with engine.connect() as conn:
            tables = conn.execute(text("SHOW TABLES")).fetchall()
            table_names = [table[0] for table in tables]
            logger.info(f"已创建的表: {table_names}")
            
        return True
        
    except Exception as e:
        logger.error(f"创建表失败: {str(e)}")
        return False

def init_database():
    """初始化数据库"""
    try:
        # 先测试数据库连接
        if not test_database_connection():
            logger.warning("数据库连接失败，跳过数据库初始化")
            return
        
        logger.info("开始数据库初始化...")
        
        # 安全地创建表
        if create_tables_safely():
            logger.info("数据库初始化成功")
        else:
            logger.warning("数据库表创建失败，但应用将继续运行")
            
    except Exception as e:
        logger.error(f"数据库初始化失败: {str(e)}")
        logger.warning("数据库初始化失败，但应用将继续运行")