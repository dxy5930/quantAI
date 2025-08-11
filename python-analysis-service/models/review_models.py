from sqlalchemy import Column, String, Text, TIMESTAMP, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from .database import Base

class ReviewStatus(str, enum.Enum):
  DRAFT = 'draft'
  COMPLETED = 'completed'

class Review(Base):
  __tablename__ = 'reviews'

  id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
  user_id = Column(String(36), nullable=False, index=True, comment='用户ID')
  review_id = Column(String(100), nullable=False, index=True, comment='复盘业务ID')
  title = Column(String(255), nullable=False, default='交易复盘', comment='标题')
  review_date = Column(String(20), nullable=True, comment='复盘日期YYYY-MM-DD')
  status = Column(Enum(ReviewStatus), nullable=False, default=ReviewStatus.DRAFT, comment='状态')
  content = Column(Text, nullable=True, comment='Markdown内容')
  summary = Column(Text, nullable=True, comment='摘要')
  is_deleted = Column(Boolean, default=False, nullable=False, comment='软删除')
  created_at = Column(TIMESTAMP, default=datetime.utcnow, nullable=True)
  updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True) 