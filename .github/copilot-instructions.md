# A1Betting — Copilot Field Guide (concise)

This short guide gives an AI coding agent the essential facts to be productive quickly.

Key architecture (read first)

- Backend entry: `backend/core/app.py` — always instantiate the FastAPI app via `create_app()` (example: `python -m uvicorn backend.core.app:create_app --factory --reload`). This registers middleware and feature routers correctly.
- Canonical flow (PropFinder): `propfinder_routes.py` → `backend/services/simple_propfinder_service.py` → `backend/services/unified_*` (caching/metrics) → `frontend/src/hooks/usePropFinderData.ts` → `frontend/src/components/lists/VirtualizedPropList.tsx`.

Developer shortcuts

- Start backend (dev): use VS Code task "Start Backend (uvicorn)" or:
  python -m uvicorn backend.core.app:create_app --factory --host 127.0.0.1 --port 8000 --reload
- Frontend (dev): cd frontend && npm run dev
- Run tests fast: pytest -q

Project conventions (must follow)

- API envelope: responses must be {success, data, error}. Use `ok()` / `fail()` helpers from `backend/core/app.py`.
- Routes must export a `register()` hook consumed by `register_feature_routers()` to avoid duplicate routers during hot-reload and pytest collection.
- Central facades: prefer `backend/services/unified_*` (cache, metrics, downstream clients) rather than ad-hoc caching or duplicate keys.
- Heavy ML libs (torch, ray, torch_geometric) must be lazily imported or guarded; test-only stubs live under `tests/_compat`.

DB & session guidance (practical)

- Use `unified_session_execute(session, stmt, params=...)` from `backend/services/unified_session_utils.py` when awaiting DB statements — it prefers SQLModel `.exec()` when available and falls back to `.execute()` for SQLAlchemy sessions.
- When converting `session.execute(...)` to `.exec()`, do so conservatively and run focused tests; codemods live in `tools/` for dry-runs.

Tooling, codemods & CI

- Codemod & helper scripts: `tools/` and `scripts/`. Dry-run codemods and keep backups (`.bak`).
- Shim guard: `tools/check_shims.py` prevents heavy top-level imports; CI job `.github/workflows/shims-guard.yml` runs it. Keep test-only shims under `tests/_compat`.

Quick PR checklist for AI agents

1. Use `ok()` / `fail()` for API responses.
2. New routes export `register()`; `register_feature_routers()` will include them.
3. Use `unified_*` facades for caching/metrics and `unified_session_execute` for DB calls.
4. Guard heavy optional imports or provide `tests/_compat` stubs.
5. Run focused tests for changed areas, then full pytest suite before PR.

Files to read first

- `backend/core/app.py`, `backend/routes/`
- `backend/services/simple_propfinder_service.py`, `propfinder_routes.py`
- `backend/services/unified_*` (cache, metrics, session utils)
- `frontend/src/services/MasterServiceRegistry.ts`, `frontend/src/services/EnhancedDataManager.ts`

If you want one of these expanded into examples (route + test scaffold, an exec/execute codemod template, or a short PR template) tell me which and I will add it.
A1Betting — Copilot Field Guide (brief)

Purpose

- Give an AI coding agent the minimal, high-value facts to be immediately productive in this repository.

Key architecture touchpoints (read these first)

- Backend entry: `backend/core/app.py` — always instantiate the FastAPI app via create_app()
  (e.g. `python -m uvicorn backend.core.app:create_app --factory --reload`). This ensures
  middleware, envelopes and feature routers register reliably.
- PropFinder flow: `propfinder_routes.py` → `backend/services/simple_propfinder_service.py` →
  `backend/services/unified_*` (cache/metrics) → `frontend/src/hooks/usePropFinderData.ts` →
  `frontend/src/components/lists/VirtualizedPropList.tsx`.
- Frontend orchestrators: `frontend/src/services/MasterServiceRegistry.ts` and
  `frontend/src/services/EnhancedDataManager.ts` — register client services here so hooks and
  the admin health panel discover them.

Developer workflows (commands & VS Code tasks)

- Start backend (dev): use the VS Code task "Start Backend (uvicorn)" or run:
  python -m uvicorn backend.core.app:create_app --factory --host 127.0.0.1 --port 8000 --reload
- Frontend (dev): cd frontend && npm run dev (VS Code task: "Start Frontend (Vite)")
- Run tests quickly: pytest --verbose --tb=short (or use provided test tasks).

Project-specific conventions you must follow

- API envelope: routes must return the standardized envelope {success, data, error}.
  Use `ok()` / `fail()` helpers from `backend/core/app.py` to ensure consistency.
- Route registration: export a `register()` function in route modules and let
  `register_feature_routers()` include them — this prevents duplicate routers during hot-reload
  and pytest collection.
- Centralized facades: use `backend/services/unified_*` (and `unified_cache_service`) for
  caching, metrics and downstream clients. These facades centralize TTLs, keys and observability.
