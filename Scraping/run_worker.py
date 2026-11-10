import asyncio
import gc
import logging
from datetime import datetime, timezone
import torch
from config import SCRAPE_INTERVAL
from database.core import get_db_pool
from database.posts import get_last_post_timestamp
from database.subreddits import (
    is_subreddit_bootstrapped, 
    get_active_subreddits, 
    get_subreddit_last_gap_scan
)
from scraper_v2 import run_discovery_scan, process_queue_batch
from shared_ui import ui_manager

from rich.logging import RichHandler

logging.basicConfig(
    level=logging.INFO, format='BACKGROUND-WORKER: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S', handlers=[RichHandler(rich_tracebacks=True, show_time=True, show_path=False)], force=True
)

async def background_worker():
    # Start the Rich Live dashboard
    ui_manager.start_live()

    # 1. Clear out tasks stuck in "processing" state from a previous restart
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            await conn.execute("UPDATE scraping_queue SET status = 'pending' WHERE status = 'processing'")
            logging.info("Successfully reset zombie 'processing' tasks back to 'pending'.")
        ui_manager.update(action="Reset Zombie Tasks", last_result="✓ Zombies cleared")
        await ui_manager.refresh_db_counts()
    except Exception as e:
        logging.error(f"Could not reset zombie tasks: {e}")

    while True:
        logging.info("Starting background maintenance discovery cycle.")
        ui_manager.update(subreddit="All", action="Starting Cycle", current_post="-", last_result="-")
        await ui_manager.refresh_db_counts()
        total_scraped_this_cycle = 0

        try:
            background_subreddits = await get_active_subreddits()
        except Exception as database_error:
            logging.error(f"Error pulling active subreddits: {database_error}")
            background_subreddits = []
        
        for sub in background_subreddits:
            try:
                logging.info(f"--- Checking queue and feed status for r/{sub} ---")
                ui_manager.update(subreddit=f"r/{sub}", action="Checking Status", current_post="-")
                
                # Check bootstrap status and last gap scan timestamp
                is_booted = await is_subreddit_bootstrapped(sub)
                last_scan = await get_subreddit_last_gap_scan(sub)
                last_post_ts = await get_last_post_timestamp(sub)
                
                reference_ts = last_scan or last_post_ts
                now = datetime.now(timezone.utc) if reference_ts and reference_ts.tzinfo else datetime.now()
                gap_seconds = (now - reference_ts).total_seconds() if reference_ts else 3601

                # 1. Discovery Scanner execution if unbootstrapped or if gap > 1 hour
                if not is_booted:
                    logging.info(f"Subreddit r/{sub} not bootstrapped. Ingesting initial history.")
                    ui_manager.update(action="Bootstrap Scan")
                    await run_discovery_scan(sub, mode='bootstrap', headless=True)
                elif gap_seconds > 3600:
                    logging.info(f"Data gap of {int(gap_seconds/60)} mins detected for r/{sub}. Running routine scan.")
                    ui_manager.update(action="Routine Scan")
                    await run_discovery_scan(sub, mode='routine', headless=True)

                # 2. Retry up to 5 previously failed tasks (also subject to 7-day maturity)
                ui_manager.update(action="Retrying Failed Tasks")
                failed_processed = await process_queue_batch(sub, limit=5, status='failed', headless=True)
                total_scraped_this_cycle += (failed_processed or 0)

                # 3. Process FIFO pending queue tasks (oldest matured posts first)
                ui_manager.update(action="Processing Pending Queue")
                pending_processed = await process_queue_batch(sub, limit=15, status='pending', headless=True)
                total_scraped_this_cycle += (pending_processed or 0)
                
                if pending_processed == 0:
                    logging.info(f"r/{sub} progress: 0 items archived (No pending tasks older than 7 days).")
                    ui_manager.update(action="Idle", last_result="No matured tasks")
                else:
                    logging.info(f"r/{sub} progress: {pending_processed} matured items archived.")
                    ui_manager.update(action="Batch Done", last_result=f"✓ {pending_processed} archived")
                await ui_manager.refresh_db_counts()

            except Exception as e:
                logging.error(f"Error processing subreddit r/{sub}: {e}")
            
            # Post-iteration GPU VRAM cleanup
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            gc.collect()

            await asyncio.sleep(2)
            
        logging.info(
            f"Cycle completed ({total_scraped_this_cycle} matured posts archived across all cities). "
            f"Worker cooling down for {SCRAPE_INTERVAL} seconds."
        )
        ui_manager.update(
            subreddit="All",
            action=f"Cooldown ({SCRAPE_INTERVAL}s)",
            current_post="-",
            last_result=f"Cycle done: {total_scraped_this_cycle} archived"
        )
        await ui_manager.refresh_db_counts()
        await asyncio.sleep(SCRAPE_INTERVAL)

if __name__ == "__main__":
    logging.info("Launching isolated Background Scraper & NLP Processing Engine...")
    asyncio.run(background_worker())