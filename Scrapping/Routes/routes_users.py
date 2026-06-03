import secrets
from fastapi import APIRouter, Depends, HTTPException, Body
from firebase_admin import auth as firebase_auth
from auth_guard import verify_client_identity, require_role
from database.users import (
    db_create_user_profile, 
    db_assign_api_key,
    db_get_all_users,
    db_update_user_profile,
    db_delete_user_profile
)

router = APIRouter(prefix="/users", tags=["User & Identity Profiles Management"])

@router.post("/create")
async def create_user_profile(
    payload: dict = Body(...), 
    super_admin: dict = Depends(require_role(["Super Admin"]))
):
    """
    Programmatically provisions a user profile inside Firebase Cloud Registry
    and syncs metadata down into PostgreSQL. Default role drops back to 'Guest User'.
    """
    email = payload.get("email")
    password = payload.get("password")
    name = payload.get("name", "")
    role = payload.get("role", "Guest User")
    calls_limit = payload.get("api_calls_limit", 1000)  # Use -1 for Unlimited allocation

    if not email or not password:
        raise HTTPException(status_code=400, detail="Missing required email or password fields.")

    valid_roles = ["Super Admin", "Admin", "Guest User", "Developer"]
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid target configuration role. Supported: {valid_roles}")

    try:
        # 1. Register profile in Firebase Cloud Auth
        fb_user = firebase_auth.create_user(email=email, password=password, display_name=name)
        
        # 2. Replicate state records down into PostgreSQL tracking maps
        success = await db_create_user_profile(fb_user.uid, email, role, calls_limit)
        if not success:
            raise HTTPException(status_code=500, detail="Identity added to Firebase, but local DB compilation conflicted.")
            
        return {"status": "success", "message": f"Account synchronized successfully for {email} assigned to tier: {role}."}
    except Exception as err:
        raise HTTPException(status_code=400, detail=f"Provisional Execution Failed: {str(err)}")


@router.post("/generate-api-key")
async def provision_api_key(client: dict = Depends(verify_client_identity)):
    """
    Generates a unique high-entropy API token string for the calling user context.
    Forces immediate replacement if a key already existed on the record.
    """
    secure_token = f"alfaz_live_{secrets.token_urlsafe(32)}"
    await db_assign_api_key(client["id"], secure_token)
    return {
        "status": "success",
        "api_key": secure_token,
        "note": "Copy this token carefully. For security reasons, it will not be displayed again."
    }


@router.get("/me")
async def fetch_current_client_profile(client: dict = Depends(verify_client_identity)):
    """Returns profile parameters and verified scope assignments for the active caller."""
    return {
        "id": client["id"],
        "email": client["email"],
        "role": client["role"],
        "authenticated_via": client["auth_type"]
    }


@router.get("")
async def get_all_users(super_admin: dict = Depends(require_role(["Super Admin"]))):
    """Retrieves a complete list of registered user profiles and their API limits."""
    return await db_get_all_users()


@router.put("/{user_id}")
async def update_user_profile(
    user_id: int,
    payload: dict = Body(...),
    super_admin: dict = Depends(require_role(["Super Admin"]))
):
    """Updates a user's access role or API consumption limit."""
    role = payload.get("role")
    calls_limit = payload.get("api_calls_limit")
    
    valid_roles = ["Super Admin", "Admin", "Guest User", "Developer"]
    if role and role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid target configuration role. Supported: {valid_roles}")
        
    success = await db_update_user_profile(user_id, role, calls_limit)
    if not success:
        raise HTTPException(status_code=404, detail="User record not found in the system.")
    return {"status": "success", "message": "User profile updated successfully."}


@router.delete("/{user_id}")
async def delete_user_profile(user_id: int, super_admin: dict = Depends(require_role(["Super Admin"]))):
    """Permanently deletes a user from the local PostgreSQL database."""
    success = await db_delete_user_profile(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User record not found in the system.")
    return {"status": "success", "message": "User profile deleted successfully."}