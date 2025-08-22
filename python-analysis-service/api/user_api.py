from fastapi import APIRouter, HTTPException, Depends, status, Request, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import bcrypt
import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
import os
import uuid
from PIL import Image

from models.database import get_db
from models.user_models import User
from api.auth_api import SECRET_KEY, ALGORITHM, verify_password, hash_password

router = APIRouter(prefix="/api/v1/users", tags=["users"])

# Pydantic模型
class UpdateProfileRequest(BaseModel):
    displayName: Optional[str] = None
    tradingExperience: Optional[str] = None
    riskTolerance: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str
    confirmPassword: str

class UserStatsResponse(BaseModel):
    totalWorkflows: int
    completedWorkflows: int
    totalTasks: int
    lastLoginAt: Optional[str] = None

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

def user_to_dict(user: User) -> dict:
    """将用户对象转换为字典"""
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "avatar": user.avatar,
        "role": user.role,
        "level": user.level,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
        "profile": {
            "displayName": user.display_name,
            "tradingExperience": user.trading_experience,
            "riskTolerance": user.risk_tolerance
        }
    }

@router.post("/profile")
async def get_profile(request: Request, db: Session = Depends(get_db)):
    """获取用户资料"""
    try:
        user = get_current_user_from_token(request, db)
        return user_to_dict(user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取用户资料失败: {str(e)}")

@router.post("/profile/options")
async def get_profile_options():
    """获取用户资料选项"""
    return {
        "tradingExperience": [
            {"value": "beginner", "label": "初学者"},
            {"value": "intermediate", "label": "中级"},
            {"value": "advanced", "label": "高级"},
            {"value": "expert", "label": "专家"}
        ],
        "riskTolerance": [
            {"value": "low", "label": "低风险"},
            {"value": "medium", "label": "中等风险"},
            {"value": "high", "label": "高风险"}
        ]
    }

@router.put("/profile")
async def update_profile(
    request: Request, 
    profile_data: UpdateProfileRequest, 
    db: Session = Depends(get_db)
):
    """更新用户资料"""
    try:
        user = get_current_user_from_token(request, db)
        
        # 更新用户信息
        if profile_data.displayName is not None:
            user.display_name = profile_data.displayName
        if profile_data.tradingExperience is not None:
            user.trading_experience = profile_data.tradingExperience
        if profile_data.riskTolerance is not None:
            user.risk_tolerance = profile_data.riskTolerance
        if profile_data.email is not None:
            # 检查邮箱是否已被其他用户使用
            existing_user = db.query(User).filter(
                User.email == profile_data.email,
                User.id != user.id
            ).first()
            if existing_user:
                raise HTTPException(status_code=400, detail="邮箱已被其他用户使用")
            user.email = profile_data.email
        if profile_data.avatar is not None:
            user.avatar = profile_data.avatar
        
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
        
        return user_to_dict(user)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"更新用户资料失败: {str(e)}")

