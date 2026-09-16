from .core import get_db_pool

async def is_subreddit_bootstrapped(subreddit_name: str) -> bool:
    """Checks whether the subreddit has at least one post in the database."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        count = await conn.fetchval('''
            SELECT COUNT(p.id) 
            FROM reddit_posts p
            JOIN subreddits s ON p.subreddit_id = s.id
            WHERE LOWER(TRIM(s.name)) = LOWER(TRIM($1));
        ''', subreddit_name)
        return bool(count and count > 0)

async def get_active_subreddits():
    """Fetches list of active subreddit names marked for continuous tracking."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch('''
            SELECT name 
            FROM subreddits 
            WHERE keep_updated = TRUE 
            ORDER BY id ASC;
        ''')
        return [row['name'] for row in rows]

async def get_subreddit_last_gap_scan(subreddit_name: str):
    """Retrieves the timestamp of when the feed gap was last scanned."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        return await conn.fetchval('''
            SELECT last_gap_scan 
            FROM subreddits 
            WHERE LOWER(TRIM(name)) = LOWER(TRIM($1));
        ''', subreddit_name)

async def update_last_gap_scan(subreddit_name: str):
    """Updates the last_gap_scan timestamp to NOW() for the given subreddit."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute('''
            UPDATE subreddits 
            SET last_gap_scan = NOW() 
            WHERE LOWER(TRIM(name)) = LOWER(TRIM($1));
        ''', subreddit_name)

async def db_create_subreddit(name: str, description: str = None, total_users: int = None, is_active: bool = True, keep_updated: bool = False, timezone: str = 'UTC'):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        return await conn.fetchval('''
            INSERT INTO subreddits (name, description, total_users, is_active, keep_updated, timezone)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (name) DO UPDATE SET 
                description = EXCLUDED.description,
                total_users = EXCLUDED.total_users,
                is_active = EXCLUDED.is_active,
                keep_updated = EXCLUDED.keep_updated,
                timezone = EXCLUDED.timezone
            RETURNING id;
        ''', name, description, total_users, is_active, keep_updated, timezone)

async def db_get_all_subreddits():
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM subreddits ORDER BY id ASC;")
        return [dict(r) for r in rows]

async def db_get_subreddit(name: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow('''
            SELECT * 
            FROM subreddits 
            WHERE LOWER(TRIM(name)) = LOWER(TRIM($1));
        ''', name)
        return dict(row) if row else None

async def db_update_subreddit(name: str, description: str, total_users: int, is_active: bool, keep_updated: bool, timezone: str = None):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        if timezone:
            status = await conn.execute('''
                UPDATE subreddits 
                SET description = $1, total_users = $2, is_active = $3, keep_updated = $4, timezone = $5
                WHERE LOWER(TRIM(name)) = LOWER(TRIM($6));
            ''', description, total_users, is_active, keep_updated, timezone, name)
        else:
            status = await conn.execute('''
                UPDATE subreddits 
                SET description = $1, total_users = $2, is_active = $3, keep_updated = $4
                WHERE LOWER(TRIM(name)) = LOWER(TRIM($5));
            ''', description, total_users, is_active, keep_updated, name)
        return status == "UPDATE 1"

async def db_delete_subreddit(name: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        status = await conn.execute('''
            DELETE FROM subreddits 
            WHERE LOWER(TRIM(name)) = LOWER(TRIM($1));
        ''', name)
        return status == "DELETE 1"