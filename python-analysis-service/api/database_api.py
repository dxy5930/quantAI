"""
多维表格数据库API
Database API for Multi-dimensional Table System
"""

from fastapi import APIRouter, HTTPException, Depends, Request, Query
from typing import Optional, List, Dict, Any, Union
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from datetime import datetime
import json
import uuid

from models.database import get_db
from models.user_models import User
from models.database_models import ReviewDatabase, ReviewDatabaseRecord, ReviewDatabaseTemplate
from utils.response import success_response, error_response, ErrorCode
from api.user_api import get_current_user_from_token
from models.stock_models import Stock
import re

# 补全策略配置：是否使用本地数据库与规则补全
USE_LOCAL_DB_RULES = True

router = APIRouter(prefix="/api/v1/review/database", tags=["database"])

class DatabaseRequest(BaseModel):
    """数据库请求模型"""
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    templateId: Optional[str] = None

class DatabaseUpdateRequest(BaseModel):
    """数据库更新请求模型"""
    id: str
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    fields: Optional[List[Dict[str, Any]]] = None
    views: Optional[List[Dict[str, Any]]] = None
    records: Optional[List[Dict[str, Any]]] = None
    settings: Optional[Dict[str, Any]] = None

class RecordRequest(BaseModel):
    """记录请求模型"""
    data: Dict[str, Any]

# 新增：AI 补全行请求模型
class AICompleteRowRequest(BaseModel):
    """AI补全同行请求"""
    changedFieldId: str
    # 允许可选提示或策略扩展（可为字符串或结构化对象）
    hint: Optional[Union[str, Dict[str, Any]]] = None

# 模拟数据库存储（实际项目中应该使用真实数据库表）
# 这里使用简单的内存存储，实际应该创建数据库表
DATABASE_STORAGE = {}

def database_record_to_dict(database_record: ReviewDatabase, db: Session) -> Dict[str, Any]:
    """将数据库记录转换为返回格式"""
    # 获取所有记录
    records_query = db.query(ReviewDatabaseRecord).filter(
        ReviewDatabaseRecord.database_id == database_record.id,
        ReviewDatabaseRecord.is_deleted == False
    ).all()
    
    records = []
    for record in records_query:
        records.append({
            "id": record.id,
            "data": record.data,
            "createdAt": record.created_at.isoformat() if record.created_at else None,
            "updatedAt": record.updated_at.isoformat() if record.updated_at else None
        })
    
    return {
        "id": database_record.id,
        "name": database_record.name,
        "description": database_record.description,
        "icon": database_record.icon,
        "fields": database_record.fields,
        "views": database_record.views,
        "records": records,
        "settings": database_record.settings or {},
        "createdAt": database_record.created_at.isoformat() if database_record.created_at else None,
        "updatedAt": database_record.updated_at.isoformat() if database_record.updated_at else None,
        "userId": database_record.user_id
    }

def generate_database_id() -> str:
    """生成数据库ID"""
    return f"db_{uuid.uuid4().hex[:9]}_{int(datetime.now().timestamp())}"

def get_stock_trading_template() -> Dict[str, Any]:
    """获取股票交易复盘模板"""
    return {
        "id": "stock_trading_review",
        "name": "股票交易复盘",
        "description": "用于记录和分析股票交易的多维表格",
        "icon": "📈",
        "fields": [
            {
                "id": "title",
                "name": "交易标题",
                "type": "TEXT",
                "isPrimary": True,
                "config": {"required": True, "maxLength": 200},
                "order": 0
            },
            {
                "id": "stock_code",
                "name": "股票代码",
                "type": "TEXT",
                "config": {"required": True, "maxLength": 10},
                "order": 1
            },
            {
                "id": "stock_name",
                "name": "股票名称",
                "type": "TEXT",
                "config": {"required": True, "maxLength": 50},
                "order": 2
            },
            {
                "id": "trade_type",
                "name": "交易类型",
                "type": "SELECT",
                "config": {
                    "options": [
                        {"value": "buy", "label": "买入"},
                        {"value": "sell", "label": "卖出"}
                    ]
                },
                "order": 3
            },
            {
                "id": "trade_price",
                "name": "交易价格",
                "type": "NUMBER",
                "config": {"precision": 2, "min": 0},
                "order": 4
            },
            {
                "id": "trade_volume",
                "name": "交易数量",
                "type": "NUMBER",
                "config": {"precision": 0, "min": 0},
                "order": 5
            },
            {
                "id": "trade_date",
                "name": "交易日期",
                "type": "DATE",
                "config": {"required": True},
                "order": 6
            },
            {
                "id": "profit_loss",
                "name": "盈亏金额",
                "type": "CURRENCY",
                "config": {"precision": 2},
                "order": 7
            },
            {
                "id": "profit_rate",
                "name": "收益率",
                "type": "PERCENT",
                "config": {"precision": 2},
                "order": 8
            },
            {
                "id": "strategy",
                "name": "交易策略",
                "type": "LONG_TEXT",
                "config": {"maxLength": 1000},
                "order": 9
            },
            {
                "id": "notes",
                "name": "备注",
                "type": "LONG_TEXT",
                "config": {"maxLength": 500},
                "order": 10
            },
            {
                "id": "created_time",
                "name": "创建时间",
                "type": "CREATED_TIME",
                "order": 11
            }
        ],
        "views": [
            {
                "id": "grid_view",
                "name": "表格视图",
                "type": "GRID",
                "isDefault": True,
                "config": {},
                "order": 0
            },
            {
                "id": "kanban_view",
                "name": "看板视图",
                "type": "KANBAN",
                "config": {"groupBy": "trade_type"},
                "order": 1
            }
        ]
    }

def create_database_from_template(database_id: str, user_id: str, template_id: str) -> Dict[str, Any]:
    """根据模板创建数据库"""
    now = datetime.now().isoformat()
    
    if template_id == "stock_trading_review":
        template = get_stock_trading_template()
        
        # 为每个字段生成ID
        fields = []
        for i, field in enumerate(template["fields"]):
            field_data = {
                **field,
                "id": f"field_{uuid.uuid4().hex[:8]}",
                "createdAt": now,
                "updatedAt": now,
                "order": i
            }
            fields.append(field_data)
        
        # 为每个视图生成ID
        views = []
        for i, view in enumerate(template["views"]):
            view_data = {
                **view,
                "id": f"view_{uuid.uuid4().hex[:8]}",
                "createdAt": now,
                "updatedAt": now,
                "order": i
            }
            views.append(view_data)
        
        # 提取复盘ID用于数据库名称
        review_name = database_id.replace('review-', '') if database_id.startswith('review-') else database_id
        
        # 返回简化的结构，只包含数据库模型需要的字段
        return {
            "id": database_id,
            "name": f"复盘 {review_name[:8]} - {template['name']}",
            "description": f"复盘 {review_name} 的{template['description']}",
            "icon": template["icon"],
            "fields": fields,
            "views": views,
            "settings": {
                "enableVersionHistory": True,
                "enableComments": True,
                "enableNotifications": True,
                "autoSave": True,
                "backupEnabled": True,
                "aiIntegration": True
            }
        }
    
    raise HTTPException(status_code=400, detail=f"未知的模板ID: {template_id}")

