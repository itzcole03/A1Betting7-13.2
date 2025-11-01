import importlib
import os


def test_dumps_loads_roundtrip():
    # Import module under test
    mod = importlib.import_module("backend.services.intelligent_cache_service")

    sample = {"a": 1, "b": [1, 2, 3], "c": {"x": "y"}}
    s = mod._dumps(sample)
    obj = mod._loads(s)

    assert obj == sample


def test_ttl_memoization_behavior():
    """Ensure _calculate_smart_ttl caches fallback TTLs for the configured window."""
    mod = importlib.import_module("backend.services.intelligent_cache_service")
    cls = mod.IntelligentCacheService

    svc = cls()

    # Use a deterministic key that is NOT in access_patterns so we hit the fallback
    key = "test:ttl:memo:key"
    base_ttl = 111

    # First call should compute and cache the value (returns base_ttl)
    import asyncio

    first = asyncio.run(svc._calculate_smart_ttl(key, base_ttl))
    assert first == base_ttl

    # Mutate access_patterns to a different value that would normally change TTL
    svc.access_patterns[key] = mod.CachePattern(
        key_pattern=key,
        access_frequency=9999,
        last_access=mod.datetime.now(),
        avg_ttl=60,
        data_size=10,
    )

    # Second immediate call should return the cached TTL (still base_ttl)
    second = asyncio.run(svc._calculate_smart_ttl(key, base_ttl))
    assert second == first

    # Expire the internal memoization entry and expect a different TTL (>=300)
    # Force expire timestamp
    if key in svc._ttl_cache:
        val, expires_at = svc._ttl_cache[key]
        svc._ttl_cache[key] = (val, 0.0)

    third = asyncio.run(svc._calculate_smart_ttl(key, base_ttl))
    # Since access_patterns shows heavy access, the smart TTL should be >= 300
    assert third >= 300


if __name__ == "__main__":
    test_dumps_loads_roundtrip()
    print("OK")
