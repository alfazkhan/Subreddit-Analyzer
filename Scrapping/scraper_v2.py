import os
import asyncio
import logging
from playwright.async_api import async_playwright
from config import AUTH_FILE, semaphore
from database.core import get_db_pool
from database.posts import save_post_to_db, get_archived_ids, get_oldest_post_id
from database.queue_manager import get_queued_ids, add_to_queue, update_queue_status, get_queue_tasks_by_status
from database.ignored_words import get_all_ignored_words
from nlp_processor import get_sentiment, extract_keywords, extract_entities

async def get_post_metadata(post):
    """Safely extracts post ID and timestamp from a feed element."""
    try:
        pid = await post.get_attribute("id")
        time_loc = post.locator("time").first
        ts = await time_loc.get_attribute("datetime") if await time_loc.count() > 0 else ""
        return pid, ts
    except Exception:
        return None, ""

async def scrape_post_by_id(context, post_id: str, subreddit_name: str, ignored_words: set):
    """
    Performs a deep scrape of a single post URL.
    Optimized with native shadow-piercing locators and structural fallbacks.
    Accepts a dynamic set of ignored words to pass down to the NLP processor.
    """
    async with semaphore:
        page = await context.new_page()
        clean_id = post_id.replace("t3_", "")
        url = f"https://www.reddit.com/r/{subreddit_name}/comments/{clean_id}"
        
        try:
            logging.info(f"Scraper: Opening post {clean_id}...")
            await page.goto(url, wait_until="load", timeout=45000)
            
            try:
                await page.wait_for_selector('h1', timeout=10000, state="attached")
            except Exception:
                logging.warning(f"Scraper: Top-tier h1 selector missing for post {clean_id}. Trying fallbacks.")

            title = ""
            for selector in ['h1', '[post-title]', 'shreddit-title', 'title']:
                loc = page.locator(selector).first
                if await loc.count() > 0:
                    raw_text = await loc.inner_text() or await loc.get_attribute('title') or ""
                    if raw_text.strip():
                        title = raw_text.strip()
                        break

            if not title:
                logging.error(f"Scraper: Unable to resolve title headers for post {clean_id}. Aborting task.")
                await update_queue_status(post_id, 'failed')
                return None

            if "reddit" in title.lower() and len(title) < 15:
                await update_queue_status(post_id, 'failed')
                return None

            body_loc = page.locator('shreddit-post-text-body').first
            content = await body_loc.inner_text() if await body_loc.count() > 0 else ""
            
            time_loc = page.locator('time').first
            ts = await time_loc.get_attribute('datetime') if await time_loc.count() > 0 else ""

            combined_text = f"{title} {content}"

            post_entry = {
                "id": post_id, 
                "timestamp": ts, 
                "title": title, 
                "body": content,
                "sentiment": get_sentiment(combined_text),
                "keywords": extract_keywords(combined_text, ignored_words),
                "entities": extract_entities(combined_text)
            }
            
            await save_post_to_db(post_entry, subreddit_name)
            await update_queue_status(post_id, 'completed')
            logging.info(f"Scraper: Successfully archived {post_id}.")
            return post_entry
            
        except Exception as e:
            logging.error(f"Scraper: Error processing {post_id}: {e}")
            await update_queue_status(post_id, 'failed')
            return None
        finally:
            if not page.is_closed():
                await page.close()

async def run_discovery_scan(subreddit_name: str, mode: str = 'routine', headless: bool = False):
    """
    Unified Discovery Scanner.
    Modes:
      - 'routine': Stops at the first archived ID (Daily Gap Fills).
      - 'bootstrap': Stops at the oldest archived post (Connecting Histories).
      - 'exhaustive': Ignores boundaries, scrolls to the end of the feed (Deep Scans).
    """
    archived_ids = await get_archived_ids(subreddit_name)
    queued_ids = await get_queued_ids(subreddit_name)
    oldest_id = await get_oldest_post_id(subreddit_name) if mode == 'bootstrap' else None
    
    all_known_ids = archived_ids | queued_ids

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        
        # Unified Production Stealth Context
        context = await browser.new_context(
            storage_state=AUTH_FILE if os.path.exists(AUTH_FILE) else None,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1920, "height": 1080},
            locale="en-US",
            timezone_id="America/New_York"
        )
        page = await context.new_page()
        
        try:
            logging.info(f"Discovery: Scanning r/{subreddit_name} in '{mode.upper()}' mode...")
            await page.goto(f"https://www.reddit.com/r/{subreddit_name}/new", wait_until="load", timeout=45000)
            stop_scrolling = False
            total_discovered = 0
            
            while not stop_scrolling:
                posts = await page.locator('shreddit-post').all()
                new_ids = []
                
                for p_el in posts:
                    pid, _ = await get_post_metadata(p_el)
                    if not pid: continue
                    
                    # Core Unified Logic Boundaries
                    if mode == 'routine' and pid in archived_ids:
                        logging.info(f"Discovery: Hit archive boundary {pid}. Stopping.")
                        stop_scrolling = True
                        break
                    
                    if mode == 'bootstrap' and pid == oldest_id:
                        logging.info(f"Discovery: Reached oldest ID {pid}. Stopping.")
                        stop_scrolling = True
                        break
                        
                    if pid not in all_known_ids:
                        new_ids.append(pid)
                        all_known_ids.add(pid)
                
                if new_ids:
                    total_discovered += len(new_ids)
                    pool = await get_db_pool()
                    async with pool.acquire() as conn:
                        await add_to_queue(conn, new_ids, subreddit_name)

                if stop_scrolling: break
                
                js_scroll_logic = "(document.scrollingElement || document.documentElement || document.body || {scrollHeight: 0})"
                prev_h = await page.evaluate(f"{js_scroll_logic}.scrollHeight")
                await page.evaluate(f"window.scrollTo(0, {js_scroll_logic}.scrollHeight)")
                await asyncio.sleep(4)
                if (await page.evaluate(f"{js_scroll_logic}.scrollHeight")) == prev_h:
                    break
                    
            logging.info(f"Discovery: Scan complete for r/{subreddit_name}. Discovered {total_discovered} new tasks.")
        finally:
            await browser.close()

async def process_queue_batch(subreddit_name: str, limit: int = 15, status: str = 'pending', headless: bool = False):
    """Processes a specific batch of IDs from the queue sequentially."""
    tasks = await get_queue_tasks_by_status(subreddit_name, status, limit)
    if not tasks:
        return

    # Fetch the exact list of ignored words at the moment this batch begins
    ignored_words = await get_all_ignored_words()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        
        # Production Stealth Context Override
        context = await browser.new_context(
            storage_state=AUTH_FILE if os.path.exists(AUTH_FILE) else None,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1920, "height": 1080},
            locale="en-US",
            timezone_id="America/New_York"
        )
        try:
            for t in tasks:
                # Pass the dynamically fetched ignored words down to the single post scraper
                await scrape_post_by_id(context, t['post_id'], subreddit_name, ignored_words)
        finally:
            await browser.close()