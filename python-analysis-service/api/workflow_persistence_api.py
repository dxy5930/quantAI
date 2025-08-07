from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import uuid

from models.database import get_db
from models.workflow_models import (
    WorkflowInstance, WorkflowStep, WorkflowResource, WorkflowMessage,
    WorkflowStatus, StepStatus, StepCategory, ResourceTypeEnum, 
    WorkflowResourceType, MessageType
)

router = APIRouter(prefix="/api/v1", tags=["workflow-persistence"])

# Pydantic模型用于API响应
from pydantic import BaseModel

class WorkflowCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    user_id: Optional[str] = None

class WorkflowUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    progress_percentage: Optional[float] = None
    current_step: Optional[int] = None
    total_steps: Optional[int] = None
    context_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

class StepCreateRequest(BaseModel):
    step_number: int
    step_id: str
    content: str
    category: Optional[str] = 'general'
    resource_type: Optional[str] = 'general'
    execution_details: Optional[Dict[str, Any]] = None
    results: Optional[List[Any]] = None
    urls: Optional[List[str]] = None
    files: Optional[List[str]] = None

class StepUpdateRequest(BaseModel):
    content: Optional[str] = None
    status: Optional[str] = None
    execution_details: Optional[Dict[str, Any]] = None
    results: Optional[List[Any]] = None
    urls: Optional[List[str]] = None
    files: Optional[List[str]] = None
    error_message: Optional[str] = None

class MessageCreateRequest(BaseModel):
    message_id: str
    message_type: str
    content: str
    status: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

# 工作流实例管理
@router.post("/workflows")
async def create_workflow(request: WorkflowCreateRequest, db: Session = Depends(get_db)):
    """创建新的工作流实例"""
    try:
        workflow = WorkflowInstance(
            id=str(uuid.uuid4()),
            title=request.title,
            description=request.description,
            user_id=request.user_id,
            status=WorkflowStatus.RUNNING
        )
        
        db.add(workflow)
        db.commit()
        db.refresh(workflow)
        
        return {
            "id": workflow.id,
            "title": workflow.title,
            "description": workflow.description,
            "status": workflow.status.value,
            "created_at": workflow.created_at.isoformat()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"创建工作流失败: {str(e)}")

