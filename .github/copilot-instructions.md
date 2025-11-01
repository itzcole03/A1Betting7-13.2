## A1Betting — Copilot Field Guide (concise)

Big picture

- Backend is FastAPI with a canonical app factory `backend/core/app.py:create_app()`. Always create apps via the factory; it registers middleware, routers, and compat shims deterministically.
- Responses must use the envelope `{success, data, error}`. Call `ok()` / `fail()` from `backend/core/app.py` in every route.
- Router pattern: each route module exposes `register()` and is included by `register_feature_routers()` to avoid duplicates on hot-reload/tests.
- Centralized facades under `backend/services/unified_*` (cache, metrics, session utils). Prefer them over ad‑hoc code.

Run and test

- Backend (dev): VS Code task “Start Backend (uvicorn)” or:
  `python -m uvicorn backend.core.app:create_app --factory --host 127.0.0.1 --port 8000 --reload`
- Frontend (dev): `cd frontend && npm run dev`
- Fast tests: `pytest -q` (focused: `python -m pytest path/to/test.py -q --maxfail=1`)

Key patterns (do this here)

- DB calls: use `unified_session_execute(session, stmt, params=...)` from `backend/services/unified_session_utils.py`. It prefers SQLModel `.exec()` and falls back to SQLAlchemy `.execute()`.
- Import hygiene: guard heavy libs (torch, ray, torch_geometric). Test‑only shims live in `tests/_compat`.
- Query optimizer: available via `backend/services/query_optimizer.py`. Safe, opt‑in pagination can be toggled with env `PERFORMANCE_ENABLE_SAFE_QUERY_PAGINATION=true` and `PERFORMANCE_DEFAULT_SELECT_LIMIT=1000`. Observability endpoints: `/api/observability/query-optimizer/{report|slow-queries|flags}`.
- PropFinder flow (reference): `backend/routes/propfinder_routes.py` → `backend/services/simple_propfinder_service.py` → `backend/services/unified_*` → frontend hooks/components.

When adding routes

- Place under `backend/routes/*`. Keep handlers thin: validate input, call services, return `ok()`.
- Export `register()` in the module; create_app will include via `register_feature_routers()`.
- Example:
  - `router = APIRouter(prefix="/api/example")`
  - `@router.get("/ping")` → `return ok({"pong": True})`
  - `def register(reg): reg.include_router(router)`

Files to inspect first

- `backend/core/app.py` (factory, ok/fail, router registration)
- `backend/routes/` (route modules and compat shims)
- `backend/services/unified_*` (cache/metrics/session helpers)
- Frontend service orchestrators: `frontend/src/services/MasterServiceRegistry.ts`, `frontend/src/services/EnhancedDataManager.ts`

Tooling you’ll use

- Codemods/scripts in `tools/` and `scripts/`; dry‑run and keep `.bak` backups.
- Shim guard: `tools/check_shims.py` (CI `.github/workflows/shims-guard.yml`).

Troubleshooting

- Duplicate routes in tests: ensure the module exports `register()` and avoid importing sub‑apps directly.
- Import‑time errors: `python -c "import backend.core.app"` then run a thin test file to surface failures.
- Envelope mismatches: fix by wrapping route returns with `ok()/fail()`.

Questions or gaps? Suggest a small example (route + test scaffold) and we’ll add it inline to the repo.
