import os
import asyncio
import logging
import sys
import asyncpg
from config import DB_CONFIG

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] MIGRATION: %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[logging.StreamHandler(sys.stdout)]
)

MIGRATIONS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Migrations")

async def ensure_migration_table(conn):
    """Guarantees the tracking table metadata layer exists in the schema."""
    await conn.execute('''
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version VARCHAR(255) PRIMARY KEY,
            applied_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    ''')

async def get_applied_migrations(conn):
    """Fetches all migration filenames already executed on the database."""
    rows = await conn.fetch("SELECT version FROM schema_migrations")
    return {row['version'] for row in rows}

async def record_migration(conn, version):
    """Logs a completed migration version string into the metadata layer."""
    await conn.execute("INSERT INTO schema_migrations (version) VALUES ($1)", version)

async def run_migrations():
    """Scans local migration files and safely applies missing schemas sequentially."""
    if not os.path.exists(MIGRATIONS_DIR):
        os.makedirs(MIGRATIONS_DIR)
        logging.info(f"Created missing migrations directory at {MIGRATIONS_DIR}")
        return

    # Gather and sort files to maintain sequential dependency execution
    files = [f for f in os.listdir(MIGRATIONS_DIR) if f.endswith(".sql")]
    files.sort()

    if not files:
        logging.info("No migration files found in Migrations directory.")
        return

    logging.info(f"Found {len(files)} total migration files. Connecting to database...")
    conn = await asyncpg.connect(**DB_CONFIG)
    
    try:
        await ensure_migration_table(conn)
        applied = await get_applied_migrations(conn)

        for file_name in files:
            if file_name in applied:
                continue

            logging.info(f"Applying schema adjustment: {file_name}")
            file_path = os.path.join(MIGRATIONS_DIR, file_name)
            
            with open(file_path, "r", encoding="utf-8") as f:
                sql_content = f.read()

            if not sql_content.strip():
                logging.warning(f"Skipping empty migration file: {file_name}")
                continue

            # Execute migration file within an atomic database transaction
            async with conn.transaction():
                await conn.execute(sql_content)
                await record_migration(conn, file_name)
            
            logging.info(f"Successfully applied: {file_name}")

        logging.info("Database state synchronization complete.")

    except Exception as error:
        logging.critical(f"Migration execution aborted due to database error: {error}")
        sys.exit(1)
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(run_migrations())