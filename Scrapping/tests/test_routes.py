from unittest.mock import AsyncMock, Mock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import auth_guard
from Routes import (
    routes_ignored_words,
    routes_kpis,
    routes_posts,
    routes_queue,
    routes_subreddits,
    routes_users,
)


@pytest.fixture
def api_client(monkeypatch):
    app = FastAPI()
    app.include_router(routes_posts.router)
    app.include_router(routes_subreddits.router)
    app.include_router(routes_ignored_words.router)
    app.include_router(routes_kpis.router)
    app.include_router(routes_queue.router)
    app.include_router(routes_users.router)
    monkeypatch.setattr(
        routes_queue, "listen_to_queue_changes", AsyncMock(return_value=None)
    )
    app.dependency_overrides[auth_guard.verify_client_identity] = lambda: {
        "id": 1,
        "name": "Test Admin",
        "email": "admin@example.test",
        "role": "Super Admin",
        "auth_type": "test",
    }
    with TestClient(app) as client:
        yield client


def test_post_listing_passes_pagination_to_database(api_client, monkeypatch):
    fetch_posts = AsyncMock(
        return_value={"items": [], "next_cursor": None, "has_more": False}
    )
    monkeypatch.setattr(routes_posts, "fetch_posts_cursor_paginated", fetch_posts)

    response = api_client.get("/posts?limit=5&direction=prev&subreddit=Berlin")

    assert response.status_code == 200
    assert response.json()["items"] == []
    fetch_posts.assert_awaited_once_with(
        limit=5, cursor=None, direction="prev", subreddit="Berlin"
    )


def test_post_listing_rejects_out_of_range_limit(api_client, monkeypatch):
    fetch_posts = AsyncMock()
    monkeypatch.setattr(routes_posts, "fetch_posts_cursor_paginated", fetch_posts)

    response = api_client.get("/posts?limit=101")

    assert response.status_code == 422
    fetch_posts.assert_not_awaited()


def test_post_update_requires_a_valid_field(api_client, monkeypatch):
    update_post = AsyncMock()
    monkeypatch.setattr(routes_posts, "db_update_post", update_post)

    response = api_client.put(
        "/posts/Berlin/post-1", json={"not_editable": "value"}
    )

    assert response.status_code == 400
    update_post.assert_not_awaited()


def test_post_update_filters_unknown_fields(api_client, monkeypatch):
    update_post = AsyncMock(return_value=True)
    monkeypatch.setattr(routes_posts, "db_update_post", update_post)

    response = api_client.put(
        "/posts/Berlin/post-1",
        json={"title": "Updated", "not_editable": "ignored"},
    )

    assert response.status_code == 200
    update_post.assert_awaited_once_with("post-1", {"title": "Updated"})


def test_subreddit_creation_passes_validated_payload(api_client, monkeypatch):
    create_subreddit = AsyncMock(return_value=4)
    monkeypatch.setattr(routes_subreddits, "db_create_subreddit", create_subreddit)

    response = api_client.post(
        "/subreddits",
        json={
            "name": "Berlin",
            "description": "City",
            "total_users": 500,
            "timezone": "Europe/Berlin",
        },
    )

    assert response.status_code == 201
    assert response.json()["id"] == 4
    create_subreddit.assert_awaited_once_with(
        name="Berlin",
        description="City",
        total_users=500,
        is_active=True,
        keep_updated=False,
        timezone="Europe/Berlin",
    )


def test_subreddit_update_returns_404_for_missing_target(api_client, monkeypatch):
    monkeypatch.setattr(
        routes_subreddits, "db_get_subreddit", AsyncMock(return_value=None)
    )
    update_subreddit = AsyncMock()
    monkeypatch.setattr(routes_subreddits, "db_update_subreddit", update_subreddit)

    response = api_client.put("/subreddits/missing", json={"is_active": False})

    assert response.status_code == 404
    update_subreddit.assert_not_awaited()


def test_subreddit_update_preserves_unspecified_fields(api_client, monkeypatch):
    existing = {
        "description": "Existing",
        "total_users": 100,
        "is_active": True,
        "keep_updated": False,
        "timezone": "UTC",
    }
    monkeypatch.setattr(
        routes_subreddits, "db_get_subreddit", AsyncMock(return_value=existing)
    )
    update_subreddit = AsyncMock(return_value=True)
    monkeypatch.setattr(routes_subreddits, "db_update_subreddit", update_subreddit)

    response = api_client.put("/subreddits/Berlin", json={"is_active": False})

    assert response.status_code == 200
    update_subreddit.assert_awaited_once_with(
        name="Berlin",
        description="Existing",
        total_users=100,
        is_active=False,
        keep_updated=False,
        timezone="UTC",
    )


