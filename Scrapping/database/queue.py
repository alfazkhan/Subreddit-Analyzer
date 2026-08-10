import asyncio
import json
from .core import get_db_pool, safe_parse_timestamp

async def get_all_tasks():
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch('''
            SELECT p.*, s.name as subreddit_name FROM scraping_queue p
            JOIN subreddits s ON p.subreddit_id = s.id
            ORDER BY p.created_at DESC
        ''')
        return [dict(row) for row in rows]

async def listen_to_queue_changes(callback_func):
    pool = await get_db_pool()
    conn = await pool.acquire()
    
    def on_notification(connection, pid, channel, payload):
        asyncio.create_task(callback_func())

    await conn.add_listener('queue_updates', on_notification)
    return conn