import asyncio

import pytest

from database import ignored_words, queue, queue_manager, subreddits, users


@pytest.mark.asyncio
async def test_subreddit_upsert_and_timezone_update(fake_db):
    fake_db.fetchval.return_value = 7
    fake_db.execute.return_value = "UPDATE 1"

    subreddit_id = await subreddits.db_create_subreddit(
        "Berlin", description="City", timezone="Europe/Berlin"
    )
    updated = await subreddits.db_update_subreddit(
        "Berlin", "Updated", 20, True, True, timezone="UTC"
    )

    assert subreddit_id == 7
    assert "ON CONFLICT (name) DO UPDATE" in fake_db.fetchval.await_args.args[0]
    assert fake_db.fetchval.await_args.args[1:] == (
        "Berlin",
        "City",
        None,
        True,
        False,
        "Europe/Berlin",
    )
    assert updated is True
    assert fake_db.execute.await_args.args[1:] == (
        "Updated",
        20,
        True,
        True,
        "UTC",
        "Berlin",
    )


@pytest.mark.asyncio
async def test_subreddit_update_without_timezone_does_not_change_it(fake_db):
    fake_db.execute.return_value = "UPDATE 0"

    updated = await subreddits.db_update_subreddit(
        "missing", None, None, False, False, timezone=None
    )

    query, *args = fake_db.execute.await_args.args
    assert updated is False
    assert "timezone =" not in query
    assert args == [None, None, False, False, "missing"]


@pytest.mark.asyncio
async def test_subreddit_sentiment_aggregation_counts_and_percentages(fake_db):
    fake_db.fetch.return_value = [
        {
            "subreddit_id": 1,
            "subreddit_name": "Berlin",
            "timezone": None,
            "total_posts": 4,
            "positive_count": 1,
            "neutral_count": 1,
            "negative_count": 2,
        },
        {
            "subreddit_id": 2,
            "subreddit_name": "Empty",
            "timezone": "UTC",
            "total_posts": 0,
            "positive_count": 0,
            "neutral_count": 0,
            "negative_count": 0,
        },
    ]

    result = await subreddits.get_subreddits_sentiment_distribution()

    assert result["overall"]["total_posts"] == 4
    assert result["overall"]["percentages"] == {
        "Positive": 25.0,
        "Neutral": 25.0,
        "Negative": 50.0,
    }
    assert result["by_subreddit"][0]["timezone"] == "UTC"
    assert result["by_subreddit"][1]["percentages"] == {
        "Positive": 0.0,
        "Neutral": 0.0,
        "Negative": 0.0,
    }


@pytest.mark.asyncio
async def test_subreddit_diurnal_frequency_fills_missing_hours(fake_db):
    fake_db.fetch.return_value = [
        {
            "local_hour": 23,
            "post_volume": 2,
            "positive_count": 1,
            "negative_count": 1,
            "neutral_count": 0,
            "avg_pos_score": 0.8,
            "avg_neg_score": 0.3,
        }
    ]

    result = await subreddits.get_subreddits_diurnal_frequency("Berlin")

    assert len(result["labels"]) == 24
    assert result["metrics"]["post_volumes"][23] == 2
    assert result["metrics"]["post_volumes"][0] == 0


@pytest.mark.asyncio
async def test_queue_manager_add_and_requeue_notify_listener(fake_db):
    await queue_manager.add_to_queue(fake_db, ["post-1", "post-2"], "Berlin")
    await queue_manager.force_requeue_posts(["post-1"], "Berlin")

    assert fake_db.executemany.await_count == 2
    assert fake_db.executemany.await_args_list[0].args[1] == [
        ("post-1", "Berlin"),
        ("post-2", "Berlin"),
    ]
    assert fake_db.execute.await_count == 2
    assert all(call.args[0] == "NOTIFY queue_updates;" for call in fake_db.execute.await_args_list)


@pytest.mark.asyncio
async def test_queue_manager_empty_add_does_not_write(fake_db):
    await queue_manager.add_to_queue(fake_db, [], "Berlin")
    await queue_manager.force_requeue_posts([], "Berlin")

    fake_db.executemany.assert_not_awaited()
    fake_db.execute.assert_not_awaited()


@pytest.mark.asyncio
async def test_queue_state_shapes_counts_and_tasks(fake_db):
    fake_db.fetchrow.return_value = {
        "total": 5,
        "pending": 2,
        "processing": 1,
        "completed": 1,
        "failed": 1,
    }
    fake_db.fetch.return_value = [{"post_id": "post-1", "status": "pending"}]

    counts, tasks = await queue.get_queue_state(limit=8)

    assert counts == {
        "total": 5,
        "pending": 2,
        "processing": 1,
        "completed": 1,
        "failed": 1,
    }
    assert tasks == [{"post_id": "post-1", "status": "pending"}]
    assert fake_db.fetch.await_args.args[1] == 8


