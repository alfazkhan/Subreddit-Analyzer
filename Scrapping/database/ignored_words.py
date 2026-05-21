from .core import get_db_pool

async def get_all_ignored_words() -> set:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT word FROM ignored_words")
        return {row['word'] for row in rows}