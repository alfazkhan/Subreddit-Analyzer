import asyncio
import json
from .core import get_db_pool

async def get_queue_state(limit: int = 500):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        # 1. Fetch exact aggregate counts across the entire table
        counts_row = await conn.fetchrow('''
            SELECT 
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'pending') AS pending,
                COUNT(*) FILTER (WHERE status IN ('processing', 'running')) AS processing,
                COUNT(*) FILTER (WHERE status = 'completed') AS completed,
                COUNT(*) FILTER (WHERE status = 'failed') AS failed
            FROM scraping_queue;
        ''')
        
        counts = {
            "total": int(counts_row["total"] or 0),
            "pending": int(counts_row["pending"] or 0),
            "processing": int(counts_row["processing"] or 0),
            "completed": int(counts_row["completed"] or 0),
            "failed": int(counts_row["failed"] or 0),
        }

        # 2. Fetch the top priority tasks (Processing first, then Pending, etc.)
        task_rows = await conn.fetch('''
            SELECT p.*, s.name as subreddit_name 
            FROM scraping_queue p
            JOIN subreddits s ON p.subreddit_id = s.id
            ORDER BY 
                CASE 
                    WHEN p.status IN ('processing', 'running') THEN 1
                    WHEN p.status = 'pending' THEN 2
                    WHEN p.status = 'failed' THEN 3
                    ELSE 4
                END ASC,
                p.created_at ASC
            LIMIT $1;
        ''', limit)
        
        tasks = [dict(row) for row in task_rows]

        return counts, tasks

async def listen_to_queue_changes(callback_func):
    pool = await get_db_pool()
    conn = await pool.acquire()
    
    def on_notification(connection, pid, channel, payload):
        asyncio.create_task(callback_func())

    await conn.add_listener('queue_updates', on_notification)
    return conn