@router.get("/databases/{database_id}")
async def get_database(database_id: str, request: Request, sort: str | None = Query(None, description="排序，格式 fieldId:asc|desc"), db: Session = Depends(get_db)):
    """获取数据库"""
    try:
        # 尝试获取用户信息，如果没有认证信息则使用默认用户
        user = None
        try:
            user = get_current_user_from_token(request, db)
        except HTTPException:
            # 如果没有认证信息，创建一个默认用户ID
            pass
        
        # 从数据库中获取数据库
        database_record = db.query(ReviewDatabase).filter(
            ReviewDatabase.id == database_id,
            ReviewDatabase.is_deleted == False
        ).first()
        
        if not database_record:
            # 数据库不存在，根据项目规范自动创建
            print(f"数据库 {database_id} 不存在，自动创建股票交易复盘数据库")
            
            # 使用默认用户ID或当前用户ID
            user_id = user.id if user else "default_user"
            
            # 自动创建数据库
            database_data = create_database_from_template(database_id, user_id, "stock_trading_review")
            
            # 保存到数据库
            database_record = ReviewDatabase(
                id=database_id,
                name=database_data["name"],
                description=database_data["description"],
                icon=database_data["icon"],
                user_id=user_id,
                template_id="stock_trading_review",
                fields=database_data["fields"],
                views=database_data["views"],
                settings=database_data["settings"]
            )
            
            db.add(database_record)
            db.commit()
            db.refresh(database_record)
            
            # 转换为返回格式
            result = database_record_to_dict(database_record, db)
            # 如果需要，按 sort 对返回的 records 排序
            if sort and result.get("records"):
                try:
                    field, direction = (sort.split(":", 1) + ["asc"])[:2]
                    direction = direction.lower()
                    reverse = direction == "desc"
                    result["records"].sort(key=lambda r: (r.get("data", {}).get(field, None) is None, r.get("data", {}).get(field, None)), reverse=reverse)
                except Exception:
                    pass
            return success_response(result, message="自动创建数据库成功")
        
        # 如果有用户认证，检查权限
        if user and database_record.user_id and database_record.user_id != user.id and database_record.user_id != "default_user":
            raise HTTPException(status_code=403, detail="没有权限访问此数据库")
        
        # 转换为返回格式
        result = database_record_to_dict(database_record, db)
        # 根据 sort 对记录排序（仅改变返回顺序，不修改存储）
        if sort and result.get("records"):
            try:
                field, direction = (sort.split(":", 1) + ["asc"])[:2]
                direction = direction.lower()
                reverse = direction == "desc"
                result["records"].sort(key=lambda r: (r.get("data", {}).get(field, None) is None, r.get("data", {}).get(field, None)), reverse=reverse)
            except Exception:
                pass
        return success_response(result, message="获取数据库成功")
        
    except HTTPException as he:
        # 如果是已知的HTTP异常，重新抛出
        if he.status_code != 401:  # 401认证错误不重新抛出，而是继续处理
            raise
        # 对于401错误，我们已经在上面处理了，继续执行
        raise HTTPException(status_code=500, detail="处理请求时发生错误")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取数据库失败: {str(e)}")

@router.get("/databases")
async def list_databases(request: Request, include_deleted: bool = Query(False), db: Session = Depends(get_db)):
    """获取数据库列表（按软删除过滤）"""
    try:
        # 允许未登录访问默认示例数据
        user = None
        try:
            user = get_current_user_from_token(request, db)
        except HTTPException:
            pass

        query = db.query(ReviewDatabase)
        if not include_deleted:
            query = query.filter(ReviewDatabase.is_deleted == False)

        # 权限范围：当前用户 + 默认示例
        if user:
            query = query.filter(ReviewDatabase.user_id.in_([user.id, "default_user"]))
        else:
            query = query.filter(ReviewDatabase.user_id.in_(["default_user"]))

        records = query.order_by(ReviewDatabase.updated_at.desc()).all()
        result = [database_record_to_dict(r, db) for r in records]
        return success_response(result, message="获取数据库列表成功")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取数据库列表失败: {str(e)}")

@router.post("/databases")
async def create_database(request: Request, payload: DatabaseRequest, db: Session = Depends(get_db)):
    """创建数据库"""
    try:
        user = get_current_user_from_token(request, db)
        
        database_id = generate_database_id()
        now = datetime.now().isoformat()
        
        if payload.templateId:
            # 根据模板创建
            database = create_database_from_template(database_id, user.id, payload.templateId)
            if payload.name:
                database["name"] = payload.name
            if payload.description:
                database["description"] = payload.description
            if payload.icon:
                database["icon"] = payload.icon
        else:
            # 创建空数据库
            database = {
                "id": database_id,
                "name": payload.name or "新建复盘表格",
                "description": payload.description or "多维复盘数据库",
                "icon": payload.icon or "📊",
                "fields": [
                    {
                        "id": f"field_{uuid.uuid4().hex[:8]}",
                        "name": "标题",
                        "type": "TEXT",
                        "isPrimary": True,
                        "config": {"required": True, "maxLength": 200},
                        "order": 0,
                        "createdAt": now,
                        "updatedAt": now
                    },
                    {
                        "id": f"field_{uuid.uuid4().hex[:8]}",
                        "name": "创建时间",
                        "type": "CREATED_TIME",
                        "order": 1,
                        "createdAt": now,
                        "updatedAt": now
                    }
                ],
                "views": [
                    {
                        "id": f"view_{uuid.uuid4().hex[:8]}",
                        "name": "表格视图",
                        "type": "GRID",
                        "isDefault": True,
                        "config": {},
                        "order": 0,
                        "createdAt": now,
                        "updatedAt": now
                    }
                ],
                "records": [],
                "settings": {
                    "enableVersionHistory": True,
                    "enableComments": True,
                    "enableNotifications": True,
                    "autoSave": True,
                    "backupEnabled": True,
                    "aiIntegration": True
                },
                "createdAt": now,
                "updatedAt": now,
                "userId": user.id
            }
        
        # 创建并保存到数据库
        database_record = ReviewDatabase(
            id=database_id,
            name=database["name"],
            description=database["description"],
            icon=database["icon"],
            user_id=user.id,
            template_id=payload.templateId,
            fields=database["fields"],
            views=database["views"],
            settings=database["settings"]
        )
        
        db.add(database_record)
        db.commit()
        db.refresh(database_record)
        
        # 转换为返回格式
        result = database_record_to_dict(database_record, db)
        return success_response(result, message="创建数据库成功")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建数据库失败: {str(e)}")