@pytest.mark.asyncio
async def test_ignored_word_normalizes_input_and_marks_approval(fake_db):
    await ignored_words.db_add_ignored_word("  Reddit  ", language="en")

    query, word, language, approved = fake_db.execute.await_args.args
    assert "ON CONFLICT (word) DO NOTHING" in query
    assert (word, language, approved) == ("reddit", "en", False)


@pytest.mark.asyncio
async def test_ignored_word_approval_purges_and_updates_transactionally(fake_db):
    fake_db.execute.side_effect = ["UPDATE 2", "UPDATE 1"]

    result = await ignored_words.db_update_ignored_word(" Reddit ", "en", True)

    assert result == {
        "success": True,
        "affected_posts": 2,
        "processed": True,
    }
    assert fake_db.execute.await_count == 2
    assert fake_db.execute.await_args_list[0].args[1:] == ("reddit",)
    assert fake_db.execute.await_args_list[1].args[1:] == (
        "en",
        True,
        True,
        "reddit",
    )


@pytest.mark.asyncio
async def test_missing_ignored_word_returns_not_found(fake_db):
    fake_db.execute.side_effect = ["UPDATE 0", "UPDATE 0"]

    result = await ignored_words.db_update_ignored_word("missing", "en", True)

    assert result == {
        "success": False,
        "affected_posts": 0,
        "processed": False,
    }


@pytest.mark.asyncio
async def test_create_user_reports_insert_and_duplicate(fake_db):
    fake_db.execute.side_effect = ["INSERT 0 1", "INSERT 0 0"]

    created = await users.db_create_user_profile(
        "firebase-uid", "user@example.test", "Test User", "Guest User", 100
    )
    duplicate = await users.db_create_user_profile(
        "firebase-uid", "user@example.test", "Test User", "Guest User", 100
    )

    assert created is True
    assert duplicate is False
    assert fake_db.execute.await_args_list[0].args[1:] == (
        "firebase-uid",
        "user@example.test",
        "Test User",
        "Guest User",
        100,
    )


@pytest.mark.asyncio
async def test_update_user_rejects_empty_changes_without_database_access(fake_db):
    assert await users.db_update_user_profile(1) is False
    fake_db.fetchval.assert_not_awaited()
    fake_db.execute.assert_not_awaited()


@pytest.mark.asyncio
async def test_update_user_runs_sync_callback_in_thread(fake_db, monkeypatch):
    fake_db.fetchval.return_value = "firebase-uid"
    callback = lambda uid: uid
    callback_call = []

    async def fake_to_thread(fn, *args, **kwargs):
        callback_call.append((fn, args))
        return fn(*args, **kwargs)

    monkeypatch.setattr(asyncio, "to_thread", fake_to_thread)

    result = await users.db_update_user_profile(3, role="Admin", sync_callback=callback)

    assert result is True
    assert callback_call == [(callback, ("firebase-uid",))]
    assert "UPDATE users SET role = $1 WHERE id = $2" in fake_db.fetchval.await_args.args[0]


@pytest.mark.asyncio
async def test_update_user_supports_async_callback(fake_db):
    fake_db.fetchval.return_value = "firebase-uid"
    callback_calls = []

    async def sync_callback(uid):
        callback_calls.append(uid)

    result = await users.db_update_user_profile(
        3, calls_limit=20, sync_callback=sync_callback
    )

    assert result is True
    assert callback_calls == ["firebase-uid"]
    assert "api_calls_limit = $1" in fake_db.fetchval.await_args.args[0]


@pytest.mark.asyncio
async def test_update_user_missing_uid_returns_false(fake_db):
    fake_db.fetchval.return_value = None

    result = await users.db_update_user_profile(3, role="Admin")

    assert result is False


@pytest.mark.asyncio
async def test_delete_user_runs_callback_and_returns_uid(fake_db):
    fake_db.fetchval.return_value = "firebase-uid"
    called = []

    async def delete_identity(uid):
        called.append(uid)

    result = await users.db_delete_user_profile(3, sync_callback=delete_identity)

    assert result == "firebase-uid"
    assert called == ["firebase-uid"]


@pytest.mark.asyncio
async def test_delete_missing_user_returns_none(fake_db):
    fake_db.fetchval.return_value = None

    result = await users.db_delete_user_profile(3)

    assert result is None
