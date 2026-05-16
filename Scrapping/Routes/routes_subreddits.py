from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
import database

router = APIRouter(prefix="/subreddits", tags=["Subreddits Control Layer"])

class SubredditBase(BaseModel):
    name: str
    description: Optional[str] = None
    total_users: Optional[int] = None
    is_active: Optional[bool] = True
    keep_updated: Optional[bool] = False

class SubredditUpdate(BaseModel):
    description: Optional[str] = None
    total_users: Optional[int] = None
    is_active: Optional[bool] = True
    keep_updated: Optional[bool] = False

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_new_target(payload: SubredditBase):
    sub_id = await database.db_create_subreddit(
        name=payload.name,
        description=payload.description,
        total_users=payload.total_users,
        is_active=payload.is_active,
        keep_updated=payload.keep_updated
    )
    return {"id": sub_id, "message": "Tracking registry generated successfully"}

@router.get("", response_model=List[dict])
async def list_tracked_targets():
    return await database.db_get_all_subreddits()

@router.get("/{name}", response_model=dict)
async def fetch_target_details(name: str):
    sub = await database.db_get_subreddit(name)
    if not sub:
        raise HTTPException(status_code=404, detail="Subreddit targeting configuration not found")
    return sub

@router.put("/{name}")
async def modify_target_configuration(name: str, payload: SubredditUpdate):
    existing = await database.db_get_subreddit(name)
    if not existing:
        raise HTTPException(status_code=404, detail="Subreddit target entry not found")
    
    success = await database.db_update_subreddit(
        name=name,
        description=payload.description if payload.description is not None else existing.get('description'),
        total_users=payload.total_users if payload.total_users is not None else existing.get('total_users'),
        is_active=payload.is_active if payload.is_active is not None else existing.get('is_active'),
        keep_updated=payload.keep_updated if payload.keep_updated is not None else existing.get('keep_updated')
    )
    if not success:
        raise HTTPException(status_code=500, detail="Database write operation dropped downstream")
    return {"message": "Tracking settings updated successfully"}

@router.delete("/{name}")
async def untrack_and_purge_target(name: str):
    success = await database.db_delete_subreddit(name)
    if not success:
        raise HTTPException(status_code=404, detail="Subreddit target record not found or already deleted")
    return {"message": "Subreddit dropped out of active indexing tables successfully"}