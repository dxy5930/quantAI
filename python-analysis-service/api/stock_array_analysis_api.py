"""
股票数组分析API - 通过通义千问结合数据库数据分析股票数组
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from services.stock_array_analyzer import StockArrayAnalyzer
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/stock-array-analysis", tags=["股票数组分析"])

# 请求模型
class StockArrayAnalysisRequest(BaseModel):
    """股票数组分析请求"""
    stock_symbols: List[str] = Field(..., description="股票代码数组", example=["000001", "000002", "600036"])
    analysis_type: str = Field(default="comprehensive", description="分析类型", example="comprehensive")
    
    class Config:
        json_schema_extra = {
            "example": {
                "stock_symbols": ["000001", "000002", "600036", "000858", "002415"],
                "analysis_type": "comprehensive"
            }
        }

class BatchAnalysisRequest(BaseModel):
    """批量分析请求"""
    stock_batches: List[List[str]] = Field(..., description="股票批次数组")
    analysis_type: str = Field(default="comparison", description="分析类型")
    
    class Config:
        json_schema_extra = {
            "example": {
                "stock_batches": [
                    ["000001", "000002"],
                    ["600036", "000858"],
                    ["002415", "300059"]
                ],
                "analysis_type": "comparison"
            }
        }

# 响应模型
class AnalysisResponse(BaseModel):
    """分析响应"""
    success: bool = Field(..., description="是否成功")
    analysis_type: str = Field(..., description="分析类型")
    timestamp: str = Field(..., description="分析时间")
    stocks_count: int = Field(..., description="股票数量")
    data: Dict[str, Any] = Field(..., description="分析结果数据")
    error: Optional[str] = Field(None, description="错误信息")

# 初始化分析器
analyzer = StockArrayAnalyzer()

@router.post("/analyze", response_model=AnalysisResponse, summary="股票数组分析")
async def analyze_stock_array(request: StockArrayAnalysisRequest):
    """
    分析股票数组
    
    支持的分析类型：
    - comprehensive: 综合分析（默认）
    - risk: 风险分析
    - opportunity: 机会分析  
    - comparison: 对比分析
    
    返回包含AI洞察和数据分析的完整报告
    """
    try:
        logger.info(f"开始股票数组分析: {len(request.stock_symbols)}只股票, 类型: {request.analysis_type}")
        
        # 验证股票代码
        if not request.stock_symbols:
            raise HTTPException(status_code=400, detail="股票代码数组不能为空")
        
        if len(request.stock_symbols) > 50:
            raise HTTPException(status_code=400, detail="股票数量不能超过50只")
        
        # 验证分析类型
        valid_types = ["comprehensive", "risk", "opportunity", "comparison"]
        if request.analysis_type not in valid_types:
            raise HTTPException(
                status_code=400, 
                detail=f"无效的分析类型，支持的类型: {', '.join(valid_types)}"
            )
        
        # 执行分析
        result = analyzer.analyze_stock_array(
            stock_symbols=request.stock_symbols,
            analysis_type=request.analysis_type
        )
        
        if not result.get('success', False):
            raise HTTPException(status_code=500, detail=result.get('error', '分析失败'))
        
        # 构建响应
        response_data = {
            key: value for key, value in result.items() 
            if key not in ['success']
        }
        
        return AnalysisResponse(
            success=True,
            analysis_type=result.get('analysis_type', request.analysis_type),
            timestamp=result.get('timestamp', ''),
            stocks_count=result.get('stocks_count', 0),
            data=response_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"股票数组分析失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"分析失败: {str(e)}")

@router.get("/analyze-by-symbols", response_model=AnalysisResponse, summary="通过URL参数分析股票")
async def analyze_by_symbols(
    symbols: str = Query(..., description="股票代码，逗号分隔", example="000001,000002,600036"),
    analysis_type: str = Query(default="comprehensive", description="分析类型", example="comprehensive")
):
    """
    通过URL参数分析股票数组
    
    参数：
    - symbols: 股票代码，用逗号分隔
    - analysis_type: 分析类型（comprehensive/risk/opportunity/comparison）
    """
    try:
        # 解析股票代码
        stock_symbols = [symbol.strip() for symbol in symbols.split(',') if symbol.strip()]
        
        if not stock_symbols:
            raise HTTPException(status_code=400, detail="股票代码不能为空")
        
        # 创建请求对象
        request = StockArrayAnalysisRequest(
            stock_symbols=stock_symbols,
            analysis_type=analysis_type
        )
        
        # 调用分析器服务
        result = analyzer.analyze_stock_array(request.stock_symbols, request.analysis_type)
        
        return AnalysisResponse(
            success=True,
            analysis_type=request.analysis_type,
            **result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"URL参数分析失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"分析失败: {str(e)}")

@router.post("/batch-analyze", summary="批量分析多组股票")
async def batch_analyze_stocks(request: BatchAnalysisRequest):
    """
    批量分析多组股票
    
    可以同时分析多个股票组合，并进行对比
    """
    try:
        logger.info(f"开始批量分析: {len(request.stock_batches)}个批次")
        
        if not request.stock_batches:
            raise HTTPException(status_code=400, detail="股票批次不能为空")
        
        if len(request.stock_batches) > 10:
            raise HTTPException(status_code=400, detail="批次数量不能超过10个")
        
        batch_results = []
        
        for i, stock_batch in enumerate(request.stock_batches):
            if not stock_batch:
                continue
                
            try:
                result = analyzer.analyze_stock_array(
                    stock_symbols=stock_batch,
                    analysis_type=request.analysis_type
                )
                
                batch_results.append({
                    'batch_index': i,
                    'batch_symbols': stock_batch,
                    'result': result
                })
                
            except Exception as e:
                logger.error(f"批次 {i} 分析失败: {str(e)}")
                batch_results.append({
                    'batch_index': i,
                    'batch_symbols': stock_batch,
                    'error': str(e)
                })
        
        return {
            'success': True,
            'analysis_type': request.analysis_type,
            'timestamp': batch_results[0]['result']['timestamp'] if batch_results else '',
            'total_batches': len(request.stock_batches),
            'successful_batches': len([r for r in batch_results if 'result' in r]),
            'batch_results': batch_results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"批量分析失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"批量分析失败: {str(e)}")

@router.get("/analysis-types", summary="获取支持的分析类型")
async def get_analysis_types():
    """获取支持的分析类型和说明"""
    return {
        'analysis_types': [
            {
                'type': 'comprehensive',
                'name': '综合分析',
                'description': '全面分析投资组合的各个方面，包括基础统计、行业分布、财务指标、技术指标、风险评估等'
            },
            {
                'type': 'risk',
                'name': '风险分析',
                'description': '专注于风险评估，包括集中度风险、财务风险、技术风险等，并提供风险缓解建议'
            },
            {
                'type': 'opportunity',
                'name': '机会分析',
                'description': '识别投资机会，包括价值机会、成长机会、技术机会、行业轮动机会等'
            },
            {
                'type': 'comparison',
                'name': '对比分析',
                'description': '对股票进行横向对比，包括财务指标对比、技术指标对比、估值对比等，并生成排名'
            }
        ],
        'default_type': 'comprehensive',
        'max_stocks_per_analysis': 50,
        'max_batches_per_request': 10
    }

@router.get("/health", summary="健康检查")
async def health_check():
    """股票数组分析服务健康检查"""
    try:
        # 检查分析器状态
        qwen_available = analyzer.qwen_analyzer.is_available if hasattr(analyzer, 'qwen_analyzer') else False
        
        return {
            'status': 'healthy',
            'service': '股票数组分析服务',
            'qwen_analyzer_available': qwen_available,
            'database_connection': 'active',
            'supported_analysis_types': ['comprehensive', 'risk', 'opportunity', 'comparison']
        }
        
    except Exception as e:
        logger.error(f"健康检查失败: {str(e)}")
        return {
            'status': 'unhealthy',
            'error': str(e)
        }

@router.get("/example", summary="获取API使用示例")
async def get_api_examples():
    """获取API使用示例"""
    return {
        'examples': {
            'comprehensive_analysis': {
                'url': '/api/v1/stock-array-analysis/analyze',
                'method': 'POST',
                'body': {
                    'stock_symbols': ['000001', '000002', '600036', '000858', '002415'],
                    'analysis_type': 'comprehensive'
                },
                'description': '综合分析5只股票的投资组合'
            },
            'risk_analysis': {
                'url': '/api/v1/stock-array-analysis/analyze',
                'method': 'POST', 
                'body': {
                    'stock_symbols': ['000001', '600036', '002415'],
                    'analysis_type': 'risk'
                },
                'description': '分析3只股票的风险状况'
            },
            'url_parameter_analysis': {
                'url': '/api/v1/stock-array-analysis/analyze-by-symbols?symbols=000001,000002,600036&analysis_type=opportunity',
                'method': 'GET',
                'description': '通过URL参数进行机会分析'
            },
            'batch_analysis': {
                'url': '/api/v1/stock-array-analysis/batch-analyze',
                'method': 'POST',
                'body': {
                    'stock_batches': [
                        ['000001', '000002'],
                        ['600036', '000858'],
                        ['002415', '300059']
                    ],
                    'analysis_type': 'comparison'
                },
                'description': '批量对比分析3个股票组合'
            }
        },
        'tips': [
            '单次分析最多支持50只股票',
            '批量分析最多支持10个批次',
            '建议使用comprehensive类型进行全面分析',
            'AI分析需要通义千问API可用，否则会使用基础分析'
        ]
    }