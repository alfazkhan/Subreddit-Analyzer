from fastapi import APIRouter, Query, Body, Depends, HTTPException

from auth_guard import require_role
from database.posts import (
    get_cache_summary, load_posts_from_db, load_all_posts_from_db,
    db_update_post, db_delete_post
)

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