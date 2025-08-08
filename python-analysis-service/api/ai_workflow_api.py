from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
import asyncio
import uuid
from datetime import datetime
import json
import logging

# 初始化logger
logger = logging.getLogger(__name__)

from services.qwen_analyzer import QwenAnalyzer
from services.stock_recommender import StockRecommender
from services.smart_stock_service import SmartStockService
from services.database_service import DatabaseService
from models.database import get_db
from models.workflow_models import (
    WorkflowInstance, WorkflowStep, WorkflowMessage, WorkflowResource,
    WorkflowStatus, StepStatus, StepCategory, ResourceTypeEnum, 
    MessageType, WorkflowResourceType
)
from utils.helpers import clean_text
from services.workflow_persistence_service import WorkflowPersistenceService

router = APIRouter(prefix="/api/v1", tags=["AI Workflow"])

def determine_resource_type_from_content(step_content: str, context: Dict[str, Any] = None) -> tuple[str, list]:
    """
    根据步骤内容和上下文智能判断resourceType和results
    现在所有步骤都是"正在思考..."，所以根据步骤顺序和用户消息内容来判断
    """
    # 获取步骤序号和用户消息
    step_number = context.get('step_number', 1) if context else 1
    user_message = context.get('user_message', '') if context else ''
    user_message_lower = user_message.lower()
    
    results = []
    
    # 根据步骤顺序和用户消息内容智能判断
    if step_number == 1:
        # 第一步：理解问题，通用操作
        resource_type = 'general'
        results = ["理解用户需求", "分析问题类型", "确定分析方向"]
    elif step_number == 2:
        # 第二步：根据用户问题判断是否需要数据查询
        if any(keyword in user_message_lower for keyword in [
            '股票', '代码', '数据', '行情', '价格', '财务', '分析', '000', '300', '600'
        ]):
            resource_type = 'database'
            results = ["查询股票基础信息", "获取市场行情数据", "检索历史数据"]
        else:
            resource_type = 'browser'
            results = ["搜索相关资料", "获取最新信息", "整理网络资源"]
    elif step_number == 3:
        # 第三步：AI分析处理
        resource_type = 'api'
        results = ["调用AI分析引擎", "获取智能推荐", "处理分析结果"]
    elif step_number == 4:
        # 第四步：整理结果
        resource_type = 'general'
        results = ["整合分析数据", "生成图表", "组织分析内容"]
    else:
        # 最后步骤：生成报告
        resource_type = 'general'
        results = ["制定投资建议", "评估风险", "生成最终报告"]
    
    return resource_type, results

def determine_step_category_from_message(message: str) -> str:
    """
    根据用户消息智能判断步骤类别
    """
    message_lower = message.lower()
    
    if any(keyword in message_lower for keyword in [
        '分析', '研究', '数据', '指标', '技术面', '基本面'
    ]):
        return 'analysis'
    elif any(keyword in message_lower for keyword in [
        '策略', '建议', '配置', '投资', '组合', '方案'
    ]):
        return 'strategy'
    else:
        return 'general'

def generate_task_title_and_description(message: str) -> tuple[str, str]:
    """
    根据用户消息智能生成任务标题和描述
    """
    message_lower = message.lower()
    
    # 提取关键信息
    symbols = []
    sectors = []
    strategies = []
    
    # 提取股票代码
    import re
    stock_pattern = r'[0-9]{6}|[A-Z]{2,5}'
    potential_symbols = re.findall(stock_pattern, message.upper())
    symbols.extend(potential_symbols[:3])  # 最多取3个
    
    # 识别行业板块
    sector_keywords = {
        '科技': ['科技', '技术', '互联网', '软件', '芯片', 'AI', '人工智能'],
        '医药': ['医药', '医疗', '生物', '制药', '健康'],
        '金融': ['银行', '保险', '证券', '金融', '券商'],
        '新能源': ['新能源', '电动车', '光伏', '风电', '锂电池', '充电桩'],
        '消费': ['消费', '零售', '食品', '饮料', '白酒', '家电'],
        '房地产': ['房地产', '地产', '房产', '物业'],
        '制造业': ['制造', '机械', '钢铁', '化工', '建材']
    }
    
    for sector, keywords in sector_keywords.items():
        if any(keyword in message_lower for keyword in keywords):
            sectors.append(sector)
    
    # 识别投资策略类型
    if any(keyword in message_lower for keyword in ['价值', '低估值', '分红', '蓝筹']):
        strategies.append('价值投资')
    if any(keyword in message_lower for keyword in ['成长', '高成长', '增长']):
        strategies.append('成长投资')
    if any(keyword in message_lower for keyword in ['量化', '技术分析', '指标']):
        strategies.append('量化分析')
    if any(keyword in message_lower for keyword in ['短线', '波段']):
        strategies.append('短期交易')
    if any(keyword in message_lower for keyword in ['长期', '长线']):
        strategies.append('长期投资')
    
    # 生成标题
    title_parts = []
    
    if symbols:
        title_parts.append(f"{symbols[0]}等股票")
    elif sectors:
        title_parts.append(f"{sectors[0]}板块")
    
    if any(keyword in message_lower for keyword in ['分析', '研究', '数据', '指标']):
        if title_parts:
            title = f"{title_parts[0]}深度分析"
        else:
            title = "市场分析任务"
    elif any(keyword in message_lower for keyword in ['策略', '建议', '配置', '投资', '组合']):
        if strategies:
            title = f"{strategies[0]}策略制定"
        elif title_parts:
            title = f"{title_parts[0]}投资策略"
        else:
            title = "投资策略制定"
    elif any(keyword in message_lower for keyword in ['推荐', '选择', '筛选']):
        if sectors:
            title = f"{sectors[0]}股票推荐"
        else:
            title = "股票推荐任务"
    elif any(keyword in message_lower for keyword in ['风险', '评估']):
        title = "风险评估分析"
    elif any(keyword in message_lower for keyword in ['预测', '趋势', '走势']):
        if title_parts:
            title = f"{title_parts[0]}趋势预测"
        else:
            title = "市场趋势预测"
    else:
        title = "AI投资咨询"
    
    # 生成描述（取用户消息的关键部分，最多50字符）
    description = message.strip()
    if len(description) > 50:
        description = description[:47] + "..."
    
    # 如果消息太短，生成更详细的描述
    if len(description) < 10:
        if symbols:
            description = f"分析{', '.join(symbols[:2])}等股票的投资价值"
        elif sectors:
            description = f"研究{', '.join(sectors[:2])}等行业的投资机会"
        elif strategies:
            description = f"制定{strategies[0]}相关的投资方案"
        else:
            description = "基于AI的智能投资分析与建议"
    
    return title, description

# 为步骤补充可点击URL
def enrich_steps_with_urls(steps: List[Dict[str, Any]], message: str) -> List[Dict[str, Any]]:
    try:
        from urllib.parse import quote
        q = quote(message.strip())
        default_urls = [
            f"https://so.eastmoney.com/web/s?keyword={q}",
            f"https://xueqiu.com/k?q={q}",
            f"https://finance.sina.com.cn/search?search={q}"
        ]
        for step in steps or []:
            urls = step.get('urls') or []
            if not urls:
                rt = (step.get('resourceType') or 'general').lower()
                if rt == 'database':
                    step['urls'] = [
                        f"https://so.eastmoney.com/web/s?keyword={q}",
                        "https://data.eastmoney.com/bbsj/",
                        "https://quote.eastmoney.com/"
                    ]
                elif rt == 'api':
                    step['urls'] = [
                        "https://dashscope.console.aliyun.com/overview",
                        "https://help.aliyun.com/zh/model-studio/getting-started/quick-start",
                        default_urls[0]
                    ]
                else:  # browser/general/其他
                    step['urls'] = default_urls
        return steps
    except Exception:
        return steps

# 请求模型
class WorkflowStartRequest(BaseModel):
    workflow_id: str
    query: str
    user_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class WorkflowDefinitionRunRequest(BaseModel):
    execution_id: str
    workflow_definition: Dict[str, Any]
    user_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class WorkflowValidationRequest(BaseModel):
    workflow_definition: Dict[str, Any]

class ChatMessageRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    user_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class StockAnalysisRequest(BaseModel):
    symbol: str

class StrategyGenerationRequest(BaseModel):
    riskTolerance: str = "medium"
    investmentGoal: str
    timeHorizon: str = "medium"
    sectors: Optional[List[str]] = None
    excludeStocks: Optional[List[str]] = None
    userId: Optional[str] = None

# 响应模型
class AgentStatus(BaseModel):
    id: str
    name: str
    status: str = "idle"  # idle, running, completed, error
    progress: int = 0
    message: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    startTime: Optional[str] = None
    endTime: Optional[str] = None

class WorkflowResponse(BaseModel):
    workflowId: str
    status: str
    message: str
    agents: Optional[List[AgentStatus]] = None
    results: Optional[Dict[str, Any]] = None

# 全局变量存储工作流状态
workflow_storage: Dict[str, Dict[str, Any]] = {}
conversation_storage: Dict[str, List[Dict[str, Any]]] = {}
# 新增：工作流定义执行存储
workflow_execution_storage: Dict[str, Dict[str, Any]] = {}

# 初始化服务
qwen_analyzer = QwenAnalyzer()
stock_recommender = StockRecommender()
smart_stock_service = SmartStockService()
db_service = DatabaseService()

