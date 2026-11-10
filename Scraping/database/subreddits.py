from typing import Optional, List, Dict, Any
from .core import get_db_pool, safe_parse_timestamp

async def is_subreddit_bootstrapped(subreddit_name: str) -> bool:
    """Checks whether the subreddit has at least one post in the database."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        count = await conn.fetchval('''
            SELECT COUNT(p.id) 
            FROM reddit_posts p
            JOIN subreddits s ON p.subreddit_id = s.id
            WHERE LOWER(TRIM(s.name)) = LOWER(TRIM($1));
        ''', subreddit_name)
        return bool(count and count > 0)

async def get_active_subreddits():
    """Fetches list of active subreddit names marked for continuous tracking."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch('''
            SELECT name 
            FROM subreddits 
            WHERE keep_updated = TRUE 
            ORDER BY id ASC;
        ''')
        return [row['name'] for row in rows]

async def get_subreddit_last_gap_scan(subreddit_name: str):
    """Retrieves the timestamp of when the feed gap was last scanned."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        return await conn.fetchval('''
            SELECT last_gap_scan 
            FROM subreddits 
            WHERE LOWER(TRIM(name)) = LOWER(TRIM($1));
        ''', subreddit_name)

async def update_last_gap_scan(subreddit_name: str):
    """Updates the last_gap_scan timestamp to NOW() for the given subreddit."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute('''
            UPDATE subreddits 
            SET last_gap_scan = NOW() 
            WHERE LOWER(TRIM(name)) = LOWER(TRIM($1));
        ''', subreddit_name)

async def db_create_subreddit(name: str, description: str = None, total_users: int = None, is_active: bool = True, keep_updated: bool = False, timezone: str = 'UTC'):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        return await conn.fetchval('''
            INSERT INTO subreddits (name, description, total_users, is_active, keep_updated, timezone)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (name) DO UPDATE SET 
                description = EXCLUDED.description,
                total_users = EXCLUDED.total_users,
                is_active = EXCLUDED.is_active,
                keep_updated = EXCLUDED.keep_updated,
                timezone = EXCLUDED.timezone
            RETURNING id;
        ''', name, description, total_users, is_active, keep_updated, timezone)

async def db_get_all_subreddits():
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM subreddits ORDER BY id ASC;")
        return [dict(r) for r in rows]

async def db_get_subreddit(name: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow('''
            SELECT * 
            FROM subreddits 
            WHERE LOWER(TRIM(name)) = LOWER(TRIM($1));
        ''', name)
        return dict(row) if row else None

async def db_update_subreddit(name: str, description: str, total_users: int, is_active: bool, keep_updated: bool, timezone: str = None):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        if timezone:
            status = await conn.execute('''
                UPDATE subreddits 
                SET description = $1, total_users = $2, is_active = $3, keep_updated = $4, timezone = $5
                WHERE LOWER(TRIM(name)) = LOWER(TRIM($6));
            ''', description, total_users, is_active, keep_updated, timezone, name)
        else:
            status = await conn.execute('''
                UPDATE subreddits 
                SET description = $1, total_users = $2, is_active = $3, keep_updated = $4
                WHERE LOWER(TRIM(name)) = LOWER(TRIM($5));
            ''', description, total_users, is_active, keep_updated, name)
        return status == "UPDATE 1"

async def db_delete_subreddit(name: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        status = await conn.execute('''
            DELETE FROM subreddits 
            WHERE LOWER(TRIM(name)) = LOWER(TRIM($1));
        ''', name)
        return status == "DELETE 1"

# ---------------------------------------------------------------------------
# SENTIMENT & DIURNAL FREQUENCY AGGREGATIONS
# ---------------------------------------------------------------------------

async def get_subreddits_sentiment_distribution(subreddit_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Computes overall positive, neutral, and negative sentiment counts
    across active subreddits, as well as per-subreddit breakdowns.
    """
    pool = await get_db_pool()
    args = []
    where_clauses = [
        "p.sentiment IS NOT NULL",
        "p.title NOT ILIKE '%[removed by moderator]%'",
        "p.title NOT ILIKE '%[deleted by user]%'",
        "p.title NOT ILIKE '%[deleted]%'",
        "p.title NOT ILIKE '%[removed]%'"
    ]

    if subreddit_name and subreddit_name.lower() != "all":
        args.append(subreddit_name)
        where_clauses.append(f"LOWER(TRIM(s.name)) = LOWER(TRIM(${len(args)}))")

    where_stmt = " AND ".join(where_clauses)

    query = f"""
        SELECT 
            s.id AS subreddit_id,
            s.name AS subreddit_name,
            s.timezone,
            COUNT(p.id) AS total_posts,
            COALESCE(COUNT(p.id) FILTER (WHERE LOWER(p.sentiment) = 'positive'), 0) AS positive_count,
            COALESCE(COUNT(p.id) FILTER (WHERE LOWER(p.sentiment) = 'neutral'), 0) AS neutral_count,
            COALESCE(COUNT(p.id) FILTER (WHERE LOWER(p.sentiment) = 'negative'), 0) AS negative_count
        FROM subreddits s
        LEFT JOIN reddit_posts p ON p.subreddit_id = s.id AND {where_stmt}
        GROUP BY s.id, s.name, s.timezone
        ORDER BY total_posts DESC;
    """

    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *args)

    by_subreddit = []
    total_positive = 0
    total_neutral = 0
    total_negative = 0
    total_posts = 0

    for r in rows:
        pos = int(r["positive_count"] or 0)
        neu = int(r["neutral_count"] or 0)
        neg = int(r["negative_count"] or 0)
        tot = int(r["total_posts"] or 0)

        total_positive += pos
        total_neutral += neu
        total_negative += neg
        total_posts += tot

        by_subreddit.append({
            "subreddit_id": r["subreddit_id"],
            "subreddit_name": r["subreddit_name"],
            "timezone": r["timezone"] or "UTC",
            "total_posts": tot,
            "counts": {
                "Positive": pos,
                "Neutral": neu,
                "Negative": neg
            },
            "percentages": {
                "Positive": round((pos / tot * 100), 2) if tot > 0 else 0.0,
                "Neutral": round((neu / tot * 100), 2) if tot > 0 else 0.0,
                "Negative": round((neg / tot * 100), 2) if tot > 0 else 0.0
            }
        })

    return {
        "overall": {
            "total_posts": total_posts,
            "counts": {
                "Positive": total_positive,
                "Neutral": total_neutral,
                "Negative": total_negative
            },
            "percentages": {
                "Positive": round((total_positive / total_posts * 100), 2) if total_posts > 0 else 0.0,
                "Neutral": round((total_neutral / total_posts * 100), 2) if total_posts > 0 else 0.0,
                "Negative": round((total_negative / total_posts * 100), 2) if total_posts > 0 else 0.0
            }
        },
        "by_subreddit": by_subreddit
    }

async def get_subreddits_diurnal_frequency(
    subreddit_name: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Computes local hour-by-hour (00:00 - 23:00) positive and negative emotional frequency.
    Converts p.timestamp to each subreddit's assigned local timezone dynamically in SQL.
    Shows the combined average emotions of each subreddit in a single synchronized diurnal cycle.
    """
    pool = await get_db_pool()
    args = []
    where_clauses = [
        "p.timestamp IS NOT NULL",
        "p.sentiment IS NOT NULL",
        "p.title NOT ILIKE '%[removed by moderator]%'",
        "p.title NOT ILIKE '%[deleted by user]%'",
        "p.title NOT ILIKE '%[deleted]%'",
        "p.title NOT ILIKE '%[removed]%'"
    ]

    if subreddit_name and subreddit_name.lower() != "all":
        args.append(subreddit_name)
        where_clauses.append(f"LOWER(TRIM(s.name)) = LOWER(TRIM(${len(args)}))")

    if start_date:
        args.append(safe_parse_timestamp(start_date))
        where_clauses.append(f"p.timestamp >= ${len(args)}::timestamp")

    if end_date:
        args.append(safe_parse_timestamp(end_date))
        where_clauses.append(f"p.timestamp <= ${len(args)}::timestamp")

    where_stmt = " AND ".join(where_clauses)

    query = f"""
        WITH localized_posts AS (
            SELECT 
                p.id,
                p.sentiment,
                COALESCE((p.sentiment_scores->>'positive')::float, (p.sentiment_scores->>'pos')::float, 0.0) AS p_pos,
                COALESCE((p.sentiment_scores->>'negative')::float, (p.sentiment_scores->>'neg')::float, 0.0) AS p_neg,
                EXTRACT(HOUR FROM (p.timestamp AT TIME ZONE COALESCE(NULLIF(s.timezone, ''), 'UTC')))::int AS local_hour
            FROM reddit_posts p
            JOIN subreddits s ON p.subreddit_id = s.id
            WHERE {where_stmt}
        )
        SELECT 
            local_hour,
            COUNT(id) AS post_volume,
            COALESCE(COUNT(id) FILTER (WHERE LOWER(sentiment) = 'positive'), 0) AS positive_count,
            COALESCE(COUNT(id) FILTER (WHERE LOWER(sentiment) = 'negative'), 0) AS negative_count,
            COALESCE(COUNT(id) FILTER (WHERE LOWER(sentiment) = 'neutral'), 0) AS neutral_count,
            ROUND(AVG(p_pos)::numeric, 4) AS avg_pos_score,
            ROUND(AVG(p_neg)::numeric, 4) AS avg_neg_score
        FROM localized_posts
        GROUP BY local_hour
        ORDER BY local_hour ASC;
    """

    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *args)

    hourly_map = {r["local_hour"]: r for r in rows}

    hours = []
    positive_counts = []
    negative_counts = []
    neutral_counts = []
    avg_pos_scores = []
    avg_neg_scores = []
    post_volumes = []

    for h in range(24):
        hours.append(f"{h:02d}:00")
        row = hourly_map.get(h)
        if row:
            positive_counts.append(int(row["positive_count"]))
            negative_counts.append(int(row["negative_count"]))
            neutral_counts.append(int(row["neutral_count"]))
            avg_pos_scores.append(float(row["avg_pos_score"] or 0.0))
            avg_neg_scores.append(float(row["avg_neg_score"] or 0.0))
            post_volumes.append(int(row["post_volume"]))
        else:
            positive_counts.append(0)
            negative_counts.append(0)
            neutral_counts.append(0)
            avg_pos_scores.append(0.0)
            avg_neg_scores.append(0.0)
            post_volumes.append(0)

    return {
        "subreddit": subreddit_name or "All",
        "start_date": start_date,
        "end_date": end_date,
        "labels": hours,
        "metrics": {
            "positive_counts": positive_counts,
            "negative_counts": negative_counts,
            "neutral_counts": neutral_counts,
            "avg_positive_scores": avg_pos_scores,
            "avg_negative_scores": avg_neg_scores,
            "post_volumes": post_volumes
        }
    }