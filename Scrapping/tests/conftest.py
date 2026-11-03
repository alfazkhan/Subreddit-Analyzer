from unittest.mock import AsyncMock, Mock

import pytest

import database.core as database_core


class _AsyncContext:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        return False


class _AcquireContext:
    def __init__(self, connection):
        self.connection = connection

    async def __aenter__(self):
        return self.connection

    async def __aexit__(self, exc_type, exc_value, traceback):
        return False


class FakePool:
    def __init__(self, connection):
        self.connection = connection

    def acquire(self):
        return _AcquireContext(self.connection)


@pytest.fixture
def fake_db(monkeypatch):
    connection = Mock()
    connection.execute = AsyncMock(return_value="UPDATE 1")
    connection.executemany = AsyncMock()
    connection.fetch = AsyncMock(return_value=[])
    connection.fetchrow = AsyncMock(return_value=None)
    connection.fetchval = AsyncMock(return_value=None)
    connection.add_listener = AsyncMock()
    connection.transaction = Mock(return_value=_AsyncContext())

    monkeypatch.setattr(database_core, "_pool", FakePool(connection))
    return connection
