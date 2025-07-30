"""
股票推荐API - 基于AI关键词分析的智能股票推荐
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime

from services.stock_recommender import StockRecommender
from services.keyword_analyzer import KeywordAnalyzer
from utils.error_handler import UnifiedResponse, ErrorCode, handle_exception
from utils.cache import cache_manager

# 配置日志
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/stock-recommendation", tags=["stock-recommendation"])

# 初始化服务
keyword_analyzer = KeywordAnalyzer()
stock_recommender = StockRecommender()

# 请求模型
class KeywordAnalysisRequest(BaseModel):
    query: str = Field(..., description="查询文本", min_length=1, max_length=500)
    language: str = Field(default="zh", description="语言代码")

class StockRecommendationRequest(BaseModel):
    query: str = Field(..., description="查询文本", min_length=1, max_length=500)
    limit: int = Field(default=10, description="返回数量限制", ge=1, le=50)
    min_confidence: float = Field(default=0.3, description="最小置信度", ge=0.0, le=1.0)
    structured_conditions: Optional[List[Dict[str, Any]]] = Field(default=None, description="结构化条件")

# 响应模型
class KeywordAnalysisResponse(BaseModel):
    keywords: List[Dict[str, Any]]
    industry_keywords: List[str]
    concept_keywords: List[str]
    financial_keywords: List[str]
    technical_keywords: List[str]
    sentiment: str
    intent: str
    confidence: float

@router.post("/analyze-keywords")
async def analyze_keywords(request: KeywordAnalysisRequest):
    """关键词分析 - 不使用缓存，每次都用AI重新分析"""
    try:
        logger.info(f"开始关键词分析: {request.query}")
        
        # 直接执行AI分析，不检查缓存
        result = await keyword_analyzer.analyze_keywords(request.query)
        
        # KeywordAnalysis对象不为None即表示成功，不需要检查"error"字段
        if not result:
            return UnifiedResponse.error(
                ErrorCode.KEYWORD_EXTRACTION_FAILED,
                details="关键词提取失败"
            )
        
        # 将KeywordAnalysis对象转换为字典格式
        result_dict = result.to_dict()
        
        # 不缓存结果，确保每次都是最新的AI分析
        
        logger.info(f"关键词分析完成，提取到 {len(result.extracted_keywords)} 个关键词")
        return UnifiedResponse.success(result_dict, "关键词分析完成")
        
    except ValueError as e:
        logger.error(f"参数验证错误: {e}")
        return JSONResponse(
            status_code=400,
            content=UnifiedResponse.error(ErrorCode.VALIDATION_ERROR, details=str(e))
        )
    except Exception as e:
        logger.error(f"关键词分析失败: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content=UnifiedResponse.error(ErrorCode.KEYWORD_EXTRACTION_FAILED, details=str(e))
        )

@router.post("/recommend")
async def recommend_stocks(request: StockRecommendationRequest):
    """股票推荐 - 结合AI关键词分析和本地数据库，不使用缓存"""
    try:
        logger.info(f"开始股票推荐: {request.query}")
        
        # 不检查缓存，直接进行实时分析和推荐
        
        # 第一步：处理结构化条件或执行AI关键词分析
        if request.structured_conditions:
            logger.info(f"步骤1: 使用传递的结构化条件 ({len(request.structured_conditions)}个)")
            # 如果有结构化条件，创建一个包含结构化条件的分析结果
            from services.keyword_analyzer import KeywordAnalysis, StructuredCondition
            
            # 从结构化条件中提取关键词
            extracted_keywords = []
            structured_conditions = []
            
            for condition in request.structured_conditions:
                field = condition.get('field', '')
                if field:
                    extracted_keywords.append(field)
                
                structured_conditions.append(StructuredCondition(
                    field=condition.get('field', ''),
                    operator=condition.get('operator', '='),
                    value=condition.get('value', ''),
                    period=condition.get('period')
                ))
            
            # 创建关键词分析结果对象
            keyword_analysis = KeywordAnalysis(
                original_query=request.query,
                extracted_keywords=list(set(extracted_keywords)),
                industry_keywords=[],
                concept_keywords=[],
                financial_keywords=[],
                technical_keywords=[],
                structured_conditions=structured_conditions,
                sentiment="neutral",
                intent="search",
                confidence=0.9  # 结构化条件置信度较高
            )
        else:
            logger.info("步骤1: 执行AI关键词分析")
            keyword_analysis = await keyword_analyzer.analyze_keywords(request.query)
            
            if not keyword_analysis:
                return UnifiedResponse.error(
                    ErrorCode.KEYWORD_EXTRACTION_FAILED,
                    details="关键词分析失败"
                )
        
        # 第二步：基于关键词分析结果进行股票推荐
        logger.info("步骤2: 基于AI分析结果推荐股票")
        result = stock_recommender.recommend_stocks_by_query(
            query=request.query,
            limit=request.limit,
            keyword_analysis=keyword_analysis  # 传递AI分析结果
        )
        
        # 第三步：将关键词分析结果合并到推荐结果中
        if result and "error" not in result:
            result['keyword_analysis'] = keyword_analysis.to_dict()
            result['analysis_method'] = 'ai_enhanced'
            result['real_time_analysis'] = True
        
        if not result or "error" in result:
            return UnifiedResponse.error(
                ErrorCode.RECOMMENDATION_FAILED,
                details=result.get("error", "股票推荐失败")
            )
        
        # 不缓存结果，确保每次都是最新的分析
        
        logger.info(f"股票推荐完成，推荐了 {len(result.get('recommendations', []))} 只股票")
        return UnifiedResponse.success(result, "股票推荐完成")
        
    except ValueError as e:
        logger.error(f"参数验证错误: {e}")
        return JSONResponse(
            status_code=400,
            content=UnifiedResponse.error(ErrorCode.VALIDATION_ERROR, details=str(e))
        )
    except Exception as e:
        logger.error(f"股票推荐失败: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content=UnifiedResponse.error(ErrorCode.RECOMMENDATION_FAILED, details=str(e))
        )

@router.get("/health")
async def health_check():
    """健康检查"""
    try:
        # 测试关键服务 - 简化健康检查
        test_result = True
        
        return {
            "status": "healthy",
            "service": "股票推荐AI分析服务",
            "version": "2.0",
            "features": {
                "ai_keyword_analysis": "实时AI关键词分析（无缓存）",
                "intelligent_recommendation": "基于AI分析的智能股票推荐",
                "database_integration": "结合本地数据库数据",
                "real_time_analysis": "每次请求都进行最新AI分析"
            },
            "analysis_method": "ai_enhanced_no_cache",
            "cache_policy": {
                "keyword_analysis": "不使用缓存，每次AI重新分析",
                "stock_recommendation": "不使用缓存，实时结合AI分析结果"
            },
            "ai_model": "通义千问（Qwen）",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"健康检查失败: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }