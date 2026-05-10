import os
import asyncio
import json
from playwright.async_api import async_playwright
from config import AUTH_FILE, semaphore, IGNORE_WORDS
from database import load_posts_from_db, save_post_to_db
from nlp_processor import get_sentiment, extract_keywords, extract_entities

async def get_post_metadata(post):
    """Extracts ID and Timestamp from a post element."""
    pid = await post.get_attribute("id")
    time_loc = post.locator("time").first
    ts = await time_loc.get_attribute("datetime") if await time_loc.count() > 0 else ""
    return pid, ts

async def scrape_single_post(context, url, pid, ts, websocket, total, tracker, cache, subreddit, is_priority):
    """Individual worker to scrape content and run NLP analysis."""
    async with semaphore:
        page = await context.new_page()
        # Hides the automation flag from websites
        await page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=45000)
            
            title = "[Title Not Found]"
            for sel in ['h1[slot="title"]', 'h1[id^="post-title-"]', 'shreddit-title', 'h1']:
                loc = page.locator(sel).first
                if await loc.is_visible(timeout=3000):
                    title = await loc.inner_text(); break

            content = ""
            for sel in ['shreddit-post-text-body', 'div[slot="text-body"]']:
                loc = page.locator(sel).first
                if await loc.count() > 0:
                    content = await loc.inner_text(timeout=3000)
                    if content: break
            
            full_text = f"{title} {content}"
            post_entry = {
                "id": pid, "timestamp": ts, "title": title, "body": content,
                "sentiment": get_sentiment(full_text),
                "keywords": extract_keywords(full_text, IGNORE_WORDS),
                "entities": extract_entities(full_text)
            }

            cache[pid] = post_entry
            await save_post_to_db(post_entry, subreddit)

            if is_priority and websocket and websocket.state.name == 'OPEN':
                tracker['ui_processed'] += 1
                progress = int((tracker['ui_processed'] / total) * 100)
                await websocket.send(json.dumps({"type": "delta_update", "post": post_entry, "progress": progress}))
            
            return post_entry
        except Exception as e:
            print(f"Error scraping {url}: {e}")
        finally:
            await page.close()

async def run_scraper(websocket, subreddit, count, use_only_cache=False):
    """Coordinates the scraping session."""
    cache = await load_posts_from_db(subreddit, int(count))
    
    if use_only_cache:
        final_selection = sorted(cache.values(), key=lambda x: x.get("timestamp") or "", reverse=True)[:count]
        if websocket:
            await websocket.send(json.dumps({"type": "final_data", "posts": final_selection}))
        return 

    async with async_playwright() as p:
        # Realistic User Agent to avoid 'Bot' detection
        ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        
        browser = await p.chromium.launch(headless=True, args=["--disable-blink-features=AutomationControlled"])
        context = await browser.new_context(user_agent=ua, storage_state=AUTH_FILE if os.path.exists(AUTH_FILE) else None)
        
        main_page = await context.new_page()
        await main_page.goto(f"https://www.reddit.com/r/{subreddit}/new")

        launched_ids, scrape_tasks, tracker = set(), [], {'ui_processed': 0}
        
        while len(scrape_tasks) < count:
            posts = await main_page.locator('shreddit-post').all()
            for p_element in posts:
                if len(scrape_tasks) >= count: break
                pid, ts = await get_post_metadata(p_element)
                
                if not pid or pid in launched_ids or pid in cache: continue
                
                launched_ids.add(pid)
                href = await p_element.locator('a[slot="full-post-link"]').first.get_attribute('href')
                if href:
                    scrape_tasks.append(scrape_single_post(context, f"https://www.reddit.com{href}", pid, ts, websocket, count, tracker, cache, subreddit, bool(websocket)))

            await main_page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(2)

        await asyncio.gather(*scrape_tasks)
        await browser.close()