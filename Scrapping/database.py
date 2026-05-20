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
    """Retrieves all IDs currently in the scraping_queue using relational tracking."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch('''
            SELECT q.post_id FROM scraping_queue q
            JOIN subreddits s ON q.subreddit_id = s.id
            WHERE s.name = $1
        ''', subreddit_name)
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

async def add_to_queue(conn, post_ids: list, subreddit_name: str):
    """Inserts records into the queue mapping names to foreign keys using an atomic subquery."""
    if not post_ids: return
    await conn.executemany('''
        INSERT INTO scraping_queue (post_id, subreddit_id) 
        VALUES ($1, (SELECT id FROM subreddits WHERE name = $2))
        ON CONFLICT (post_id) DO NOTHING
    ''', [(pid, subreddit_name) for pid in post_ids])

async def update_queue_status(post_id: str, status: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute("UPDATE scraping_queue SET status = $1 WHERE post_id = $2", status, post_id)

async def get_queue_tasks_by_status(subreddit_name: str, status: str, limit: int):
    """Fetches queue tasks filter-matched by relational join conditions."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        return await conn.fetch('''
            SELECT q.post_id FROM scraping_queue q
            JOIN subreddits s ON q.subreddit_id = s.id
            WHERE s.name = $1 AND q.status = $2 LIMIT $3
        ''', subreddit_name, status, limit)

        
async def save_post_to_db(post_entry: dict, subreddit_name: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id FROM subreddits WHERE name = $1", subreddit_name)
        sub_id = row['id'] if row else await conn.fetchval("INSERT INTO subreddits (name) VALUES ($1) RETURNING id", subreddit_name)
        ts_obj = safe_parse_timestamp(post_entry.get('timestamp'))
        
        # Updated to DO UPDATE SET so reanalyzed data actually overwrites old NLP data
        await conn.execute('''
            INSERT INTO reddit_posts (id, subreddit_id, timestamp, title, body, sentiment, keywords, entities)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                body = EXCLUDED.body,
                sentiment = EXCLUDED.sentiment,
                keywords = EXCLUDED.keywords,
                entities = EXCLUDED.entities
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

async def load_all_posts_from_db(subreddit_name: str):
    """Fetches all archived posts for a subreddit without a limit."""
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

async def get_active_subreddits():
    """Fetches a list of subreddits where keep_updated flag evaluates to true."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT name FROM subreddits WHERE keep_updated = TRUE")
        return [row['name'] for row in rows]
    
async def db_create_subreddit(name: str, description: str = None, total_users: int = None, is_active: bool = True, keep_updated: bool = False):
    """Inserts a new subreddit entry or updates configuration fields on collision."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        return await conn.fetchval('''
            INSERT INTO subreddits (name, description, total_users, is_active, keep_updated)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (name) DO UPDATE SET 
                description = EXCLUDED.description,
                total_users = EXCLUDED.total_users,
                is_active = EXCLUDED.is_active,
                keep_updated = EXCLUDED.keep_updated
            RETURNING id
        ''', name, description, total_users, is_active, keep_updated)

async def db_get_all_subreddits():
    """Retrieves all rows out of the subreddits tracking table."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM subreddits ORDER BY name ASC")
        return [dict(r) for r in rows]

async def db_get_subreddit(name: str):
    """Fetches a singular subreddit dataset filter-matched by unique string name."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM subreddits WHERE name = $1", name)
        return dict(row) if row else None

async def db_update_subreddit(name: str, description: str, total_users: int, is_active: bool, keep_updated: bool):
    """Executes a complete targeted column data write matching key name constraints."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        status = await conn.execute('''
            UPDATE subreddits 
            SET description = $1, total_users = $2, is_active = $3, keep_updated = $4
            WHERE name = $5
        ''', description, total_users, is_active, keep_updated, name)
        return status == "UPDATE 1"

async def db_delete_subreddit(name: str):
    """Permanently drops a tracking record out of the subreddits infrastructure layer."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        status = await conn.execute("DELETE FROM subreddits WHERE name = $1", name)
        return status == "DELETE 1"
    
    
# --- ADD THESE TO THE BOTTOM OF database.py ---

async def get_post_content_for_reanalysis(subreddit_name: str):
    """Fetches the title and body of all archived posts locally for CPU processing."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch('''
            SELECT p.id, p.title, p.body FROM reddit_posts p
            JOIN subreddits s ON p.subreddit_id = s.id
            WHERE s.name = $1
        ''', subreddit_name)
        return [dict(row) for row in rows]

async def update_post_nlp_data(post_id: str, sentiment: str, keywords: list, entities: dict):
    """Updates only the intelligence columns of a post without touching metadata."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute('''
            UPDATE reddit_posts
            SET sentiment = $1, keywords = $2, entities = $3
            WHERE id = $4
        ''', sentiment, json.dumps(keywords), json.dumps(entities), post_id)

async def force_requeue_posts(post_ids: list, subreddit_name: str):
    """Pushes known IDs back into the queue and forces status to 'pending'."""
    if not post_ids: return
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.executemany('''
            INSERT INTO scraping_queue (post_id, subreddit_id, status) 
            VALUES ($1, (SELECT id FROM subreddits WHERE name = $2), 'pending')
            ON CONFLICT (post_id) DO UPDATE SET status = 'pending'
        ''', [(pid, subreddit_name) for pid in post_ids])