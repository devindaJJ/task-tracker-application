import uuid

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status

from app.core.security import TokenType, decode_token
from app.models.user import UserRole
from app.ws.manager import manager

router = APIRouter(tags=["Real-time"])


@router.websocket("/ws/tasks")
async def task_updates_ws(websocket: WebSocket, token: str = Query(...)) -> None:
    """
    Real-time task update stream.

    Browsers can't set Authorization headers on WebSocket handshakes, so the
    JWT access token is passed as a query parameter instead: /ws/tasks?token=<jwt>
    """
    payload = decode_token(token)
    if payload is None or payload.get("type") != TokenType.ACCESS.value:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        user_id = uuid.UUID(payload["sub"])
        role = UserRole(payload["role"])
    except (KeyError, ValueError):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, user_id, role)
    try:
        while True:
            # We don't expect inbound client messages,this keeps the
            # connection alive and detects disconnects promptly.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