- Feature flags: edit `backend/config/settings.py` (examples: `APP_DEV_LEAN_MODE`,
  `DISABLE_STARTUP_HOOKS`). Tests/dev tasks set `APP_DEV_LEAN_MODE=true` by default.
- Guard heavy optional ML deps (torch, ray) with try/except to avoid import-time crashes.

Patterns & hotspots to inspect when changing behavior

- ETag/caching: `backend/middleware/caching_middleware.py` — prefer computing ETag from
  response.body or fallback to json.dumps for plain dicts. Tests and shims rely on this behavior.
- PropFinder caching keys & TTLs live in `unified_cache_service` facades — change there
  to avoid inconsistent cache keys across code.
- Timezones: tests historically expect naive datetimes. When updating services prefer storing
  timezone-aware UTC internally and be tolerant when reading legacy naive timestamps (treat as UTC).

Codemods, migrations & large search/replace

- Codemod tools live under `tools/` and `scripts/` (e.g. `tools/replace_utc_ast_codemod.py`,
  `scripts/apply_datetime_codmod.py`). Dry-run by default and create `.bak` backups when applying.
  Example: `python tools/replace_utc_ast_codemod.py --dry-run backend` and
  `python tools/replace_utc_ast_codemod.py --apply backend/some_file.py`.

Tests and CI guidance

- CI job: `.github/workflows/codemod-and-tests.yml` runs a codemod dry-run and pytest on PRs
  and uploads `pytest.log` + `warnings_by_message.csv` artifacts. Use these to triage high-frequency
  warnings before approving broad changes.
- If adding backend routes, include tests that call the route and assert the `ok()/fail()` envelope.

Quick PR checklist for contributors (AI agents)

1. Does the change use `ok()` / `fail()` envelopes? If not, adapt route.
2. If adding routes, export `register()` and ensure `register_feature_routers()` will include it.
3. Use `unified_*` facades for caching/metrics or add a wrapper there instead of ad-hoc caching.
4. Guard heavy optional imports and keep startup fast in dev/test.
5. Add/adjust tests; run focused tests, then the full pytest suite locally before PR.

Files worth reading for examples

- App & routing: `backend/core/app.py`, `backend/routes/` (route template present in repo docs)
- PropFinder: `backend/services/simple_propfinder_service.py`, `propfinder_routes.py`
- Unified facades: `backend/services/unified_*`
- Frontend: `frontend/src/services/EnhancedDataManager.ts`, `frontend/src/services/MasterServiceRegistry.ts`,
  `frontend/src/hooks/usePropFinderData.ts`

If anything here is unclear or you want the field guide expanded (examples, a route+test scaffold
or a small codemod template), tell me which section to expand and I'll update this file.

# A1Betting — Copilot Field Guide (concise)

## A1Betting — Copilot Field Guide (concise)

This file gives an AI/code-assistant the minimal, high-value facts to be productive in this repo.

Key points

- Backend entry: FastAPI app factory at `backend/core/app.py` — always instantiate via `create_app()` (this ensures middleware, standardized envelopes and feature routers load correctly).
- Frontend: Vite + React + TypeScript. Central orchestrators: `frontend/src/services/MasterServiceRegistry.ts` and `frontend/src/services/EnhancedDataManager.ts`.
- Canonical data flow (PropFinder): `propfinder_routes.py` → `backend/services/simple_propfinder_service.py` → `backend/services/unified_*` (cache/metrics) → `frontend/src/hooks/usePropFinderData.ts` → `VirtualizedPropList`.

Run & debug shortcuts (dev)

- Start backend (dev): run VS Code task "Start Backend (uvicorn)" or:
  python -m uvicorn backend.core.app:create_app --factory --host 127.0.0.1 --port 8000 --reload
- Frontend (dev): cd frontend && npm run dev
- Run tests quickly: pytest --verbose --tb=short (workspace contains targeted tasks like "Run PrizePicks tests (pytest)").

Project-specific conventions (do not change lightly)

- API envelope: responses are {success, data, error}. Use ok()/fail() wrappers in `backend/core/app.py` for consistency.
- Route registration: call `register_feature_routers()` (see `backend/core/app.py`) to avoid duplicate routers during hot-reload and pytest collection.
- Use the `backend/services/unified_*` facades (and `unified_cache_service`) for caching, metrics and downstream clients — these centralize TTL/keys and observability.
- Feature flags live in `backend/config/settings.py` (examples: `APP_DEV_LEAN_MODE`, `DISABLE_STARTUP_HOOKS`, `ENABLE_ODDS_SNAPSHOTS`). Tests and VS Code tasks set `APP_DEV_LEAN_MODE=true` by default; unset for full telemetry.
- Guard heavy optional ML deps (torch, ray) with try/except in `backend/services/*` to avoid import-time crashes in dev/test.

Frontend patterns and pitfalls

