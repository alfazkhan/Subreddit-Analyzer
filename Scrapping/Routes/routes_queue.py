import json
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from database.queue import get_all_tasks, listen_to_queue_changes

router = APIRouter(tags=["Queue Endpoint Layer"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        # Serialize datetime and special types automatically
        payload = json.dumps(message, default=str)
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                pass

manager = ConnectionManager()

async def broadcast_queue_update():
    tasks = await get_all_tasks()
    await manager.broadcast({"type": "QUEUE_UPDATED", "data": tasks})

@router.on_event("startup")
async def start_pg_listener():
    # Start listening to PostgreSQL channel when FastAPI boots up
    await listen_to_queue_changes(broadcast_queue_update)

@router.get("/queue")
async def api_get_processes():
    return await get_all_tasks()

@router.websocket("/ws/queue")
async def websocket_queue_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial state on connection
        initial_tasks = await get_all_tasks()
        await websocket.send_text(json.dumps({"type": "QUEUE_UPDATED", "data": initial_tasks}, default=str))
        
        # Keep connection open
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)