@router.post("/workflow/start")
async def start_workflow(request: WorkflowStartRequest, background_tasks: BackgroundTasks):
    """启动AI工作流"""
    try:
        workflow_id = request.workflow_id
        
        # 初始化工作流状态
        workflow_storage[workflow_id] = {
            "id": workflow_id,
            "status": "running",
            "query": request.query,
            "user_id": request.user_id,
            "context": request.context or {},
            "start_time": datetime.now().isoformat(),
            "agents": get_default_agents(),
            "results": {}
        }
        
        # 在后台执行工作流
        background_tasks.add_task(execute_workflow, workflow_id, request.query, request.context)
        
        return {
            "success": True,
            "data": {
                "workflowId": workflow_id,
                "status": "started",
                "message": "AI工作流已启动",
                "agents": get_default_agents()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"启动工作流失败: {str(e)}")

@router.get("/workflow/status/{workflow_id}")
async def get_workflow_status(workflow_id: str):
    """获取工作流状态"""
    try:
        if workflow_id not in workflow_storage:
            raise HTTPException(status_code=404, detail="工作流不存在")
        
        workflow = workflow_storage[workflow_id]
        
        return {
            "success": True,
            "data": {
                "workflowId": workflow_id,
                "status": workflow["status"],
                "progress": calculate_progress(workflow["agents"]),
                "agents": workflow["agents"],
                "results": workflow.get("results", {}),
                "message": workflow.get("message", "")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取工作流状态失败: {str(e)}")

@router.post("/workflow/stop/{workflow_id}")
async def stop_workflow(workflow_id: str):
    """停止工作流"""
    try:
        if workflow_id not in workflow_storage:
            raise HTTPException(status_code=404, detail="工作流不存在")
        
        workflow = workflow_storage[workflow_id]
        workflow["status"] = "stopped"
        workflow["end_time"] = datetime.now().isoformat()
        
        return {
            "success": True,
            "data": {"message": "工作流已停止"}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"停止工作流失败: {str(e)}")

@router.get("/workflow/results/{workflow_id}")
async def get_workflow_results(workflow_id: str):
    """获取工作流结果"""
    try:
        if workflow_id not in workflow_storage:
            raise HTTPException(status_code=404, detail="工作流不存在")
        
        workflow = workflow_storage[workflow_id]
        
        return {
            "success": True,
            "data": workflow.get("results", {})
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取工作流结果失败: {str(e)}")

@router.post("/chat/analyze")
async def analyze_chat_message(request: ChatMessageRequest):
    """分析聊天消息并生成AI回复（专门用于AI分析）"""
    try:
        # 使用现有的分析服务进行智能分析
        analysis_result = await perform_intelligent_analysis(request.message, request.context)
        
        return {
            "success": True,
            "data": {
                "response": analysis_result["response"],
                "analysis": analysis_result.get("analysis"),
                "recommendations": analysis_result.get("recommendations", [])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI分析失败: {str(e)}")

@router.get("/chat/stream")
async def stream_chat_message(
    message: str,
    conversation_id: str = None,
    context: str = "{}",
    workflow_id: str = None,  # 新增：直接接收工作流ID
    db: Session = Depends(get_db)
):
    """流式对话接口 - 分段式输出AI回复"""
    try:
        # 解析参数
        conversation_id = conversation_id or f"conv_{uuid.uuid4()}"
        try:
            context_dict = json.loads(context) if context else {}
        except:
            context_dict = {}

        # 初始化工作流持久化服务
        persistence_service = WorkflowPersistenceService(db)

        # 初始化对话历史
        if conversation_id not in conversation_storage:
            conversation_storage[conversation_id] = []

        # 添加用户消息
        user_message = {
            "id": f"msg_{uuid.uuid4()}",
            "type": "user",
            "content": message,
            "timestamp": datetime.now().isoformat()
        }
        
        # 保存用户消息到数据库
        if workflow_id:
            persistence_service.save_message(workflow_id, {
                "messageId": user_message["id"],
                "type": "user", 
                "content": message,
                "status": "sent"
            })

        # 创建AI消息ID
        ai_message_id = f"msg_{uuid.uuid4()}"

        async def generate_streaming_response():
            """生成流式响应"""
            try:
                # 1. 发送开始信号 - 立即发送，确保前端能收到
                yield f"data: {json.dumps({'type': 'start', 'messageId': ai_message_id})}\n\n"
                
                # 短暂延迟确保start事件被处理
                await asyncio.sleep(0.1)
                
                # 保存AI消息开始到数据库
                if workflow_id:
                    persistence_service.save_message(workflow_id, {
                        "messageId": ai_message_id,
                        "type": "assistant",
                        "content": "正在思考中...",
                        "status": "started"
                    })
                
                # 2. 基于消息内容路由到不同的处理逻辑
                message_lower = message.lower()
                context = context_dict
                
                # 添加超时保护，避免长时间阻塞
                try:
                    print(f"🚀 开始路由消息处理, message_lower包含关键词检查:")
                    print(f"   是否包含分析关键词: {any(keyword in message_lower for keyword in ['分析', '股票', '投资', '市场'])}")
                    print(f"   是否包含策略关键词: {any(keyword in message_lower for keyword in ['策略', '建议', '推荐'])}")
                    
                    if any(keyword in message_lower for keyword in ['分析', '股票', '投资', '市场']):
                        # 股票分析相关的分段响应
                        print(f"📊 路由到分析流, workflow_id: {workflow_id}")
                        async for chunk in generate_analysis_stream(message, context, workflow_id, persistence_service, ai_message_id):
                            yield chunk
                    elif any(keyword in message_lower for keyword in ['策略', '建议', '推荐']):
                        # 策略建议相关的分段响应
                        print(f"📈 路由到策略流, workflow_id: {workflow_id}")
                        async for chunk in generate_strategy_stream(message, context, workflow_id, persistence_service, ai_message_id):
                            yield chunk
                    else:
                        # 通用对话的分段响应
                        print(f"💬 路由到通用流, workflow_id: {workflow_id}")
                        async for chunk in generate_general_stream(message, context, workflow_id, persistence_service, ai_message_id):
                            yield chunk
                except asyncio.TimeoutError:
                    # 超时处理
                    yield f"data: {json.dumps({'type': 'error', 'error': '响应超时，请稍后重试'})}\n\n"
                    return
                except Exception as stream_error:
                    # 流式处理错误
                    yield f"data: {json.dumps({'type': 'error', 'error': f'处理失败: {str(stream_error)}'})}\n\n"
                    return
                
                # 3. 发送完成信号
                yield f"data: {json.dumps({'type': 'complete', 'messageId': ai_message_id})}\n\n"
                
                # 4. 保存AI消息完成状态到数据库
                if workflow_id:
                    persistence_service.save_message(workflow_id, {
                        "messageId": ai_message_id,
                        "type": "assistant", 
                        "content": "分析完成",
                        "status": "completed"
                    })
                
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
        
        return StreamingResponse(
            generate_streaming_response(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"流式对话失败: {str(e)}")

@router.post("/chat/message")
async def send_chat_message(request: ChatMessageRequest):
    """发送聊天消息（保留原有接口兼容性）"""
    try:
        conversation_id = request.conversation_id or f"conv_{uuid.uuid4()}"
        
        # 初始化对话历史
        if conversation_id not in conversation_storage:
            conversation_storage[conversation_id] = []
        
        # 添加用户消息
        user_message = {
            "id": f"msg_{uuid.uuid4()}",
            "type": "user",
            "content": request.message,
            "timestamp": datetime.now().isoformat()
        }
        conversation_storage[conversation_id].append(user_message)
        
        # 生成AI回复
        ai_response = await generate_ai_response(request.message, request.context)
        
        ai_message = {
            "id": f"msg_{uuid.uuid4()}",
            "type": "assistant",
            "content": ai_response,
            "timestamp": datetime.now().isoformat()
        }
        conversation_storage[conversation_id].append(ai_message)
        
        return {
            "success": True,
            "data": {
                "message": ai_message,
                "conversationId": conversation_id
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"发送聊天消息失败: {str(e)}")

@router.get("/chat/history/{conversation_id}")
async def get_chat_history(conversation_id: str):
    """获取聊天历史"""
    try:
        history = conversation_storage.get(conversation_id, [])
        
        return {
            "success": True,
            "data": history
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取聊天历史失败: {str(e)}")

@router.get("/agents")
async def get_agents():
    """获取智能体配置"""
    try:
        agents = get_default_agents()
        
        return {
            "success": True,
            "data": agents
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取智能体配置失败: {str(e)}")

@router.get("/workflow/history/{user_id}")
async def get_workflow_history(user_id: str):
    """获取用户工作流历史"""
    try:
        # 从存储中筛选用户的工作流
        user_workflows = [
            workflow for workflow in workflow_storage.values()
            if workflow.get("user_id") == user_id
        ]
        
        return {
            "success": True,
            "data": {
                "workflows": user_workflows,
                "total": len(user_workflows),
                "page": 1,
                "limit": 10
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取工作流历史失败: {str(e)}")

@router.post("/analyze/stock")
async def analyze_stock(request: StockAnalysisRequest):
    """分析股票 - 使用轻量级分析，不依赖数据库"""
    try:
        # 使用首页专用的轻量级分析方法
        analysis_result = qwen_analyzer.analyze_stock_for_homepage(request.symbol)
        
        return {
            "success": True,
            "data": {
                "analysis": analysis_result,
                "recommendations": [f"基于AI分析，{request.symbol}具有投资价值"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"股票分析失败: {str(e)}")

@router.post("/generate/strategy")
async def generate_strategy(request: StrategyGenerationRequest):
    """生成投资策略"""
    try:
        # 基于用户偏好生成策略
        strategies = await generate_investment_strategies(request)
        
        return {
            "success": True,
            "data": {
                "strategies": strategies,
                "reasoning": f"基于您的风险偏好({request.riskTolerance})和投资目标生成策略"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"策略生成失败: {str(e)}")

@router.get("/market/insights")
async def get_market_insights():
    """获取市场洞察"""
    try:
        insights = await generate_market_insights()
        
        return {
            "success": True,
            "data": insights
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取市场洞察失败: {str(e)}")

# 新增工作流画布相关API端点

@router.post("/workflow/definition/run")
async def run_workflow_definition(request: WorkflowDefinitionRunRequest, background_tasks: BackgroundTasks):
    """运行工作流定义"""
    try:
        execution_id = request.execution_id
        workflow_definition = request.workflow_definition
        
        # 验证工作流定义
        validation_result = validate_workflow_definition_internal(workflow_definition)
        if not validation_result["valid"]:
            raise HTTPException(status_code=400, detail=f"工作流定义无效: {validation_result['errors']}")
        
        # 初始化工作流执行状态
        workflow_execution_storage[execution_id] = {
            "execution_id": execution_id,
            "workflow_definition": workflow_definition,
            "user_id": request.user_id,
            "context": request.context or {},
            "status": "running",
            "progress": 0,
            "start_time": datetime.now().isoformat(),
            "node_statuses": initialize_node_statuses(workflow_definition.get("nodes", [])),
            "results": {}
        }
        
        # 在后台执行工作流定义
        background_tasks.add_task(execute_workflow_definition, execution_id, workflow_definition, request.context)
        
        return {
            "success": True,
            "data": {
                "execution_id": execution_id,
                "status": "running",
                "message": "工作流定义开始执行",
                "node_statuses": workflow_execution_storage[execution_id]["node_statuses"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"运行工作流定义失败: {str(e)}")

@router.get("/workflow/execution/status/{execution_id}")
async def get_workflow_execution_status(execution_id: str):
    """获取工作流执行状态"""
    try:
        if execution_id not in workflow_execution_storage:
            raise HTTPException(status_code=404, detail="工作流执行不存在")
        
        execution = workflow_execution_storage[execution_id]
        
        return {
            "success": True,
            "data": {
                "execution_id": execution_id,
                "status": execution["status"],
                "progress": execution["progress"],
                "node_statuses": execution["node_statuses"],
                "results": execution.get("results", {}),
                "current_node": execution.get("current_node"),
                "message": execution.get("message", "")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取工作流执行状态失败: {str(e)}")

@router.post("/workflow/execution/stop/{execution_id}")
async def stop_workflow_execution(execution_id: str):
    """停止工作流执行"""
    try:
        if execution_id not in workflow_execution_storage:
            raise HTTPException(status_code=404, detail="工作流执行不存在")
        
        execution = workflow_execution_storage[execution_id]
        execution["status"] = "stopped"
        execution["end_time"] = datetime.now().isoformat()
        
        return {
            "success": True,
            "data": {"message": "工作流执行已停止"}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"停止工作流执行失败: {str(e)}")

@router.get("/workflow/execution/results/{execution_id}")
async def get_workflow_execution_results(execution_id: str):
    """获取工作流执行结果"""
    try:
        if execution_id not in workflow_execution_storage:
            raise HTTPException(status_code=404, detail="工作流执行不存在")
        
        execution = workflow_execution_storage[execution_id]
        
        return {
            "success": True,
            "data": execution.get("results", {})
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取工作流执行结果失败: {str(e)}")

@router.post("/workflow/definition/validate")
async def validate_workflow_definition(request: WorkflowValidationRequest):
    """验证工作流定义"""
    try:
        workflow_definition = request.workflow_definition
        validation_result = validate_workflow_definition_internal(workflow_definition)
        
        return {
            "success": validation_result["valid"],
            "data": {
                "valid": validation_result["valid"],
                "errors": validation_result["errors"],
                "warnings": validation_result.get("warnings", [])
            },
            "message": "验证完成" if validation_result["valid"] else "工作流定义存在错误"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"验证工作流定义失败: {str(e)}")

# 辅助函数
def get_default_agents():
    """获取默认智能体配置"""
    return [
        {
            "id": "data-collector",
            "name": "数据收集智能体",
            "status": "idle",
            "progress": 0,
            "message": None
        },
        {
            "id": "analyzer",
            "name": "分析智能体",
            "status": "idle",
            "progress": 0,
            "message": None
        },
        {
            "id": "strategy-generator",
            "name": "策略生成智能体",
            "status": "idle",
            "progress": 0,
            "message": None
        },
        {
            "id": "risk-assessor",
            "name": "风险评估智能体",
            "status": "idle",
            "progress": 0,
            "message": None
        },
        {
            "id": "executor",
            "name": "执行智能体",
            "status": "idle",
            "progress": 0,
            "message": None
        }
    ]

def calculate_progress(agents):
    """计算总体进度"""
    if not agents:
        return 0
    
    total_progress = sum(agent.get("progress", 0) for agent in agents)
    return total_progress // len(agents)

async def execute_workflow(workflow_id: str, query: str, context: Dict[str, Any]):
    """执行工作流"""
    try:
        workflow = workflow_storage[workflow_id]
        agents = workflow["agents"]
        
        # 步骤1: 数据收集
        await update_agent_status(workflow_id, "data-collector", "running", 0, "正在收集市场数据...")
        await asyncio.sleep(2)  # 模拟处理时间
        await update_agent_status(workflow_id, "data-collector", "completed", 100, "市场数据收集完成")
        
        # 步骤2: 智能分析
        await update_agent_status(workflow_id, "analyzer", "running", 0, "正在进行智能分析...")
        analysis_result = await perform_analysis(query)
        await update_agent_status(workflow_id, "analyzer", "completed", 100, "智能分析完成")
        
        # 步骤3: 策略生成
        await update_agent_status(workflow_id, "strategy-generator", "running", 0, "正在生成投资策略...")
        await asyncio.sleep(2)
        await update_agent_status(workflow_id, "strategy-generator", "completed", 100, "投资策略生成完成")
        
        # 步骤4: 风险评估
        await update_agent_status(workflow_id, "risk-assessor", "running", 0, "正在评估风险...")
        await asyncio.sleep(1.5)
        await update_agent_status(workflow_id, "risk-assessor", "completed", 100, "风险评估完成")
        
        # 步骤5: 执行
        await update_agent_status(workflow_id, "executor", "running", 0, "正在生成最终报告...")
        await asyncio.sleep(1)
        await update_agent_status(workflow_id, "executor", "completed", 100, "最终报告生成完成")
        
        # 完成工作流
        workflow["status"] = "completed"
        workflow["end_time"] = datetime.now().isoformat()
        workflow["results"] = analysis_result
        
    except Exception as e:
        print(f"工作流执行失败: {e}")
        workflow = workflow_storage.get(workflow_id)
        if workflow:
            workflow["status"] = "error"
            workflow["message"] = str(e)

async def update_agent_status(workflow_id: str, agent_id: str, status: str, progress: int, message: str):
    """更新智能体状态"""
    workflow = workflow_storage.get(workflow_id)
    if workflow:
        agents = workflow["agents"]
        for agent in agents:
            if agent["id"] == agent_id:
                agent["status"] = status
                agent["progress"] = progress
                agent["message"] = message
                if status == "running":
                    agent["startTime"] = datetime.now().isoformat()
                elif status in ["completed", "error"]:
                    agent["endTime"] = datetime.now().isoformat()
                break

async def perform_analysis(query: str):
    """执行分析"""
    try:
        # 调用现有的分析服务
        result = stock_recommender.recommend_stocks_by_query(query)
        
        return {
            "marketAnalysis": {
                "trend": "震荡上行",
                "sentiment": "谨慎乐观",
                "volatility": "中等",
                "keyFactors": ["政策支持", "业绩改善", "资金流入"]
            },
            "stockRecommendations": result.get("recommendations", []),
            "keywords": result.get("extracted_keywords", []),
            "summary": f"基于查询'{query}'的分析结果"
        }
    except Exception as e:
        print(f"分析失败: {e}")
        return {
            "marketAnalysis": {
                "trend": "数据获取中",
                "sentiment": "中性",
                "volatility": "未知",
                "keyFactors": []
            },
            "stockRecommendations": [],
            "summary": "分析服务暂时不可用"
        }

async def perform_intelligent_analysis(message: str, context: Dict[str, Any] = None):
    """执行智能分析（专门用于AI分析的核心函数）"""
    try:
        print(f"开始智能分析: {message}")
        
        # 处理上下文信息
        enhanced_message = message
        if context:
            enhanced_message = enhance_message_with_context(message, context)
            print(f"增强后的消息: {enhanced_message}")
        
        # 使用现有的股票推荐服务进行分析
        analysis_result = stock_recommender.recommend_stocks_by_query(enhanced_message)
        
        # 如果有推荐结果，生成详细回复
        if analysis_result and analysis_result.get("recommendations"):
            recommendations = analysis_result["recommendations"][:5]  # 取前5个推荐
            keywords = analysis_result.get("keywords", [])
            
            # 生成智能回复
            response = f"基于AI分析，我为您找到了以下投资建议：\n\n"
            
            if keywords:
                response += f"🔍 **关键分析要素**\n"
                for keyword in keywords[:3]:
                    response += f"• {keyword.get('text', keyword)}\n"
                response += "\n"
            
            response += f"📈 **推荐股票** ({len(recommendations)}只)\n"
            for i, stock in enumerate(recommendations, 1):
                response += f"**{i}. {stock.get('symbol', 'N/A')} - {stock.get('name', '未知')}**\n"
                response += f"• 匹配度: {stock.get('matchScore', stock.get('score', 85))}分\n"
                response += f"• 推荐理由: {stock.get('reason', '基于AI分析推荐')}\n"
                if stock.get('sector'):
                    response += f"• 所属行业: {stock.get('sector')}\n"
                response += "\n"
            
            response += "💡 **投资建议**\n"
            response += "• 建议分散投资，控制单一标的权重\n"
            response += "• 密切关注市场动态和政策变化\n"
            response += "• 设置合理的止损点位\n\n"
            response += "需要我详细分析某只具体股票吗？"
            
            return {
                "response": clean_text(response),
                "analysis": analysis_result,
                "recommendations": recommendations
            }
        else:
            # 如果没有具体推荐，提供通用分析
            response = await generate_general_analysis_response(message)
            return {
                "response": clean_text(response),
                "analysis": {"type": "general", "query": message},
                "recommendations": []
            }
            
    except Exception as e:
        print(f"智能分析失败: {e}")
        return {
            "response": "抱歉，AI分析服务暂时遇到问题，请稍后重试。我会尽快为您提供专业的投资分析。",
            "analysis": {"error": str(e)},
            "recommendations": []
        }

async def generate_general_analysis_response(message: str):
    """生成通用分析回复"""
    try:
        # 使用Qwen分析器进行关键词分析
        keywords_result = await qwen_analyzer.analyze_keywords(message)
        
        if keywords_result and keywords_result.get("keywords"):
            keywords = keywords_result["keywords"]
            
            response = f"基于您的查询「{message}」，我进行了以下分析：\n\n"
            response += "🔍 **关键投资要素识别**\n"
            
            for keyword in keywords[:5]:
                if isinstance(keyword, dict):
                    text = keyword.get('text', keyword.get('keyword', ''))
                    confidence = keyword.get('confidence', 0)
                    if confidence > 0:
                        response += f"• {text} (相关度: {int(confidence * 100)}%)\n"
                    else:
                        response += f"• {text}\n"
                else:
                    response += f"• {keyword}\n"
            
            response += "\n📊 **投资建议方向**\n"
            
            # 根据关键词提供相应建议
            keyword_texts = [k.get('text', k) if isinstance(k, dict) else str(k) for k in keywords]
            keyword_str = ' '.join(keyword_texts).lower()
            
            if any(word in keyword_str for word in ['科技', '技术', '互联网', '软件']):
                response += "• 关注科技板块的投资机会\n• 重点关注创新能力强的公司\n• 注意估值合理性\n"
            elif any(word in keyword_str for word in ['金融', '银行', '保险']):
                response += "• 关注金融板块的价值投资机会\n• 重点关注分红稳定的优质银行股\n• 注意政策影响\n"
            elif any(word in keyword_str for word in ['医药', '医疗', '生物']):
                response += "• 关注医药板块的长期投资价值\n• 重点关注创新药和医疗器械\n• 注意政策和审批风险\n"
            else:
                response += "• 建议多元化投资，分散风险\n• 关注基本面良好的优质公司\n• 结合技术分析确定买入时机\n"
            
            response += "\n💡 如需具体的股票推荐，请告诉我您的风险偏好和投资期限。"
            
            return clean_text(response)
        else:
            return clean_text(generate_fallback_response(message))
            
    except Exception as e:
        print(f"通用分析失败: {e}")
        return clean_text(generate_fallback_response(message))

def generate_fallback_response(message: str):
    """生成降级回复"""
    response = f"""我理解您关于「{message}」的咨询。

🎯 **我可以为您提供以下服务：**
• 个股分析和推荐
• 行业板块投资建议  
• 投资策略制定
• 风险评估和管理
• 市场趋势分析

💡 **建议您可以这样提问：**
• "推荐一些科技股"
• "分析一下银行板块"
• "我想要低风险的投资建议"
• "帮我分析000001这只股票"

请告诉我您的具体需求，我会为您提供专业的投资分析！"""
    return clean_text(response)

async def generate_analysis_stream(message: str, context: Dict[str, Any], workflow_id: str, persistence_service: WorkflowPersistenceService, ai_message_id: str):
    """生成股票分析的流式响应"""
    
    print(f"📊 进入generate_analysis_stream函数, workflow_id: {workflow_id}, message: {message[:50]}...")
    
    # 使用AI智能生成分析步骤
    analysis_steps = await generate_smart_analysis_steps(message, context)
    analysis_steps = enrich_steps_with_urls(analysis_steps, message)
    
    category = determine_step_category_from_message(message)
    
    for i, step_info in enumerate(analysis_steps):
        step_context = {
            'step_number': i + 1,
            'user_message': message,
            **(context or {})
        }
        
        # 从AI生成的步骤信息中提取资源类型和结果
        resource_type = step_info.get('resourceType', 'general')
        results = step_info.get('results', [])
        step_content = step_info.get('content', f'执行步骤 {i+1}')
        
        step_data = {
            'type': 'progress', 
            'content': step_content, 
            'step': i+1, 
            'totalSteps': len(analysis_steps), 
            'stepId': f'step_{i+1}', 
            'category': category,
            'resourceType': resource_type,
            'results': results,
            'executionDetails': step_info.get('executionDetails', {}),
            'urls': step_info.get('urls', []),
            'files': step_info.get('files', [])
        }
        
        # 保存步骤到数据库
        if workflow_id:
            try:
                persistence_service.save_step(workflow_id, {
                    'step_id': f'step_{i+1}',
                    'step_number': i + 1,
                    'content': step_content,
                    'category': category,
                    'resource_type': resource_type,
                    'status': 'running',
                    'results': results,
                    'execution_details': step_info.get('executionDetails', {}),
                    'urls': step_info.get('urls', []),
                    'files': step_info.get('files', [])
                })
                
                # 【新增】实时保存思考过程消息到数据库
                step_message_id = f"step_msg_{i+1}_{uuid.uuid4()}"
                persistence_service.save_message(workflow_id, {
                    "messageId": step_message_id,
                    "type": "task",
                    "content": f"正在执行：{step_content}",
                    "status": "thinking",
                    "data": step_data
                })
                
                # 【新增】保存步骤资源到数据库
                print(f"🔄 准备保存步骤资源: step_{i+1}, workflow_id: {workflow_id}")
                persistence_service.save_resources(workflow_id, f'step_{i+1}', {
                    'content': step_content,
                    'category': category,
                    'resourceType': resource_type,
                    'results': results,
                    'executionDetails': step_info.get('executionDetails', {}),
                    'urls': step_info.get('urls', []),
                    'files': step_info.get('files', []),
                    'stepId': f'step_{i+1}'
                })
                print(f"✅ 步骤资源保存调用完成")
            except Exception as e:
                print(f"保存步骤到数据库失败: {e}")
        
        yield f"data: {json.dumps(step_data)}\n\n"
        
        # 【新增】步骤发送后立即推送资源更新事件
        if workflow_id:
            print(f"🔄 发送资源更新推送: 步骤 {i+1}, 工作流ID: {workflow_id}")
            yield f"data: {json.dumps({'type': 'resource_updated', 'workflowId': workflow_id, 'trigger': 'step_thinking', 'stepNumber': i+1})}\n\n"
        
        # 使用更短的间隔，减少阻塞感
        await asyncio.sleep(0.5)
        
        # 标记步骤完成
        if workflow_id:
            try:
                persistence_service.complete_step(workflow_id, f'step_{i+1}')
                
                # 【新增】保存步骤完成状态到消息
                completion_message_id = f"step_complete_{i+1}_{uuid.uuid4()}"
                persistence_service.save_message(workflow_id, {
                    "messageId": completion_message_id,
                    "type": "result",
                    "content": f"步骤完成：{step_content}",
                    "status": "completed",
                    "data": {"stepId": f'step_{i+1}', "results": results}
                })
                
                # 【新增】步骤完成时推送资源更新事件
                yield f"data: {json.dumps({'type': 'resource_updated', 'workflowId': workflow_id, 'messageId': completion_message_id, 'trigger': 'step_completed'})}\n\n"
            except Exception as e:
                print(f"标记步骤完成失败: {e}")
    
    # 使用通义千问生成分析内容
    try:
        # 构建分析提示词（由AI自定结构与段落数量，不强制5点）
        analysis_prompt = f"""
你是专业的投资顾问。请根据用户问题做“自适应结构”的投资分析：

用户问题：{message}

要求：
- 先判断问题复杂度，动态决定分析层级与段落数量（常见为2-6段）。
- 按需覆盖：问题澄清/关键要点、必要的数据与事实依据、技术面与基本面中与问题高度相关的部分、主要风险、可执行建议。
- 只输出结论与推理，不输出“执行步骤”或“我正在思考”等过程性话语。
- 中文回答，结构清晰，列表和小标题自定，避免模板化重复。
"""
        
        # 调用通义千问API - 添加超时保护
        try:
            ai_response = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(
                    None, 
                    lambda: qwen_analyzer.analyze_text(analysis_prompt, max_tokens=2000)
                ),
                timeout=30.0  # 30秒超时
            )
        except asyncio.TimeoutError:
            print("通义千问分析API超时，使用降级回复 (fallback)")
            ai_response = None
        except Exception as api_error:
            print(f"通义千问分析API调用失败: {api_error}, 将使用fallback")
            ai_response = None
        
        if ai_response and ai_response.strip():
            # 将AI回复分段输出，每段间隔更短
            analysis_parts = ai_response.split('\n\n')
            
            for part in analysis_parts:
                if part.strip():
                    part_content = part.strip()
                    content_data = {'type': 'content', 'content': part_content, 'stepId': 'ai_analysis', 'category': 'result'}
                    
                    # 【新增】实时保存AI分析内容到数据库
                    if workflow_id:
                        try:
                            part_message_id = f"ai_content_{uuid.uuid4()}"
                            persistence_service.save_message(workflow_id, {
                                "messageId": part_message_id,
                                "type": "assistant",
                                "content": part_content,
                                "status": "streaming",
                                "data": content_data
                            })
                            
                            # 【新增】AI内容更新时推送资源更新事件
                            yield f"data: {json.dumps({'type': 'resource_updated', 'workflowId': workflow_id, 'messageId': part_message_id, 'trigger': 'ai_content'})}\n\n"
                        except Exception as e:
                            print(f"保存AI内容到数据库失败: {e}")
                    
                    yield f"data: {json.dumps(content_data)}\n\n"
                    await asyncio.sleep(0.3)  # 减少间隔时间
                else:
                    yield f"data: {json.dumps({'type': 'content', 'content': '', 'stepId': 'ai_analysis'})}\n\n"
                    await asyncio.sleep(0.05)  # 空行间隔很短
        else:
            # 降级回复
            fallback_response = "【AI服务暂不可用，以下为简要建议】\n\n" + generate_fallback_analysis_response(message)
            
            # 【新增】保存降级回复到数据库
            if workflow_id:
                try:
                    fallback_message_id = f"fallback_{uuid.uuid4()}"
                    persistence_service.save_message(workflow_id, {
                        "messageId": fallback_message_id,
                        "type": "assistant",
                        "content": fallback_response,
                        "status": "fallback"
                    })
                except Exception as e:
                    print(f"保存降级回复到数据库失败: {e}")
            
            yield f"data: {json.dumps({'type': 'content', 'content': fallback_response, 'stepId': 'fallback_analysis'})}\n\n"

    except Exception as e:
        print(f"生成分析回复失败: {e}")
        error_msg = "抱歉，分析服务暂时不可用。请稍后重试，或者提供更具体的分析需求。"

        # 【新增】保存错误信息到数据库
        if workflow_id:
            try:
                error_message_id = f"error_{uuid.uuid4()}"
                persistence_service.save_message(workflow_id, {
                    "messageId": error_message_id,
                    "type": "system",
                    "content": error_msg,
                    "status": "error"
                })
            except Exception as e:
                print(f"保存错误信息到数据库失败: {e}")

        yield f"data: {json.dumps({'type': 'content', 'content': error_msg, 'stepId': 'error', 'category': 'error'})}\n\n"

async def generate_strategy_stream(message: str, context: Dict[str, Any], workflow_id: str, persistence_service: WorkflowPersistenceService, ai_message_id: str):
    """生成投资策略的流式响应"""
    
    # 使用AI智能生成策略步骤
    strategy_steps = await generate_smart_strategy_steps(message, context)
    strategy_steps = enrich_steps_with_urls(strategy_steps, message)
    
    category = determine_step_category_from_message(message)
    
    for i, step_info in enumerate(strategy_steps):
        step_context = {
            'step_number': i + 1,
            'user_message': message,
            **(context or {})
        }
        
        # 从AI生成的步骤信息中提取资源类型和结果
        resource_type = step_info.get('resourceType', 'general')
        results = step_info.get('results', [])
        step_content = step_info.get('content', f'执行步骤 {i+1}')
        
        step_data = {
            'type': 'progress', 
            'content': step_content, 
            'step': i+1, 
            'totalSteps': len(strategy_steps), 
            'stepId': f'strategy_step_{i+1}', 
            'category': category,
            'resourceType': resource_type,
            'results': results,
            'executionDetails': step_info.get('executionDetails', {}),
            'urls': step_info.get('urls', []),
            'files': step_info.get('files', [])
        }
        
        # 保存步骤到数据库
        if workflow_id:
            try:
                persistence_service.save_step(workflow_id, {
                    'step_id': f'strategy_step_{i+1}',
                    'step_number': i + 1,
                    'content': step_content,
                    'category': category,
                    'resource_type': resource_type,
                    'status': 'running',
                    'results': results,
                    'execution_details': step_info.get('executionDetails', {}),
                    'urls': step_info.get('urls', []),
                    'files': step_info.get('files', [])
                })
            except Exception as e:
                print(f"保存策略步骤到数据库失败: {e}")
        
        yield f"data: {json.dumps(step_data)}\n\n"
        await asyncio.sleep(0.4)  # 减少延迟
        
        # 标记步骤完成
        if workflow_id:
            try:
                persistence_service.complete_step(workflow_id, f'strategy_step_{i+1}')
            except Exception as e:
                print(f"标记策略步骤完成失败: {e}")
    
    # 使用通义千问生成策略内容
    try:
        # 构建策略提示词
        strategy_prompt = f"""
请作为专业的投资策略顾问，针对用户的需求制定投资策略：

用户需求：{message}

请以“自适应结构”给出策略建议：根据复杂度动态决定段落与要点数量（2-6段皆可）。按需覆盖：策略目标与核心思路、关键操作建议、风险控制要点、预期区间/周期、执行注意事项。不要输出“执行步骤”或过程性叙述，仅给出结论与可执行建议。
"""
        
        # 调用通义千问API - 添加超时保护
        try:
            ai_response = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(
                    None, 
                    lambda: qwen_analyzer.analyze_text(strategy_prompt, max_tokens=2000)
                ),
                timeout=30.0  # 30秒超时
            )
        except asyncio.TimeoutError:
            print("通义千问策略API超时，使用降级回复")
            ai_response = None
        except Exception as api_error:
            print(f"通义千问策略API调用失败: {api_error}")
            ai_response = None
        
        if ai_response and ai_response.strip():
            # 将AI回复分段输出
            strategy_parts = ai_response.split('\n\n')
            
            for part in strategy_parts:
                if part.strip():
                    yield f"data: {json.dumps({'type': 'content', 'content': part.strip(), 'stepId': 'ai_strategy', 'category': 'result'})}\n\n"
                    await asyncio.sleep(0.3)
                else:
                    yield f"data: {json.dumps({'type': 'content', 'content': '', 'stepId': 'ai_strategy'})}\n\n"
                    await asyncio.sleep(0.05)
        else:
            # 降级回复
            fallback_response = "【AI服务暂不可用，以下为降级策略框架】\n\n" + generate_fallback_strategy_response(message)
            yield f"data: {json.dumps({'type': 'content', 'content': fallback_response, 'stepId': 'fallback_strategy'})}\n\n"


    except Exception as e:
        print(f"生成策略回复失败: {e}")
        error_msg = "抱歉，策略服务暂时不可用。请稍后重试，或者提供更具体的策略需求。"

        yield f"data: {json.dumps({'type': 'content', 'content': error_msg, 'stepId': 'error', 'category': 'error'})}\n\n"

async def generate_general_stream(message: str, context: Dict[str, Any], workflow_id: str, persistence_service: WorkflowPersistenceService, ai_message_id: str):
    """生成通用对话的流式响应"""
    
    # 使用AI智能生成通用步骤
    general_steps = await generate_smart_general_steps(message, context)
    general_steps = enrich_steps_with_urls(general_steps, message)
    
    category = determine_step_category_from_message(message)
    
    for i, step_info in enumerate(general_steps):
        step_context = {
            'step_number': i + 1,
            'user_message': message,
            **(context or {})
        }
        
        # 从AI生成的步骤信息中提取资源类型和结果
        resource_type = step_info.get('resourceType', 'general')
        results = step_info.get('results', [])
        step_content = step_info.get('content', f'执行步骤 {i+1}')
        
        step_data = {
            'type': 'progress', 
            'content': step_content, 
            'step': i+1, 
            'totalSteps': len(general_steps), 
            'stepId': f'general_step_{i+1}', 
            'category': category,
            'resourceType': resource_type,
            'results': results,
            'executionDetails': step_info.get('executionDetails', {}),
            'urls': step_info.get('urls', []),
            'files': step_info.get('files', [])
        }
        
        # 保存步骤到数据库
        if workflow_id:
            try:
                persistence_service.save_step(workflow_id, {
                    'step_id': f'general_step_{i+1}',
                    'step_number': i + 1,
                    'content': step_content,
                    'category': category,
                    'resource_type': resource_type,
                    'status': 'running',
                    'results': results,
                    'execution_details': step_info.get('executionDetails', {}),
                    'urls': step_info.get('urls', []),
                    'files': step_info.get('files', [])
                })
            except Exception as e:
                print(f"保存通用步骤到数据库失败: {e}")
        
        yield f"data: {json.dumps(step_data)}\n\n"
        await asyncio.sleep(0.3)  # 减少延迟
        
        # 标记步骤完成
        if workflow_id:
            try:
                persistence_service.complete_step(workflow_id, f'general_step_{i+1}')
            except Exception as e:
                print(f"标记通用步骤完成失败: {e}")
    
    # 使用通义千问生成通用回复 - 添加超时和降级机制
    try:
        # 构建通用对话提示词
        general_prompt = f"""
请作为AI助手，针对用户的问题提供专业、有用的回答：

用户问题：{message}

请提供：
1. 对问题的理解和分析
2. 详细的解答或建议
3. 相关的补充信息
4. 后续可能需要的行动建议

请确保回答准确、有用且易于理解。
"""
        
        # 调用通义千问API - 添加超时保护
        try:
            ai_response = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(
                    None, 
                    lambda: qwen_analyzer.analyze_text(general_prompt, max_tokens=1500)
                ),
                timeout=30.0  # 30秒超时
            )
        except asyncio.TimeoutError:
            print("通义千问API超时，使用降级回复")
            ai_response = None
        except Exception as api_error:
            print(f"通义千问API调用失败: {api_error}")
            ai_response = None
        
        if ai_response and ai_response.strip():
            # 将AI回复分段输出
            general_parts = ai_response.split('\n\n')
            
            for part in general_parts:
                if part.strip():
                    yield f"data: {json.dumps({'type': 'content', 'content': part.strip(), 'stepId': 'ai_general', 'category': 'result'})}\n\n"
                    await asyncio.sleep(0.3)
                else:
                    yield f"data: {json.dumps({'type': 'content', 'content': '', 'stepId': 'ai_general'})}\n\n"
                    await asyncio.sleep(0.05)
        else:
            # 降级回复 - 提供更有用的内容
            fallback_response = generate_fallback_general_response(message)
            yield f"data: {json.dumps({'type': 'content', 'content': fallback_response, 'stepId': 'fallback_general'})}\n\n"
                
    except Exception as e:
        print(f"生成AI回复失败: {e}")
        error_msg = "抱歉，AI分析服务暂时不可用。请稍后重试，或者提供更具体的问题描述。"

        yield f"data: {json.dumps({'type': 'content', 'content': error_msg, 'stepId': 'error', 'category': 'error'})}\n\n"

def generate_fallback_general_response(message: str) -> str:
    """生成降级的通用回复"""
    message_lower = message.lower()
    
    if any(keyword in message_lower for keyword in ['股票', '投资', '基金', '理财']):
        return f"""感谢您关于"{message}"的咨询。

我理解您对投资理财方面的关注，建议您可以：

1. **深入研究**: 查看相关公司的财务报表和行业分析
2. **风险评估**: 了解投资产品的风险等级和自己的风险承受能力  
3. **专业咨询**: 咨询专业的投资顾问获取个性化建议
4. **分散投资**: 不要把所有资金投入单一标的

请注意投资有风险，决策需谨慎。建议在充分了解的基础上做出投资选择。"""
    
    elif any(keyword in message_lower for keyword in ['数据', '分析', '查询']):
        return f"""关于您提到的"{message}"，我来为您提供一些分析思路：

1. **数据收集**: 首先明确需要什么类型的数据
2. **数据验证**: 确保数据的准确性和时效性
3. **分析方法**: 选择合适的分析工具和方法
4. **结果解读**: 正确理解分析结果的含义

如果您需要更具体的帮助，请提供更多详细信息，我将为您提供更精准的建议。"""
    
    else:
        return f"""感谢您的问题："{message}"

我理解您的需求，建议您可以：

1. **明确目标**: 进一步明确您想要解决的具体问题
2. **收集信息**: 查找相关的资料和数据
3. **多方咨询**: 寻求专业人士的意见和建议
4. **实践验证**: 通过实际操作来验证方案的可行性

如果您能提供更多背景信息，我将能够为您提供更有针对性的帮助。"""

# 新增：AI智能步骤生成函数
async def generate_smart_analysis_steps(message: str, context: Dict[str, Any]) -> List[Dict[str, Any]]:
    """使用AI智能生成分析步骤"""
    try:
        # 构建步骤生成提示词
        step_prompt = f"""
作为专业的投资分析AI助手，请根据用户问题的复杂程度，设计合适数量的执行步骤（通常2-6个步骤）：

用户问题：{message}

请分析问题复杂度并决定步骤数量：
- 简单问题（如单一概念解释）：2-3个步骤
- 中等复杂度（如单只股票分析）：3-4个步骤  
- 复杂问题（如行业分析、策略制定）：4-6个步骤

每个步骤必须包含：
1. content: 具体的执行描述（明确说明要做什么，不要用"正在思考"等模糊词汇）
2. resourceType: browser（网络搜索）/database（数据查询）/api（AI分析）/general（通用处理）
3. results: 该步骤的预期产出
4. executionDetails: 执行的技术细节
5. urls: 相关链接（通常为空数组）
6. files: 相关文件（通常为空数组）

请以JSON数组格式返回，根据问题实际需要确定步骤数量：

[
  {{
    "content": "获取股票基础信息和财务数据",
    "resourceType": "database", 
    "results": ["基本信息", "财务指标"],
    "executionDetails": {{"dataSource": "股票数据库", "queryType": "基础数据"}},
    "urls": [],
    "files": []
  }}
]
"""
        
        # 调用AI生成步骤
        ai_response = await asyncio.get_event_loop().run_in_executor(
            None, 
            lambda: qwen_analyzer.analyze_text(step_prompt, max_tokens=1000)
        )
        
        if ai_response:
            try:
                # 尝试解析JSON响应
                import re
                json_match = re.search(r'\[.*\]', ai_response, re.DOTALL)
                if json_match:
                    steps_data = json.loads(json_match.group())
                    return steps_data
            except:
                pass
        
        # 根据用户问题生成更具体的默认分析步骤
        user_msg_lower = message.lower()
        
        # 分析问题复杂度
        def get_complexity_level():
            # 简单问题标识
            simple_indicators = ['是什么', '定义', '解释', '概念', '简单']
            # 复杂问题标识  
            complex_indicators = ['行业', '板块', '比较', '策略', '组合', '深度', '全面', '详细']
            
            if any(indicator in user_msg_lower for indicator in simple_indicators):
                return 'simple'  # 2-3步
            elif any(indicator in user_msg_lower for indicator in complex_indicators):
                return 'complex'  # 4-6步
            else:
                return 'medium'   # 3-4步
        
        complexity = get_complexity_level()
        
        # 检测用户问题类型，生成针对性的步骤
        if any(keyword in user_msg_lower for keyword in ['股票', '代码', '000', '300', '600']):
            # 股票分析类步骤
            if complexity == 'simple':
                # 简单股票查询：2-3步，每步都有实际资源
                return [
                    {
                        "content": f"搜索股票基本信息：{message[:20]}...",
                        "resourceType": "browser",
                        "results": ["股票基本面", "实时价格"],
                        "executionDetails": {"taskType": "股票查询", "complexity": "简单"},
                        "urls": [
                            "https://finance.sina.com.cn",
                            "https://quote.eastmoney.com",
                            "https://xueqiu.com"
                        ],
                        "files": []
                    },
                    {
                        "content": "AI生成简要分析结论并制作图表",
                        "resourceType": "api",
                        "results": ["基础评估", "简要建议", "价格趋势图"],
                        "executionDetails": {"engine": "通义千问", "analysisType": "快速分析"},
                        "urls": [],
                        "files": ["股票价格趋势图.png", "基本面分析报告.pdf"]
                    }
                ]
            elif complexity == 'complex':
                # 深度股票分析：5-6步，每步都有丰富资源
                return [
                    {
                        "content": f"全面搜索股票信息：{message[:20]}...",
                        "resourceType": "browser",
                        "results": ["需求框架", "分析维度"],
                        "executionDetails": {"taskType": "股票深度分析", "complexity": "复杂"},
                        "urls": [
                            "https://finance.sina.com.cn",
                            "https://quote.eastmoney.com", 
                            "https://data.eastmoney.com",
                            "https://xueqiu.com"
                        ],
                        "files": []
                    },
                    {
                        "content": "获取股票基础数据和财务指标",
                        "resourceType": "database",
                        "results": ["基本信息", "财务数据", "历史价格"],
                        "executionDetails": {"dataSource": "股票数据库", "scope": "全面数据"},
                        "urls": [
                            "https://data.eastmoney.com/bbsj/",
                            "https://finance.sina.com.cn/realstock/"
                        ],
                        "files": ["财务数据报表.xlsx"]
                    },
                    {
                        "content": "搜索相关新闻和市场动态",
                        "resourceType": "browser",
                        "results": ["最新新闻", "行业动态", "市场情绪"],
                        "executionDetails": {"source": "财经媒体", "focus": "实时资讯"},
                        "urls": [
                            "https://finance.sina.com.cn/news/",
                            "https://finance.qq.com/",
                            "https://www.21jingji.com/",
                            "https://wallstreetcn.com/"
                        ],
                        "files": ["新闻摘要.pdf"]
                    },
                    {
                        "content": "AI深度技术和基本面分析",
                        "resourceType": "api",
                        "results": ["技术指标", "财务分析", "估值模型"],
                        "executionDetails": {"engine": "通义千问", "analysisType": "深度分析"},
                        "urls": [
                            "https://data.eastmoney.com/zjlx/",
                            "https://finance.sina.com.cn/realstock/company/"
                        ],
                        "files": ["技术分析图表.png", "估值模型.xlsx"]
                    },
                    {
                        "content": "生成详细投资建议报告和可视化图表",
                        "resourceType": "general",
                        "results": ["投资评级", "目标价位", "风险提示", "操作建议", "综合图表"],
                        "executionDetails": {"reportType": "深度分析报告"},
                        "urls": [],
                        "files": ["投资分析报告.pdf", "股价预测图表.png", "风险收益分析图.png"]
                    }
                ]
            else:
                # 中等复杂度：3-4步，适量资源
                return [
                    {
                        "content": f"搜索股票基本信息：{message[:20]}...",
                        "resourceType": "browser",
                        "results": ["需求理解", "分析要点"],
                        "executionDetails": {"taskType": "股票分析", "complexity": "中等"},
                        "urls": [
                            "https://finance.sina.com.cn",
                            "https://quote.eastmoney.com"
                        ],
                        "files": []
                    },
                    {
                        "content": "查询股票基础信息和实时行情数据",
                        "resourceType": "database",
                        "results": ["股票基本面", "实时价格", "成交量"],
                        "executionDetails": {"dataSource": "股票数据库", "queryType": "实时数据"},
                        "urls": [
                            "https://data.eastmoney.com/hsgt/"
                        ],
                        "files": ["实时行情数据.csv"]
                    },
                    {
                        "content": "调用AI引擎进行智能分析",
                        "resourceType": "api",
                        "results": ["技术指标", "趋势分析", "AI评分"],
                        "executionDetails": {"engine": "通义千问", "analysisType": "技术+基本面"},
                        "urls": [],
                        "files": ["分析图表.png"]
                    },
                    {
                        "content": "整合分析数据，生成投资建议报告",
                        "resourceType": "general",
                        "results": ["综合评级", "投资建议", "风险提示", "趋势图表"],
                        "executionDetails": {"reportType": "综合分析报告"},
                        "urls": [],
                        "files": ["投资建议报告.pdf", "价格趋势预测图.png"]
                    }
                ]
        elif any(keyword in user_msg_lower for keyword in ['板块', '行业', '领域']):
            # 行业板块分析步骤（复杂度天然较高）
            if complexity == 'simple':
                # 简单行业概览：2-3步，包含实际资源
                return [
                    {
                        "content": f"搜索行业基本信息：{message[:20]}...",
                        "resourceType": "browser", 
                        "results": ["行业定位", "基本概况"],
                        "executionDetails": {"taskType": "行业概览", "complexity": "简单"},
                        "urls": [
                            "https://finance.sina.com.cn/stock/",
                            "https://data.eastmoney.com/bkzj/",
                            "https://www.cninfo.com.cn/"
                        ],
                        "files": []
                    },
                    {
                        "content": "AI生成行业基础分析和图表",
                        "resourceType": "api",
                        "results": ["行业特点", "基本前景", "行业对比图"],
                        "executionDetails": {"engine": "通义千问", "analysisType": "行业概览"},
                        "urls": [],
                        "files": ["行业概览图表.png", "行业分析报告.pdf"]
                    }
                ]
            else:
                # 中等复杂度以上：4-6步，丰富资源
                steps = [
                    {
                        "content": f"全面搜索行业信息：{message[:20]}...",
                        "resourceType": "browser", 
                        "results": ["行业定位", "分析范围"],
                        "executionDetails": {"taskType": "行业分析", "complexity": complexity},
                        "urls": [
                            "https://finance.sina.com.cn/stock/",
                            "https://data.eastmoney.com/bkzj/",
                            "https://www.cninfo.com.cn/",
                            "https://www.21jingji.com/"
                        ],
                        "files": []
                    },
                    {
                        "content": "搜索行业相关信息和最新动态",
                        "resourceType": "browser",
                        "results": ["行业新闻", "政策动向", "市场热点"],
                        "executionDetails": {"source": "财经网站", "keywords": "行业分析"},
                        "urls": [
                            "https://finance.sina.com.cn/news/",
                            "https://finance.qq.com/",
                            "https://wallstreetcn.com/",
                            "https://www.yicai.com/"
                        ],
                        "files": ["行业新闻摘要.pdf"]
                    },
                    {
                        "content": "获取行业内重点股票数据",
                        "resourceType": "database",
                        "results": ["龙头股票", "行业指数", "板块资金流向"],
                        "executionDetails": {"dataSource": "行业数据库"},
                        "urls": [
                            "https://data.eastmoney.com/bkzj/",
                            "https://finance.sina.com.cn/realstock/company/"
                        ],
                        "files": ["行业股票数据.xlsx", "资金流向图.png"]
                    },
                    {
                        "content": "AI深度分析行业投资价值",
                        "resourceType": "api",
                        "results": ["行业前景", "投资机会", "风险因素", "对比图表"],
                        "executionDetails": {"engine": "通义千问", "focus": "行业投资价值"},
                        "urls": [
                            "https://data.eastmoney.com/zjlx/"
                        ],
                        "files": ["行业分析图表.png", "投资价值评估.pdf"]
                    }
                ]
                
                # 复杂分析增加额外步骤
                if complexity == 'complex':
                    steps.extend([
                        {
                            "content": "分析行业竞争格局和产业链",
                            "resourceType": "database",
                            "results": ["竞争格局", "产业链分析", "供需关系"],
                            "executionDetails": {"dataSource": "产业数据库", "scope": "全产业链"},
                            "urls": [
                                "https://www.chyxx.com/",
                                "https://www.askci.com/"
                            ],
                            "files": ["产业链分析图.png", "竞争格局报告.pdf"]
                        },
                        {
                            "content": "生成行业投资策略和配置建议",
                            "resourceType": "general",
                            "results": ["投资策略", "标的推荐", "配置权重", "时机判断", "策略图表"],
                            "executionDetails": {"reportType": "行业投资策略报告"},
                            "urls": [],
                            "files": ["行业投资策略.pdf", "配置建议图表.png", "投资时机分析图.png"]
                        }
                    ])
                return steps
        elif any(keyword in user_msg_lower for keyword in ['策略', '配置', '组合']):
            # 投资策略制定步骤
            return [
                {
                    "content": f"分析投资需求：{message[:20]}...",
                    "resourceType": "general",
                    "results": ["投资目标", "风险偏好"],
                    "executionDetails": {"taskType": "策略制定"},
                    "urls": [],
                    "files": []
                },
                {
                    "content": "调研市场环境和投资机会",
                    "resourceType": "browser",
                    "results": ["市场趋势", "热点机会", "专家观点"],
                    "executionDetails": {"source": "财经媒体", "focus": "投资机会"},
                    "urls": [
                        "https://finance.sina.com.cn/news/",
                        "https://wallstreetcn.com/",
                        "https://www.yicai.com/"
                    ],
                    "files": []
                },
                {
                    "content": "构建量化分析模型",
                    "resourceType": "api",
                    "results": ["量化指标", "风险评估", "收益预测"],
                    "executionDetails": {"model": "量化分析", "method": "AI建模"},
                    "urls": [],
                    "files": []
                },
                {
                    "content": "制定个性化投资策略方案",
                    "resourceType": "general",
                    "results": ["策略方案", "配置建议", "执行计划"],
                    "executionDetails": {"deliverable": "策略报告"},
                    "urls": [],
                    "files": []
                }
            ]
        else:
            # 通用投资咨询步骤
            return [
                {
                    "content": f"搜索相关投资信息：{message[:20]}...",
                    "resourceType": "browser",
                    "results": ["投资目标", "风险偏好"],
                    "executionDetails": {"taskType": "投资咨询"},
                    "urls": [
                        "https://finance.sina.com.cn/",
                        "https://www.eastmoney.com/",
                        "https://xueqiu.com/"
                    ],
                    "files": []
                },
                {
                    "content": "收集市场信息和专业观点",
                    "resourceType": "browser",
                    "results": ["市场趋势", "投资机会", "专家观点"],
                    "executionDetails": {"source": "财经媒体", "focus": "投资机会"},
                    "urls": [
                        "https://finance.qq.com/",
                        "https://wallstreetcn.com/",
                        "https://www.21jingji.com/",
                        "https://www.yicai.com/"
                    ],
                    "files": ["市场观点摘要.pdf"]
                },
                {
                    "content": "运用AI智能分析引擎",
                    "resourceType": "api",
                    "results": ["智能分析", "专业建议", "风险评估图"],
                    "executionDetails": {"engine": "通义千问"},
                    "urls": [],
                    "files": ["智能分析图表.png"]
                },
                {
                    "content": "提供专业投资咨询答案和可视化报告",
                    "resourceType": "general",
                    "results": ["专业解答", "实用建议", "投资策略图"],
                    "executionDetails": {"deliverable": "咨询报告"},
                    "urls": [],
                    "files": ["投资咨询报告.pdf", "策略建议图表.png", "风险收益分析.png"]
                }
            ]
        
    except Exception as e:
        print(f"AI步骤生成失败: {e}")
        # 返回默认步骤
        return [
            {
                "content": "开始数据分析",
                "resourceType": "general",
                "results": [],
                "executionDetails": {},
                "urls": [],
                "files": []
            }
        ]

async def generate_smart_strategy_steps(message: str, context: Dict[str, Any]) -> List[Dict[str, Any]]:
    """使用AI智能生成策略步骤"""
    try:
        step_prompt = f"""
作为专业的投资策略AI助手，请根据用户需求的复杂程度，设计合适数量的执行步骤（通常2-6个步骤）：

用户需求：{message}

请分析策略复杂度并决定步骤数量：
- 简单策略（如基础配置建议）：2-3个步骤
- 中等复杂度（如投资组合构建）：3-4个步骤  
- 复杂策略（如多资产配置、量化策略）：4-6个步骤

每个步骤必须包含：
1. content: 具体的策略执行描述
2. resourceType: browser（市场调研）/database（数据分析）/api（AI策略生成）/general（策略整合）
3. results: 该步骤的策略产出
4. executionDetails: 策略执行的技术细节

请以JSON数组格式返回，根据策略实际复杂度确定步骤数量：

[
  {{
    "content": "分析市场趋势和投资机会",
    "resourceType": "browser",
    "results": ["市场趋势", "投资机会"],
    "executionDetails": {{"method": "市场调研", "scope": "全市场分析"}},
    "urls": [],
    "files": []
  }}
]
"""
        
        ai_response = await asyncio.get_event_loop().run_in_executor(
            None, 
            lambda: qwen_analyzer.analyze_text(step_prompt, max_tokens=1000)
        )
        
        if ai_response:
            try:
                import re
                json_match = re.search(r'\[.*\]', ai_response, re.DOTALL)
                if json_match:
                    steps_data = json.loads(json_match.group())
                    return steps_data
            except:
                pass
        
        # 根据用户需求生成更具体的默认策略步骤
        user_msg_lower = message.lower()
        
        if any(keyword in user_msg_lower for keyword in ['配置', '组合', '资产']):
            # 资产配置策略
            return [
                {
                    "content": f"分析配置需求：{message[:20]}...",
                    "resourceType": "general",
                    "results": ["配置目标", "约束条件"],
                    "executionDetails": {"strategyType": "资产配置"},
                    "urls": [],
                    "files": []
                },
                {
                    "content": "研究各类资产的历史表现",
                    "resourceType": "database",
                    "results": ["历史收益", "波动性分析", "相关性数据"],
                    "executionDetails": {"dataSource": "资产数据库", "period": "历史数据"},
                    "urls": [],
                    "files": []
                },
                {
                    "content": "运用AI优化配置模型",
                    "resourceType": "api",
                    "results": ["最优权重", "风险收益比", "配置建议"],
                    "executionDetails": {"model": "资产配置模型", "optimizer": "AI算法"},
                    "urls": [],
                    "files": []
                },
                {
                    "content": "制定动态调整策略和监控方案",
                    "resourceType": "general",
                    "results": ["调整规则", "监控指标", "执行时间表"],
                    "executionDetails": {"deliverable": "配置策略方案"},
                    "urls": [],
                    "files": []
                }
            ]
        elif any(keyword in user_msg_lower for keyword in ['量化', '算法', '模型']):
            # 量化策略
            return [
                {
                    "content": f"设计量化策略框架：{message[:20]}...",
                    "resourceType": "general",
                    "results": ["策略逻辑", "参数设置"],
                    "executionDetails": {"strategyType": "量化策略"},
                    "urls": [],
                    "files": []
                },
                {
                    "content": "获取历史数据进行回测",
                    "resourceType": "database",
                    "results": ["价格数据", "指标数据", "回测结果"],
                    "executionDetails": {"dataSource": "量化数据库", "method": "历史回测"},
                    "urls": [],
                    "files": []
                },
                {
                    "content": "AI优化策略参数",
                    "resourceType": "api", 
                    "results": ["最优参数", "绩效评估", "风险指标"],
                    "executionDetails": {"optimizer": "AI参数优化", "method": "机器学习"},
                    "urls": [],
                    "files": []
                },
                {
                    "content": "生成量化策略执行方案",
                    "resourceType": "general",
                    "results": ["交易信号", "风控规则", "实盘建议"],
                    "executionDetails": {"deliverable": "量化策略报告"},
                    "urls": [],
                    "files": []
                }
            ]
        else:
            # 通用投资策略
            return [
                {
                    "content": f"制定投资策略目标：{message[:20]}...",
                    "resourceType": "general",
                    "results": ["投资目标", "风险偏好"],
                    "executionDetails": {"strategyType": "投资策略"},
                    "urls": [],
                    "files": []
                },
                {
                    "content": "研究市场机会和趋势",
                    "resourceType": "browser",
                    "results": ["市场趋势", "投资机会", "专家观点"],
                    "executionDetails": {"source": "投研报告", "focus": "市场机会"},
                    "urls": [
                        "https://finance.qq.com/",
                        "https://wallstreetcn.com/",
                        "https://www.yicai.com/"
                    ],
                    "files": []
                },
                {
                    "content": "AI智能筛选投资标的",
                    "resourceType": "api",
                    "results": ["推荐标的", "评分排名", "投资逻辑"],
                    "executionDetails": {"engine": "AI筛选算法", "criteria": "多因子模型"},
                    "urls": [],
                    "files": []
                },
                {
                    "content": "制定完整投资策略方案",
                    "resourceType": "general",
                    "results": ["策略方案", "仓位管理", "风险控制"],
                    "executionDetails": {"deliverable": "投资策略报告"},
                    "urls": [],
                    "files": []
                }
            ]
        
    except Exception as e:
        print(f"AI策略步骤生成失败: {e}")
        return [
            {
                "content": "开始策略制定",
                "resourceType": "general",
                "results": [],
                "executionDetails": {},
                "urls": [],
                "files": []
            }
        ]

async def generate_smart_general_steps(message: str, context: Dict[str, Any]) -> List[Dict[str, Any]]:
    """使用AI智能生成通用步骤"""
    try:
        step_prompt = f"""
作为智能AI助手，请根据用户问题的复杂程度，设计合适数量的执行步骤（通常2-5个步骤）：

用户问题：{message}

请分析问题复杂度并决定步骤数量：
- 简单问题（如概念解释、基础查询）：2-3个步骤
- 中等复杂度（如操作指导、比较分析）：3-4个步骤  
- 复杂问题（如综合研究、多维分析）：4-5个步骤

每个步骤必须包含：
1. content: 具体的执行描述（说明要做什么具体操作）
2. resourceType: browser（信息搜索）/database（数据查询）/api（AI分析）/general（通用处理）
3. results: 该步骤的预期产出
4. executionDetails: 执行的技术细节

请以JSON数组格式返回，根据问题实际复杂度确定步骤数量。
"""
        
        ai_response = await asyncio.get_event_loop().run_in_executor(
            None, 
            lambda: qwen_analyzer.analyze_text(step_prompt, max_tokens=800)
        )
        
        if ai_response:
            try:
                import re
                json_match = re.search(r'\[.*\]', ai_response, re.DOTALL)
                if json_match:
                    steps_data = json.loads(json_match.group())
                    return steps_data
            except:
                pass
        
        # 根据用户问题生成更具体的默认通用步骤
        user_msg_lower = message.lower()
        
        if any(keyword in user_msg_lower for keyword in ['如何', '怎么', '方法', '步骤']):
            # 操作指导类问题
            return [
                {
                    "content": f"分析操作需求：{message[:25]}...",
                    "resourceType": "general",
                    "results": ["需求理解", "操作框架"],
                    "executionDetails": {"questionType": "操作指导"},
                    "urls": [],
                    "files": []
                },
                {
                    "content": "搜索相关操作指南和最佳实践",
                    "resourceType": "browser",
                    "results": ["操作指南", "实践案例", "专家建议"],
                    "executionDetails": {"source": "专业指南", "focus": "实用方法"},
                    "urls": [],
                    "files": []
                },
                {
                    "content": "AI智能整理操作步骤",
                    "resourceType": "api",
                    "results": ["详细步骤", "注意事项", "风险提示"],
                    "executionDetails": {"engine": "通义千问", "outputType": "操作指南"},
                    "urls": [],
                    "files": []
                }
            ]
        elif any(keyword in user_msg_lower for keyword in ['什么', '定义', '解释', '概念']):
            # 概念解释类问题
            return [
                {
                    "content": f"识别关键概念：{message[:25]}...",
                    "resourceType": "general",
                    "results": ["概念识别", "解释维度"],
                    "executionDetails": {"questionType": "概念解释"},
                    "urls": [],
                    "files": []
                },
                {
                    "content": "查找权威定义和专业解释",
                    "resourceType": "browser",
                    "results": ["权威定义", "专业解释", "实际应用"],
                    "executionDetails": {"source": "专业资料", "focus": "准确定义"},
                    "urls": [],
                    "files": []
                },
                {
                    "content": "AI生成通俗易懂的解释",
                    "resourceType": "api",
                    "results": ["简明解释", "实例说明", "相关知识"],
                    "executionDetails": {"engine": "通义千问", "style": "通俗易懂"},
                    "urls": [],
                    "files": []
                }
            ]
        elif any(keyword in user_msg_lower for keyword in ['比较', '对比', '区别', '选择']):
            # 比较选择类问题
            return [
                {
                    "content": f"明确比较对象：{message[:25]}...",
                    "resourceType": "general",
                    "results": ["比较维度", "评估标准"],
                    "executionDetails": {"questionType": "比较分析"},
                    "urls": [],
                    "files": []
                },
                {
                    "content": "收集各方面的详细信息",
                    "resourceType": "browser",
                    "results": ["详细信息", "客观数据", "用户评价"],
                    "executionDetails": {"source": "多渠道信息", "method": "全面调研"},
                    "urls": [],
                    "files": []
                },
                {
                    "content": "AI智能对比分析和建议",
                    "resourceType": "api",
                    "results": ["对比表格", "优缺点分析", "选择建议"],
                    "executionDetails": {"engine": "通义千问", "outputType": "对比分析"},
                    "urls": [],
                    "files": []
                }
            ]
        else:
            # 通用咨询类问题
            if complexity == 'simple':
                # 简单问题：2步即可
                return [
                    {
                        "content": f"理解问题需求：{message[:25]}...",
                        "resourceType": "general",
                        "results": ["问题分析"],
                        "executionDetails": {"questionType": "简单咨询", "complexity": "简单"},
                        "urls": [],
                        "files": []
                    },
                    {
                        "content": "AI快速生成解答",
                        "resourceType": "api",
                        "results": ["直接解答"],
                        "executionDetails": {"engine": "通义千问", "style": "快速准确"},
                        "urls": [],
                        "files": []
                    }
                ]
            elif complexity == 'complex':
                # 复杂问题：4-5步
                return [
                    {
                        "content": f"深度理解问题背景：{message[:25]}...",
                        "resourceType": "general",
                        "results": ["问题分析", "背景研究", "解答框架"],
                        "executionDetails": {"questionType": "复杂咨询", "complexity": "复杂"},
                        "urls": [],
                        "files": []
                    },
                    {
                        "content": "全面搜索相关知识和资料",
                        "resourceType": "browser",
                        "results": ["权威资料", "最新信息", "多角度观点"],
                        "executionDetails": {"source": "全网搜索", "scope": "多维度信息"},
                        "urls": [],
                        "files": []
                    },
                    {
                        "content": "收集专业数据和案例",
                        "resourceType": "database",
                        "results": ["专业数据", "实际案例", "统计信息"],
                        "executionDetails": {"dataSource": "专业数据库", "focus": "实证支撑"},
                        "urls": [],
                        "files": []
                    },
                    {
                        "content": "AI深度分析和综合整理",
                        "resourceType": "api",
                        "results": ["深度分析", "综合结论", "实用建议"],
                        "executionDetails": {"engine": "通义千问", "analysisType": "深度综合"},
                        "urls": [],
                        "files": []
                    },
                    {
                        "content": "生成详细解答报告",
                        "resourceType": "general",
                        "results": ["完整解答", "延伸思考", "行动建议"],
                        "executionDetails": {"deliverable": "综合解答报告"},
                        "urls": [],
                        "files": []
                    }
                ]
            else:
                # 中等复杂度：3步
                return [
                    {
                        "content": f"理解咨询问题：{message[:25]}...",
                        "resourceType": "general",
                        "results": ["问题分析", "解答方向"],
                        "executionDetails": {"questionType": "通用咨询", "complexity": "中等"},
                        "urls": [],
                        "files": []
                    },
                    {
                        "content": "搜索相关知识和信息",
                        "resourceType": "browser",
                        "results": ["相关知识", "最新信息", "专业观点"],
                        "executionDetails": {"source": "知识库搜索", "scope": "全面信息"},
                        "urls": [],
                        "files": []
                    },
                    {
                        "content": "AI智能生成专业解答",
                        "resourceType": "api",
                        "results": ["专业解答", "实用建议", "延伸知识"],
                        "executionDetails": {"engine": "通义千问", "style": "专业准确"},
                        "urls": [],
                        "files": []
                    }
                ]
        
    except Exception as e:
        print(f"AI通用步骤生成失败: {e}")
        return [
            {
                "content": "开始处理请求",
                "resourceType": "general",
                "results": [],
                "executionDetails": {},
                "urls": [],
                "files": []
            }
        ]

async def generate_ai_response(message: str, context: Dict[str, Any] = None):
    """生成AI回复（保留兼容性）"""
    try:
        # 这里可以集成更复杂的AI对话逻辑
        if "工作流结果" in message:
            return "基于工作流分析结果，我为您生成了详细的投资建议报告。"
        else:
            return f"我理解您的问题：{message}。让我为您分析一下相关的投资机会。"
    except Exception as e:
        return "抱歉，AI服务暂时不可用，请稍后重试。"

async def generate_investment_strategies(request: StrategyGenerationRequest):
    """生成投资策略"""
    strategies = []
    
    if request.riskTolerance == "low":
        strategies.append({
            "name": "稳健价值投资策略",
            "description": "专注于低估值、高分红的蓝筹股",
            "expectedReturn": "8-12%",
            "riskLevel": "low",
            "stocks": ["000001", "600036", "000002"],
            "allocation": {"000001": 0.4, "600036": 0.3, "000002": 0.3}
        })
    elif request.riskTolerance == "high":
        strategies.append({
            "name": "成长股投资策略",
            "description": "关注高成长性的科技和新兴行业股票",
            "expectedReturn": "15-25%",
            "riskLevel": "high",
            "stocks": ["000858", "002415", "300059"],
            "allocation": {"000858": 0.4, "002415": 0.3, "300059": 0.3}
        })
    else:
        strategies.append({
            "name": "均衡投资策略",
            "description": "平衡成长性和稳定性",
            "expectedReturn": "10-18%",
            "riskLevel": "medium",
            "stocks": ["000001", "000858", "600036"],
            "allocation": {"000001": 0.3, "000858": 0.4, "600036": 0.3}
        })
    
    return strategies

def enhance_message_with_context(message: str, context: Dict[str, Any]) -> str:
    """使用上下文信息增强消息"""
    enhanced_message = message
    
    # 处理对话历史
    if context.get("conversationHistory"):
        conversation_history = context["conversationHistory"]
        
        # 提取之前的用户查询
        previous_queries = [
            msg["content"] for msg in conversation_history 
            if msg.get("type") == "user" and msg.get("content") != message
        ]
        
        if previous_queries:
            # 如果当前消息很短或者是继续性的问题，结合之前的查询
            if len(message) < 10 or any(word in message.lower() for word in ['继续', '还有', '其他', '详细', '更多']):
                last_query = previous_queries[-1] if previous_queries else ""
                enhanced_message = f"基于之前的查询'{last_query}'，用户现在问：{message}"
                print(f"检测到继续性对话，增强消息: {enhanced_message}")
            
            # 如果是相关的投资问题，添加上下文
            elif any(word in message.lower() for word in ['推荐', '分析', '建议', '股票', '投资']):
                recent_topics = extract_topics_from_queries(previous_queries)
                if recent_topics:
                    enhanced_message = f"{message}。上下文：用户之前询问过{', '.join(recent_topics[:2])}相关问题"
                    print(f"添加投资话题上下文: {enhanced_message}")
    
    # 处理之前的查询摘要
    if context.get("previousQueries"):
        previous_queries = context["previousQueries"]
        if previous_queries and len(message) < 15:
            # 对于简短的消息，添加更多上下文
            enhanced_message = f"{message}。参考之前的查询：{previous_queries[-1]}"
            print(f"为简短消息添加查询上下文: {enhanced_message}")
    
    # 处理用户偏好
    if context.get("userPreferences"):
        preferences = context["userPreferences"]
        risk_tolerance = preferences.get("riskTolerance", "medium")
        trading_experience = preferences.get("tradingExperience", "intermediate")
        
        # 为投资相关查询添加用户偏好信息
        if any(word in message.lower() for word in ['推荐', '建议', '选择', '投资']):
            enhanced_message = f"{enhanced_message}。用户风险偏好：{risk_tolerance}，交易经验：{trading_experience}"
            print(f"添加用户偏好上下文: 风险偏好={risk_tolerance}, 经验={trading_experience}")
    
    return enhanced_message

def extract_topics_from_queries(queries: List[str]) -> List[str]:
    """从查询中提取投资话题"""
    topics = []
    
    # 常见的投资话题关键词
    topic_keywords = {
        "科技股": ["科技", "技术", "互联网", "软件", "芯片", "AI", "人工智能"],
        "金融股": ["银行", "保险", "证券", "金融"],
        "医药股": ["医药", "医疗", "生物", "制药"],
        "新能源": ["新能源", "电动车", "光伏", "风电", "锂电池"],
        "消费股": ["消费", "零售", "食品", "饮料"],
        "房地产": ["房地产", "地产", "房产"],
        "价值投资": ["价值", "低估值", "分红", "蓝筹"],
        "成长投资": ["成长", "高成长", "增长"],
        "低风险投资": ["低风险", "稳健", "保守", "安全"]
    }
    
    for query in queries:
        query_lower = query.lower()
        for topic, keywords in topic_keywords.items():
            if any(keyword in query_lower for keyword in keywords):
                if topic not in topics:
                    topics.append(topic)
                break
    
    return topics

async def generate_market_insights():
    """生成市场洞察"""
    return {
        "insights": [
            {
                "title": "科技股投资机会",
                "content": "当前科技股估值合理，政策支持力度加大",
                "type": "bullish",
                "confidence": 0.75,
                "timestamp": datetime.now().isoformat()
            },
            {
                "title": "新能源板块前景",
                "content": "新能源政策持续利好，长期投资价值显著",
                "type": "bullish",
                "confidence": 0.8,
                "timestamp": datetime.now().isoformat()
            },
            {
                "title": "金融股稳健表现",
                "content": "银行股估值偏低，分红收益稳定",
                "type": "neutral",
                "confidence": 0.65,
                "timestamp": datetime.now().isoformat()
            }
        ],
        "marketSummary": {
            "trend": "震荡上行",
            "sentiment": "谨慎乐观",
            "volatility": "中等",
            "keyFactors": ["政策支持", "业绩改善", "资金流入", "估值修复"]
        }
    }

# 新增工作流画布相关辅助函数

def initialize_node_statuses(nodes: List[Dict[str, Any]]) -> Dict[str, Any]:
    """初始化节点状态"""
    node_statuses = {}
    
    for node in nodes:
        node_statuses[node["id"]] = {
            "id": node["id"],
            "name": node["name"],
            "type": node["type"],
            "status": "idle",
            "progress": 0,
            "start_time": None,
            "end_time": None,
            "result": None,
            "error": None
        }
    
    return node_statuses

def validate_workflow_definition_internal(workflow_definition: Dict[str, Any]) -> Dict[str, Any]:
    """内部工作流定义验证函数"""
    errors = []
    warnings = []
    
    try:
        # 基本验证
        if not workflow_definition.get("name"):
            errors.append("工作流名称不能为空")
        
        nodes = workflow_definition.get("nodes", [])
        connections = workflow_definition.get("connections", [])
        
        if not nodes:
            errors.append("工作流必须包含至少一个节点")
        
        # 节点验证
        node_ids = set()
        for node in nodes:
            if not node.get("id"):
                errors.append("节点必须有唯一ID")
                continue
            
            if node["id"] in node_ids:
                errors.append(f"节点ID重复: {node['id']}")
            node_ids.add(node["id"])
            
            if not node.get("type"):
                errors.append(f"节点{node['id']}缺少类型定义")
            
            if not node.get("name"):
                errors.append(f"节点{node['id']}缺少名称")
        
        # 连接验证
        for connection in connections:
            if not connection.get("sourceId") or not connection.get("targetId"):
                errors.append("连接必须指定源节点和目标节点")
                continue
            
            if connection["sourceId"] not in node_ids:
                errors.append(f"连接引用了不存在的源节点: {connection['sourceId']}")
            
            if connection["targetId"] not in node_ids:
                errors.append(f"连接引用了不存在的目标节点: {connection['targetId']}")
        
        # 循环依赖检查
        if has_cyclic_dependency(nodes, connections):
            errors.append("工作流存在循环依赖")
        
        # 警告检查
        if len(nodes) > 10:
            warnings.append("工作流节点数量较多，可能影响执行性能")
        
        isolated_nodes = find_isolated_nodes(nodes, connections)
        if isolated_nodes:
            warnings.append(f"发现孤立节点: {', '.join(isolated_nodes)}")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
        
    except Exception as e:
        return {
            "valid": False,
            "errors": [f"验证过程中发生错误: {str(e)}"],
            "warnings": []
        }

def has_cyclic_dependency(nodes: List[Dict[str, Any]], connections: List[Dict[str, Any]]) -> bool:
    """检查是否存在循环依赖"""
    try:
        # 构建邻接表
        graph = {}
        for node in nodes:
            graph[node["id"]] = []
        
        for connection in connections:
            source_id = connection.get("sourceId")
            target_id = connection.get("targetId")
            if source_id and target_id and source_id in graph:
                graph[source_id].append(target_id)
        
        # DFS检查循环
        visited = set()
        recursion_stack = set()
        
        def has_cycle(node_id: str) -> bool:
            visited.add(node_id)
            recursion_stack.add(node_id)
            
            for neighbor in graph.get(node_id, []):
                if neighbor not in visited:
                    if has_cycle(neighbor):
                        return True
                elif neighbor in recursion_stack:
                    return True
            
            recursion_stack.remove(node_id)
            return False
        
        for node_id in graph:
            if node_id not in visited:
                if has_cycle(node_id):
                    return True
        
        return False
        
    except Exception as e:
        print(f"循环依赖检查失败: {e}")
        return False

def find_isolated_nodes(nodes: List[Dict[str, Any]], connections: List[Dict[str, Any]]) -> List[str]:
    """查找孤立节点（没有连接的节点）"""
    try:
        connected_nodes = set()
        
        for connection in connections:
            source_id = connection.get("sourceId")
            target_id = connection.get("targetId")
            if source_id:
                connected_nodes.add(source_id)
            if target_id:
                connected_nodes.add(target_id)
        
        isolated_nodes = []
        for node in nodes:
            if node["id"] not in connected_nodes:
                isolated_nodes.append(node["id"])
        
        return isolated_nodes
        
    except Exception as e:
        print(f"查找孤立节点失败: {e}")
        return []

async def execute_workflow_definition(execution_id: str, workflow_definition: Dict[str, Any], context: Dict[str, Any]):
    """执行工作流定义"""
    try:
        execution = workflow_execution_storage[execution_id]
        nodes = workflow_definition.get("nodes", [])
        connections = workflow_definition.get("connections", [])
        
        # 计算节点执行顺序（拓扑排序）
        execution_order = calculate_execution_order(nodes, connections)
        
        print(f"开始执行工作流定义: {execution_id}, 节点执行顺序: {execution_order}")
        
        # 按顺序执行节点
        for i, node_id in enumerate(execution_order):
            node = next((n for n in nodes if n["id"] == node_id), None)
            if not node:
                continue
            
            # 更新当前执行节点
            execution["current_node"] = node_id
            execution["progress"] = int((i / len(execution_order)) * 90)  # 留10%给最终处理
            
            # 更新节点状态为运行中
            await update_node_status(execution_id, node_id, "running", 0, f"正在执行{node['name']}...")
            
            # 执行节点
            node_result = await execute_single_node(node, execution, context)
            
            # 更新节点状态为完成
            if node_result.get("success", True):
                await update_node_status(execution_id, node_id, "completed", 100, f"{node['name']}执行完成")
                execution["node_statuses"][node_id]["result"] = node_result
            else:
                await update_node_status(execution_id, node_id, "error", 0, f"{node['name']}执行失败: {node_result.get('error', '未知错误')}")
                execution["node_statuses"][node_id]["error"] = node_result.get("error")
                # 如果节点执行失败，停止整个工作流
                execution["status"] = "error"
                execution["message"] = f"节点{node['name']}执行失败"
                return
            
            # 模拟执行时间
            await asyncio.sleep(1)
        
        # 生成最终结果
        final_results = await generate_workflow_final_results(execution_id, workflow_definition, execution)
        
        # 完成工作流执行
        execution["status"] = "completed"
        execution["progress"] = 100
        execution["end_time"] = datetime.now().isoformat()
        execution["results"] = final_results
        execution["message"] = "工作流执行完成"
        
        print(f"工作流定义执行完成: {execution_id}")
        
    except Exception as e:
        print(f"工作流定义执行失败: {execution_id}, 错误: {e}")
        execution = workflow_execution_storage.get(execution_id)
        if execution:
            execution["status"] = "error"
            execution["message"] = str(e)
            execution["end_time"] = datetime.now().isoformat()

def calculate_execution_order(nodes: List[Dict[str, Any]], connections: List[Dict[str, Any]]) -> List[str]:
    """计算节点执行顺序（拓扑排序）"""
    try:
        # 构建依赖图
        in_degree = {}
        graph = {}
        
        # 初始化
        for node in nodes:
            node_id = node["id"]
            in_degree[node_id] = 0
            graph[node_id] = []
        
        # 构建图和计算入度
        for connection in connections:
            source_id = connection.get("sourceId")
            target_id = connection.get("targetId")
            if source_id and target_id:
                graph[source_id].append(target_id)
                in_degree[target_id] += 1
        
        # 拓扑排序
        queue = [node_id for node_id, degree in in_degree.items() if degree == 0]
        result = []
        
        while queue:
            current = queue.pop(0)
            result.append(current)
            
            for neighbor in graph[current]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
        
        # 如果结果长度不等于节点数量，说明存在循环依赖
        if len(result) != len(nodes):
            print("警告: 检测到循环依赖，使用节点定义顺序")
            return [node["id"] for node in nodes]
        
        return result
        
    except Exception as e:
        print(f"计算执行顺序失败: {e}")
        # 降级方案：按节点定义顺序执行
        return [node["id"] for node in nodes]

async def update_node_status(execution_id: str, node_id: str, status: str, progress: int, message: str):
    """更新节点状态"""
    execution = workflow_execution_storage.get(execution_id)
    if execution and node_id in execution["node_statuses"]:
        node_status = execution["node_statuses"][node_id]
        node_status["status"] = status
        node_status["progress"] = progress
        node_status["message"] = message
        
        if status == "running":
            node_status["start_time"] = datetime.now().isoformat()
        elif status in ["completed", "error"]:
            node_status["end_time"] = datetime.now().isoformat()

async def execute_single_node(node: Dict[str, Any], execution: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """执行单个节点"""
    try:
        node_type = node.get("type")
        node_config = node.get("config", {})
        
        print(f"执行节点: {node['id']} ({node_type})")
        
        if node_type == "data":
            return await execute_data_node(node, node_config, context)
        elif node_type == "analysis":
            return await execute_analysis_node(node, node_config, context)
        elif node_type == "strategy":
            return await execute_strategy_node(node, node_config, context)
        elif node_type == "risk":
            return await execute_risk_node(node, node_config, context)
        elif node_type == "output":
            return await execute_output_node(node, node_config, context)
        else:
            return await execute_custom_node(node, node_config, context)
            
    except Exception as e:
        print(f"执行节点失败: {node['id']}, 错误: {e}")
        return {
            "success": False,
            "error": str(e),
            "node_id": node["id"]
        }

async def execute_data_node(node: Dict[str, Any], config: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """执行数据收集节点"""
    try:
        data_sources = config.get("dataSources", ["stock_price"])
        time_range = config.get("timeRange", "1y")
        symbols = config.get("symbols", [])
        
        # 模拟数据收集
        await asyncio.sleep(1)
        
        collected_data = {
            "sources": data_sources,
            "timeRange": time_range,
            "symbols": symbols,
            "recordCount": len(symbols) * 252 if symbols else 1000,
            "collectedAt": datetime.now().isoformat()
        }
        
        return {
            "success": True,
            "data": collected_data,
            "message": f"成功收集{len(data_sources)}个数据源的数据"
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

async def execute_analysis_node(node: Dict[str, Any], config: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """执行分析节点"""
    try:
        indicators = config.get("indicators", ["RSI", "MACD"])
        period = config.get("period", 20)
        
        # 模拟分析处理
        await asyncio.sleep(1.5)
        
        analysis_result = {
            "indicators": indicators,
            "period": period,
            "signals": {
                "bullish": len(indicators) * 2,
                "bearish": len(indicators),
                "neutral": len(indicators) * 3
            },
            "confidence": 0.75,
            "analyzedAt": datetime.now().isoformat()
        }
        
        return {
            "success": True,
            "data": analysis_result,
            "message": f"完成{len(indicators)}个指标的分析"
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

async def execute_strategy_node(node: Dict[str, Any], config: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """执行策略生成节点"""
    try:
        strategy_type = config.get("strategyType", "momentum")
        risk_level = config.get("riskLevel", "medium")
        time_horizon = config.get("timeHorizon", "medium_term")
        
        # 模拟策略生成
        await asyncio.sleep(2)
        
        strategy_result = {
            "strategyType": strategy_type,
            "riskLevel": risk_level,
            "timeHorizon": time_horizon,
            "recommendations": [
                {
                    "action": "buy",
                    "symbol": "AAPL",
                    "weight": 0.3,
                    "confidence": 0.8
                },
                {
                    "action": "hold",
                    "symbol": "MSFT",
                    "weight": 0.4,
                    "confidence": 0.7
                }
            ],
            "expectedReturn": "12-18%",
            "generatedAt": datetime.now().isoformat()
        }
        
        return {
            "success": True,
            "data": strategy_result,
            "message": f"生成{strategy_type}策略，包含{len(strategy_result['recommendations'])}个建议"
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

async def execute_risk_node(node: Dict[str, Any], config: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """执行风险评估节点"""
    try:
        risk_metrics = config.get("riskMetrics", ["VaR", "Sharpe"])
        backtest_period = config.get("backtestPeriod", "2y")
        
        # 模拟风险评估
        await asyncio.sleep(1.5)
        
        risk_result = {
            "metrics": risk_metrics,
            "backtestPeriod": backtest_period,
            "riskAssessment": {
                "VaR": 0.05,
                "Sharpe": 1.2,
                "MaxDrawdown": 0.15,
                "Volatility": 0.18
            },
            "riskLevel": "medium",
            "assessedAt": datetime.now().isoformat()
        }
        
        return {
            "success": True,
            "data": risk_result,
            "message": f"完成{len(risk_metrics)}个风险指标的评估"
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

async def execute_output_node(node: Dict[str, Any], config: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """执行输出节点"""
    try:
        output_format = config.get("outputFormat", "detailed_report")
        include_charts = config.get("includeCharts", True)
        
        # 模拟报告生成
        await asyncio.sleep(1)
        
        output_result = {
            "format": output_format,
            "includeCharts": include_charts,
            "report": {
                "title": "AI工作流分析报告",
                "summary": "基于多节点分析生成的投资建议报告",
                "sections": ["市场分析", "策略建议", "风险评估", "执行建议"],
                "generatedAt": datetime.now().isoformat()
            }
        }
        
        return {
            "success": True,
            "data": output_result,
            "message": f"生成{output_format}格式的分析报告"
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

async def execute_custom_node(node: Dict[str, Any], config: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """执行自定义节点"""
    try:
        # 模拟自定义节点处理
        await asyncio.sleep(1)
        
        custom_result = {
            "nodeId": node["id"],
            "nodeName": node["name"],
            "config": config,
            "processedAt": datetime.now().isoformat()
        }
        
        return {
            "success": True,
            "data": custom_result,
            "message": f"完成自定义节点{node['name']}的处理"
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

async def generate_workflow_final_results(execution_id: str, workflow_definition: Dict[str, Any], execution: Dict[str, Any]) -> Dict[str, Any]:
    """生成工作流最终结果"""
    try:
        workflow_name = workflow_definition.get("name", "未命名工作流")
        nodes = workflow_definition.get("nodes", [])
        node_statuses = execution.get("node_statuses", {})
        
        # 收集所有节点的结果
        node_results = {}
        for node_id, status in node_statuses.items():
            if status.get("result"):
                node_results[node_id] = status["result"]
        
        # 生成综合分析结果
        final_results = {
            "workflowName": workflow_name,
            "executionId": execution_id,
            "executionSummary": {
                "totalNodes": len(nodes),
                "completedNodes": len([s for s in node_statuses.values() if s["status"] == "completed"]),
                "failedNodes": len([s for s in node_statuses.values() if s["status"] == "error"]),
                "executionTime": calculate_execution_time(execution)
            },
            "nodeResults": node_results,
            "recommendations": extract_recommendations_from_results(node_results),
            "riskAssessment": extract_risk_assessment_from_results(node_results),
            "marketInsights": extract_market_insights_from_results(node_results),
            "generatedAt": datetime.now().isoformat()
        }
        
        return final_results
        
    except Exception as e:
        print(f"生成最终结果失败: {e}")
        return {
            "workflowName": workflow_definition.get("name", "未命名工作流"),
            "executionId": execution_id,
            "error": str(e),
            "generatedAt": datetime.now().isoformat()
        }

def calculate_execution_time(execution: Dict[str, Any]) -> str:
    """计算执行时间"""
    try:
        start_time = execution.get("start_time")
        end_time = execution.get("end_time")
        
        if start_time and end_time:
            start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
            duration = end_dt - start_dt
            return f"{duration.total_seconds():.1f}秒"
        else:
            return "计算中..."
            
    except Exception as e:
        print(f"计算执行时间失败: {e}")
        return "未知"

def extract_recommendations_from_results(node_results: Dict[str, Any]) -> List[Dict[str, Any]]:
    """从节点结果中提取推荐"""
    recommendations = []
    
    try:
        for node_id, result in node_results.items():
            if result.get("success") and result.get("data"):
                data = result["data"]
                
                # 从策略节点提取推荐
                if "recommendations" in data:
                    recommendations.extend(data["recommendations"])
                
                # 从分析节点提取信号
                elif "signals" in data:
                    signals = data["signals"]
                    if signals.get("bullish", 0) > signals.get("bearish", 0):
                        recommendations.append({
                            "type": "market_signal",
                            "action": "积极关注",
                            "reason": "技术指标显示积极信号",
                            "confidence": data.get("confidence", 0.5)
                        })
        
        # 如果没有具体推荐，生成通用建议
        if not recommendations:
            recommendations.append({
                "type": "general",
                "action": "持续关注",
                "reason": "基于工作流分析结果",
                "confidence": 0.6
            })
        
        return recommendations[:5]  # 最多返回5个推荐
        
    except Exception as e:
        print(f"提取推荐失败: {e}")
        return []

def extract_risk_assessment_from_results(node_results: Dict[str, Any]) -> Dict[str, Any]:
    """从节点结果中提取风险评估"""
    try:
        for node_id, result in node_results.items():
            if result.get("success") and result.get("data"):
                data = result["data"]
                
                # 从风险节点提取风险评估
                if "riskAssessment" in data:
                    return {
                        "overallRisk": data.get("riskLevel", "medium"),
                        "metrics": data["riskAssessment"],
                        "assessment": "基于量化风险模型评估"
                    }
        
        # 默认风险评估
        return {
            "overallRisk": "medium",
            "metrics": {"VaR": 0.05, "Sharpe": 1.0},
            "assessment": "基于工作流综合评估"
        }
        
    except Exception as e:
        print(f"提取风险评估失败: {e}")
        return {"overallRisk": "unknown", "assessment": "风险评估不可用"}

def extract_market_insights_from_results(node_results: Dict[str, Any]) -> List[str]:
    """从节点结果中提取市场洞察"""
    insights = []
    
    try:
        for node_id, result in node_results.items():
            if result.get("success") and result.get("data"):
                data = result["data"]
                
                # 从分析节点提取洞察
                if "signals" in data:
                    signals = data["signals"]
                    total_signals = sum(signals.values())
                    if total_signals > 0:
                        bullish_pct = signals.get("bullish", 0) / total_signals * 100
                        if bullish_pct > 50:
                            insights.append(f"技术指标显示{bullish_pct:.0f}%的积极信号")
                        elif bullish_pct < 30:
                            insights.append(f"技术指标显示谨慎信号，建议观望")
                
                # 从策略节点提取洞察
                elif "expectedReturn" in data:
                    insights.append(f"预期收益率: {data['expectedReturn']}")
        
        # 如果没有具体洞察，添加通用洞察
        if not insights:
            insights.append("市场处于正常波动范围内")
            insights.append("建议保持多元化投资策略")
        
        return insights[:3]  # 最多返回3个洞察
        
    except Exception as e:
        print(f"提取市场洞察失败: {e}")
        return ["市场分析暂时不可用"]

def generate_fallback_analysis_response(message: str) -> str:
    """生成降级的分析回复"""
    return f"""基于您的问题 "{message}"，我为您提供以下简要建议：

## 📊 分析思路

**1. 基本面分析**
- 查看公司财务报表和经营状况
- 了解行业发展趋势和竞争格局  
- 关注宏观经济环境影响

**2. 技术面分析**
- 观察价格走势和成交量变化
- 分析关键技术指标信号
- 识别支撑阻力位置

**3. 风险评估**
- 评估市场风险和个股风险
- 考虑政策风险和行业风险
- 制定风险控制策略

**4. 投资建议**
- 根据风险承受能力选择投资策略
- 建议适当分散投资降低风险
- 设置合理的止盈止损点位

💡 **温馨提示**: 投资有风险，建议您结合自身情况和更多信息做出谨慎决策。"""

def generate_fallback_strategy_response(message: str) -> str:
    """生成降级的策略回复"""
    return f"""针对您的策略需求 "{message}"，我为您提供以下建议框架：

## 🎯 策略制定指南

**1. 目标设定**
- 明确投资目标和预期收益
- 设定可接受的风险水平
- 确定投资时间周期

**2. 资产配置**
- 股票、债券、基金等的比例配置
- 行业板块的分散配置
- 根据市场情况动态调整

**3. 操作策略**
- 选择合适的买入时机
- 制定分批建仓计划
- 设置止盈止损规则

**4. 风险管理**
- 控制单只股票的仓位比例
- 设置最大损失容忍度
- 定期评估和调整策略

**5. 执行纪律**
- 严格按照策略执行
- 避免情绪化交易
- 定期总结和优化

📈 **建议**: 任何投资策略都需要根据市场变化和个人情况及时调整。"""