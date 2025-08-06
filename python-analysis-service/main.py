#!/usr/bin/env python3
"""
股票推荐AI分析服务
基于AI的智能股票推荐分析服务

运行方式：
pip install -r requirements.txt
python main.py

服务端口：8000
文档地址：http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uvicorn
import logging
import logging.config
from config import config
from api.smart_stock_api import router as smart_stock_router
from api.stock_recommendation_api import router as stock_recommendation_router
from api.stock_array_analysis_api import router as stock_array_analysis_router
# from api.backtest_api import router as backtest_router  # 暂时注释，文件不存在
from api.ai_workflow_api import router as ai_workflow_router
from api.home_api import router as home_router

# 配置日志 - 禁用watchfiles的频繁输出
log_config = config.get_log_config()
log_config["loggers"] = {
    "watchfiles": {"level": "WARNING"},
    "uvicorn.access": {"level": "WARNING"}
}
logging.config.dictConfig(log_config)
logger = logging.getLogger(__name__)

# 创建FastAPI应用
app = FastAPI(
    title="股票推荐AI分析服务", 
    version="1.0.0",
    description="基于AI的智能股票推荐分析服务，使用通义千问AI进行关键词分析，结合MySQL数据库推荐相关股票"
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000"
    ],  # 允许的前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 添加并发处理中间件
@app.middleware("http")
async def add_process_time_header(request, call_next):
    response = await call_next(request)
    return response

# 注册路由
app.include_router(smart_stock_router)
app.include_router(stock_recommendation_router)
app.include_router(stock_array_analysis_router)
# app.include_router(backtest_router)  # 暂时注释，文件不存在
app.include_router(ai_workflow_router)
app.include_router(home_router)

@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy", 
        "service": "股票推荐AI分析服务",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/")
async def root():
    """根路径 - 服务信息"""
    return {
        "service": "股票推荐AI分析服务",
        "version": "1.0.0",
        "description": "基于AI的智能股票推荐分析服务",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    print("🚀 启动股票推荐AI分析服务...")
    print(f"📖 API文档: http://{config.HOST}:{config.PORT}/docs")
    print(f"💚 健康检查: http://{config.HOST}:{config.PORT}/health")
    print(f"🔍 股票推荐: http://{config.HOST}:{config.PORT}/api/v1/stock-recommendation/recommend")
    
    # Windows 平台优化配置，避免多进程问题
    import platform
    is_windows = platform.system() == "Windows"
    
    uvicorn.run(
        "main:app", 
        host=config.HOST, 
        port=config.PORT,
        reload=config.DEBUG and not is_windows,  # Windows 上禁用 reload
        log_level="info",
        timeout_keep_alive=config.API_REQUEST_TIMEOUT,
        timeout_graceful_shutdown=30,
        workers=1 if is_windows else None,  # Windows 上强制使用单进程
        loop="asyncio",  # 明确指定事件循环类型
        limit_concurrency=1000,  # 增加并发限制
        limit_max_requests=10000,  # 增加最大请求数
        backlog=2048  # 增加连接队列大小
    )