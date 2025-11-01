## A1Betting — Copilot Playbook

**Architecture truths**

- Build every FastAPI app via `backend/core/app.py:create_app()` so middleware (CORS → ID → tracing → logging → metrics → guards) and router registration stay deterministic.
- HTTP handlers must return the `{success, data, error}` envelope using `ok()` / `fail()` from the app factory; never return bare dicts.
- Feature routers live in `backend/routes/*`, expose `register(registry)`, and should only orchestrate services such as `backend/services/simple_propfinder_service.py` or `backend/services/unified_*` facades.
- Query/data utilities centralize under `backend/services/unified_*`; prefer them for cache, metrics, session execution (`unified_session_execute`) instead of ad‑hoc SQL or httpx clients.

**Daily workflows**

- Backend dev server: VS Code task “Start Backend (uvicorn)” or `python -m uvicorn backend.core.app:create_app --factory --host 127.0.0.1 --port 8000 --reload` from repo root.
- Frontend dev server: `cd frontend && npm run dev` (expects API at `http://127.0.0.1:8000`).
- Fast backend tests: `pytest -q`; focus with `python -m pytest backend/tests/test_query_optimizer.py -q --maxfail=1`. Frontend checks: `npm run test`, `npm run type-check`.
- When debugging imports, run `python -c "import backend.core.app"` before pytest to surface wiring errors early.

**Patterns to copy**

- DB access flows through `unified_session_execute(session, stmt, params=...)`; it keeps SQLModel/SQLAlchemy compatibility and ties into query optimizer telemetry.
- Guard heavy or optional dependencies (torch, ray, xgboost) with lazy imports and fallbacks; tests rely on shims in `tests/_compat`.
- Batch MLB prop generation, query optimizer jobs, and other async fan-out code throttle concurrency with `asyncio.Semaphore` + `asyncio.gather(..., return_exceptions=True)` as shown in `backend/services/mlb_provider_client.py`.
- Logging follows lazy formatting (`logger.info("... %s", value)`) and error paths fire `MLBProviderClient.alert_event(...)` or similar alert helpers instead of bare prints.

**Observability & tuning**

- Safe pagination is opt-in: set `PERFORMANCE_ENABLE_SAFE_QUERY_PAGINATION=true` and `PERFORMANCE_DEFAULT_SELECT_LIMIT=1000` (or override) to constrain broad selects.
- Query optimizer reports live at `/api/observability/query-optimizer/{report,slow-queries,flags}`; tests for these endpoints sit under `backend/tests/test_query_optimizer*.py`.
- Lean dev mode (`APP_DEV_LEAN_MODE=true`) strips heavy middleware; `SKIP_BROKEN_ROUTES=true` prevents experimental routers from registering during triage.

**Frontend integration**

- The prop dashboards (`frontend/src/components/dashboard/PropFinderDashboard.tsx`) consume data via hooks in `frontend/src/hooks/usePropFinderData.ts`; server endpoints must preserve the existing schema (see `frontend/src/services/MasterServiceRegistry.ts`).
- Shared telemetry/formatting flows through `frontend/src/utils/enhancedLogger.ts` and `frontend/src/services/EnhancedDataManager.ts`; reuse these instead of re-implementing fetch or caching logic.

**Tooling quick hits**

- Scripts in `tools/` and `scripts/` assume the repo root CWD and create `.bak` files when they rewrite sources—inspect diffs before committing.
- CI enforces shim hygiene via `tools/check_shims.py`; keep optional integrations behind guards to satisfy the workflow.

**When unsure**

- Ping a maintainer before changing API envelopes, database migrations, or ML model artifacts, and surface any new third-party dependency requirements.
