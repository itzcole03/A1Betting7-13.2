# Unified Cache Migration Status

_Last updated: 2025-11-02_

## Recent Progress

- `backend/services/cache.py` now fronts the canonical `UnifiedCacheService` with lazy detection and an automatic fallback (`_RedisCache` or in-memory). New helpers expose `backend_name()` and `get_metrics()` for diagnostics.
- Ingestion scheduler modules (`backend/ingestion/scheduler.py`, `scheduler_runner.py`) continue to rely on `backend.services.cache.redis_cache`, so existing batch jobs benefit from the unified facade without code churn.
- `backend/routes/betting.py` now reads/writes opportunities via the unified facade (5-minute TTL, hashed filter keys) instead of using `RedisCacheService` directly.
- `backend/services/health/health_collector.py` performs cache roundtrip checks through the unified wrapper, reporting backend flavor and cache metrics when available.
- Deprecated `backend/services/redis_cache_service.py` has been fully removed after confirming no remaining imports, eliminating the legacy entry point entirely.

## Pending Work

1. **Expose richer diagnostics**: consider surfacing `get_metrics()` output via `/api/health` once metric structure is finalized.
2. **Standardize cache keys**: document the prefix/hash pattern (`a1betting:<domain>:<md5>`) so future routes follow the same convention.
3. **Test coverage**: add focused tests for the `_UnifiedFirstCache` wrapper (fallback sequencing, metrics helper, roundtrip) and betting route cache behavior.

## Owner Notes

- Keep using `redis_cache` from `backend.services.cache` for all new features.
- When a module needs custom helpers (e.g., snapshot lists), implement them atop the unified wrapper instead of re-introducing direct Redis clients.
