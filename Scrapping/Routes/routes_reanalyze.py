import asyncio
import logging
import os
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Optional
from nlp_processor import get_sentiment, extract_keywords, extract_entities, classify_topics

from auth_guard import get_optional_client_identity_ws
# Database modules
from database.subreddits import db_get_all_subreddits
from database.posts import get_all_posts_for_dynamic_reanalysis, update_post_nlp_data
from database.ignored_words import get_all_ignored_words, mark_ignored_words_as_processed

router = APIRouter()


class GlobalPipelineManager:
    """
    Singleton tracking matrix managing dynamic pipeline metrics, 
    execution states, and connected UI WebSocket channels.
    """
    def __init__(self):
        self.active_task = None
        self.stop_event = asyncio.Event()
        self.pause_event = asyncio.Event()
        self.pause_event.set()
        
        self.connected_websockets = set()
        
        self.current_status = "stopped"  # "running", "paused", "stopped"
        self.subreddit = ""
        self.processed = 0
        self.total = 0
        self.percent = 0.0
        self.message = "System Engine Idle. Awaiting pipeline specifications."

    async def register_client(self, websocket: WebSocket):
        """Registers a connection and forces an immediate real-time state catch-up packet."""
        self.connected_websockets.add(websocket)
        await websocket.send_json({
            "type": "status" if self.current_status != "stopped" else "info",
            "current_status": self.current_status,
            "subreddit": self.subreddit,
            "processed": self.processed,
            "total": self.total,
            "percent": self.percent,
            "message": f"Connected to live analytics stream. Current State: {self.message}"
        })

    def unregister_client(self, websocket: WebSocket):
        self.connected_websockets.discard(websocket)

    async def broadcast_payload(self, message_type: str, message_text: str, data_override: dict = None):
        self.message = message_text
        payload = {
            "type": message_type,
            "current_status": self.current_status,
            "subreddit": self.subreddit,
            "processed": self.processed,
            "total": self.total,
            "percent": self.percent,
            "message": self.message
        }
        if data_override:
            payload.update(data_override)

        if not self.connected_websockets:
            return

        disconnected = []
        for ws in self.connected_websockets:
            try:
                await ws.send_json(payload)
            except Exception:
                disconnected.append(ws)
                
        for ws in disconnected:
            self.unregister_client(ws)

    def reset_metrics(self):
        self.processed = 0
        self.total = 0
        self.percent = 0.0


global_manager = GlobalPipelineManager()


async def run_dynamic_text_reanalysis(subreddit: str, target_pipelines: list, only_null: bool, ignored_words: set, start_date: str = None, end_date: str = None):
    """
    Dynamic Processing Core: Reads dynamic pipelines to conditionally execute 
    and write text transformations down specified tracks.
    """
    global_manager.subreddit = subreddit
    global_manager.reset_metrics()

    msg_init = f"r/{subreddit} | Querying targeted records (Only Null: {only_null})..."
    logging.info(msg_init)
    await global_manager.broadcast_payload("status", msg_init)

    # Queries records directly matching structural array conditions
    posts = await get_all_posts_for_dynamic_reanalysis(subreddit, target_pipelines, only_null, start_date, end_date)
    total_posts = len(posts)
    
    if not total_posts:
        msg_empty = f"r/{subreddit} | No items required processing for targeted specs: {target_pipelines}"
        logging.info(msg_empty)
        await global_manager.broadcast_payload("info", msg_empty)
        return

    global_manager.total = total_posts
    msg_start = f"r/{subreddit} | Processing {total_posts} items across targets: {target_pipelines}..."
    logging.info(msg_start)
    await global_manager.broadcast_payload("start", msg_start)

    for count, row in enumerate(posts, 1):
        if global_manager.stop_event.is_set():
            break
        await global_manager.pause_event.wait()

        pid = row['id']
        combined_text = f"{row['title'] or ''} {row['body'] or ''}"

        # Conditional extraction allocations based strictly on incoming array specifications
        sentiment = get_sentiment(combined_text) if "sentiment" in target_pipelines else row.get('sentiment')
        
        if "keywords" in target_pipelines:
            raw_keywords = extract_keywords(combined_text, ignored_words)
            keywords = list(raw_keywords) if isinstance(raw_keywords, set) else raw_keywords
        else:
            try:
                keywords = json.loads(row['keywords']) if isinstance(row['keywords'], str) else row.get('keywords') or {}
            except Exception:
                keywords = row.get('keywords') or {}

        entities = extract_entities(combined_text) if "entities" in target_pipelines else row.get('entities')
        
        if "topic" in target_pipelines:
            topics = classify_topics(combined_text)
        else:
            try:
                topics = json.loads(row['topics']) if isinstance(row['topics'], str) else row.get('topics') or {}
            except Exception:
                topics = row.get('topics') or {}

        # Persist data states
        await update_post_nlp_data(pid, sentiment, keywords, entities, topics)

        # Real-time metrics streaming
        percent = round((count / total_posts) * 100, 1)
        msg_prog = f"r/{subreddit} | Dynamic Progress: {count}/{total_posts} ({percent}%)"
        
        global_manager.processed = count
        global_manager.percent = percent
        
        logging.info(msg_prog)
        await global_manager.broadcast_payload("progress", msg_prog)
        
        # CPU-breathing anchor to avoid server thread locks
        await asyncio.sleep(0.1)


