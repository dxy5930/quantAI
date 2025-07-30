"""
统一错误处理工具
"""

from typing import Any, Dict, Optional
from datetime import datetime
from enum import IntEnum
import logging

logger = logging.getLogger(__name__)

class ErrorCode(IntEnum):
    """错误代码枚举"""
    # 通用错误 1000-1999
    UNKNOWN_ERROR = 1000
    VALIDATION_ERROR = 1001
    PERMISSION_DENIED = 1002
    RESOURCE_NOT_FOUND = 1003
    
    # 认证相关 2000-2099
    UNAUTHORIZED = 2000
    TOKEN_EXPIRED = 2001
    INVALID_CREDENTIALS = 2002
    
    # 分析相关 3000-3099
    ANALYSIS_FAILED = 3000
    KEYWORD_EXTRACTION_FAILED = 3001
    RECOMMENDATION_FAILED = 3002
    
    # 回测相关 4000-4099
    BACKTEST_FAILED = 4001
    INVALID_BACKTEST_PARAMS = 4002
    
    # 股票相关 5000-5099
    STOCK_NOT_FOUND = 5000
    STOCK_DATA_UNAVAILABLE = 5001
    INVALID_STOCK_SYMBOL = 5002
    
    # AI服务相关 6000-6099
    AI_SERVICE_UNAVAILABLE = 6000
    AI_QUOTA_EXCEEDED = 6001
    AI_RESPONSE_INVALID = 6002
    
    # 数据库相关 9000-9099
    DATABASE_ERROR = 9000
    DATABASE_CONNECTION_FAILED = 9001
    
    # 系统相关 9100-9199
    EXTERNAL_SERVICE_ERROR = 9100
    NETWORK_ERROR = 9101

# 错误消息映射
ERROR_MESSAGES = {
    # 通用错误
    ErrorCode.UNKNOWN_ERROR: "未知错误",
    ErrorCode.VALIDATION_ERROR: "参数验证失败",
    ErrorCode.PERMISSION_DENIED: "权限不足",
    ErrorCode.RESOURCE_NOT_FOUND: "资源不存在",
    
    # 认证相关
    ErrorCode.UNAUTHORIZED: "未授权访问",
    ErrorCode.TOKEN_EXPIRED: "登录已过期",
    ErrorCode.INVALID_CREDENTIALS: "用户名或密码错误",
    
    # 分析相关
    ErrorCode.ANALYSIS_FAILED: "分析失败",
    ErrorCode.KEYWORD_EXTRACTION_FAILED: "关键词提取失败",
    ErrorCode.RECOMMENDATION_FAILED: "推荐生成失败",
    
    # 回测相关
    ErrorCode.BACKTEST_FAILED: "回测执行失败",
    ErrorCode.INVALID_BACKTEST_PARAMS: "回测参数无效",
    
    # 股票相关
    ErrorCode.STOCK_NOT_FOUND: "股票不存在",
    ErrorCode.STOCK_DATA_UNAVAILABLE: "股票数据不可用",
    ErrorCode.INVALID_STOCK_SYMBOL: "无效的股票代码",
    
    # AI服务相关
    ErrorCode.AI_SERVICE_UNAVAILABLE: "AI服务不可用",
    ErrorCode.AI_QUOTA_EXCEEDED: "AI服务配额已用完",
    ErrorCode.AI_RESPONSE_INVALID: "AI响应格式无效",
    
    # 数据库相关
    ErrorCode.DATABASE_ERROR: "数据库错误",
    ErrorCode.DATABASE_CONNECTION_FAILED: "数据库连接失败",
    
    # 系统相关
    ErrorCode.EXTERNAL_SERVICE_ERROR: "外部服务错误",
    ErrorCode.NETWORK_ERROR: "网络连接错误",
}

class UnifiedResponse:
    """统一响应格式"""
    
    @staticmethod
    def success(data: Any = None, message: str = "Success", code: int = 200) -> Dict[str, Any]:
        """成功响应"""
        return {
            "code": code,
            "message": message,
            "data": data,
            "success": True,
            "timestamp": datetime.now().isoformat()
        }
    
    @staticmethod
    def error(
        code: ErrorCode, 
        message: Optional[str] = None, 
        data: Any = None,
        details: Optional[str] = None
    ) -> Dict[str, Any]:
        """错误响应"""
        error_message = message or ERROR_MESSAGES.get(code, "未知错误")
        
        # 如果有详细信息，追加到消息后面
        if details:
            error_message = f"{error_message}: {details}"
        
        return {
            "code": code,
            "message": error_message,
            "data": data,
            "success": False,
            "timestamp": datetime.now().isoformat()
        }

def handle_exception(func):
    """异常处理装饰器"""
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except ValueError as e:
            logger.error(f"参数验证错误: {e}")
            return UnifiedResponse.error(
                ErrorCode.VALIDATION_ERROR,
                details=str(e)
            )
        except ConnectionError as e:
            logger.error(f"网络连接错误: {e}")
            return UnifiedResponse.error(
                ErrorCode.NETWORK_ERROR,
                details=str(e)
            )
        except Exception as e:
            logger.error(f"未知错误: {e}", exc_info=True)
            return UnifiedResponse.error(
                ErrorCode.UNKNOWN_ERROR,
                details=str(e)
            )
    return wrapper

def get_error_code_from_exception(exception: Exception) -> ErrorCode:
    """根据异常类型获取错误代码"""
    error_message = str(exception).lower()
    
    if "database" in error_message or "mysql" in error_message:
        return ErrorCode.DATABASE_ERROR
    elif "network" in error_message or "timeout" in error_message:
        return ErrorCode.NETWORK_ERROR
    elif "ai" in error_message or "openai" in error_message or "qwen" in error_message:
        return ErrorCode.AI_SERVICE_UNAVAILABLE
    elif "stock" in error_message and "not found" in error_message:
        return ErrorCode.STOCK_NOT_FOUND
    elif "validation" in error_message or "invalid" in error_message:
        return ErrorCode.VALIDATION_ERROR
    else:
        return ErrorCode.UNKNOWN_ERROR 