@router.put("/databases/{database_id}")
async def update_database(database_id: str, request: Request, payload: DatabaseUpdateRequest, db: Session = Depends(get_db)):
    """更新数据库"""
    try:
        user = None
        try:
            user = get_current_user_from_token(request, db)
        except HTTPException:
            pass
        
        # 检查数据库是否存在
        database_record = db.query(ReviewDatabase).filter(
            ReviewDatabase.id == database_id,
            ReviewDatabase.is_deleted == False
        ).first()
        
        if not database_record:
            # 如果数据库不存在，根据传入的数据创建一个新的
            if payload.name and payload.fields and payload.views:
                user_id = user.id if user else "default_user"
                
                database_record = ReviewDatabase(
                    id=database_id,
                    name=payload.name,
                    description=payload.description or "多维复盘数据库",
                    icon=payload.icon or "📊",
                    user_id=user_id,
                    fields=payload.fields,
                    views=payload.views,
                    settings=payload.settings or {
                        "enableVersionHistory": True,
                        "enableComments": True,
                        "enableNotifications": True,
                        "autoSave": True,
                        "backupEnabled": True,
                        "aiIntegration": True
                    }
                )
                
                db.add(database_record)
                db.commit()
                db.refresh(database_record)
                
                # 添加记录（如果有）
                if payload.records:
                    for record_data in payload.records:
                        record = ReviewDatabaseRecord(
                            database_id=database_id,
                            data=record_data.get("data", {})
                        )
                        db.add(record)
                    db.commit()
                
                result = database_record_to_dict(database_record, db)
                return success_response(result, message="创建数据库成功")
            else:
                raise HTTPException(status_code=404, detail="数据库不存在")
        
        # 检查权限
        if user and database_record.user_id and database_record.user_id != user.id and database_record.user_id != "default_user":
            raise HTTPException(status_code=403, detail="没有权限修改此数据库")
        
        # 更新数据库
        if payload.name is not None:
            database_record.name = payload.name
        if payload.description is not None:
            database_record.description = payload.description
        if payload.icon is not None:
            database_record.icon = payload.icon
        if payload.fields is not None:
            database_record.fields = payload.fields
        if payload.views is not None:
            database_record.views = payload.views
        if payload.settings is not None:
            database_record.settings = payload.settings
        
        # 手动更新时间戳
        database_record.updated_at = datetime.utcnow()
        
        # 处理记录更新
        if payload.records is not None:
            # 删除所有现有记录（软删除）
            db.query(ReviewDatabaseRecord).filter(
                ReviewDatabaseRecord.database_id == database_id
            ).update({"is_deleted": True})
            
            # 添加新记录
            for record_data in payload.records:
                record = ReviewDatabaseRecord(
                    database_id=database_id,
                    data=record_data.get("data", {})
                )
                db.add(record)
        
        db.commit()
        db.refresh(database_record)
        
        result = database_record_to_dict(database_record, db)
        return success_response(result, message="更新数据库成功")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"更新数据库失败: {str(e)}")

@router.delete("/databases/{database_id}")
async def delete_database(database_id: str, request: Request, db: Session = Depends(get_db)):
    """删除数据库（软删除）"""
    try:
        user = get_current_user_from_token(request, db)

        # 查询数据库
        database_record = db.query(ReviewDatabase).filter(
            ReviewDatabase.id == database_id,
            ReviewDatabase.is_deleted == False
        ).first()
        if not database_record:
            raise HTTPException(status_code=404, detail="数据库不存在")

        # 权限检查
        if database_record.user_id and database_record.user_id not in (user.id, "default_user"):
            raise HTTPException(status_code=403, detail="没有权限删除此数据库")

        # 软删除数据库与其记录
        database_record.is_deleted = True
        db.query(ReviewDatabaseRecord).filter(
            ReviewDatabaseRecord.database_id == database_id,
            ReviewDatabaseRecord.is_deleted == False
        ).update({"is_deleted": True})
        db.commit()

        return success_response(message="删除数据库成功（软删除）")

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"删除数据库失败: {str(e)}")

@router.post("/databases/{database_id}/records")
async def add_record(database_id: str, request: Request, payload: RecordRequest, db: Session = Depends(get_db)):
    """添加记录（持久化到数据库）"""
    try:
        user = get_current_user_from_token(request, db)
        
        # 查询数据库
        database_record = db.query(ReviewDatabase).filter(
            ReviewDatabase.id == database_id,
            ReviewDatabase.is_deleted == False
        ).first()
        if not database_record:
            raise HTTPException(status_code=404, detail="数据库不存在")
        
        # 权限检查
        if database_record.user_id and database_record.user_id not in (user.id, "default_user"):
            raise HTTPException(status_code=403, detail="没有权限修改此数据库")
        
        # 创建新记录
        record = ReviewDatabaseRecord(
            database_id=database_id,
            data=payload.data
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        
        # 手动更新时间
        database_record.updated_at = datetime.utcnow()
        db.commit()
        
        return success_response({
            "id": record.id,
            "data": record.data,
            "createdAt": record.created_at.isoformat() if record.created_at else None,
            "updatedAt": record.updated_at.isoformat() if record.updated_at else None
        }, message="添加记录成功")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"添加记录失败: {str(e)}")

@router.put("/databases/{database_id}/records/{record_id}")
async def update_record(database_id: str, record_id: str, request: Request, payload: RecordRequest, db: Session = Depends(get_db)):
    """更新记录（持久化到数据库）"""
    try:
        user = get_current_user_from_token(request, db)
        
        # 查询数据库
        database_record = db.query(ReviewDatabase).filter(
            ReviewDatabase.id == database_id,
            ReviewDatabase.is_deleted == False
        ).first()
        if not database_record:
            raise HTTPException(status_code=404, detail="数据库不存在")
        
        # 权限检查
        if database_record.user_id and database_record.user_id not in (user.id, "default_user"):
            raise HTTPException(status_code=403, detail="没有权限修改此数据库")
        
        # 查询记录
        record = db.query(ReviewDatabaseRecord).filter(
            ReviewDatabaseRecord.id == record_id,
            ReviewDatabaseRecord.database_id == database_id,
            ReviewDatabaseRecord.is_deleted == False
        ).first()
        if not record:
            raise HTTPException(status_code=404, detail="记录不存在")
        
        # 更新数据
        record.data = { **record.data, **payload.data }
        db.commit()
        db.refresh(record)
        
        # 更新时间
        database_record.updated_at = datetime.utcnow()
        db.commit()
        
        return success_response({
            "id": record.id,
            "data": record.data,
            "createdAt": record.created_at.isoformat() if record.created_at else None,
            "updatedAt": record.updated_at.isoformat() if record.updated_at else None
        }, message="更新记录成功")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"更新记录失败: {str(e)}")

