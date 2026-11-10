import logging
from typing import Optional
from fastapi import Header, HTTPException, Request, Depends, WebSocket, WebSocketException, status
from firebase_admin import auth as firebase_auth
from database.users import db_get_user_by_api_key, db_get_user_by_uid, db_increment_api_usage

async def verify_client_identity(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None)
) -> dict:
    """
    Unified Interceptor: Validates Human Session JWTs (via Firebase) 
    or Dev Script tokens (via DB Api Key) and enforces quota throttling.
    """
    # --- TRACK A: API KEY ROUTING (Developer Automation Scripts) ---
    api_key = x_api_key or (
        authorization.replace("Bearer ", "") 
        if authorization and authorization.startswith("Bearer alfaz_") 
        else None
    )
    
    if api_key:
        user_record = await db_get_user_by_api_key(api_key)
        if not user_record:
            raise HTTPException(status_code=401, detail="Access Denied: Invalid cryptographic token.")
            
        limit = user_record["api_calls_limit"]
        current_count = user_record["api_calls_count"]
        
        # Enforce quota limits unless limit is explicitly set to -1 (Unlimited)
        if limit != -1 and current_count >= limit:
            raise HTTPException(
                status_code=429, 
                detail="API Usage Limit Exhausted. Contact your Super Admin to upgrade your resource tier."
            )
            
        # Asynchronously increment the consumption count
        await db_increment_api_usage(user_record["id"])
        return {
            "id": user_record["id"], 
            "name": user_record["name"],
            "email": user_record["email"], 
            "role": user_record["role"], 
            "auth_type": "api_key"
        }

    # --- TRACK B: FIREBASE IDENTITY ROUTING (Human Dashboard Interaction) ---
    if authorization and authorization.startswith("Bearer "):
        id_token = authorization.split("Bearer ")[1]
        try:
            decoded_token = firebase_auth.verify_id_token(id_token)
            uid = decoded_token["uid"]
        except Exception:
            raise HTTPException(status_code=401, detail="Session expired or invalid token signature.")

        user_record = await db_get_user_by_uid(uid)
        if not user_record:
            raise HTTPException(
                status_code=403, 
                detail="Firebase identity authenticated, but not initialized in database matrix."
            )
            
        return {
            "id": user_record["id"], 
            "name": user_record["name"],
            "email": user_record["email"], 
            "role": user_record["role"], 
            "auth_type": "firebase"
        }

    raise HTTPException(status_code=401, detail="Authentication required. Provide an API key or a valid session bearer token.")


async def verify_client_identity_ws(websocket: WebSocket) -> dict:
    authorization = websocket.headers.get("authorization")
    x_api_key = websocket.headers.get("x-api-key")
    api_key = x_api_key or (
        authorization.replace("Bearer ", "")
        if authorization and authorization.startswith("Bearer alfaz_")
        else None
    )

    if api_key:
        user_record = await db_get_user_by_api_key(api_key)
        if not user_record:
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Access Denied: Invalid cryptographic token.")

        limit = user_record["api_calls_limit"]
        current_count = user_record["api_calls_count"]
        if limit != -1 and current_count >= limit:
            raise WebSocketException(
                code=status.WS_1008_POLICY_VIOLATION,
                reason="API Usage Limit Exhausted. Contact your Super Admin to upgrade your resource tier."
            )
        await db_increment_api_usage(user_record["id"])
        return {
            "id": user_record["id"],
            "name": user_record["name"],
            "email": user_record["email"],
            "role": user_record["role"],
            "auth_type": "api_key"
        }

    if authorization and authorization.startswith("Bearer "):
        id_token = authorization.split("Bearer ")[1]
        try:
            decoded_token = firebase_auth.verify_id_token(id_token)
            uid = decoded_token["uid"]
        except Exception:
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Session expired or invalid token signature.")

        user_record = await db_get_user_by_uid(uid)
        if not user_record:
            raise WebSocketException(
                code=status.WS_1008_POLICY_VIOLATION,
                reason="Firebase identity authenticated, but not initialized in database matrix."
            )
        return {
            "id": user_record["id"],
            "name": user_record["name"],
            "email": user_record["email"],
            "role": user_record["role"],
            "auth_type": "firebase"
        }

    raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Authentication required. Provide an API key or a valid session bearer token.")


async def get_optional_client_identity_ws(websocket: WebSocket) -> Optional[dict]:
    """
    Tries to authenticate a WebSocket connection via headers or a 'token' query parameter.
    Does not raise an exception on failure, allowing for unauthenticated connections.
    Returns the client dict on success, or None on failure.
    """
    auth_header = websocket.headers.get("authorization")
    api_key_header = websocket.headers.get("x-api-key")
    query_token = websocket.query_params.get("token")

    token = None
    is_api_key = False

    if api_key_header:
        token = api_key_header
        is_api_key = True
    elif auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split("Bearer ")[1]
        if token.startswith("alfaz_"):
            is_api_key = True
    elif query_token:
        token = query_token
        if token.startswith("alfaz_"):
            is_api_key = True

    if not token:
        return None

    try:
        if is_api_key:
            user_record = await db_get_user_by_api_key(token)
            if not user_record: return None

            limit = user_record["api_calls_limit"]
            current_count = user_record["api_calls_count"]
            if limit != -1 and current_count >= limit:
                return None
            
            await db_increment_api_usage(user_record["id"])
            return {
                "id": user_record["id"], "email": user_record["email"],
                "name": user_record["name"],
                "role": user_record["role"], "auth_type": "api_key"
            }
        else:  # It's a Firebase JWT
            decoded_token = firebase_auth.verify_id_token(token)
            uid = decoded_token["uid"]
            user_record = await db_get_user_by_uid(uid)
            if not user_record: return None
            
            return {
                "id": user_record["id"], "email": user_record["email"],
                "name": user_record["name"],
                "role": user_record["role"], "auth_type": "firebase"
            }
    except Exception:
        return None


def require_role(allowed_roles: list):
    """Factory helper to enforce strict role restrictions across specific routes."""
    def dependency(client: dict = Depends(verify_client_identity)):
        if client["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail=f"Unauthorized. Action restricted to roles: {allowed_roles}")
        return client
    return dependency