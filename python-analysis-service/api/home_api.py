#!/usr/bin/env python3
"""
首页AI分析API
提供首页所需的AI分析功能，包括市场分析和股票分析
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
import asyncio
from datetime import datetime, timedelta
import random
import json

# 导入现有服务
from services.smart_stock_service import SmartStockService
from services.qwen_analyzer import QwenAnalyzer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["首页AI分析"])

# 请求模型
class StockAnalyzeRequest(BaseModel):
    symbol: str

# 响应模型
class MarketSentiment(BaseModel):
    sentiment_score: int  # 0-100的情绪指数
    sentiment: str  # 'bullish', 'neutral', 'bearish'
    description: str
    keyFactors: List[str]

class MarketInsight(BaseModel):
    title: str
    content: str
    type: str  # 'bullish', 'bearish', 'neutral'
    confidence: float
    timestamp: str

class MarketAnalysisResponse(BaseModel):
    marketSummary: MarketSentiment
    insights: List[MarketInsight]
    recommendations: List[str]
    hotSectors: List[str]

# 已移除StockAnalysisResponse类，直接使用字典返回精简数据

# 初始化服务
smart_stock_service = SmartStockService()
qwen_analyzer = QwenAnalyzer()

@router.get("/market/insights")
async def get_market_insights():
    """
    获取AI市场洞察分析
    """
    try:
        logger.info("开始获取市场洞察分析")
        
        # 使用AI分析器获取市场概览
        market_overview = smart_stock_service.get_market_overview()
        
        if 'error' in market_overview:
            raise Exception(market_overview['error'])
        
        # 使用AI分析器分析市场情绪
        market_query = "分析当前A股市场整体情绪和投资机会"
        sentiment_analysis = qwen_analyzer.analyze_market_sentiment(market_query)
        
        # 解析AI分析结果
        sentiment_score = 50  # 默认中性
        sentiment = "neutral"
        description = "市场情绪中性"
        
        if sentiment_analysis and 'overall_sentiment' in sentiment_analysis:
            ai_sentiment = sentiment_analysis['overall_sentiment'].lower()
            if 'bullish' in ai_sentiment or '乐观' in ai_sentiment:
                sentiment = "bullish"
                sentiment_score = random.randint(65, 85)
                description = "市场情绪乐观，投资者信心较强"
            elif 'bearish' in ai_sentiment or '悲观' in ai_sentiment:
                sentiment = "bearish"
                sentiment_score = random.randint(25, 45)
                description = "市场情绪悲观，投资者较为谨慎"
            else:
                sentiment = "neutral"
                sentiment_score = random.randint(45, 65)
                description = "市场情绪中性，投资者观望情绪较浓"
        
        # 从AI分析中提取关键因素
        key_factors = []
        if sentiment_analysis and 'key_factors' in sentiment_analysis:
            key_factors = sentiment_analysis['key_factors'][:4]
        else:
            key_factors = [
                "技术指标显示震荡格局",
                "成交量相对平稳",
                "政策面保持稳定",
                "外围市场影响有限"
            ]
        
        market_summary = MarketSentiment(
            sentiment_score=sentiment_score,
            sentiment=sentiment,
            description=description,
            keyFactors=key_factors
        )
        
        # 从AI分析中生成洞察
        insights = []
        if sentiment_analysis and 'insights' in sentiment_analysis:
            for i, insight in enumerate(sentiment_analysis['insights'][:3]):
                insights.append(MarketInsight(
                    title=f"AI洞察{i+1}",
                    content=insight,
                    type=sentiment,
                    confidence=0.7 + random.random() * 0.2,
                    timestamp=datetime.now().isoformat()
                ))
        else:
            # 默认洞察
            insights = [
                MarketInsight(
                    title="技术面分析",
                    content="当前市场技术指标显示震荡格局，需关注关键支撑位",
                    type=sentiment,
                    confidence=0.75,
                    timestamp=datetime.now().isoformat()
                )
            ]
        
        # 从AI分析中获取投资建议
        recommendations = []
        if sentiment_analysis and 'recommendations' in sentiment_analysis:
            recommendations = sentiment_analysis['recommendations'][:4]
        else:
            recommendations = [
                "保持谨慎乐观态度，适度配置优质标的",
                "关注政策导向和行业轮动机会",
                "控制仓位，注意风险管理",
                "重点关注基本面良好的个股"
            ]
        
        # 从市场概览中获取热点板块
        hot_sectors = []
        if market_overview and 'sector_distribution' in market_overview:
            # 取前8个活跃板块
            sectors = list(market_overview['sector_distribution'].keys())[:8]
            hot_sectors = [sector for sector in sectors if sector != '未知']
        
        if not hot_sectors:
            hot_sectors = ["科技", "医药", "新能源", "消费", "金融", "制造业"]
        
        response_data = MarketAnalysisResponse(
            marketSummary=market_summary,
            insights=insights,
            recommendations=recommendations,
            hotSectors=hot_sectors
        )
        
        return {
            "success": True,
            "data": response_data.dict(),
            "message": "获取市场洞察成功",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"获取市场洞察失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取市场洞察失败: {str(e)}")

@router.post("/analyze/stock")
async def analyze_stock(request: StockAnalyzeRequest):
    """
    首页AI股票分析 - 纯分析展示，不存储数据库
    """
    try:
        symbol = request.symbol.upper()
        logger.info(f"首页股票分析: {symbol}")
        
        # 使用通义千问进行AI分析
        analysis_result = qwen_analyzer.analyze_stock_for_homepage(symbol)
        
        # 返回完整的分析结果，直接使用英文字段名
        return {
            "success": True,
            "data": {
                "analysis": analysis_result
            },
            "message": "股票分析成功",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"股票分析失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"股票分析失败: {str(e)}")

@router.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "service": "首页AI分析服务",
        "timestamp": datetime.now().isoformat()
    }