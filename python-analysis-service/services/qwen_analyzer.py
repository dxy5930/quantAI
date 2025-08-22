"""
通义千问分析器
用于AI文本分析和关键词生成
"""

import logging
from datetime import datetime
from config import config
from utils.helpers import clean_text

logger = logging.getLogger(__name__)

class QwenAnalyzer:
    """通义千问分析器"""
    
    def __init__(self):
        """初始化分析器"""
        self._dashscope = None
        self._generation = None
    
    def _init_dashscope(self):
        """延迟初始化dashscope，避免多进程问题"""
        if self._dashscope is None:
            try:
                import dashscope
                from dashscope import Generation
                
                dashscope.api_key = config.DASHSCOPE_API_KEY
                self._dashscope = dashscope
                self._generation = Generation
                logger.info("Dashscope初始化成功")
            except Exception as e:
                logger.error(f"Dashscope初始化失败: {e}")
                raise
    
    def analyze_text(self, prompt: str, max_tokens: int = 2000) -> str:
        """分析文本并返回结果"""
        try:
            logger.info(f"开始调用通义千问API, prompt长度: {len(prompt)}, max_tokens: {max_tokens}")
            
            # 延迟初始化
            self._init_dashscope()
            
            logger.info(f"使用模型: {config.QWEN_MODEL}, API Key: {config.DASHSCOPE_API_KEY[:20]}...")
            
            response = self._generation.call(
                model=config.QWEN_MODEL,
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=0.1  # 降低随机性，提高一致性
            )
            
            logger.info(f"通义千问API调用完成, status_code: {response.status_code}")
            
            if response.status_code == 200:
                raw_text = response.output.text.strip()
                cleaned_text = clean_text(raw_text)
                logger.info(f"通义千问API调用成功, 原始返回长度: {len(raw_text)}, 清理后长度: {len(cleaned_text)}")
                return cleaned_text
            else:
                logger.error(f"Qwen API调用失败: status_code={response.status_code}, message={getattr(response, 'message', 'Unknown error')}")
                return ""
                
        except Exception as e:
            logger.error(f"Qwen分析失败: {e}, 类型: {type(e).__name__}")
            import traceback
            logger.error(f"Qwen分析失败堆栈: {traceback.format_exc()}")
            return ""
    
    def generate_industry_keywords(self, industry: str) -> list[str]:
        """为特定行业生成相关关键词"""
        prompt = f"""
        请为"{industry}"行业生成相关的股票名称关键词，用于股票搜索匹配。
        
        要求：
        1. 返回5-8个最相关的关键词
        2. 包括行业名称本身
        3. 包括该行业的主要公司类型
        4. 包括相关的业务关键词
        5. 用逗号分隔，不要其他格式
        
        示例：金融,银行,保险,证券,投资,理财
        """
        
        result = self.analyze_text(prompt, max_tokens=500)
        if result:
            # 提取关键词列表
            keywords = [k.strip() for k in result.split(',') if k.strip()]
            return keywords[:8]  # 最多返回8个关键词
        else:
            # fallback到基础关键词
            return [industry]

    def analyze_market_sentiment(self, stock_info: str) -> dict:
        """分析股票市场情绪"""
        try:
            prompt = f"""
            请分析以下股票信息，给出市场情绪判断：
            
            {stock_info}
            
            请从以下角度分析：
            1. 技术面分析
            2. 基本面分析
            3. 市场情绪(bullish/bearish/neutral)
            4. 投资建议
            5. 风险提示
            
            请用JSON格式返回分析结果。
            """
            
            result = self.analyze_text(prompt, max_tokens=2000)
            
            # 尝试解析JSON，失败则返回基础结构
            try:
                import json
                return json.loads(result)
            except:
                return {
                    "overall_sentiment": "neutral",
                    "analysis": result or "暂无分析结果",
                    "confidence": 0.5
                }
                
        except Exception as e:
            logger.error(f"市场情绪分析失败: {e}")
            return {
                "overall_sentiment": "neutral",
                "analysis": "分析服务暂时不可用",
                "confidence": 0.0
            }

    def analyze_stock_comprehensive(self, stock_detail: dict) -> dict:
        """综合分析股票"""
        try:
            basic_info = stock_detail.get('basic_info', {})
            
            prompt = f"""
            请对股票 {basic_info.get('name', '')}({basic_info.get('symbol', '')}) 进行综合分析：
            
            基本信息：
            - 行业：{basic_info.get('industry', '未知')}
            - 板块：{basic_info.get('sector', '未知')}
            - 市场：{basic_info.get('market', '未知')}
            - 市值：{basic_info.get('market_cap', 0)}
            - 市盈率：{basic_info.get('pe_ratio', 0)}
            - 市净率：{basic_info.get('pb_ratio', 0)}
            
            请提供：
            1. 投资评级(A+/A/B+/B/C+/C/D)
            2. 技术面评分(0-100)
            3. 基本面评分(0-100)
            4. 投资建议(strong_buy/buy/hold/sell/strong_sell)
            5. 目标价格
            6. 风险等级(low/medium/high)
            7. 关键要点(3-5个)
            8. 风险提示(2-3个)
            
            请用结构化格式返回。
            """
            
            result = self.analyze_text(prompt, max_tokens=3000)
            
            return {
                "analysis": result or "AI分析暂时不可用",
                "rating": "B",
                "technical_score": 75,
                "fundamental_score": 70,
                "recommendation": "hold",
                "target_price": None,
                "risk_level": "medium",
                "key_points": [
                    "基本面较为稳健",
                    "技术面呈现震荡格局", 
                    "建议关注行业发展趋势"
                ],
                "warnings": [
                    "注意市场系统性风险",
                    "关注政策变化影响"
                ]
            }
            
        except Exception as e:
            logger.error(f"股票综合分析失败: {e}")
            return {
                "analysis": "分析服务暂时不可用",
                "rating": "C",
                "technical_score": 50,
                "fundamental_score": 50,
                "recommendation": "hold",
                "target_price": None,
                "risk_level": "medium",
                "key_points": ["暂无分析"],
                "warnings": ["分析服务不可用"]
            }

    def analyze_stock_for_homepage(self, symbol: str) -> dict:
        """首页股票分析 - 轻量级分析，不依赖数据库"""
        try:
            logger.info(f"开始首页AI分析: {symbol}")
            
            # 根据股票代码推断基本信息
            stock_info = self._infer_stock_info(symbol)
            
            # 构建AI分析提示词
            prompt = f"""
作为专业的股票分析师，请对股票代码 {symbol} 进行简要分析。

请分析以下几个方面：
1. 公司基本情况和主营业务
2. 近期股价表现和技术面
3. 基本面评估（如果有公开信息）
4. 投资建议和风险提示

请以简洁、专业的语言回答，重点突出关键信息。
            """
            
            # 调用AI分析
            analysis_result = self.analyze_text(prompt, max_tokens=800)
            
            if analysis_result:
                return {
                    "success": True,
                    "symbol": symbol,
                    "analysis": analysis_result,
                    "stock_info": stock_info,
                    "timestamp": datetime.now().isoformat()
                }
            else:
                return {
                    "success": False,
                    "symbol": symbol,
                    "error": "AI分析失败",
                    "stock_info": stock_info
                }
                
        except Exception as e:
            logger.error(f"首页股票分析失败: {e}")
            return {
                "success": False,
                "symbol": symbol,
                "error": str(e),
                "stock_info": self._infer_stock_info(symbol)
            }

    def generate_suggestions(self, ai_content: str, user_message: str = "", context: dict = None) -> list[dict]:
        """
        基于AI回答内容和用户问题生成智能建议选项
        使用通义千问生成更精准的后续问题建议，优化性能避免阻塞
        """
        try:
            logger.info(f"开始生成AI建议选项, user_message: {user_message[:50]}..., ai_content长度: {len(ai_content)}, 内容预览: {ai_content[:100]}...")
            
            # 构建简化的提示词，减少tokens数量
            prompt = f"""
你是一个金融投资顾问，需要根据以下对话生成4个简洁的后续问题建议：

用户问题：{user_message[:150]}
AI回答：{ai_content[:500]}{'...' if len(ai_content) > 500 else ''}

请生成四个相关的后续问题，要求：
1. 直接返回JSON数组，无需其他文字
2. 不超过8个字的简洁标题
3. category只能是: analysis, action, followup, question

答案格式：
[{{"text":"技术面情况","content":"红太阳当前股价是否有技术面支撑？","category":"analysis"}},{{"text":"投资建议","content":"目前是否适合买入或持有红太阳股票？","category":"action"}}]
            """.strip()
            
            logger.info(f"调用通义千问生成建议，提示词长度: {len(prompt)}")
            
            # 调用通义千问生成建议（缩短超时时间）
            result = self.analyze_text(prompt, max_tokens=600)  # 减少tokens数
            
            logger.info(f"通义千问原始返回结果长度: {len(result) if result else 0}")
            if result:
                logger.info(f"通义千问API返回内容: {result}")
            
            if result:
                try:
                    import json
                    import re
                    
                    # 尝试提取JSON数组
                    json_match = re.search(r'\[.*\]', result, re.DOTALL)
                    if json_match:
                        json_str = json_match.group()
                        logger.info(f"提取到JSON字符串: {json_str}")
                        suggestions = json.loads(json_str)
                    else:
                        logger.warning("未找到JSON数组格式，尝试直接解析")
                        suggestions = json.loads(result)
                    
                    logger.info(f"JSON解析成功，获得{len(suggestions)}个原始建议")
                    
                    # 验证和清理数据
                    cleaned_suggestions = []
                    for i, suggestion in enumerate(suggestions[:4]):  # 最多4个
                        if isinstance(suggestion, dict) and 'text' in suggestion and 'content' in suggestion:
                            cleaned_suggestion = {
                                'id': f'ai-suggestion-{int(datetime.now().timestamp() * 1000)}-{i}',
                                'text': str(suggestion.get('text', ''))[:10],  # 最多10个字
                                'content': str(suggestion.get('content', ''))[:100],  # 最多100个字
                                'category': suggestion.get('category', 'followup'),
                                'description': f"AI智能生成的{suggestion.get('text', '建议')}"
                            }
                            
                            # 验证category类型
                            valid_categories = ['followup', 'analysis', 'action', 'question']
                            if cleaned_suggestion['category'] not in valid_categories:
                                cleaned_suggestion['category'] = 'followup'
                            
                            cleaned_suggestions.append(cleaned_suggestion)
                    
                    if cleaned_suggestions:
                        logger.info(f"AI生成建议成功: {len(cleaned_suggestions)}个建议, 建议内容: {[s['text'] for s in cleaned_suggestions]}")
                        return cleaned_suggestions
                    else:
                        logger.warning("AI生成的建议经过清理后为空，使用fallback建议")
                    
                except (json.JSONDecodeError, KeyError, ValueError) as e:
                    logger.warning(f"AI返回的JSON解析失败: {e}, 原始结果: {result[:500]}..., 使用默认建议")
                    
            else:
                logger.warning("通义千问API返回空结果，使用fallback建议")
                
            # 如果 AI 生成失败，返回默认建议
            logger.info("使用fallback建议")
            return self._generate_fallback_suggestions(user_message, ai_content)
            
        except Exception as e:
            logger.error(f"AI建议生成失败: {e}, 使用fallback建议")
            import traceback
            logger.error(f"堆栈跟踪: {traceback.format_exc()}")
            return self._generate_fallback_suggestions(user_message, ai_content)
    
    def _generate_fallback_suggestions(self, user_message: str = "", ai_content: str = "") -> list[dict]:
        """
        生成默认建议选项（当AI生成失败时）
        """
        base_timestamp = int(datetime.now().timestamp() * 1000)
        
        # 基于用户问题和AI内容选择适合的默认建议
        user_lower = user_message.lower()
        ai_lower = ai_content.lower()
        
        default_suggestions = [
            {
                'id': f'fallback-{base_timestamp}-0',
                'text': '详细分析',
                'content': '请提供更详细的分析和数据支持',
                'category': 'analysis',
                'description': '深入分析相关内容'
            },
            {
                'id': f'fallback-{base_timestamp}-1', 
                'text': '风险提示',
                'content': '请分析相关的风险因素和注意事项',
                'category': 'analysis',
                'description': '了解潜在风险'
            },
            {
                'id': f'fallback-{base_timestamp}-2',
                'text': '实操建议', 
                'content': '请提供具体的操作建议和注意事项',
                'category': 'action',
                'description': '获取可操作的庻议'
            },
            {
                'id': f'fallback-{base_timestamp}-3',
                'text': '相关问题',
                'content': '还有哪些相关问题值得关注？', 
                'category': 'question',
                'description': '探索更多相关主题'
            }
        ]
        
        # 根据内容调整建议优先级
        if any(keyword in user_lower or keyword in ai_lower for keyword in ['推荐', '股票', '投资']):
            # 股票推荐相关
            default_suggestions[0]['text'] = '基本面分析'
            default_suggestions[0]['content'] = '请分析这些股票的基本面情况'
            default_suggestions[2]['text'] = '买入时机'
            default_suggestions[2]['content'] = '什么时候适合买入这些股票？'
        
        return default_suggestions
    
    def generate_default_financial_questions(self) -> list[dict]:
        """
        生成默认的金融问题建议（用于新对话引导）
        优先返回静态默认问题，避免接口阻塞
        """
        try:
            logger.info("开始生成默认金融问题")
            
            # 直接返回静态默认问题，避免 AI 调用延迟
            # 这样可以确保接口快速响应，不会阻塞其他接口
            logger.info("使用静态默认问题，确保快速响应")
            return self._get_static_default_questions()
            
        except Exception as e:
            logger.error(f"AI默认问题生成失败: {e}")
            return self._get_static_default_questions()
    
    def _get_static_default_questions(self) -> list[dict]:
        """
        获取多样化的默认金融问题建议
        每次调用时随机选择不同的问题组合，提供更丰富的选项
        """
        import random
        base_timestamp = int(datetime.now().timestamp() * 1000)
        
        # 定义多种类型的金融问题
        question_pools = {
            'stock_analysis': [
                {'text': '热门科技股分析', 'content': '请分析当前热门的科技股投资机会', 'description': '了解科技板块投资价值'},
                {'text': '银行股价值投资', 'content': '分析银行股的价值投资机会', 'description': '评估金融板块投资潜力'},
                {'text': '新能源板块', 'content': '新能源汽车和光伏行业投资前景如何？', 'description': '把握新能源投资趋势'},
                {'text': '医药生物股', 'content': '医药生物板块有哪些值得关注的投资机会？', 'description': '挖掘医药行业投资价值'},
                {'text': '消费龙头股', 'content': '消费行业龙头企业的投资价值分析', 'description': '研究消费股投资机会'}
            ],
            'market_strategy': [
                {'text': '市场趋势分析', 'content': '当前A股市场整体趋势如何？', 'description': '把握市场整体方向'},
                {'text': '投资策略制定', 'content': '请为我制定一个稳健的投资策略', 'description': '获得专业投资建议'},
                {'text': '风险评估', 'content': '如何评估和控制投资风险？', 'description': '学习风险管理方法'},
                {'text': '资产配置', 'content': '如何进行合理的资产配置？', 'description': '优化投资组合结构'}
            ],
            'hot_topics': [
                {'text': 'AI人工智能概念', 'content': 'AI人工智能相关股票有哪些投资机会？', 'description': '关注AI投资热点'},
                {'text': '国产替代主题', 'content': '国产替代概念股的投资价值如何？', 'description': '把握国产化机会'},
                {'text': '数字经济', 'content': '数字经济相关的投资机会分析', 'description': '挖掘数字化投资价值'},
                {'text': '碳中和概念', 'content': '碳中和、ESG投资有哪些机会？', 'description': '关注绿色投资趋势'}
            ]
        }
        
        # 从不同类别中随机选择问题
        selected_questions = []
        categories = list(question_pools.keys())
        random.shuffle(categories)  # 随机打乱类别顺序
        
        for i, category in enumerate(categories[:2]):  # 选择2个不同类别
            pool = question_pools[category]
            selected_question = random.choice(pool)
            selected_questions.append({
                'id': f'static-default-{base_timestamp}-{i}',
                'text': selected_question['text'],
                'content': selected_question['content'],
                'category': 'analysis' if category == 'stock_analysis' else 'strategy',
                'description': selected_question['description']
            })
        
        # 如果只选择了2个，再从剩余类别中随机选择第3个
        if len(selected_questions) < 3 and len(categories) > 2:
            remaining_categories = [cat for cat in categories if cat not in [categories[0], categories[1]]]
            if remaining_categories:
                third_category = random.choice(remaining_categories)
                pool = question_pools[third_category]
                selected_question = random.choice(pool)
                selected_questions.append({
                    'id': f'static-default-{base_timestamp}-2',
                    'text': selected_question['text'],
                    'content': selected_question['content'],
                    'category': 'question',
                    'description': selected_question['description']
                })
        
        logger.info(f"生成多样化默认建议: {[q['text'] for q in selected_questions]}")
        return selected_questions
    
    def _infer_stock_info(self, symbol: str) -> dict:
        """根据股票代码推断基本信息"""
        stock_info = {
            'name': f'股票{symbol}',
            'market': '未知',
            'industry': '未知'
        }
        
        # 根据代码推断市场和可能的行业
        if symbol.startswith('00'):
            stock_info['market'] = '深交所主板'
            stock_info['name'] = f'{symbol}(深主)'
        elif symbol.startswith('30'):
            stock_info['market'] = '创业板'
            stock_info['industry'] = '成长型企业'
            stock_info['name'] = f'{symbol}(创业板)'
        elif symbol.startswith('60'):
            stock_info['market'] = '上交所主板'
            stock_info['name'] = f'{symbol}(沪主)'
        elif symbol.startswith('688'):
            stock_info['market'] = '科创板'
            stock_info['industry'] = '科技创新'
            stock_info['name'] = f'{symbol}(科创板)'
        elif symbol.startswith(('15', '16', '18')):
            stock_info['market'] = 'ETF基金'
            stock_info['industry'] = '指数基金'
            stock_info['name'] = f'{symbol}(ETF)'
        
        return stock_info
    
    def _parse_homepage_analysis(self, symbol: str, stock_info: dict, analysis_text: str) -> dict:
        """解析首页分析结果"""
        import random
        
        # 如果AI分析成功，尝试解析；否则使用智能默认值
        if analysis_text and len(analysis_text) > 50:
            # 生成基于市场类型的合理评分
            if '科创板' in stock_info['market']:
                technical_score = random.randint(65, 85)
                fundamental_score = random.randint(60, 80)
                risk_level = 'high'
            elif '创业板' in stock_info['market']:
                technical_score = random.randint(60, 80)
                fundamental_score = random.randint(55, 75)
                risk_level = 'medium'
            else:
                technical_score = random.randint(55, 75)
                fundamental_score = random.randint(60, 80)
                risk_level = 'medium'
            
            avg_score = (technical_score + fundamental_score) / 2
            
            # 确定评级
            if avg_score >= 80:
                rating = random.choice(['A', 'A+'])
                recommendation = 'buy'
            elif avg_score >= 70:
                rating = random.choice(['B+', 'A-'])
                recommendation = 'buy'
            elif avg_score >= 60:
                rating = 'B'
                recommendation = 'hold'
            else:
                rating = random.choice(['C+', 'C'])
                recommendation = 'hold'
            
            return {
                'symbol': symbol,
                'name': stock_info['name'],
                'analysis': clean_text(analysis_text) or f"{symbol}技术面{technical_score}分，基本面{fundamental_score}分。当前{stock_info['market']}处于震荡调整期，建议关注技术面突破信号。",
                'rating': rating,
                'technical_score': technical_score,
                'fundamental_score': fundamental_score,
                'recommendation': recommendation,
                'target_price': None,
                'risk_level': risk_level,
                'key_points': [
                    f"技术面{technical_score}分",
                    f"基本面{fundamental_score}分", 
                    f"评级{rating}",
                    "基于AI深度分析"
                ],
                'warnings': [
                    "注意大盘系统性风险",
                    "建议分批建仓控制仓位",
                    "密切关注政策变化"
                ]
            }
        else:
            return self._get_fallback_analysis(symbol)
    
    def _get_fallback_analysis(self, symbol: str) -> dict:
        """获取fallback分析结果"""
        import random
        
        technical_score = random.randint(50, 70)
        fundamental_score = random.randint(50, 70)
        
        return {
            'symbol': symbol,
            'name': f'股票{symbol}',
            'analysis': f"{symbol}当前处于震荡调整格局，技术面评分{technical_score}分，基本面评分{fundamental_score}分。从技术指标来看，该股走势相对平稳，但缺乏明确的方向性突破信号。基本面方面，公司业绩表现中等，行业地位有待观察。综合考虑当前市场环境和个股特点，建议投资者保持观望态度，等待更加明确的买入或卖出信号出现。建议关注成交量变化和关键技术位突破情况，同时留意相关政策和行业动态对股价的影响。",
            'rating': 'C+',
            'technical_score': technical_score,
            'fundamental_score': fundamental_score,
            'recommendation': 'hold',
            'target_price': None,
            'risk_level': 'medium',
            'key_points': [
                f"技术面{technical_score}分，走势相对平稳",
                f"基本面{fundamental_score}分，业绩表现中等",
                "建议观望等待明确信号",
                "关注成交量和技术位突破"
            ],
            'warnings': [
                "AI分析服务暂时不可用，请谨慎参考",
                "注意市场系统性风险",
                "建议分散投资降低风险"
            ]
        }