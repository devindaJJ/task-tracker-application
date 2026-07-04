"""
In-memory WebSocket connection manager.

Tracks connected clients per-user so task change events can be broadcast
to the right audience: the task owner always gets notified, and admins
receive every event since they can see all tasks.

"""
import uuid
from dataclasses import dataclass

from fastapi import WebSocket

from app.models.user import UserRole


@dataclass
class ConnectionInfo:
    websocket: WebSocket
    user_id: uuid.UUID
    role: UserRole


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: list[ConnectionInfo] = []

    async def connect(self, websocket: WebSocket, user_id: uuid.UUID, role: UserRole) -> None:
        await websocket.accept()
        self._connections.append(ConnectionInfo(websocket=websocket, user_id=user_id, role=role))

    def disconnect(self, websocket: WebSocket) -> None:
        self._connections = [c for c in self._connections if c.websocket is not websocket]

    async def broadcast_task_event(
        self, event_type: str, task_data: dict, owner_id: uuid.UUID
    ) -> None:
        """
        Send a task event to the task's owner and to all connected admins.
        `event_type` is one of: task_created, task_updated, task_deleted.
        """
        message = {"event": event_type, "data": task_data}
        stale: list[WebSocket] = []

        for conn in self._connections:
            is_recipient = conn.user_id == owner_id or conn.role == UserRole.ADMIN
            if not is_recipient:
                continue
            try:
                await conn.websocket.send_json(message)
            except Exception:
                stale.append(conn.websocket)

        for ws in stale:
            self.disconnect(ws)


manager = ConnectionManager()
