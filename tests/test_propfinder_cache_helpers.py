def test_cache_set_and_get_etag_roundtrip():
    """Verify the in-module TTL cache helper generates a deterministic ETag
    and returns the stored payload via _cache_get.
    """
    from backend.routes import propfinder_routes as pr

    key = "pf:test:cachehelpers"
    payload = {"opportunities": [{"id": "p1", "player": "X"}], "total": 1, "filtered": 1, "summary": {}}

    etag = pr._cache_set(key, payload, ttl=2.0)
    assert etag, "_cache_set should return a non-empty etag string"

    cached = pr._cache_get(key)
    assert cached is not None, "_cache_get should return the cached entry"
    assert cached.get("etag") == etag
    assert cached.get("payload") == payload

    # A second set with the same payload should produce the same etag
    etag2 = pr._cache_set(key, payload, ttl=2.0)
    assert etag2 == etag
