from fastapi import APIRouter, Query

from database.posts import get_cache_summary, load_posts_from_db, load_all_posts_from_db

router = APIRouter(tags=["Posts Endpoint Layer"])

@router.get("/summary")
async def api_get_summary():
    return await get_cache_summary()

@router.get("/posts/{subreddit}")
async def api_get_posts(subreddit: str, limit: int = Query(10, ge=1, le=10000)):
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