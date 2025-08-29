from sqlalchemy import Column, String, Integer, Text, TIMESTAMP, JSON, Boolean, ForeignKey, text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from .database import Base

class User(Base):
    __tablename__ = 'users'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    avatar = Column(String(500), nullable=True)
    role = Column(String(20), default='user')
    level = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, nullable=True, server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(TIMESTAMP, nullable=True, server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
    last_login_at = Column(TIMESTAMP, nullable=True)
    
    # 个人资料字段
    display_name = Column(String(100), nullable=True)
    trading_experience = Column(String(20), nullable=True)  # beginner, intermediate, advanced, expert
    risk_tolerance = Column(String(20), nullable=True)  # low, medium, high
    
    # 密码重置相关字段
    reset_token = Column(String(255), nullable=True)
    reset_token_expires = Column(TIMESTAMP, nullable=True)
    
    # 关联关系
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class Notification(Base):
    __tablename__ = 'notifications'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    # 修复外键定义，确保类型匹配
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # info, success, warning, error
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    data = Column(JSON, nullable=True)  # 附加数据
    created_at = Column(TIMESTAMP, nullable=True, server_default=text('CURRENT_TIMESTAMP'))
    
    # 关联关系
    user = relationship("User", back_populates="notifications")

class UserSession(Base):
    __tablename__ = 'user_sessions'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    token = Column(String(500), nullable=False)  # 访问令牌
    refresh_token = Column(String(500), nullable=False)  # 刷新令牌
    expires_at = Column(TIMESTAMP, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(TIMESTAMP, nullable=True, server_default=text('CURRENT_TIMESTAMP'))
    last_used_at = Column(TIMESTAMP, nullable=True)
    user_agent = Column(String(500), nullable=True)
    ip_address = Column(String(45), nullable=True)
    
    # 关联关系
    user = relationship("User") 