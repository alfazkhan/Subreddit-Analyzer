import os
import asyncio
import logging
from playwright.async_api import async_playwright
from config import AUTH_FILE, semaphore
from database import (
    save_post_to_db, get_archived_ids, get_queued_ids, add_to_queue, 
    update_queue_status, get_queue_tasks_by_status, get_db_pool,
    get_oldest_post_id
)
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

async def scrape_post_by_id(context, post_id: str, subreddit: str):
    """
    Performs a deep scrape of a single post URL.
    Optimized with native shadow-piercing locators and structural fallbacks.
    """
    async with semaphore:
        page = await context.new_page()
        clean_id = post_id.replace("t3_", "")
        url = f"https://www.reddit.com/r/{subreddit}/comments/{clean_id}"
        
        try:
            logging.info(f"Scraper: Opening post {clean_id}...")
            await page.goto(url, wait_until="load", timeout=45000)
            
            # Use native shadow-piercing selector wait boundaries instead of raw JS injection
            try:
                await page.wait_for_selector('h1', timeout=10000, state="attached")
            except Exception:
                logging.warning(f"Scraper: Top-tier h1 selector missing for post {clean_id}. Trying fallbacks.")

            # Attempt multi-selector extraction arrays to handle layout variations
            title = ""
            for selector in ['h1', '[post-title]', 'shreddit-title', 'title']:
                loc = page.locator(selector).first
                if await loc.count() > 0:
                    raw_text = await loc.inner_text() or await loc.get_attribute('title') or ""
                    if raw_text.strip():
                        title = raw_text.strip()
                        break

            # Fallback Validation Check: Prevent blank database inserts
            if not title:
                logging.error(f"Scraper: Unable to resolve title headers for post {clean_id}. Aborting task.")
                await update_queue_status(post_id, 'failed')
                return None

            if "reddit" in title.lower() and len(title) < 15:
                await update_queue_status(post_id, 'failed')
                return None

            # Safe extraction of post content blocks
            body_loc = page.locator('shreddit-post-text-body').first
            content = await body_loc.inner_text() if await body_loc.count() > 0 else ""
            
            # Safe extraction of temporal variables without hard stalling
            time_loc = page.locator('time').first
            ts = ""
            if await time_loc.count() > 0:
                ts = await time_loc.get_attribute('datetime') or ""

            # Standardized Post Data Object
            post_entry = {
                "id": post_id, 
                "timestamp": ts, 
                "title": title, 
                "body": content,
                "sentiment": get_sentiment(f"{title} {content}"),
                "keywords": extract_keywords(f"{title} {content}", set()),
                "entities": extract_entities(f"{title} {content}")
            }
            
            await save_post_to_db(post_entry, subreddit)
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

async def run_discovery_cycle(subreddit: str, stop_mode: str = 'routine', headless: bool = False):
    """
    Scans the New feed. 
    'routine' stops at the first archived ID. 
    'bootstrap' stops at the oldest archived post.
    """
    archived_ids = await get_archived_ids(subreddit)
    queued_ids = await get_queued_ids(subreddit)
    oldest_id = await get_oldest_post_id(subreddit)
    
    boundary_ids = archived_ids | queued_ids

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
        page = await context.new_page()
        
        try:
            await page.goto(f"https://www.reddit.com/r/{subreddit}/new", wait_until="load")
            stop_scrolling = False
            
            while not stop_scrolling:
                posts = await page.locator('shreddit-post').all()
                new_ids = []
                
                for p_el in posts:
                    pid, _ = await get_post_metadata(p_el)
                    if not pid: continue
                    
                    if stop_mode == 'routine' and pid in archived_ids:
                        logging.info(f"Discovery: Hit archive boundary {pid}. Stopping.")
                        stop_scrolling = True
                        break
                    
                    if stop_mode == 'bootstrap' and pid == oldest_id:
                        logging.info(f"Discovery: Reached oldest ID {pid}. Stopping.")
                        stop_scrolling = True
                        break
                        
                    if pid not in boundary_ids:
                        new_ids.append(pid)
                        boundary_ids.add(pid)
                
                if new_ids:
                    pool = await get_db_pool()
                    async with pool.acquire() as conn:
                        await add_to_queue(conn, new_ids, subreddit)

                if stop_scrolling: break
                
                js_scroll_logic = "(document.scrollingElement || document.documentElement || document.body || {scrollHeight: 0})"
                prev_h = await page.evaluate(f"{js_scroll_logic}.scrollHeight")
                await page.evaluate(f"window.scrollTo(0, {js_scroll_logic}.scrollHeight)")
                await asyncio.sleep(4)
                if (await page.evaluate(f"{js_scroll_logic}.scrollHeight")) == prev_h:
                    break
        finally:
            await browser.close()

async def process_queue_batch(subreddit: str, limit: int = 15, status: str = 'pending', headless: bool = False):
    """Processes a specific batch of IDs from the queue sequentially."""
    tasks = await get_queue_tasks_by_status(subreddit, status, limit)
    if not tasks:
        return

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
                await scrape_post_by_id(context, t['post_id'], subreddit)
        finally:
            await browser.close()