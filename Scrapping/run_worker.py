import asyncio
import gc
import logging
import sys
from datetime import datetime
import torch
from config import SCRAPE_INTERVAL
from database.core import get_db_pool
from database.posts import get_last_post_timestamp
from database.subreddits import is_subreddit_bootstrapped, get_active_subreddits
from scraper_v2 import run_discovery_scan, process_queue_batch

logging.basicConfig(
    level=logging.INFO, format='[%(asctime)s] NIGHTLY-WORKER: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S', handlers=[logging.StreamHandler(sys.stdout)], force=True
)

COOLDOWN_THRESHOLD = 50  # Number of posts to scrape before forcing SCRAPE_INTERVAL pause

def is_outside_window() -> bool:
    # Allowed window: 12:00 AM (00:00) to 06:00 AM (06:00)
    return datetime.now().hour >= 6

async def background_worker():
    if is_outside_window():
        logging.info("Current time is outside the allowed 12 AM - 6 AM window. Exiting immediately.")
        sys.exit(0)

    # Reset zombie tasks stuck in 'processing' state from prior crashes
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            await conn.execute("UPDATE scraping_queue SET status = 'pending' WHERE status = 'processing'")
            logging.info("Reset zombie 'processing' tasks back to 'pending'.")
    except Exception as e:
        logging.error(f"Could not reset zombie tasks: {e}")

    try:
        background_subreddits = await get_active_subreddits()
    except Exception as database_error:
        logging.error(f"Error pulling active subreddits: {database_error}")
        background_subreddits = []

    # Phase 1: Discovery Phase (Discovers new posts and retries failed tasks)
    logging.info("Starting initial discovery and feed scan phase...")
    for sub in background_subreddits:
        if is_outside_window():
            logging.info("6:00 AM cutoff reached during discovery phase. Terminating execution.")
            sys.exit(0)

        try:
            logging.info(f"Checking queue status for r/{sub}")
            await process_queue_batch(sub, limit=50, status='failed', headless=True)
            
            is_booted = await is_subreddit_bootstrapped(sub)
            last_ts = await get_last_post_timestamp(sub)
            gap = (datetime.now() - last_ts).total_seconds() if last_ts else 3601
            
            if not is_booted:
                logging.info(f"Subreddit r/{sub} not found in cache. Ingesting initial bootstrap.")
                await run_discovery_scan(sub, mode='bootstrap', headless=True)
            elif gap > 3600:
                logging.info(f"Data gap of {int(gap/60)} minutes detected for r/{sub}. Updating feed.")
                await run_discovery_scan(sub, mode='routine', headless=True)
                
        except Exception as e:
            logging.error(f"Error during discovery scan for r/{sub}: {e}")

        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        gc.collect()

        await asyncio.sleep(5)

    # Phase 2: Queue Drain Phase (Continuously processes pending items in batches of 15)
    logging.info("Discovery phase complete. Entering queue drain phase...")
    global_scraped_count = 0

    while not is_outside_window():
        total_processed_in_pass = 0
        
        for sub in background_subreddits:
            if is_outside_window():
                logging.info("6:00 AM cutoff reached during queue drain phase. Terminating execution.")
                sys.exit(0)

            # Drain pending posts for this specific subreddit in 15-item chunks
            while not is_outside_window():
                try:
                    processed = await process_queue_batch(sub, limit=15, status='pending', headless=True)
                    if not processed:
                        # Queue is empty for this subreddit
                        break

                    total_processed_in_pass += processed
                    global_scraped_count += processed
                    logging.info(f"Processed {processed} posts for r/{sub} (Total session: {global_scraped_count})")

                    if torch.cuda.is_available():
                        torch.cuda.empty_cache()
                    gc.collect()

                    # Trigger SCRAPE_INTERVAL cooldown if threshold reached
                    if global_scraped_count >= COOLDOWN_THRESHOLD:
                        logging.info(f"Threshold of {COOLDOWN_THRESHOLD} posts reached. Cooling down for {SCRAPE_INTERVAL} seconds...")
                        await asyncio.sleep(SCRAPE_INTERVAL)
                        global_scraped_count = 0

                except Exception as e:
                    logging.error(f"Error processing queue batch for r/{sub}: {e}")
                    break

        # If an entire sweep across all subreddits yielded 0 processed items, queue is completely empty
        if total_processed_in_pass == 0:
            logging.info("All pending queue tasks across all subreddits have been fully processed.")
            break

        await asyncio.sleep(1)

    logging.info("Nightly worker execution completed cleanly. Terminating process.")
    sys.exit(0)

if __name__ == "__main__":
    logging.info("Launching Nightly Scraper & NLP Processing Engine...")
    asyncio.run(background_worker())