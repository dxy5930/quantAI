from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from models.database import get_db
from models.live_models import LiveChannel as LiveChannelModel, UserTeacherSubscription as UserTeacherSubscriptionModel, LiveOrder as LiveOrderModel, Teacher as TeacherModel
from models.user_models import User as UserModel
from utils.response import success_response, error_response, ErrorCode, json_response
import jwt
import uuid
import random
import urllib.parse

# 需与 auth_api 保持一致（也可统一封装）
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"

router = APIRouter(prefix="/api/live", tags=["live"])

@router.get("/channels", response_model=List[dict])
def list_channels(db: Session = Depends(get_db)):
  """获取直播频道列表（附 teacherId）"""
  records = db.query(LiveChannelModel).filter(LiveChannelModel.is_active == True).order_by(LiveChannelModel.order.asc()).all()
  return [
    {
      "id": r.id,
      "name": r.name,
      "teacherId": (r.teacher_id or r.id),
      "streamUrl": r.stream_url,
      "room": r.room,
      "order": r.order,
      "isActive": r.is_active,
    }
    for r in records
  ]

@router.post("/promo")
async def get_promo(payload: dict, db: Session = Depends(get_db)):
  """生成随机推广信息与二维码链接（用于企业微信添加或咨询）。
  入参: { channelId: string }
  返回: { title, description, bulletPoints[], qrUrl, contact, expiresAt }
  """
  try:
    channel_id = payload.get("channelId")
    if not channel_id:
      return json_response(success=False, code=ErrorCode.INVALID_PARAMS, message="缺少 channelId", status_code=400)

    channel = db.query(LiveChannelModel).filter(LiveChannelModel.id == channel_id).first()
    if not channel:
      return json_response(success=False, code=ErrorCode.DATA_NOT_FOUND, message="频道不存在", status_code=404)

    teacher_id = channel.teacher_id or channel.id
    teacher = db.query(TeacherModel).filter(TeacherModel.id == teacher_id).first()
    teacher_name = (teacher.name if teacher else channel.name)

    slogans = [
      "加企微，领取最新交易策略",
      "专属顾问一对一答疑，扫码加入",
      "领取新手礼包与学习资料包",
      "加入内测群，优先体验新功能",
      "订阅优惠与限时福利，扫码咨询"
    ]
    bullet_lib = [
      "每日盘前要点与热点追踪",
      "盘中异动提醒与风险提示",
      "复盘纪要与策略复现",
      "课程资料与录播回看",
      "专属客户群答疑"
    ]

    title = random.choice(["限时福利", "专属服务", "课程咨询", "订阅咨询", "领取资料"])
    description = random.choice(slogans)
    bullets = random.sample(bullet_lib, k=min(4, len(bullet_lib)))

    token = str(uuid.uuid4())
    contact = f"wecom://findvalue?teacher={teacher_id}&channel={channel_id}&token={token}"
    encoded = urllib.parse.quote(contact, safe="")
    # 公共二维码服务（可替换为自建服务）
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={encoded}"

    expires_at = (datetime.utcnow() + timedelta(hours=24)).isoformat()

    return success_response({
      "title": title,
      "description": description,
      "bulletPoints": bullets,
      "qrUrl": qr_url,
      "contact": contact,
      "teacherId": teacher_id,
      "channelId": channel_id,
      "expiresAt": expires_at
    }, message="获取成功")
  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(status_code=500, detail=f"生成推广信息失败: {str(e)}")

@router.post("/check-access")
async def check_access(payload: dict, request: Request, db: Session = Depends(get_db)):
  """校验用户对直播频道的访问权限：
  - 频道即老师：teacherId = channel.teacher_id 或 channel.id
  - 用户对该 teacher 的订阅有效期内允许访问
  """
  try:
    channel_id = payload.get("channelId")
    if not channel_id:
      return json_response(success=False, code=ErrorCode.INVALID_PARAMS, message="缺少 channelId", status_code=400)

    # 查频道
    channel = db.query(LiveChannelModel).filter(
      LiveChannelModel.id == channel_id,
      LiveChannelModel.is_active == True
    ).first()
    if not channel:
      return json_response(success=False, code=ErrorCode.DATA_NOT_FOUND, message="频道不存在或已禁用", status_code=404)

    # 频道即老师：若无 teacher_id 则使用 channel.id
    target_teacher_id = channel.teacher_id or channel.id

    # 解析用户
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
      return json_response(success=False, code=ErrorCode.LOGIN_REQUIRED, message="请先登录", status_code=401)

    token = auth_header.split(" ")[1]
    try:
      payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
      user_id = payload.get("sub")
    except Exception:
      return json_response(success=False, code=ErrorCode.INVALID_TOKEN, message="登录已失效，请重新登录", status_code=401)

    if not user_id:
      return json_response(success=False, code=ErrorCode.INVALID_TOKEN, message="无效令牌", status_code=401)

    user = db.query(UserModel).filter(UserModel.id == user_id, UserModel.is_active == True).first()
    if not user:
      return json_response(success=False, code=ErrorCode.USER_NOT_FOUND, message="用户不存在或被禁用", status_code=401)

    # 查订阅有效期
    now = datetime.utcnow()
    sub = db.query(UserTeacherSubscriptionModel).filter(
      UserTeacherSubscriptionModel.user_id == user_id,
      UserTeacherSubscriptionModel.teacher_id == target_teacher_id,
      UserTeacherSubscriptionModel.end_at > now
    ).first()

    if sub:
      return success_response({ "allowed": True, "reason": "subscribed", "endAt": sub.end_at.isoformat(), "teacherId": target_teacher_id })

    return success_response({ "allowed": False, "reason": "not_subscribed", "teacherId": target_teacher_id })

  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(status_code=500, detail=f"校验失败: {str(e)}")

