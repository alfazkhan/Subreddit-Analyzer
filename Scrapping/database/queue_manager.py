from .core import get_db_pool

async def get_queued_ids(subreddit_name: str) -> set:
    """Returns all post IDs currently sitting in the queue for a given subreddit."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch('''
            SELECT q.post_id 
            FROM scraping_queue q
            JOIN subreddits s ON q.subreddit_id = s.id
            WHERE LOWER(TRIM(s.name)) = LOWER(TRIM($1));
        ''', subreddit_name)
        return {row[0] for row in rows}

async def add_to_queue(conn, post_ids: list, subreddit_name: str):
    """Adds post IDs to scraping_queue with case-insensitive subreddit resolution."""
    if not post_ids:
        return
    await conn.executemany('''
        INSERT INTO scraping_queue (post_id, subreddit_id, status, created_at) 
        VALUES ($1, (SELECT id FROM subreddits WHERE LOWER(TRIM(name)) = LOWER(TRIM($2))), 'pending', NOW())
        ON CONFLICT (post_id) DO NOTHING;
    ''', [(pid, subreddit_name) for pid in post_ids])
    await conn.execute("NOTIFY queue_updates;")

async def update_queue_status(post_id: str, status: str):
    """Updates the status of a specific task in the queue and notifies listeners."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute('''
            UPDATE scraping_queue 
            SET status = $1 
            WHERE post_id = $2;
        ''', status, post_id)
        await conn.execute("NOTIFY queue_updates;")

async def get_queue_tasks_by_status(subreddit_name: str, status: str, limit: int):
    """
    True FIFO queue task retrieval.
    Orders strictly by created_at ASC, post_id ASC.
    """
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch('''
            SELECT q.post_id, q.subreddit_id, q.status, q.created_at
            FROM scraping_queue q
            JOIN subreddits s ON q.subreddit_id = s.id
            WHERE LOWER(TRIM(s.name)) = LOWER(TRIM($1)) 
              AND q.status = $2 
            ORDER BY q.created_at ASC, q.post_id ASC 
            LIMIT $3;
        ''', subreddit_name, status, limit)
        return [dict(r) for r in rows]

async def force_requeue_posts(post_ids: list, subreddit_name: str):
    """Forces existing post tasks back to 'pending' state."""
    if not post_ids:
        return
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.executemany('''
            INSERT INTO scraping_queue (post_id, subreddit_id, status, created_at) 
            VALUES ($1, (SELECT id FROM subreddits WHERE LOWER(TRIM(name)) = LOWER(TRIM($2))), 'pending', NOW())
            ON CONFLICT (post_id) DO UPDATE SET status = 'pending';
        ''', [(pid, subreddit_name) for pid in post_ids])
        await conn.execute("NOTIFY queue_updates;")