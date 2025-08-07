"""
统一响应格式和错误码定义
"""
from typing import Any, Optional
from fastapi.responses import JSONResponse

# 错误码定义
class ErrorCode:
    # 通用错误码 (10000-10999)
    SUCCESS = 10000
    INTERNAL_ERROR = 10001
    INVALID_PARAMS = 10002
    
    # 认证相关错误码 (11000-11999) 
    USER_NOT_FOUND = 11001
    INVALID_PASSWORD = 11002
    ACCOUNT_DISABLED = 11003
    TOKEN_EXPIRED = 11004
    INVALID_TOKEN = 11005
    LOGIN_REQUIRED = 11006
    
    # 用户相关错误码 (12000-12999)
    USERNAME_EXISTS = 12001
    EMAIL_EXISTS = 12002
    PASSWORD_MISMATCH = 12003
    REGISTER_FAILED = 12004
    
    # 业务相关错误码 (13000-13999)
    STRATEGY_NOT_FOUND = 13001
    BACKTEST_FAILED = 13002
    DATA_NOT_FOUND = 13003

# 错误信息映射
ERROR_MESSAGES = {
    ErrorCode.SUCCESS: "操作成功",
    ErrorCode.INTERNAL_ERROR: "系统内部错误",
    ErrorCode.INVALID_PARAMS: "参数错误",
    
    ErrorCode.USER_NOT_FOUND: "用户不存在",
    ErrorCode.INVALID_PASSWORD: "密码错误",
    ErrorCode.ACCOUNT_DISABLED: "账户已被禁用",
    ErrorCode.TOKEN_EXPIRED: "令牌已过期",
    ErrorCode.INVALID_TOKEN: "无效的令牌",
    ErrorCode.LOGIN_REQUIRED: "请先登录",
    
    ErrorCode.USERNAME_EXISTS: "用户名已存在",
    ErrorCode.EMAIL_EXISTS: "邮箱已被注册",
    ErrorCode.PASSWORD_MISMATCH: "密码确认不匹配",
    ErrorCode.REGISTER_FAILED: "注册失败",
    
    ErrorCode.STRATEGY_NOT_FOUND: "策略不存在",
    ErrorCode.BACKTEST_FAILED: "回测失败",
    ErrorCode.DATA_NOT_FOUND: "数据不存在",
}

def success_response(data: Any = None, message: str = None, code: int = ErrorCode.SUCCESS):
    """成功响应"""
    return {
        "success": True,
        "code": code,
        "message": message or ERROR_MESSAGES.get(code, "操作成功"),
        "data": data
    }

def error_response(code: int, message: str = None, data: Any = None):
    """错误响应"""
    return {
        "success": False,
        "code": code,
        "message": message or ERROR_MESSAGES.get(code, "未知错误"),
        "data": data
    }

def json_response(success: bool = True, code: int = ErrorCode.SUCCESS, message: str = None, data: Any = None, status_code: int = 200):
    """统一JSON响应"""
    response_data = {
        "success": success,
        "code": code,
        "message": message or ERROR_MESSAGES.get(code, "操作成功" if success else "未知错误"),
        "data": data
    }
    return JSONResponse(content=response_data, status_code=status_code) 