import asyncio
import logging
import sys
import os
from database.subreddits import get_active_subreddits
from scraper_v2 import run_discovery_scan

# Configure standalone logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] DEEP_SCAN: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[logging.StreamHandler(sys.stdout)]
)

# Determine execution environment context
IS_PRODUCTION = os.getenv("APP_ENV") == "production"
headless_mode = True if IS_PRODUCTION else False

async def main():
    # 1. Override Check: Look for command line arguments first
    if len(sys.argv) > 1:
        subreddits = sys.argv[1:]
        logging.info(f"Manual override active. Using provided command-line arguments: {subreddits}")
    else:
        # 2. Fallback: Query the database for active tracking targets
        try:
            logging.info("No manual arguments provided. Fetching active target list from database...")
            subreddits = await get_active_subreddits()
        except Exception as e:
            logging.error(f"Database error while resolving tracking list: {e}")
            return

    if not subreddits:
        logging.warning("No subreddits found to scan. Aborting.")
        return

    logging.info(f"Batch deep scan initiated for: {', '.join(subreddits)}")
    
    for sub in subreddits:
        try:
            # Call the unified scraper function in exhaustive mode
            await run_discovery_scan(sub, mode='exhaustive', headless=headless_mode)
        except Exception as e:
            logging.error(f"Failed to scan r/{sub}: {e}")
        
        # System cooldown between large subreddit scans
        await asyncio.sleep(5)
        
    logging.info("All requested subreddit scans are complete.")

if __name__ == "__main__":
    asyncio.run(main())