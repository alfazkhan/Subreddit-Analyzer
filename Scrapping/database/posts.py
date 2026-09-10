import json
import base64
from typing import Optional, Tuple, List, Dict, Any
from datetime import datetime
from .core import get_db_pool, safe_parse_timestamp

def encode_cursor(timestamp: datetime, post_id: str) -> str:
    """Serializes a (timestamp, id) pair into a URL-safe Base64 string."""
    payload = {
        "ts": timestamp.isoformat(),
        "id": post_id
    }
    raw_bytes = json.dumps(payload).encode("utf-8")
    return base64.urlsafe_b64encode(raw_bytes).decode("utf-8")

def decode_cursor(cursor_str: str) -> Optional[Tuple[datetime, str]]:
    """Deserializes a URL-safe Base64 cursor string back into (timestamp, id)."""
    try:
        raw_bytes = base64.urlsafe_b64decode(cursor_str.encode("utf-8"))
        payload = json.loads(raw_bytes.decode("utf-8"))
        ts = safe_parse_timestamp(payload["ts"])
        pid = str(payload["id"])
        if ts and pid:
            return ts, pid
        return None
    except Exception:
        return None

async def fetch_posts_cursor_paginated(
    limit: int = 20,
    cursor: Optional[str] = None,
    direction: str = "next",
    subreddit: Optional[str] = None
) -> Dict[str, Any]:
    pool = await get_db_pool()
    
    # 1. Total Count Query (Subreddit-specific or Global)
    count_query = """
        SELECT COUNT(p.id) 
        FROM reddit_posts p
    """
    count_args = []
    if subreddit:
        count_query += " JOIN subreddits s ON p.subreddit_id = s.id WHERE s.name = $1"
        count_args.append(subreddit)

    async with pool.acquire() as conn:
        total_count = await conn.fetchval(count_query, *count_args)

    # 2. Decode cursor parameters
    decoded = decode_cursor(cursor) if cursor else None
    cursor_ts, cursor_id = decoded if decoded else (None, None)

    # 3. Formulate Cursor Predicates
    query = """
        SELECT 
            p.id,
            p.subreddit_id,
            s.name as subreddit_name,
            p.timestamp,
            p.title,
            p.body,
            p.sentiment,
            p.sentiment_scores,
            p.keywords,
            p.entities,
            p.topics,
            p.score,
            p.upvote_ratio,
            p.num_comments
        FROM reddit_posts p
        JOIN subreddits s ON p.subreddit_id = s.id
        WHERE p.timestamp IS NOT NULL
    """
    args = []

    if subreddit:
        args.append(subreddit)
        query += f" AND s.name = ${len(args)}"

    # Determine pagination comparison based on traversal direction
    if cursor_ts and cursor_id:
        args.append(cursor_ts)
        args.append(cursor_id)
        if direction == "next":
            # Moving backwards in time (older items)
            query += f" AND (p.timestamp, p.id) < (${len(args)-1}::timestamp, ${len(args)})"
        else:
            # Moving forwards in time (newer items)
            query += f" AND (p.timestamp, p.id) > (${len(args)-1}::timestamp, ${len(args)})"

    # Ordering Strategy:
    # 'next' navigates newest to oldest.
    # 'prev' navigates oldest to newest and is then reversed back in memory.
    if direction == "prev":
        query += " ORDER BY p.timestamp ASC, p.id ASC"
    else:
        query += " ORDER BY p.timestamp DESC, p.id DESC"

    # Query limit + 1 to calculate has_more reliably
    args.append(limit + 1)
    query += f" LIMIT ${len(args)};"

    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *args)

    records = []
    for r in rows:
        item = dict(r)
        if item.get("timestamp"):
            item["timestamp"] = item["timestamp"].isoformat()
        
        # Parse JSON fields safely if stored as strings
        for json_col in ["sentiment_scores", "keywords", "entities", "topics"]:
            val = item.get(json_col)
            if isinstance(val, str):
                try:
                    item[json_col] = json.loads(val)
                except Exception:
                    pass
        records.append(item)

    has_more = len(records) > limit
    if has_more:
        # Discard the extra peek record
        records = records[:limit]

    # Normalize 'prev' order back to descending
    if direction == "prev":
        records.reverse()

    # Generate cursors based on page bounds
    next_cursor = None
    prev_cursor = None

    if records:
        first_item = records[0]
        last_item = records[-1]
        
        first_ts = safe_parse_timestamp(first_item["timestamp"])
        last_ts = safe_parse_timestamp(last_item["timestamp"])

        if first_ts:
            prev_cursor = encode_cursor(first_ts, first_item["id"])
        if last_ts:
            next_cursor = encode_cursor(last_ts, last_item["id"])

    return {
        "items": records,
        "next_cursor": next_cursor if has_more or direction == "prev" else None,
        "prev_cursor": prev_cursor if cursor else None,
        "has_more": has_more,
        "total_count": int(total_count or 0)
    }

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
            INSERT INTO reddit_posts (
                id, subreddit_id, timestamp, title, body, sentiment, 
                sentiment_scores, keywords, entities, topics,
                score, upvote_ratio, num_comments
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
            ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                body = EXCLUDED.body,
                timestamp = EXCLUDED.timestamp,
                sentiment = EXCLUDED.sentiment,
                sentiment_scores = EXCLUDED.sentiment_scores,
                keywords = EXCLUDED.keywords,
                entities = EXCLUDED.entities,
                topics = EXCLUDED.topics,
                score = EXCLUDED.score,
                upvote_ratio = EXCLUDED.upvote_ratio,
                num_comments = EXCLUDED.num_comments
        ''', 
           post_entry['id'], 
           sub_id, 
           ts_obj, 
           post_entry['title'], 
           post_entry['body'], 
           post_entry['sentiment'], 
           json.dumps(post_entry.get('sentiment_scores', {})),
           json.dumps(post_entry.get('keywords', {})), 
           json.dumps(post_entry.get('entities', [])),
           json.dumps(post_entry.get('topics', {})),
           int(post_entry.get('score', 0)),
           float(post_entry.get('upvote_ratio', 0.0)),
           int(post_entry.get('num_comments', 0)))

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
            SELECT s.id, s.name, COUNT(p.id) as count, MAX(p.timestamp) as last_updated 
            FROM subreddits s 
            LEFT JOIN reddit_posts p ON s.id = p.subreddit_id 
            WHERE s.is_active = TRUE
            GROUP BY s.id, s.name
        ''')
        return {
            r['name']: {
                "id": r['id'], 
                "count": r['count'], 
                "last_updated": r['last_updated'].isoformat() if r['last_updated'] else None
            } for r in rows
        }

