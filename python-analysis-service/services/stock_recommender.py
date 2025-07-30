"""
股票推荐服务 - 重构版本
基于关键词分析结果从数据库中推荐相关股票
"""

import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from config import config

logger = logging.getLogger(__name__)

@dataclass
class StockRecommendation:
    """股票推荐结果"""
    symbol: str
    name: str
    sector: str
    market: str
    market_cap: float
    latest_price: Optional[float]
    change_percent: Optional[float]
    volume: Optional[int]
    pe_ratio: Optional[float]
    pb_ratio: Optional[float]
    match_score: float
    match_reasons: List[str]
    risk_level: str
    investment_highlights: List[str]
    risk_warnings: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            "symbol": self.symbol,
            "name": self.name,
            "sector": self.sector,
            "market": self.market,
            "market_cap": self.market_cap,
            "latest_price": self.latest_price,
            "change_percent": self.change_percent,
            "volume": self.volume,
            "pe_ratio": self.pe_ratio,
            "pb_ratio": self.pb_ratio,
            "match_score": self.match_score,
            "match_reasons": self.match_reasons,
            "risk_level": self.risk_level,
            "investment_highlights": self.investment_highlights,
            "risk_warnings": self.risk_warnings
        }

class StockRecommender:
    """股票推荐器 - 简化版本"""
    
    def __init__(self):
        """初始化推荐器"""
        self.engine = create_engine(config.DATABASE_URL)
        self.SessionLocal = sessionmaker(bind=self.engine)
    
    def recommend_stocks_by_query(self, query: str, limit: int = 20, keyword_analysis=None) -> Dict[str, Any]:
        """基于查询字符串推荐股票 - 可选结合AI关键词分析结果"""
        try:
            logger.info(f"开始推荐股票，查询: {query}")
            
            # 1. 提取关键词 - 优先使用AI分析结果
            if keyword_analysis:
                logger.info("使用AI关键词分析结果")
                keywords = self._extract_keywords_from_analysis(keyword_analysis)
            else:
                logger.info("使用简单关键词提取")
                keywords = self._extract_keywords(query)
            
            # 2. 查询股票数据 - 传递AI分析结果
            stocks_data = self._query_stocks(keywords, limit, keyword_analysis)
            
            # 3. 生成推荐 - 传入AI分析结果以增强推荐质量
            recommendations = self._generate_recommendations(stocks_data, keywords, query, keyword_analysis)
            
            # 4. 按匹配度排序
            recommendations.sort(key=lambda x: x.match_score, reverse=True)
            
            # 5. 转换为API格式 - 支持key-value格式和结构化条件值
            api_recommendations = []
            for rec in recommendations[:limit]:
                # 基础信息
                stock_data = {
                    "symbol": rec.symbol,
                    "name": rec.name,
                    "match_score": rec.match_score,
                    "match_reasons": rec.match_reasons,
                    "risk_level": rec.risk_level,
                    "investment_highlights": rec.investment_highlights,
                    "risk_warnings": rec.risk_warnings
                }
                
                # key-value格式的详细信息
                stock_details = {}
                
                # 基本信息
                if rec.sector:
                    stock_details["行业"] = rec.sector
                if rec.market:
                    stock_details["市场"] = rec.market
                if rec.market_cap:
                    stock_details["市值"] = self._format_market_cap(rec.market_cap)
                
                # 价格信息
                if rec.latest_price:
                    stock_details["最新价格"] = f"{rec.latest_price:.2f}"
                if rec.change_percent is not None:
                    stock_details["涨跌幅"] = f"{rec.change_percent:+.2f}%"
                if rec.volume:
                    stock_details["成交量"] = self._format_volume(rec.volume)
                
                # 估值指标
                if rec.pe_ratio:
                    stock_details["市盈率"] = f"{rec.pe_ratio:.2f}"
                if rec.pb_ratio:
                    stock_details["市净率"] = f"{rec.pb_ratio:.2f}"
                
                # 添加结构化条件对应的实际值
                condition_values = self._get_condition_values(rec, keyword_analysis)
                if condition_values:
                    stock_details.update(condition_values)
                
                stock_data["details"] = stock_details
                api_recommendations.append(stock_data)
            
            # 6. 构建返回结果 - 包含AI分析信息
            result = {
                "query": query,
                "extracted_keywords": keywords,
                "recommendations": api_recommendations,
                "summary": {
                    "total_found": len(recommendations),
                    "returned_count": len(api_recommendations),
                    "avg_match_score": sum(r.match_score for r in recommendations) / len(recommendations) if recommendations else 0,
                    "risk_distribution": {
                        "low": sum(1 for r in recommendations if r.risk_level == "low"),
                        "medium": sum(1 for r in recommendations if r.risk_level == "medium"),
                        "high": sum(1 for r in recommendations if r.risk_level == "high")
                    }
                }
            }
            
            # 添加AI分析增强信息
            if keyword_analysis:
                result["ai_enhanced"] = True
                result["analysis_confidence"] = keyword_analysis.confidence
                result["sentiment"] = keyword_analysis.sentiment
                result["intent"] = keyword_analysis.intent
                result["industry_focus"] = keyword_analysis.industry_keywords
                result["concept_focus"] = keyword_analysis.concept_keywords
            
            return result
            
        except Exception as e:
            logger.error(f"股票推荐失败: {e}")
            return {
                "error": str(e),
                "query": query,
                "recommendations": []
            }
    
    def _extract_keywords_from_analysis(self, keyword_analysis) -> List[str]:
        """从AI关键词分析结果中提取关键词 - 仅用于兼容性，实际使用结构化条件"""
        keywords = []
        
        # 如果有结构化条件，优先使用结构化条件，不再提取传统关键词
        if hasattr(keyword_analysis, 'structured_conditions') and keyword_analysis.structured_conditions:
            logger.info(f"检测到结构化条件，将使用结构化查询，条件数量: {len(keyword_analysis.structured_conditions)}")
            for condition in keyword_analysis.structured_conditions:
                if hasattr(condition, 'field') and condition.field:
                    logger.info(f"结构化条件: {condition.field} {condition.operator} {condition.value}")
            # 返回空关键词列表，强制使用结构化条件查询
            return []
        
        # 只有在没有结构化条件时才使用传统关键词
        logger.info("未检测到结构化条件，回退到传统关键词查询")
        if hasattr(keyword_analysis, 'extracted_keywords'):
            keywords.extend(keyword_analysis.extracted_keywords)
        
        if hasattr(keyword_analysis, 'industry_keywords'):
            keywords.extend(keyword_analysis.industry_keywords)
            
        if hasattr(keyword_analysis, 'concept_keywords'):
            keywords.extend(keyword_analysis.concept_keywords)
            
        if hasattr(keyword_analysis, 'financial_keywords'):
            keywords.extend(keyword_analysis.financial_keywords)
            
        if hasattr(keyword_analysis, 'technical_keywords'):
            keywords.extend(keyword_analysis.technical_keywords)
        
        # 去重并限制数量
        unique_keywords = list(set(keywords))
        logger.info(f"从AI分析中提取到 {len(unique_keywords)} 个关键词: {unique_keywords}")
        
        return unique_keywords[:20]  # 限制关键词数量
    
    def _extract_keywords(self, query: str) -> List[str]:
        """简单的关键词提取"""
        # 常见的行业和概念关键词
        industry_keywords = [
            "医药", "科技", "金融", "房地产", "能源", "消费", "制造", "汽车", 
            "电力", "化工", "钢铁", "有色", "建筑", "交通", "电子", "通信",
            "银行", "保险", "证券", "军工", "农业", "食品", "纺织", "机械"
        ]
        
        concept_keywords = [
            "新能源", "人工智能", "芯片", "5G", "物联网", "区块链", "元宇宙",
            "锂电池", "光伏", "风电", "氢能", "碳中和", "数字经济", "云计算"
        ]
        
        # 财务关键词
        financial_keywords = [
            "低估值", "高分红", "PE", "PB", "ROE", "绩优", "白马", "蓝筹"
        ]
        
        # 提取关键词
        keywords = []
        query_lower = query.lower()
        
        # 检查行业关键词
        for keyword in industry_keywords:
            if keyword in query:
                keywords.append(keyword)
        
        # 检查概念关键词
        for keyword in concept_keywords:
            if keyword in query:
                keywords.append(keyword)
        
        # 检查财务关键词
        for keyword in financial_keywords:
            if keyword in query:
                keywords.append(keyword)
        
        # 如果没有找到特定关键词，就把整个查询作为关键词
        if not keywords:
            keywords = [query.strip()]
        
        return keywords
    
    def _query_stocks(self, keywords: List[str], limit: int, keyword_analysis=None) -> List[Dict]:
        """查询股票数据 - 支持结构化条件"""
        session = self.SessionLocal()
        try:
            # 构建基础查询 - 支持多表联查
            base_query = """
            SELECT DISTINCT
                si.symbol,
                si.name,
                si.sector,
                si.market,
                si.marketCap,
                si.peRatio,
                si.pbRatio,
                si.dividendYield,
                sd.close as latest_price,
                sd.changePercent,
                sd.volume,
                sf.roe,
                sf.grossMargin,
                sf.netMargin,
                sf.revenue,
                sf.netProfit,
                sp.totalReturn,
                sp.annualizedReturn,
                sp.maxDrawdown,
                sp.sharpeRatio,
                sp.volatility
            FROM stock_info si
            LEFT JOIN stock_data sd ON si.symbol = sd.symbol 
                AND sd.date = (
                    SELECT MAX(date) 
                    FROM stock_data sd2 
                    WHERE sd2.symbol = si.symbol 
                    AND sd2.close > 0
                )
            LEFT JOIN stock_financial sf ON si.symbol = sf.symbol
                AND sf.reportDate = (
                    SELECT MAX(reportDate)
                    FROM stock_financial sf2
                    WHERE sf2.symbol = si.symbol
                )
            LEFT JOIN stock_performance sp ON si.symbol = sp.symbol
                AND sp.period = '1y'
            WHERE si.isActive = 1
            """
            
            # 构建搜索条件
            where_conditions = []
            params = {}
            
            # 优先使用结构化条件
            if keyword_analysis and hasattr(keyword_analysis, 'structured_conditions') and keyword_analysis.structured_conditions:
                logger.info("使用结构化条件构建SQL查询")
                structured_conditions_applied = False
                
                for condition in keyword_analysis.structured_conditions:
                    field = condition.field if hasattr(condition, 'field') else ''
                    operator = condition.operator if hasattr(condition, 'operator') else ''
                    value = condition.value if hasattr(condition, 'value') else ''
                    period = condition.period if hasattr(condition, 'period') else ''
                    
                    logger.info(f"结构化条件: {field} {operator} {value}" + (f" (周期: {period})" if period else ""))
                    
                    # 映射字段名到数据库列名
                    db_field = self._map_field_to_db_column(field)
                    if db_field and operator and value is not None:
                        condition_sql = self._build_condition_sql(db_field, operator, value, len(params))
                        if condition_sql:
                            where_conditions.append(condition_sql['sql'])
                            params.update(condition_sql['params'])
                            structured_conditions_applied = True
                            logger.info(f"添加结构化条件: {field} {operator} {value} -> {condition_sql['sql']}")
                    else:
                        logger.info(f"跳过条件: {field} {operator} {value} (字段映射失败或参数无效)")
                
                if structured_conditions_applied:
                    logger.info("成功应用结构化条件")
                else:
                    logger.info("结构化条件无法应用，回退到关键词搜索")
                    self._add_keyword_conditions(where_conditions, params, keywords)
            else:
                # 回退到关键词搜索
                logger.info("使用关键词搜索")
                self._add_keyword_conditions(where_conditions, params, keywords)
            
            # 添加基本过滤条件
            where_conditions.append("si.marketCap > 0")
            where_conditions.append("si.peRatio > 0")  # 确保有PE数据
            where_conditions.append("si.peRatio < 100")  # 过滤掉PE过高的股票
            
            # 组合查询
            if where_conditions:
                base_query += " AND " + " AND ".join(where_conditions)
            
            # 优化排序：优先市值大且PE合理的股票
            base_query += f" ORDER BY (si.marketCap / (si.peRatio + 1)) DESC LIMIT {limit * 3}"
            
            logger.info(f"执行查询: {base_query}")
            logger.info(f"查询参数: {params}")
            
            result = session.execute(text(base_query), params)
            stocks = [dict(row._mapping) for row in result]
            
            logger.info(f"查询到 {len(stocks)} 只股票")
            return stocks
            
        except Exception as e:
            logger.error(f"查询股票数据失败: {e}")
            return []
        finally:
            session.close()
    
    def _format_market_cap(self, market_cap: float) -> str:
        """格式化市值显示"""
        if market_cap >= 1e12:
            return f"{market_cap/1e12:.1f}万亿"
        elif market_cap >= 1e8:
            return f"{market_cap/1e8:.1f}亿"
        elif market_cap >= 1e4:
            return f"{market_cap/1e4:.1f}万"
        else:
            return f"{market_cap:.0f}"
    
    def _format_volume(self, volume: int) -> str:
        """格式化成交量显示"""
        if volume >= 1e8:
            return f"{volume/1e8:.1f}亿"
        elif volume >= 1e4:
            return f"{volume/1e4:.1f}万"
        else:
            return f"{volume}"
    
    def _get_condition_values(self, recommendation: StockRecommendation, keyword_analysis=None) -> dict:
        """获取结构化条件对应的实际值"""
        condition_values = {}
        
        if not keyword_analysis or not hasattr(keyword_analysis, 'structured_conditions'):
            return condition_values
        
        # 从股票数据中获取对应字段的实际值
        for condition in keyword_analysis.structured_conditions:
            field = condition.field if hasattr(condition, 'field') else ''
            if not field:
                continue
                
            # 映射字段名并获取实际值
            actual_value = self._get_actual_field_value(recommendation, field)
            if actual_value is not None:
                # 格式化显示条件值
                formatted_value = self._format_condition_value(actual_value, field)
                condition_values[f"实际{field}"] = formatted_value
        
        return condition_values
    
    def _get_actual_field_value(self, recommendation: StockRecommendation, field: str):
        """获取股票的实际字段值"""
        field_mapping = {
            '收益率': 'change_percent',  # 这里可能需要从其他数据源获取年化收益率
            '市盈率': 'pe_ratio',
            '市净率': 'pb_ratio',
            'ROE': None,  # 需要从财务数据获取
            '最大回撤': None,  # 需要从性能数据获取
            '毛利率': None,  # 需要从财务数据获取
            '股息率': None,  # 需要从股息数据获取
            '市值': 'market_cap',
            '营收': None,  # 需要从财务数据获取
            '净利润': None,  # 需要从财务数据获取
        }
        
        attr_name = field_mapping.get(field)
        if attr_name and hasattr(recommendation, attr_name):
            return getattr(recommendation, attr_name)
        
        return None
    
    def _format_condition_value(self, value, field: str) -> str:
        """格式化条件值显示"""
        if value is None:
            return "暂无数据"
        
        # 百分比字段
        percent_fields = ['收益率', '回撤', '最大回撤', '毛利率', '股息率', 'ROE']
        if any(f in field for f in percent_fields):
            return f"{value:.2f}%" if isinstance(value, (int, float)) else str(value)
        
        # 市值字段
        if '市值' in field and isinstance(value, (int, float)):
            return self._format_market_cap(value)
        
        # 其他数值字段
        if isinstance(value, float):
            return f"{value:.2f}"
        elif isinstance(value, int):
            return str(value)
        
        return str(value)
    
    def _map_field_to_db_column(self, field: str) -> str:
        """映射字段名到数据库列名"""
        field_mapping = {
            '市盈率': 'si.peRatio',
            '市净率': 'si.pbRatio', 
            'PE': 'si.peRatio',
            'PB': 'si.pbRatio',
            '市值': 'si.marketCap',
            '股价': 'sd.close',
            '股息率': 'si.dividendYield',
            # 从stock_financial表查询的字段
            'ROE': 'sf.roe',
            '净资产收益率': 'sf.roe',
            '毛利率': 'sf.grossMargin',
            '净利率': 'sf.netMargin',
            '营收': 'sf.revenue',
            '营业收入': 'sf.revenue',
            '净利润': 'sf.netProfit',
            # 从stock_performance表查询的字段
            '收益率': 'sp.totalReturn',
            '总收益率': 'sp.totalReturn',
            '年化收益率': 'sp.annualizedReturn',
            '最大回撤': 'sp.maxDrawdown',
            '夏普比率': 'sp.sharpeRatio',
            '波动率': 'sp.volatility',
        }
        
        # 排除时间周期相关字段，这些不应该映射到数据库字段
        excluded_fields = ['时间周期', '周期', '期间']
        if field in excluded_fields:
            logger.info(f"字段 '{field}' 是时间周期相关字段，不进行数据库映射")
            return None
            
        result = field_mapping.get(field, None)
        if result is None:
            logger.warning(f"字段 '{field}' 暂不支持数据库查询，将跳过此条件")
        return result
    
    def _build_condition_sql(self, db_field: str, operator: str, value: any, param_index: int) -> dict:
        """构建SQL条件"""
        if not db_field:
            return None
            
        param_name = f"condition_{param_index}"
        
        operator_mapping = {
            '>': '>',
            '<': '<', 
            '>=': '>=',
            '<=': '<=',
            '=': '=',
            '!=': '!='
        }
        
        sql_operator = operator_mapping.get(operator)
        if not sql_operator:
            return None
            
        return {
            'sql': f"{db_field} {sql_operator} :{param_name}",
            'params': {param_name: value}
        }
    
    def _add_keyword_conditions(self, where_conditions: list, params: dict, keywords: List[str]):
        """添加关键词搜索条件"""
        if keywords:
            keyword_conditions = []
            valid_keywords = []
            for i, keyword in enumerate(keywords):
                if not keyword:  # 跳过空关键词
                    continue
                # 过滤掉一些无意义的关键词
                if keyword.lower() in ['优质股', '股票', '推荐', '好股', '优质', '投资']:
                    continue
                param_name = f"keyword_{i}"
                # 使用OR条件连接，搜索股票名称、行业等字段
                keyword_conditions.append(f"(si.name LIKE :{param_name} OR si.sector LIKE :{param_name})")
                params[param_name] = f"%{keyword}%"
                valid_keywords.append(keyword)
            
            if keyword_conditions:
                where_conditions.append(f"({' OR '.join(keyword_conditions)})")
                logger.info(f"添加关键词搜索条件，有效关键词: {valid_keywords}")
            else:
                logger.info("无有效关键词，将返回优质股票（按市值和PE排序）")
        else:
            logger.info("无关键词，将返回优质股票（按市值和PE排序）")
    
    def _generate_recommendations(self, stocks_data: List[Dict], keywords: List[str], query: str, keyword_analysis=None) -> List[StockRecommendation]:
        """生成股票推荐"""
        recommendations = []
        
        for stock in stocks_data:
            try:
                # 计算匹配度
                match_score, match_reasons = self._calculate_match_score(stock, keywords, query, keyword_analysis)
                
                # 评估风险等级
                risk_level = self._assess_risk_level(stock)
                
                # 生成投资亮点
                investment_highlights = self._generate_investment_highlights(stock)
                
                # 生成风险提示
                risk_warnings = self._generate_risk_warnings(stock)
                
                recommendation = StockRecommendation(
                    symbol=stock["symbol"],
                    name=stock["name"] or "",
                    sector=stock["sector"] or "",
                    market=stock["market"] or "",
                    market_cap=float(stock["marketCap"]) if stock["marketCap"] else 0,
                    latest_price=float(stock["latest_price"]) if stock["latest_price"] else None,
                    change_percent=float(stock["changePercent"]) if stock["changePercent"] else None,
                    volume=int(stock["volume"]) if stock["volume"] else None,
                    pe_ratio=float(stock["peRatio"]) if stock["peRatio"] else None,
                    pb_ratio=float(stock["pbRatio"]) if stock["pbRatio"] else None,
                    match_score=match_score,
                    match_reasons=match_reasons,
                    risk_level=risk_level,
                    investment_highlights=investment_highlights,
                    risk_warnings=risk_warnings
                )
                
                recommendations.append(recommendation)
                
            except Exception as e:
                logger.error(f"生成推荐失败 {stock.get('symbol', 'unknown')}: {e}")
                continue
        
        return recommendations
    
    def _calculate_match_score(self, stock: Dict, keywords: List[str], query: str, keyword_analysis=None) -> tuple[float, List[str]]:
        """计算匹配度评分 - 增强版，结合AI分析结果"""
        score = 0.0
        reasons = []
        
        stock_name = stock.get("name", "")
        stock_sector = stock.get("sector", "")
        stock_symbol = stock.get("symbol", "")
        
        # 调试日志
        logger.info(f"计算匹配度 - 股票: {stock_symbol} {stock_name}, 行业: {stock_sector}")
        logger.info(f"关键词: {keywords}")
        if keyword_analysis:
            logger.info(f"AI关键词 - 行业: {keyword_analysis.industry_keywords}, 概念: {keyword_analysis.concept_keywords}")
        
        # 基础匹配 (权重: 30%)
        # 名称匹配 - 改进匹配逻辑
        name_matched = False
        for keyword in keywords:
            if keyword and stock_name:
                # 简单的字符串包含检查
                if keyword in stock_name:
                    score += 0.2
                    reasons.append(f"名称包含: {keyword}")
                    name_matched = True
                    logger.info(f"名称匹配成功: {keyword} in {stock_name}")
                    break
        
        if not name_matched:
            logger.info(f"名称匹配失败 - 关键词: {keywords}, 股票名称: {stock_name}")
        
        # 行业匹配 - 改进匹配逻辑
        sector_matched = False
        for keyword in keywords:
            if keyword and stock_sector:
                # 简单的字符串包含检查
                if keyword in stock_sector:
                    score += 0.1
                    reasons.append(f"行业匹配: {keyword}")
                    sector_matched = True
                    logger.info(f"行业匹配成功: {keyword} in {stock_sector}")
                    break
        
        if not sector_matched:
            logger.info(f"行业匹配失败 - 关键词: {keywords}, 股票行业: {stock_sector}")
        
        # AI增强匹配 (权重: 40%)
        if keyword_analysis:
            # 行业关键词匹配 (权重: 20%)
            if keyword_analysis.industry_keywords:
                industry_matched = False
                for industry_kw in keyword_analysis.industry_keywords:
                    if industry_kw:
                        # 简单的字符串包含检查
                        name_match = stock_name and industry_kw in stock_name
                        sector_match = stock_sector and industry_kw in stock_sector
                        
                        if name_match or sector_match:
                            score += 0.15
                            reasons.append(f"AI行业匹配: {industry_kw}")
                            industry_matched = True
                            logger.info(f"AI行业匹配成功: {industry_kw}")
                            break
                
                if not industry_matched:
                    logger.info(f"AI行业匹配失败 - AI行业关键词: {keyword_analysis.industry_keywords}")
            
            # 概念关键词匹配 (权重: 15%)
            if keyword_analysis.concept_keywords:
                concept_matched = False
                for concept_kw in keyword_analysis.concept_keywords:
                    if concept_kw:
                        # 简单的字符串包含检查
                        name_match = stock_name and concept_kw in stock_name
                        sector_match = stock_sector and concept_kw in stock_sector
                        
                        if name_match or sector_match:
                            score += 0.1
                            reasons.append(f"AI概念匹配: {concept_kw}")
                            concept_matched = True
                            logger.info(f"AI概念匹配成功: {concept_kw}")
                            break
                
                if not concept_matched:
                    logger.info(f"AI概念匹配失败 - AI概念关键词: {keyword_analysis.concept_keywords}")
            
            # 情感倾向影响 (权重: 5%)
            if keyword_analysis.sentiment == "positive":
                score += 0.05
                reasons.append("积极情感倾向")
                logger.info("添加积极情感倾向加分")
            elif keyword_analysis.sentiment == "negative":
                score -= 0.05
                reasons.append("消极情感影响")
                logger.info("减去消极情感影响")
        
        # 财务指标匹配 (权重: 20%)
        pe_ratio = stock.get("peRatio")
        pb_ratio = stock.get("pbRatio")
        
        logger.info(f"财务指标 - PE: {pe_ratio}, PB: {pb_ratio}")
        
        # 检查AI分析的财务关键词
        if keyword_analysis and keyword_analysis.financial_keywords:
            for financial_kw in keyword_analysis.financial_keywords:
                if "低估值" in financial_kw or "PE" in financial_kw:
                    if pe_ratio and 0 < pe_ratio < 20:
                        score += 0.1
                        reasons.append(f"符合低估值要求: PE {pe_ratio:.1f}")
                        logger.info(f"财务匹配: 低PE {pe_ratio}")
                
                if "低估值" in financial_kw or "PB" in financial_kw:
                    if pb_ratio and 0 < pb_ratio < 2:
                        score += 0.1
                        reasons.append(f"符合低估值要求: PB {pb_ratio:.2f}")
                        logger.info(f"财务匹配: 低PB {pb_ratio}")
                
                if "高分红" in financial_kw:
                    # 这里可以添加分红率检查逻辑
                    score += 0.05
                    reasons.append("符合高分红要求")
                    logger.info("财务匹配: 高分红")
        else:
            # 传统财务指标检查
            if "低估值" in query or "PE" in query:
                if pe_ratio and 0 < pe_ratio < 20:
                    score += 0.1
                    reasons.append(f"低PE估值: {pe_ratio:.1f}")
                    logger.info(f"传统财务匹配: 低PE {pe_ratio}")
            
            if "低估值" in query or "PB" in query:
                if pb_ratio and 0 < pb_ratio < 2:
                    score += 0.1
                    reasons.append(f"低PB估值: {pb_ratio:.2f}")
                    logger.info(f"传统财务匹配: 低PB {pb_ratio}")
        
        # 市值权重 (权重: 10%)
        market_cap = stock.get("marketCap")
        if market_cap:
            if market_cap > 100_000_000_000:  # 1000亿以上
                score += 0.1
                reasons.append("大盘蓝筹")
                logger.info(f"市值加分: 大盘蓝筹 {market_cap/100000000:.0f}亿")
            elif market_cap > 50_000_000_000:  # 500亿以上
                score += 0.05
                reasons.append("中大盘股")
                logger.info(f"市值加分: 中大盘股 {market_cap/100000000:.0f}亿")
        
        # AI置信度加权
        if keyword_analysis and hasattr(keyword_analysis, 'confidence'):
            confidence_bonus = keyword_analysis.confidence * 0.1
            score += confidence_bonus
            if confidence_bonus > 0.05:
                reasons.append(f"AI分析高置信度: {keyword_analysis.confidence:.2f}")
            logger.info(f"AI置信度加分: {confidence_bonus:.3f}")
        
        # 如果匹配度仍然为0，给一个基础分数
        if score == 0.0:
            score = 0.1  # 给予基础匹配分数
            reasons.append("基础匹配")
            logger.warning(f"股票 {stock_symbol} {stock_name} 匹配度为0，给予基础分数")
        
        final_score = min(score, 1.0)
        logger.info(f"最终匹配度: {final_score:.3f}, 匹配原因: {reasons}")
        
        return final_score, reasons
    
    def _assess_risk_level(self, stock: Dict) -> str:
        """评估风险等级"""
        risk_score = 0
        
        # PE风险
        pe_ratio = stock.get("peRatio")
        if pe_ratio:
            if pe_ratio > 100:
                risk_score += 3
            elif pe_ratio > 50:
                risk_score += 2
            elif pe_ratio > 30:
                risk_score += 1
        
        # PB风险
        pb_ratio = stock.get("pbRatio")
        if pb_ratio and pb_ratio > 5:
            risk_score += 1
        
        # 市值风险
        market_cap = stock.get("marketCap")
        if market_cap:
            if market_cap < 10_000_000_000:  # 100亿以下
                risk_score += 2
            elif market_cap < 50_000_000_000:  # 500亿以下
                risk_score += 1
        
        # 涨跌幅风险
        change_percent = stock.get("changePercent")
        if change_percent and abs(change_percent) > 8:
            risk_score += 1
        
        if risk_score >= 4:
            return "high"
        elif risk_score >= 2:
            return "medium"
        else:
            return "low"
    
    def _generate_investment_highlights(self, stock: Dict) -> List[str]:
        """生成投资亮点"""
        highlights = []
        
        # 估值亮点
        pe_ratio = stock.get("peRatio")
        if pe_ratio and pe_ratio < 15:
            highlights.append(f"低估值：PE仅{pe_ratio:.1f}倍")
        
        pb_ratio = stock.get("pbRatio")
        if pb_ratio and pb_ratio < 1.5:
            highlights.append(f"破净股：PB仅{pb_ratio:.2f}倍")
        
        # 规模亮点
        market_cap = stock.get("marketCap")
        if market_cap:
            market_cap_billion = market_cap / 1_000_000_000
            if market_cap_billion > 1000:
                highlights.append(f"超大盘股：市值{market_cap_billion:.0f}亿")
            elif market_cap_billion > 500:
                highlights.append(f"大盘股：市值{market_cap_billion:.0f}亿")
        
        # 行业地位
        sector = stock.get("sector")
        if sector:
            highlights.append(f"{sector}板块标的")
        
        # 价格表现
        change_percent = stock.get("changePercent")
        if change_percent and change_percent > 3:
            highlights.append(f"强势上涨：涨幅{change_percent:.2f}%")
        
        return highlights[:3]
    
    def _generate_risk_warnings(self, stock: Dict) -> List[str]:
        """生成风险提示"""
        warnings = []
        
        # 估值风险
        pe_ratio = stock.get("peRatio")
        if pe_ratio and pe_ratio > 50:
            warnings.append(f"高估值：PE达{pe_ratio:.1f}倍")
        
        # 规模风险
        market_cap = stock.get("marketCap")
        if market_cap:
            market_cap_billion = market_cap / 1_000_000_000
            if market_cap_billion < 50:
                warnings.append(f"中小盘风险：市值{market_cap_billion:.0f}亿")
        
        # 波动风险
        change_percent = stock.get("changePercent")
        if change_percent and abs(change_percent) > 8:
            warnings.append(f"高波动：日涨跌{change_percent:.2f}%")
        
        # 流动性风险
        volume = stock.get("volume")
        if volume and volume < 5_000_000:
            warnings.append("成交量较小，流动性风险")
        
        return warnings[:2]