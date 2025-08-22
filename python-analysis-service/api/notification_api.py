from fastapi import APIRouter, HTTPException, Depends, status, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

from models.database import get_db
from models.user_models import User, Notification
from api.auth_api import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])

# Pydantic模型
class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    read: bool
    created_at: str
    data: Optional[dict] = None

class NotificationListRequest(BaseModel):
    page: Optional[int] = 1
    limit: Optional[int] = 20
    type: Optional[str] = None
    read: Optional[bool] = None

class BatchDeleteRequest(BaseModel):
    ids: List[str]

# 工具函数
def get_current_user_from_token(request: Request, db: Session) -> User:
    """从请求中获取当前用户"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="未提供认证令牌")
    
    token = auth_header.split(" ")[1]
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="无效的令牌")
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="令牌已过期")
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="无效的令牌")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="用户不存在或已被禁用")
    
    return user

def notification_to_dict(notification: Notification) -> dict:
    """将通知对象转换为字典"""
    return {
        "id": notification.id,
        "type": notification.type,
        "title": notification.title,
        "message": notification.message,
        "read": notification.is_read,
        "created_at": notification.created_at.isoformat() if notification.created_at else None,
        "data": notification.data
    }

@router.post("")
async def get_notifications(
    request: Request,
    params: NotificationListRequest = None,
    db: Session = Depends(get_db)
):
    """获取通知列表"""
    try:
        user = get_current_user_from_token(request, db)
        
        if params is None:
            params = NotificationListRequest()
        
        # 构建查询
        query = db.query(Notification).filter(Notification.user_id == user.id)
        
        # 按类型筛选
        if params.type:
            query = query.filter(Notification.type == params.type)
        
        # 按已读状态筛选
        if params.read is not None:
            query = query.filter(Notification.is_read == params.read)
        
        # 排序
        query = query.order_by(desc(Notification.created_at))
        
        # 分页
        offset = (params.page - 1) * params.limit if params.page > 0 else 0
        total = query.count()
        notifications = query.offset(offset).limit(params.limit).all()
        
        return {
            "data": [notification_to_dict(n) for n in notifications],
            "total": total,
            "page": params.page,
            "limit": params.limit,
            "total_pages": (total + params.limit - 1) // params.limit
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取通知列表失败: {str(e)}")

@router.post("/{notification_id}")
async def get_notification_by_id(
    notification_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """根据ID获取通知详情"""
    try:
        user = get_current_user_from_token(request, db)
        
        notification = db.query(Notification).filter(
            and_(
                Notification.id == notification_id,
                Notification.user_id == user.id
            )
        ).first()
        
        if not notification:
            raise HTTPException(status_code=404, detail="通知不存在")
        
        return notification_to_dict(notification)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取通知详情失败: {str(e)}")

@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """标记通知为已读"""
    try:
        user = get_current_user_from_token(request, db)
        
        notification = db.query(Notification).filter(
            and_(
                Notification.id == notification_id,
                Notification.user_id == user.id
            )
        ).first()
        
        if not notification:
            raise HTTPException(status_code=404, detail="通知不存在")
        
        notification.is_read = True
        db.commit()
        
        return {"message": "通知已标记为已读"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"标记通知失败: {str(e)}")

@router.put("/read-all")
async def mark_all_as_read(request: Request, db: Session = Depends(get_db)):
    """标记所有通知为已读"""
    try:
        user = get_current_user_from_token(request, db)
        
        # 更新所有未读通知
        db.query(Notification).filter(
            and_(
                Notification.user_id == user.id,
                Notification.is_read == False
            )
        ).update({"is_read": True})
        
        db.commit()
        
        return {"message": "所有通知已标记为已读"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"标记所有通知失败: {str(e)}")

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """删除通知"""
    try:
        user = get_current_user_from_token(request, db)
        
        notification = db.query(Notification).filter(
            and_(
                Notification.id == notification_id,
                Notification.user_id == user.id
            )
        ).first()
        
        if not notification:
            raise HTTPException(status_code=404, detail="通知不存在")
        
        db.delete(notification)
        db.commit()
        
        return {"message": "通知已删除"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"删除通知失败: {str(e)}")

@router.post("/batch-delete")
async def batch_delete_notifications(
    request: Request,
    delete_request: BatchDeleteRequest,
    db: Session = Depends(get_db)
):
    """批量删除通知"""
    try:
        user = get_current_user_from_token(request, db)
        
        # 查找用户的通知
        notifications = db.query(Notification).filter(
            and_(
                Notification.id.in_(delete_request.ids),
                Notification.user_id == user.id
            )
        ).all()
        
        if not notifications:
            raise HTTPException(status_code=404, detail="未找到要删除的通知")
        
        # 删除通知
        for notification in notifications:
            db.delete(notification)
        
        db.commit()
        
        return {"message": f"已删除 {len(notifications)} 条通知"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"批量删除通知失败: {str(e)}")

@router.post("/unread-count")
async def get_unread_count(request: Request, db: Session = Depends(get_db)):
    """获取未读通知数量"""
    try:
        user = get_current_user_from_token(request, db)
        
        count = db.query(Notification).filter(
            and_(
                Notification.user_id == user.id,
                Notification.is_read == False
            )
        ).count()
        
        return {"count": count}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取未读通知数量失败: {str(e)}")

# 创建通知的辅助函数（供其他模块调用）
def create_notification(
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
    data: dict = None,
    db: Session = None
) -> Notification:
    """创建新通知"""
    if db is None:
        # 如果没有传入数据库会话，创建一个新的
        from models.database import SessionLocal
        db = SessionLocal()
        should_close = True
    else:
        should_close = False
    
    try:
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            data=data
        )
        
        db.add(notification)
        db.commit()
        db.refresh(notification)
        
        return notification
        
    except Exception as e:
        db.rollback()
        raise e
    finally:
        if should_close:
            db.close() 