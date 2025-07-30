from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import asyncio
import uuid
from datetime import datetime
import json
import logging

from services.qwen_analyzer import QwenAnalyzer
from services.stock_recommender import StockRecommender
from services.smart_stock_service import SmartStockService
from services.database_service import DatabaseService
from utils.helpers import clean_text

router = APIRouter(prefix="/api/v1", tags=["AI Workflow"])

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