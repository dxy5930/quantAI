"""
多维表格数据库API
Database API for Multi-dimensional Table System
"""

from fastapi import APIRouter, HTTPException, Depends, Request, Query
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
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
    # 允许可选提示或策略扩展
    hint: Optional[str] = None

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

        current_data = record.data or {}
        # 规则补全：若存在“代码/名称”类字段，做确定性映射
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
            if changed_field_id == code_field_id and code_field_id and name_field_id:
                raw = current_data.get(code_field_id)
                if raw:
                    s = str(raw).strip().upper()
                    digits = re.sub(r"[^0-9]", "", s)
                    q = db.query(Stock)
                    stock = (
                        q.filter((Stock.symbol == s)).first()
                        or q.filter((Stock.symbol == digits)).first()
                        or q.filter(Stock.symbol.like(f"%{digits}%")).first()
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

        prompt = (
            "你是一名智能表格助手。根据用户刚刚修改的字段，推断并补全同一行的其他字段。\n"
            "请严格输出JSON对象，仅包含需要更新的字段键值对（键使用字段ID）。\n"
            "如果无法确定则不要返回该字段。不要包含任何多余文本。\n\n"
            f"字段列表(仅供理解)：{json.dumps(field_summaries, ensure_ascii=False)}\n"
            f"当前行数据：{json.dumps(current_data, ensure_ascii=False)}\n"
            f"刚修改字段ID：{changed_field_id}\n"
        )
        if payload.hint:
            prompt += f"用户提示：{payload.hint}\n"

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
                        if isinstance(k, str) and k in known_field_ids and k != changed_field_id:
                            if k not in suggestions:
                                suggestions[k] = v
            except Exception:
                # 解析失败则不更新
                suggestions = {}

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