from .core import get_db_pool

async def get_all_ignored_words() -> set:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        # Only fetch words that have been explicitly approved
        rows = await conn.fetch("SELECT word FROM ignored_words WHERE approved = TRUE")
        return {row['word'] for row in rows}

async def mark_ignored_words_as_processed():
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute("UPDATE ignored_words SET processed = TRUE WHERE approved = TRUE AND processed = FALSE")

async def db_add_ignored_word(word: str, language: str = 'en', approved: bool = False):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute('''
            INSERT INTO ignored_words (word, language, approved, processed)
            VALUES ($1, $2, $3, FALSE)
            ON CONFLICT (word) DO UPDATE SET language = EXCLUDED.language, approved = EXCLUDED.approved
        ''', word, language, approved)

async def db_get_all_ignored_words_details():
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM ignored_words ORDER BY word ASC")
        return [dict(row) for row in rows]

async def db_update_ignored_word(word: str, language: str, approved: bool, processed: bool):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        status = await conn.execute('''
            UPDATE ignored_words 
            SET language = $1, approved = $2, processed = $3
            WHERE word = $4
        ''', language, approved, processed, word)
        return status == "UPDATE 1"

async def db_delete_ignored_word(word: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        status = await conn.execute("DELETE FROM ignored_words WHERE word = $1", word)
        return status == "DELETE 1"