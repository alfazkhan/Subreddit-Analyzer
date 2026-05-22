import asyncio
import logging
import os
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from scraper_v2 import process_queue_batch
from nlp_processor import get_sentiment, extract_keywords, extract_entities, classify_topics

# Domain-specific explicit database module assignments
from database.subreddits import db_get_all_subreddits
from database.posts import (
    get_archived_ids, get_post_content_for_reanalysis, 
    get_post_keywords_for_cleaning, update_post_nlp_data, update_post_keywords_only
)
from database.queue_manager import force_requeue_posts
from database.ignored_words import get_all_ignored_words

router = APIRouter()

IS_PRODUCTION = os.getenv("APP_ENV") == "production"
headless_mode = True if IS_PRODUCTION else True


class GlobalPipelineManager:
    """
    Enterprise-grade Singleton tracking matrix managing pipeline execution metrics,
    state flags, and all connected global UI WebSocket channels.
    """
    def __init__(self):
        self.active_task = None
        self.stop_event = asyncio.Event()
        self.pause_event = asyncio.Event()
        self.pause_event.set()
        
        # Live connected WebSocket pools
        self.connected_websockets = set()
        
        # Structural Progress State Tracking Cache
        self.current_status = "stopped"  # "running", "paused", "stopped"
        self.subreddit = ""
        self.processed = 0
        self.total = 0
        self.percent = 0.0
        self.message = "System Engine Idle. Awaiting commands."

    async def register_client(self, websocket: WebSocket):
        """Registers a connection and immediately forces a real-time state catch-up packet."""
        self.connected_websockets.add(websocket)
        
        # Direct catch-up execution handshake
        await websocket.send_json({
            "type": "status" if self.current_status != "stopped" else "info",
            "current_status": self.current_status,
            "subreddit": self.subreddit,
            "processed": self.processed,
            "total": self.total,
            "percent": self.percent,
            "message": f"Connected to live stream. Current State: {self.message}"
        })

    def unregister_client(self, websocket: WebSocket):
        """Evicts a dropped channel connection from the broadcast matrix."""
        self.connected_websockets.discard(websocket)

    async def broadcast_payload(self, message_type: str, message_text: str, data_override: dict = None):
        """Pushes state metrics simultaneously out to all connected global browser sessions."""
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
        
        # Layer in structural runtime overrides if provided down trace
        if data_override:
            payload.update(data_override)

        if not self.connected_websockets:
            return

        # Broadcast across active sockets concurrently
        disconnected = []
        for ws in self.connected_websockets:
            try:
                await ws.send_json(payload)
            except Exception:
                disconnected.append(ws)
                
        for ws in disconnected:
            self.unregister_client(ws)

    def reset_metrics(self):
        """Wipes operational caches cleanly when transitioning scopes."""
        self.processed = 0
        self.total = 0
        self.percent = 0.0


# Initialize the global state singleton instance
global_manager = GlobalPipelineManager()


async def run_dictionary_purge_fastlane(subreddit: str, ignored_words: set):
    """
    FAST LANE: Instantly drops matching dictionary keys directly out of 
    stored JSON datasets in memory without invoking heavy ML/NLP text tokenizers.
    """
    global_manager.subreddit = subreddit
    global_manager.reset_metrics()
    
    msg_init = f"r/{subreddit} | Resolving cached records for dictionary fast-lane purge..."
    logging.info(msg_init)
    await global_manager.broadcast_payload("status", msg_init)

    posts = await get_post_keywords_for_cleaning(subreddit)
    total_posts = len(posts)
    if not total_posts:
        msg_empty = f"r/{subreddit} | No cached records discovered to purge."
        logging.info(msg_empty)
        await global_manager.broadcast_payload("info", msg_empty)
        return

    global_manager.total = total_posts
    msg_start = f"r/{subreddit} | Starting dictionary fast-lane purge for {total_posts} entries..."
    logging.info(msg_start)
    await global_manager.broadcast_payload("start", msg_start)

    for count, row in enumerate(posts, 1):
        if global_manager.stop_event.is_set():
            break
        await global_manager.pause_event.wait()

        pid = row['id']
        try:
            current_keywords = json.loads(row['keywords']) if isinstance(row['keywords'], str) else row['keywords'] or {}
        except Exception:
            current_keywords = {}

        cleaned_keywords = {k: v for k, v in current_keywords.items() if k not in ignored_words}
        await update_post_keywords_only(pid, cleaned_keywords)

        #### REAL-TIME PROGRESS TRACKING ####
        percent = round((count / total_posts) * 100, 1)
        msg_prog = f"r/{subreddit} | Fast-Lane Purge Progress: {count}/{total_posts} ({percent}%)"
        
        # Update global metric parameters
        global_manager.processed = count
        global_manager.percent = percent
        
        logging.info(msg_prog)
        await global_manager.broadcast_payload("progress", msg_prog)

        if count % 250 == 0:
            await asyncio.sleep(0)


