import secrets
from fastapi import APIRouter, Depends, HTTPException, Body
from firebase_admin import auth as firebase_auth
from auth_guard import verify_client_identity, require_role
from database.users import (
    db_create_user_profile, 
    db_assign_api_key,
    db_get_all_users,
    db_get_user_by_id,
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
        # 1. Register profile in Firebase Cloud Auth first (cannot wrap Firebase creation in DB transaction)
        fb_user = firebase_auth.create_user(email=email, password=password, display_name=name)
    except Exception as err:
        raise HTTPException(status_code=400, detail=f"Firebase Profile Creation Failed: {str(err)}")
        
    try:
        # 2. Replicate state records down into PostgreSQL tracking maps
        success = await db_create_user_profile(fb_user.uid, email, name, role, calls_limit)
        if not success:
            raise Exception("Local database collision or constraint failure.")
            
        return {"status": "success", "message": f"Account synchronized successfully for {email} assigned to tier: {role}."}
    except Exception as err:
        # 3. Rollback Firebase if PostgreSQL insert fails (Compensating Transaction)
        firebase_auth.delete_user(fb_user.uid)
        raise HTTPException(status_code=500, detail=f"Database synchronization failed. Firebase identity rolled back. Error: {str(err)}")


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
        # "note": "Copy this token carefully. For security reasons, it will not be displayed again."
    }


@router.get("/me")
async def fetch_current_client_profile(client: dict = Depends(verify_client_identity)):
    """Returns profile parameters and verified scope assignments for the active caller."""
    user_record = await db_get_user_by_id(client["id"])
    api_key = None
    if user_record and client["role"] == "Super Admin":
        api_key = user_record.get("api_key")

    return {
        "id": client["id"],
        "name": user_record.get("name") if user_record else None,
        "email": client["email"],
        "role": client["role"],
        "authenticated_via": client["auth_type"],
        "api_key": api_key
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
    """Updates a user's access role, API limits, or core profile info transactionally across DB and Firebase."""
    role = payload.get("role")
    calls_limit = payload.get("api_calls_limit")
    name = payload.get("name")
    email = payload.get("email")
    password = payload.get("password")
    
    valid_roles = ["Super Admin", "Admin", "Guest User", "Developer"]
    if role and role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid target configuration role. Supported: {valid_roles}")
        
    def firebase_sync_callback(uid: str):
        update_kwargs = {}
        if name: update_kwargs["display_name"] = name
        if email: update_kwargs["email"] = email
        if password: update_kwargs["password"] = password
        
        if update_kwargs:
            firebase_auth.update_user(uid, **update_kwargs)

    try:
        success = await db_update_user_profile(user_id, role, calls_limit, name, email, firebase_sync_callback)
        if not success:
            raise HTTPException(status_code=404, detail="User record not found in the system.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transaction failed, rollback executed. Error: {str(e)}")
        
    return {"status": "success", "message": "User profile synchronized and updated successfully."}


@router.delete("/{user_id}")
async def delete_user_profile(user_id: int, super_admin: dict = Depends(require_role(["Super Admin"]))):
    """Permanently deletes a user from both PostgreSQL and Firebase within a single atomic transaction."""
    
    def firebase_delete_callback(uid: str):
        firebase_auth.delete_user(uid)
        
    try:
        deleted_uid = await db_delete_user_profile(user_id, firebase_delete_callback)
        if not deleted_uid:
            raise HTTPException(status_code=404, detail="User record not found in the system.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transaction failed, rollback executed. Error: {str(e)}")
        
    return {"status": "success", "message": "User profile completely deleted from database and Firebase."}