# 新增：AI补全同行（基于当前记录与字段定义生成建议）
@router.post("/databases/{database_id}/records/{record_id}/ai/complete-row")
async def ai_complete_row(database_id: str, record_id: str, request: Request, payload: AICompleteRowRequest, db: Session = Depends(get_db)):
    try:
        user = get_current_user_from_token(request, db)

        database_record = db.query(ReviewDatabase).filter(
            ReviewDatabase.id == database_id,
            ReviewDatabase.is_deleted == False
        ).first()
        if not database_record:
            raise HTTPException(status_code=404, detail="数据库不存在")

        if database_record.user_id and database_record.user_id not in (user.id, "default_user"):
            raise HTTPException(status_code=403, detail="没有权限访问此数据库")

        record = db.query(ReviewDatabaseRecord).filter(
            ReviewDatabaseRecord.id == record_id,
            ReviewDatabaseRecord.database_id == database_id,
            ReviewDatabaseRecord.is_deleted == False
        ).first()
        if not record:
            raise HTTPException(status_code=404, detail="记录不存在")

        # 当前行数据
        current_data = record.data or {}

        # 准备提示词
        fields = database_record.fields or []
        known_field_ids = { (f.get('id') or '').strip() for f in fields if f.get('id') }
        field_summaries = []
        for f in fields:
            try:
                field_summaries.append({
                    'id': f.get('id'),
                    'name': f.get('name'),
                    'type': f.get('type'),
                })
            except Exception:
                continue
        changed_field_id = payload.changedFieldId
        # 新增：前端传来的变更值（若有）
        changed_value = None
        try:
            if isinstance(payload.hint, dict):
                cv = payload.hint.get('changedValue')
                if cv is not None:
                    changed_value = str(cv)
        except Exception:
            pass

        # 规则补全：若存在“代码/名称”类字段，做确定性映射（可开关）
        # 查找字段ID
        def find_field_id_by_name(keywords: list, fallbacks: list) -> Optional[str]:
            for f in fields:
                fid = (f.get('id') or '').strip()
                name = (f.get('name') or '').strip()
                lname = name.lower()
                if fid in fallbacks:
                    return fid
                for kw in keywords:
                    if kw in name or kw.lower() in lname:
                        return fid
            return None

        code_field_id = find_field_id_by_name([
            '代码', '股票代码', '证券代码', 'Symbol', 'Code'
        ], ['code', 'symbol', 'stock_code'])
        name_field_id = find_field_id_by_name([
            '名称', '股票名称', '证券名称', '简称', 'Name'
        ], ['name', 'stock_name'])

        suggestions: Dict[str, Any] = {}
        try:
            if USE_LOCAL_DB_RULES:
                if changed_field_id == code_field_id and code_field_id and name_field_id:
                    raw = changed_value if changed_field_id == code_field_id and changed_value is not None else current_data.get(code_field_id)
                    if raw:
                        s = str(raw).strip().upper()
                        digits = re.sub(r"[^0-9]", "", s)
                        q = db.query(Stock)
                        # 仅精确匹配，避免 02589 -> 002589 之类误匹配
                        stock = (
                            q.filter((Stock.symbol == s)).first()
                            or q.filter((Stock.symbol == digits)).first()
                        )
                        if stock and stock.name:
                            suggestions[name_field_id] = stock.name
                elif changed_field_id == name_field_id and code_field_id and name_field_id:
                    raw = current_data.get(name_field_id)
                    if raw:
                        name_val = str(raw).strip()
                        stock = db.query(Stock).filter(Stock.name == name_val).first()
                        if stock and stock.symbol:
                            suggestions[code_field_id] = stock.symbol
        except Exception:
            # 规则补全失败不影响后续AI
            pass

        # 基于“昨日数据”的确定性补全（可开关；当前使用外部行情接口）
        try:
            if USE_LOCAL_DB_RULES:
                symbol_to_query = None
                if code_field_id:
                    raw_code = changed_value if changed_field_id == code_field_id and changed_value is not None else (current_data.get(code_field_id) or suggestions.get(code_field_id))
                    if raw_code:
                        symbol_to_query = str(raw_code).strip().upper()
                if not symbol_to_query and name_field_id:
                    raw_name = (current_data.get(name_field_id) or suggestions.get(name_field_id))
                    if raw_name:
                        # 尝试用akshare模糊查询名称->代码（股票 + ETF）
                        try:
                            import akshare as ak
                            df_stock = ak.stock_info_a_code_name()
                            m1 = df_stock[df_stock['name'] == str(raw_name).strip()]
                            if not m1.empty:
                                symbol_to_query = str(m1.iloc[0]['code'])
                            if not symbol_to_query:
                                df_etf = ak.fund_etf_spot_em()
                                m2 = df_etf[df_etf['名称'] == str(raw_name).strip()]
                                if not m2.empty:
                                    symbol_to_query = str(m2.iloc[0]['代码'])
                        except Exception:
                            pass

                # 字段ID
                date_field_id = find_field_id_by_name(['日期', '交易日期', 'date', '交易日'], ['date', 'trade_date'])
                open_field_id = find_field_id_by_name(['今开', '开盘', '开', 'open'], ['open', 'open_price'])
                high_field_id = find_field_id_by_name(['最高', 'high'], ['high', 'high_price'])
                low_field_id = find_field_id_by_name(['最低', 'low'], ['low', 'low_price'])
                close_field_id = find_field_id_by_name(['收盘', '收盘价', 'close'], ['close', 'close_price'])
                volume_field_id = find_field_id_by_name(['成交量', '量', '总手', 'volume'], ['volume'])
                amount_field_id = find_field_id_by_name(['成交额', '金额', 'amount', 'turnover'], ['amount', 'turnover'])
                type_field_id = find_field_id_by_name(['类型', '品种', 'Type'], ['type', 'category'])
                flow_cap_field_id = find_field_id_by_name(['流值', '流通市值', '流通市值(元)'], ['circulationMarketCap', 'float_cap'])
                total_cap_field_id = find_field_id_by_name(['总值', '总市值', '市值'], ['marketCap', 'total_cap'])
                pe_field_id = find_field_id_by_name(['市盈', '市盈率', 'PE', 'pe'], ['pe', 'pe_ratio'])
                turnover_rate_field_id = find_field_id_by_name(['换手', '换手率'], ['turnoverRate', 'turnover_rate'])
                change_percent_field_id = find_field_id_by_name(['涨跌幅', '涨幅', '变动比例'], ['changePercent', 'pct_chg'])
                change_amount_field_id = find_field_id_by_name(['涨跌额', '变动额'], ['changeAmount', 'chg'])

                if symbol_to_query:
                    import akshare as ak
                    # 市场判定：A股/港股/ETF（简化）
                    import re as _re
                    is_hk = bool(_re.fullmatch(r"\d{5}", symbol_to_query)) or symbol_to_query.upper().startswith('HK')
                    is_stock = (not is_hk) and symbol_to_query and symbol_to_query[0] in ('0', '3', '6')

                    # 交易日（用于取昨日）
                    last_trade_date = None
                    try:
                        trade_cal = ak.tool_trade_date_hist_sina()
                        trade_dates = trade_cal['date'].dt.strftime('%Y-%m-%d').tolist()
                        today = datetime.now().strftime('%Y-%m-%d')
                        prev_dates = [d for d in trade_dates if d < today]
                        last_trade_date = prev_dates[-1] if prev_dates else today
                    except Exception:
                        pass

                    # 名称 & 类型
                    try:
                        if is_hk:
                            # 港股：补全名称 + 类型
                            if type_field_id and type_field_id in known_field_ids and type_field_id not in suggestions and type_field_id != changed_field_id:
                                suggestions[type_field_id] = '股票'
                            try:
                                df_hk = ak.stock_hk_spot_em()
                                if df_hk is not None and not df_hk.empty and name_field_id and name_field_id in known_field_ids and name_field_id not in suggestions and name_field_id != changed_field_id:
                                    col_code = '代码' if '代码' in df_hk.columns else ('symbol' if 'symbol' in df_hk.columns else None)
                                    col_name = '名称' if '名称' in df_hk.columns else ('name' if 'name' in df_hk.columns else None)
                                    if col_code and col_name:
                                        df_matched = df_hk[df_hk[col_code].astype(str).str.endswith(symbol_to_query)]
                                        if not df_matched.empty:
                                            suggestions[name_field_id] = str(df_matched.iloc[0][col_name])
                            except Exception:
                                pass
                        elif is_stock:
                            df_map = ak.stock_info_a_code_name()
                            row_map = df_map[df_map['code'] == symbol_to_query]
                            if not row_map.empty and name_field_id and name_field_id in known_field_ids and name_field_id not in suggestions and name_field_id != changed_field_id:
                                suggestions[name_field_id] = str(row_map.iloc[0]['name'])
                        else:
                            df_etf = ak.fund_etf_spot_em()
                            row_etf = df_etf[df_etf['代码'] == symbol_to_query]
                            if not row_etf.empty and name_field_id and name_field_id in known_field_ids and name_field_id not in suggestions and name_field_id != changed_field_id:
                                suggestions[name_field_id] = str(row_etf.iloc[0]['名称'])
                        if type_field_id and type_field_id in known_field_ids and type_field_id not in suggestions and type_field_id != changed_field_id:
                            suggestions[type_field_id] = '股票' if (is_stock or is_hk) else '基金'
                    except Exception:
                        pass

                    # 行情（昨日K线）
                    try:
                        if is_hk:
                            # 使用港股现货数据补全关键字段
                            try:
                                hk_spot = ak.stock_hk_spot_em()
                                one = hk_spot[hk_spot[( '代码' if '代码' in hk_spot.columns else 'symbol')].astype(str).str.endswith(symbol_to_query)] if hk_spot is not None else None
                            except Exception:
                                one = None
                            if one is not None and not one.empty:
                                row0 = one.iloc[0]
                                if date_field_id and date_field_id in known_field_ids and date_field_id not in suggestions and date_field_id != changed_field_id and last_trade_date:
                                    suggestions[date_field_id] = str(last_trade_date)
                                # 列名兼容中文/英文
                                def _gv(*names):
                                    for k in names:
                                        if k in row0:
                                            return row0[k]
                                    return None
                                ov = _gv('今开', 'open')
                                hv = _gv('最高', 'high')
                                lv = _gv('最低', 'low')
                                vv = _gv('成交量', 'volume')
                                av = _gv('成交额', 'amount')
                                total_cap_val = _gv('总市值', 'market_cap')
                                float_cap_val = _gv('流通市值', 'float_market_cap')
                                prev_close_val = _gv('昨收', 'pre_close', 'previous_close')
                                in_vol_val = _gv('内盘', 'inner_volume')
                                out_vol_val = _gv('外盘', 'outer_volume')
                                if open_field_id and open_field_id in known_field_ids and open_field_id not in suggestions and open_field_id != changed_field_id and ov is not None:
                                    suggestions[open_field_id] = float(str(ov).replace(',', ''))
                                if high_field_id and high_field_id in known_field_ids and high_field_id not in suggestions and high_field_id != changed_field_id and hv is not None:
                                    suggestions[high_field_id] = float(str(hv).replace(',', ''))
                                if low_field_id and low_field_id in known_field_ids and low_field_id not in suggestions and low_field_id != changed_field_id and lv is not None:
                                    suggestions[low_field_id] = float(str(lv).replace(',', ''))
                                if volume_field_id and volume_field_id in known_field_ids and volume_field_id not in suggestions and volume_field_id != changed_field_id and vv is not None:
                                    suggestions[volume_field_id] = int(float(str(vv).replace(',', '')))
                                if amount_field_id and amount_field_id in known_field_ids and amount_field_id not in suggestions and amount_field_id != changed_field_id and av is not None:
                                    suggestions[amount_field_id] = float(str(av).replace(',', ''))
                                if total_cap_field_id and total_cap_field_id in known_field_ids and total_cap_field_id not in suggestions and total_cap_field_id != changed_field_id and total_cap_val is not None:
                                    try:
                                        suggestions[total_cap_field_id] = float(str(total_cap_val).replace(',', ''))
                                    except Exception:
                                        pass
                                if flow_cap_field_id and flow_cap_field_id in known_field_ids and flow_cap_field_id not in suggestions and flow_cap_field_id != changed_field_id and float_cap_val is not None:
                                    try:
                                        suggestions[flow_cap_field_id] = float(str(float_cap_val).replace(',', ''))
                                    except Exception:
                                        pass
                                # 记录昨收供后续派生计算
                                locals().update({ 'prev_close_val': prev_close_val })
                                # 记录内外盘
                                locals().update({ 'in_volume_val': in_vol_val, 'out_volume_val': out_vol_val })
                        elif is_stock:
                            df_hist = ak.stock_zh_a_hist(symbol=symbol_to_query, period='daily', start_date='20000101', end_date='99991231')
                            if not df_hist.empty:
                                row_hist = None
                                if last_trade_date:
                                    row_hist = df_hist[df_hist['日期'].dt.strftime('%Y-%m-%d') == last_trade_date]
                                if row_hist is None or row_hist.empty:
                                    row_hist = df_hist.tail(1)
                                r = row_hist.iloc[0]
                                if date_field_id and date_field_id != changed_field_id and date_field_id in known_field_ids and date_field_id not in suggestions:
                                    suggestions[date_field_id] = r['日期'].strftime('%Y-%m-%d')
                                if open_field_id and open_field_id != changed_field_id and open_field_id in known_field_ids and open_field_id not in suggestions:
                                    suggestions[open_field_id] = float(r['开盘'])
                                if high_field_id and high_field_id != changed_field_id and high_field_id in known_field_ids and high_field_id not in suggestions:
                                    suggestions[high_field_id] = float(r['最高'])
                                if low_field_id and low_field_id != changed_field_id and low_field_id in known_field_ids and low_field_id not in suggestions:
                                    suggestions[low_field_id] = float(r['最低'])
                                if close_field_id and close_field_id != changed_field_id and close_field_id in known_field_ids and close_field_id not in suggestions:
                                    suggestions[close_field_id] = float(r['收盘'])
                                if volume_field_id and volume_field_id != changed_field_id and volume_field_id in known_field_ids and volume_field_id not in suggestions:
                                    suggestions[volume_field_id] = int(r['成交量'])
                                if amount_field_id and amount_field_id != changed_field_id and amount_field_id in known_field_ids and amount_field_id not in suggestions:
                                    suggestions[amount_field_id] = float(r['成交额'])

                            # 现货快照：市值/市盈/换手/涨跌
                            try:
                                spot = ak.stock_zh_a_spot_em()
                                one = spot[spot['代码'] == symbol_to_query]
                                if not one.empty:
                                    row0 = one.iloc[0]
                                    # 市值
                                    if total_cap_field_id and total_cap_field_id in known_field_ids and total_cap_field_id not in suggestions and total_cap_field_id != changed_field_id:
                                        suggestions[total_cap_field_id] = float(str(row0.get('总市值', row0.get('总市值(元)'))).replace(',', '')) if row0.get('总市值', row0.get('总市值(元)')) is not None else None
                                    if flow_cap_field_id and flow_cap_field_id in known_field_ids and flow_cap_field_id not in suggestions and flow_cap_field_id != changed_field_id:
                                        suggestions[flow_cap_field_id] = float(str(row0.get('流通市值', row0.get('流通市值(元)'))).replace(',', '')) if row0.get('流通市值', row0.get('流通市值(元)')) is not None else None
                                    # 市盈率
                                    pe_val = row0.get('市盈率-动态', row0.get('市盈率(动态)', row0.get('市盈率', row0.get('pe_ttm'))))
                                    if pe_field_id and pe_field_id in known_field_ids and pe_field_id not in suggestions and pe_field_id != changed_field_id and pe_val is not None:
                                        suggestions[pe_field_id] = float(str(pe_val).replace('%',''))
                                    # 昨收
                                    try:
                                        prev_c = row0.get('昨收') or row0.get('昨收价') or row0.get('pre_close')
                                        locals().update({ 'prev_close_val': prev_c })
                                    except Exception:
                                        pass
                                    # 换手率
                                    to_val = row0.get('换手率', row0.get('换手', row0.get('turnover')))
                                    if turnover_rate_field_id and turnover_rate_field_id in known_field_ids and turnover_rate_field_id not in suggestions and turnover_rate_field_id != changed_field_id and to_val is not None:
                                        suggestions[turnover_rate_field_id] = float(str(to_val).replace('%',''))
                                    # 涨跌幅/额
                                    chg_pct = row0.get('涨跌幅', row0.get('涨幅', row0.get('pct_chg')))
                                    chg_amt = row0.get('涨跌额', row0.get('涨额', row0.get('chg')))
                                    if change_percent_field_id and change_percent_field_id in known_field_ids and change_percent_field_id not in suggestions and change_percent_field_id != changed_field_id and chg_pct is not None:
                                        suggestions[change_percent_field_id] = float(str(chg_pct).replace('%',''))
                                    if change_amount_field_id and change_amount_field_id in known_field_ids and change_amount_field_id not in suggestions and change_amount_field_id != changed_field_id and chg_amt is not None:
                                        suggestions[change_amount_field_id] = float(str(chg_amt).replace(',',''))
                            except Exception:
                                pass
                        else:
                            # ETF行情
                            r = None
                            try:
                                df_hist = ak.fund_etf_hist_em(symbol=symbol_to_query, period='daily', start_date='20000101', end_date='99991231', adjust="")
                                if not df_hist.empty:
                                    if last_trade_date:
                                        row_hist = df_hist[df_hist['日期'] == last_trade_date]
                                        if row_hist.empty:
                                            row_hist = df_hist.tail(1)
                                    else:
                                        row_hist = df_hist.tail(1)
                                    r = row_hist.iloc[0]
                            except Exception:
                                try:
                                    df_hist = ak.fund_etf_hist_sina(symbol=symbol_to_query)
                                    if not df_hist.empty:
                                        row_hist = df_hist.tail(1)
                                        r = row_hist.iloc[0]
                                except Exception:
                                    r = None
                            if r is not None:
                                # 日期：优先使用最近交易日
                                if date_field_id and date_field_id != changed_field_id and date_field_id in known_field_ids and date_field_id not in suggestions:
                                    if last_trade_date:
                                        suggestions[date_field_id] = str(last_trade_date)
                                    else:
                                        suggestions[date_field_id] = str(r.get('日期')) if '日期' in r else str(r.get('date'))
                                # EM接口字段名：开盘/最高/最低/收盘/成交量/成交额
                                def _get(kcns, kalts):
                                    for k in kcns + kalts:
                                        if k in r:
                                            return r[k]
                                    return None
                                ov = _get(['开盘'], ['open'])
                                hv = _get(['最高'], ['high'])
                                lv = _get(['最低'], ['low'])
                                cv = _get(['收盘'], ['close'])
                                vv = _get(['成交量'], ['volume'])
                                av = _get(['成交额'], ['amount'])
                                if open_field_id and open_field_id != changed_field_id and open_field_id in known_field_ids and open_field_id not in suggestions and ov is not None:
                                    suggestions[open_field_id] = float(ov)
                                if high_field_id and high_field_id != changed_field_id and high_field_id in known_field_ids and high_field_id not in suggestions and hv is not None:
                                    suggestions[high_field_id] = float(hv)
                                if low_field_id and low_field_id != changed_field_id and low_field_id in known_field_ids and low_field_id not in suggestions and lv is not None:
                                    suggestions[low_field_id] = float(lv)
                                if close_field_id and close_field_id != changed_field_id and close_field_id in known_field_ids and close_field_id not in suggestions and cv is not None:
                                    suggestions[close_field_id] = float(cv)
                                if volume_field_id and volume_field_id != changed_field_id and volume_field_id in known_field_ids and volume_field_id not in suggestions and vv is not None:
                                    suggestions[volume_field_id] = int(float(vv))
                                if amount_field_id and amount_field_id != changed_field_id and amount_field_id in known_field_ids and amount_field_id not in suggestions and av is not None:
                                    suggestions[amount_field_id] = float(av)
                            # ETF 现货：换手/涨跌幅
                            try:
                                etf_spot = ak.fund_etf_spot_em()
                                one = etf_spot[etf_spot['代码'] == symbol_to_query]
                                if not one.empty:
                                    row0 = one.iloc[0]
                                    # 若能获取到日期，仍以最近交易日为准
                                    if date_field_id and date_field_id in known_field_ids and date_field_id not in suggestions and date_field_id != changed_field_id and last_trade_date:
                                        suggestions[date_field_id] = str(last_trade_date)
                                    to_val = row0.get('换手率')
                                    chg_pct = row0.get('涨跌幅')
                                    # 总值/流值（有些接口无直接字段，这里尝试从东财字段取）
                                    total_cap_val = row0.get('总市值') or row0.get('总市值(元)')
                                    float_cap_val = row0.get('流通市值') or row0.get('流通市值(元)')
                                    if total_cap_field_id and total_cap_field_id in known_field_ids and total_cap_field_id not in suggestions and total_cap_field_id != changed_field_id and total_cap_val is not None:
                                        try:
                                            suggestions[total_cap_field_id] = float(str(total_cap_val).replace(',', ''))
                                        except Exception:
                                            pass
                                    if flow_cap_field_id and flow_cap_field_id in known_field_ids and flow_cap_field_id not in suggestions and flow_cap_field_id != changed_field_id and float_cap_val is not None:
                                        try:
                                            suggestions[flow_cap_field_id] = float(str(float_cap_val).replace(',', ''))
                                        except Exception:
                                            pass
                                    if turnover_rate_field_id and turnover_rate_field_id in known_field_ids and turnover_rate_field_id not in suggestions and turnover_rate_field_id != changed_field_id and to_val is not None:
                                        suggestions[turnover_rate_field_id] = float(str(to_val).replace('%',''))
                                    if change_percent_field_id and change_percent_field_id in known_field_ids and change_percent_field_id not in suggestions and change_percent_field_id != changed_field_id and chg_pct is not None:
                                        suggestions[change_percent_field_id] = float(str(chg_pct).replace('%',''))
                            except Exception:
                                pass
                    except Exception:
                        pass
        except Exception:
            pass

        # 通用映射：将已获取到的数值映射到更多字段（包含用户自定义的同义字段）
        try:
            def _val(fid):
                return suggestions.get(fid) if fid in suggestions else current_data.get(fid)
            facts: Dict[str, Any] = {
                'date': _val(date_field_id),
                'open': _val(open_field_id),
                'high': _val(high_field_id),
                'low': _val(low_field_id),
                'close': _val(close_field_id),
                'volume': _val(volume_field_id),
                'amount': _val(amount_field_id),
                'float_cap': _val(flow_cap_field_id),
                'total_cap': _val(total_cap_field_id),
                'pe': _val(pe_field_id),
                'turnover_rate': _val(turnover_rate_field_id),
                'pct_chg': _val(change_percent_field_id),
                'chg': _val(change_amount_field_id),
                'in_volume': locals().get('in_volume_val', None),
                'out_volume': locals().get('out_volume_val', None),
            }
            # 可能的昨收
            prev_close = locals().get('prev_close_val', None)
            # 派生：涨跌额/涨跌幅/振幅
            try:
                if facts.get('pct_chg') is None and facts.get('close') is not None and prev_close not in (None, ''):
                    facts['pct_chg'] = (float(facts['close']) - float(prev_close)) / float(prev_close) * 100.0
                if facts.get('chg') is None and facts.get('close') is not None and prev_close not in (None, ''):
                    facts['chg'] = float(facts['close']) - float(prev_close)
                if facts.get('high') is not None and facts.get('low') is not None and prev_close not in (None, ''):
                    facts['amplitude'] = (float(facts['high']) - float(facts['low'])) / float(prev_close) * 100.0
            except Exception:
                pass

            # 同义词映射
            alias: Dict[str, list[str]] = {
                'open': ['今开','开盘','open'],
                'high': ['最高','high'],
                'low': ['最低','low'],
                'close': ['收盘','收盘价','close'],
                'volume': ['成交量','总手','volume'],
                'amount': ['成交额','金额','amount','turnover'],
                'float_cap': ['流值','流通市值','流通市值(元)','float_cap'],
                'total_cap': ['总值','总市值','总市值(元)','market_cap'],
                'pe': ['市盈','市盈率','pe'],
                'turnover_rate': ['换手','换手率','turnoverRate'],
                'pct_chg': ['涨跌幅','涨幅','pct_chg'],
                'chg': ['涨跌额','涨额','chg'],
                'amplitude': ['振幅','幅度','amplitude'],
                'date': ['日期','交易日期','date'],
                'in_volume': ['内盘','inner','inner_volume','neipan'],
                'out_volume': ['外盘','outer','outer_volume','waipan'],
            }
            def match_alias(field_name: str, canon: str) -> bool:
                name = (field_name or '').lower()
                for w in alias.get(canon, []):
                    wl = str(w).lower()
                    if wl in name:
                        return True
                return False

            # 简易安全公式计算器：仅允许数字/变量/+-*/() 和 math
            import math as _math
            def safe_calc(expr: str, variables: Dict[str, Any]) -> Any:
                try:
                    # 构建可用变量表（facts 内的标量数值）
                    safe_vars = {k: (float(v) if isinstance(v, (int, float, str)) and str(v).strip() != '' else None) for k, v in variables.items()}
                    return eval(expr, {"__builtins__": {}}, {**safe_vars, 'math': _math})
                except Exception:
                    return None

            for f in fields:
                fid = (f.get('id') or '').strip()
                if not fid or fid in suggestions or fid == changed_field_id:
                    continue
                # 跳过锁定标题与除代码外的预设字段手填
                if (f.get('isPreset') and fid != 'preset_symbol') or fid == 'title':
                    continue
                current_v = current_data.get(fid)
                if current_v not in (None, ''):
                    continue
                cfg = (f.get('config') or {}) if isinstance(f.get('config'), dict) else {}
                maps_to = cfg.get('mapsTo')
                formula = cfg.get('formula')
                # 1) 配置 mapsTo：直接映射标准事实
                if isinstance(maps_to, str) and maps_to in facts and facts[maps_to] is not None:
                    suggestions[fid] = facts[maps_to]
                    continue
                # 2) 配置 formula：按 facts 计算
                if isinstance(formula, str) and formula.strip():
                    val = safe_calc(formula, facts)
                    if val is not None:
                        suggestions[fid] = val
                        continue
                # 3) 名称同义词匹配
                for canon, value in facts.items():
                    if value is None:
                        continue
                    if match_alias(f.get('name'), canon) or fid == canon:
                        suggestions[fid] = value
                        break
        except Exception:
            pass

        # AI语义补全未知字段：当字段既无配置也未被别名命中时，请AI根据字段名和已知事实猜测
        try:
            # 待补候选：当前为空、非预设、未在 suggestions 中
            candidates = []
            for f in fields:
                fid = (f.get('id') or '').strip()
                if not fid or fid == changed_field_id:
                    continue
                if (f.get('isPreset') and fid != 'preset_symbol') or fid == 'title':
                    continue
                if fid in suggestions:
                    continue
                if (record.data or {}).get(fid) not in (None, ''):
                    continue
                cfg = (f.get('config') or {}) if isinstance(f.get('config'), dict) else {}
                if cfg.get('mapsTo') or cfg.get('formula'):
                    continue
                candidates.append({ 'id': fid, 'name': f.get('name'), 'type': f.get('type') })

            if candidates:
                # 构建事实视图（与上面的facts一致，若未定义则回退到 current_data）
                try:
                    facts_for_ai = {
                        'date': suggestions.get(date_field_id) if 'date_field_id' in locals() else None,
                        'open': suggestions.get(open_field_id) if 'open_field_id' in locals() else None,
                        'high': suggestions.get(high_field_id) if 'high_field_id' in locals() else None,
                        'low': suggestions.get(low_field_id) if 'low_field_id' in locals() else None,
                        'close': suggestions.get(close_field_id) if 'close_field_id' in locals() else None,
                        'volume': suggestions.get(volume_field_id) if 'volume_field_id' in locals() else None,
                        'amount': suggestions.get(amount_field_id) if 'amount_field_id' in locals() else None,
                        'float_cap': suggestions.get(flow_cap_field_id) if 'flow_cap_field_id' in locals() else None,
                        'total_cap': suggestions.get(total_cap_field_id) if 'total_cap_field_id' in locals() else None,
                        'pe': suggestions.get(pe_field_id) if 'pe_field_id' in locals() else None,
                        'turnover_rate': suggestions.get(turnover_rate_field_id) if 'turnover_rate_field_id' in locals() else None,
                        'pct_chg': suggestions.get(change_percent_field_id) if 'change_percent_field_id' in locals() else None,
                        'chg': suggestions.get(change_amount_field_id) if 'change_amount_field_id' in locals() else None,
                        'in_volume': locals().get('in_volume_val', None),
                        'out_volume': locals().get('out_volume_val', None),
                    }
                except Exception:
                    facts_for_ai = {}

                try:
                    from services.qwen_analyzer import QwenAnalyzer
                    analyzer2 = QwenAnalyzer()
                    prompt2 = (
                        '你是一名智能表格助手。给定一行股票/基金的已知事实与候选字段名称，请推断这些候选字段的值。\n'
                        '输出严格的JSON对象，键为字段ID，值为推断结果；无法确定就不要包含该键。\n'
                        '已知事实(可使用)：' + json.dumps(facts_for_ai, ensure_ascii=False) + '\n'
                        '候选字段：' + json.dumps(candidates, ensure_ascii=False) + '\n'
                        '注意：尽量用事实直接映射或简单计算（如均价=amount/volume；振幅=(high-low)/close*100）。' 
                    )
                    ai_text2 = analyzer2.analyze_text(prompt2, max_tokens=600)
                    if ai_text2:
                        try:
                            parsed2 = json.loads(ai_text2)
                            if isinstance(parsed2, dict):
                                for k, v in parsed2.items():
                                    if isinstance(k, str) and k in known_field_ids and k not in suggestions:
                                        suggestions[k] = v
                        except Exception:
                            pass
                except Exception:
                    pass
        except Exception:
            pass

        # 允许AI参与合并的字段集合（纯AI补全：除当前修改字段外的所有字段）
        allowed_to_update = set(k for k in known_field_ids if k and k != changed_field_id)

        prompt = (
            "你是一名智能表格助手。根据用户刚刚修改的字段，推断并补全同一行的其他字段。\n"
            "请严格输出JSON对象，仅包含需要更新的字段键值对（键使用字段ID）。\n"
            "如果无法确定则不要返回该字段。不要包含任何多余文本。\n\n"
            f"字段列表(仅供理解)：{json.dumps(field_summaries, ensure_ascii=False)}\n"
            f"当前行数据：{json.dumps(current_data, ensure_ascii=False)}\n"
            f"刚修改字段ID：{changed_field_id}\n"
        )
        if payload.hint:
            try:
                hint_text = payload.hint if isinstance(payload.hint, str) else json.dumps(payload.hint, ensure_ascii=False)
            except Exception:
                hint_text = str(payload.hint)
            prompt += f"用户提示：{hint_text}\n"

        # 调用AI
        try:
            from services.qwen_analyzer import QwenAnalyzer
            analyzer = QwenAnalyzer()
            ai_text = analyzer.analyze_text(prompt, max_tokens=800)
        except Exception as e:
            ai_text = ""
        # 合并AI建议（不覆盖规则补全）
        if ai_text:
            try:
                parsed = json.loads(ai_text)
                if isinstance(parsed, dict):
                    for k, v in parsed.items():
                        if isinstance(k, str) and k in known_field_ids and k in allowed_to_update:
                            if k not in suggestions:
                                suggestions[k] = v
            except Exception:
                # 保留规则与昨日数据补全结果
                pass

        return success_response({
            "suggested": suggestions,
        }, message="AI补全完成")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI补全失败: {str(e)}")