async def run_full_text_reanalysis(subreddit: str, ignored_words: set):
    """
    FULL SUITE: Re-tokenizes natural language fields across your complete analytical 
    pipeline layers including Sentiment, Entities, and Zero-Shot Topic Classification.
    """
    global_manager.subreddit = subreddit
    global_manager.reset_metrics()

    msg_init = f"r/{subreddit} | Loading historical records from disk for full reprocessing..."
    logging.info(msg_init)
    await global_manager.broadcast_payload("status", msg_init)

    posts = await get_post_content_for_reanalysis(subreddit)
    total_posts = len(posts)
    if not total_posts:
        msg_empty = f"r/{subreddit} | No textual data records found for re-indexing."
        logging.info(msg_empty)
        await global_manager.broadcast_payload("info", msg_empty)
        return

    global_manager.total = total_posts
    msg_start = f"r/{subreddit} | Starting full text NLP & Topic Classification pipeline for {total_posts} entries..."
    logging.info(msg_start)
    await global_manager.broadcast_payload("start", msg_start)

    for count, row in enumerate(posts, 1):
        if global_manager.stop_event.is_set():
            break
        await global_manager.pause_event.wait()

        pid = row['id']
        combined_text = f"{row['title'] or ''} {row['body'] or ''}"
        
        sentiment = get_sentiment(combined_text)
        raw_keywords = extract_keywords(combined_text, ignored_words)
        keywords = list(raw_keywords) if isinstance(raw_keywords, set) else raw_keywords
        entities = extract_entities(combined_text)
        topics = classify_topics(combined_text)
        
        await update_post_nlp_data(pid, sentiment, keywords, entities, topics)
        
        #### REAL-TIME PROGRESS TRACKING ####
        percent = round((count / total_posts) * 100, 1)
        msg_prog = f"r/{subreddit} | Full Reprocessing Progress: {count}/{total_posts} ({percent}%)"
        
        # Update global metric parameters
        global_manager.processed = count
        global_manager.percent = percent
        
        logging.info(msg_prog)
        await global_manager.broadcast_payload("progress", msg_prog)
        
        await asyncio.sleep(0.01)


