import os
import asyncio
import logging
import sys
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from config import SCRAPE_INTERVAL
from database.core import get_db_pool
from database.posts import get_last_post_timestamp
from database.subreddits import is_subreddit_bootstrapped, get_active_subreddits

# Updated import to match the unified scrapper function
from scraper_v2 import run_discovery_scan, process_queue_batch

# Import decouple routing modules from the Routes package folder
from Routes import routes_posts, routes_subreddits, routes_reanalyze, routes_ignored_words

# Determine execution environment context
IS_PRODUCTION = os.getenv("APP_ENV") == "production"

# Assign environmental runtime variables
headlessMode = True if IS_PRODUCTION else True
API_HOST = "0.0.0.0" if IS_PRODUCTION else "192.168.0.246"

app = FastAPI(title="Reddit BI REST API", version="2.1.0")

# Configure Cross-Origin Resource Sharing (CORS) Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount endpoints from the package folder
app.include_router(routes_posts.router)
app.include_router(routes_subreddits.router)
app.include_router(routes_reanalyze.router)
app.include_router(routes_ignored_words.router)

logging.basicConfig(
    level=logging.INFO, format='[%(asctime)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S', handlers=[logging.StreamHandler(sys.stdout)], force=True
)

is_scraping = asyncio.Lock()

async def background_worker():
    # Auto-clear zombie tasks that were stuck in "processing" state from a previous restart
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            await conn.execute("UPDATE scraping_queue SET status = 'pending' WHERE status = 'processing'")
            logging.info("Worker: Successfully reset zombie 'processing' tasks back to 'pending'.")
    except Exception as e:
        logging.error(f"Worker: Could not reset zombie tasks: {e}")

    while True:
        logging.info("Worker: Starting background maintenance cycle.")
        
        try:
            background_subreddits = await get_active_subreddits()
        except Exception as database_error:
            logging.error(f"Worker Error pulling targeted subreddits: {database_error}")
            background_subreddits = []

        if not background_subreddits:
            logging.warning("Worker: No active target targets tracked inside database schema.")
        
        for sub in background_subreddits:
            logging.info(f"Worker: Processing targeting checks for r/{sub}")
            async with is_scraping:
                try:
                    logging.info(f"Worker: Clearing previously failed queue tasks for r/{sub}")
                    await process_queue_batch(sub, limit=50, status='failed', headless=headlessMode)
                    
                    logging.info(f"Worker: Checking database bootstrap status for r/{sub}")
                    is_booted = await is_subreddit_bootstrapped(sub)
                    last_ts = await get_last_post_timestamp(sub)
                    gap = (datetime.now() - last_ts).total_seconds() if last_ts else 3601
                    
                    if IS_PRODUCTION:
                        if not is_booted:
                            logging.info(f"Worker: Subreddit r/{sub} not found in cache. Starting initial bootstrap discovery.")
                            await run_discovery_scan(sub, mode='bootstrap', headless=headlessMode)
                        elif gap > 3600:
                            logging.info(f"Worker: Data gap of {int(gap/60)} minutes detected for r/{sub}. Triggering routine update.")
                            await run_discovery_scan(sub, mode='routine', headless=headlessMode)
                        else:
                            logging.info(f"Worker: Subreddit r/{sub} data is fresh ({int(gap/60)}m gap). Skipping discovery phase.")
                    else:
                        logging.info(f"Worker: Local development mode active. Skipping discovery scan for r/{sub}.")
                    
                    logging.info(f"Worker: Ingesting active pending queue tasks for r/{sub}")
                    await process_queue_batch(sub, limit=15, status='pending', headless=headlessMode)
                    
                except Exception as e:
                    logging.error(f"Worker Error processing r/{sub}: {e}")
            
            logging.info(f"Worker: Finished r/{sub} processing block. Cooling down for 10 seconds.")
            await asyncio.sleep(10)
            
        logging.info(f"Worker: All subreddits checked. Cycle sleeping for {SCRAPE_INTERVAL} seconds.")
        await asyncio.sleep(SCRAPE_INTERVAL)

async def main():
    api_config = uvicorn.Config(app, host=API_HOST, port=8000, log_level="info")
    api_server = uvicorn.Server(api_config)
    logging.info(f"System Launch: REST API running on http://{API_HOST}:8000")
    await asyncio.gather(api_server.serve(), background_worker())

if __name__ == "__main__":
    asyncio.run(main())