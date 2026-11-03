from unittest.mock import AsyncMock, Mock

import pytest

import migrate


class AsyncTransaction:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        return False


def _migration_connection(applied=()):
    connection = Mock()
    connection.execute = AsyncMock()
    connection.fetch = AsyncMock(return_value=[{"version": version} for version in applied])
    connection.transaction = Mock(return_value=AsyncTransaction())
    connection.close = AsyncMock()
    return connection


@pytest.mark.asyncio
async def test_migrations_run_in_order_and_skip_applied_files(tmp_path, monkeypatch):
    (tmp_path / "0002_second.sql").write_text("SELECT 2;", encoding="utf-8")
    (tmp_path / "0001_first.sql").write_text("SELECT 1;", encoding="utf-8")
    (tmp_path / "0003_applied.sql").write_text("SELECT 3;", encoding="utf-8")
    connection = _migration_connection(applied={"0003_applied.sql"})
    connect = AsyncMock(return_value=connection)
    monkeypatch.setattr(migrate, "MIGRATIONS_DIR", str(tmp_path))
    monkeypatch.setattr(migrate.asyncpg, "connect", connect)

    await migrate.run_migrations()

    connect.assert_awaited_once_with(**migrate.DB_CONFIG)
    executed_sql = [call.args[0] for call in connection.execute.await_args_list]
    assert "SELECT 1;" in executed_sql
    assert "SELECT 2;" in executed_sql
    assert "SELECT 3;" not in executed_sql
    assert executed_sql.index("SELECT 1;") < executed_sql.index("SELECT 2;")
    assert ("0001_first.sql",) in [
        call.args[1:] for call in connection.execute.await_args_list
    ]
    assert ("0002_second.sql",) in [
        call.args[1:] for call in connection.execute.await_args_list
    ]
    connection.close.assert_awaited_once()


@pytest.mark.asyncio
async def test_empty_migration_is_not_recorded(tmp_path, monkeypatch):
    (tmp_path / "0001_empty.sql").write_text("  \n", encoding="utf-8")
    connection = _migration_connection()
    monkeypatch.setattr(migrate, "MIGRATIONS_DIR", str(tmp_path))
    monkeypatch.setattr(
        migrate.asyncpg, "connect", AsyncMock(return_value=connection)
    )

    await migrate.run_migrations()

    assert not any(
        call.args[0] == "INSERT INTO schema_migrations (version) VALUES ($1)"
        for call in connection.execute.await_args_list
    )
    connection.close.assert_awaited_once()


@pytest.mark.asyncio
async def test_migration_failure_exits_and_closes_connection(tmp_path, monkeypatch):
    (tmp_path / "0001_failing.sql").write_text("INVALID SQL;", encoding="utf-8")
    connection = _migration_connection()
    connection.execute.side_effect = RuntimeError("migration failed")
    monkeypatch.setattr(migrate, "MIGRATIONS_DIR", str(tmp_path))
    monkeypatch.setattr(
        migrate.asyncpg, "connect", AsyncMock(return_value=connection)
    )

    with pytest.raises(SystemExit) as error:
        await migrate.run_migrations()

    assert error.value.code == 1
    connection.close.assert_awaited_once()
