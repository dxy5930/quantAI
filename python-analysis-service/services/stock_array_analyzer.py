"""
股票数组分析服务 - 通过通义千问结合数据库数据分析股票数组
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from services.qwen_analyzer import QwenAnalyzer
from services.database_service import DatabaseService
import json

logger = logging.getLogger(__name__)

class StockArrayAnalyzer:
    """股票数组分析器"""
    
    def __init__(self):
        self.qwen_analyzer = QwenAnalyzer()
        self.db_service = DatabaseService()
    
    def analyze_stock_array(self, stock_symbols: List[str], analysis_type: str = "comprehensive") -> Dict[str, Any]:
        """
        分析股票数组
        
        Args:
            stock_symbols: 股票代码数组
            analysis_type: 分析类型 (comprehensive, risk, opportunity, comparison)
            
        Returns:
            分析结果
        """
        try:
            if not stock_symbols:
                return self._get_empty_result("股票数组为空")
            
            # 获取股票详细数据
            stocks_data = self._get_stocks_detailed_data(stock_symbols)
            
            if not stocks_data:
                return self._get_empty_result("未找到有效的股票数据")
            
            # 根据分析类型进行不同的分析
            if analysis_type == "comprehensive":
                return self._comprehensive_analysis(stocks_data)
            elif analysis_type == "risk":
                return self._risk_analysis(stocks_data)
            elif analysis_type == "opportunity":
                return self._opportunity_analysis(stocks_data)
            elif analysis_type == "comparison":
                return self._comparison_analysis(stocks_data)
            else:
                return self._comprehensive_analysis(stocks_data)
                
        except Exception as e:
            logger.error(f"股票数组分析失败: {str(e)}")
            return self._get_error_result(str(e))
    
    def _get_stocks_detailed_data(self, stock_symbols: List[str]) -> List[Dict[str, Any]]:
        """获取股票详细数据"""
        stocks_data = []
        
        for symbol in stock_symbols:
            try:
                stock_detail = self.db_service.get_stock_detail(symbol)
                if stock_detail:
                    stocks_data.append(stock_detail)
                else:
                    logger.warning(f"未找到股票数据: {symbol}")
            except Exception as e:
                logger.error(f"获取股票数据失败 {symbol}: {str(e)}")
        
        return stocks_data
    
    def _comprehensive_analysis(self, stocks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """综合分析"""
        try:
            # 基础统计分析
            basic_stats = self._calculate_basic_statistics(stocks_data)
            
            # 行业分布分析
            sector_analysis = self._analyze_sector_distribution(stocks_data)
            
            # 财务指标分析
            financial_analysis = self._analyze_financial_metrics(stocks_data)
            
            # 技术指标分析
            technical_analysis = self._analyze_technical_indicators(stocks_data)
            
            # 风险评估
            risk_assessment = self._assess_portfolio_risk(stocks_data)
            
            # 使用通义千问生成综合分析报告
            ai_analysis = self._generate_ai_comprehensive_analysis(stocks_data, {
                'basic_stats': basic_stats,
                'sector_analysis': sector_analysis,
                'financial_analysis': financial_analysis,
                'technical_analysis': technical_analysis,
                'risk_assessment': risk_assessment
            })
            
            return {
                'analysis_type': 'comprehensive',
                'timestamp': datetime.now().isoformat(),
                'stocks_count': len(stocks_data),
                'basic_statistics': basic_stats,
                'sector_analysis': sector_analysis,
                'financial_analysis': financial_analysis,
                'technical_analysis': technical_analysis,
                'risk_assessment': risk_assessment,
                'ai_insights': ai_analysis,
                'recommendations': self._generate_recommendations(stocks_data, ai_analysis),
                'portfolio_score': self._calculate_portfolio_score(stocks_data),
                'success': True
            }
            
        except Exception as e:
            logger.error(f"综合分析失败: {str(e)}")
            return self._get_error_result(str(e))
    
    def _risk_analysis(self, stocks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """风险分析"""
        try:
            # 风险指标计算
            risk_metrics = self._calculate_risk_metrics(stocks_data)
            
            # 行业集中度风险
            concentration_risk = self._analyze_concentration_risk(stocks_data)
            
            # 财务风险评估
            financial_risk = self._assess_financial_risk(stocks_data)
            
            # 技术风险信号
            technical_risk = self._identify_technical_risks(stocks_data)
            
            # AI风险分析
            ai_risk_analysis = self._generate_ai_risk_analysis(stocks_data, {
                'risk_metrics': risk_metrics,
                'concentration_risk': concentration_risk,
                'financial_risk': financial_risk,
                'technical_risk': technical_risk
            })
            
            return {
                'analysis_type': 'risk',
                'timestamp': datetime.now().isoformat(),
                'stocks_count': len(stocks_data),
                'overall_risk_level': self._calculate_overall_risk_level(risk_metrics),
                'risk_metrics': risk_metrics,
                'concentration_risk': concentration_risk,
                'financial_risk': financial_risk,
                'technical_risk': technical_risk,
                'ai_risk_insights': ai_risk_analysis,
                'risk_mitigation_suggestions': self._generate_risk_mitigation_suggestions(ai_risk_analysis),
                'success': True
            }
            
        except Exception as e:
            logger.error(f"风险分析失败: {str(e)}")
            return self._get_error_result(str(e))
    
    def _opportunity_analysis(self, stocks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """机会分析"""
        try:
            # 价值机会识别
            value_opportunities = self._identify_value_opportunities(stocks_data)
            
            # 成长机会识别
            growth_opportunities = self._identify_growth_opportunities(stocks_data)
            
            # 技术机会识别
            technical_opportunities = self._identify_technical_opportunities(stocks_data)
            
            # 行业轮动机会
            sector_rotation_opportunities = self._analyze_sector_rotation_opportunities(stocks_data)
            
            # AI机会分析
            ai_opportunity_analysis = self._generate_ai_opportunity_analysis(stocks_data, {
                'value_opportunities': value_opportunities,
                'growth_opportunities': growth_opportunities,
                'technical_opportunities': technical_opportunities,
                'sector_rotation': sector_rotation_opportunities
            })
            
            return {
                'analysis_type': 'opportunity',
                'timestamp': datetime.now().isoformat(),
                'stocks_count': len(stocks_data),
                'value_opportunities': value_opportunities,
                'growth_opportunities': growth_opportunities,
                'technical_opportunities': technical_opportunities,
                'sector_rotation_opportunities': sector_rotation_opportunities,
                'ai_opportunity_insights': ai_opportunity_analysis,
                'priority_recommendations': self._generate_priority_recommendations(ai_opportunity_analysis),
                'success': True
            }
            
        except Exception as e:
            logger.error(f"机会分析失败: {str(e)}")
            return self._get_error_result(str(e))
    
    def _comparison_analysis(self, stocks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """对比分析"""
        try:
            # 财务指标对比
            financial_comparison = self._compare_financial_metrics(stocks_data)
            
            # 技术指标对比
            technical_comparison = self._compare_technical_indicators(stocks_data)
            
            # 估值对比
            valuation_comparison = self._compare_valuations(stocks_data)
            
            # 风险收益对比
            risk_return_comparison = self._compare_risk_return(stocks_data)
            
            # AI对比分析
            ai_comparison_analysis = self._generate_ai_comparison_analysis(stocks_data, {
                'financial_comparison': financial_comparison,
                'technical_comparison': technical_comparison,
                'valuation_comparison': valuation_comparison,
                'risk_return_comparison': risk_return_comparison
            })
            
            return {
                'analysis_type': 'comparison',
                'timestamp': datetime.now().isoformat(),
                'stocks_count': len(stocks_data),
                'financial_comparison': financial_comparison,
                'technical_comparison': technical_comparison,
                'valuation_comparison': valuation_comparison,
                'risk_return_comparison': risk_return_comparison,
                'ai_comparison_insights': ai_comparison_analysis,
                'ranking': self._generate_stock_ranking(stocks_data, ai_comparison_analysis),
                'success': True
            }
            
        except Exception as e:
            logger.error(f"对比分析失败: {str(e)}")
            return self._get_error_result(str(e))
    
    def _calculate_basic_statistics(self, stocks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """计算基础统计信息"""
        try:
            total_stocks = len(stocks_data)
            sectors = {}
            market_caps = {}
            avg_pe = 0
            avg_pb = 0
            pe_count = 0
            pb_count = 0
            
            for stock in stocks_data:
                # 行业统计
                sector = stock.get('basic_info', {}).get('sector', '未知')
                sectors[sector] = sectors.get(sector, 0) + 1
                
                # 市值统计
                market_cap = stock.get('basic_info', {}).get('market_cap', '未知')
                market_caps[market_cap] = market_caps.get(market_cap, 0) + 1
                
                # 财务指标统计
                financial_data = stock.get('financial_data', {})
                if financial_data:
                    if financial_data.get('pe_ratio'):
                        avg_pe += financial_data['pe_ratio']
                        pe_count += 1
                    if financial_data.get('pb_ratio'):
                        avg_pb += financial_data['pb_ratio']
                        pb_count += 1
            
            return {
                'total_stocks': total_stocks,
                'sector_distribution': sectors,
                'market_cap_distribution': market_caps,
                'average_pe_ratio': round(avg_pe / pe_count, 2) if pe_count > 0 else None,
                'average_pb_ratio': round(avg_pb / pb_count, 2) if pb_count > 0 else None,
                'data_completeness': {
                    'financial_data_available': sum(1 for stock in stocks_data if stock.get('financial_data')),
                    'technical_data_available': sum(1 for stock in stocks_data if stock.get('technical_data')),
                    'price_data_available': sum(1 for stock in stocks_data if stock.get('price_data'))
                }
            }
            
        except Exception as e:
            logger.error(f"基础统计计算失败: {str(e)}")
            return {}
    
    def _analyze_sector_distribution(self, stocks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """分析行业分布"""
        try:
            sector_stats = {}
            
            for stock in stocks_data:
                sector = stock.get('basic_info', {}).get('sector', '未知')
                if sector not in sector_stats:
                    sector_stats[sector] = {
                        'count': 0,
                        'stocks': [],
                        'avg_pe': 0,
                        'avg_pb': 0,
                        'pe_count': 0,
                        'pb_count': 0
                    }
                
                sector_stats[sector]['count'] += 1
                sector_stats[sector]['stocks'].append(stock.get('basic_info', {}).get('symbol', ''))
                
                # 计算行业平均财务指标
                financial_data = stock.get('financial_data', {})
                if financial_data:
                    if financial_data.get('pe_ratio'):
                        sector_stats[sector]['avg_pe'] += financial_data['pe_ratio']
                        sector_stats[sector]['pe_count'] += 1
                    if financial_data.get('pb_ratio'):
                        sector_stats[sector]['avg_pb'] += financial_data['pb_ratio']
                        sector_stats[sector]['pb_count'] += 1
            
            # 计算最终平均值
            for sector in sector_stats:
                if sector_stats[sector]['pe_count'] > 0:
                    sector_stats[sector]['avg_pe'] = round(
                        sector_stats[sector]['avg_pe'] / sector_stats[sector]['pe_count'], 2
                    )
                else:
                    sector_stats[sector]['avg_pe'] = None
                
                if sector_stats[sector]['pb_count'] > 0:
                    sector_stats[sector]['avg_pb'] = round(
                        sector_stats[sector]['avg_pb'] / sector_stats[sector]['pb_count'], 2
                    )
                else:
                    sector_stats[sector]['avg_pb'] = None
                
                # 清理临时计数字段
                del sector_stats[sector]['pe_count']
                del sector_stats[sector]['pb_count']
            
            return {
                'sector_statistics': sector_stats,
                'most_represented_sector': max(sector_stats.keys(), key=lambda x: sector_stats[x]['count']),
                'sector_diversity_score': len(sector_stats) / len(stocks_data) if stocks_data else 0
            }
            
        except Exception as e:
            logger.error(f"行业分布分析失败: {str(e)}")
            return {}
    
    def _generate_ai_comprehensive_analysis(self, stocks_data: List[Dict[str, Any]], analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """生成AI综合分析"""
        if not self.qwen_analyzer.is_available:
            return self._get_ai_fallback_analysis("comprehensive")
        
        try:
            system_prompt = """
