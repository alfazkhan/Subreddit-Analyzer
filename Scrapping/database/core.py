import asyncpg
from datetime import datetime
from config import DB_CONFIG

_pool = None

def safe_parse_timestamp(ts_str: str):
    if not ts_str or ts_str in ["", "None"]: return None
    try:
        dt = datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
        return dt.replace(tzinfo=None)
    except Exception: return None

async def get_db_pool():
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(**DB_CONFIG)
    return _pool