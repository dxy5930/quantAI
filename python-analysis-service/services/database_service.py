"""
数据库服务 - 股票数据查询和筛选
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, asc
from typing import List, Dict, Any, Optional, Tuple
from models.database import get_db, SessionLocal
from models.stock_models import Stock, StockPrice, StockFinancial, StockTechnical, StockConcept
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class DatabaseService:
    """数据库服务类"""
    
    def __init__(self):
        self.db = SessionLocal()
    
    def __del__(self):
        if hasattr(self, 'db'):
            self.db.close()
    
    def search_stocks_by_conditions(self, conditions: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        根据结构化条件搜索股票
        
        Args:
            conditions: 结构化查询条件
            
        Returns:
            符合条件的股票列表
        """
        try:
            # 构建基础查询
            query = self.db.query(Stock).filter(Stock.is_active == True)
            
            # 行业筛选
            sectors = conditions.get('sectors', [])
            if sectors:
                sector_filters = []
                for sector in sectors:
                    sector_filters.append(Stock.sector.like(f'%{sector}%'))
                    sector_filters.append(Stock.industry.like(f'%{sector}%'))
                query = query.filter(or_(*sector_filters))
            
            # 市值筛选
            market_cap = conditions.get('market_cap', 'any')
            if market_cap != 'any':
                market_cap_map = {
                    'large': '大盘股',
                    'mid': '中盘股', 
                    'small': '小盘股'
                }
                if market_cap in market_cap_map:
                    query = query.filter(Stock.market_cap == market_cap_map[market_cap])
            
            # 获取基础股票列表
            stocks = query.limit(1000).all()  # 限制查询数量
            
            if not stocks:
                return []
            
            # 获取股票代码列表
            symbols = [stock.symbol for stock in stocks]
            
            # 应用财务指标筛选
            filtered_symbols = self._filter_by_financial_metrics(
                symbols, conditions.get('financial_metrics', {})
            )
            
            # 应用技术指标筛选
            filtered_symbols = self._filter_by_technical_indicators(
                filtered_symbols, conditions.get('technical_indicators', {})
            )
            
            # 应用关键词筛选
            keywords = conditions.get('keywords', [])
            if keywords:
                filtered_symbols = self._filter_by_keywords(filtered_symbols, keywords)
            
            # 构建最终结果
            result_stocks = []
            for stock in stocks:
                if stock.symbol in filtered_symbols:
                    # 获取最新财务数据
                    financial_data = self._get_latest_financial_data(stock.symbol)
                    
                    # 获取最新技术数据
                    technical_data = self._get_latest_technical_data(stock.symbol)
                    
                    # 获取最新价格数据
                    price_data = self._get_latest_price_data(stock.symbol)
                    
                    # 获取概念标签
                    concepts = self._get_stock_concepts(stock.symbol)
                    
                    stock_info = {
                        'symbol': stock.symbol,
                        'name': stock.name,
                        'sector': stock.sector,
                        'industry': stock.industry,
                        'market': stock.market,
                        'market_cap': stock.market_cap,
                        'description': stock.description,
                        'financial_data': financial_data,
                        'technical_data': technical_data,
                        'price_data': price_data,
                        'concepts': concepts,
                        'match_score': self._calculate_match_score(stock.symbol, conditions)
                    }
                    result_stocks.append(stock_info)
            
            # 按匹配度排序
            result_stocks.sort(key=lambda x: x['match_score'], reverse=True)
            
            logger.info(f"数据库筛选完成，找到 {len(result_stocks)} 只股票")
            return result_stocks
            
        except Exception as e:
            logger.error(f"数据库股票搜索失败: {str(e)}")
            return []
    
    def _filter_by_financial_metrics(self, symbols: List[str], financial_metrics: Dict[str, Any]) -> List[str]:
        """根据财务指标筛选股票"""
        if not financial_metrics or not symbols:
            return symbols
        
        try:
            # 获取最新财务数据的子查询
            latest_financial_subquery = (
                self.db.query(
                    StockFinancial.symbol,
                    func.max(StockFinancial.report_date).label('latest_date')
                )
                .filter(StockFinancial.symbol.in_(symbols))
                .group_by(StockFinancial.symbol)
                .subquery()
            )
            
            # 主查询
            query = (
                self.db.query(StockFinancial)
                .join(
                    latest_financial_subquery,
                    and_(
                        StockFinancial.symbol == latest_financial_subquery.c.symbol,
                        StockFinancial.report_date == latest_financial_subquery.c.latest_date
                    )
                )
            )
            
            # 应用财务指标筛选条件
            filters = []
            
            # 市盈率筛选
            pe_ratio = financial_metrics.get('pe_ratio', {})
            if pe_ratio.get('min') is not None:
                filters.append(StockFinancial.pe_ratio >= pe_ratio['min'])
            if pe_ratio.get('max') is not None:
                filters.append(StockFinancial.pe_ratio <= pe_ratio['max'])
            
            # 市净率筛选
            pb_ratio = financial_metrics.get('pb_ratio', {})
            if pb_ratio.get('min') is not None:
                filters.append(StockFinancial.pb_ratio >= pb_ratio['min'])
            if pb_ratio.get('max') is not None:
                filters.append(StockFinancial.pb_ratio <= pb_ratio['max'])
            
            # ROE筛选
            roe = financial_metrics.get('roe', {})
            if roe.get('min') is not None:
                filters.append(StockFinancial.roe >= roe['min'])
            if roe.get('max') is not None:
                filters.append(StockFinancial.roe <= roe['max'])
            
            # 资产负债率筛选
            debt_ratio = financial_metrics.get('debt_ratio', {})
            if debt_ratio.get('min') is not None:
                filters.append(StockFinancial.debt_ratio >= debt_ratio['min'])
            if debt_ratio.get('max') is not None:
                filters.append(StockFinancial.debt_ratio <= debt_ratio['max'])
            
            if filters:
                query = query.filter(and_(*filters))
            
            # 执行查询并返回符合条件的股票代码
            financial_stocks = query.all()
            filtered_symbols = [stock.symbol for stock in financial_stocks]
            
            logger.info(f"财务指标筛选: {len(symbols)} -> {len(filtered_symbols)}")
            return filtered_symbols
            
        except Exception as e:
            logger.error(f"财务指标筛选失败: {str(e)}")
            return symbols
    
    def _filter_by_technical_indicators(self, symbols: List[str], technical_indicators: Dict[str, Any]) -> List[str]:
        """根据技术指标筛选股票"""
        if not technical_indicators or not symbols:
            return symbols
        
        try:
            # 获取最新技术数据的子查询
            latest_technical_subquery = (
                self.db.query(
                    StockTechnical.symbol,
                    func.max(StockTechnical.date).label('latest_date')
                )
                .filter(StockTechnical.symbol.in_(symbols))
                .group_by(StockTechnical.symbol)
                .subquery()
            )
            
            # 主查询
            query = (
                self.db.query(StockTechnical)
                .join(
                    latest_technical_subquery,
                    and_(
                        StockTechnical.symbol == latest_technical_subquery.c.symbol,
                        StockTechnical.date == latest_technical_subquery.c.latest_date
                    )
                )
            )
            
            # 应用技术指标筛选条件
            filters = []
            
            # 趋势筛选
            trend = technical_indicators.get('trend', 'any')
            if trend != 'any':
                trend_map = {
                    'bullish': ['上涨', '强势上涨', '突破'],
                    'bearish': ['下跌', '强势下跌', '跌破'],
                    'sideways': ['震荡', '整理', '盘整']
                }
                if trend in trend_map:
                    trend_filters = []
                    for trend_signal in trend_map[trend]:
                        trend_filters.append(StockTechnical.trend_signal.like(f'%{trend_signal}%'))
                    filters.append(or_(*trend_filters))
            
            # 动量筛选
            momentum = technical_indicators.get('momentum', 'any')
            if momentum != 'any':
                if momentum == 'strong':
                    # MACD金叉或RSI > 50
                    momentum_filters = [
                        StockTechnical.macd_signal_type == '金叉',
                        StockTechnical.rsi > 50
                    ]
                    filters.append(or_(*momentum_filters))
                elif momentum == 'weak':
                    # MACD死叉或RSI < 50
                    momentum_filters = [
                        StockTechnical.macd_signal_type == '死叉',
                        StockTechnical.rsi < 50
                    ]
                    filters.append(or_(*momentum_filters))
            
            if filters:
                query = query.filter(and_(*filters))
            
            # 执行查询并返回符合条件的股票代码
            technical_stocks = query.all()
            filtered_symbols = [stock.symbol for stock in technical_stocks]
            
            logger.info(f"技术指标筛选: {len(symbols)} -> {len(filtered_symbols)}")
            return filtered_symbols
            
        except Exception as e:
            logger.error(f"技术指标筛选失败: {str(e)}")
            return symbols
    
    def _filter_by_keywords(self, symbols: List[str], keywords: List[str]) -> List[str]:
        """根据关键词筛选股票"""
        if not keywords or not symbols:
            return symbols
        
        try:
            # 在股票基础信息中搜索关键词
            stock_filters = []
            for keyword in keywords:
                stock_filters.extend([
                    Stock.name.collate('utf8mb4_unicode_ci').like(f'%{keyword}%'),
                    Stock.sector.collate('utf8mb4_unicode_ci').like(f'%{keyword}%'),
                    Stock.industry.collate('utf8mb4_unicode_ci').like(f'%{keyword}%'),
                    Stock.description.collate('utf8mb4_unicode_ci').like(f'%{keyword}%')
                ])
            
            stock_query = (
                self.db.query(Stock.symbol)
                .filter(Stock.symbol.in_(symbols))
                .filter(or_(*stock_filters))
            )
            
            matched_symbols = set([stock.symbol for stock in stock_query.all()])
            
            # 在概念标签中搜索关键词
            concept_filters = []
            for keyword in keywords:
                concept_filters.extend([
                    StockConcept.concept.like(f'%{keyword}%'),
                    StockConcept.concept_type.like(f'%{keyword}%')
                ])
            
            concept_query = (
                self.db.query(StockConcept.symbol)
                .filter(StockConcept.symbol.in_(symbols))
                .filter(StockConcept.is_active == True)
                .filter(or_(*concept_filters))
            )
            
            concept_matched_symbols = set([concept.symbol for concept in concept_query.all()])
            
            # 合并结果
            all_matched_symbols = list(matched_symbols.union(concept_matched_symbols))
            
            logger.info(f"关键词筛选: {len(symbols)} -> {len(all_matched_symbols)}")
            return all_matched_symbols
            
        except Exception as e:
            logger.error(f"关键词筛选失败: {str(e)}")
            return symbols
    
    def _get_latest_financial_data(self, symbol: str) -> Optional[Dict[str, Any]]:
        """获取最新财务数据"""
        try:
            financial = (
                self.db.query(StockFinancial)
                .filter(StockFinancial.symbol == symbol)
                .order_by(desc(StockFinancial.report_date))
                .first()
            )
            
            if financial:
                return {
                    'pe_ratio': financial.pe_ratio,
                    'pb_ratio': financial.pb_ratio,
                    'roe': financial.roe,
                    'debt_ratio': financial.debt_ratio,
                    'revenue_growth': financial.revenue_growth,
                    'profit_growth': financial.profit_growth,
                    'report_date': financial.report_date.isoformat() if financial.report_date else None
                }
            return None
        except Exception as e:
            logger.error(f"获取财务数据失败 {symbol}: {str(e)}")
            return None
    
    def _get_latest_technical_data(self, symbol: str) -> Optional[Dict[str, Any]]:
        """获取最新技术数据"""
        try:
            technical = (
                self.db.query(StockTechnical)
                .filter(StockTechnical.symbol == symbol)
                .order_by(desc(StockTechnical.date))
                .first()
            )
            
            if technical:
                return {
                    'rsi': technical.rsi,
                    'macd': technical.macd,
                    'macd_signal_type': technical.macd_signal_type,
                    'trend_signal': technical.trend_signal,
                    'ma20': technical.ma20,
                    'ma50': technical.ma50,
                    'date': technical.date.isoformat() if technical.date else None
                }
            return None
        except Exception as e:
            logger.error(f"获取技术数据失败 {symbol}: {str(e)}")
            return None
    
    def _get_latest_price_data(self, symbol: str) -> Optional[Dict[str, Any]]:
        """获取最新价格数据"""
        try:
            price = (
                self.db.query(StockPrice)
                .filter(StockPrice.symbol == symbol)
                .order_by(desc(StockPrice.date))
                .first()
            )
            
            if price:
                return {
                    'close_price': price.close_price,
                    'change_percent': price.change_percent,
                    'volume': price.volume,
                    'turnover': price.turnover,
                    'date': price.date.isoformat() if price.date else None
                }
            return None
        except Exception as e:
            logger.error(f"获取价格数据失败 {symbol}: {str(e)}")
            return None
    
    def _get_stock_concepts(self, symbol: str) -> List[str]:
        """获取股票概念标签"""
        try:
            concepts = (
                self.db.query(StockConcept.concept)
                .filter(StockConcept.symbol == symbol)
                .filter(StockConcept.is_active == True)
                .all()
            )
            
            return [concept.concept for concept in concepts]
        except Exception as e:
            logger.error(f"获取概念标签失败 {symbol}: {str(e)}")
            return []
    
    def _calculate_match_score(self, symbol: str, conditions: Dict[str, Any]) -> float:
        """计算匹配度评分"""
        try:
            score = 0.0
            
            # 基础分数
            score += 0.1
            
            # 关键词匹配加分
            keywords = conditions.get('keywords', [])
            if keywords:
                concepts = self._get_stock_concepts(symbol)
                for keyword in keywords:
                    for concept in concepts:
                        if keyword in concept:
                            score += 0.2
            
            # 财务指标匹配加分
            financial_data = self._get_latest_financial_data(symbol)
            if financial_data:
                financial_metrics = conditions.get('financial_metrics', {})
                
                # PE比率匹配
                pe_ratio = financial_metrics.get('pe_ratio', {})
                if pe_ratio.get('min') and financial_data.get('pe_ratio'):
                    if financial_data['pe_ratio'] >= pe_ratio['min']:
                        score += 0.15
                
                # ROE匹配
                roe = financial_metrics.get('roe', {})
                if roe.get('min') and financial_data.get('roe'):
                    if financial_data['roe'] >= roe['min']:
                        score += 0.15
            
            # 技术指标匹配加分
            technical_data = self._get_latest_technical_data(symbol)
            if technical_data:
                technical_indicators = conditions.get('technical_indicators', {})
                
                # MACD信号匹配
                if technical_indicators.get('momentum') == 'strong':
                    if technical_data.get('macd_signal_type') == '金叉':
                        score += 0.2
                
                # 趋势匹配
                if technical_indicators.get('trend') == 'bullish':
                    if technical_data.get('trend_signal') and '上涨' in technical_data['trend_signal']:
                        score += 0.15
            
            return min(score, 1.0)  # 限制最大值为1.0
            
        except Exception as e:
            logger.error(f"计算匹配度失败 {symbol}: {str(e)}")
            return 0.1
    
    def get_stock_detail(self, symbol: str) -> Optional[Dict[str, Any]]:
        """获取股票详细信息"""
        try:
            stock = self.db.query(Stock).filter(Stock.symbol == symbol).first()
            if not stock:
                return None
            

            
            return {
                'basic_info': {
                    'symbol': stock.symbol,
                    'name': stock.name,
                    'sector': stock.sector,
                    'industry': stock.industry,
                    'market': stock.market,
                    'market_cap': stock.marketCap,
                    'pe_ratio': stock.peRatio,
                    'pb_ratio': stock.pbRatio,
                    'dividend_yield': stock.dividendYield
                },
                'financial_data': self._get_latest_financial_data(symbol),
                'technical_data': self._get_latest_technical_data(symbol),
                'price_data': self._get_latest_price_data(symbol),
                'concepts': self._get_stock_concepts(symbol)
            }
            
        except Exception as e:
            logger.error(f"获取股票详情失败 {symbol}: {str(e)}")
            return None