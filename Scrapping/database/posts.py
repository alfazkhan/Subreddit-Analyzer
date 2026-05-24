import json
from .core import get_db_pool, safe_parse_timestamp

async def get_archived_ids(subreddit_name: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch('''
            SELECT p.id FROM reddit_posts p
            JOIN subreddits s ON p.subreddit_id = s.id
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

async def save_post_to_db(post_entry: dict, subreddit_name: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id FROM subreddits WHERE name = $1", subreddit_name)
        sub_id = row['id'] if row else await conn.fetchval("INSERT INTO subreddits (name) VALUES ($1) RETURNING id", subreddit_name)
        ts_obj = safe_parse_timestamp(post_entry.get('timestamp'))
        
        await conn.execute('''
            INSERT INTO reddit_posts (id, subreddit_id, timestamp, title, body, sentiment, keywords, entities, topics)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                body = EXCLUDED.body,
                sentiment = EXCLUDED.sentiment,
                keywords = EXCLUDED.keywords,
                entities = EXCLUDED.entities,
                topics = EXCLUDED.topics
        ''', post_entry['id'], sub_id, ts_obj, post_entry['title'], 
           post_entry['body'], post_entry['sentiment'], 
           json.dumps(post_entry['keywords']), json.dumps(post_entry['entities']),
           json.dumps(post_entry['topics']))

async def load_posts_from_db(subreddit_name: str, limit: int):
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
            SELECT s.name, COUNT(p.id) as count, MAX(p.timestamp) as last_updated 
            FROM subreddits s 
            LEFT JOIN reddit_posts p ON s.id = p.subreddit_id 
            WHERE s.is_active = TRUE
            GROUP BY s.name
        ''')
        return {r['name']: {"count": r['count'], "last_updated": r['last_updated'].isoformat() if r['last_updated'] else None} for r in rows}

async def get_post_content_for_reanalysis(subreddit_name: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch('''
            SELECT p.id, p.title, p.body FROM reddit_posts p
            JOIN subreddits s ON p.subreddit_id = s.id
            WHERE s.name = $1
        ''', subreddit_name)
        return [dict(row) for row in rows]

async def get_post_keywords_for_cleaning(subreddit_name: str):
    """Fetches ONLY the post IDs and pre-existing extracted keywords for lightning-fast purification."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch('''
            SELECT p.id, p.keywords FROM reddit_posts p
            JOIN subreddits s ON p.subreddit_id = s.id
            WHERE s.name = $1
        ''', subreddit_name)
        return [dict(row) for row in rows]

async def update_post_nlp_data(post_id: str, sentiment: str, keywords: list, entities: dict, topics: dict):
    """Updates the complete suite including our new classification objects."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute('''
            UPDATE reddit_posts
            SET sentiment = $1, keywords = $2, entities = $3, topics = $4
            WHERE id = $5
        ''', sentiment, json.dumps(keywords), json.dumps(entities), json.dumps(topics), post_id)

async def update_post_keywords_only(post_id: str, keywords: dict):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute('''
            UPDATE reddit_posts
            SET keywords = $1
            WHERE id = $2
        ''', json.dumps(keywords), post_id)
        
async def get_all_posts_for_dynamic_reanalysis(subreddit: str, target_pipelines: list, only_null: bool):
    """
    Dynamically loads text records from PostgreSQL based on the requested features 
    and whether we should only target entries with missing values.
    """
    pool = await get_db_pool()
    
    # Base extraction query mapping
    query = "SELECT id, title, body, sentiment, keywords, entities, topics FROM public.reddit_posts WHERE subreddit_id = (SELECT id FROM public.subreddits WHERE name = $1)"
    
    # Conditional logic array appending
    if only_null and target_pipelines:
        null_clauses = []
        for feature in target_pipelines:
            if feature == "sentiment":
                null_clauses.append("sentiment IS NULL")
            elif feature == "keywords":
                null_clauses.append("keywords IS NULL")
            elif feature == "entities":
                null_clauses.append("entities IS NULL")
            elif feature == "topic":
                # Handles both traditional database NULLs and JSON array '[null]' string values
                null_clauses.append("(topics IS NULL OR topics::text = '[null]')")
        
        if null_clauses:
            query += " AND (" + " OR ".join(null_clauses) + ")"
            
    query += " ORDER BY timestamp DESC;"
    
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, subreddit)
        return [dict(row) for row in rows]