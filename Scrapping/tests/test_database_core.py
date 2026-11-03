from datetime import datetime
from unittest.mock import AsyncMock

import pytest

import database.core as database_core


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("2026-01-02T03:04:05", datetime(2026, 1, 2, 3, 4, 5)),
        ("2026-01-02T03:04:05Z", datetime(2026, 1, 2, 3, 4, 5)),
        ("2026-01-02T03:04:05+02:00", datetime(2026, 1, 2, 3, 4, 5, tzinfo=None)),
        ("", None),
        ("None", None),
        ("not-a-date", None),
    ],
)
def test_safe_parse_timestamp(value, expected):
    assert database_core.safe_parse_timestamp(value) == expected


@pytest.mark.asyncio
async def test_get_db_pool_creates_and_reuses_pool(monkeypatch):
    pool = object()
    create_pool = AsyncMock(return_value=pool)
    monkeypatch.setattr(database_core, "_pool", None)
    monkeypatch.setattr(database_core.asyncpg, "create_pool", create_pool)

    first = await database_core.get_db_pool()
    second = await database_core.get_db_pool()

    assert first is pool
    assert second is pool
    create_pool.assert_awaited_once_with(**database_core.DB_CONFIG)


@pytest.mark.asyncio
async def test_get_db_pool_propagates_connection_failure(monkeypatch):
    error = OSError("database unavailable")
    create_pool = AsyncMock(side_effect=error)
    monkeypatch.setattr(database_core, "_pool", None)
    monkeypatch.setattr(database_core.asyncpg, "create_pool", create_pool)

    with pytest.raises(OSError, match="database unavailable"):
        await database_core.get_db_pool()

    create_pool.assert_awaited_once_with(**database_core.DB_CONFIG)
