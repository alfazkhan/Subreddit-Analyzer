import os
import asyncio
import logging
import sys
import uvicorn
from fastapi import FastAPI, Query
from datetime import datetime
from config import SCRAPE_INTERVAL
from database import (
    get_cache_summary, get_db_pool, load_posts_from_db, 
    load_all_posts_from_db, get_last_post_timestamp, is_subreddit_bootstrapped
)
from scraper_v2 import run_discovery_cycle, process_queue_batch

# Determine execution environment context
IS_PRODUCTION = os.getenv("APP_ENV") == "production"

# Assign environmental runtime variables
headlessMode = True if IS_PRODUCTION else False
API_HOST = "0.0.0.0" if IS_PRODUCTION else "192.168.0.246"

app = FastAPI(title="Reddit BI REST API", version="2.1.0")

logging.basicConfig(
    level=logging.INFO, format='[%(asctime)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S', handlers=[logging.StreamHandler(sys.stdout)], force=True
)

is_scraping = asyncio.Lock()
background_subreddits = ["Mumbai", "India", "Munich", "AskIndianWomen", "LegalAdviceIndia", "BoycottIsrael"]

@app.get("/summary")
async def api_get_summary():
    return await get_cache_summary()

@app.get("/posts/{subreddit}")
async def api_get_posts(subreddit: str, limit: int = Query(10, ge=1, le=100)):
    posts_dict = await load_posts_from_db(subreddit, limit)
    if not posts_dict: return []
    return sorted(posts_dict.values(), key=lambda x: x.get('timestamp') or '', reverse=True)[:limit]

@app.get("/posts/{subreddit}/all")
async def api_get_all_posts(subreddit: str):
    posts_dict = await load_all_posts_from_db(subreddit)
    if not posts_dict:
        return []
    return sorted(posts_dict.values(), key=lambda x: x.get('timestamp') or '', reverse=True)

async def background_worker():
    while True:
        logging.info("Worker: Starting background maintenance cycle.")
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
                    
                    if not is_booted:
                        logging.info(f"Worker: Subreddit r/{sub} not found in cache. Starting initial bootstrap discovery.")
                        await run_discovery_cycle(sub, stop_mode='bootstrap', headless=headlessMode)
                    elif gap > 3600:
                        logging.info(f"Worker: Data gap of {int(gap/60)} minutes detected for r/{sub}. Triggering routine update.")
                        await run_discovery_cycle(sub, stop_mode='routine', headless=headlessMode)
                    else:
                        logging.info(f"Worker: Subreddit r/{sub} data is fresh ({int(gap/60)}m gap). Skipping discovery phase.")
                    
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