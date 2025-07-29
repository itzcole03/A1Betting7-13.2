# Copilot/AI Agent Instructions for A1Betting7-13.2

## Project Overview

- **A1Betting7-13.2** is a full-stack, AI-powered sports analytics and betting platform.
- **Mission:** Deliver real-time, explainable, and compliant sports analytics and betting tools for both technical and non-technical users.

## Architecture & Data Flow

- **Backend (Python, FastAPI):**
  - Entrypoints: `backend/main.py` (prod), `backend/minimal_test_app.py` (test/dev)
  - API routes: `backend/routes/`
  - Business logic: `backend/services/`
  - ETL: `etl_mlb.py`, `mlb_feature_engineering.py`, orchestrated by `deploy_etl_production.sh`
  - Persistent caching: Redis (see `mlb_provider_client.py`)
  - ML/LLM: Model training in `enhanced_model_service.py`, explainability in `shap_explainer.py`
  - DB: PostgreSQL (prod), SQLite (dev), Alembic for migrations
- **Frontend (React, Vite, TypeScript):**
  - Main UI: `frontend/src/components/PropOllamaUnified.tsx`
  - State: Zustand (`frontend/src/store/`)
  - Type safety: TypeScript, zod validation
  - Testing: Jest, Vitest, Storybook
- **Auxiliary:** Docker, CI/CD, advanced monitoring, AutoHotkey scripts (`ahk/`)

## Developer Workflows

- **Backend:**
  - Setup: Copy `.env.example` → `.env`, add API keys (never commit keys)
  - Install: `pip install -r requirements.txt`
  - Run: `uvicorn backend.main:app --reload` or `python backend/minimal_test_app.py`
  - Test: `pytest -q --disable-warnings`
  - Migrate: `alembic revision --autogenerate -m "<msg>"`, `alembic upgrade head`
  - Lint/Security: `flake8 .`, `pylint backend/`, `bash run_security_scan.sh`
- **Frontend:**
  - Install: `cd frontend && npm ci`
  - Dev: `npm run dev` (default port 8174)
  - Build: `npm run build`
  - Test/Lint: `npm run test`, `npm run lint`
- **Full Stack:** `docker-compose up --build`

## Project-Specific Patterns & Conventions

- **Async/Await:** All backend services must be async; errors must bubble with logger context (`logging.getLogger("propollama")`).
- **Unified Response:** All endpoints return `BetAnalysisResponse` (see `models/api_models.py`).
- **Secret Management:** No keys in source; use `.env` + `config_manager.py`.
- **API Integration:** Persistent Redis caching (TTL ≥ 10 min), quota-aware rate limiting, exponential backoff/retry for 429/5xx, all API usage/errors logged.
- **MLB Odds Fallback:** If SportRadar API fails, fallback to TheOdds API and/or Redis cache. The static `alert_event` method in `MLBProviderClient` is required for fallback logic—if missing, endpoints may return empty data.
- **Frontend Data:** Extend `UnifiedFeatureService` and adapters for new fields; update `BetAnalysisResponse` and component props for new data.
- **Testing:** All new features require unit/integration tests; E2E for admin UI and critical workflows; integration tests for ETL/ML pipelines.
- **Naming/Style:** PEP8 (Python), Airbnb/Prettier (TypeScript/React); use clear, descriptive names.

## Integration Points

- **External APIs:** SportRadar, TheOdds, PrizePicks, ESPN, SocialSentiment
- **Data Storage:** PostgreSQL (prod), SQLite (dev), Redis (cache/rate-limit)
- **ETL:** Orchestrated by `deploy_etl_production.sh`

## How to Add or Change Features

- **Backend Service:** Create `backend/services/<feature>_service.py` (async), import in route, update config, add/extend tests, update docs.
- **ETL/ML Pipeline:** Update `etl_mlb.py`, `mlb_feature_engineering.py`, ensure data flows from source to DB and ML, add integration/validation tests.
- **Frontend Exposure:** Extend `UnifiedFeatureService` and adapters, update `BetAnalysisResponse` and component props, add/extend tests.

## Reference & Troubleshooting

- **Diagrams:** `CLASS_DIAGRAM.md`, `ARCHITECTURE.md`, `ROUTE_OVERVIEW.md`
- **Roadmap:** `FEATURE_INTEGRATION_ROADMAP.md`, `PROJECT_STATUS.md`, `CHANGELOG.md`
- **Security:** `sonar-project.properties`, `run_security_scan.sh`
- **ETL/ML Docs:** `ETL_IMPLEMENTATION_PLAN.md`, `ETL_PIPELINE_ARCHITECTURE.md`, `ML_ENSEMBLE_README.md`
- **Troubleshooting:** `README.md`, `advanced_best_practices.log`, `monitor_backend.py`
- **MLB Fallback Issues:** If MLB props/AI insights are empty, check for `alert_event` errors in backend logs and ensure Redis is running.

---

_For architecture diagrams and more, see `CLASS_DIAGRAM.md`, `ARCHITECTURE.md`, and `ROUTE_OVERVIEW.md`._
