import asyncio
import logging
import sys
import uvicorn
from fastapi import FastAPI, Query
from datetime import datetime
from config import SCRAPE_INTERVAL
from database import (
    get_cache_summary, get_db_pool, load_posts_from_db, 
    load_all_posts_from_db, # New import
    get_last_post_timestamp, is_subreddit_bootstrapped
)
from scraper_v2 import run_discovery_cycle, process_queue_batch

#Common variable to set the browser mode
headlessMode = True

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

# --- NEW ENDPOINT: GET ALL POSTS ---
@app.get("/posts/{subreddit}/all")
async def api_get_all_posts(subreddit: str):
    """
    Retrieves the entire archive for a subreddit from the cache.
   
    """
    posts_dict = await load_all_posts_from_db(subreddit)
    if not posts_dict:
        return []
    # Return sorted data as a clean JSON list
    return sorted(posts_dict.values(), key=lambda x: x.get('timestamp') or '', reverse=True)

async def background_worker():
    while True:
        logging.info("Worker: Starting background maintenance cycle.")
        for sub in background_subreddits:
            async with is_scraping:
                try:
                    await process_queue_batch(sub, limit=50, status='failed', headless=headlessMode)
                    is_booted = await is_subreddit_bootstrapped(sub)
                    last_ts = await get_last_post_timestamp(sub)
                    gap = (datetime.now() - last_ts).total_seconds() if last_ts else 3601
                    if not is_booted:
                        await run_discovery_cycle(sub, stop_mode='bootstrap', headless=headlessMode)
                    elif gap > 3600:
                        await run_discovery_cycle(sub, stop_mode='routine', headless=headlessMode)
                    await process_queue_batch(sub, limit=15, status='pending', headless=headlessMode)
                except Exception as e:
                    logging.error(f"Worker Error r/{sub}: {e}")
            await asyncio.sleep(10)
        await asyncio.sleep(SCRAPE_INTERVAL)

async def main():
    api_config = uvicorn.Config(app, host="192.168.0.246", port=8000, log_level="info")
    api_server = uvicorn.Server(api_config)
    logging.info("System Launch: REST API running on http://192.168.0.246:8000")
    await asyncio.gather(api_server.serve(), background_worker())

if __name__ == "__main__":
    asyncio.run(main())