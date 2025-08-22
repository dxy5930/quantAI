#!/usr/bin/env python3
"""
首页API
提供首页所需的所有数据接口，包括用户统计、最近活动、市场数据等
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, func
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
from models.database import get_db
from models.workflow_models import WorkflowInstance, WorkflowStatus
from models.review_models import Review, ReviewStatus
from models.user_models import User
from api.user_api import get_current_user_from_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["首页数据"])

# 请求模型
class StockAnalyzeRequest(BaseModel):
    symbol: str

# 响应模型
class UserStats(BaseModel):
    workflows: int
    reviews: int
    totalAnalysis: int
    successRate: str

class RecentActivity(BaseModel):
    id: str
    title: str
    description: str
    time: str
    type: str  # 'workflow' or 'review'

class MarketDataItem(BaseModel):
    symbol: str
    name: str
    price: str
    change: str
    changePercent: str

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
        "service": "首页数据服务",
        "timestamp": datetime.now().isoformat()
    }

@router.get("/home/user-stats")
async def get_user_stats(request: Request, db: Session = Depends(get_db)):
    """
    获取用户统计数据（需要登录）
    """
    try:
        user = get_current_user_from_token(request, db)
        
        # 统计用户的工作流数据
        total_workflows = db.query(WorkflowInstance).filter(
            WorkflowInstance.user_id == user.id,
            WorkflowInstance.is_deleted == 0
        ).count()
        
        completed_workflows = db.query(WorkflowInstance).filter(
            WorkflowInstance.user_id == user.id,
            WorkflowInstance.status == WorkflowStatus.COMPLETED,
            WorkflowInstance.is_deleted == 0
        ).count()
        
        # 统计用户的复盘数据
        total_reviews = db.query(Review).filter(
            Review.user_id == user.id
        ).count()
        
        completed_reviews = db.query(Review).filter(
            Review.user_id == user.id,
            Review.status == ReviewStatus.COMPLETED
        ).count()
        
        # 计算成功率（基于完成的工作流和复盘）
        total_tasks = total_workflows + total_reviews
        completed_tasks = completed_workflows + completed_reviews
        success_rate = "0%"
        if total_tasks > 0:
            rate = (completed_tasks / total_tasks) * 100
            success_rate = f"{rate:.1f}%"
        
        # 算上个月的数据增长
        last_month = datetime.now() - timedelta(days=30)
        
        workflows_this_month = db.query(WorkflowInstance).filter(
            WorkflowInstance.user_id == user.id,
            WorkflowInstance.created_at >= last_month,
            WorkflowInstance.is_deleted == 0
        ).count()
        
        reviews_this_month = db.query(Review).filter(
            Review.user_id == user.id,
            Review.created_at >= last_month
        ).count()
        
        # 估算总分析数量（工作流步骤数 + 复盘数）
        # 这是一个简化的估算，实际上可以统计实际的AI分析次数
        total_analysis = total_workflows * 5 + total_reviews  # 假设每个工作流平均有5个分析步骤
        
        stats = UserStats(
            workflows=total_workflows,
            reviews=total_reviews,
            totalAnalysis=total_analysis,
            successRate=success_rate
        )
        
        return {
            "success": True,
            "data": {
                "stats": stats.dict(),
                "growth": {
                    "workflowsThisMonth": workflows_this_month,
                    "reviewsThisMonth": reviews_this_month
                }
            },
            "message": "获取用户统计成功",
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        # 重新抛出HTTPException（通常是401 Unauthorized）
        raise
    except Exception as e:
        logger.error(f"获取用户统计失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取用户统计失败: {str(e)}")

@router.get("/home/recent-activities")
async def get_recent_activities(request: Request, db: Session = Depends(get_db)):
    """
    获取用户最近活动（需要登录）
    """
    try:
        user = get_current_user_from_token(request, db)
        
        activities = []
        
        # 获取最近的工作流（最多5个）
        recent_workflows = db.query(WorkflowInstance).filter(
            WorkflowInstance.user_id == user.id,
            WorkflowInstance.is_deleted == 0
        ).order_by(desc(WorkflowInstance.last_activity)).limit(5).all()
        
        for workflow in recent_workflows:
            time_diff = datetime.now() - workflow.last_activity
            if time_diff.days > 0:
                time_str = f"{time_diff.days}天前"
            elif time_diff.seconds > 3600:
                hours = time_diff.seconds // 3600
                time_str = f"{hours}小时前"
            else:
                minutes = time_diff.seconds // 60
                time_str = f"{minutes}分钟前"
            
            status_text = {
                WorkflowStatus.RUNNING: "运行中",
                WorkflowStatus.COMPLETED: "已完成",
                WorkflowStatus.FAILED: "已失败",
                WorkflowStatus.PAUSED: "已暂停"
            }.get(workflow.status, "未知")
            
            activities.append(RecentActivity(
                id=workflow.id,
                title=workflow.title,
                description=f"AI工作流 • {status_text}",
                time=time_str,
                type="workflow"
            ))
        
        # 获取最近的复盘（最多3个）
        recent_reviews = db.query(Review).filter(
            Review.user_id == user.id
        ).order_by(desc(Review.updated_at)).limit(3).all()
        
        for review in recent_reviews:
            time_diff = datetime.now() - review.updated_at
            if time_diff.days > 0:
                time_str = f"{time_diff.days}天前"
            elif time_diff.seconds > 3600:
                hours = time_diff.seconds // 3600
                time_str = f"{hours}小时前"
            else:
                minutes = time_diff.seconds // 60
                time_str = f"{minutes}分钟前"
            
            status_text = {
                ReviewStatus.DRAFT: "草稿",
                ReviewStatus.COMPLETED: "已完成"
            }.get(review.status, "未知")
            
            activities.append(RecentActivity(
                id=review.review_id,
                title=review.title,
                description=f"复盘分析 • {status_text}",
                time=time_str,
                type="review"
            ))
        
        # 按时间排序，取最近的10个
        activities.sort(key=lambda x: x.time)
        activities = activities[:10]
        
        return {
            "success": True,
            "data": {
                "activities": [activity.dict() for activity in activities]
            },
            "message": "获取最近活动成功",
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取最近活动失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取最近活动失败: {str(e)}")

@router.get("/home/market-data")
async def get_market_data():
    """
    获取市场数据（公开数据，不需要登录）
    """
    try:
        logger.info("开始获取市场数据")
        
        # 使用智能股票服务获取市场数据
        market_overview = smart_stock_service.get_market_overview()
        
        market_data = []
        
        if market_overview and 'top_stocks' in market_overview:
            # 使用真实的市场数据
            for stock in market_overview['top_stocks'][:6]:  # 取前6个
                symbol = stock.get('symbol', '')
                name = stock.get('name', symbol)
                current_price = stock.get('current_price', 0)
                
                # 计算涨跌幅（模拟）
                change_percent = random.uniform(-3.0, 3.0)
                change_amount = current_price * (change_percent / 100)
                
                change_str = f"+{change_amount:.2f}" if change_amount >= 0 else f"{change_amount:.2f}"
                change_percent_str = f"+{change_percent:.2f}%" if change_percent >= 0 else f"{change_percent:.2f}%"
                
                market_data.append(MarketDataItem(
                    symbol=symbol,
                    name=name,
                    price=f"{current_price:.2f}",
                    change=change_str,
                    changePercent=change_percent_str
                ))
        
        # 如果没有获取到真实数据，使用默认数据
        if not market_data:
            default_stocks = [
                {'symbol': '000001.SZ', 'name': '平安银行', 'price': 12.45},
                {'symbol': '000002.SZ', 'name': '万科A', 'price': 18.76},
                {'symbol': '600519.SH', 'name': '贵州茅台', 'price': 1876.50},
                {'symbol': '000858.SZ', 'name': '五粮液', 'price': 158.90},
                {'symbol': '600036.SH', 'name': '招商银行', 'price': 45.68},
                {'symbol': '000725.SZ', 'name': '京东方A', 'price': 24.32}
            ]
            
            for stock in default_stocks:
                change_percent = random.uniform(-3.0, 3.0)
                change_amount = stock['price'] * (change_percent / 100)
                
                change_str = f"+{change_amount:.2f}" if change_amount >= 0 else f"{change_amount:.2f}"
                change_percent_str = f"+{change_percent:.2f}%" if change_percent >= 0 else f"{change_percent:.2f}%"
                
                market_data.append(MarketDataItem(
                    symbol=stock['symbol'],
                    name=stock['name'],
                    price=f"{stock['price']:.2f}",
                    change=change_str,
                    changePercent=change_percent_str
                ))
        
        return {
            "success": True,
            "data": {
                "marketData": [item.dict() for item in market_data]
            },
            "message": "获取市场数据成功",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"获取市场数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取市场数据失败: {str(e)}")