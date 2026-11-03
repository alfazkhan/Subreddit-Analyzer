import asyncio

import pytest

import refresh_keywords_bg
import scan_complete_feed
import run_worker


@pytest.mark.asyncio
async def test_keyword_purge_removes_ignored_words_and_persists_results(monkeypatch):
    monkeypatch.setattr(
        refresh_keywords_bg,
        "get_post_keywords_for_cleaning",
        _async_return(
            [
                {"id": "post-1", "keywords": '{"keep": 2, "remove": 1}'},
                {"id": "post-2", "keywords": "invalid-json"},
            ]
        ),
    )
    update_keywords = _async_return(None)
    monkeypatch.setattr(
        refresh_keywords_bg, "update_post_keywords_only", update_keywords
    )

    await refresh_keywords_bg.purge_subreddit_keywords("Berlin", {"remove"})

    assert update_keywords.await_args_list[0].args == (
        "post-1",
        {"keep": 2},
    )
    assert update_keywords.await_args_list[1].args == ("post-2", {})


@pytest.mark.asyncio
async def test_keyword_purge_skips_empty_subreddit(monkeypatch):
    update_keywords = _async_return(None)
    monkeypatch.setattr(
        refresh_keywords_bg,
        "get_post_keywords_for_cleaning",
        _async_return([]),
    )
    monkeypatch.setattr(
        refresh_keywords_bg, "update_post_keywords_only", update_keywords
    )

    await refresh_keywords_bg.purge_subreddit_keywords("Berlin", set())

    update_keywords.assert_not_awaited()


@pytest.mark.asyncio
async def test_deep_scan_uses_cli_subreddits_and_exhaustive_mode(monkeypatch):
    monkeypatch.setattr(scan_complete_feed.sys, "argv", ["scan_complete_feed.py", "Berlin", "Paris"])
    discover = _async_return(None)
    monkeypatch.setattr(scan_complete_feed, "run_discovery_scan", discover)
    monkeypatch.setattr(scan_complete_feed.asyncio, "sleep", _async_return(None))

    await scan_complete_feed.main()

    assert [call.args[0] for call in discover.await_args_list] == ["Berlin", "Paris"]
    assert all(call.kwargs["mode"] == "exhaustive" for call in discover.await_args_list)


@pytest.mark.asyncio
async def test_worker_resets_stuck_tasks_before_starting_cycle(monkeypatch):
    class StopWorker(Exception):
        pass

    class Connection:
        async def execute(self, query):
            self.query = query

    class Pool:
        def acquire(self):
            return _Acquire(connection)

    connection = Connection()
    monkeypatch.setattr(run_worker, "get_db_pool", _async_return(Pool()))
    monkeypatch.setattr(run_worker, "get_active_subreddits", _async_return([]))

    async def stop_after_one_cycle(_delay):
        raise StopWorker

    monkeypatch.setattr(asyncio, "sleep", stop_after_one_cycle)

    with pytest.raises(StopWorker):
        await run_worker.background_worker()

    assert connection.query == (
        "UPDATE scraping_queue SET status = 'pending' WHERE status = 'processing'"
    )


def _async_return(value):
    from unittest.mock import AsyncMock

    return AsyncMock(return_value=value)


class _Acquire:
    def __init__(self, connection):
        self.connection = connection

    async def __aenter__(self):
        return self.connection

    async def __aexit__(self, exc_type, exc_value, traceback):
        return False
