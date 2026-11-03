import json
from datetime import datetime

import pytest

from database import posts


def test_cursor_round_trip_preserves_timestamp_and_post_id():
    timestamp = datetime(2026, 10, 31, 12, 30)

    encoded = posts.encode_cursor(timestamp, "t3_example")

    assert posts.decode_cursor(encoded) == (timestamp, "t3_example")


@pytest.mark.parametrize("cursor", ["", "not-base64", "e30="])
def test_decode_cursor_rejects_invalid_payloads(cursor):
    assert posts.decode_cursor(cursor) is None


@pytest.mark.asyncio
async def test_cursor_pagination_decodes_json_and_builds_next_cursor(fake_db):
    timestamp = datetime(2026, 10, 30, 9, 15)
    fake_db.fetchval.return_value = 4
    fake_db.fetch.return_value = [
        {
            "id": "post-1",
            "timestamp": timestamp,
            "sentiment_scores": '{"positive": 0.9}',
            "keywords": '{"rent": 2}',
            "entities": '[{"text": "Berlin", "label": "GPE"}]',
            "topics": '{"primary_topic": "Housing"}',
        },
        {
            "id": "post-2",
            "timestamp": timestamp,
            "sentiment_scores": None,
            "keywords": {},
            "entities": [],
            "topics": {},
        },
    ]

    result = await posts.fetch_posts_cursor_paginated(limit=1)

    assert result["total_count"] == 4
    assert result["has_more"] is True
    assert len(result["items"]) == 1
    assert result["items"][0]["timestamp"] == timestamp.isoformat()
    assert result["items"][0]["sentiment_scores"] == {"positive": 0.9}
    assert result["items"][0]["keywords"] == {"rent": 2}
    assert posts.decode_cursor(result["next_cursor"]) == (timestamp, "post-1")


@pytest.mark.asyncio
async def test_cursor_pagination_applies_subreddit_and_previous_cursor(fake_db):
    cursor = posts.encode_cursor(datetime(2026, 10, 1), "post-0")
    fake_db.fetchval.return_value = 1
    fake_db.fetch.return_value = [
        {
            "id": "post-1",
            "timestamp": datetime(2026, 10, 2),
            "sentiment_scores": {},
            "keywords": {},
            "entities": [],
            "topics": {},
        }
    ]

    result = await posts.fetch_posts_cursor_paginated(
        limit=10,
        cursor=cursor,
        direction="prev",
        subreddit="Berlin",
    )

    query, *args = fake_db.fetch.await_args.args
    assert "LOWER(TRIM(s.name))" in query
    assert "ORDER BY p.timestamp ASC, p.id ASC" in query
    assert args[:3] == ["Berlin", datetime(2026, 10, 1), "post-0"]
    assert result["items"][0]["id"] == "post-1"
    assert result["prev_cursor"] == cursor


@pytest.mark.asyncio
async def test_save_post_serializes_json_and_converts_timestamp(fake_db):
    fake_db.fetchrow.return_value = {"id": 12}
    post = {
        "id": "post-1",
        "timestamp": "2026-10-31T12:30:00Z",
        "title": "A test post",
        "body": "Body",
        "sentiment": "Positive",
        "sentiment_scores": {"positive": 0.8},
        "keywords": {"test": 2},
        "entities": [{"text": "Berlin", "label": "GPE"}],
        "topics": {"primary_topic": "Housing"},
        "score": 3,
        "upvote_ratio": 0.75,
        "num_comments": 4,
    }

    await posts.save_post_to_db(post, "Berlin")

    query, *args = fake_db.execute.await_args.args
    assert "ON CONFLICT (id) DO UPDATE" in query
    assert args[:3] == ["post-1", 12, datetime(2026, 10, 31, 12, 30)]
    assert json.loads(args[6]) == {"positive": 0.8}
    assert json.loads(args[7]) == {"test": 2}
    assert json.loads(args[8]) == [{"text": "Berlin", "label": "GPE"}]
    assert json.loads(args[9]) == {"primary_topic": "Housing"}


@pytest.mark.asyncio
async def test_save_post_creates_missing_subreddit(fake_db):
    fake_db.fetchrow.return_value = None
    fake_db.fetchval.return_value = 13

    await posts.save_post_to_db(
        {
            "id": "post-2",
            "timestamp": "invalid",
            "title": "A test post",
            "body": "",
            "sentiment": "Neutral",
        },
        "new-target",
    )

    fake_db.fetchval.assert_awaited_once()
    assert fake_db.execute.await_args.args[2] is None


@pytest.mark.asyncio
async def test_post_update_rejects_empty_and_unknown_fields(fake_db):
    assert await posts.db_update_post("post-1", {}) is False
    assert await posts.db_update_post("post-1", {"unsupported": True}) is False
    fake_db.execute.assert_not_awaited()


@pytest.mark.asyncio
async def test_post_update_parameterizes_and_serializes_supported_fields(fake_db):
    fake_db.execute.return_value = "UPDATE 1"

    result = await posts.db_update_post(
        "post-1",
        {
            "title": "Updated",
            "keywords": {"housing": 3},
            "score": "8",
            "upvote_ratio": "0.91",
            "untrusted_field": "ignored",
        },
    )

    query, *args = fake_db.execute.await_args.args
    assert result is True
    assert "title = $1" in query
    assert "keywords = $2" in query
    assert "untrusted_field" not in query
    assert args == ["Updated", json.dumps({"housing": 3}), 8, 0.91, "post-1"]


@pytest.mark.asyncio
async def test_diurnal_frequency_always_returns_all_24_hours(fake_db):
    fake_db.fetch.return_value = [
        {
            "local_hour": 4,
            "post_volume": 2,
            "positive_count": 1,
            "negative_count": 1,
            "neutral_count": 0,
            "avg_pos_score": 0.5,
            "avg_neg_score": 0.25,
        }
    ]

    result = await posts.get_posts_diurnal_frequency("Berlin")

    assert result["labels"] == [f"{hour:02d}:00" for hour in range(24)]
    assert result["metrics"]["post_volumes"][4] == 2
    assert result["metrics"]["post_volumes"][3] == 0
    assert result["metrics"]["positive_counts"][4] == 1
