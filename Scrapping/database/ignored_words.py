from .core import get_db_pool

async def get_all_ignored_words() -> set:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT word FROM ignored_words WHERE approved = TRUE")
        return {row['word'] for row in rows}

async def mark_ignored_words_as_processed():
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute("UPDATE ignored_words SET processed = TRUE WHERE approved = TRUE AND processed = FALSE")

async def db_add_ignored_word(word: str, language: str = 'en', approved: bool = False):
    """Adds a new word reported by users (default: approved=False, processed=False)."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute('''
            INSERT INTO ignored_words (word, language, approved, processed)
            VALUES ($1, $2, $3, FALSE)
            ON CONFLICT (word) DO NOTHING
        ''', word.strip().lower(), language, approved)

async def db_get_all_ignored_words_details():
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM ignored_words ORDER BY id DESC")
        return [dict(row) for row in rows]

async def db_update_ignored_word(word: str, language: str, approved: bool):
    """
    Executes inside PUT endpoint:
    - If approved is True: purges keyword from reddit_posts and sets processed = True
    - If approved is False: sets approved = False and processed = False
    """
    clean_word = word.strip().lower()
    pool = await get_db_pool()
    
    purge_keywords_sql = """
        UPDATE reddit_posts
        SET keywords = (keywords::jsonb - $1)::json
        WHERE keywords::jsonb ? $1;
    """
    
    update_word_sql = """
        UPDATE ignored_words 
        SET language = $1, approved = $2, processed = $3
        WHERE word = $4;
    """

    async with pool.acquire() as conn:
        async with conn.transaction():
            affected_posts = 0
            
            if approved:
                # 1. Purge word key from all matching posts
                purge_res = await conn.execute(purge_keywords_sql, clean_word)
                affected_posts = int(purge_res.split(" ")[-1]) if purge_res else 0
                final_processed = True
            else:
                final_processed = False

            # 2. Update the ignored_words row state
            status = await conn.execute(update_word_sql, language, approved, final_processed, clean_word)
            
            if status == "UPDATE 0":
                return {"success": False, "affected_posts": 0, "processed": False}

            return {"success": True, "affected_posts": affected_posts, "processed": final_processed}

async def db_delete_ignored_word(word: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        status = await conn.execute("DELETE FROM ignored_words WHERE word = $1", word.strip().lower())
        return status == "DELETE 1"