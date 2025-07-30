"""
关键词分析服务
使用AI分析用户输入的关键词，提取股票相关信息
"""

import logging
import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import dashscope
from dashscope import Generation
from config import config

logger = logging.getLogger(__name__)

@dataclass
class StructuredCondition:
    """结构化查询条件"""
    field: str  # 字段名
    operator: str  # 操作符: >, <, >=, <=, =, !=, between, in
    value: Any  # 值
    period: Optional[str] = None  # 时间周期，如"3y"表示3年
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        result = {
            "field": self.field,
            "operator": self.operator,
            "value": self.value
        }
        if self.period:
            result["period"] = self.period
        return result

@dataclass
class KeywordAnalysis:
    """关键词分析结果"""
    original_query: str  # 原始查询
    extracted_keywords: List[str]  # 提取的关键词
    industry_keywords: List[str]  # 行业关键词
    concept_keywords: List[str]  # 概念关键词
    financial_keywords: List[str]  # 财务指标关键词
    technical_keywords: List[str]  # 技术指标关键词
    structured_conditions: List[StructuredCondition]  # 结构化查询条件
    sentiment: str  # 情感倾向: positive, negative, neutral
    intent: str  # 查询意图: search, analysis, recommendation
    confidence: float  # 分析置信度
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式，便于JSON序列化"""
        return {
            "original_query": self.original_query,
            "extracted_keywords": self.extracted_keywords,
            "industry_keywords": self.industry_keywords,
            "concept_keywords": self.concept_keywords,
            "financial_keywords": self.financial_keywords,
            "technical_keywords": self.technical_keywords,
            "structured_conditions": [condition.to_dict() for condition in self.structured_conditions],
            "sentiment": self.sentiment,
            "intent": self.intent,
            "confidence": self.confidence
        }

class KeywordAnalyzer:
    """关键词分析器"""
    
    def __init__(self):
        """初始化分析器"""
        dashscope.api_key = config.DASHSCOPE_API_KEY
        
        # 预定义关键词库
        self.industry_keywords = {
            "银行": ["银行", "金融", "存款", "贷款", "利息"],
            "科技": ["科技", "互联网", "软件", "芯片", "人工智能", "AI"],
            "医药": ["医药", "生物", "制药", "疫苗", "医疗"],
            "新能源": ["新能源", "电池", "光伏", "风电", "储能"],
            "房地产": ["房地产", "地产", "物业", "建筑"],
            "消费": ["消费", "零售", "食品", "饮料", "服装"],
            "汽车": ["汽车", "新能源车", "电动车", "整车"],
            "化工": ["化工", "石化", "化学", "材料"],
            "钢铁": ["钢铁", "有色", "金属", "铁矿"],
            "电力": ["电力", "发电", "电网", "火电"]
        }
        
        self.concept_keywords = {
            "ChatGPT": ["ChatGPT", "GPT", "大模型", "AIGC"],
            "元宇宙": ["元宇宙", "VR", "AR", "虚拟现实"],
            "区块链": ["区块链", "数字货币", "比特币", "NFT"],
            "碳中和": ["碳中和", "碳达峰", "环保", "减排"],
            "国产替代": ["国产替代", "自主可控", "进口替代"],
            "一带一路": ["一带一路", "基建", "出海"],
            "乡村振兴": ["乡村振兴", "农业", "种业"],
            "数字经济": ["数字经济", "数字化", "云计算", "大数据"]
        }
        
        self.financial_keywords = [
            "市盈率", "PE", "市净率", "PB", "ROE", "净资产收益率",
            "营收", "净利润", "毛利率", "负债率", "现金流",
            "分红", "股息率", "业绩", "财报", "增长"
        ]
        
        self.technical_keywords = [
            "涨停", "跌停", "突破", "支撑", "阻力", "均线",
            "成交量", "换手率", "振幅", "涨幅", "跌幅",
            "MACD", "KDJ", "RSI", "布林带", "趋势"
        ]
    
    async def analyze_keywords(self, query: str) -> KeywordAnalysis:
        """分析关键词 - 每次都用AI重新分析，结合本地规则"""
        try:
            logger.info(f"开始分析关键词: {query}")
            
            # 先进行规则分析作为基础
            rule_analysis = self._rule_based_analyze(query)
            
            # 每次都使用AI分析，不使用缓存
            try:
                logger.info("使用AI进行关键词分析")
                ai_analysis = await self._ai_analyze_fast(query)
                # 合并AI分析和规则分析结果
                result = self._merge_analysis(query, ai_analysis, rule_analysis)
                logger.info("AI分析完成，已合并规则分析结果")
            except Exception as e:
                logger.error(f"AI分析失败，回退到规则分析: {e}")
                result = self._create_analysis_from_rules(query, rule_analysis)
            
            logger.info(f"关键词分析完成: {result}")
            return result
            
        except Exception as e:
            logger.error(f"关键词分析失败: {e}")
            # 返回基础分析结果
            return self._fallback_analysis(query)
    
    async def _ai_analyze(self, query: str) -> Dict[str, Any]:
        """使用AI分析关键词"""
        prompt = f"""
        请分析以下股票查询文本，提取关键信息：

        查询文本：{query}

        请按以下JSON格式返回分析结果：
        {{
            "keywords": ["关键词1", "关键词2"],
            "industry": ["行业1", "行业2"],
            "concepts": ["概念1", "概念2"],
            "financial_indicators": ["财务指标1", "财务指标2"],
            "technical_indicators": ["技术指标1", "技术指标2"],
            "sentiment": "positive/negative/neutral",
            "intent": "search/analysis/recommendation",
            "confidence": 0.85
        }}

        注意：
        1. 提取与股票投资相关的关键词
        2. 识别行业板块（如银行、科技、医药等）
        3. 识别概念主题（如ChatGPT、新能源、元宇宙等）
        4. 识别财务指标（如PE、ROE、营收等）
        5. 识别技术指标（如涨停、突破、均线等）
        6. 判断情感倾向和查询意图
        7. 给出分析置信度
        """
        
        try:
            response = Generation.call(
                model=config.QWEN_MODEL,
                prompt=prompt,
                max_tokens=config.QWEN_MAX_TOKENS,
                temperature=config.QWEN_TEMPERATURE
            )
            
            if response.status_code == 200:
                content = response.output.text.strip()
                # 尝试解析JSON
                import json
                # 提取JSON部分
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
            
            return {}
            
        except Exception as e:
            logger.error(f"AI分析失败: {e}")
            return {}
    
    def _rule_based_analyze(self, query: str) -> Dict[str, Any]:
        """基于规则的快速分析"""
        # 基础关键词提取
        keywords = []
        industry_keywords = []
        concept_keywords = []
        financial_keywords = []
        technical_keywords = []
        
        # 常见投资关键词
        investment_terms = {
            '优质股': ['蓝筹股', '白马股', '优质'],
            '成长股': ['成长', '增长'],
            '价值股': ['价值', '低估'],
            '蓝筹股': ['蓝筹', '大盘股'],
            '白马股': ['白马', '稳健'],
            '科技股': ['科技', '互联网', 'AI', '人工智能'],
            '消费股': ['消费', '零售', '食品'],
            '银行股': ['银行', '金融'],
            '地产股': ['地产', '房地产'],
            '医药股': ['医药', '医疗', '生物'],
            '新能源': ['新能源', '电池', '光伏', '风电'],
        }
        
        # 提取投资相关关键词
        query_lower = query.lower()
        for term, related_keywords in investment_terms.items():
            if term in query:
                keywords.extend(related_keywords)
                if term in ['科技股', '消费股', '银行股', '地产股', '医药股', '新能源']:
                    industry_keywords.extend(related_keywords)
                else:
                    concept_keywords.extend(related_keywords)
        
        # 如果没有找到关键词，尝试简单分词
        if not keywords:
            simple_keywords = re.findall(r'[\u4e00-\u9fff]+', query)
            keywords.extend([kw for kw in simple_keywords if len(kw) >= 2])
        
        # 财务指标关键词
        financial_patterns = {
            r'市盈率|PE|估值': '市盈率',
            r'市净率|PB': '市净率', 
            r'ROE|净资产收益率': 'ROE',
            r'毛利率': '毛利率',
            r'净利润': '净利润',
            r'营收|营业收入': '营收',
            r'股息率': '股息率'
        }
        
        for pattern, keyword in financial_patterns.items():
            if re.search(pattern, query):
                financial_keywords.append(keyword)
        
        # 技术指标关键词
        technical_patterns = {
            r'RSI|相对强弱指标': 'RSI',
            r'MACD': 'MACD',
            r'均线|移动平均': '均线',
            r'支撑|阻力': '技术分析'
        }
        
        for pattern, keyword in technical_patterns.items():
            if re.search(pattern, query):
                technical_keywords.append(keyword)
        
        # 分析情感倾向
        sentiment = "neutral"
        if any(word in query for word in ['推荐', '好', '优质', '优秀', '看好']):
            sentiment = "positive"
        elif any(word in query for word in ['避免', '不好', '风险', '差']):
            sentiment = "negative"
        
        # 分析查询意图
        intent = "search"
        if any(word in query for word in ['推荐', '建议', '选择']):
            intent = "recommendation"
        elif any(word in query for word in ['分析', '评估']):
            intent = "analysis"
        
        return {
            "extracted_keywords": list(set(keywords)),
            "industry_keywords": list(set(industry_keywords)),
            "concept_keywords": list(set(concept_keywords)),
            "financial_keywords": list(set(financial_keywords)),
            "technical_keywords": list(set(technical_keywords)),
            "sentiment": sentiment,
            "intent": intent,
            "confidence": 0.6  # 规则分析置信度相对较低
        }
    
    def _merge_analysis(self, query: str, ai_result: Dict, rule_result: Dict) -> KeywordAnalysis:
        """合并AI和规则分析结果"""
        # 合并关键词
        keywords = list(set(
            ai_result.get("keywords", []) + 
            rule_result.get("keywords", [])
        ))
        
        # 合并各类关键词
        industry_keywords = list(set(
            ai_result.get("industry", []) + 
            rule_result.get("industry", [])
        ))
        
        concept_keywords = list(set(
            ai_result.get("concepts", []) + 
            rule_result.get("concepts", [])
        ))
        
        financial_keywords = list(set(
            ai_result.get("financial_indicators", []) + 
            rule_result.get("financial_indicators", [])
        ))
        
        technical_keywords = list(set(
            ai_result.get("technical_indicators", []) + 
            rule_result.get("technical_indicators", [])
        ))
        
        # 处理结构化条件
        structured_conditions = []
        ai_conditions = ai_result.get("structured_conditions", [])
        for condition_dict in ai_conditions:
            if isinstance(condition_dict, dict):
                structured_conditions.append(StructuredCondition(
                    field=condition_dict.get("field", ""),
                    operator=condition_dict.get("operator", "="),
                    value=condition_dict.get("value", ""),
                    period=condition_dict.get("period")
                ))
        
        # 选择置信度更高的结果
        sentiment = ai_result.get("sentiment", rule_result.get("sentiment", "neutral"))
        intent = ai_result.get("intent", rule_result.get("intent", "search"))
        confidence = ai_result.get("confidence", 0.7)
        
        return KeywordAnalysis(
            original_query=query,
            extracted_keywords=keywords,
            industry_keywords=industry_keywords,
            concept_keywords=concept_keywords,
            financial_keywords=financial_keywords,
            technical_keywords=technical_keywords,
            structured_conditions=structured_conditions,
            sentiment=sentiment,
            intent=intent,
            confidence=confidence
        )
    
    async def _ai_analyze_fast(self, query: str) -> Dict[str, Any]:
        """快速AI分析，包含结构化条件解析"""
        prompt = f"""请分析以下股票查询语句，提取其中的具体条件并转换为结构化JSON格式：

