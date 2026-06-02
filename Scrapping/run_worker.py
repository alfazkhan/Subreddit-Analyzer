import asyncio
import logging
import sys
from datetime import datetime
from config import SCRAPE_INTERVAL
from database.core import get_db_pool
from database.posts import get_last_post_timestamp
from database.subreddits import is_subreddit_bootstrapped, get_active_subreddits
from scraper_v2 import run_discovery_scan, process_queue_batch

logging.basicConfig(
    level=logging.INFO, format='[%(asctime)s] BACKGROUND-WORKER: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S', handlers=[logging.StreamHandler(sys.stdout)], force=True
)

async def background_worker():
    # Clear out tasks stuck in "processing" state from a previous crash/restart
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            await conn.execute("UPDATE scraping_queue SET status = 'pending' WHERE status = 'processing'")
            logging.info("Successfully reset zombie 'processing' tasks back to 'pending'.")
    except Exception as e:
        logging.error(f"Could not reset zombie tasks: {e}")

    while True:
        logging.info("Starting background maintenance discovery cycle.")
        try:
            background_subreddits = await get_active_subreddits()
        except Exception as database_error:
            logging.error(f"Error pulling active subreddits: {database_error}")
            background_subreddits = []
        
        for sub in background_subreddits:
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
                
                logging.info(f"Processing pending posts queue for r/{sub}")
                await process_queue_batch(sub, limit=15, status='pending', headless=True)
                
            except Exception as e:
                logging.error(f"Error processing subreddit r/{sub}: {e}")
            
            await asyncio.sleep(10)
            
        logging.info(f"All subreddits parsed. Worker cooling down for {SCRAPE_INTERVAL} seconds.")
        await asyncio.sleep(SCRAPE_INTERVAL)

if __name__ == "__main__":
    logging.info("Launching isolated Background Scraper & NLP Processing Engine...")
    asyncio.run(background_worker())