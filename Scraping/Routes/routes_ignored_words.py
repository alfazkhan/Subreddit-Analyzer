from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List

from auth_guard import require_role
from database.ignored_words import (
    db_add_ignored_word, 
    db_get_all_ignored_words_details, 
    db_update_ignored_word, 
    db_delete_ignored_word
)

router = APIRouter(prefix="/ignored-words", tags=["Ignored Words Control Layer"])

class IgnoredWordBase(BaseModel):
    word: str
    language: Optional[str] = 'en'
    approved: Optional[bool] = False

class IgnoredWordUpdate(BaseModel):
    language: Optional[str] = 'en'
    approved: bool

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_ignored_word(payload: List[IgnoredWordBase]):
    """Users/Admins report new words to ignore (defaults: approved=False, processed=False)."""
    for item in payload:
        await db_add_ignored_word(item.word, item.language, False)
    return {"message": f"{len(payload)} ignored word(s) submitted successfully"}

@router.get("", response_model=List[dict])
async def list_ignored_words():
    return await db_get_all_ignored_words_details()

@router.put("/{word}")
async def update_ignored_word(
    word: str,
    payload: IgnoredWordUpdate,
    super_admin: dict = Depends(require_role(["Super Admin"]))
):
    """
    Admin updates approval state:
    - Setting approved=True purges the keyword from reddit_posts and marks processed=True.
    - Setting approved=False marks processed=False.
    """
    result = await db_update_ignored_word(word, payload.language, payload.approved)
    
    if not result["success"]:
        raise HTTPException(status_code=404, detail="Ignored word not found")
        
    return {
        "message": "Ignored word status updated successfully",
        "word": word,
        "approved": payload.approved,
        "processed": result["processed"],
        "affected_posts": result["affected_posts"]
    }

@router.delete("/{word}")
async def delete_ignored_word(
    word: str,
    super_admin: dict = Depends(require_role(["Super Admin"]))
):
    success = await db_delete_ignored_word(word)
    if not success:
        raise HTTPException(status_code=404, detail="Ignored word not found")
    return {"message": "Ignored word deleted successfully"}