@router.post("/stats")
async def get_user_stats(request: Request, db: Session = Depends(get_db)):
    """获取用户统计信息"""
    try:
        user = get_current_user_from_token(request, db)
        
        # TODO: 从工作流表获取实际统计数据
        # 这里先返回模拟数据，后续可以从workflow_instances表获取真实数据
        from models.workflow_models import WorkflowInstance
        
        total_workflows = db.query(WorkflowInstance).filter(
            WorkflowInstance.user_id == user.id,
            WorkflowInstance.is_deleted == 0
        ).count()
        
        completed_workflows = db.query(WorkflowInstance).filter(
            WorkflowInstance.user_id == user.id,
            WorkflowInstance.status == 'completed',
            WorkflowInstance.is_deleted == 0
        ).count()
        
        return {
            "totalWorkflows": total_workflows,
            "completedWorkflows": completed_workflows,
            "totalTasks": total_workflows,  # 暂时使用工作流数量作为任务数量
            "lastLoginAt": user.last_login_at.isoformat() if user.last_login_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取用户统计失败: {str(e)}")

@router.post("/{user_id}")
async def get_user_by_id(user_id: str, request: Request, db: Session = Depends(get_db)):
    """根据ID获取用户信息"""
    try:
        # 验证当前用户权限
        current_user = get_current_user_from_token(request, db)
        
        # 只有管理员或用户本人可以查看详细信息
        if current_user.role != 'admin' and current_user.id != user_id:
            raise HTTPException(status_code=403, detail="没有权限查看此用户信息")
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        return user_to_dict(user)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取用户信息失败: {str(e)}")

@router.post("/avatar")
async def upload_avatar(
    request: Request,
    avatar: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """上传头像"""
    try:
        user = get_current_user_from_token(request, db)
        
        # 验证文件类型
        if not avatar.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="只能上传图片文件")
        
        # 验证文件大小 (5MB)
        max_size = 5 * 1024 * 1024
        avatar_content = await avatar.read()
        if len(avatar_content) > max_size:
            raise HTTPException(status_code=400, detail="文件大小不能超过5MB")
        
        # 创建上传目录
        upload_dir = "uploads/avatars"
        os.makedirs(upload_dir, exist_ok=True)
        
        # 生成唯一文件名
        file_extension = avatar.filename.split('.')[-1].lower()
        if file_extension not in ['jpg', 'jpeg', 'png', 'gif']:
            raise HTTPException(status_code=400, detail="不支持的文件格式")
        
        filename = f"{user.id}_{uuid.uuid4().hex}.{file_extension}"
        file_path = os.path.join(upload_dir, filename)
        
        # 保存原文件
        with open(file_path, "wb") as f:
            f.write(avatar_content)
        
        # 创建缩略图 (200x200)
        try:
            with Image.open(file_path) as img:
                # 转换为RGB模式（如果是RGBA）
                if img.mode in ('RGBA', 'LA'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                
                # 调整尺寸
                img.thumbnail((200, 200), Image.Resampling.LANCZOS)
                
                # 保存缩略图
                thumbnail_filename = f"thumb_{filename}"
                thumbnail_path = os.path.join(upload_dir, thumbnail_filename)
                img.save(thumbnail_path, format='JPEG', quality=85)
                
                # 删除原文件，只保留缩略图
                os.remove(file_path)
                
                # 构建访问URL
                avatar_url = f"/uploads/avatars/{thumbnail_filename}"
                
        except Exception as e:
            # 如果图片处理失败，删除上传的文件
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=400, detail="图片处理失败")
        
        # 删除旧头像文件
        if user.avatar and user.avatar.startswith('/uploads/avatars/'):
            old_file_path = user.avatar[1:]  # 移除开头的 '/'
            if os.path.exists(old_file_path):
                try:
                    os.remove(old_file_path)
                except:
                    pass  # 忽略删除失败
        
        # 更新用户头像URL
        user.avatar = avatar_url
        user.updated_at = datetime.utcnow()
        db.commit()
        
        return {"avatar_url": avatar_url}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"上传头像失败: {str(e)}")

@router.put("/change-password")
async def change_password(
    request: Request,
    password_data: ChangePasswordRequest,
    db: Session = Depends(get_db)
):
    """修改密码"""
    try:
        user = get_current_user_from_token(request, db)
        
        # 验证当前密码
        if not verify_password(password_data.currentPassword, user.password_hash):
            raise HTTPException(status_code=400, detail="当前密码错误")
        
        # 验证新密码确认
        if password_data.newPassword != password_data.confirmPassword:
            raise HTTPException(status_code=400, detail="新密码确认不匹配")
        
        # 验证新密码强度
        if len(password_data.newPassword) < 6:
            raise HTTPException(status_code=400, detail="新密码长度不能少于6位")
        
        # 更新密码
        user.password_hash = hash_password(password_data.newPassword)
        user.updated_at = datetime.utcnow()
        db.commit()
        
        return {"success": True, "message": "密码修改成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"修改密码失败: {str(e)}") 