用户查询：{query}

请严格根据用户查询内容提取条件，不要添加未提及的条件。返回JSON格式：
{{
    "keywords": ["提取的关键词"],
    "industry": ["行业关键词"],
    "concepts": ["概念关键词"],
    "structured_conditions": [
        {{"field": "字段名", "operator": "操作符", "value": 数值, "period": "时间周期(可选)"}}
    ],
    "sentiment": "neutral",
    "intent": "search"
}}

字段映射规则：
- 市盈率/PE/估值 -> "市盈率"
- 市净率/PB -> "市净率"
- ROE/净资产收益率 -> "ROE"
- 收益率/回报率 -> "收益率"
- 回撤/最大回撤 -> "最大回撤"
- 营收/营业收入 -> "营收"
- 净利润 -> "净利润"
- 毛利率 -> "毛利率"
- 市值/总市值 -> "市值"

操作符映射：
- 高于/大于/超过/以上 -> ">"
- 低于/小于/少于/以下 -> "<"
- 等于/是 -> "="
- 不等于/不是 -> "!="
- 介于/在...之间 -> "between"

时间周期格式：
- 近1年/去年 -> "1y"
- 近2年 -> "2y" 
- 近3年 -> "3y"
- 近6个月/半年 -> "6m"
- 近1个月 -> "1m"
- 近1周 -> "1w"

