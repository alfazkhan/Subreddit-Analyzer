import asyncpg
import json
from datetime import datetime
from config import DB_CONFIG

# Global variable for the connection pool
_pool = None

async def get_db_pool():
    """Creates a persistent connection pool for high-performance DB access."""
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(**DB_CONFIG)
    return _pool

def safe_parse_timestamp(ts_str: str):
    """Safely converts Reddit ISO strings to naive datetimes."""
    if not ts_str or ts_str in ["", "None"]:
        return None
    try:
        dt = datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
        return dt.replace(tzinfo=None)
    except Exception:
        return None

async def save_post_to_db(post_entry: dict, subreddit: str):
    """Upserts a post into PostgreSQL."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        ts_obj = safe_parse_timestamp(post_entry.get('timestamp'))
        await conn.execute('''
            INSERT INTO reddit_posts (id, subreddit, timestamp, title, body, sentiment, keywords, entities)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO UPDATE SET
                sentiment = EXCLUDED.sentiment,
                keywords = EXCLUDED.keywords, 
                entities = EXCLUDED.entities
        ''', post_entry['id'], subreddit, ts_obj, post_entry['title'], 
           post_entry['body'], post_entry['sentiment'], 
           json.dumps(post_entry['keywords']), json.dumps(post_entry['entities']))

async def load_posts_from_db(subreddit: str, limit: int):
    """Fetches recently cached posts to avoid redundant scraping."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM reddit_posts WHERE subreddit = $1 ORDER BY timestamp DESC LIMIT $2",
            subreddit, limit
        )
        data_dict = {}
        for row in rows:
            d = dict(row)
            if d.get('timestamp'):
                d['timestamp'] = d['timestamp'].isoformat()
            
            # Ensure JSONB columns are parsed back to objects
            for key in ['keywords', 'entities']:
                if isinstance(d.get(key), str):
                    d[key] = json.loads(d[key])
            data_dict[d['id']] = d
        return data_dict

async def get_cache_summary():
    """Aggregates DB stats for the UI connection greeting."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch('''
            SELECT subreddit, COUNT(*) as post_count, MAX(timestamp) as last_post_time 
            FROM reddit_posts GROUP BY subreddit
        ''')
        return {
            row['subreddit']: {
                "count": row['post_count'],
                "last_updated": row['last_post_time'].isoformat() if row['last_post_time'] else None
            } for row in rows
        }