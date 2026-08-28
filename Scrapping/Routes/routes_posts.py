from typing import Optional
from fastapi import APIRouter, Query, Body, Depends, HTTPException
import json

from auth_guard import require_role
from database.posts import (
    get_db_pool, get_cache_summary, load_posts_from_db, load_all_posts_from_db,
    db_update_post, db_delete_post
)

router = APIRouter(tags=["Posts Endpoint Layer"])

@router.get("/summary")
async def api_get_summary():
    return await get_cache_summary()

@router.get("/posts/{subreddit}")
async def api_get_posts(subreddit: str, limit: int = Query(10, ge=1, le=20000)):
    posts_dict = await load_posts_from_db(subreddit, limit)
    if not posts_dict: 
        return []
    return sorted(posts_dict.values(), key=lambda x: x.get('timestamp') or '', reverse=True)[:limit]

@router.get("/posts/{subreddit}/all")
async def api_get_all_posts(subreddit: str):
    posts_dict = await load_all_posts_from_db(subreddit)
    if not posts_dict:
        return []
    return sorted(posts_dict.values(), key=lambda x: x.get('timestamp') or '', reverse=True)


@router.put("/posts/{subreddit}/{post_id}")
async def api_update_post(
    subreddit: str,
    post_id: str,
    payload: dict = Body(...),
    super_admin: dict = Depends(require_role(["Super Admin"]))
):
    allowed_fields = {"title", "body", "sentiment", "sentiment_scores", "keywords", "entities", "topics"}
    updates = {k: payload[k] for k in payload if k in allowed_fields}

    if not updates:
        raise HTTPException(status_code=400, detail="No valid post fields provided for update.")

    success = await db_update_post(post_id, updates)
    if not success:
        raise HTTPException(status_code=404, detail="Post not found")

    return {"message": "Post updated successfully", "id": post_id}


@router.delete("/posts/{subreddit}/{post_id}")
async def api_delete_post(
    subreddit: str,
    post_id: str,
    super_admin: dict = Depends(require_role(["Super Admin"]))
):
    success = await db_delete_post(post_id)
    if not success:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Post deleted successfully", "id": post_id}


