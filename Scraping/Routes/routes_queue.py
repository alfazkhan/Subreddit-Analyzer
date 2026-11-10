import json
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException

from auth_guard import require_role
from database.queue import get_queue_state, listen_to_queue_changes
from database.queue_manager import force_requeue_posts

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
        payload = json.dumps(message, default=str)
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                pass

manager = ConnectionManager()

async def broadcast_queue_update():
    counts, tasks = await get_queue_state()
    await manager.broadcast({
        "type": "QUEUE_UPDATED",
        "counts": counts,
        "data": tasks
    })

@router.on_event("startup")
async def start_pg_listener():
    await listen_to_queue_changes(broadcast_queue_update)

@router.get("/queue")
async def api_get_processes():
    counts, tasks = await get_queue_state()
    return {
        "counts": counts,
        "tasks": tasks
    }

@router.put("/queue/{subreddit}/{post_id}")
async def api_requeue_post(
    subreddit: str,
    post_id: str,
    super_admin: dict = Depends(require_role(["Super Admin"]))
):
    """
    Transitions a specific post back to 'pending' in the scraping queue.
    If the post is not in the queue, it creates a new entry as 'pending'.
    """
    try:
        # Wrap the single ID in a list since the database function expects a list
        await force_requeue_posts([post_id], subreddit)
        return {
            "message": f"Task {post_id} successfully queued as 'pending' for r/{subreddit}", 
            "post_id": post_id
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to requeue task: {str(e)}"
        )

@router.websocket("/ws/queue")
async def websocket_queue_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        counts, tasks = await get_queue_state()
        await websocket.send_text(json.dumps({
            "type": "QUEUE_UPDATED",
            "counts": counts,
            "data": tasks
        }, default=str))
        
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)