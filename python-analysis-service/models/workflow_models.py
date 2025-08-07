from sqlalchemy import Column, String, Integer, Text, DECIMAL, TIMESTAMP, JSON, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid
from .database import Base

class WorkflowStatus(enum.Enum):
    RUNNING = 'running'
    COMPLETED = 'completed'
    FAILED = 'failed'
    PAUSED = 'paused'

class StepCategory(enum.Enum):
    ANALYSIS = 'analysis'
    STRATEGY = 'strategy'
    GENERAL = 'general'
    RESULT = 'result'
    ERROR = 'error'

class ResourceTypeEnum(enum.Enum):
    BROWSER = 'browser'
    DATABASE = 'database'
    API = 'api'
    GENERAL = 'general'

class StepStatus(enum.Enum):
    PENDING = 'pending'
    RUNNING = 'running'
    COMPLETED = 'completed'
    FAILED = 'failed'

class WorkflowResourceType(enum.Enum):
    WEB = 'web'
    DATABASE = 'database'
    API = 'api'
    FILE = 'file'
    CHART = 'chart'
    GENERAL = 'general'

class MessageType(enum.Enum):
    USER = 'user'
    SYSTEM = 'system'
    TASK = 'task'
    RESULT = 'result'
    ASSISTANT = 'assistant'

class WorkflowInstance(Base):
    __tablename__ = 'workflow_instances'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(WorkflowStatus, name='workflowstatus'), default=WorkflowStatus.RUNNING)
    progress_percentage = Column(DECIMAL(5, 2), default=0.00)
    current_step = Column(Integer, default=0)
    total_steps = Column(Integer, default=0)
    start_time = Column(TIMESTAMP, default=datetime.utcnow)
    end_time = Column(TIMESTAMP, nullable=True)
    last_activity = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    context_data = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    is_deleted = Column(Integer, default=0)  # 软删除标记：0=正常，1=已删除
    deleted_at = Column(TIMESTAMP, nullable=True)  # 删除时间
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    steps = relationship("WorkflowStep", back_populates="workflow", cascade="all, delete-orphan")
    resources = relationship("WorkflowResource", back_populates="workflow", cascade="all, delete-orphan")
    messages = relationship("WorkflowMessage", back_populates="workflow", cascade="all, delete-orphan")

class WorkflowStep(Base):
    __tablename__ = 'workflow_steps'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_id = Column(String(36), ForeignKey('workflow_instances.id', ondelete='CASCADE'), nullable=False)
    step_number = Column(Integer, nullable=False)
    step_id = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(SQLEnum(StepCategory, name='stepcategory'), default=StepCategory.GENERAL)
    resource_type = Column(SQLEnum(ResourceTypeEnum, name='resourcetypeenum'), default=ResourceTypeEnum.GENERAL)
    status = Column(SQLEnum(StepStatus, name='stepstatus'), default=StepStatus.PENDING)
    start_time = Column(TIMESTAMP, nullable=True)
    end_time = Column(TIMESTAMP, nullable=True)
    execution_details = Column(JSON, nullable=True)
    results = Column(JSON, nullable=True)
    urls = Column(JSON, nullable=True)
    files = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    workflow = relationship("WorkflowInstance", back_populates="steps")

class WorkflowResource(Base):
    __tablename__ = 'workflow_resources'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_id = Column(String(36), ForeignKey('workflow_instances.id', ondelete='CASCADE'), nullable=False)
    step_id = Column(String(36), ForeignKey('workflow_steps.id', ondelete='SET NULL'), nullable=True)
    resource_type = Column(SQLEnum(WorkflowResourceType, name='workflowresourcetype'), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    data = Column(JSON, nullable=False)
    category = Column(String(100), nullable=True)
    source_step_id = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    workflow = relationship("WorkflowInstance", back_populates="resources")

class WorkflowMessage(Base):
    __tablename__ = 'workflow_messages'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_id = Column(String(36), ForeignKey('workflow_instances.id', ondelete='CASCADE'), nullable=False)
    message_id = Column(String(255), nullable=False)
    message_type = Column(SQLEnum(MessageType, name='messagetype'), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(String(50), nullable=True)
    data = Column(JSON, nullable=True)
    timestamp = Column(TIMESTAMP, default=datetime.utcnow)
    
    # 关联关系
    workflow = relationship("WorkflowInstance", back_populates="messages")

class WorkflowFavorite(Base):
    __tablename__ = 'workflow_favorites'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), nullable=False)
    workflow_id = Column(String(36), ForeignKey('workflow_instances.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow) 