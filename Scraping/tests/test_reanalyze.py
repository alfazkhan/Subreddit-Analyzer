from unittest.mock import AsyncMock

import pytest

from Routes import routes_reanalyze


@pytest.fixture
def pipeline_manager(monkeypatch):
    manager = routes_reanalyze.GlobalPipelineManager()
    manager.broadcast_payload = AsyncMock()
    monkeypatch.setattr(routes_reanalyze, "global_manager", manager)
    return manager


@pytest.mark.asyncio
async def test_reanalysis_reports_when_no_posts_match(pipeline_manager, monkeypatch):
    fetch_posts = AsyncMock(return_value=[])
    monkeypatch.setattr(
        routes_reanalyze, "get_all_posts_for_dynamic_reanalysis", fetch_posts
    )

    await routes_reanalyze.run_dynamic_text_reanalysis(
        "Berlin", ["keywords"], True, {"ignored"}, "2026-01-01", "2026-01-31"
    )

    fetch_posts.assert_awaited_once_with(
        "Berlin", ["keywords"], True, "2026-01-01", "2026-01-31"
    )
    assert pipeline_manager.broadcast_payload.await_args.args[0] == "info"
    assert pipeline_manager.total == 0


@pytest.mark.asyncio
async def test_reanalysis_updates_only_requested_pipeline(pipeline_manager, monkeypatch):
    post = {
        "id": "post-1",
        "title": "Rent is rising",
        "body": "Existing body",
        "sentiment": "Negative",
        "sentiment_scores": '{"negative": 0.8}',
        "keywords": '{"old": 1}',
        "entities": '[{"text": "Berlin", "label": "GPE"}]',
        "topics": '{"primary_topic": "Housing"}',
    }
    monkeypatch.setattr(
        routes_reanalyze,
        "get_all_posts_for_dynamic_reanalysis",
        AsyncMock(return_value=[post]),
    )
    extract = lambda text, ignored: {"rent": 2}
    monkeypatch.setattr(routes_reanalyze, "extract_keywords", extract)
    update = AsyncMock()
    monkeypatch.setattr(routes_reanalyze, "update_post_nlp_data", update)

    await routes_reanalyze.run_dynamic_text_reanalysis(
        "Berlin", ["keywords"], False, {"ignored"}
    )

    update.assert_awaited_once_with(
        "post-1",
        "Negative",
        {"negative": 0.8},
        {"rent": 2},
        [{"text": "Berlin", "label": "GPE"}],
        {"primary_topic": "Housing"},
    )
    assert pipeline_manager.processed == 1
    assert pipeline_manager.total == 1
    assert pipeline_manager.percent == 100
    assert pipeline_manager.broadcast_payload.await_args.args[0] == "progress"


@pytest.mark.asyncio
async def test_reanalysis_orchestrator_filters_inactive_targets_and_marks_keywords(
    pipeline_manager, monkeypatch
):
    subreddits = [
        {"id": 1, "name": "Berlin", "is_active": True},
        {"id": 2, "name": "Paris", "is_active": True},
        {"id": 3, "name": "Inactive", "is_active": False},
    ]
    monkeypatch.setattr(
        routes_reanalyze, "db_get_all_subreddits", AsyncMock(return_value=subreddits)
    )
    monkeypatch.setattr(
        routes_reanalyze, "get_all_ignored_words", AsyncMock(return_value={"the"})
    )
    process = AsyncMock()
    monkeypatch.setattr(routes_reanalyze, "run_dynamic_text_reanalysis", process)
    mark_processed = AsyncMock()
    monkeypatch.setattr(
        routes_reanalyze, "mark_ignored_words_as_processed", mark_processed
    )

    await routes_reanalyze.dynamic_pipeline_orchestrator(
        ["keywords"], True, target_subreddits=[2, "Berlin"]
    )

    assert [call.args[0] for call in process.await_args_list] == ["Berlin", "Paris"]
    assert all(call.args[3] == {"the"} for call in process.await_args_list)
    mark_processed.assert_awaited_once()
    assert pipeline_manager.current_status == "stopped"
    assert pipeline_manager.broadcast_payload.await_args.args[0] == "complete"


@pytest.mark.asyncio
async def test_reanalysis_orchestrator_reports_no_active_matches(pipeline_manager, monkeypatch):
    monkeypatch.setattr(
        routes_reanalyze,
        "db_get_all_subreddits",
        AsyncMock(return_value=[{"id": 1, "name": "Inactive", "is_active": False}]),
    )
    process = AsyncMock()
    monkeypatch.setattr(routes_reanalyze, "run_dynamic_text_reanalysis", process)

    await routes_reanalyze.dynamic_pipeline_orchestrator(
        ["sentiment"], False, target_subreddits=["missing"]
    )

    process.assert_not_awaited()
    assert pipeline_manager.current_status == "stopped"
    assert pipeline_manager.broadcast_payload.await_args.args[0] == "error"
