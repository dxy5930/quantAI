"""
多维表格数据库模型
Database Models for Multi-dimensional Table System
"""

from sqlalchemy import Column, String, Text, TIMESTAMP, Boolean, Integer, ForeignKey, JSON, text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from .database import Base

class ReviewDatabase(Base):
    """复盘多维表格数据库表"""
    __tablename__ = 'review_databases'
    
    id = Column(String(100), primary_key=True, comment='数据库ID，通常格式为review-{uuid}')
    name = Column(String(255), nullable=False, comment='数据库名称')
    description = Column(Text, nullable=True, comment='数据库描述')
    icon = Column(String(50), nullable=True, default='📊', comment='数据库图标')
    user_id = Column(String(36), nullable=True, comment='用户ID，可为null支持匿名访问')
    template_id = Column(String(50), nullable=True, comment='模板ID')
    
    # 数据库结构定义（JSON格式存储）
    fields = Column(JSON, nullable=False, comment='字段定义JSON')
    views = Column(JSON, nullable=False, comment='视图定义JSON')
    settings = Column(JSON, nullable=True, comment='数据库设置JSON')
    
    # 时间戳
    created_at = Column(TIMESTAMP, nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(TIMESTAMP, nullable=False, server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
    
    # 软删除
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # 关联关系
    records = relationship("ReviewDatabaseRecord", back_populates="database", cascade="all, delete-orphan")


class ReviewDatabaseRecord(Base):
    """复盘多维表格记录表"""
    __tablename__ = 'review_database_records'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), comment='记录ID')
    database_id = Column(String(100), ForeignKey('review_databases.id'), nullable=False, comment='数据库ID')
    
    # 记录数据（JSON格式存储）
    data = Column(JSON, nullable=False, comment='记录数据JSON，key为字段ID，value为字段值')
    
    # 时间戳
    created_at = Column(TIMESTAMP, nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(TIMESTAMP, nullable=False, server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
    
    # 软删除
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # 关联关系
    database = relationship("ReviewDatabase", back_populates="records")


class ReviewDatabaseTemplate(Base):
    """复盘数据库模板表"""
    __tablename__ = 'review_database_templates'
    
    id = Column(String(50), primary_key=True, comment='模板ID')
    name = Column(String(255), nullable=False, comment='模板名称')
    description = Column(Text, nullable=True, comment='模板描述')
    icon = Column(String(50), nullable=True, comment='模板图标')
    category = Column(String(50), nullable=True, comment='模板分类')
    
    # 模板结构定义（JSON格式存储）
    fields = Column(JSON, nullable=False, comment='字段定义JSON')
    views = Column(JSON, nullable=False, comment='视图定义JSON')
    sample_data = Column(JSON, nullable=True, comment='示例数据JSON')
    settings = Column(JSON, nullable=True, comment='默认设置JSON')
    
    # 模板属性
    is_builtin = Column(Boolean, default=True, nullable=False, comment='是否为内置模板')
    is_public = Column(Boolean, default=True, nullable=False, comment='是否为公开模板')
    sort_order = Column(Integer, default=0, nullable=False, comment='排序顺序')
    
    # 时间戳
    created_at = Column(TIMESTAMP, nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(TIMESTAMP, nullable=False, server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
    
    # 软删除
    is_deleted = Column(Boolean, default=False, nullable=False)