@router.delete("/databases/{database_id}/records/{record_id}")
async def delete_record(database_id: str, record_id: str, request: Request, db: Session = Depends(get_db)):
    """删除记录（软删除）"""
    try:
        user = get_current_user_from_token(request, db)
        
        # 查询数据库
        database_record = db.query(ReviewDatabase).filter(
            ReviewDatabase.id == database_id,
            ReviewDatabase.is_deleted == False
        ).first()
        if not database_record:
            raise HTTPException(status_code=404, detail="数据库不存在")
        
        # 权限检查
        if database_record.user_id and database_record.user_id not in (user.id, "default_user"):
            raise HTTPException(status_code=403, detail="没有权限修改此数据库")
        
        # 查找记录
        record = db.query(ReviewDatabaseRecord).filter(
            ReviewDatabaseRecord.id == record_id,
            ReviewDatabaseRecord.database_id == database_id,
            ReviewDatabaseRecord.is_deleted == False
        ).first()
        if not record:
            raise HTTPException(status_code=404, detail="记录不存在")
        
        # 软删除记录
        record.is_deleted = True
        db.commit()
        
        return success_response(message="删除记录成功（软删除）")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"删除记录失败: {str(e)}")

@router.get("/health")
async def health_check():
    """健康检查"""
    return success_response({
        "status": "healthy",
        "service": "多维表格数据库服务",
        "storage_count": len(DATABASE_STORAGE)
    }, message="服务正常运行")