重要：只提取用户明确提到的条件，不要添加默认值或示例中的条件。"""
        
        try:
            response = Generation.call(
                model=config.QWEN_MODEL,
                prompt=prompt,
                max_tokens=500,  # 增加token以支持结构化条件
                temperature=0.1  # 降低随机性
            )
            
            if response.status_code == 200:
                content = response.output.text.strip()
                import json
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
            
            return {}
            
        except Exception as e:
            logger.error(f"快速AI分析失败: {e}")
            return {}
    
    def _create_analysis_from_rules(self, query: str, rule_result: Dict) -> KeywordAnalysis:
        """从规则分析结果创建KeywordAnalysis对象"""
        return KeywordAnalysis(
            original_query=query,
            extracted_keywords=rule_result.get("keywords", [])[:10],  # 限制数量
            industry_keywords=rule_result.get("industry", [])[:5],
            concept_keywords=rule_result.get("concepts", [])[:5],
            financial_keywords=rule_result.get("financial_indicators", [])[:5],
            technical_keywords=rule_result.get("technical_indicators", [])[:5],
            structured_conditions=[],  # 规则分析暂不支持结构化条件
            sentiment=rule_result.get("sentiment", "neutral"),
            intent=rule_result.get("intent", "search"),
            confidence=0.8  # 规则分析置信度较高
        )
    
    def _fallback_analysis(self, query: str) -> KeywordAnalysis:
        """备用分析方法"""
        rule_result = self._rule_based_analyze(query)
        
        return KeywordAnalysis(
            original_query=query,
            extracted_keywords=rule_result.get("keywords", [query])[:10],
            industry_keywords=rule_result.get("industry", []),
            concept_keywords=rule_result.get("concepts", []),
            financial_keywords=rule_result.get("financial_indicators", []),
            technical_keywords=rule_result.get("technical_indicators", []),
            structured_conditions=[],  # 备用分析不支持结构化条件
            sentiment=rule_result.get("sentiment", "neutral"),
            intent=rule_result.get("intent", "search"),
            confidence=0.6
        )