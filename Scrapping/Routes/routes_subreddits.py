from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from typing import Optional, List

from auth_guard import require_role
from database.subreddits import (
    db_create_subreddit, 
    db_get_all_subreddits, 
    db_get_subreddit,
    db_update_subreddit, 
    db_delete_subreddit,
    get_subreddits_sentiment_distribution,
    get_subreddits_diurnal_frequency
)

router = APIRouter(prefix="/subreddits", tags=["Subreddits Control Layer"])

class SubredditBase(BaseModel):
    name: str
    description: Optional[str] = None
    total_users: Optional[int] = None
    is_active: Optional[bool] = True
    keep_updated: Optional[bool] = False
    timezone: Optional[str] = "UTC"

class SubredditUpdate(BaseModel):
    description: Optional[str] = None
    total_users: Optional[int] = None
    is_active: Optional[bool] = True
    keep_updated: Optional[bool] = False
    timezone: Optional[str] = None

# ---------------------------------------------------------------------------
# SENTIMENT & DIURNAL AGGREGATION ENDPOINTS
# STATIC/SPECIFIC ROUTES MUST PRECEDE DYNAMIC /{name} PATH PARAMETER
# ---------------------------------------------------------------------------

@router.get("/sentiments")
async def get_sentiments_distribution(
    subreddit: Optional[str] = Query(None, description="Optional subreddit name filter (e.g., 'Berlin' or 'All')")
):
    """
    Returns overall sentiment distribution (Positive, Neutral, Negative)
    and per-subreddit breakdown.
    """
    try:
        return await get_subreddits_sentiment_distribution(subreddit_name=subreddit)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate subreddit sentiment distribution: {str(e)}"
        )

@router.get("/sentiments/frequency")
async def get_sentiments_frequency(
    subreddit: Optional[str] = Query(None, description="Optional subreddit name to filter"),
    start_date: Optional[str] = Query(None, description="Filter start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter end date (YYYY-MM-DD)")
):
    """
    Returns localized 24-hour diurnal sentiment frequency (00:00 - 23:00).
    Converts timestamps to each city's local timezone so that 12 PM in Berlin
    and 12 PM in Amsterdam align synchronously on the same diurnal axis.
    """
    try:
        return await get_subreddits_diurnal_frequency(
            subreddit_name=subreddit,
            start_date=start_date,
            end_date=end_date
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate diurnal sentiment frequency: {str(e)}"
        )

# ---------------------------------------------------------------------------
# CRUD & TARGET CONFIGURATION ROUTES
# ---------------------------------------------------------------------------

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_new_target(
    payload: SubredditBase,
    super_admin: dict = Depends(require_role(["Super Admin"]))
):
    sub_id = await db_create_subreddit(
        name=payload.name,
        description=payload.description,
        total_users=payload.total_users,
        is_active=payload.is_active,
        keep_updated=payload.keep_updated,
        timezone=payload.timezone or "UTC"
    )
    return {"id": sub_id, "message": "Tracking registry generated successfully"}

@router.get("", response_model=List[dict])
async def list_tracked_targets():
    return await db_get_all_subreddits()

@router.get("/{name}", response_model=dict)
async def fetch_target_details(name: str):
    sub = await db_get_subreddit(name)
    if not sub:
        raise HTTPException(status_code=404, detail="Subreddit targeting configuration not found")
    return sub

@router.put("/{name}")
async def modify_target_configuration(
    name: str,
    payload: SubredditUpdate,
    super_admin: dict = Depends(require_role(["Super Admin"]))
):
    existing = await db_get_subreddit(name)
    if not existing:
        raise HTTPException(status_code=404, detail="Subreddit target entry not found")
    
    success = await db_update_subreddit(
        name=name,
        description=payload.description if payload.description is not None else existing.get('description'),
        total_users=payload.total_users if payload.total_users is not None else existing.get('total_users'),
        is_active=payload.is_active if payload.is_active is not None else existing.get('is_active'),
        keep_updated=payload.keep_updated if payload.keep_updated is not None else existing.get('keep_updated'),
        timezone=payload.timezone if payload.timezone is not None else existing.get('timezone')
    )
    if not success:
        raise HTTPException(status_code=500, detail="Database write operation dropped downstream")
    return {"message": "Tracking settings updated successfully"}

@router.delete("/{name}")
async def untrack_and_purge_target(
    name: str,
    super_admin: dict = Depends(require_role(["Super Admin"]))
):
    success = await db_delete_subreddit(name)
    if not success:
        raise HTTPException(status_code=404, detail="Subreddit target record not found or already deleted")
    return {"message": "Subreddit dropped out of active indexing tables successfully"}