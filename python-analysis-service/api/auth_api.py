from fastapi import APIRouter, HTTPException, Depends, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import bcrypt
import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
import uuid
import secrets

from models.database import get_db
from models.user_models import User, UserSession
from utils.response import ErrorCode, success_response, error_response

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])

# JWT配置
SECRET_KEY = "your-secret-key-change-in-production"  # 生产环境需要从环境变量读取
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24小时
REFRESH_TOKEN_EXPIRE_DAYS = 30

# Pydantic模型
class LoginRequest(BaseModel):
    username: str
    password: str
    remember: Optional[bool] = False

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    confirmPassword: str
    displayName: Optional[str] = None

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    user: dict

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    password: str
    confirmPassword: str

# 工具函数
def hash_password(password: str) -> str:
    """哈希密码"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """验证密码"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """创建访问令牌"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token() -> str:
    """创建刷新令牌"""
    return secrets.token_urlsafe(32)

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

@router.post("/login")
async def login(request: LoginRequest, req: Request, db: Session = Depends(get_db)):
    """用户登录"""
    try:
        # 查找用户
        user = db.query(User).filter(
            (User.username == request.username) | (User.email == request.username)
        ).first()
        
        # 先检查用户是否存在
        if not user:
            return error_response(ErrorCode.USER_NOT_FOUND)
        
        # 再检查密码是否正确
        if not verify_password(request.password, user.password_hash):
            return error_response(ErrorCode.INVALID_PASSWORD)
        
        if not user.is_active:
            return error_response(ErrorCode.ACCOUNT_DISABLED)
        
        # 创建令牌
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.id, "username": user.username},
            expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token()
        
        # 保存会话
        session = UserSession(
            user_id=user.id,
            token=access_token,
            refresh_token=refresh_token,
            expires_at=datetime.utcnow() + access_token_expires,
            ip_address=req.client.host if req.client else None,
            user_agent=req.headers.get("user-agent")
        )
        db.add(session)
        
        # 更新最后登录时间
        user.last_login_at = datetime.utcnow()
        db.commit()
        
        return success_response(
            data={
                "access_token": access_token,
                "refresh_token": refresh_token,
                "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                "user": user_to_dict(user)
            },
            message="登录成功"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"登录失败: {str(e)}")

@router.post("/register")
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """用户注册"""
    try:
        # 验证密码确认
        if request.password != request.confirmPassword:
            return error_response(ErrorCode.PASSWORD_MISMATCH)
        
        # 检查用户名是否已存在
        if db.query(User).filter(User.username == request.username).first():
            return error_response(ErrorCode.USERNAME_EXISTS)
        
        # 检查邮箱是否已存在
        if db.query(User).filter(User.email == request.email).first():
            return error_response(ErrorCode.EMAIL_EXISTS)
        
        # 创建新用户
        hashed_password = hash_password(request.password)
        new_user = User(
            username=request.username,
            email=request.email,
            password_hash=hashed_password,
            display_name=request.displayName or request.username
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # 创建登录令牌
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": new_user.id, "username": new_user.username},
            expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token()
        
        # 保存会话
        session = UserSession(
            user_id=new_user.id,
            token=access_token,
            refresh_token=refresh_token,
            expires_at=datetime.utcnow() + access_token_expires
        )
        db.add(session)
        db.commit()
        
        return success_response(
            data={
                "access_token": access_token,
                "refresh_token": refresh_token,
                "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                "user": user_to_dict(new_user)
            },
            message="注册成功"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"注册失败: {str(e)}")

@router.post("/refresh")
async def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """刷新访问令牌"""
    try:
        # 查找会话
        session = db.query(UserSession).filter(
            UserSession.refresh_token == request.refresh_token,
            UserSession.is_active == True
        ).first()
        
        if not session:
            raise HTTPException(status_code=401, detail="无效的刷新令牌")
        
        # 获取用户信息
        user = db.query(User).filter(User.id == session.user_id).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="用户不存在或已被禁用")
        
        # 创建新的访问令牌
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.id, "username": user.username},
            expires_delta=access_token_expires
        )
        
        # 更新会话
        session.token = access_token
        session.expires_at = datetime.utcnow() + access_token_expires
        session.last_used_at = datetime.utcnow()
        db.commit()
        
        return {
            "access_token": access_token,
            "refresh_token": request.refresh_token,
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": user_to_dict(user)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"刷新令牌失败: {str(e)}")

@router.post("/logout")
async def logout(request: Request, db: Session = Depends(get_db)):
    """用户登出"""
    try:
        # 从请求头获取令牌
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return {"message": "已成功登出"}
        
        token = auth_header.split(" ")[1]
        
        # 使会话失效
        session = db.query(UserSession).filter(
            UserSession.token == token,
            UserSession.is_active == True
        ).first()
        
        if session:
            session.is_active = False
            db.commit()
        
        return {"message": "已成功登出"}
        
    except Exception as e:
        return {"message": "已成功登出"}

@router.post("/me")
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    """获取当前用户信息"""
    try:
        # 从请求头获取令牌
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="未提供认证令牌")
        
        token = auth_header.split(" ")[1]
        
        # 验证令牌
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(status_code=401, detail="无效的令牌")
        except ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="令牌已过期")
        except InvalidTokenError:
            raise HTTPException(status_code=401, detail="无效的令牌")
        
        # 获取用户信息
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="用户不存在或已被禁用")
        
        return user_to_dict(user)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取用户信息失败: {str(e)}")

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """忘记密码"""
    try:
        user = db.query(User).filter(User.email == request.email).first()
        if not user:
            # 为了安全，即使用户不存在也返回成功
            return {"message": "如果邮箱存在，重置密码链接已发送"}
        
        # 生成重置令牌
        reset_token = secrets.token_urlsafe(32)
        user.reset_token = reset_token
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)  # 1小时有效期
        
        db.commit()
        
        # TODO: 发送邮件
        # send_reset_password_email(user.email, reset_token)
        
        return {"message": "如果邮箱存在，重置密码链接已发送"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"处理失败: {str(e)}")

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """重置密码"""
    try:
        if request.password != request.confirmPassword:
            raise HTTPException(status_code=400, detail="密码确认不匹配")
        
        # 查找用户
        user = db.query(User).filter(
            User.reset_token == request.token,
            User.reset_token_expires > datetime.utcnow()
        ).first()
        
        if not user:
            raise HTTPException(status_code=400, detail="无效或已过期的重置令牌")
        
        # 更新密码
        user.password_hash = hash_password(request.password)
        user.reset_token = None
        user.reset_token_expires = None
        
        # 使所有现有会话失效
        db.query(UserSession).filter(UserSession.user_id == user.id).update(
            {"is_active": False}
        )
        
        db.commit()
        
        return {"message": "密码重置成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"重置密码失败: {str(e)}") 