from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import asyncio
import time
import logging

router = APIRouter()
logger = logging.getLogger("live_ws")


class RoomManager:
    def __init__(self) -> None:
        # room -> set[WebSocket]
        self.rooms: Dict[str, Set[WebSocket]] = {}
        # 连接 -> 用户名
        self.usernames: Dict[WebSocket, str] = {}
        # 连接 -> 房间
        self.connections_room: Dict[WebSocket, str] = {}
        # asyncio 锁
        self.lock = asyncio.Lock()

    async def join(self, room: str, websocket: WebSocket, username: str) -> None:
        async with self.lock:
            # 若已在其他房间，先退出旧房间
            old_room = self.connections_room.get(websocket)
            if old_room and old_room != room and old_room in self.rooms:
                self.rooms[old_room].discard(websocket)
                if not self.rooms[old_room]:
                    self.rooms.pop(old_room, None)
            if room not in self.rooms:
                self.rooms[room] = set()
            self.rooms[room].add(websocket)
            self.usernames[websocket] = username
            self.connections_room[websocket] = room
            try:
                logger.info(f"join room=%s user=%s connections=%d", room, username, len(self.rooms.get(room, set())))
            except Exception:
                pass

    async def leave(self, websocket: WebSocket) -> None:
        async with self.lock:
            room = self.connections_room.get(websocket)
            if room and room in self.rooms:
                self.rooms[room].discard(websocket)
                if not self.rooms[room]:
                    self.rooms.pop(room, None)
            self.usernames.pop(websocket, None)
            self.connections_room.pop(websocket, None)
            try:
                logger.info(f"leave room=%s", room)
            except Exception:
                pass

    async def broadcast(self, room: str, message: dict) -> None:
        targets = list(self.rooms.get(room, set()))
        if not targets:
            return
        payload = json.dumps(message)
        # 并发发送，避免单个阻塞
        await asyncio.gather(*[self._safe_send(ws, payload) for ws in targets], return_exceptions=True)
        try:
            logger.debug("broadcast room=%s size=%d type=%s", room, len(targets), message.get("type"))
        except Exception:
            pass

    async def _safe_send(self, ws: WebSocket, payload: str) -> None:
        try:
            await ws.send_text(payload)
        except Exception:
            # 发送失败时移除连接
            try:
                await self.leave(ws)
            except Exception:
                pass


manager = RoomManager()


async def _handle_ws(websocket: WebSocket):
    # 接受连接
    try:
        logger.info("websocket connect from %s", getattr(websocket.client, "host", "?"))
    except Exception:
        pass
    await websocket.accept()

    username = "匿名"
    room = "global"

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except Exception:
                # 非JSON直接忽略
                continue

            msg_type = data.get("type")

            # 心跳
            if msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong", "ts": data.get("ts")}))
                continue

            # 加入房间
            if msg_type == "join":
                room = str(data.get("room") or "global")
                username = str(data.get("user") or "匿名")
                await manager.join(room, websocket, username)
                # 系统消息：有人加入
                server_ts = int(time.time() * 1000)
                await manager.broadcast(room, {
                    "type": "system",
                    "event": "join",
                    "room": room,
                    "user": username,
                    "createdAt": server_ts
                })
                continue

            # 聊天消息
            if msg_type == "chat":
                content = (data.get("content") or "").strip()
                if not content:
                    continue
                # 容错：允许客户端每条都带room/user；否则用连接态
                msg_room = str(data.get("room") or room or "global")
                msg_user = str(data.get("user") or username or "匿名")
                server_ts = int(time.time() * 1000)
                message = {
                    "type": "chat",
                    "id": data.get("id") or f"mid_{id(websocket)}_{server_ts}",
                    "room": msg_room,
                    "user": msg_user,
                    "content": content,
                    "createdAt": server_ts
                }
                await manager.broadcast(msg_room, message)
                continue

            # 其他类型忽略
    except WebSocketDisconnect:
        try:
            logger.info("websocket disconnect")
        except Exception:
            pass
    except Exception as e:
        # 任何异常都确保清理
        try:
            logger.exception("websocket error: %s", e)
        except Exception:
            pass
    finally:
        # 离开房间
        await manager.leave(websocket)
        # 尝试广播离开事件（若还能发送）
        try:
            if room:
                await manager.broadcast(room, {
                    "type": "system",
                    "event": "leave",
                    "room": room,
                    "user": username,
                })
        except Exception:
            pass


@router.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await _handle_ws(websocket)


# 兼容未被代理重写的路径
@router.websocket("/python-api/ws/live")
async def websocket_endpoint_alias(websocket: WebSocket):
    await _handle_ws(websocket)


# 与 API 同前缀的别名，便于某些代理/网关统一放行策略
@router.websocket("/api/live/ws")
async def websocket_endpoint_api_prefix(websocket: WebSocket):
    await _handle_ws(websocket) 