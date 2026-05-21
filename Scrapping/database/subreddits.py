from .core import get_db_pool

async def is_subreddit_bootstrapped(subreddit_name: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        count = await conn.fetchval('''
            SELECT COUNT(*) FROM reddit_posts p
            JOIN subreddits s ON p.subreddit_id = s.id
            WHERE s.name = $1
        ''', subreddit_name)
        return count > 0

async def get_active_subreddits():
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT name FROM subreddits WHERE keep_updated = TRUE")
        return [row['name'] for row in rows]
    
async def db_create_subreddit(name: str, description: str = None, total_users: int = None, is_active: bool = True, keep_updated: bool = False):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        return await conn.fetchval('''
            INSERT INTO subreddits (name, description, total_users, is_active, keep_updated)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (name) DO UPDATE SET 
                description = EXCLUDED.description,
                total_users = EXCLUDED.total_users,
                is_active = EXCLUDED.is_active,
                keep_updated = EXCLUDED.keep_updated
            RETURNING id
        ''', name, description, total_users, is_active, keep_updated)

async def db_get_all_subreddits():
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM subreddits ORDER BY name ASC")
        return [dict(r) for r in rows]

async def db_get_subreddit(name: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM subreddits WHERE name = $1", name)
        return dict(row) if row else None

async def db_update_subreddit(name: str, description: str, total_users: int, is_active: bool, keep_updated: bool):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        status = await conn.execute('''
            UPDATE subreddits 
            SET description = $1, total_users = $2, is_active = $3, keep_updated = $4
            WHERE name = $5
        ''', description, total_users, is_active, keep_updated, name)
        return status == "UPDATE 1"

async def db_delete_subreddit(name: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        status = await conn.execute("DELETE FROM subreddits WHERE name = $1", name)
        return status == "DELETE 1"