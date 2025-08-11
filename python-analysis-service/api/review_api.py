from fastapi import APIRouter, HTTPException, Depends, Query, Request
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import uuid

from models.database import get_db
from models.user_models import User
from models.review_models import Review, ReviewStatus
from utils.response import success_response, error_response, ErrorCode
from api.user_api import get_current_user_from_token

router = APIRouter(prefix="/api/v1/reviews", tags=["reviews"])

STANDARD_TEMPLATE = """# {title}

## 市场概况
简述今日市场表现、指数走势、热点板块。

## 持仓分析
### 盈利股票
- 

### 亏损股票
- 

## 交易决策回顾
### 买入决策
1. 

### 卖出决策
1. 

## 经验总结
### 做得好的地方
- 

### 需要改进的地方
- 

## 明日策略
- 

## 风险提示
- 

---
复盘时间: {finished_at}
"""

class ReviewCreateRequest(BaseModel):
  title: Optional[str] = None
  review_date: Optional[str] = None

class ReviewUpdateRequest(BaseModel):
  title: Optional[str] = None
  review_date: Optional[str] = None
  status: Optional[str] = None
  summary: Optional[str] = None
  content: Optional[str] = None


def review_to_dict(row: Review) -> dict:
  return {
    "id": row.id,
    "reviewId": row.review_id,
    "userId": row.user_id,
    "title": row.title,
    "reviewDate": row.review_date,
    "status": row.status.value if isinstance(row.status, ReviewStatus) else row.status,
    "summary": row.summary,
    "content": row.content,
    "createdAt": row.created_at.isoformat() if row.created_at else None,
    "updatedAt": row.updated_at.isoformat() if row.updated_at else None,
  }

@router.post("")
async def create_review(request: Request, payload: ReviewCreateRequest, db: Session = Depends(get_db)):
  try:
    user = get_current_user_from_token(request, db)
    now_date = datetime.utcnow().strftime("%Y-%m-%d")
    title = payload.title or f"{now_date} 交易复盘"
    review_id = str(uuid.uuid4())

    content = STANDARD_TEMPLATE.format(title=title, finished_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    row = Review(
      user_id=user.id,
      review_id=review_id,
      title=title,
      review_date=payload.review_date or now_date,
      status=ReviewStatus.DRAFT,
      content=content,
      summary=None,
    )

    db.add(row)
    db.commit()
    db.refresh(row)

    return success_response(review_to_dict(row), message="创建复盘成功")
  except HTTPException:
    raise
  except Exception as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=f"创建复盘失败: {str(e)}")

@router.get("")
async def list_reviews(request: Request, limit: int = Query(50, le=100), offset: int = Query(0, ge=0), db: Session = Depends(get_db)):
  try:
    user = get_current_user_from_token(request, db)
    q = db.query(Review).filter(Review.user_id == user.id, Review.is_deleted == False).order_by(Review.created_at.desc())
    total = q.count()
    rows: List[Review] = q.offset(offset).limit(limit).all()
    return success_response({
      "total": total,
      "items": [review_to_dict(r) for r in rows]
    })
  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(status_code=500, detail=f"获取复盘列表失败: {str(e)}")

@router.post("/{review_id}/update")
async def update_review(review_id: str, request: Request, payload: ReviewUpdateRequest, db: Session = Depends(get_db)):
  try:
    user = get_current_user_from_token(request, db)
    row: Review = db.query(Review).filter(Review.review_id == review_id, Review.user_id == user.id, Review.is_deleted == False).first()
    if not row:
      return error_response(ErrorCode.DATA_NOT_FOUND, "复盘不存在")

    if payload.title is not None:
      row.title = payload.title
    if payload.review_date is not None:
      row.review_date = payload.review_date
    if payload.status is not None:
      row.status = ReviewStatus(payload.status) if payload.status in [s.value for s in ReviewStatus] else row.status
    if payload.summary is not None:
      row.summary = payload.summary
    if payload.content is not None:
      row.content = payload.content

    db.commit()
    db.refresh(row)

    return success_response(review_to_dict(row), message="更新成功")
  except HTTPException:
    raise
  except Exception as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=f"更新复盘失败: {str(e)}")

@router.post("/{review_id}/delete")
async def delete_review(review_id: str, request: Request, db: Session = Depends(get_db)):
  try:
    user = get_current_user_from_token(request, db)
    row: Review = db.query(Review).filter(Review.review_id == review_id, Review.user_id == user.id, Review.is_deleted == False).first()
    if not row:
      return error_response(ErrorCode.DATA_NOT_FOUND, "复盘不存在")

    row.is_deleted = True
    db.commit()

    return success_response(message="删除成功")
  except HTTPException:
    raise
  except Exception as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=f"删除复盘失败: {str(e)}") 