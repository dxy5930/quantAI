from sqlalchemy.orm import Session
from models.workflow_models import (
    WorkflowInstance, WorkflowStep, WorkflowMessage, WorkflowResource,
    WorkflowStatus, StepStatus, StepCategory, ResourceTypeEnum, 
    MessageType, WorkflowResourceType
)
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)

class WorkflowPersistenceService:
    def __init__(self, db_session: Session):
        self.db = db_session
    
    def create_or_get_workflow(self, workflow_id: str, title: str, description: str = None, user_id: str = None):
        """创建或获取工作流实例"""
        try:
            # 检查是否已存在
            workflow = self.db.query(WorkflowInstance).filter(WorkflowInstance.id == workflow_id).first()
            
            if not workflow:
                # 创建新工作流
                workflow = WorkflowInstance(
                    id=workflow_id,
                    title=title,
                    description=description,
                    user_id=user_id,
                    status=WorkflowStatus.RUNNING
                )
                self.db.add(workflow)
                self.db.commit()
                self.db.refresh(workflow)
                logger.info(f"创建新工作流: {workflow_id}")
            else:
                # 更新现有工作流
                workflow.last_activity = datetime.utcnow()
                workflow.status = WorkflowStatus.RUNNING
                self.db.commit()
                logger.info(f"更新现有工作流: {workflow_id}")
            
            return workflow
        except Exception as e:
            logger.error(f"创建/获取工作流失败: {e}")
            self.db.rollback()
            return None
    
    def save_step(self, workflow_id: str, step_data: dict):
        """保存工作流步骤"""
        try:
            # 检查步骤是否已存在
            existing_step = self.db.query(WorkflowStep).filter(
                WorkflowStep.workflow_id == workflow_id,
                WorkflowStep.step_id == step_data.get('stepId')
            ).first()
            
            if existing_step:
                # 更新现有步骤
                existing_step.content = step_data.get('content', existing_step.content)
                existing_step.status = StepStatus.RUNNING
                existing_step.execution_details = step_data.get('executionDetails')
                existing_step.results = step_data.get('results')
                existing_step.urls = step_data.get('urls')
                existing_step.files = step_data.get('files')
                existing_step.start_time = datetime.utcnow()
                self.db.commit()
                return existing_step
            else:
                # 创建新步骤
                step = WorkflowStep(
                    id=str(uuid.uuid4()),
                    workflow_id=workflow_id,
                    step_number=step_data.get('step', 0),
                    step_id=step_data.get('stepId', str(uuid.uuid4())),
                    content=step_data.get('content', ''),
                    category=StepCategory(step_data.get('category', 'general')),
                    resource_type=ResourceTypeEnum(step_data.get('resourceType', 'general')),
                    status=StepStatus.RUNNING,
                    start_time=datetime.utcnow(),
                    execution_details=step_data.get('executionDetails'),
                    results=step_data.get('results'),
                    urls=step_data.get('urls'),
                    files=step_data.get('files')
                )
                
                self.db.add(step)
                self.db.commit()
                self.db.refresh(step)
                logger.info(f"保存步骤: {step.step_id}")
                return step
        except Exception as e:
            logger.error(f"保存步骤失败: {e}")
            self.db.rollback()
    
    def complete_step(self, workflow_id: str, step_id: str):
        """标记步骤为完成"""
        try:
            step = self.db.query(WorkflowStep).filter(
                WorkflowStep.workflow_id == workflow_id,
                WorkflowStep.step_id == step_id
            ).first()
            
            if step:
                step.status = StepStatus.COMPLETED
                step.end_time = datetime.utcnow()
                self.db.commit()
                
                # 更新工作流进度
                self.update_workflow_progress(workflow_id)
                logger.info(f"步骤完成: {step_id}")
        except Exception as e:
            logger.error(f"完成步骤失败: {e}")
            self.db.rollback()
    
    def save_message(self, workflow_id: str, message_data: dict):
        """保存工作流消息"""
        try:
            incoming_message_id = message_data.get('messageId', str(uuid.uuid4()))

            # 先查是否已存在相同 message_id（同一 workflow 内）
            existing = self.db.query(WorkflowMessage).filter(
                WorkflowMessage.workflow_id == workflow_id,
                WorkflowMessage.message_id == incoming_message_id
            ).first()

            if existing:
                # 幂等更新：覆盖可变字段
                existing.message_type = MessageType(message_data.get('type', existing.message_type.value))
                existing.content = message_data.get('content', existing.content)
                existing.status = message_data.get('status', existing.status)
                existing.data = message_data.get('data', existing.data)
                existing.updated_at = datetime.utcnow()
                self.db.commit()
                logger.info(f"更新已存在消息: {existing.message_id}")
            else:
                message = WorkflowMessage(
                    id=str(uuid.uuid4()),
                    workflow_id=workflow_id,
                    message_id=incoming_message_id,
                    message_type=MessageType(message_data.get('type', 'system')),
                    content=message_data.get('content', ''),
                    status=message_data.get('status'),
                    data=message_data.get('data')
                )
                self.db.add(message)
                self.db.commit()
                logger.info(f"保存消息: {message.message_id}")
        except Exception as e:
            logger.error(f"保存消息失败: {e}")
            self.db.rollback()
    
    def save_resources(self, workflow_id: str, step_id: str, step_data: dict):
        """从步骤数据中提取并保存资源"""
        try:
            print(f"🔄 开始保存资源 - 工作流ID: {workflow_id}, 步骤ID: {step_id}")
            print(f"   步骤数据: urls={len(step_data.get('urls', []))}, files={len(step_data.get('files', []))}, executionDetails={bool(step_data.get('executionDetails'))}")
            
            resource_count = 0

            # 将业务stepId(如 step_1) 映射为步骤表主键UUID
            step_pk = None
            try:
                step_row = self.db.query(WorkflowStep).filter(
                    WorkflowStep.workflow_id == workflow_id,
                    WorkflowStep.step_id == step_id
                ).first()
                step_pk = step_row.id if step_row else None
            except Exception as _e:
                logger.warning(f"查询步骤主键失败，将以NULL保存资源外键: {step_id}, 错误: {_e}")
            
            # 保存URL资源
            if step_data.get('urls'):
                print(f"   保存 {len(step_data['urls'])} 个URL资源")
                for url in step_data['urls']:
                    # 生成更友好的标题
                    try:
                        from urllib.parse import urlparse
                        parsed = urlparse(url)
                        host = parsed.netloc or '网页资源'
                        title = f"{host} - 相关链接"
                    except Exception:
                        title = f"网页资源 - {url}"
                    resource = WorkflowResource(
                        id=str(uuid.uuid4()),
                        workflow_id=workflow_id,
                        step_id=step_pk,
                        resource_type=WorkflowResourceType.WEB,
                        title=title,
                        description=f"从步骤中获取的网页链接",
                        data={'url': url},
                        source_step_id=step_data.get('stepId', step_id)
                    )
                    self.db.add(resource)
                    resource_count += 1
            
            # 保存文件资源
            if step_data.get('files'):
                print(f"   保存 {len(step_data['files'])} 个文件资源")
                for file_path in step_data['files']:
                    resource = WorkflowResource(
                        id=str(uuid.uuid4()),
                        workflow_id=workflow_id,
                        step_id=step_pk,
                        resource_type=WorkflowResourceType.FILE,
                        title=f"文件 - {file_path.split('/')[-1]}",
                        description=f"从步骤中生成的文件",
                        data={'file_path': file_path},
                        source_step_id=step_data.get('stepId', step_id)
                    )
                    self.db.add(resource)
                    resource_count += 1
            
            # 保存其他资源（根据resourceType）
            if step_data.get('executionDetails'):
                print(f"   保存执行详情资源")
                details = step_data['executionDetails']
                resource_type_map = {
                    'api': WorkflowResourceType.API,
                    'database': WorkflowResourceType.DATABASE,
                    'browser': WorkflowResourceType.WEB
                }
                
                # 根据是否包含可点击链接智能降级资源类型，避免前端 about:blank
                res_type = resource_type_map.get(step_data.get('resourceType'), WorkflowResourceType.GENERAL)
                if res_type == WorkflowResourceType.WEB:
                    has_url = False
                    try:
                        # details 里可能包含 url 字段
                        has_url = isinstance(details, dict) and bool(details.get('url'))
                    except Exception:
                        has_url = False
                    # 如果没有url，降级为 GENERAL，真正的链接会在上方通过 urls 单独入库
                    if not has_url:
                        res_type = WorkflowResourceType.GENERAL
                
                resource = WorkflowResource(
                    id=str(uuid.uuid4()),
                    workflow_id=workflow_id,
                    step_id=step_pk,
                    resource_type=res_type,
                    title=f"{step_data.get('resourceType', '通用')}资源 - {step_data.get('content', '')[:30]}",
                    description=step_data.get('content'),
                    data=details,
                    source_step_id=step_data.get('stepId', step_id)
                )
                self.db.add(resource)
                resource_count += 1
            
            self.db.commit()
            print(f"✅ 资源保存完成，共保存 {resource_count} 个资源")
            logger.info(f"保存资源完成，共 {resource_count} 个")
        except Exception as e:
            print(f"❌ 保存资源失败: {e}")
            logger.error(f"保存资源失败: {e}")
            self.db.rollback()
    
    def update_workflow_progress(self, workflow_id: str):
        """更新工作流进度"""
        try:
            workflow = self.db.query(WorkflowInstance).filter(WorkflowInstance.id == workflow_id).first()
            if not workflow:
                return
            
            total_steps = self.db.query(WorkflowStep).filter(WorkflowStep.workflow_id == workflow_id).count()
            completed_steps = self.db.query(WorkflowStep).filter(
                WorkflowStep.workflow_id == workflow_id,
                WorkflowStep.status == StepStatus.COMPLETED
            ).count()
            
            workflow.total_steps = total_steps
            if total_steps > 0:
                workflow.progress_percentage = (completed_steps / total_steps) * 100
            workflow.last_activity = datetime.utcnow()
            
            self.db.commit()
        except Exception as e:
            logger.error(f"更新工作流进度失败: {e}")
            self.db.rollback()
    
    def complete_workflow(self, workflow_id: str):
        """完成工作流"""
        try:
            workflow = self.db.query(WorkflowInstance).filter(WorkflowInstance.id == workflow_id).first()
            if workflow:
                workflow.status = WorkflowStatus.COMPLETED
                workflow.end_time = datetime.utcnow()
                workflow.progress_percentage = 100.0
                self.db.commit()
                logger.info(f"工作流完成: {workflow_id}")
        except Exception as e:
            logger.error(f"完成工作流失败: {e}")
            self.db.rollback()
    
    def get_workflow_state(self, workflow_id: str):
        """获取工作流状态用于恢复"""
        try:
            workflow = self.db.query(WorkflowInstance).filter(WorkflowInstance.id == workflow_id).first()
            if not workflow:
                return None
            
            steps = self.db.query(WorkflowStep).filter(
                WorkflowStep.workflow_id == workflow_id
            ).order_by(WorkflowStep.step_number).all()
            
            messages = self.db.query(WorkflowMessage).filter(
                WorkflowMessage.workflow_id == workflow_id
            ).order_by(WorkflowMessage.timestamp).all()
            
            resources = self.db.query(WorkflowResource).filter(
                WorkflowResource.workflow_id == workflow_id
            ).all()
            
            return {
                'workflow': {
                    'id': workflow.id,
                    'title': workflow.title,
                    'description': workflow.description,
                    'status': workflow.status.value,
                    'progress_percentage': float(workflow.progress_percentage),
                    'current_step': workflow.current_step,
                    'total_steps': workflow.total_steps,
                    'context_data': workflow.context_data
                },
                'steps': [{
                    'id': s.id,
                    'step_number': s.step_number,
                    'step_id': s.step_id,
                    'content': s.content,
                    'category': s.category.value,
                    'resource_type': s.resource_type.value,
                    'status': s.status.value,
                    'execution_details': s.execution_details,
                    'results': s.results,
                    'urls': s.urls,
                    'files': s.files
                } for s in steps],
                'messages': [{
                    'message_id': m.message_id,
                    'message_type': m.message_type.value,
                    'content': m.content,
                    'status': m.status,
                    'data': m.data,
                    'timestamp': m.timestamp.isoformat()
                } for m in messages],
                'resources': [{
                    'id': r.id,
                    'resource_type': r.resource_type.value,
                    'title': r.title,
                    'description': r.description,
                    'data': r.data,
                    'category': r.category
                } for r in resources]
            }
        except Exception as e:
            logger.error(f"获取工作流状态失败: {e}")
            return None 