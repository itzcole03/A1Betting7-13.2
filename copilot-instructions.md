# Copilot Instructions — A1Betting7-13.2

Purpose: provide short, actionable guidance for AI coding agents working in this repo.

Quick rules
- Backend work: run commands from the repository root (`A1Betting7-13.2/`).
- Frontend work: run commands from `frontend/` for Vite dev, type-check and tests.
- Ports: backend 8000, frontend 5173 (Vite proxy → backend).

Essential commands
```pwsh
# Start backend (from repo root)
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
# Run focused pytest
python -m pytest tests/test_health_endpoint.py -q
# Frontend (from repo root)
cd frontend && npm run dev
cd frontend && npm run type-check
```

Project patterns (do these)
- Directory discipline: many scripts depend on exact CWD. Use project root for backend tasks and `frontend/` for frontend tasks.
- Prefer unified services under `backend/services/unified_*` for fetcher, cache, logging and error handling.
- Use lazy imports for optional heavy deps (torch, xgboost) with graceful fallbacks.
- Tests set `TESTING` / `DATABASE_URL` in `tests/conftest*.py`. Avoid import-time DB connections.
- When tests import routers, edit the same module the tests import (import-time ordering matters).

Key files to inspect
- `backend/main.py` — dev entrypoint used by uvicorn
- `backend/core/app.py` — app factory & central route registration
- `backend/services/` — look for `unified_*` services
- `backend/routes/` — API routes (tests often import routers directly)
- `tests/conftest.py`, `tests/conftest_db.py` — test fixtures
- `frontend/src/hooks/usePropFinderData.tsx` and `frontend/src/components/dashboard/PropFinderDashboard.tsx`

Testing & editing guidance
- Run a focused pytest collection first when changing imports or adding deps: `python -m pytest tests/test_health_endpoint.py -q`.
- If tests fail at collection with ModuleNotFoundError, either add a guarded import, add a thin shim under `backend/services/`, or install the missing minimal dependency.
- Preserve both `httpx.AsyncClient(app=...)` and `TestClient` call patterns when possible.

When to ask a human
- Any change touching `backend/main.py`, DB migrations, API schemas/models, ML model code, or adding native system dependencies (PyTorch, xgboost). Stop and request review.

Quick sanity checks
- Health: `curl http://127.0.0.1:8000/api/diagnostics/health`
- PropFinder: `curl -s "http://127.0.0.1:8000/api/propfinder/opportunities" | head -c 500`

If you want this file expanded (registry examples, TypeScript patterns, or service usage snippets), tell me which area to expand next.
