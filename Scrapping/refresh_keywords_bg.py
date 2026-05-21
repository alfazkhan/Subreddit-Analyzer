import asyncio
import logging
import sys
import os
from database.subreddits import get_active_subreddits
from database.posts import get_post_content_for_reanalysis, update_post_keywords_only
from database.ignored_words import get_all_ignored_words
from nlp_processor import extract_keywords

# Configure standalone logging suitable for background tracking
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] KEYWORD-REFRESH: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[logging.StreamHandler(sys.stdout)],
    force=True
)

async def process_subreddit_keywords(subreddit: str, ignored_words: set):
    """Fetches text, recalculates keywords, and updates the database via fast-lane."""
    logging.info(f"r/{subreddit} | Starting background keyword refresh...")
    posts = await get_post_content_for_reanalysis(subreddit)
    
    total_posts = len(posts)
    if not total_posts:
        logging.info(f"r/{subreddit} | No posts found. Skipping.")
        return

    log_interval = max(1, total_posts // 10)

    for count, row in enumerate(posts, 1):
        pid = row['id']
        combined_text = f"{row['title'] or ''} {row['body'] or ''}"
        
        # Fast extraction using only NLTK and the dynamic database list
        raw_keywords = extract_keywords(combined_text, ignored_words)
        keywords = list(raw_keywords) if isinstance(raw_keywords, set) else raw_keywords
        
        # Execute the fast-lane update
        await update_post_keywords_only(pid, keywords)
        
        # Periodic server log output
        if count % log_interval == 0 or count == total_posts:
            percent = round((count / total_posts) * 100, 1)
            logging.info(f"r/{subreddit} | Progress: {count}/{total_posts} records updated ({percent}%)")
            
        # Yield execution control briefly to prevent CPU locking on the server
        if count % 100 == 0:
            await asyncio.sleep(0.01)

async def main():
    logging.info("Starting Headless Keyword Refresh Engine...")
    
    try:
        subreddits = await get_active_subreddits()
        if not subreddits:
            logging.warning("No active subreddits found.")
            return

        # Fetch the ignored words exactly once before processing all subreddits
        ignored_words = await get_all_ignored_words()
        logging.info(f"Fetched {len(ignored_words)} ignored words from database.")

        for sub in subreddits:
            await process_subreddit_keywords(sub, ignored_words)

        logging.info("Complete background keyword refresh finished successfully.")
        
    except Exception as e:
        logging.error(f"Fatal Engine Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())