@router.get("/workflows")
async def get_workflows(
    user_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """获取工作流列表"""
    try:
        query = db.query(WorkflowInstance).filter(WorkflowInstance.is_deleted == 0)  # 只查询未删除的
        
        if user_id:
            query = query.filter(WorkflowInstance.user_id == user_id)
        if status:
            query = query.filter(WorkflowInstance.status == status)
        
        workflows = query.order_by(desc(WorkflowInstance.last_activity)).offset(offset).limit(limit).all()
        
        return [{
            "id": w.id,
            "title": w.title,
            "description": w.description,
            "status": w.status.value,
            "progress_percentage": float(w.progress_percentage),
            "current_step": w.current_step,
            "total_steps": w.total_steps,
            "start_time": w.start_time.isoformat(),
            "last_activity": w.last_activity.isoformat(),
            "created_at": w.created_at.isoformat()
        } for w in workflows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取工作流列表失败: {str(e)}")

@router.get("/workflows/{workflow_id}")
async def get_workflow(workflow_id: str, db: Session = Depends(get_db)):
    """获取单个工作流详情"""
    try:
        workflow = db.query(WorkflowInstance).filter(WorkflowInstance.id == workflow_id).first()
        if not workflow:
            raise HTTPException(status_code=404, detail="工作流不存在")
        
        return {
            "id": workflow.id,
            "title": workflow.title,
            "description": workflow.description,
            "status": workflow.status.value,
            "progress_percentage": float(workflow.progress_percentage),
            "current_step": workflow.current_step,
            "total_steps": workflow.total_steps,
            "start_time": workflow.start_time.isoformat(),
            "end_time": workflow.end_time.isoformat() if workflow.end_time else None,
            "last_activity": workflow.last_activity.isoformat(),
            "context_data": workflow.context_data,
            "error_message": workflow.error_message,
            "created_at": workflow.created_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取工作流详情失败: {str(e)}")

@router.put("/workflows/{workflow_id}")
async def update_workflow(workflow_id: str, request: WorkflowUpdateRequest, db: Session = Depends(get_db)):
    """更新工作流信息"""
    try:
        workflow = db.query(WorkflowInstance).filter(WorkflowInstance.id == workflow_id).first()
        if not workflow:
            raise HTTPException(status_code=404, detail="工作流不存在")
        
        if request.title is not None:
            workflow.title = request.title
        if request.description is not None:
            workflow.description = request.description
        if request.status is not None:
            workflow.status = WorkflowStatus(request.status)
            if request.status == 'completed':
                workflow.end_time = datetime.utcnow()
        if request.progress_percentage is not None:
            workflow.progress_percentage = request.progress_percentage
        if request.current_step is not None:
            workflow.current_step = request.current_step
        if request.total_steps is not None:
            workflow.total_steps = request.total_steps
        if request.context_data is not None:
            workflow.context_data = request.context_data
        if request.error_message is not None:
            workflow.error_message = request.error_message
        
        workflow.last_activity = datetime.utcnow()
        
        db.commit()
        db.refresh(workflow)
        
        return {"message": "工作流更新成功"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"更新工作流失败: {str(e)}")

# 工作流步骤管理
@router.post("/workflows/{workflow_id}/steps")
async def create_step(workflow_id: str, request: StepCreateRequest, db: Session = Depends(get_db)):
    """为工作流添加步骤"""
    try:
        # 检查工作流是否存在
        workflow = db.query(WorkflowInstance).filter(WorkflowInstance.id == workflow_id).first()
        if not workflow:
            raise HTTPException(status_code=404, detail="工作流不存在")
        
        step = WorkflowStep(
            id=str(uuid.uuid4()),
            workflow_id=workflow_id,
            step_number=request.step_number,
            step_id=request.step_id,
            content=request.content,
            category=StepCategory(request.category),
            resource_type=ResourceTypeEnum(request.resource_type),
            status=StepStatus.PENDING,
            execution_details=request.execution_details,
            results=request.results,
            urls=request.urls,
            files=request.files,
            start_time=datetime.utcnow()
        )
        
        db.add(step)
        
        # 更新工作流进度
        workflow.total_steps = max(workflow.total_steps, request.step_number)
        workflow.last_activity = datetime.utcnow()
        
        db.commit()
        db.refresh(step)
        
        return {
            "id": step.id,
            "step_number": step.step_number,
            "step_id": step.step_id,
            "content": step.content,
            "status": step.status.value,
            "created_at": step.created_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"创建步骤失败: {str(e)}")

@router.get("/workflows/{workflow_id}/steps")
async def get_steps(workflow_id: str, db: Session = Depends(get_db)):
    """获取工作流的所有步骤"""
    try:
        steps = db.query(WorkflowStep).filter(
            WorkflowStep.workflow_id == workflow_id
        ).order_by(WorkflowStep.step_number).all()
        
        return [{
            "id": s.id,
            "step_number": s.step_number,
            "step_id": s.step_id,
            "content": s.content,
            "category": s.category.value,
            "resource_type": s.resource_type.value,
            "status": s.status.value,
            "start_time": s.start_time.isoformat() if s.start_time else None,
            "end_time": s.end_time.isoformat() if s.end_time else None,
            "execution_details": s.execution_details,
            "results": s.results,
            "urls": s.urls,
            "files": s.files,
            "error_message": s.error_message,
            "created_at": s.created_at.isoformat()
        } for s in steps]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取步骤列表失败: {str(e)}")

@router.put("/workflows/{workflow_id}/steps/{step_id}")
async def update_step(workflow_id: str, step_id: str, request: StepUpdateRequest, db: Session = Depends(get_db)):
    """更新工作流步骤"""
    try:
        step = db.query(WorkflowStep).filter(
            and_(WorkflowStep.workflow_id == workflow_id, WorkflowStep.step_id == step_id)
        ).first()
        
        if not step:
            raise HTTPException(status_code=404, detail="步骤不存在")
        
        if request.content is not None:
            step.content = request.content
        if request.status is not None:
            step.status = StepStatus(request.status)
            if request.status == 'completed':
                step.end_time = datetime.utcnow()
            elif request.status == 'running':
                step.start_time = datetime.utcnow()
        if request.execution_details is not None:
            step.execution_details = request.execution_details
        if request.results is not None:
            step.results = request.results
        if request.urls is not None:
            step.urls = request.urls
        if request.files is not None:
            step.files = request.files
        if request.error_message is not None:
            step.error_message = request.error_message
        
        # 更新工作流进度
        workflow = db.query(WorkflowInstance).filter(WorkflowInstance.id == workflow_id).first()
        if workflow:
            completed_steps = db.query(WorkflowStep).filter(
                and_(WorkflowStep.workflow_id == workflow_id, WorkflowStep.status == StepStatus.COMPLETED)
            ).count()
            
            if workflow.total_steps > 0:
                workflow.progress_percentage = (completed_steps / workflow.total_steps) * 100
            workflow.current_step = step.step_number
            workflow.last_activity = datetime.utcnow()
        
        db.commit()
        
        return {"message": "步骤更新成功"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"更新步骤失败: {str(e)}")

# 工作流消息管理
@router.post("/workflows/{workflow_id}/messages")
async def create_message(workflow_id: str, request: MessageCreateRequest, db: Session = Depends(get_db)):
    """为工作流添加消息"""
    try:
        message = WorkflowMessage(
            id=str(uuid.uuid4()),
            workflow_id=workflow_id,
            message_id=request.message_id,
            message_type=MessageType(request.message_type),
            content=request.content,
            status=request.status,
            data=request.data
        )
        
        db.add(message)
        
        # 更新工作流活动时间
        workflow = db.query(WorkflowInstance).filter(WorkflowInstance.id == workflow_id).first()
        if workflow:
            workflow.last_activity = datetime.utcnow()
        
        db.commit()
        db.refresh(message)
        
        return {"message": "消息保存成功"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"保存消息失败: {str(e)}")

@router.get("/workflows/{workflow_id}/messages")
async def get_messages(workflow_id: str, db: Session = Depends(get_db)):
    """获取工作流的所有消息"""
    try:
        messages = db.query(WorkflowMessage).filter(
            WorkflowMessage.workflow_id == workflow_id
        ).order_by(WorkflowMessage.timestamp).all()
        
        return [{
            "id": m.id,
            "message_id": m.message_id,
            "message_type": m.message_type.value,
            "content": m.content,
            "status": m.status,
            "data": m.data,
            "timestamp": m.timestamp.isoformat()
        } for m in messages]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取消息列表失败: {str(e)}")

# 获取工作流的最新消息（支持时间戳过滤）
@router.get("/workflows/{workflow_id}/messages/latest")
async def get_latest_messages(
    workflow_id: str, 
    since: Optional[str] = None,  # ISO时间戳，获取此时间后的消息
    limit: int = 50,  # 限制返回消息数量
    db: Session = Depends(get_db)
):
    """获取工作流的最新消息（支持增量更新）"""
    try:
        query = db.query(WorkflowMessage).filter(
            WorkflowMessage.workflow_id == workflow_id
        )
        
        # 如果提供了时间戳，只获取该时间之后的消息
        if since:
            try:
                from datetime import datetime
                since_datetime = datetime.fromisoformat(since.replace('Z', '+00:00'))
                query = query.filter(WorkflowMessage.timestamp > since_datetime)
            except Exception as e:
                print(f"解析时间戳失败: {e}")
        
        messages = query.order_by(
            WorkflowMessage.timestamp.desc()
        ).limit(limit).all()
        
        # 按时间正序返回
        messages.reverse()
        
        return {
            "messages": [{
                "id": m.id,
                "message_id": m.message_id,
                "message_type": m.message_type.value,
                "content": m.content,
                "status": m.status,
                "data": m.data,
                "timestamp": m.timestamp.isoformat()
            } for m in messages],
            "count": len(messages),
            "has_more": len(messages) == limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取最新消息失败: {str(e)}")

# 获取工作流的消息统计信息
@router.get("/workflows/{workflow_id}/messages/stats")
async def get_messages_stats(workflow_id: str, db: Session = Depends(get_db)):
    """获取工作流消息统计信息"""
    try:
        from sqlalchemy import func
        
        # 统计各类型消息数量
        stats = db.query(
            WorkflowMessage.message_type,
            func.count(WorkflowMessage.id).label('count')
        ).filter(
            WorkflowMessage.workflow_id == workflow_id
        ).group_by(WorkflowMessage.message_type).all()
        
        # 获取最新消息时间
        latest_message = db.query(WorkflowMessage).filter(
            WorkflowMessage.workflow_id == workflow_id
        ).order_by(WorkflowMessage.timestamp.desc()).first()
        
        stats_dict = {stat.message_type.value: stat.count for stat in stats}
        
        return {
            "total_messages": sum(stats_dict.values()),
            "by_type": stats_dict,
            "latest_timestamp": latest_message.timestamp.isoformat() if latest_message else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取消息统计失败: {str(e)}")

# 工作流资源管理
@router.get("/workflows/{workflow_id}/resources")
async def get_workflow_resources(workflow_id: str, db: Session = Depends(get_db)):
    """获取工作流的所有资源"""
    try:
        resources = db.query(WorkflowResource).filter(
            WorkflowResource.workflow_id == workflow_id
        ).order_by(desc(WorkflowResource.created_at)).all()
        
        return [{
            "id": r.id,
            "resource_type": r.resource_type.value,
            "title": r.title,
            "description": r.description,
            "data": r.data,
            "category": r.category,
            "source_step_id": r.source_step_id,
            "created_at": r.created_at.isoformat()
        } for r in resources]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取资源列表失败: {str(e)}")

@router.post("/workflows/{workflow_id}/resources")
async def save_workflow_resource(workflow_id: str, request: dict, db: Session = Depends(get_db)):
    """保存工作流资源"""
    try:
        # 检查工作流是否存在
        workflow = db.query(WorkflowInstance).filter(WorkflowInstance.id == workflow_id).first()
        if not workflow:
            raise HTTPException(status_code=404, detail="工作流不存在")
        
        # 资源类型映射
        resource_type_map = {
            'web': WorkflowResourceType.WEB,
            'database': WorkflowResourceType.DATABASE,
            'api': WorkflowResourceType.API,
            'file': WorkflowResourceType.FILE,
            'chart': WorkflowResourceType.CHART,
            'general': WorkflowResourceType.GENERAL
        }
        
        resource_type = resource_type_map.get(request.get('type', 'general'), WorkflowResourceType.GENERAL)
        
        resource = WorkflowResource(
            id=request.get('id', str(uuid.uuid4())),
            workflow_id=workflow_id,
            step_id=request.get('stepId'),
            resource_type=resource_type,
            title=request.get('title', '未命名资源'),
            description=request.get('description'),
            data=request.get('data', {}),
            category=request.get('category'),
            source_step_id=request.get('sourceStepId')
        )
        
        # 检查是否已存在相同ID的资源
        existing = db.query(WorkflowResource).filter(WorkflowResource.id == resource.id).first()
        if existing:
            # 更新现有资源
            existing.title = resource.title
            existing.description = resource.description
            existing.data = resource.data
            existing.category = resource.category
            existing.updated_at = datetime.utcnow()
        else:
            # 添加新资源
            db.add(resource)
        
        db.commit()
        
        return {"message": "资源保存成功", "resource_id": resource.id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"保存资源失败: {str(e)}")

@router.post("/workflows/{workflow_id}/resources/batch")
async def save_workflow_resources_batch(workflow_id: str, request: List[dict], db: Session = Depends(get_db)):
    """批量保存工作流资源"""
    try:
        # 检查工作流是否存在
        workflow = db.query(WorkflowInstance).filter(WorkflowInstance.id == workflow_id).first()
        if not workflow:
            raise HTTPException(status_code=404, detail="工作流不存在")
        
        # 资源类型映射
        resource_type_map = {
            'web': WorkflowResourceType.WEB,
            'database': WorkflowResourceType.DATABASE,
            'api': WorkflowResourceType.API,
            'file': WorkflowResourceType.FILE,
            'chart': WorkflowResourceType.CHART,
            'general': WorkflowResourceType.GENERAL
        }
        
        saved_count = 0
        for resource_data in request:
            resource_type = resource_type_map.get(resource_data.get('type', 'general'), WorkflowResourceType.GENERAL)
            
            resource = WorkflowResource(
                id=resource_data.get('id', str(uuid.uuid4())),
                workflow_id=workflow_id,
                step_id=resource_data.get('stepId'),
                resource_type=resource_type,
                title=resource_data.get('title', '未命名资源'),
                description=resource_data.get('description'),
                data=resource_data.get('data', {}),
                category=resource_data.get('category'),
                source_step_id=resource_data.get('sourceStepId')
            )
            
            # 检查是否已存在相同ID的资源
            existing = db.query(WorkflowResource).filter(WorkflowResource.id == resource.id).first()
            if existing:
                # 更新现有资源
                existing.title = resource.title
                existing.description = resource.description
                existing.data = resource.data
                existing.category = resource.category
                existing.updated_at = datetime.utcnow()
            else:
                # 添加新资源
                db.add(resource)
                saved_count += 1
        
        db.commit()
        
        return {"message": f"批量保存成功，新增 {saved_count} 个资源"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"批量保存资源失败: {str(e)}")

@router.delete("/workflows/{workflow_id}")
async def delete_workflow(workflow_id: str, db: Session = Depends(get_db)):
    """删除工作流及其相关数据"""
    try:
        workflow = db.query(WorkflowInstance).filter(WorkflowInstance.id == workflow_id).first()
        if not workflow:
            raise HTTPException(status_code=404, detail="工作流不存在")
        
        db.delete(workflow)
        db.commit()
        
        return {"message": "工作流删除成功"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"删除工作流失败: {str(e)}") 

@router.get("/workflows/{workflow_id}/history")
async def get_workflow_history(workflow_id: str, db: Session = Depends(get_db)):
    """获取工作流的完整历史，包括所有步骤和消息"""
    try:
        # 获取工作流实例
        workflow = db.query(WorkflowInstance).filter(WorkflowInstance.id == workflow_id).first()
        if not workflow:
            raise HTTPException(status_code=404, detail="工作流不存在")
        
        # 获取所有步骤
        steps = db.query(WorkflowStep).filter(
            WorkflowStep.workflow_id == workflow_id
        ).order_by(WorkflowStep.step_number).all()
        
        # 获取所有消息
        messages = db.query(WorkflowMessage).filter(
            WorkflowMessage.workflow_id == workflow_id
        ).order_by(WorkflowMessage.created_at).all()
        
        # 格式化步骤数据
        formatted_steps = []
        for step in steps:
            formatted_steps.append({
                "id": step.id,
                "step_id": step.step_id,
                "step_number": step.step_number,
                "content": step.content,
                "category": step.category.value if step.category else "general",
                "resource_type": step.resource_type.value if step.resource_type else "general",
                "status": step.status.value if step.status else "pending",
                "start_time": step.start_time.isoformat() if step.start_time else None,
                "end_time": step.end_time.isoformat() if step.end_time else None,
                "execution_details": step.execution_details,
                "results": step.results,
                "urls": step.urls,
                "files": step.files,
                "error_message": step.error_message,
                "created_at": step.created_at.isoformat(),
                "updated_at": step.updated_at.isoformat()
            })
        
        # 格式化消息数据
        formatted_messages = []
        for message in messages:
            formatted_messages.append({
                "id": message.id,
                "message_id": message.message_id,
                "message_type": message.message_type.value if message.message_type else "system",
                "content": message.content,
                "status": message.status,
                "data": message.data,
                "created_at": message.created_at.isoformat(),
                "updated_at": message.updated_at.isoformat()
            })
        
        return {
            "workflow": {
                "id": workflow.id,
                "title": workflow.title,
                "description": workflow.description,
                "status": workflow.status.value,
                "progress_percentage": float(workflow.progress_percentage),
                "current_step": workflow.current_step,
                "total_steps": workflow.total_steps,
                "start_time": workflow.start_time.isoformat(),
                "end_time": workflow.end_time.isoformat() if workflow.end_time else None,
                "last_activity": workflow.last_activity.isoformat(),
                "context_data": workflow.context_data,
                "error_message": workflow.error_message,
                "created_at": workflow.created_at.isoformat(),
                "updated_at": workflow.updated_at.isoformat()
            },
            "steps": formatted_steps,
            "messages": formatted_messages
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取工作流历史失败: {str(e)}") 
