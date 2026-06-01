from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List

from database.ignored_words import (
    db_add_ignored_word, db_get_all_ignored_words_details, 
    db_update_ignored_word, db_delete_ignored_word
)

router = APIRouter(prefix="/ignored-words", tags=["Ignored Words Control Layer"])

class IgnoredWordBase(BaseModel):
    word: str
    language: Optional[str] = 'en'
    approved: Optional[bool] = False

class IgnoredWordUpdate(BaseModel):
    language: Optional[str] = 'en'
    approved: Optional[bool] = False
    processed: Optional[bool] = False

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_ignored_word(payload: List[IgnoredWordBase]):
    for item in payload:
        await db_add_ignored_word(item.word, item.language, item.approved)
    return {"message": f"{len(payload)} ignored word(s) added successfully"}

@router.get("", response_model=List[dict])
async def list_ignored_words():
    return await db_get_all_ignored_words_details()

@router.put("/{word}")
async def update_ignored_word(word: str, payload: IgnoredWordUpdate):
    success = await db_update_ignored_word(word, payload.language, payload.approved, payload.processed)
    if not success:
        raise HTTPException(status_code=404, detail="Ignored word not found")
    return {"message": "Ignored word updated successfully"}

@router.delete("/{word}")
async def delete_ignored_word(word: str):
    success = await db_delete_ignored_word(word)
    if not success:
        raise HTTPException(status_code=404, detail="Ignored word not found")
    return {"message": "Ignored word deleted successfully"}