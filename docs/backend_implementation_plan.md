# Backend Implementation Plan — Phase 2 (Free Ingestion)

This document breaks the backend work into sprint-sized tasks for switching ingestion to free providers (MLB Stats API + Baseball Savant), adding caching, backfill, metrics, and safe rollout.

Sprint 1 — Core integration (3 days)
- Task: Finalize `unified_data_fetcher` adapter wiring
  - Estimate: 0.5 day
  - Deliverable: `unified_data_fetcher.get_props(sport, params)` calls correct connector and returns normalized `FeaturedProp[]`.
  - Tests: unit tests for normalized schema.
- Task: Ensure `scheduler_runner.run_once()` robustly calls `unified_data_fetcher` and stores snapshot
  - Estimate: 0.5 day
  - Deliverable: `run_once()` writes snapshot to `cache.set(snapshot_key, snapshot, ttl)` and increments `IngestionMetrics`.
  - Tests: unit test verifying cache write and metrics increment.
- Task: Guarded startup wiring behind `USE_FREE_INGESTION` flag
  - Estimate: 0.25 day
  - Deliverable: Scheduler only starts when `USE_FREE_INGESTION=true`.
  - Tests: integration test with flag variations.
- Task: Admin routes (run-once, backfill stub)
  - Estimate: 0.25 day
  - Deliverable: `POST /api/ingestion/run-once` calls `run_once()` and returns result.
  - Tests: route-level test verifying endpoint returns expected JSON.

Sprint 2 — Caching & Backfill (5 days)
- Task: Implement `backend/services/cache.py` Redis wrapper with in-memory fallback
  - Estimate: 1 day
  - Deliverable: `cache.get/set/delete` with TTL, and `is_redis_available()`.
  - Tests: unit tests for redis mock fallback and TTL behavior.
- Task: Backfill worker scaffold `backend/ingestion/backfill_worker.py`
  - Estimate: 2 days
  - Deliverable: CLI entry `python -m backend.ingestion.backfill_worker --start --end` that performs chunked backfill, idempotency via snapshot keys, and pluggable storage adapter.
  - Tests: unit tests for chunking and idempotency; integration smoke test using in-memory storage.
- Task: Storage adapter interface + S3 mock implementation
  - Estimate: 1 day
  - Deliverable: `backend/ingestion/storage_adapter.py` with `upload_snapshot(key, data)` and `list_snapshots()`; S3 adapter using boto3 (optional) and an in-memory adapter for tests.
  - Tests: adapter unit tests (in-memory only in CI by default).
- Task: Backfill admin route full implementation (async trigger + status)
  - Estimate: 1 day
  - Deliverable: `POST /api/ingestion/backfill` enqueues backfill and returns job id, `GET /api/ingestion/backfill/{job_id}` returns status.
  - Tests: route-level test and basic job lifecycle test (in-memory queue).

Sprint 3 — Metrics & Monitoring (3 days)
- Task: Wire `backend/metrics/ingestion_metrics.py` to Prometheus
  - Estimate: 1 day
  - Deliverable: Prometheus exposition under `/metrics` with ingestion counters (success/failure), latency histogram, and last_run_timestamp gauge.
  - Tests: unit tests for metric increments; integration test to scrape `/metrics`.
- Task: Add alerting playbook and SLIs
  - Estimate: 1 day
  - Deliverable: SLIs (ingestion success rate > 98% over 1h), runbook for provider failures.
- Task: Add monitoring health checks (Redis, S3, connectors)
  - Estimate: 1 day
  - Deliverable: health probes integrated into `/api/health` and Prometheus metrics.

Sprint 4 — Integration & Clean-up (4 days)
- Task: Integration tests for MLB Stats and Baseball Savant connectors (sandboxed)
  - Estimate: 2 days
  - Deliverable: Integration tests that can be run locally with env var toggles; stable mock-mode for CI.
- Task: Remove paid-provider usage plan + `.env.example` update
  - Estimate: 1 day
  - Deliverable: Documented deprecation steps, `.env.example` updated, migration PR template.
- Task: Performance verification & stress test for snapshot read path
  - Estimate: 1 day
  - Deliverable: Performance script to load `GET /api/propfinder/opportunities` with cached snapshots and measure latency.

Acceptance criteria (Phase 2)
- Snapshots are stored and readable from cache/DB with consistent `sport` field.
- Scheduler run_once and admin route both produce identical snapshots.
- Prometheus exposes ingestion metrics and `/metrics` is scrapeable.
- Backfill worker idempotent and can resume from last successful chunk.
- CI runs ingestion tests (fast) and nightly full-suite runs with `USE_FREE_INGESTION=false` by default.

Dependencies & Risks
- Redis availability in staging/prod — provide in-memory fallback for dev/CI.
- API rate limits for MLB Stats / Baseball Savant — include retry + backoff and fallbacks.
- Migration from paid SDKs — plan for careful deprecation window and feature toggles.

If this looks good I will mark the backend plan task completed in the project TODOs and then scaffold the `backfill_worker.py` (next priority).