async def dynamic_pipeline_orchestrator(target_pipelines: list, only_null: bool, target_subreddits: list = None, start_date: str = None, end_date: str = None):
    """Decoupled runner navigating across tracking targets."""
    try:
        global_manager.current_status = "running"
        all_subs = await db_get_all_subreddits()
        
        if target_subreddits:
            subreddits = [
                sub['name'] for sub in all_subs 
                if sub.get('is_active') is True and (sub['name'] in target_subreddits or sub.get('id') in target_subreddits)
            ]
        else:
            subreddits = [sub['name'] for sub in all_subs if sub.get('is_active') is True]
        
        if not subreddits:
            global_manager.current_status = "stopped"
            msg_err = "Dynamic Engine Blocked: No active tracker subreddits found."
            logging.error(msg_err)
            await global_manager.broadcast_payload("error", msg_err)
            return

        ignored_words = await get_all_ignored_words()

        for sub in subreddits:
            if global_manager.stop_event.is_set():
                break
            await run_dynamic_text_reanalysis(sub, target_pipelines, only_null, ignored_words, start_date, end_date)

        if not global_manager.stop_event.is_set():
            # Post-processing flag update for keyword pipelines
            if "keywords" in target_pipelines:
                await mark_ignored_words_as_processed()
                
            global_manager.current_status = "stopped"
            msg_fin = "Dynamic Engine Sequence complete. Operations parsed successfully."
            logging.info(msg_fin)
            await global_manager.broadcast_payload("complete", msg_fin)
            
    except Exception as e:
        global_manager.current_status = "stopped"
        msg_fail = f"Dynamic Engine Failure: Exception occurred: {str(e)}"
        logging.error(msg_fail)
        await global_manager.broadcast_payload("error", msg_fail)


@router.websocket("/ws/reanalyze")
async def reanalyze_endpoint(websocket: WebSocket, client: Optional[dict] = Depends(get_optional_client_identity_ws)):
    await websocket.accept()
    await global_manager.register_client(websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")

            if action in {"start", "pause", "resume", "stop"}:
                if not client or client.get("role") != "Super Admin":
                    await websocket.send_json({
                        "type": "error",
                        "current_status": global_manager.current_status,
                        "message": "Unauthorized. Only Super Admin may control reanalysis."
                    })
                    continue

            if action == "status":
                await websocket.send_json({
                    "type": "info",
                    "current_status": global_manager.current_status,
                    "subreddit": global_manager.subreddit,
                    "processed": global_manager.processed,
                    "total": global_manager.total,
                    "percent": global_manager.percent,
                    "message": "Realtime reanalysis status snapshot."
                })
                continue

            if action == "start":
                if global_manager.active_task and not global_manager.active_task.done():
                    await websocket.send_json({
                        "type": "error", 
                        "current_status": global_manager.current_status,
                        "message": "Engine Conflict: Background worker is currently running."
                    })
                    continue
                    
                target_pipelines = data.get("pipelines", ["keywords", "sentiment", "entities", "topic"])
                only_null = data.get("only_null", False)
                target_subreddits = data.get("subreddits", None)
                start_date = data.get("start_date")
                end_date = data.get("end_date")
                
                global_manager.stop_event.clear()
                global_manager.pause_event.set()
                global_manager.current_status = "running"
                
                global_manager.active_task = asyncio.create_task(
                    dynamic_pipeline_orchestrator(target_pipelines, only_null, target_subreddits, start_date, end_date)
                )
                await global_manager.broadcast_payload("status", "Dynamic Engine Handshake initialized.")
                
            elif action == "pause":
                global_manager.pause_event.clear()
                global_manager.current_status = "paused"
                await global_manager.broadcast_payload("status", "Task processing suspended.")
                
            elif action == "resume":
                global_manager.pause_event.set()
                global_manager.current_status = "running"
                await global_manager.broadcast_payload("status", "Task processing resumed.")
                
            elif action == "stop":
                global_manager.stop_event.set()
                global_manager.pause_event.set()
                global_manager.current_status = "stopped"
                await global_manager.broadcast_payload("status", "Task process termination forced.")
                
            else:
                await websocket.send_json({
                    "type": "error",
                    "current_status": global_manager.current_status,
                    "message": "Unsupported action. Allowed actions: status, start, pause, resume, stop."
                })
    except WebSocketDisconnect:
        global_manager.unregister_client(websocket)