- Virtualize lists >100 rows: use `frontend/src/components/lists/VirtualizedPropList.tsx` to avoid rendering bottlenecks.
- Register client services with `MasterServiceRegistry.getInstance()` so `ServiceHealthPanel` and hooks can find them.
- Add new query/filter fields via `frontend/src/hooks/usePropFinderData.ts` so serialization and cache keys remain consistent.

Integration & operability notes

- Health endpoints used by scripts: `/health`, `/api/health`, `/api/modern-ml/health`.
- Backend logs: `backend/logs/propollama.log`.
- Many internal scripts live under `scripts/`; ETL docs are `ETL_IMPLEMENTATION_PLAN.md` and `ETL_PIPELINE_ARCHITECTURE.md`.
- VS Code task names to know: "Start Backend (uvicorn)", "Run PrizePicks tests (pytest)", and other test tasks that run targeted pytest invocations.

Files to consult for examples

- App & routing: `backend/core/app.py`, `backend/routes/`
- PropFinder: `backend/services/simple_propfinder_service.py`, `propfinder_routes.py`
- Unified facades: `backend/services/unified_*`
- Frontend orchestrators: `frontend/src/services/EnhancedDataManager.ts`, `frontend/src/services/MasterServiceRegistry.ts`, `frontend/src/hooks/usePropFinderData.ts`

Admin dashboard (frontend/admin)

- The admin UI is a React-admin dashboard focused on secure business-rule management: auth + audit are required for API calls.
- Prefer Material UI and Monaco/Ace for YAML editing; ensure edits are auditable and calls are authenticated.

If any section is unclear or you'd like a deeper, example-driven expansion (route template, small service + test scaffold, or a PR checklist), tell me which area to expand and I will iterate.

---

## Expanded examples & quick scaffolds

These short, copy-pasteable templates are intentionally minimal. Follow the repo patterns (use `ok()/fail()` envelopes, `register_feature_routers()`, and unified facades) when adapting them.

1. Route template (backend)

Place new routes under `backend/routes/`. Use `register_feature_routers()` in your module so hot-reload/tests don't duplicate routers.

Example (minimal):

```py
# backend/routes/example_route.py
from fastapi import APIRouter
from backend.core.app import ok, fail, register_feature_routers

router = APIRouter(prefix="/api/example")

@router.get("/ping")
def ping():
  return ok({"pong": True})

def register(router_registry):
  # called by register_feature_routers()
  router_registry.include_router(router)

register_feature_routers.register = register
```

Notes: put business logic into `backend/services/...` (see `simple_propfinder_service.py`). Keep routes thin — they should validate inputs and call services.

2. Minimal backend service + test scaffold

Service (use unified facades and caching when applicable):

```py
# backend/services/example_service.py
from backend.services.unified_cache_service import unified_cache_service

def get_example(id: str):
  key = f"example:{id}"
  cached = unified_cache_service.get(key)
  if cached is not None:
    return cached
  # replace with real call
  result = {"id": id, "value": "hello"}
  unified_cache_service.set(key, result, ttl=60)
  return result
```

Test scaffold (pytest):

```py
# backend/tests/test_example_service.py
from backend.services.example_service import get_example

def test_get_example_returns_shape():
  res = get_example('abc')
  assert res['id'] == 'abc'
  assert 'value' in res
```

Run single test quickly:

```bash
python -m pytest backend/tests/test_example_service.py -q --tb=short
```

3. PR checklist (quick, focused)

- Does the route use `ok()` / `fail()` envelopes from `backend/core/app.py`?
- If adding backend routes, did you add/modify a `register()` hook and ensure `register_feature_routers()` picks it up?
- Are heavy optional imports (torch/ray) guarded in `backend/services/*`?
- Did you add/adjust feature flags in `backend/config/settings.py` if needed?
- Frontend: did you register any new client services in `MasterServiceRegistry` and extend `usePropFinderData` if you added query params?
- Tests: add a unit test for the service and a small integration test for the route (pytest).
- Lint & type: run repo linters / type-checkers used by the frontend/backend pipelines.

4. Troubleshooting quick hits

- Test import-time failures: run `python -c "import backend.core.app"` and `python -m pytest backend/tests/test_collect_only -q` to expose import errors.
- Duplicate routers during tests/hot reload: ensure the module exports a `register()` and `register_feature_routers()` is used by `create_app()`.
- Unexpected missing data in frontend lists: check `EnhancedDataManager` batching behavior and ensure cache keys match `EnhancedDataManager` TTL scheme.
- Heavy ML imports breaking tests: make sure imports are guarded with try/except and fall back to stubs.
- Use the VS Code tasks provided (Start Backend (uvicorn), Run PrizePicks tests (pytest)) for reproducible runs.

---

If you'd like any of these expanded into a runnable example file (with tests and a small README), tell me which one and I'll scaffold it in the repo and run the relevant tests.
