from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException, WebSocketException

import auth_guard


def _api_user(**overrides):
    user = {
        "id": 4,
        "name": "Test User",
        "email": "user@example.test",
        "role": "Developer",
        "api_calls_limit": 10,
        "api_calls_count": 2,
    }
    user.update(overrides)
    return user


@pytest.mark.asyncio
async def test_http_api_key_authentication_increments_usage(monkeypatch):
    user = _api_user()
    lookup = AsyncMock(return_value=user)
    increment = AsyncMock()
    monkeypatch.setattr(auth_guard, "db_get_user_by_api_key", lookup)
    monkeypatch.setattr(auth_guard, "db_increment_api_usage", increment)

    identity = await auth_guard.verify_client_identity(
        request=None, authorization="Bearer test-api-key"
    )

    assert identity == {
        "id": 4,
        "name": "Test User",
        "email": "user@example.test",
        "role": "Developer",
        "auth_type": "api_key",
    }
    lookup.assert_awaited_once_with("test-api-key")
    increment.assert_awaited_once_with(4)


@pytest.mark.asyncio
async def test_http_api_key_authentication_rejects_unknown_key(monkeypatch):
    lookup = AsyncMock(return_value=None)
    increment = AsyncMock()
    monkeypatch.setattr(auth_guard, "db_get_user_by_api_key", lookup)
    monkeypatch.setattr(auth_guard, "db_increment_api_usage", increment)

    with pytest.raises(HTTPException) as error:
        await auth_guard.verify_client_identity(
            request=None, x_api_key="invalid-test-key"
        )

    assert error.value.status_code == 401
    increment.assert_not_awaited()


@pytest.mark.asyncio
async def test_http_api_key_limit_is_enforced_before_increment(monkeypatch):
    user = _api_user(api_calls_limit=2, api_calls_count=2)
    increment = AsyncMock()
    monkeypatch.setattr(
        auth_guard, "db_get_user_by_api_key", AsyncMock(return_value=user)
    )
    monkeypatch.setattr(auth_guard, "db_increment_api_usage", increment)

    with pytest.raises(HTTPException) as error:
        await auth_guard.verify_client_identity(
            request=None, x_api_key="limited-test-key"
        )

    assert error.value.status_code == 429
    increment.assert_not_awaited()


@pytest.mark.asyncio
async def test_http_api_key_allows_unlimited_quota(monkeypatch):
    user = _api_user(api_calls_limit=-1, api_calls_count=100)
    increment = AsyncMock()
    monkeypatch.setattr(
        auth_guard, "db_get_user_by_api_key", AsyncMock(return_value=user)
    )
    monkeypatch.setattr(auth_guard, "db_increment_api_usage", increment)

    identity = await auth_guard.verify_client_identity(
        request=None, x_api_key="unlimited-test-key"
    )

    assert identity["auth_type"] == "api_key"
    increment.assert_awaited_once_with(4)


@pytest.mark.asyncio
async def test_http_firebase_authentication_resolves_database_profile(monkeypatch):
    monkeypatch.setattr(
        auth_guard.firebase_auth,
        "verify_id_token",
        lambda token: {"uid": "firebase-test-uid"},
    )
    monkeypatch.setattr(
        auth_guard,
        "db_get_user_by_uid",
        AsyncMock(
            return_value={
                "id": 9,
                "name": "Firebase User",
                "email": "firebase@example.test",
                "role": "Admin",
            }
        ),
    )

    identity = await auth_guard.verify_client_identity(
        request=None, authorization="Bearer firebase-test-token"
    )

    assert identity["id"] == 9
    assert identity["role"] == "Admin"
    assert identity["auth_type"] == "firebase"


@pytest.mark.asyncio
async def test_http_firebase_rejects_invalid_token(monkeypatch):
    def reject_token(_token):
        raise ValueError("invalid test token")

    monkeypatch.setattr(auth_guard.firebase_auth, "verify_id_token", reject_token)

    with pytest.raises(HTTPException) as error:
        await auth_guard.verify_client_identity(
            request=None, authorization="Bearer invalid-test-token"
        )

    assert error.value.status_code == 401


@pytest.mark.asyncio
async def test_http_authentication_requires_credentials():
    with pytest.raises(HTTPException) as error:
        await auth_guard.verify_client_identity(request=None)

    assert error.value.status_code == 401


def test_role_guard_allows_and_rejects_configured_roles():
    guard = auth_guard.require_role(["Admin"])
    admin = {"role": "Admin"}
    guest = {"role": "Guest User"}

    assert guard(admin) is admin
    with pytest.raises(HTTPException) as error:
        guard(guest)
    assert error.value.status_code == 403


@pytest.mark.asyncio
async def test_websocket_api_key_authentication_checks_quota(monkeypatch):
    websocket = SimpleNamespace(
        headers={"x-api-key": "test-key"},
        query_params={},
    )
    monkeypatch.setattr(
        auth_guard,
        "db_get_user_by_api_key",
        AsyncMock(return_value=_api_user(api_calls_limit=1, api_calls_count=1)),
    )
    increment = AsyncMock()
    monkeypatch.setattr(auth_guard, "db_increment_api_usage", increment)

    with pytest.raises(WebSocketException):
        await auth_guard.verify_client_identity_ws(websocket)
    increment.assert_not_awaited()


@pytest.mark.asyncio
async def test_optional_websocket_auth_returns_none_for_missing_credentials():
    websocket = SimpleNamespace(headers={}, query_params={})

    assert await auth_guard.get_optional_client_identity_ws(websocket) is None
