import asyncio
import websockets
import json
from config import SCRAPE_INTERVAL
from database import get_cache_summary
from scraper import run_scraper

# Ensures background and UI tasks don't fight for the browser
is_scraping = asyncio.Lock()
background_subreddits = ["Mumbai", "India", "Munich", "AskIndianWomen", "BoycottIsrael", "LegalAdviceIndia"]

async def background_worker():
    """Silently updates the database for preset subreddits every 15 minutes."""
    while True:
        for sub in background_subreddits:
            if is_scraping.locked():
                await asyncio.sleep(60); continue
                
            async with is_scraping:
                print(f"Background Update: r/{sub}")
                try:
                    await run_scraper(None, sub, 15)
                except Exception as e:
                    print(f"Worker Error: {e}")
            await asyncio.sleep(10)
        await asyncio.sleep(SCRAPE_INTERVAL)

async def handler(websocket):
    """Handles incoming WebSocket commands from the UI."""
    # Send current DB status on connection
    summary = await get_cache_summary()
    await websocket.send(json.dumps({"type": "cache_summary", "message": summary}))

    async for message in websocket:
        data = json.loads(message)
        if data.get('type') == 'start_scrape':
            async with is_scraping:
                await run_scraper(websocket, data['subreddit'], data['count'], data.get('useOnlyCache', False))

async def main():
    """Starts both the background worker and the WebSocket server."""
    print("Services starting on 192.168.0.246:8765...")
    server = websockets.serve(handler, "192.168.0.246", 8765)
    await asyncio.gather(server, background_worker())

if __name__ == "__main__":
    asyncio.run(main())