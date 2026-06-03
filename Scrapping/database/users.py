import asyncpg
from database.core import get_db_pool

async def db_get_all_users():
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch('''
            SELECT id, firebase_uid, email, role, api_calls_limit, api_calls_count, created_at 
            FROM users 
            ORDER BY created_at DESC
        ''')
        return [dict(row) for row in rows]

async def db_update_user_profile(user_id: int, role: str = None, calls_limit: int = None):
    if not role and calls_limit is None:
        return False
        
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        set_clauses = []
        args = []
        if role:
            args.append(role)
            set_clauses.append(f"role = ${len(args)}")
        if calls_limit is not None:
            args.append(calls_limit)
            set_clauses.append(f"api_calls_limit = ${len(args)}")
        
        args.append(user_id)
        query = f"UPDATE users SET {', '.join(set_clauses)} WHERE id = ${len(args)}"
        status = await conn.execute(query, *args)
        return status == "UPDATE 1"

async def db_delete_user_profile(user_id: int):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        status = await conn.execute("DELETE FROM users WHERE id = $1", user_id)
        return status == "DELETE 1"


async def db_create_user_profile(uid: str, email: str, role: str, limit: int) -> bool:
    pool = await get_db_pool()
    query = """
        INSERT INTO public.users (firebase_uid, email, role, api_calls_limit)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (firebase_uid) DO NOTHING;
    """
    async with pool.acquire() as conn:
        result = await conn.execute(query, uid, email, role, limit)
        return "INSERT" in result

async def db_get_user_by_api_key(api_key: str):
    pool = await get_db_pool()
    query = """
        SELECT id, email, role, api_calls_limit, api_calls_count 
        FROM public.users 
        WHERE api_key = $1;
    """
    async with pool.acquire() as conn:
        return await conn.fetchrow(query, api_key)

async def db_get_user_by_uid(uid: str):
    pool = await get_db_pool()
    query = """
        SELECT id, email, role 
        FROM public.users 
        WHERE firebase_uid = $1;
    """
    async with pool.acquire() as conn:
        return await conn.fetchrow(query, uid)

async def db_increment_api_usage(user_id: int):
    pool = await get_db_pool()
    query = "UPDATE public.users SET api_calls_count = api_calls_count + 1 WHERE id = $1;"
    async with pool.acquire() as conn:
        await conn.execute(query, user_id)

async def db_assign_api_key(user_id: int, api_key: str):
    pool = await get_db_pool()
    query = "UPDATE public.users SET api_key = $1 WHERE id = $2;"
    async with pool.acquire() as conn:
        await conn.execute(query, api_key, user_id)