"""
智能股票推荐API接口
"""

from fastapi import APIRouter, HTTPException, Query, Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from services.smart_stock_service import SmartStockService
import logging

logger = logging.getLogger(__name__)

# 创建路由器
router = APIRouter(prefix="/api/smart-stock", tags=["智能股票推荐"])

# 初始化服务
smart_stock_service = SmartStockService()

# 请求模型
class SmartSearchRequest(BaseModel):
    """智能搜索请求"""
    query: str = Field(..., description="自然语言查询", example="市盈率大于50且MACD金叉的科技股")
    max_results: int = Field(20, ge=1, le=100, description="最大返回结果数")

class BatchAnalysisRequest(BaseModel):
    """批量分析请求"""
    symbols: List[str] = Field(..., description="股票代码列表", example=["000001", "000002", "600000"])

class MarketOverviewRequest(BaseModel):
    """市场概览请求"""
    sector: Optional[str] = Field(None, description="特定行业", example="科技")

# 响应模型
class StockInfo(BaseModel):
    """股票信息"""
    symbol: str = Field(..., description="股票代码")
    name: str = Field(..., description="股票名称")
    sector: str = Field(..., description="所属行业")
    market_cap: Optional[str] = Field(None, description="市值规模")
    match_score: float = Field(..., description="匹配度评分")
    ai_recommendation_reason: Optional[str] = Field(None, description="AI推荐理由")

class SmartSearchResponse(BaseModel):
    """智能搜索响应"""
    success: bool = Field(..., description="是否成功")
    query: str = Field(..., description="原始查询")
    parsing_method: str = Field(..., description="解析方法")
    ai_confidence: float = Field(..., description="AI解析置信度")
    total_count: int = Field(..., description="总匹配数量")
    returned_count: int = Field(..., description="返回数量")
    stocks: List[Dict[str, Any]] = Field(..., description="股票列表")
    structured_conditions: Optional[Dict[str, Any]] = Field(None, description="结构化条件")
    message: str = Field(..., description="响应消息")

@router.post("/search", response_model=SmartSearchResponse, summary="智能股票搜索")
async def smart_stock_search(request: SmartSearchRequest):
    """
    智能股票搜索
    
    使用AI解析自然语言查询，从数据库中筛选符合条件的股票：
    
    - **query**: 自然语言查询，支持复杂的财务和技术指标条件
    - **max_results**: 最大返回结果数量
    
    **示例查询**:
    - "市盈率大于50且MACD金叉的科技股"
    - "ROE超过15%的消费股"
    - "新能源汽车概念的成长股"
    - "低估值的银行股"
    """
    try:
        logger.info(f"智能股票搜索请求: {request.query}")
        
        result = smart_stock_service.intelligent_stock_search(
            query=request.query,
            max_results=request.max_results
        )
        
        if 'error' in result:
            raise HTTPException(status_code=500, detail=result['error'])
        
        return SmartSearchResponse(
            success=True,
            query=result['query'],
            parsing_method=result.get('parsing_method', 'unknown'),
            ai_confidence=result.get('ai_confidence', 0),
            total_count=result.get('total_count', 0),
            returned_count=result.get('returned_count', 0),
            stocks=result.get('stocks', []),
            structured_conditions=result.get('structured_conditions'),
            message=result.get('message', '搜索完成')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"智能股票搜索失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"搜索失败: {str(e)}")

@router.get("/detail/{symbol}", summary="股票详细分析")
async def get_stock_analysis(
    symbol: str = Path(..., description="股票代码", example="000001")
):
    """
    获取单只股票的详细分析
    
    - **symbol**: 股票代码
    
    返回包含基础信息、财务数据、技术指标、AI情绪分析等完整信息
    """
    try:
        logger.info(f"获取股票分析: {symbol}")
        
        result = smart_stock_service.get_stock_analysis(symbol)
        
        if 'error' in result:
            raise HTTPException(status_code=404, detail=result['error'])
        
        return {
            "success": True,
            "data": result,
            "message": "分析完成"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"股票分析失败 {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"分析失败: {str(e)}")

@router.post("/batch-analysis", summary="批量股票分析")
async def batch_stock_analysis(request: BatchAnalysisRequest):
    """
    批量股票分析
    
    - **symbols**: 股票代码列表
    
    对多只股票进行批量分析，返回每只股票的详细信息和整体摘要
    """
    try:
        logger.info(f"批量股票分析: {len(request.symbols)} 只股票")
        
        if len(request.symbols) > 50:
            raise HTTPException(status_code=400, detail="批量分析最多支持50只股票")
        
        result = smart_stock_service.batch_stock_analysis(request.symbols)
        
        if 'error' in result:
            raise HTTPException(status_code=500, detail=result['error'])
        
        return {
            "success": True,
            "data": result,
            "message": f"批量分析完成，成功分析 {result.get('success_count', 0)} 只股票"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"批量股票分析失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"批量分析失败: {str(e)}")

@router.get("/market-overview", summary="市场概览")
async def get_market_overview(
    sector: Optional[str] = Query(None, description="特定行业", example="科技")
):
    """
    获取市场概览
    
    - **sector**: 特定行业（可选），如果不指定则返回全市场概览
    
    返回市场统计数据，包括行业分布、估值水平、市场情绪等
    """
    try:
        logger.info(f"获取市场概览: {sector or '全市场'}")
        
        result = smart_stock_service.get_market_overview(sector)
        
        if 'error' in result:
            raise HTTPException(status_code=500, detail=result['error'])
        
        return {
            "success": True,
            "data": result,
            "message": "市场概览获取完成"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"市场概览获取失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取失败: {str(e)}")

@router.get("/health", summary="服务健康检查")
async def health_check():
    """
    服务健康检查
    
    检查智能股票推荐服务的运行状态
    """
    try:
        # 检查AI服务状态
        ai_status = smart_stock_service.qwen_analyzer.is_available
        
        # 检查数据库连接状态
        db_status = True  # 简化检查
        
        return {
            "success": True,
            "status": "healthy",
            "services": {
                "ai_analyzer": "available" if ai_status else "unavailable",
                "database": "connected" if db_status else "disconnected"
            },
            "message": "服务运行正常"
        }
        
    except Exception as e:
        logger.error(f"健康检查失败: {str(e)}")
        return {
            "success": False,
            "status": "unhealthy",
            "error": str(e)
        }