你是一个专业的投资组合分析师。请基于提供的股票数据和分析结果，生成专业的投资组合分析报告。

请返回JSON格式结果：
{
    "overall_assessment": "整体评估",
    "strengths": ["优势1", "优势2"],
    "weaknesses": ["劣势1", "劣势2"],
    "key_insights": ["洞察1", "洞察2"],
    "market_outlook": "市场前景分析",
    "investment_strategy": "投资策略建议",
    "risk_factors": ["风险因素1", "风险因素2"],
    "opportunities": ["机会1", "机会2"],
    "portfolio_score": 0.0-10.0,
    "confidence_level": 0.0-1.0
}

请只返回JSON格式的结果，不要包含其他文字。
"""
            
            user_content = f"""
股票组合数据：
股票数量: {len(stocks_data)}

分析结果：
{json.dumps(analysis_data, ensure_ascii=False, indent=2)}

请生成综合分析报告：
"""
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ]
            
            response_content = self.qwen_analyzer._make_api_call(messages)
            
            # 解析JSON响应
            try:
                json_start = response_content.find('{')
                json_end = response_content.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = response_content[json_start:json_end]
                    result = json.loads(json_str)
                    return result
                else:
                    raise ValueError("未找到有效的JSON格式")
            except (json.JSONDecodeError, ValueError) as e:
                logger.warning(f"AI分析JSON解析失败: {str(e)}")
                return self._get_ai_fallback_analysis("comprehensive")
                
        except Exception as e:
            logger.error(f"AI综合分析失败: {str(e)}")
            return self._get_ai_fallback_analysis("comprehensive")
    
    def _get_ai_fallback_analysis(self, analysis_type: str) -> Dict[str, Any]:
        """获取AI分析的降级结果"""
        fallback_results = {
            "comprehensive": {
                "overall_assessment": "基于数据分析，投资组合具有一定的多样性",
                "strengths": ["股票数量适中", "涵盖多个行业"],
                "weaknesses": ["需要更深入的分析", "缺乏AI深度洞察"],
                "key_insights": ["建议关注财务指标", "注意技术信号"],
                "market_outlook": "市场前景需要持续关注",
                "investment_strategy": "建议采用分散投资策略",
                "risk_factors": ["市场波动风险", "行业集中风险"],
                "opportunities": ["价值发现机会", "成长潜力"],
                "portfolio_score": 6.0,
                "confidence_level": 0.5,
                "error": "AI分析不可用，使用基础分析结果"
            },
            "risk": {
                "overall_risk_level": "中等",
                "key_risks": ["市场风险", "流动性风险"],
                "risk_mitigation": ["分散投资", "定期调整"],
                "confidence_level": 0.5,
                "error": "AI风险分析不可用"
            },
            "opportunity": {
                "key_opportunities": ["价值投资机会", "技术突破机会"],
                "priority_level": "中等",
                "time_horizon": "中长期",
                "confidence_level": 0.5,
                "error": "AI机会分析不可用"
            }
        }
        
        return fallback_results.get(analysis_type, fallback_results["comprehensive"])
    
    def _get_empty_result(self, message: str) -> Dict[str, Any]:
        """获取空结果"""
        return {
            'success': False,
            'error': message,
            'timestamp': datetime.now().isoformat(),
            'stocks_count': 0
        }
    
    def _get_error_result(self, error_message: str) -> Dict[str, Any]:
        """获取错误结果"""
        return {
            'success': False,
            'error': f"分析失败: {error_message}",
            'timestamp': datetime.now().isoformat()
        }    

    def _analyze_financial_metrics(self, stocks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """分析财务指标"""
        try:
            metrics = {
                'pe_ratios': [],
                'pb_ratios': [],
                'roe_values': [],
                'debt_ratios': [],
                'revenue_growth': [],
                'profit_growth': []
            }
            
            for stock in stocks_data:
                financial_data = stock.get('financial_data', {})
                if financial_data:
                    if financial_data.get('pe_ratio'):
                        metrics['pe_ratios'].append(financial_data['pe_ratio'])
                    if financial_data.get('pb_ratio'):
                        metrics['pb_ratios'].append(financial_data['pb_ratio'])
                    if financial_data.get('roe'):
                        metrics['roe_values'].append(financial_data['roe'])
                    if financial_data.get('debt_ratio'):
                        metrics['debt_ratios'].append(financial_data['debt_ratio'])
                    if financial_data.get('revenue_growth'):
                        metrics['revenue_growth'].append(financial_data['revenue_growth'])
                    if financial_data.get('profit_growth'):
                        metrics['profit_growth'].append(financial_data['profit_growth'])
            
            # 计算统计指标
            result = {}
            for key, values in metrics.items():
                if values:
                    result[key] = {
                        'average': round(sum(values) / len(values), 2),
                        'median': round(sorted(values)[len(values)//2], 2),
                        'min': round(min(values), 2),
                        'max': round(max(values), 2),
                        'count': len(values)
                    }
                else:
                    result[key] = None
            
            return result
            
        except Exception as e:
            logger.error(f"财务指标分析失败: {str(e)}")
            return {}
    
    def _analyze_technical_indicators(self, stocks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """分析技术指标"""
        try:
            technical_signals = {
                'bullish_signals': 0,
                'bearish_signals': 0,
                'neutral_signals': 0,
                'macd_golden_cross': 0,
                'macd_death_cross': 0,
                'rsi_overbought': 0,
                'rsi_oversold': 0,
                'trend_analysis': {}
            }
            
            for stock in stocks_data:
                technical_data = stock.get('technical_data', {})
                if technical_data:
                    # MACD信号统计
                    macd_signal = technical_data.get('macd_signal_type', '')
                    if '金叉' in macd_signal:
                        technical_signals['macd_golden_cross'] += 1
                        technical_signals['bullish_signals'] += 1
                    elif '死叉' in macd_signal:
                        technical_signals['macd_death_cross'] += 1
                        technical_signals['bearish_signals'] += 1
                    
                    # RSI信号统计
                    rsi = technical_data.get('rsi')
                    if rsi:
                        if rsi > 70:
                            technical_signals['rsi_overbought'] += 1
                            technical_signals['bearish_signals'] += 1
                        elif rsi < 30:
                            technical_signals['rsi_oversold'] += 1
                            technical_signals['bullish_signals'] += 1
                        else:
                            technical_signals['neutral_signals'] += 1
                    
                    # 趋势信号统计
                    trend_signal = technical_data.get('trend_signal', '未知')
                    technical_signals['trend_analysis'][trend_signal] = \
                        technical_signals['trend_analysis'].get(trend_signal, 0) + 1
            
            # 计算总体技术面倾向
            total_signals = technical_signals['bullish_signals'] + technical_signals['bearish_signals'] + technical_signals['neutral_signals']
            if total_signals > 0:
                technical_signals['bullish_percentage'] = round(technical_signals['bullish_signals'] / total_signals * 100, 1)
                technical_signals['bearish_percentage'] = round(technical_signals['bearish_signals'] / total_signals * 100, 1)
                technical_signals['neutral_percentage'] = round(technical_signals['neutral_signals'] / total_signals * 100, 1)
            
            return technical_signals
            
        except Exception as e:
            logger.error(f"技术指标分析失败: {str(e)}")
            return {}
    
    def _assess_portfolio_risk(self, stocks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """评估投资组合风险"""
        try:
            risk_assessment = {
                'concentration_risk': 'low',
                'sector_concentration': {},
                'financial_risk_score': 0,
                'technical_risk_score': 0,
                'overall_risk_level': 'medium'
            }
            
            # 行业集中度风险
            sectors = {}
            for stock in stocks_data:
                sector = stock.get('basic_info', {}).get('sector', '未知')
                sectors[sector] = sectors.get(sector, 0) + 1
            
            total_stocks = len(stocks_data)
            max_sector_concentration = max(sectors.values()) / total_stocks if sectors else 0
            
            if max_sector_concentration > 0.5:
                risk_assessment['concentration_risk'] = 'high'
            elif max_sector_concentration > 0.3:
                risk_assessment['concentration_risk'] = 'medium'
            else:
                risk_assessment['concentration_risk'] = 'low'
            
            risk_assessment['sector_concentration'] = {
                sector: round(count / total_stocks * 100, 1) 
                for sector, count in sectors.items()
            }
            
            # 财务风险评分
            high_debt_count = 0
            low_roe_count = 0
            high_pe_count = 0
            
            for stock in stocks_data:
                financial_data = stock.get('financial_data', {})
                if financial_data:
                    if financial_data.get('debt_ratio', 0) > 0.6:
                        high_debt_count += 1
                    if financial_data.get('roe', 0) < 0.1:
                        low_roe_count += 1
                    if financial_data.get('pe_ratio', 0) > 30:
                        high_pe_count += 1
            
            risk_assessment['financial_risk_score'] = round(
                (high_debt_count + low_roe_count + high_pe_count) / total_stocks * 100, 1
            )
            
            # 技术风险评分
            bearish_technical_count = 0
            for stock in stocks_data:
                technical_data = stock.get('technical_data', {})
                if technical_data:
                    if technical_data.get('macd_signal_type') == '死叉':
                        bearish_technical_count += 1
                    if technical_data.get('rsi', 50) > 70:
                        bearish_technical_count += 1
            
            risk_assessment['technical_risk_score'] = round(
                bearish_technical_count / total_stocks * 100, 1
            )
            
            # 综合风险等级
            avg_risk_score = (risk_assessment['financial_risk_score'] + risk_assessment['technical_risk_score']) / 2
            if avg_risk_score > 60:
                risk_assessment['overall_risk_level'] = 'high'
            elif avg_risk_score > 30:
                risk_assessment['overall_risk_level'] = 'medium'
            else:
                risk_assessment['overall_risk_level'] = 'low'
            
            return risk_assessment
            
        except Exception as e:
            logger.error(f"风险评估失败: {str(e)}")
            return {'overall_risk_level': 'unknown', 'error': str(e)}
    
    def _generate_recommendations(self, stocks_data: List[Dict[str, Any]], ai_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """生成投资建议"""
        try:
            recommendations = []
            
            # 基于AI分析生成建议
            if ai_analysis.get('strengths'):
                recommendations.append({
                    'type': 'strength',
                    'title': '投资组合优势',
                    'description': '、'.join(ai_analysis['strengths'][:2]),
                    'priority': 'info'
                })
            
            if ai_analysis.get('opportunities'):
                recommendations.append({
                    'type': 'opportunity',
                    'title': '投资机会',
                    'description': '、'.join(ai_analysis['opportunities'][:2]),
                    'priority': 'high'
                })
            
            if ai_analysis.get('risk_factors'):
                recommendations.append({
                    'type': 'risk',
                    'title': '风险提示',
                    'description': '、'.join(ai_analysis['risk_factors'][:2]),
                    'priority': 'warning'
                })
            
            # 基于数据分析生成具体建议
            high_pe_stocks = []
            low_roe_stocks = []
            
            for stock in stocks_data:
                financial_data = stock.get('financial_data', {})
                if financial_data:
                    symbol = stock.get('basic_info', {}).get('symbol', '')
                    if financial_data.get('pe_ratio', 0) > 30:
                        high_pe_stocks.append(symbol)
                    if financial_data.get('roe', 0) < 0.1:
                        low_roe_stocks.append(symbol)
            
            if high_pe_stocks:
                recommendations.append({
                    'type': 'valuation',
                    'title': '估值风险提醒',
                    'description': f'以下股票PE较高，注意估值风险: {", ".join(high_pe_stocks[:3])}',
                    'priority': 'warning'
                })
            
            if low_roe_stocks:
                recommendations.append({
                    'type': 'profitability',
                    'title': '盈利能力关注',
                    'description': f'以下股票ROE较低，关注盈利能力: {", ".join(low_roe_stocks[:3])}',
                    'priority': 'medium'
                })
            
            return recommendations[:5]  # 限制建议数量
            
        except Exception as e:
            logger.error(f"生成建议失败: {str(e)}")
            return []
    
    def _calculate_portfolio_score(self, stocks_data: List[Dict[str, Any]]) -> float:
        """计算投资组合评分"""
        try:
            score = 5.0  # 基础分数
            
            # 多样性加分
            sectors = set()
            for stock in stocks_data:
                sector = stock.get('basic_info', {}).get('sector')
                if sector:
                    sectors.add(sector)
            
            diversity_score = min(len(sectors) / 5, 1.0) * 2  # 最多2分
            score += diversity_score
            
            # 财务健康度加分
            healthy_stocks = 0
            total_with_financial = 0
            
            for stock in stocks_data:
                financial_data = stock.get('financial_data', {})
                if financial_data:
                    total_with_financial += 1
                    roe = financial_data.get('roe', 0)
                    debt_ratio = financial_data.get('debt_ratio', 1)
                    pe_ratio = financial_data.get('pe_ratio', 50)
                    
                    if roe > 0.1 and debt_ratio < 0.5 and pe_ratio < 25:
                        healthy_stocks += 1
            
            if total_with_financial > 0:
                health_score = (healthy_stocks / total_with_financial) * 2  # 最多2分
                score += health_score
            
            # 技术面加分
            bullish_technical = 0
            total_with_technical = 0
            
            for stock in stocks_data:
                technical_data = stock.get('technical_data', {})
                if technical_data:
                    total_with_technical += 1
                    macd_signal = technical_data.get('macd_signal_type', '')
                    rsi = technical_data.get('rsi', 50)
                    
                    if '金叉' in macd_signal or (30 < rsi < 70):
                        bullish_technical += 1
            
            if total_with_technical > 0:
                technical_score = (bullish_technical / total_with_technical) * 1  # 最多1分
                score += technical_score
            
            return round(min(score, 10.0), 1)  # 限制最高10分
            
        except Exception as e:
            logger.error(f"计算投资组合评分失败: {str(e)}")
            return 5.0
    
    # 添加其他分析方法的简化实现
    def _calculate_risk_metrics(self, stocks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """计算风险指标"""
        return {'volatility': 'medium', 'beta': 1.0, 'max_drawdown': 0.15}
    
    def _analyze_concentration_risk(self, stocks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """分析集中度风险"""
        return {'sector_concentration': 'medium', 'single_stock_max_weight': 0.2}
    
    def _assess_financial_risk(self, stocks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """评估财务风险"""
        return {'debt_risk': 'low', 'liquidity_risk': 'medium', 'profitability_risk': 'low'}
    
    def _identify_technical_risks(self, stocks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """识别技术风险"""
        return {'trend_risk': 'medium', 'momentum_risk': 'low', 'support_risk': 'medium'}
    
    def _generate_ai_risk_analysis(self, stocks_data: List[Dict[str, Any]], risk_data: Dict[str, Any]) -> Dict[str, Any]:
        """生成AI风险分析"""
        return self._get_ai_fallback_analysis("risk")
    
    def _calculate_overall_risk_level(self, risk_metrics: Dict[str, Any]) -> str:
        """计算整体风险水平"""
        return "medium"
    
    def _generate_risk_mitigation_suggestions(self, ai_risk_analysis: Dict[str, Any]) -> List[str]:
        """生成风险缓解建议"""
        return ["分散投资", "定期调整", "设置止损"]
    
    def _identify_value_opportunities(self, stocks_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """识别价值机会"""
        return [{"symbol": "000001", "opportunity": "低估值", "potential": "high"}]
    
    def _identify_growth_opportunities(self, stocks_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """识别成长机会"""
        return [{"symbol": "000002", "opportunity": "高成长", "potential": "medium"}]
    
    def _identify_technical_opportunities(self, stocks_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """识别技术机会"""
        return [{"symbol": "000003", "opportunity": "技术突破", "potential": "high"}]
    
    def _analyze_sector_rotation_opportunities(self, stocks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """分析行业轮动机会"""
        return {"rotating_sectors": ["科技", "医疗"], "timing": "near_term"}
    
    def _generate_ai_opportunity_analysis(self, stocks_data: List[Dict[str, Any]], opportunity_data: Dict[str, Any]) -> Dict[str, Any]:
        """生成AI机会分析"""
        return self._get_ai_fallback_analysis("opportunity")
    
    def _generate_priority_recommendations(self, ai_opportunity_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """生成优先级建议"""
        return [{"priority": "high", "action": "关注价值股", "timeframe": "short_term"}]
    
    def _compare_financial_metrics(self, stocks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """对比财务指标"""
        return {"best_pe": "000001", "best_roe": "000002", "lowest_debt": "000003"}
    
    def _compare_technical_indicators(self, stocks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """对比技术指标"""
        return {"strongest_momentum": "000001", "best_trend": "000002"}
    
    def _compare_valuations(self, stocks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """对比估值"""
        return {"most_undervalued": "000001", "fair_valued": "000002"}
    
    def _compare_risk_return(self, stocks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """对比风险收益"""
        return {"best_risk_adjusted": "000001", "highest_return_potential": "000002"}
    
    def _generate_ai_comparison_analysis(self, stocks_data: List[Dict[str, Any]], comparison_data: Dict[str, Any]) -> Dict[str, Any]:
        """生成AI对比分析"""
        return {"top_pick": "000001", "reasoning": "综合表现最佳"}
    
    def _generate_stock_ranking(self, stocks_data: List[Dict[str, Any]], ai_comparison_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """生成股票排名"""
        ranking = []
        for i, stock in enumerate(stocks_data[:5]):
            ranking.append({
                "rank": i + 1,
                "symbol": stock.get('basic_info', {}).get('symbol', ''),
                "name": stock.get('basic_info', {}).get('name', ''),
                "score": round(8.0 - i * 0.5, 1),
                "reason": f"排名第{i+1}的原因"
            })
        return ranking