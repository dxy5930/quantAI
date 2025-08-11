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
    """增量创建缺失的表（如果某些表已存在，仍会为缺失表执行创建）"""
    try:
        with engine.connect() as conn:
            existing_tables = conn.execute(text("SHOW TABLES")).fetchall()
            existing_table_names = {row[0] for row in existing_tables}

        # Base.metadata.tables 中包含了所有已声明模型的表
        declared_table_names = list(Base.metadata.tables.keys())
        missing_table_objects = [
            Base.metadata.tables[name]
            for name in declared_table_names
            if name not in existing_table_names
        ]

        if not missing_table_objects:
            logger.info("未发现缺失表，跳过创建")
            return True

        logger.info(f"发现缺失表: {[t.name for t in missing_table_objects]}，开始创建...")
        # 仅创建缺失的表
        Base.metadata.create_all(bind=engine, tables=missing_table_objects)

        # 校验
        with engine.connect() as conn:
            tables = conn.execute(text("SHOW TABLES")).fetchall()
            table_names = [table[0] for table in tables]
            logger.info(f"当前数据库表: {table_names}")
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
        
        # 增量创建缺失表
        if create_tables_safely():
            logger.info("数据库初始化成功")
        else:
            logger.warning("数据库表创建失败，但应用将继续运行")
            
    except Exception as e:
        logger.error(f"数据库初始化失败: {str(e)}")
        logger.warning("数据库初始化失败，但应用将继续运行")