import asyncio
import logging
import os
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from scraper_v2 import process_queue_batch
from nlp_processor import get_sentiment, extract_keywords, extract_entities

# New explicit database module imports
from database.subreddits import get_active_subreddits
from database.posts import (
    get_archived_ids, get_post_content_for_reanalysis, 
    update_post_nlp_data, update_post_keywords_only
)
from database.queue_manager import force_requeue_posts
from database.ignored_words import get_all_ignored_words

router = APIRouter()

IS_PRODUCTION = os.getenv("APP_ENV") == "production"
headless_mode = True if IS_PRODUCTION else True

class ReanalysisSession:
    """Manages the state of a running reanalysis job for a specific WebSocket connection."""
    def __init__(self):
        self.active_task = None
        self.stop_event = asyncio.Event()
        self.pause_event = asyncio.Event()
        self.pause_event.set()

async def run_local_reanalysis(subreddit: str, websocket: WebSocket, ignored_words: set, session: ReanalysisSession, keywords_only: bool = False):
    posts = await get_post_content_for_reanalysis(subreddit)
    
    total_posts = len(posts)
    if not total_posts:
        await websocket.send_json({"type": "info", "message": f"r/{subreddit} | No posts found."})
        return

    log_interval = max(1, total_posts // 10)
    mode_str = "Keywords Only Fast-Lane" if keywords_only else "Full NLP Suite"
    await websocket.send_json({"type": "start", "subreddit": subreddit, "total": total_posts, "message": f"Starting {mode_str}"})

    for count, row in enumerate(posts, 1):
        if session.stop_event.is_set():
            await websocket.send_json({"type": "warning", "message": f"r/{subreddit} | Local Reanalysis forcefully stopped."})
            break
        
        await session.pause_event.wait()

        pid = row['id']
        combined_text = f"{row['title'] or ''} {row['body'] or ''}"
        
        raw_keywords = extract_keywords(combined_text, ignored_words)
        keywords = list(raw_keywords) if isinstance(raw_keywords, set) else raw_keywords
        
        if keywords_only:
            await update_post_keywords_only(pid, keywords)
        else:
            sentiment = get_sentiment(combined_text)
            entities = extract_entities(combined_text)
            await update_post_nlp_data(pid, sentiment, keywords, entities)
        
        if count % log_interval == 0 or count == total_posts:
            percent = round((count / total_posts) * 100, 1)
            await websocket.send_json({
                "type": "progress", 
                "subreddit": subreddit, 
                "processed": count, 
                "total": total_posts, 
                "percent": percent
            })
        
        if count % 25 == 0:
            await asyncio.sleep(0)

async def run_network_reanalysis(subreddit: str, websocket: WebSocket, session: ReanalysisSession):
    archived_ids = await get_archived_ids(subreddit)
    
    if not archived_ids:
        await websocket.send_json({"type": "info", "message": f"r/{subreddit} | No archived posts to scrape."})
        return
        
    await force_requeue_posts(list(archived_ids), subreddit)
    
    batch_size = 15
    total_batches = (len(archived_ids) // batch_size) + 1
    
    await websocket.send_json({
        "type": "info", 
        "message": f"r/{subreddit} | Pushed {len(archived_ids)} posts to network queue. Processing {total_batches} batches..."
    })
    
    for i in range(total_batches):
        if session.stop_event.is_set():
            await websocket.send_json({"type": "warning", "message": f"r/{subreddit} | Network Reanalysis forcefully stopped."})
            break
        
        await session.pause_event.wait()

        await process_queue_batch(subreddit, limit=batch_size, status='pending', headless=headless_mode)
        await websocket.send_json({
            "type": "progress", 
            "subreddit": subreddit, 
            "batch": i + 1, 
            "total_batches": total_batches
        })
        await asyncio.sleep(2)

async def pipeline_worker(websocket: WebSocket, open_page: bool, keywords_only: bool, session: ReanalysisSession):
    try:
        subreddits = await get_active_subreddits()
        if not subreddits:
            await websocket.send_json({"type": "error", "message": "No active subreddits found."})
            return

        ignored_words = await get_all_ignored_words()

        for sub in subreddits:
            if session.stop_event.is_set():
                break
            
            if open_page:
                await run_network_reanalysis(sub, websocket, session)
            else:
                await run_local_reanalysis(sub, websocket, ignored_words, session, keywords_only)

        if not session.stop_event.is_set():
            await websocket.send_json({"type": "complete", "message": "Reanalysis pipeline finished successfully."})
            
    except Exception as e:
        logging.error(f"Pipeline worker error: {e}")
        await websocket.send_json({"type": "error", "message": f"Server Error: {str(e)}"})

@router.websocket("/ws/reanalyze")
async def reanalyze_endpoint(websocket: WebSocket):
    await websocket.accept()
    logging.info("Frontend Client Connected to Native FastAPI Reanalysis Socket.")
    
    session = ReanalysisSession()
    
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            
            if action == "start":
                if session.active_task and not session.active_task.done():
                    await websocket.send_json({"type": "error", "message": "A reanalysis job is already running. Stop it first."})
                    continue
                    
                open_page = data.get("open_page", False)
                keywords_only = data.get("keywords_only", False)
                
                mode = "NETWORK SCRAPE" if open_page else ("LOCAL CPU (Keywords Only)" if keywords_only else "LOCAL CPU (Full NLP)")
                await websocket.send_json({"type": "status", "message": f"Trigger received. Mode: {mode}"})
                
                session.stop_event.clear()
                session.pause_event.set()
                
                session.active_task = asyncio.create_task(pipeline_worker(websocket, open_page, keywords_only, session))
                
            elif action == "pause":
                session.pause_event.clear()
                await websocket.send_json({"type": "status", "message": "Job paused. Waiting for resume..."})
                
            elif action == "resume":
                session.pause_event.set()
                await websocket.send_json({"type": "status", "message": "Job resumed."})
                
            elif action == "stop":
                session.stop_event.set()
                session.pause_event.set() 
                await websocket.send_json({"type": "status", "message": "Termination signal sent. Shutting down worker..."})
                
    except WebSocketDisconnect:
        logging.info("Frontend Client Disconnected from Reanalysis Socket.")
        session.stop_event.set()
        session.pause_event.set()
    except Exception as e:
        logging.error(f"Native WebSocket Error: {e}")