async def run_network_reanalysis(subreddit: str):
    """NETWORK ROUTE: Forces recorded records back to pending status for dynamic browser scraping updates."""
    global_manager.subreddit = subreddit
    global_manager.reset_metrics()

    msg_init = f"r/{subreddit} | Resolving archived post indexes for browser queue mapping..."
    logging.info(msg_init)
    await global_manager.broadcast_payload("status", msg_init)

    archived_ids = await get_archived_ids(subreddit)
    if not archived_ids:
        msg_empty = f"r/{subreddit} | No historical entries matched for network scraper jobs."
        logging.info(msg_empty)
        await global_manager.broadcast_payload("info", msg_empty)
        return
        
    msg_requeue = f"r/{subreddit} | Resetting queue state flags for {len(archived_ids)} historical entries..."
    logging.info(msg_requeue)
    await global_manager.broadcast_payload("status", msg_requeue)
    await force_requeue_posts(list(archived_ids), subreddit)
    
    batch_size = 15
    total_batches = (len(archived_ids) // batch_size) + 1
    
    global_manager.total = total_batches
    msg_start = f"r/{subreddit} | Commencing browser network sync operations over {total_batches} worker batches..."
    logging.info(msg_start)
    await global_manager.broadcast_payload("start", msg_start)
    
    for i in range(total_batches):
        if global_manager.stop_event.is_set():
            break
        await global_manager.pause_event.wait()

        current_batch = i + 1
        msg_batch = f"r/{subreddit} | Launching automated stealth browser instance for batch {current_batch}/{total_batches}..."
        logging.info(msg_batch)
        await global_manager.broadcast_payload("status", msg_batch)

        await process_queue_batch(subreddit, limit=batch_size, status='pending', headless=headless_mode)
        
        percent = round((current_batch / total_batches) * 100, 1)
        msg_prog = f"r/{subreddit} | Browser Sync Progress: Batch {current_batch}/{total_batches} parsed successfully ({percent}%)"
        
        global_manager.processed = current_batch
        global_manager.percent = percent
        
        logging.info(msg_prog)
        await global_manager.broadcast_payload("progress", msg_prog)
        await asyncio.sleep(2)


async def pipeline_worker(open_page: bool, keywords_only: bool):
    """Asynchronous orchestrator decoupling heavy operations from main WebSocket frame reception listeners."""
    try:
        global_manager.current_status = "running"
        logging.info("Pipeline Worker Thread: Initializing processing tasks...")
        
        all_subs = await db_get_all_subreddits()
        subreddits = [sub['name'] for sub in all_subs if sub.get('is_active') is True]
        
        if not subreddits:
            global_manager.current_status = "stopped"
            msg_err = "Pipeline Worker Thread Blocked: No active subreddits found inside tracking tables."
            logging.error(msg_err)
            await global_manager.broadcast_payload("error", msg_err)
            return

        logging.info(f"Pipeline Worker Thread: Compiling task queue for targets: {', '.join(subreddits)}")
        ignored_words = await get_all_ignored_words()

        for sub in subreddits:
            if global_manager.stop_event.is_set():
                msg_stop = f"Pipeline Worker Thread: Received termination flag. Aborting r/{sub} iterations."
                logging.warning(msg_stop)
                await global_manager.broadcast_payload("warning", msg_stop)
                break
            
            if open_page:
                await run_network_reanalysis(sub)
            elif keywords_only:
                await run_dictionary_purge_fastlane(sub, ignored_words)
            else:
                await run_full_text_reanalysis(sub, ignored_words)

        if not global_manager.stop_event.is_set():
            global_manager.current_status = "stopped"
            msg_fin = "Pipeline Worker Thread: All subreddits processed. Execution sequence completed successfully."
            logging.info(msg_fin)
            await global_manager.broadcast_payload("complete", msg_fin)
            
    except Exception as e:
        global_manager.current_status = "stopped"
        msg_fail = f"Pipeline Worker Thread Crashed: Structural failure down operations path: {str(e)}"
        logging.error(msg_fail)
        await global_manager.broadcast_payload("error", msg_fail)


@router.websocket("/ws/reanalyze")
async def reanalyze_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    # Track the client connection in the global broadcaster pool and run status catch-up
    await global_manager.register_client(websocket)
    logging.info(f"WebSocket Link: Global client attached. Total listeners: {len(global_manager.connected_websockets)}")
    
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            
            if action == "start":
                if global_manager.active_task and not global_manager.active_task.done():
                    msg_busy = "WebSocket Channel Conflict: Start request dropped. An active background worker job is currently executing."
                    logging.warning(msg_busy)
                    await websocket.send_json({
                        "type": "error", 
                        "current_status": global_manager.current_status,
                        "message": msg_busy
                    })
                    continue
                    
                open_page = data.get("open_page", False)
                keywords_only = data.get("keywords_only", False)
                
                mode = "NETWORK SCRAPE" if open_page else ("LOCAL PURGE (Fast-Lane)" if keywords_only else "LOCAL RE-INDEX (Full NLP)")
                msg_trigger = f"WebSocket Action Triggered: Initiating intelligence data reanalysis job. Mode: [{mode}]"
                logging.info(msg_trigger)
                
                global_manager.stop_event.clear()
                global_manager.pause_event.set()
                global_manager.current_status = "running"
                
                # Assign the pipeline to the global manager instance context
                global_manager.active_task = asyncio.create_task(pipeline_worker(open_page, keywords_only))
                await global_manager.broadcast_payload("status", msg_trigger)
                
            elif action == "pause":
                global_manager.pause_event.clear()
                global_manager.current_status = "paused"
                msg_pause = "WebSocket Action Triggered: Job thread suspension requested. Intercepting worker loop..."
                logging.info(msg_pause)
                await global_manager.broadcast_payload("status", msg_pause)
                
            elif action == "resume":
                global_manager.pause_event.set()
                global_manager.current_status = "running"
                msg_resume = "WebSocket Action Triggered: Job thread execution resumption requested. Re-engaging operational pipelines..."
                logging.info(msg_resume)
                await global_manager.broadcast_payload("status", msg_resume)
                
            elif action == "stop":
                global_manager.stop_event.set()
                global_manager.pause_event.set() 
                global_manager.current_status = "stopped"
                msg_stop = "WebSocket Action Triggered: Force shutdown signal received. Safely evicting worker from background threads..."
                logging.info(msg_stop)
                await global_manager.broadcast_payload("status", msg_stop)
                
    except WebSocketDisconnect:
        global_manager.unregister_client(websocket)
        logging.warning(f"WebSocket Link: Client connection dropped. Remaining global listeners: {len(global_manager.connected_websockets)}")
        
        # NOTE: We intentionally DO NOT kill the active_task here anymore!
        # If the page refreshes, the worker continues running in the background.