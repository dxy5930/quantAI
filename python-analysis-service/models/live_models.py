from sqlalchemy import Column, String, Text, TIMESTAMP, Boolean, Integer, text, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Teacher(Base):
    __tablename__ = 'teachers'

    id = Column(String(64), primary_key=True, comment='老师ID')
    name = Column(String(255), nullable=False, comment='老师姓名')
    avatar = Column(String(500), nullable=True, comment='头像')
    bio = Column(Text, nullable=True, comment='简介')
    is_active = Column(Boolean, default=True, nullable=False, comment='是否启用')

    created_at = Column(TIMESTAMP, nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(TIMESTAMP, nullable=False, server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))

class LiveChannel(Base):
    __tablename__ = 'live_channels'

    id = Column(String(64), primary_key=True, comment='频道ID')
    name = Column(String(255), nullable=False, comment='频道名称')
    teacher_id = Column(String(64), ForeignKey('teachers.id', ondelete='SET NULL'), nullable=True, comment='所属老师')
    stream_url = Column(Text, nullable=False, comment='HLS/MPEG-DASH等播放地址')
    room = Column(String(128), nullable=True, comment='聊天室房间标识')
    order = Column(Integer, default=0, nullable=False, comment='排序')
    is_active = Column(Boolean, default=True, nullable=False, comment='是否启用')

    created_at = Column(TIMESTAMP, nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(TIMESTAMP, nullable=False, server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))

    teacher = relationship('Teacher', lazy='joined')

class UserTeacherSubscription(Base):
    __tablename__ = 'user_teacher_subscriptions'

    id = Column(String(64), primary_key=True, comment='订阅ID')
    user_id = Column(String(36), nullable=False, comment='用户ID')
    teacher_id = Column(String(64), ForeignKey('teachers.id', ondelete='CASCADE'), nullable=False, comment='老师ID')
    start_at = Column(TIMESTAMP, nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    end_at = Column(TIMESTAMP, nullable=False, comment='订阅到期时间')

    created_at = Column(TIMESTAMP, nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(TIMESTAMP, nullable=False, server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))

    teacher = relationship('Teacher', lazy='joined')

class LiveOrder(Base):
    __tablename__ = 'live_orders'

    id = Column(String(64), primary_key=True, comment='订单ID')
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, comment='用户ID')
    channel_id = Column(String(64), ForeignKey('live_channels.id', ondelete='CASCADE'), nullable=False, comment='频道ID')
    teacher_id = Column(String(64), nullable=True, comment='老师ID（频道即老师时等于频道ID或映射ID）')
    duration_days = Column(Integer, nullable=False, comment='订阅时长（天）')
    amount_cents = Column(Integer, nullable=False, comment='订单金额（分）')
    currency = Column(String(10), nullable=False, default='CNY', comment='货币')
    pay_method = Column(String(20), nullable=True, comment='支付方式')
    status = Column(String(20), nullable=False, default='PENDING', comment='订单状态 PENDING/PAID/CANCELED')

    created_at = Column(TIMESTAMP, nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(TIMESTAMP, nullable=False, server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
    paid_at = Column(TIMESTAMP, nullable=True)
    expires_at = Column(TIMESTAMP, nullable=True, comment='该订单带来的订阅到期时间') 