@router.post("/orders/create")
async def create_order(payload: dict, request: Request, db: Session = Depends(get_db)):
  """创建订单（模拟）：
  body: { channelId: string, duration: 'week'|'month', payMethod: 'wechat'|'alipay'|'bankcard' }
  返回订单摘要
  """
  try:
    channel_id = payload.get("channelId")
    duration = payload.get("duration")
    pay_method = payload.get("payMethod")
    if not channel_id or duration not in ["week", "month"]:
      return json_response(success=False, code=ErrorCode.INVALID_PARAMS, message="参数错误", status_code=400)

    channel = db.query(LiveChannelModel).filter(LiveChannelModel.id == channel_id, LiveChannelModel.is_active == True).first()
    if not channel:
      return json_response(success=False, code=ErrorCode.DATA_NOT_FOUND, message="频道不存在或已禁用", status_code=404)

    target_teacher_id = channel.teacher_id or channel.id

    # 用户
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
      return json_response(success=False, code=ErrorCode.LOGIN_REQUIRED, message="请先登录", status_code=401)
    token = auth_header.split(" ")[1]
    try:
      jwt_payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
      user_id = jwt_payload.get("sub")
    except Exception:
      return json_response(success=False, code=ErrorCode.INVALID_TOKEN, message="登录已失效，请重新登录", status_code=401)

    # 定价（分）
    price_map = { "week": 9900, "month": 29900 }
    duration_days_map = { "week": 7, "month": 30 }

    order = LiveOrderModel(
      id=str(uuid.uuid4()),
      user_id=user_id,
      channel_id=channel_id,
      teacher_id=target_teacher_id,
      duration_days=duration_days_map[duration],
      amount_cents=price_map[duration],
      currency='CNY',
      pay_method=pay_method,
      status='PENDING'
    )
    db.add(order)
    db.commit()

    return success_response({
      "id": order.id,
      "channelId": order.channel_id,
      "teacherId": order.teacher_id,
      "durationDays": order.duration_days,
      "amountCents": order.amount_cents,
      "currency": order.currency,
      "payMethod": order.pay_method,
      "status": order.status,
      "createdAt": order.created_at.isoformat() if order.created_at else None,
    })
  except HTTPException:
    raise
  except Exception as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=f"创建订单失败: {str(e)}")

@router.post("/orders/pay")
async def pay_order(payload: dict, request: Request, db: Session = Depends(get_db)):
  """模拟支付：将订单状态置为 PAID，并创建/延长订阅（自动兜底创建 teacher 记录）"""
  try:
    order_id = payload.get("orderId")
    if not order_id:
      return json_response(success=False, code=ErrorCode.INVALID_PARAMS, message="缺少 orderId", status_code=400)

    # 用户
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
      return json_response(success=False, code=ErrorCode.LOGIN_REQUIRED, message="请先登录", status_code=401)
    token = auth_header.split(" ")[1]
    try:
      jwt_payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
      user_id = jwt_payload.get("sub")
    except Exception:
      return json_response(success=False, code=ErrorCode.INVALID_TOKEN, message="登录已失效，请重新登录", status_code=401)

    # 查订单
    order = db.query(LiveOrderModel).filter(LiveOrderModel.id == order_id, LiveOrderModel.user_id == user_id).first()
    if not order:
      return json_response(success=False, code=ErrorCode.DATA_NOT_FOUND, message="订单不存在", status_code=404)
    if order.status == 'PAID':
      return success_response({ "paid": True, "orderId": order.id, "expiresAt": order.expires_at.isoformat() if order.expires_at else None })

    # 模拟支付成功
    now = datetime.utcnow()

    # 订阅前：确保 teacher 记录存在（频道即老师）
    if not order.teacher_id:
      return json_response(success=False, code=ErrorCode.INVALID_PARAMS, message="订单缺少老师信息", status_code=400)

    teacher = db.query(TeacherModel).filter(TeacherModel.id == order.teacher_id).first()
    if not teacher:
      # 从频道复制名称作为 teacher 名称
      channel = db.query(LiveChannelModel).filter(LiveChannelModel.id == order.channel_id).first()
      teacher = TeacherModel(
        id=order.teacher_id,
        name=(channel.name if channel else order.teacher_id),
        is_active=True,
      )
      db.add(teacher)
      db.flush()

    # 订阅合并/延长
    sub = db.query(UserTeacherSubscriptionModel).filter(
      UserTeacherSubscriptionModel.user_id == user_id,
      UserTeacherSubscriptionModel.teacher_id == order.teacher_id
    ).first()

    base_start = now
    if sub and sub.end_at and sub.end_at > now:
      base_start = sub.end_at

    new_end = base_start + timedelta(days=order.duration_days)

    if sub:
      sub.end_at = new_end
    else:
      sub = UserTeacherSubscriptionModel(
        id=str(uuid.uuid4()),
        user_id=user_id,
        teacher_id=order.teacher_id,
        start_at=now,
        end_at=new_end
      )
      db.add(sub)

    order.status = 'PAID'
    order.paid_at = now
    order.expires_at = new_end

    db.commit()

    return success_response({
      "paid": True,
      "orderId": order.id,
      "channelId": order.channel_id,
      "teacherId": order.teacher_id,
      "expiresAt": new_end.isoformat(),
      "amountCents": order.amount_cents,
      "currency": order.currency
    })
  except HTTPException:
    raise
  except Exception as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=f"支付失败: {str(e)}") 