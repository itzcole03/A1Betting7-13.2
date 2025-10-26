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
