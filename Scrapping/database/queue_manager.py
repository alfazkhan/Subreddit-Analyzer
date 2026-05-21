from .core import get_db_pool

async def get_queued_ids(subreddit_name: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch('''
            SELECT q.post_id FROM scraping_queue q
            JOIN subreddits s ON q.subreddit_id = s.id
            WHERE s.name = $1
        ''', subreddit_name)
        return {row[0] for row in rows}

async def add_to_queue(conn, post_ids: list, subreddit_name: str):
    if not post_ids: return
    await conn.executemany('''
        INSERT INTO scraping_queue (post_id, subreddit_id) 
        VALUES ($1, (SELECT id FROM subreddits WHERE name = $2))
        ON CONFLICT (post_id) DO NOTHING
    ''', [(pid, subreddit_name) for pid in post_ids])

async def update_queue_status(post_id: str, status: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute("UPDATE scraping_queue SET status = $1 WHERE post_id = $2", status, post_id)

async def get_queue_tasks_by_status(subreddit_name: str, status: str, limit: int):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        return await conn.fetch('''
            SELECT q.post_id FROM scraping_queue q
            JOIN subreddits s ON q.subreddit_id = s.id
            WHERE s.name = $1 AND q.status = $2 LIMIT $3
        ''', subreddit_name, status, limit)

async def force_requeue_posts(post_ids: list, subreddit_name: str):
    if not post_ids: return
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.executemany('''
            INSERT INTO scraping_queue (post_id, subreddit_id, status) 
            VALUES ($1, (SELECT id FROM subreddits WHERE name = $2), 'pending')
            ON CONFLICT (post_id) DO UPDATE SET status = 'pending'
        ''', [(pid, subreddit_name) for pid in post_ids])