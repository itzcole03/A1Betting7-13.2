import asyncio
import pytest

from backend.services import cache


def test_inmemory_cache_set_get():
    c = cache._InMemoryCache()
    # Simple set/get
    asyncio.run(c.set("k1", {"v": 1}, ttl=1))
    res = asyncio.run(c.get("k1"))
    assert res == {"v": 1}


def test_inmemory_cache_expiry():
    c = cache._InMemoryCache()
    asyncio.run(c.set("k2", "x", ttl=0))
    import time
    time.sleep(0.2)
    res = asyncio.run(c.get("k2"))
    assert res is None
