import asyncpg
import json
import logging
from datetime import datetime
from config import DB_CONFIG

_pool = None

def safe_parse_timestamp(ts_str: str):
    if not ts_str or ts_str in ["", "None"]: return None
    try:
        dt = datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
        return dt.replace(tzinfo=None)
    except Exception: return None

async def get_db_pool():
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(**DB_CONFIG)
    return _pool

async def is_subreddit_bootstrapped(subreddit_name: str):
    """Checks if there are any successfully archived posts for this sub."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        count = await conn.fetchval('''
            SELECT COUNT(*) FROM reddit_posts p
            JOIN subreddits s ON p.subreddit_id = s.id
            WHERE s.name = $1
        ''', subreddit_name)
        return count > 0

async def get_archived_ids(subreddit_name: str):
    """Retrieves all IDs currently in the reddit_posts table."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch('''
            SELECT p.id FROM reddit_posts p
            JOIN subreddits s ON p.subreddit_id = s.id
            WHERE s.name = $1
        ''', subreddit_name)
        return {row[0] for row in rows}

async def get_queued_ids(subreddit_name: str):
    """Retrieves all IDs currently in the scraping_queue."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT post_id FROM scraping_queue WHERE subreddit = $1", subreddit_name)
        return {row[0] for row in rows}

async def get_last_post_timestamp(subreddit_name: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        return await conn.fetchval('''
            SELECT MAX(p.timestamp) FROM reddit_posts p
            JOIN subreddits s ON p.subreddit_id = s.id
            WHERE s.name = $1
        ''', subreddit_name)

async def get_oldest_post_id(subreddit_name: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        return await conn.fetchval('''
            SELECT p.id FROM reddit_posts p
            JOIN subreddits s ON p.subreddit_id = s.id
            WHERE s.name = $1 ORDER BY p.timestamp ASC LIMIT 1
        ''', subreddit_name)

async def add_to_queue(conn, post_ids: list, subreddit: str):
    if not post_ids: return
    await conn.executemany('''
        INSERT INTO scraping_queue (post_id, subreddit) 
        VALUES ($1, $2) ON CONFLICT (post_id) DO NOTHING
    ''', [(pid, subreddit) for pid in post_ids])

async def update_queue_status(post_id: str, status: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute("UPDATE scraping_queue SET status = $1 WHERE post_id = $2", status, post_id)

async def get_queue_tasks_by_status(subreddit: str, status: str, limit: int):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        return await conn.fetch('''
            SELECT post_id FROM scraping_queue 
            WHERE subreddit = $1 AND status = $2 LIMIT $3
        ''', subreddit, status, limit)

async def save_post_to_db(post_entry: dict, subreddit_name: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id FROM subreddits WHERE name = $1", subreddit_name)
        sub_id = row['id'] if row else await conn.fetchval("INSERT INTO subreddits (name) VALUES ($1) RETURNING id", subreddit_name)
        ts_obj = safe_parse_timestamp(post_entry.get('timestamp'))
        await conn.execute('''
            INSERT INTO reddit_posts (id, subreddit_id, timestamp, title, body, sentiment, keywords, entities)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING
        ''', post_entry['id'], sub_id, ts_obj, post_entry['title'], 
           post_entry['body'], post_entry['sentiment'], 
           json.dumps(post_entry['keywords']), json.dumps(post_entry['entities']))

async def load_posts_from_db(subreddit_name: str, limit: int):
    """Loads a specific number of posts."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch('''
            SELECT p.*, s.name as subreddit_name FROM reddit_posts p
            JOIN subreddits s ON p.subreddit_id = s.id
            WHERE s.name = $1 ORDER BY p.timestamp DESC LIMIT $2
        ''', subreddit_name, limit)
        data_dict = {}
        for row in rows:
            d = dict(row)
            if d.get('timestamp'): d['timestamp'] = d['timestamp'].isoformat()
            data_dict[d['id']] = d
        return data_dict

# --- NEW FUNCTION: RETRIEVE ENTIRE ARCHIVE ---
async def load_all_posts_from_db(subreddit_name: str):
    """
    Fetches all archived posts for a subreddit without a limit.
   
    """
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch('''
            SELECT p.*, s.name as subreddit_name FROM reddit_posts p
            JOIN subreddits s ON p.subreddit_id = s.id
            WHERE s.name = $1 ORDER BY p.timestamp DESC
        ''', subreddit_name)
        data_dict = {}
        for row in rows:
            d = dict(row)
            if d.get('timestamp'): d['timestamp'] = d['timestamp'].isoformat()
            data_dict[d['id']] = d
        return data_dict

async def get_cache_summary():
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch('''
            SELECT s.name, COUNT(p.id) as count, MAX(p.timestamp) as last_updated FROM subreddits s 
            LEFT JOIN reddit_posts p ON s.id = p.subreddit_id GROUP BY s.name
        ''')
        return {r['name']: {"count": r['count'], "last_updated": r['last_updated'].isoformat() if r['last_updated'] else None} for r in rows}