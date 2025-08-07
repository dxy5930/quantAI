from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from models.database import get_db
from models.workflow_models import WorkflowInstance

router = APIRouter(prefix="/api/workflow", tags=["workflow-soft-delete"])

@router.post("/workflows/{workflow_id}/soft-delete")
async def soft_delete_workflow(workflow_id: str, db: Session = Depends(get_db)):
    """软删除工作流（标记为已删除，不实际删除数据）"""
    try:
        workflow = db.query(WorkflowInstance).filter(
            WorkflowInstance.id == workflow_id,
            WorkflowInstance.is_deleted == 0  # 只查询未删除的
        ).first()
        
        if not workflow:
            raise HTTPException(status_code=404, detail="工作流不存在或已被删除")
        
        # 软删除：更新标记和时间
        workflow.is_deleted = 1
        workflow.deleted_at = datetime.utcnow()
        workflow.last_activity = datetime.utcnow()
        
        db.commit()
        
        return {"message": "工作流删除成功", "deleted_at": workflow.deleted_at.isoformat()}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"删除工作流失败: {str(e)}")

@router.post("/workflows/{workflow_id}/restore")
async def restore_workflow(workflow_id: str, db: Session = Depends(get_db)):
    """恢复已删除的工作流"""
    try:
        workflow = db.query(WorkflowInstance).filter(
            WorkflowInstance.id == workflow_id,
            WorkflowInstance.is_deleted == 1  # 只查询已删除的
        ).first()
        
        if not workflow:
            raise HTTPException(status_code=404, detail="工作流不存在或未被删除")
        
        # 恢复：清除删除标记
        workflow.is_deleted = 0
        workflow.deleted_at = None
        workflow.last_activity = datetime.utcnow()
        
        db.commit()
        
        return {"message": "工作流恢复成功"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"恢复工作流失败: {str(e)}")

@router.get("/workflows/deleted")
async def get_deleted_workflows(db: Session = Depends(get_db)):
    """获取已删除的工作流列表"""
    try:
        workflows = db.query(WorkflowInstance).filter(
            WorkflowInstance.is_deleted == 1
        ).order_by(WorkflowInstance.deleted_at.desc()).all()
        
        return [{
            "id": w.id,
            "title": w.title,
            "description": w.description,
            "status": w.status.value,
            "deleted_at": w.deleted_at.isoformat() if w.deleted_at else None,
            "created_at": w.created_at.isoformat()
        } for w in workflows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取已删除工作流列表失败: {str(e)}") 