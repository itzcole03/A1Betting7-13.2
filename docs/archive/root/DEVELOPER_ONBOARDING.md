# Developer Onboarding — A1Betting (short)

This file contains the minimal commands and environment flags to run frontend and backend tests locally in "lean" mode so they don't require external infra (Redis, SportRadar, etc.). Use these when iterating locally.

## Prerequisites

- Node.js >= 20
- Python 3.12
- Git Bash (for scripts) or a POSIX-like shell
- Optional: Docker (for running Redis locally)

## Run frontend unit tests (fast, deterministic)

From the repository root:

```bash
# install frontend deps (one-time)
cd frontend
npm ci

# run Jest in CI-lean mode (no heavy backend startup hooks)
# (also available as script: ./scripts/run_frontend_tests.sh)
cd ..
./scripts/run_frontend_tests.sh
```

## Run Playwright E2E locally (lean mode)

This may download browser binaries if not present. Use the lean script which sets env flags to avoid hard proxy checks.

```bash
# one-time: install playwright browsers if needed (optional)
cd frontend
npx playwright install
cd ..

# run Playwright E2E with lean flags
./scripts/run_playwright_lean.sh
```

### Fast local runs using mocks

If you don't want to start the backend for local interactive runs, the Playwright
global-setup can start a lightweight mock API server. This is handy for
iterating on UI tests quickly.

```bash
# run Playwright tests with the mock API server (no backend required)
E2E_USE_MOCKS=1 ./scripts/run_playwright_lean.sh
```

## Notes on env flags

- `APP_DEV_LEAN_MODE=true` — lightweight startup, disables heavy middleware where configured.
- `DISABLE_STARTUP_HOOKS=true` — prevents initialization of optional heavy services (ML, telemetry, etc.) during tests.
- `SKIP_PROXY_CHECK=true` — instructs Playwright global-setup to proceed even if frontend proxy /api/health check fails (useful when running with mocked backends or memory cache).

## Running backend unit tests

From repo root, prefer the wrapper which sets proper envs (if available):

```bash
# run pytest (repo root)
python -m pytest -q
```

If you see import-time failures for optional heavy libs (torch, etc.), run tests with the DEV_LEAN flags:

```bash
export APP_DEV_LEAN_MODE=true
export DISABLE_STARTUP_HOOKS=true
python -m pytest -q
```

## Troubleshooting

- If Playwright global-setup fails with `Frontend proxy to backend failed`, re-run with `SKIP_PROXY_CHECK=true` or ensure backend is running on `localhost:8000`.
- If Redis connection refused: either start Redis (docker-compose or local) or set `DISABLE_STARTUP_HOOKS=true` so the backend uses memory fallback for tests.
- If Windows logging shows encoding errors, the repo includes a mitigation in `backend/utils/enhanced_logging.py` to wrap stdout for UTF-8; ensure your terminal supports UTF-8.

## CI recommendations (short)

- CI jobs should run with `APP_DEV_LEAN_MODE=true` for unit tests, but run Playwright E2E against a reproducible environment where backend and Redis are started in containers.
- Persist Playwright reports and Jest JUnit artifacts for test failures.

---

If you want, I can add a GitHub Actions workflow template next to this file that implements these recommendations. Tell me if you want CI YAML generated.
