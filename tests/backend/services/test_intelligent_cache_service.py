"""Regression tests for the IntelligentCacheService fallback behaviour."""

import asyncio
import time
from typing import Any, cast

import pytest
import redis.asyncio as redis_async
from redis import exceptions as redis_exceptions
from unittest.mock import AsyncMock, Mock

from backend.services.intelligent_cache_service import IntelligentCacheService


@pytest.mark.asyncio
async def test_get_switches_to_memory_on_redis_error(monkeypatch: pytest.MonkeyPatch) -> None:
    """A Redis failure during get() should trigger memory fallback and reconnect scheduling."""
    service = IntelligentCacheService()
    service._lean_mode = False
    service._initialization_attempted = True
    service._use_memory_fallback = False
    service._redis_pool = cast(redis_async.ConnectionPool, Mock())

    monkeypatch.setattr(service, "_ensure_memory_tasks", AsyncMock())
    schedule_mock = Mock()
    monkeypatch.setattr(service, "_schedule_redis_reconnect", schedule_mock)

    async def failing_redis_get(key: str, default: Any) -> Any:
        raise redis_exceptions.ConnectionError("redis unreachable")

    monkeypatch.setattr(service, "_redis_get", AsyncMock(side_effect=failing_redis_get))

    result = await service.get("ev:test:key", default="default-value")

    assert result == "default-value"
    assert service._use_memory_fallback is True
    assert schedule_mock.call_count == 1


@pytest.mark.asyncio
async def test_set_falls_back_to_memory_and_persists(monkeypatch: pytest.MonkeyPatch) -> None:
    """set() should store values in the memory cache when Redis writes fail."""
    service = IntelligentCacheService()
    service._lean_mode = False
    service._initialization_attempted = True
    service._use_memory_fallback = False
    service._redis_pool = cast(redis_async.ConnectionPool, Mock())

    monkeypatch.setattr(service, "_ensure_memory_tasks", AsyncMock())
    schedule_mock = Mock()
    monkeypatch.setattr(service, "_schedule_redis_reconnect", schedule_mock)
    monkeypatch.setattr(service, "_calculate_smart_ttl", AsyncMock(return_value=30))

    async def failing_redis_set(key: str, value: Any, ttl: int) -> bool:
        raise redis_exceptions.TimeoutError("redis timeout")

    monkeypatch.setattr(service, "_redis_set", AsyncMock(side_effect=failing_redis_set))

    payload = {"confidence": 0.75}
    result = await service.set("ev:test:set", payload, ttl_seconds=15, use_pipeline=False)

    assert result is True
    assert service._use_memory_fallback is True
    assert schedule_mock.call_count == 1
    assert service._memory_cache["ev:test:set"] == payload
    assert service._memory_cache_ttl["ev:test:set"] > time.time()


class _DummyTask:
    def __init__(self, done_value: bool = False) -> None:
        self._done_value = done_value

    def done(self) -> bool:  # pragma: no cover - trivial helper
        return self._done_value


def _fake_create_task_factory(record: list):
    def _fake_create_task(coro):
        record.append(coro)
        coro.close()
        return cast(asyncio.Task, _DummyTask())

    return _fake_create_task


@pytest.mark.asyncio
async def test_schedule_reconnect_avoids_duplicate_tasks(monkeypatch: pytest.MonkeyPatch) -> None:
    """Only one reconnect task should be active at a time."""
    service = IntelligentCacheService()
    service._lean_mode = False
    service._use_memory_fallback = True

    created_coroutines = []
    monkeypatch.setattr(asyncio, "create_task", _fake_create_task_factory(created_coroutines))

    service._schedule_redis_reconnect()
    assert len(created_coroutines) == 1
    assert isinstance(service._reconnect_task, _DummyTask)

    # Because the dummy task reports not-done, a second schedule should be ignored.
    service._schedule_redis_reconnect()
    assert len(created_coroutines) == 1

    # If the existing task finishes, a new schedule should be allowed.
    service._reconnect_task = cast(asyncio.Task, _DummyTask(done_value=True))
    service._schedule_redis_reconnect()
    assert len(created_coroutines) == 2
