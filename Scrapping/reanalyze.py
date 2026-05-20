import asyncio
import logging
import sys
import os
import argparse
from config import AUTH_FILE
from database import (
    get_active_subreddits, get_archived_ids,
    get_post_content_for_reanalysis, update_post_nlp_data, force_requeue_posts
)
from scraper_v2 import process_queue_batch
from nlp_processor import get_sentiment, extract_keywords, extract_entities

# Configure standalone logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] REANALYZE: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[logging.StreamHandler(sys.stdout)]
)

IS_PRODUCTION = os.getenv("APP_ENV") == "production"
headless_mode = True if IS_PRODUCTION else False

async def run_local_reanalysis(subreddit: str):
    """
    DEFAULT MODE:
    Processes NLP logic entirely on the local CPU without making network requests.
    Extremely fast, uses 0 internet bandwidth, and avoids anti-bot detections.
    """
    logging.info(f"r/{subreddit} | Starting LOCAL offline text reanalysis...")
    posts = await get_post_content_for_reanalysis(subreddit)
    
    if not posts:
        logging.info(f"r/{subreddit} | No posts found to reanalyze.")
        return

    for count, row in enumerate(posts, 1):
        pid = row['id']
        title = row['title'] or ""
        body = row['body'] or ""
        combined_text = f"{title} {body}"
        
        # Execute NLP models locally via CPU
        sentiment = get_sentiment(combined_text)
        raw_keywords = extract_keywords(combined_text, set())
        keywords = list(raw_keywords) if isinstance(raw_keywords, set) else raw_keywords
        entities = extract_entities(combined_text)
        
        # Patch the new intelligence data into the existing record
        await update_post_nlp_data(pid, sentiment, keywords, entities)
        
        if count % 100 == 0:
            logging.info(f"r/{subreddit} | Processed {count}/{len(posts)} local records...")
            
    logging.info(f"r/{subreddit} | Successfully completed local reanalysis of {len(posts)} records.")

async def run_network_reanalysis(subreddit: str):
    """
    OVERRIDE MODE:
    Pushes IDs to queue and actively scrapes them in batches via the browser.
    """
    logging.info(f"r/{subreddit} | Starting NETWORK reanalysis (Open Page = True)...")
    archived_ids = await get_archived_ids(subreddit)
    
    if not archived_ids:
        logging.info(f"r/{subreddit} | No archived posts found to scrape.")
        return
        
    logging.info(f"r/{subreddit} | Forcing {len(archived_ids)} posts back into the pending queue...")
    await force_requeue_posts(list(archived_ids), subreddit)
    
    # Scrape them in structural batches until the pending queue is clear
    batch_size = 15
    total_batches = (len(archived_ids) // batch_size) + 1
    
    for i in range(total_batches):
        logging.info(f"r/{subreddit} | Processing browser scrape batch {i+1}/{total_batches}...")
        await process_queue_batch(subreddit, limit=batch_size, status='pending', headless=headless_mode)
        await asyncio.sleep(2) # Cooldown between batches
        
    logging.info(f"r/{subreddit} | Finished network reanalysis.")

async def main():
    # Setup Argument Parser
    parser = argparse.ArgumentParser(description="Reanalyze Reddit NLP and Intelligence data.")
    parser.add_argument(
        '--open-page', 
        action='store_true', 
        help="Force the headless browser to re-scrape posts over the network instead of local CPU reanalysis."
    )
    args = parser.parse_args()

    try:
        subreddits = await get_active_subreddits()
    except Exception as e:
        logging.error(f"Database error while resolving tracking list: {e}")
        return

    if not subreddits:
        logging.warning("No active subreddits found to reanalyze.")
        return

    mode_str = "NETWORK SCRAPE (Browser Enabled)" if args.open_page else "LOCAL CPU (Offline Mode)"
    logging.info(f"Starting Intelligence Pipeline. Mode: {mode_str}")

    for sub in subreddits:
        if args.open_page:
            await run_network_reanalysis(sub)
        else:
            await run_local_reanalysis(sub)

    logging.info("Complete reanalysis pipeline finished successfully.")

if __name__ == "__main__":
    asyncio.run(main())