def test_ignored_word_submission_forces_pending_approval(api_client, monkeypatch):
    add_word = AsyncMock()
    monkeypatch.setattr(routes_ignored_words, "db_add_ignored_word", add_word)

    response = api_client.post(
        "/ignored-words",
        json=[{"word": "example", "language": "en", "approved": True}],
    )

    assert response.status_code == 201
    add_word.assert_awaited_once_with("example", "en", False)


def test_protected_subreddit_route_rejects_guest(monkeypatch):
    app = FastAPI()
    app.include_router(routes_subreddits.router)
    app.dependency_overrides[auth_guard.verify_client_identity] = lambda: {
        "id": 2,
        "role": "Guest User",
    }
    create_subreddit = AsyncMock()
    monkeypatch.setattr(routes_subreddits, "db_create_subreddit", create_subreddit)

    with TestClient(app) as client:
        response = client.post("/subreddits", json={"name": "Berlin"})

    assert response.status_code == 403
    create_subreddit.assert_not_awaited()


def test_kpi_route_passes_date_and_granularity_filters(api_client, monkeypatch):
    calculate_kpis = AsyncMock(return_value=([{"post_count": 2}], {"total": 2}, "Berlin"))
    monkeypatch.setattr(routes_kpis, "calculate_db_kpis_timeseries", calculate_kpis)

    response = api_client.get(
        "/kpis/7?start_date=2026-10-01&end_date=2026-10-31&granularity=weekly&sma_window=3"
    )

    assert response.status_code == 200
    assert response.json()["subreddit_name"] == "Berlin"
    assert response.json()["time_series"] == [{"post_count": 2}]
    calculate_kpis.assert_awaited_once_with(
        subreddit_id=7,
        start_date="2026-10-01",
        end_date="2026-10-31",
        granularity="weekly",
        sma_window=3,
    )


def test_kpi_route_returns_404_for_missing_subreddit(api_client, monkeypatch):
    monkeypatch.setattr(
        routes_kpis,
        "calculate_db_kpis_timeseries",
        AsyncMock(return_value=([], {}, None)),
    )

    response = api_client.get("/kpis/999")

    assert response.status_code == 404


def test_queue_route_returns_counts_and_tasks(api_client, monkeypatch):
    get_queue = AsyncMock(
        return_value=(
            {"total": 2, "pending": 1, "processing": 1, "completed": 0, "failed": 0},
            [{"post_id": "post-1", "status": "pending"}],
        )
    )
    monkeypatch.setattr(routes_queue, "get_queue_state", get_queue)

    response = api_client.get("/queue")

    assert response.status_code == 200
    assert response.json()["counts"]["pending"] == 1
    assert response.json()["tasks"] == [{"post_id": "post-1", "status": "pending"}]


def test_queue_requeue_route_delegates_to_database(api_client, monkeypatch):
    requeue = AsyncMock()
    monkeypatch.setattr(routes_queue, "force_requeue_posts", requeue)

    response = api_client.put("/queue/Berlin/post-1")

    assert response.status_code == 200
    requeue.assert_awaited_once_with(["post-1"], "Berlin")


def test_users_route_lists_profiles_for_super_admin(api_client, monkeypatch):
    list_users = AsyncMock(return_value=[{"id": 1, "role": "Admin"}])
    monkeypatch.setattr(routes_users, "db_get_all_users", list_users)

    response = api_client.get("/users")

    assert response.status_code == 200
    assert response.json() == [{"id": 1, "role": "Admin"}]
    list_users.assert_awaited_once()


def test_users_route_rejects_guest(monkeypatch):
    app = FastAPI()
    app.include_router(routes_users.router)
    app.dependency_overrides[auth_guard.verify_client_identity] = lambda: {
        "id": 2,
        "role": "Guest User",
    }
    list_users = AsyncMock()
    monkeypatch.setattr(routes_users, "db_get_all_users", list_users)

    with TestClient(app) as client:
        response = client.get("/users")

    assert response.status_code == 403
    list_users.assert_not_awaited()


def test_user_creation_rolls_back_firebase_when_database_insert_fails(
    api_client, monkeypatch
):
    firebase_user = type("FirebaseUser", (), {"uid": "test-uid"})()
    create_firebase_user = Mock(return_value=firebase_user)
    delete_firebase_user = Mock()
    monkeypatch.setattr(
        routes_users.firebase_auth, "create_user", create_firebase_user
    )
    monkeypatch.setattr(
        routes_users.firebase_auth, "delete_user", delete_firebase_user
    )
    monkeypatch.setattr(
        routes_users, "db_create_user_profile", AsyncMock(return_value=False)
    )

    response = api_client.post(
        "/users/create",
        json={
            "email": "new-user@example.test",
            "password": "test-only-password",
            "name": "New User",
        },
    )

    assert response.status_code == 500
    create_firebase_user.assert_called_once()
    delete_firebase_user.assert_called_once_with("test-uid")
