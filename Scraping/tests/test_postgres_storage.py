import json
import os
import uuid

import asyncpg
import pytest
import pytest_asyncio

import database.core as database_core
from database import ignored_words, posts, queue_manager, subreddits


@pytest_asyncio.fixture
async def isolated_postgres(monkeypatch):
    dsn = os.getenv("REDDIT_TEST_DATABASE_URL")
    if not dsn:
        pytest.skip("Set REDDIT_TEST_DATABASE_URL to an isolated PostgreSQL test database")

    admin_connection = None
    pool = None
    schema = f"backend_test_{uuid.uuid4().hex}"

    try:
        admin_connection = await asyncpg.connect(dsn=dsn)
        database_name = await admin_connection.fetchval("SELECT current_database()")
        if "test" not in database_name.lower():
            pytest.fail(
                "REDDIT_TEST_DATABASE_URL must connect to a database whose name contains 'test'"
            )

        await admin_connection.execute(f'CREATE SCHEMA "{schema}"')
        pool = await asyncpg.create_pool(
            dsn=dsn,
            server_settings={"search_path": schema},
            min_size=1,
            max_size=2,
        )
        monkeypatch.setattr(database_core, "_pool", pool)

        async with pool.acquire() as connection:
            await connection.execute(
                """
                CREATE TABLE subreddits (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE,
                    description TEXT,
                    total_users INTEGER,
                    is_active BOOLEAN DEFAULT TRUE,
                    keep_updated BOOLEAN DEFAULT FALSE,
                    last_gap_scan TIMESTAMP WITHOUT TIME ZONE,
                    timezone VARCHAR(64) DEFAULT 'UTC'
                );
                CREATE TABLE reddit_posts (
                    id VARCHAR(20) PRIMARY KEY,
                    subreddit_id INTEGER REFERENCES subreddits(id) ON DELETE SET NULL,
                    timestamp TIMESTAMP WITHOUT TIME ZONE,
                    title TEXT,
                    body TEXT,
                    sentiment VARCHAR(20),
                    sentiment_scores JSONB,
                    keywords JSONB,
                    entities JSONB,
                    topics JSONB,
                    score INTEGER DEFAULT 0,
                    upvote_ratio NUMERIC(4, 3) DEFAULT 0,
                    num_comments INTEGER DEFAULT 0
                );
                CREATE TABLE scraping_queue (
                    post_id TEXT PRIMARY KEY,
                    subreddit_id INTEGER NOT NULL REFERENCES subreddits(id) ON DELETE CASCADE,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE ignored_words (
                    id SERIAL PRIMARY KEY,
                    word TEXT NOT NULL UNIQUE,
                    language VARCHAR(50) DEFAULT 'en',
                    approved BOOLEAN DEFAULT FALSE,
                    processed BOOLEAN DEFAULT FALSE
                );
                """
            )

        yield pool
    finally:
        if pool is not None:
            await pool.close()
        if admin_connection is not None:
            await admin_connection.execute(f'DROP SCHEMA IF EXISTS "{schema}" CASCADE')
            await admin_connection.close()


def _decode_json(value):
    return json.loads(value) if isinstance(value, str) else value


@pytest.mark.asyncio
async def test_post_and_queue_data_round_trip_in_postgres(isolated_postgres):
    subreddit_id = await subreddits.db_create_subreddit(
        "test-storage",
        description="isolated integration fixture",
        total_users=50,
        timezone="UTC",
    )
    post = {
        "id": "test-post-1",
        "timestamp": "2026-10-31T12:30:00Z",
        "title": "Original title",
        "body": "Post body",
        "sentiment": "Positive",
        "sentiment_scores": {"positive": 0.9, "neutral": 0.08, "negative": 0.02},
        "keywords": {"storage": 2, "database": 1},
        "entities": [{"text": "Berlin", "label": "GPE"}],
        "topics": {"primary_topic": "Housing", "scores": [0.8]},
        "score": 12,
        "upvote_ratio": 0.875,
        "num_comments": 3,
    }

    await posts.save_post_to_db(post, "test-storage")
    loaded = await posts.load_posts_from_db("test-storage", limit=10)

    assert list(loaded) == ["test-post-1"]
    stored = loaded["test-post-1"]
    assert stored["subreddit_id"] == subreddit_id
    assert stored["title"] == "Original title"
    assert stored["sentiment"] == "Positive"
    assert _decode_json(stored["sentiment_scores"]) == post["sentiment_scores"]
    assert _decode_json(stored["keywords"]) == post["keywords"]
    assert _decode_json(stored["entities"]) == post["entities"]
    assert _decode_json(stored["topics"]) == post["topics"]
    assert stored["score"] == 12
    assert float(stored["upvote_ratio"]) == 0.875
    assert stored["num_comments"] == 3

    post["title"] = "Updated title"
    post["score"] = 20
    await posts.save_post_to_db(post, "test-storage")
    updated = await posts.load_posts_from_db("test-storage", limit=10)

    assert len(updated) == 1
    assert updated["test-post-1"]["title"] == "Updated title"
    assert updated["test-post-1"]["score"] == 20

    async with isolated_postgres.acquire() as connection:
        await queue_manager.add_to_queue(connection, ["queued-post"], "test-storage")
        queue_row = await connection.fetchrow(
            "SELECT post_id, subreddit_id, status FROM scraping_queue WHERE post_id = $1",
            "queued-post",
        )

    assert dict(queue_row) == {
        "post_id": "queued-post",
        "subreddit_id": subreddit_id,
        "status": "pending",
    }


@pytest.mark.asyncio
async def test_ignored_word_approval_persists_purge_and_processed_state(isolated_postgres):
    await subreddits.db_create_subreddit("test-keywords")
    await posts.save_post_to_db(
        {
            "id": "test-post-2",
            "timestamp": "2026-10-31T12:30:00Z",
            "title": "Keyword post",
            "body": "",
            "sentiment": "Neutral",
            "keywords": {"common": 2, "retained": 1},
        },
        "test-keywords",
    )
    await ignored_words.db_add_ignored_word(" common ")

    result = await ignored_words.db_update_ignored_word("COMMON", "en", True)

    assert result == {"success": True, "affected_posts": 1, "processed": True}
    async with isolated_postgres.acquire() as connection:
        stored_keywords = await connection.fetchval(
            "SELECT keywords FROM reddit_posts WHERE id = $1", "test-post-2"
        )
        stored_word = await connection.fetchrow(
            "SELECT word, approved, processed FROM ignored_words WHERE word = $1",
            "common",
        )

    assert _decode_json(stored_keywords) == {"retained": 1}
    assert dict(stored_word) == {
        "word": "common",
        "approved": True,
        "processed": True,
    }