@router.get("/keywords")
async def api_get_keywords(
    subreddit: Optional[str] = Query(None, description="Optional subreddit name to filter keywords"),
    min_frequency: int = Query(1, ge=1, description="Minimum frequency threshold"),
    limit: int = Query(500, ge=1, le=5000, description="Max keywords to return")
):
    """
    Returns aggregated keyword list with frequencies, sentiment distributions,
    and reported status from the ignored_words table.
    """
    pool = await get_db_pool()
    
    if subreddit:
        query = """
            WITH aggregated_keywords AS (
                SELECT 
                    kw.key AS word,
                    SUM(CAST(kw.value AS INTEGER)) AS frequency,
                    COALESCE(SUM(CAST(kw.value AS INTEGER)) FILTER (WHERE LOWER(p.sentiment) = 'positive'), 0) AS positive_count,
                    COALESCE(SUM(CAST(kw.value AS INTEGER)) FILTER (WHERE LOWER(p.sentiment) = 'neutral'), 0) AS neutral_count,
                    COALESCE(SUM(CAST(kw.value AS INTEGER)) FILTER (WHERE LOWER(p.sentiment) = 'negative'), 0) AS negative_count
                FROM reddit_posts p
                JOIN subreddits s ON p.subreddit_id = s.id
                CROSS JOIN LATERAL jsonb_each_text(p.keywords::jsonb) AS kw
                WHERE s.name = $1 
                  AND p.keywords IS NOT NULL 
                  AND p.keywords::text != '{}'
                GROUP BY kw.key
                HAVING SUM(CAST(kw.value AS INTEGER)) >= $2
                ORDER BY frequency DESC
                LIMIT $3
            )
            SELECT 
                ak.word,
                ak.frequency,
                ak.positive_count,
                ak.neutral_count,
                ak.negative_count,
                CASE 
                    WHEN iw.id IS NOT NULL THEN jsonb_build_object(
                        'id', iw.id,
                        'language', iw.language,
                        'processed', iw.processed,
                        'approved', iw.approved
                    )::text
                    ELSE NULL 
                END AS reported_data
            FROM aggregated_keywords ak
            LEFT JOIN ignored_words iw ON TRIM(LOWER(ak.word)) = TRIM(LOWER(iw.word));
        """
        params = [subreddit, min_frequency, limit]
    else:
        query = """
            WITH aggregated_keywords AS (
                SELECT 
                    kw.key AS word,
                    SUM(CAST(kw.value AS INTEGER)) AS frequency,
                    COALESCE(SUM(CAST(kw.value AS INTEGER)) FILTER (WHERE LOWER(p.sentiment) = 'positive'), 0) AS positive_count,
                    COALESCE(SUM(CAST(kw.value AS INTEGER)) FILTER (WHERE LOWER(p.sentiment) = 'neutral'), 0) AS neutral_count,
                    COALESCE(SUM(CAST(kw.value AS INTEGER)) FILTER (WHERE LOWER(p.sentiment) = 'negative'), 0) AS negative_count
                FROM reddit_posts p
                CROSS JOIN LATERAL jsonb_each_text(p.keywords::jsonb) AS kw
                WHERE p.keywords IS NOT NULL 
                  AND p.keywords::text != '{}'
                GROUP BY kw.key
                HAVING SUM(CAST(kw.value AS INTEGER)) >= $1
                ORDER BY frequency DESC
                LIMIT $2
            )
            SELECT 
                ak.word,
                ak.frequency,
                ak.positive_count,
                ak.neutral_count,
                ak.negative_count,
                CASE 
                    WHEN iw.id IS NOT NULL THEN jsonb_build_object(
                        'id', iw.id,
                        'language', iw.language,
                        'processed', iw.processed,
                        'approved', iw.approved
                    )::text
                    ELSE NULL 
                END AS reported_data
            FROM aggregated_keywords ak
            LEFT JOIN ignored_words iw ON TRIM(LOWER(ak.word)) = TRIM(LOWER(iw.word));
        """
        params = [min_frequency, limit]

    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, *params)
            
        results = []
        for row in rows:
            raw_rep = row["reported_data"]
            if raw_rep is not None:
                reported_val = json.loads(raw_rep) if isinstance(raw_rep, str) else raw_rep
            else:
                reported_val = False

            results.append({
                "word": row["word"],
                "frequency": row["frequency"],
                "sentiment_distribution": {
                    "positive": row["positive_count"],
                    "neutral": row["neutral_count"],
                    "negative": row["negative_count"]
                },
                "reported": reported_val
            })
            
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database aggregation failed: {str(e)}")


@router.get("/keywords/{word}")
async def api_get_keyword_posts(
    word: str,
    subreddit: Optional[str] = Query(None, description="Optional subreddit name filter")
):
    """
    Fetches all post IDs containing a specific keyword using PostgreSQL JSON containment operators.
    """
    clean_word = word.strip().lower()
    if not clean_word:
        raise HTTPException(status_code=400, detail="Invalid keyword provided.")

    pool = await get_db_pool()
    
    if subreddit:
        query = """
            SELECT p.id
            FROM reddit_posts p
            JOIN subreddits s ON p.subreddit_id = s.id
            WHERE s.name = $1
              AND p.keywords::jsonb ? $2
            ORDER BY p.timestamp DESC;
        """
        params = [subreddit, clean_word]
    else:
        query = """
            SELECT p.id
            FROM reddit_posts p
            WHERE p.keywords::jsonb ? $1
            ORDER BY p.timestamp DESC;
        """
        params = [clean_word]

    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, *params)
            
        return {
            "keyword": clean_word,
            "posts": [row["id"] for row in rows]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database lookup failed: {str(e)}")