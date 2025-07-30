"""
智能股票推荐服务 - 整合AI关键词拆分和数据库查询
"""

from typing import List, Dict, Any, Optional
from .qwen_analyzer import QwenAnalyzer
from .database_service import DatabaseService
import logging
from datetime import datetime
from utils.helpers import clean_text

logger = logging.getLogger(__name__)

class SmartStockService:
    """智能股票推荐服务"""
    
    def __init__(self):
        self.qwen_analyzer = QwenAnalyzer()
        self.database_service = DatabaseService()
    
    async def analyze_stock(self, symbol: str) -> Dict[str, Any]:
        """
        异步分析单只股票（API调用版本）
        
        Args:
            symbol: 股票代码
            
        Returns:
            股票分析结果
        """
        # 调用同步版本的方法
        return self.get_stock_analysis(symbol)

    def intelligent_stock_search(self, query: str, max_results: int = 20) -> Dict[str, Any]:
        """
        智能股票搜索
        
        Args:
            query: 自然语言查询
            max_results: 最大返回结果数
            
        Returns:
            搜索结果
        """
        try:
            logger.info(f"开始智能股票搜索: {query}")
            
            # 第一步：使用AI拆分关键词和结构化条件
            logger.info("步骤1: AI关键词拆分和条件解析")
            structured_conditions = self.qwen_analyzer.parse_investment_query(query)
            
            if not structured_conditions or 'error' in structured_conditions:
                logger.warning("AI解析失败，使用传统方法")
                return self._fallback_search(query, max_results)
            
            logger.info(f"AI解析成功，置信度: {structured_conditions.get('confidence', 0):.2f}")
            
            # 第二步：从数据库中筛选股票
            logger.info("步骤2: 数据库股票筛选")
            matched_stocks = self.database_service.search_stocks_by_conditions(structured_conditions)
            
            if not matched_stocks:
                logger.warning("数据库未找到匹配股票")
                return {
                    'query': query,
                    'structured_conditions': structured_conditions,
                    'stocks': [],
                    'total_count': 0,
                    'message': '未找到符合条件的股票'
                }
            
            # 第三步：限制结果数量并排序
            limited_stocks = matched_stocks[:max_results]
            
            # 第四步：为每只股票生成AI推荐理由
            logger.info("步骤3: 生成AI推荐理由")
            for stock in limited_stocks:
                try:
                    recommendation_reason = self.qwen_analyzer.explain_stock_recommendation(
                        stock, structured_conditions
                    )
                    stock['ai_recommendation_reason'] = recommendation_reason
                except Exception as e:
                    logger.warning(f"生成推荐理由失败 {stock['symbol']}: {str(e)}")
                    stock['ai_recommendation_reason'] = "基于数据分析，该股票符合您的筛选条件。"
            
            # 构建返回结果
            result = {
                'query': query,
                'structured_conditions': structured_conditions,
                'parsing_method': 'ai_enhanced',
                'ai_confidence': structured_conditions.get('confidence', 0),
                'stocks': limited_stocks,
                'total_count': len(matched_stocks),
                'returned_count': len(limited_stocks),
                'message': f'找到 {len(matched_stocks)} 只符合条件的股票'
            }
            
            logger.info(f"智能股票搜索完成: 找到 {len(matched_stocks)} 只股票，返回 {len(limited_stocks)} 只")
            return result
            
        except Exception as e:
            logger.error(f"智能股票搜索失败: {str(e)}")
            return self._fallback_search(query, max_results)
    
    def get_stock_analysis(self, symbol: str) -> Dict[str, Any]:
        """
        获取单只股票的详细分析
        
        Args:
            symbol: 股票代码
            
        Returns:
            股票分析结果
        """
        try:
            logger.info(f"获取股票分析: {symbol}")
            
            # 从数据库获取股票详细信息
            stock_detail = self.database_service.get_stock_detail(symbol)
            
            if not stock_detail:
                return {
                    'symbol': symbol,
                    'error': '股票不存在或数据不完整'
                }
            
            # 使用通义千问进行AI综合分析
            ai_analysis = self.qwen_analyzer.analyze_stock_comprehensive(stock_detail)
            
            # 构建分析结果
            result = {
                'symbol': symbol,
                'name': stock_detail['basic_info'].get('name', f'股票{symbol}'),
                'analysis': ai_analysis.get('analysis', ''),
                'rating': ai_analysis.get('rating', 'C'),
                'technical_score': ai_analysis.get('technical_score', 50),
                'fundamental_score': ai_analysis.get('fundamental_score', 50),
                'recommendation': ai_analysis.get('recommendation', 'hold'),
                'target_price': ai_analysis.get('target_price'),
                'risk_level': ai_analysis.get('risk_level', 'medium'),
                'key_points': ai_analysis.get('key_points', []),
                'warnings': ai_analysis.get('warnings', []),
                'generatedAt': datetime.now().isoformat(),
                'basic_info': stock_detail['basic_info'],
                'financial_data': stock_detail.get('financial_data', {}),
                'technical_data': stock_detail.get('technical_data', {}),
                'price_data': stock_detail.get('price_data', {})
            }
            
            logger.info(f"股票分析完成: {symbol}")
            return result
            
        except Exception as e:
            logger.error(f"股票分析失败 {symbol}: {str(e)}")
            return {
                'symbol': symbol,
                'error': str(e)
            }
    
    def batch_stock_analysis(self, symbols: List[str]) -> Dict[str, Any]:
        """
        批量股票分析
        
        Args:
            symbols: 股票代码列表
            
        Returns:
            批量分析结果
        """
        try:
            logger.info(f"批量股票分析: {len(symbols)} 只股票")
            
            results = []
            for symbol in symbols:
                analysis = self.get_stock_analysis(symbol)
                results.append(analysis)
            
            # 生成批量分析摘要
            summary = self._generate_batch_summary(results)
            
            return {
                'symbols': symbols,
                'analyses': results,
                'summary': summary,
                'total_count': len(symbols),
                'success_count': len([r for r in results if 'error' not in r])
            }
            
        except Exception as e:
            logger.error(f"批量股票分析失败: {str(e)}")
            return {
                'symbols': symbols,
                'error': str(e)
            }
    
    def get_market_overview(self, sector: Optional[str] = None) -> Dict[str, Any]:
        """
        获取市场概览
        
        Args:
            sector: 特定行业（可选）
            
        Returns:
            市场概览数据
        """
        try:
            logger.info(f"获取市场概览: {sector or '全市场'}")
            
            # 构建查询条件
            conditions = {
                'sectors': [sector] if sector else [],
                'market_cap': 'any',
                'growth_type': 'any',
                'risk_level': 'any',
                'time_horizon': 'any',
                'financial_metrics': {},
                'technical_indicators': {},
                'keywords': [],
                'exclusions': [],
                'confidence': 1.0
            }
            
            # 从数据库获取股票数据
            stocks = self.database_service.search_stocks_by_conditions(conditions)
            
            if not stocks:
                return {
                    'sector': sector,
                    'message': '暂无数据'
                }
            
            # 统计分析
            overview = self._calculate_market_statistics(stocks, sector)
            
            logger.info(f"市场概览生成完成: {sector or '全市场'}")
            return overview
            
        except Exception as e:
            logger.error(f"市场概览生成失败: {str(e)}")
            return {
                'sector': sector,
                'error': str(e)
            }
    
    def _fallback_search(self, query: str, max_results: int) -> Dict[str, Any]:
        """降级搜索方法"""
        try:
            # 简单关键词提取
            keywords = self._extract_simple_keywords(query)
            
            # 构建简单条件
            conditions = {
                'sectors': [],
                'market_cap': 'any',
                'growth_type': 'any',
                'risk_level': 'any',
                'time_horizon': 'any',
                'financial_metrics': {},
                'technical_indicators': {},
                'keywords': keywords,
                'exclusions': [],
                'confidence': 0.3
            }
            
            # 数据库搜索
            matched_stocks = self.database_service.search_stocks_by_conditions(conditions)
            
            return {
                'query': query,
                'structured_conditions': conditions,
                'parsing_method': 'fallback',
                'ai_confidence': 0.3,
                'stocks': matched_stocks[:max_results],
                'total_count': len(matched_stocks),
                'returned_count': min(len(matched_stocks), max_results),
                'message': f'使用传统方法找到 {len(matched_stocks)} 只股票'
            }
            
        except Exception as e:
            logger.error(f"降级搜索失败: {str(e)}")
            return {
                'query': query,
                'stocks': [],
                'error': str(e)
            }
    
    def _extract_simple_keywords(self, query: str) -> List[str]:
        """简单关键词提取"""
        # 常见股票相关关键词
        stock_keywords = [
            "科技", "医药", "金融", "消费", "地产", "能源", "军工", "汽车",
            "新能源", "人工智能", "芯片", "5G", "区块链", "云计算",
            "高成长", "价值", "蓝筹", "小盘", "大盘", "中盘"
        ]
        
        found_keywords = []
        for keyword in stock_keywords:
            if keyword in query:
                found_keywords.append(keyword)
        
        return found_keywords
    
    def _generate_stock_analysis_text(self, stock_detail: Dict[str, Any]) -> str:
        """生成股票分析文本"""
        basic_info = stock_detail['basic_info']
        financial_data = stock_detail.get('financial_data', {})
        technical_data = stock_detail.get('technical_data', {})
        price_data = stock_detail.get('price_data', {})
        
        text_parts = []
        
        # 基础信息
        text_parts.append(f"{basic_info['name']}({basic_info['symbol']})是一家{basic_info.get('sector', '未知')}行业的公司")
        
        # 财务数据
        if financial_data:
            if financial_data.get('pe_ratio'):
                text_parts.append(f"市盈率为{financial_data['pe_ratio']:.2f}")
            if financial_data.get('roe'):
                text_parts.append(f"净资产收益率为{financial_data['roe']:.2f}%")
        
        # 技术数据
        if technical_data:
            if technical_data.get('trend_signal'):
                text_parts.append(f"技术面显示{technical_data['trend_signal']}")
            if technical_data.get('macd_signal_type'):
                text_parts.append(f"MACD出现{technical_data['macd_signal_type']}信号")
        
        # 价格数据
        if price_data:
            if price_data.get('change_percent'):
                change_desc = "上涨" if price_data['change_percent'] > 0 else "下跌"
                text_parts.append(f"最近{change_desc}{abs(price_data['change_percent']):.2f}%")
        
        return clean_text("，".join(text_parts))
    
    def _generate_analysis_summary(self, stock_detail: Dict[str, Any], sentiment_analysis: Dict[str, Any]) -> str:
        """生成分析摘要"""
        basic_info = stock_detail['basic_info']
        sentiment = sentiment_analysis.get('overall_sentiment', 'neutral')
        
        sentiment_map = {
            'bullish': '看涨',
            'bearish': '看跌',
            'neutral': '中性'
        }
        
        summary = f"{basic_info['name']}当前市场情绪为{sentiment_map.get(sentiment, '中性')}，建议投资者关注相关风险和机会。"
        return clean_text(summary)
    
    def _generate_batch_summary(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """生成批量分析摘要"""
        success_results = [r for r in results if 'error' not in r]
        
        if not success_results:
            return {'message': '所有股票分析均失败'}
        
        # 统计情绪分布
        sentiment_count = {'bullish': 0, 'bearish': 0, 'neutral': 0}
        
        for result in success_results:
            sentiment = result.get('ai_sentiment_analysis', {}).get('overall_sentiment', 'neutral')
            sentiment_count[sentiment] = sentiment_count.get(sentiment, 0) + 1
        
        return {
            'total_analyzed': len(success_results),
            'sentiment_distribution': sentiment_count,
            'bullish_ratio': sentiment_count['bullish'] / len(success_results),
            'market_mood': '乐观' if sentiment_count['bullish'] > sentiment_count['bearish'] else '谨慎'
        }
    
    def _calculate_market_statistics(self, stocks: List[Dict[str, Any]], sector: Optional[str]) -> Dict[str, Any]:
        """计算市场统计数据"""
        if not stocks:
            return {}
        
        # 统计基础数据
        total_stocks = len(stocks)
        
        # 统计行业分布
        sector_count = {}
        pe_ratios = []
        market_caps = {}
        
        for stock in stocks:
            # 行业统计
            stock_sector = stock.get('sector', '未知')
            sector_count[stock_sector] = sector_count.get(stock_sector, 0) + 1
            
            # PE比率统计
            financial_data = stock.get('financial_data', {})
            if financial_data and financial_data.get('pe_ratio'):
                pe_ratios.append(financial_data['pe_ratio'])
            
            # 市值统计
            market_cap = stock.get('market_cap', '未知')
            market_caps[market_cap] = market_caps.get(market_cap, 0) + 1
        
        # 计算PE比率统计
        pe_stats = {}
        if pe_ratios:
            pe_stats = {
                'average': sum(pe_ratios) / len(pe_ratios),
                'median': sorted(pe_ratios)[len(pe_ratios) // 2],
                'min': min(pe_ratios),
                'max': max(pe_ratios)
            }
        
        return {
            'sector': sector or '全市场',
            'total_stocks': total_stocks,
            'sector_distribution': sector_count,
            'market_cap_distribution': market_caps,
            'pe_ratio_statistics': pe_stats,
            'analysis_date': datetime.now().isoformat()
        }