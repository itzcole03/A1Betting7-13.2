# A1Betting — Sports Prop Analytics Platform

[![Markdown Lint](https://github.com/itzcole03/A1Betting7-13.2/actions/workflows/markdown-lint.yml/badge.svg)](https://github.com/itzcole03/A1Betting7-13.2/actions/workflows/markdown-lint.yml)
[![CI Tests](https://github.com/itzcole03/A1Betting7-13.2/actions/workflows/ci.yml/badge.svg)](https://github.com/itzcole03/A1Betting7-13.2/actions/workflows/ci.yml)
![Coverage](https://img.shields.io/badge/coverage-pending-lightgrey)

A1Betting is a full-stack sports prop analytics platform inspired by PropFinder’s workflow and evolved with fast search, arbitrage detection, and explainable analytics. The backend is built on FastAPI with a canonical app factory, while the frontend uses React + TypeScript with virtualized dashboards for large prop tables.

---

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Architecture at a Glance](#architecture-at-a-glance)
- [Key Capabilities](#key-capabilities)
- [Backend Reference](#backend-reference)
- [Frontend Reference](#frontend-reference)
- [Configuration](#configuration)
- [Testing & QA](#testing--qa)
- [Observability & Operations](#observability--operations)
- [Security & Data Hygiene](#security--data-hygiene)
- [Reference Documents](#reference-documents)
- [Contributing](#contributing)

---

## Overview

- **Backend**: `backend/` — FastAPI, Pydantic v2, SQLAlchemy async, unified services for caching, metrics, session helpers, and a query optimizer with opt-in safe pagination.
- **Frontend**: `frontend/` — React 19 + TypeScript + Vite, Zustand state, Tailwind CSS, Jest/Playwright tests, and componentized PropFinder-style dashboards.
- **Observability**: Structured logging, optional Prometheus metrics, query optimizer reports (`/api/observability/query-optimizer/*`), and lean dev mode that trims heavy middleware.
- **Data flows**: Prop search via PropFinder routes, ingestion/admin APIs for data refresh, unified service registry on the frontend, and scripts for diagnostics in `scripts/` and `tools/`.

---

## Quick Start

> **Prerequisites**: Python 3.11+, Node.js 20+, npm 10+, optional Redis/PostgreSQL for production parity.

### Clone & install

```bash
git clone https://github.com/itzcole03/A1Betting7-13.2.git
cd A1Betting7-13.2
```

### Run the backend (canonical app factory)

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt

# Start FastAPI using the app factory so middleware/routers register correctly
python -m uvicorn backend.core.app:create_app \
  --factory --host 127.0.0.1 --port 8000 --reload
```

- API docs live at `http://127.0.0.1:8000/docs`.
- Health endpoint: `GET /health` (envelope `{success, data, error}`).

### Run the frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

- The frontend defaults to demo data when the backend is offline.
- Proxy targets `http://localhost:8000` for API calls; keep the backend on port `8000` during development.

### Common developer scripts

```bash
# Backend (repo root)
pytest -q                     # run backend tests
python -m pytest backend/tests/test_query_optimizer.py -q  # focused optimizer tests

# Frontend (frontend/)

npm run test:e2e               # Playwright smoke tests
npm run type-check             # Strict TypeScript project checks
```

VS Code tasks `Start Backend (uvicorn)` and `Start Frontend (Vite)` are available under **Run › Tasks** for one-click setup.

---

## Architecture at a Glance

| Path                         | Purpose                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `backend/core/app.py`        | Canonical FastAPI app factory (`create_app`), middleware stack, `ok()/fail()` helpers, feature router registration. |
| `backend/routes/`            | REST endpoints. Each module exports `register()` to integrate with the factory without double inclusion.            |
| `backend/services/`          | Business services: query optimizer, unified caching, session helpers, ML utilities, ingestion pipelines.            |
| `backend/config/settings.py` | Pydantic settings with env prefixes (`APP_`, `PERFORMANCE_`, etc.).                                                 |
| `backend/tests/`             | Pytest suite (unit + route tests) with fixtures mirroring app factory behavior.                                     |
| `frontend/src/components/`   | Prop dashboards, arbitrage panels, analytics widgets.                                                               |
| `frontend/src/services/`     | Master service registry, API adapters, caching utilities.                                                           |
| `scripts/` & `tools/`        | Diagnostics, ETL helpers, bundle analyzers, shim guards.                                                            |

Key backend patterns:

- Create apps **only** through `create_app()` to ensure middleware ordering (CORS → Request ID → Trace → Logging → Metrics → Payload guard → Rate limit → Security headers) and deterministic router registration.
- All HTTP responses must use `ok()` / `fail()` from the app factory to keep the `{success, data, error, meta}` envelope consistent.
- Database calls should go through `unified_session_execute(session, stmt, params=...)` for compatibility across SQLModel and SQLAlchemy executors.

---

## Key Capabilities

### PropFinder-style prop explorer

- Primary routes in `backend/routes/propfinder_routes.py` plus legacy shims for backwards compatibility.
- Frontend dashboard `frontend/src/components/dashboard/PropFinderDashboard.tsx` renders virtualized tables (>10k props) with debounced search, confidence/edge filters, arbitrage heat indicators, and bookmarking.
- Hooks such as `frontend/src/hooks/usePropFinderData.ts` manage React Query caching, realtime updates, and error boundaries.

### Query optimizer & observability

- Core logic in `backend/services/query_optimizer.py`, including conservative safe pagination, slow query tracking, and unified cache integration.
- Opt-in flags exposed via environment variables (`PERFORMANCE_ENABLE_SAFE_QUERY_PAGINATION`, `PERFORMANCE_DEFAULT_SELECT_LIMIT`) and can be toggled at runtime by hitting:
  - `GET  /api/observability/query-optimizer/report`
  - `GET  /api/observability/query-optimizer/slow-queries`
  - `POST /api/observability/query-optimizer/flags` with `{ "enable_safe_query_pagination": true, "default_select_limit": 500 }`
- Tests: `backend/tests/test_query_optimizer.py` and `backend/tests/test_query_optimizer_routes.py` cover flag behavior, response envelopes, and slow query snapshots.

### Ingestion & admin tooling

- Operational endpoints under `backend/routes/ingestion_routes.py` and `backend/routes/ingestion_admin_routes.py` support manual refreshes, health checks, and admin dashboards.
- Scripts in `scripts/` (e.g., `analyze_database.py`, `apply_analytics_migration.py`) assist with one-off maintenance.

### Frontend service registry

- `frontend/src/services/MasterServiceRegistry.ts` and `frontend/src/services/UnifiedRegistryAdapter.ts` expose a simple DI container for analytics modules, caching layers, and ML adapters.
- Utility services (`frontend/src/utils/enhancedLogger.ts`, `frontend/src/utils/evFormatting.ts`) centralize formatting and telemetry to keep components focused on rendering.

---

## Backend Reference

### Running the canonical app

- Always start the API using `backend.core.app:create_app`. Shortcut entrypoints (e.g., `backend/main.py`) are wrappers and may omit middleware.
- Feature routers must provide a `register(registry)` function. The app factory calls `register_feature_routers()` exactly once to prevent duplicate routes during hot reloads or tests.
- Lean development mode (`APP_DEV_LEAN_MODE=true`) skips heavy middleware like Prometheus and structured logging for faster local feedback.

### Environment-driven behavior

- `PERFORMANCE_ENABLE_SAFE_QUERY_PAGINATION=true` enforces a default `LIMIT` on SELECTs without explicit bounds to guard against table scans.
- `PERFORMANCE_DEFAULT_SELECT_LIMIT=1000` (override as needed) sets the opt-in limit.
- `SKIP_BROKEN_ROUTES=true` prevents optional routers from registering, useful when an experimental module is misbehaving during tests.
- `DISABLE_STARTUP_HOOKS=true` short-circuits expensive startup tasks when debugging locally.

### Middleware stack

1. `CORSMiddleware`
2. `RequestIdMiddleware`
3. `DistributedTraceMiddleware`
4. Structured logging (skipped in lean mode)
5. Prometheus metrics (optional)
6. Payload guard (request size/content-type enforcement)
7. Rate limiting (configurable via env vars)
8. Security headers before hitting routers

### Database access

- All async DB work should use SQLAlchemy `AsyncSession`.
- Use `unified_session_execute()` to run SQLModel `Select`, SQLAlchemy text, or raw SQL while keeping telemetry consistent.
- Query optimizer automatically records metrics, caches results when `advanced_caching_system` is available, and tracks slow queries for `/slow-queries` endpoint.

---

## Frontend Reference

### Tooling & stack

- React 19, TypeScript strict mode, Vite 7, Tailwind CSS 4.
- State management with Zustand, server-state caching via React Query, animation via Framer Motion, virtualized tables via `@tanstack/react-virtual`.
- Testing with Jest + React Testing Library, Playwright for E2E flows, Vitest available for lightweight component tests.

### Core components

- `frontend/src/components/dashboard/PropFinderDashboard.tsx` — main prop explorer with debounced search, EV indicators, and arbitrage surfacing.
- `frontend/src/components/arbitrage/LiveArbitragePanel.tsx` — real-time arbitrage summary widget.
- `frontend/src/components/analysis/MovementAnalysis.tsx` — trend visualizations using Chart.js.
- Shared UI primitives live under `frontend/src/components/base/` (buttons, tables, tooltips).
- Advanced UI patterns live under `frontend/src/components/shared/ui/`.

### Commands

```bash
npm run dev            # Vite dev server
npm run build          # Production bundle
npm run preview        # Serve built assets locally
npm run test           # Jest unit suite
npm run test:e2e       # Playwright tests (requires dev server)
npm run type-check     # TS project wide type analysis
npm run lint           # ESLint with --max-warnings 0
npm run format         # Prettier over src/
```

### Frontend configuration

- `.env` variables consumed by Vite should be defined with the `VITE_` prefix (e.g., `VITE_API_BASE_URL=http://localhost:8000`).
- `frontend/tailwind.config.js` and `frontend/postcss.config.js` control styling pipeline.
- `frontend/scripts/` contains bundle analyzers, virtualization audits, and performance monitors for CI.

---

## Configuration

Create `backend/.env` (not committed) for local development. Minimal template:

```env
# Backend fundamentals
DATABASE_URL=sqlite+aiosqlite:///./data/a1betting.db
APP_ENVIRONMENT=development
APP_DEV_LEAN_MODE=true

# Optional external integrations
SPORTRADAR_API_KEY=your_key_here
ODDS_API_KEY=

# Performance & safety
PERFORMANCE_ENABLE_SAFE_QUERY_PAGINATION=true
PERFORMANCE_DEFAULT_SELECT_LIMIT=1000

# Proxy target for the frontend
VITE_API_BASE_URL=http://localhost:8000
```

Additional env files:

- `frontend/.env` for Vite-specific overrides.
- `docker/.env` or compose files for container deployments.

---

## Testing & QA

### Backend

- Default command: `pytest -q` from the repo root (ensures fixtures add project path and load env).
- Focused suites: `python -m pytest backend/tests/test_query_optimizer_routes.py -q --maxfail=1`.
- Use `USE_FREE_INGESTION=false` in CI to prevent background ingestion tasks from starting during tests.

### Frontend

- `npm run test` (unit), `npm run test:e2e` (Playwright), `npm run test:coverage` for HTML coverage report.
- Accessibility and bundle-size checks available through `npm run test:a11y` and `npm run analyze` respectively.

### Lint & quality gates

- Python: `black backend/`, `ruff check backend/`, `mypy backend/` (ruff config lives in `pyproject.toml` if present).
- TypeScript: `npm run lint`, `npm run type-check`.
- Security: `npm run security` (npm audit), `pip install bandit && bandit -r backend` when running manual hardening scans.

---

## Observability & Operations

### Query optimizer insights

- `GET  /api/observability/query-optimizer/report` — aggregated metrics, slow query histogram, cache hit stats.
- `GET  /api/observability/query-optimizer/slow-queries` — last 100 slow queries with durations and SQL excerpts.
- `POST /api/observability/query-optimizer/flags` — runtime tuning for safe pagination/default limits.

### Metrics & tracing

- Prometheus middleware automatically exposes `/metrics` when `prometheus-client` is installed. Disable by setting `MONITORING_ENABLE_PROMETHEUS=false`.
- Request correlation: `RequestIdMiddleware` injects `X-Request-ID`; logs include trace IDs when the distributed tracing middleware is enabled.

### Lean mode

- Set `APP_DEV_LEAN_MODE=true` to bypass heavy telemetry and rate limiting during local development. Affected components log `[LeanMode]` markers when skipped.

### Health endpoints

- `GET /health` and `/api/health` share the same envelope.
- Legacy aliases (e.g., `/api/v2/health`) are routed through `backend/routes/testing_compat_shims_minimal.py` for smoke checks.

---

## Security & Data Hygiene

- Sensitive artifacts (databases, logs, cookies) must stay inside the ignored `data/` directory. See `data/README.md` for the approved layout.
- `SECURITY_ACTIONS.md` tracks ongoing remediation steps: rotate secrets, scrub history, enable scanners.
- `docs/security/log_redaction_policy.md` outlines masking rules before sharing logs.
- Always confirm `git status` is clean of `*.db`, `*.jsonl`, or log files before pushing.

---

## Reference Documents

- `.github/copilot-instructions.md` — condensed field guide for AI assistants and new contributors.
- `API_DOCUMENTATION.md` — contract overview, envelopes, and request/response samples.
- `A1BETTING8_13_IMPLEMENTATION_ROADMAP.md` — roadmap snapshot for recent releases.
- `BACKEND_FILE_USAGE_ANALYSIS.md` — inventory of backend modules and their responsibilities.
- `ADMIN_MODE_FEATURES.md`, `ANALYTICS_IMPLEMENTATION_COMPLETE.md` — feature narratives and acceptance notes.
- `frontend/FEATURE_DOCUMENTATION.md`, `frontend/PERFORMANCE_GUIDE.md` — component standards and performance tuning tips.

Skim these before modifying core flows or planning large refactors to stay aligned with existing conventions.

---

## Contributing

1. Fork and clone the repository.
2. Create a feature branch: `git checkout -b feature/my-change`.
3. Follow backend patterns (async FastAPI routes, `ok()/fail()`, `register()` exports) and frontend standards (functional components, hooks, strict typing).
4. Add tests that cover new behavior; reference `backend/tests/` and `frontend/src/__tests__/` for structure.
5. Update documentation if you change API contracts, environment variables, or dev workflows.
6. Run lint + tests locally before opening a PR.

Code style reminders:

- Python: adhere to PEP 8, prefer `ruff` + `black` for formatting, keep imports guard-wrapped for optional heavy dependencies.
- TypeScript: `npm run lint` must report zero warnings; use descriptive prop types and maintain strict null checks.

---

## License

MIT — see `LICENSE` for details. Commercial usage, forks, and derivative products are allowed; please retain attribution and follow the security guidelines above.

---

Need a deeper dive? Open an issue or check the docs listed above — the maintainers keep them current with every release.

#### 🌐 **New API Endpoints**

- `GET /api/odds/providers/status` — shim returns the canonical ResponseBuilder envelope with `limit` echo and helpful guidance while the provider integration migrates.
- `GET /api/odds/providers/status/{provider_id}` — standardized 404 envelope with machine-readable error code (`E4040_NOT_FOUND`) and provider metadata.
- `GET /api/versioned/health` — lightweight health probe for legacy clients now emitting the shared success payload.
- `GET /api/versioned/_ping` — minimal pong endpoint validating ResponseBuilder wiring for versioned API shims.
