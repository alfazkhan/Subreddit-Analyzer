import asyncio
import logging
import sys
import json
from database.subreddits import get_active_subreddits
from database.posts import get_post_keywords_for_cleaning, update_post_keywords_only
from database.ignored_words import get_all_ignored_words

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] KEYWORD-PURGE: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[logging.StreamHandler(sys.stdout)],
    force=True
)

async def purge_subreddit_keywords(subreddit: str, ignored_words: set):
    """Purges ignored words directly out of stored keyword dictionaries without re-tokenizing."""
    logging.info(f"r/{subreddit} | Starting background keyword dictionary purge...")
    posts = await get_post_keywords_for_cleaning(subreddit)
    
    total_posts = len(posts)
    if not total_posts:
        logging.info(f"r/{subreddit} | No cached keywords discovered. Skipping.")
        return

    log_interval = max(1, total_posts // 10)

    for count, row in enumerate(posts, 1):
        pid = row['id']
        
        # Safely load the pre-extracted keyword dictionary
        try:
            current_keywords = json.loads(row['keywords']) if isinstance(row['keywords'], str) else row['keywords'] or {}
        except Exception:
            current_keywords = {}

        # Dictionary Comprehension fast-lane: drop keys without calling NLP tokenizers
        cleaned_keywords = {k: v for k, v in current_keywords.items() if k not in ignored_words}
        
        # Push back down if modifications occurred
        await update_post_keywords_only(pid, cleaned_keywords)
        
        if count % log_interval == 0 or count == total_posts:
            percent = round((count / total_posts) * 100, 1)
            logging.info(f"r/{subreddit} | Purge Progress: {count}/{total_posts} records updated ({percent}%)")
            
        if count % 250 == 0:
            await asyncio.sleep(0.001)

async def main():
    logging.info("Starting Headless Keyword Purge Engine...")
    try:
        subreddits = await get_active_subreddits()
        if not subreddits:
            logging.warning("No active subreddits tracked inside systems.")
            return

        ignored_words = await get_all_ignored_words()
        logging.info(f"Loaded {len(ignored_words)} ignored words into processing matrix.")

        for sub in subreddits:
            await purge_subreddit_keywords(sub, ignored_words)

        logging.info("Headless keyword dictionary cleaning operations finished successfully.")
    except Exception as e:
        logging.error(f"Fatal Engine Exception: {e}")

if __name__ == "__main__":
    asyncio.run(main())