async def db_update_post(post_id: str, updates: dict):
    if not updates:
        return False
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        set_clauses = []
        args = []

        if "title" in updates:
            args.append(updates["title"])
            set_clauses.append(f"title = ${len(args)}")
        if "body" in updates:
            args.append(updates["body"])
            set_clauses.append(f"body = ${len(args)}")
        if "sentiment" in updates:
            args.append(updates["sentiment"])
            set_clauses.append(f"sentiment = ${len(args)}")
        if "sentiment_scores" in updates:
            args.append(json.dumps(updates["sentiment_scores"]))
            set_clauses.append(f"sentiment_scores = ${len(args)}")
        if "keywords" in updates:
            args.append(json.dumps(updates["keywords"]))
            set_clauses.append(f"keywords = ${len(args)}")
        if "entities" in updates:
            args.append(json.dumps(updates["entities"]))
            set_clauses.append(f"entities = ${len(args)}")
        if "topics" in updates:
            args.append(json.dumps(updates["topics"]))
            set_clauses.append(f"topics = ${len(args)}")
        if "score" in updates:
            args.append(int(updates["score"]))
            set_clauses.append(f"score = ${len(args)}")
        if "upvote_ratio" in updates:
            args.append(float(updates["upvote_ratio"]))
            set_clauses.append(f"upvote_ratio = ${len(args)}")
        if "num_comments" in updates:
            args.append(int(updates["num_comments"]))
            set_clauses.append(f"num_comments = ${len(args)}")

        if not set_clauses:
            return False

        args.append(post_id)
        query = f"UPDATE reddit_posts SET {', '.join(set_clauses)} WHERE id = ${len(args)}"
        status = await conn.execute(query, *args)
        return status == "UPDATE 1"

async def db_delete_post(post_id: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        status = await conn.execute('''
            DELETE FROM reddit_posts WHERE id = $1
        ''', post_id)
        return status == "DELETE 1"

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
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch('''
            SELECT p.id, p.keywords FROM reddit_posts p
            JOIN subreddits s ON p.subreddit_id = s.id
            WHERE s.name = $1
        ''', subreddit_name)
        return [dict(row) for row in rows]

async def update_post_nlp_data(post_id: str, sentiment: str, sentiment_scores: dict, keywords: list, entities: dict, topics: dict):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute('''
            UPDATE reddit_posts
            SET sentiment = $1, sentiment_scores = $2, keywords = $3, entities = $4, topics = $5
            WHERE id = $6
        ''', sentiment, json.dumps(sentiment_scores), json.dumps(keywords), json.dumps(entities), json.dumps(topics), post_id)

async def update_post_keywords_only(post_id: str, keywords: dict):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute('''
            UPDATE reddit_posts
            SET keywords = $1
            WHERE id = $2
        ''', json.dumps(keywords), post_id)

async def get_all_posts_for_dynamic_reanalysis(subreddit: str, target_pipelines: list, only_null: bool, start_date: str = None, end_date: str = None):
    pool = await get_db_pool()
    
    query = "SELECT id, title, body, sentiment, sentiment_scores, keywords, entities, topics, score, upvote_ratio, num_comments FROM public.reddit_posts WHERE subreddit_id = (SELECT id FROM public.subreddits WHERE name = $1)"
    args = [subreddit]
    
    if start_date:
        args.append(safe_parse_timestamp(start_date))
        query += f" AND timestamp >= ${len(args)}::timestamp"
        
    if end_date:
        args.append(safe_parse_timestamp(end_date))
        query += f" AND timestamp <= ${len(args)}::timestamp"
    
    if target_pipelines and only_null:
        clauses = []
        for feature in target_pipelines:
            if feature == "sentiment":
                clauses.append("(sentiment IS NULL OR sentiment_scores IS NULL)")
            elif feature == "keywords":
                clauses.append("keywords IS NULL")
            elif feature == "entities":
                clauses.append("entities IS NULL")
            elif feature == "topic":
                clauses.append("(topics IS NULL OR topics::text = '[null]')")
        if clauses:
            query += " AND (" + " OR ".join(clauses) + ")"

    query += " ORDER BY timestamp DESC;"
    
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *args)
        return [dict(row) for row in rows]