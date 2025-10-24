# A1Betting — Copilot Field Guide (concise)
## Quick architecture highlights
- Backend entry: FastAPI app factory at `backend/core/app.py` — always instantiate via `create_app()`.
- Frontend: Vite + React + TypeScript; central services in `frontend/src/services/MasterServiceRegistry.ts` and `EnhancedDataManager` (`frontend/src/services/EnhancedDataManager.ts`).
- PropFinder flow: `propfinder_routes.py` → `backend/services/simple_propfinder_service.py` → unified services/cache → frontend `src/hooks/usePropFinderData.ts` → `VirtualizedPropList`.

## Run & test (developer shortcuts)
- Start backend (dev): run VS Code task `🚀 Start PropFinder Development Environment` or:
	- python -m uvicorn backend.core.app:create_app --factory --host 127.0.0.1 --port 8000 --reload
- Frontend (dev): cd frontend && npm run dev
- Run tests: pytest --verbose --tb=short
- Health endpoints: GET /health, GET /api/health, GET /api/modern-ml/health

## Conventions & gotchas
- Responses use {success,data,error} — use ok()/fail() in `backend/core/app.py`.
- Feature flags are in `backend/config/settings.py` (e.g. APP_DEV_LEAN_MODE). Lean mode reduces telemetry and structured logs.
- Prefer `backend/services/unified_*` facades for caching/metrics rather than raw client calls.
- Use `unified_cache_service` for backend caching; frontend deterministic TTL keys live in `EnhancedDataManager`.

## Frontend practical patterns
- Use `VirtualizedPropList` for lists >100 rows to avoid rendering bottlenecks.
- Register services via `MasterServiceRegistry.getInstance()` so health panels and hooks pick them up.
- Extend `src/hooks/usePropFinderData.ts` when adding new query/filter types to keep serialization consistent.

## ML/ETL & integrations
- ML/ensemble and prediction code live in `backend/services` (e.g., modern_ml_service.py, prediction_engine.py). Heavy deps (torch, ray) are optional — guard imports.
- Use `/scripts` for batch pulls and recon (see `scripts/README.md`). ETL docs: `ETL_IMPLEMENTATION_PLAN.md`, `ETL_PIPELINE_ARCHITECTURE.md`.

## Diagnostics & troubleshooting
- Logs: backend -> `backend/logs/propollama.log`; frontend logs use `[PropOllamaUnified]` prefix.
- Refresh demo odds: POST /api/odds/refresh before GET /api/odds/*.
- Register routes using `register_feature_routers()` in `backend/core/app.py` to avoid duplicates during hot reload or tests.

## Files to consult
- Backend entry & routing: `backend/core/app.py`, `backend/routes/`
- PropFinder logic: `backend/services/simple_propfinder_service.py`, `propfinder_routes.py`
- Frontend hooks/services: `frontend/src/hooks/usePropFinderData.ts`, `frontend/src/services/EnhancedDataManager.ts`, `frontend/src/services/MasterServiceRegistry.ts`
- ETL/ML docs: `ETL_IMPLEMENTATION_PLAN.md`, `ML_ENSEMBLE_README.md`

If you'd like more examples (route template, test scaffold, or small service example), tell me which area to expand and I'll iterate.
# A1Betting — Copilot Field Guide
## Architecture
- Canonical FastAPI app lives in `backend/core/app.py`; always instantiate via `create_app()` so middleware order, standardized envelopes, and feature routers stay consistent.
- PropFinder stack flows `propfinder_routes.py` → `services/simple_propfinder_service.py` → unified data/cache services → frontend hook `src/hooks/usePropFinderData.ts` using `EnhancedDataManager`.
- Shared backend utilities live under `backend/services/unified_*`; prefer extending these facades instead of calling raw clients to keep metrics and caching centralized.
- Frontend aggregates data through `MasterServiceRegistry.getInstance()` and `EnhancedDataManager.mapToFeaturedProps(props, sport)`; skipping the `sport` argument strips featured props.
- WebSocket + batch interactions are handled by `frontend/src/services/EnhancedDataManager.ts`; reuse its batching/subscription APIs instead of ad-hoc sockets.

## Backend Workflow
- Start locally from repo root with `python -m uvicorn backend.core.app:create_app --factory --host 127.0.0.1 --port 8000 --reload`; VS Code task `🚀 Start PropFinder Development Environment` wires this up with the frontend.
- `APP_DEV_LEAN_MODE=true` (default in tasks) disables heavy logging/metrics middleware; drop it for performance investigations that need full telemetry.
- Primary test loop: `pytest --verbose --tb=short` at repo root; ingestion-only checks: `python -m pytest backend/tests/test_cache.py backend/tests/test_scheduler_runner.py -q`.
- When adding routes rely on `register_feature_routers()` (see `backend/core/app.py`) to avoid duplicate registration in tests and hot reload.
- Extended ML or inference endpoints should go through `backend/services/modern_ml_service.py`; guard optional torch/ray imports with try/except like existing patterns.

## Frontend Workflow
- Run from `frontend/` with `npm run dev` (5173); type safety via `npm run type-check`, unit tests via `npm run test -- --watchAll=false`.
- Prop dashboard uses `src/components/dashboard/PropFinderDashboard.tsx` with virtualization helpers (`components/lists/{PropList,VirtualizedPropList}.tsx`)—stick with these for tables >100 rows.
- Shared fetch logic lives in `src/hooks/usePropFinderData.ts`; extend its sanitizers when introducing new filter types so query serialization stays consistent.
- Register new services through `src/services/MasterServiceRegistry.ts` to populate the `ServiceHealthPanel` and ensure dependency injection works across hooks.

## Patterns & Conventions
- API responses follow `{success,data,error}` helpers defined in `backend/core/app.py`; reuse `ok()`/`fail()` when returning payloads to match error handling on the frontend.
- Feature flags: `USE_FREE_INGESTION`, `ENABLE_ODDS_SNAPSHOTS`, `APP_DEV_LEAN_MODE`, `DISABLE_STARTUP_HOOKS`, `POSITIVE_EV_FEED_DISABLED`; check `backend/config/settings.py` before toggling.
- Cache-aware backend services should use the `unified_cache_service` layer; frontend caches rely on TTL-aware keys in `EnhancedDataManager`—keep cache keys deterministic.
- When fetching props client-side, always pass the resolved sport to `mapToFeaturedProps` and honor the hook’s `refreshIntervalMs` (default 30s) unless you coordinate backend load changes.
- Zustand manages shared state (`frontend/src/state`); avoid duplicating orchestrators—instead extend `usePropOllamaState` or existing slices.

## Diagnostics & Integrations
- Health checks: `/health`, `/api/health`, `/api/modern-ml/health`, `/api/debug/status`; scripts expect 200 even on `HEAD` so keep responses lightweight.
- Logs: backend emits to `backend/logs/propollama.log` (structured when lean mode disabled); frontend logs share `[PropOllamaUnified]` prefix via `enhancedLogger`.
- External data: Prop ingestion combines PrizePicks, SportRadar, and odds APIs; go through `backend/services/comprehensive_prop_generator.py` for multi-source props or `/mlb/comprehensive-props/{game_id}` endpoint consumers.
- Deterministic in-memory odds MVP exposed under `/api/odds/*`; refresh via `POST /api/odds/refresh` before reading snapshots when demo data looks stale.
- Use `/scripts` utilities (see `scripts/README.md`) for recon and batch data pulls; pipeline commands assume repo-root execution with virtualenv already activated.
