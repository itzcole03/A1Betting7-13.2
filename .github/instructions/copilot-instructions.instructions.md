# A1Betting7-13.2: Supreme Copilot & Developer Instructions

Welcome to the definitive, self-sufficient guide for developing, maintaining, and extending A1Betting7-13.2. This document is all you (or Copilot) will ever need—no further instruction required.

---

## 1. Project Context & Mission

- **A1Betting7-13.2** is a full-stack, AI-powered sports analytics and betting platform.
- **Backend:** Python (FastAPI), async modular services, ML ensembles, ETL, LLM (PropOllama/GPT), robust audit/compliance, real data pipelines.
- **Frontend:** React + Vite (TypeScript), Zustand state, Tailwind, Electron desktop, modern admin UI.
- **Auxiliary:** AutoHotkey scripts, Docker, CI/CD, advanced monitoring.

**Mission:** Deliver real-time, explainable, and compliant sports analytics and betting tools for both technical and non-technical users.

---

## 2. Architecture Overview

### Backend (Python, FastAPI)

- **Entrypoints:**
  - `backend/main.py`, `run_backend.py` (production)
  - `backend/minimal_test_app.py` (dev/test)
- **Core Modules:**
  - `admin_api.py`, `routes/admin.py`: Admin endpoints, audit, health
  - `feature_engineering.py`, `feature_cache.py`, `feature_flags.py`, etc.: Feature pipeline
  - `prediction_engine.py`, `enhanced_ml_ensemble_service.py`: ML/ensemble prediction
  - `shap_explainer.py`, `real_shap_service.py`: Explainability
  - `unified_feature_service.py`: Unified feature pipeline
  - `ws.py`: WebSocket endpoints
  - `monitoring_service.py`: Monitoring/alerts
- **Routing:**
  - All routes in `backend/routes/` (REST, admin, analytics, unified API, etc.)
- **Data & ETL:**
  - ETL orchestrators: `data_pipeline.py`, `etl_mlb.py`, `etl_providerx_sample.py`
  - Data fetchers: `data_fetchers_working.py`, `real_time_analysis_engine.py`
  - MLB feature engineering: `services/mlb_feature_engineering.py`, `mlb_team_alias_table.csv`
  - Integration and validation docs: `ETL_IMPLEMENTATION_PLAN.md`, `ETL_PIPELINE_ARCHITECTURE.md`, `ETL_INTEGRATION_TEST_PLAN.md`
- **Database:**
  - Alembic for migrations (`alembic/`, `migrations/`)
  - PostgreSQL (prod), SQLite (dev), Redis (cache/rate-limit)
- **Testing:**
  - All tests in `backend/test/`, `testing/`, and `tests/` (pytest)
- **Security:**
  - JWT/session auth, admin-only endpoints, secret management via `.env` + `config_manager.py`

### Frontend (React, Vite, TypeScript)

- **Components:**
  - Unified UI: `frontend/src/components/PropOllamaUnified.tsx`, `PredictionDisplay.tsx`, `PropGPT.tsx`
  - Feature modules: LineupBuilder, BettingDashboard, BankrollManager, SHAPVisualization, etc.
- **State & Styling:**
  - Zustand stores, Tailwind config, global styles
- **API Layer:**
  - Adapters: ESPN, PrizePicks, SocialSentiment, SportsRadar, TheOdds
  - Unified service: `frontend/src/analytics/UnifiedFeatureService.ts`
- **Testing:**
  - Unit/E2E: `__tests__/`, Vitest config
- **Admin UI:**
  - Modern, secure admin SPA for rule management, audit, and monitoring

---

## 3. Developer Workflows

### Backend

1. **Setup:**
   - Copy `.env.example` → `.env`, add API keys (never commit keys)
   - `pip install -r requirements.txt` (or `requirements-production.txt`)
2. **Run:**
   - Dev: `uvicorn backend.main:app --reload` or `bash start-python-backend.sh`
   - Test: `python backend/minimal_test_app.py`
3. **Test:**
   - `pytest -q --disable-warnings`
4. **Migrate:**
   - `alembic revision --autogenerate -m "<msg>"`, then `alembic upgrade head`
5. **Lint/Security:**
   - `flake8 .`, `pylint backend/`, `bash run_security_scan.sh`, SonarQube

### Frontend

1. **Setup:** `cd frontend && npm ci`
2. **Run:** `npm run dev` or `bash start-dev.ps1`
3. **Build:** `npm run build`
4. **Test/Lint:** `npm run test`, `npm run lint`

### Auxiliary

- **Docker Compose:** `docker-compose up --build` (full stack)
- **Monitoring:** `monitor_backend.py`, `realtime_accuracy_monitor.py`
- **AutoHotkey:** Scripts in `ahk/` for automation

---

## 4. API, Data, and Integration

- **PrizePicks:** Real data only (`https://api.prizepicks.com/projections`)
- **SportRadar, TheOdds:** API keys in `.env` (required)
- **MLB ETL:**
  - Real MLB data sourced via `etl_mlb.py` and `services/mlb_feature_engineering.py`
  - Data validation, transformation, and storage documented in `ETL_IMPLEMENTATION_PLAN.md` and `ETL_PIPELINE_ARCHITECTURE.md`
  - All ML models and analytics must consume data from the real ETL pipeline
- **Health:** `GET /api/prizepicks/health` (status endpoint)
- **Error Handling:** All APIs handle rate limits/unavailability gracefully
- **No mock endpoints** (as of 2025-07-14)

---

## 5. Conventions, Patterns, and Rules

- **Async/Await:** All backend services must be async; errors must bubble with logger context
- **Unified Response:** All endpoints return `BetAnalysisResponse` with `enriched_props`, `confidence_score`, and diagnostics
- **Secret Management:** No keys in source; use `.env` + `config_manager.py`
- **Documentation:**
  - Update `API_DOCUMENTATION.md`, `FEATURE_INTEGRATION_ROADMAP.md`, `BACKEND_FILE_USAGE_ANALYSIS.md` for any feature
  - Use OpenAPI docs at `/docs` for endpoint changes
  - Update ETL/ML docs (`ETL_IMPLEMENTATION_PLAN.md`, `ML_ENSEMBLE_README.md`, etc.) when changing data pipelines or ML logic
- **Naming/Style:**
  - Follow PEP8 (Python), Airbnb/Prettier (TypeScript/React)
  - Use clear, descriptive names for all files, functions, and variables
- **Testing:**
  - All new features must have unit/integration tests
  - E2E tests for admin UI and critical workflows
  - Integration tests for ETL and ML pipelines
- **CI/CD:**
  - All code must pass lint, tests, and security scans before merge/deploy

---

## 6. How to Add or Change Features

- **Backend Service:**
  1. Create `backend/services/<feature>_service.py` (async)
  2. Import/call in `pre_llm_business_logic` or relevant route
  3. Add config in `config/prompt_templates.yaml` and/or `business_rules.yaml`
  4. Add/extend tests in `backend/test/` or `backend/tests/`
  5. Update docs as above
- **ETL/ML Pipeline:**
  - Update or extend `etl_mlb.py`, `mlb_feature_engineering.py`, and related docs for real data integration
  - Ensure all data flows from real source to DB and is consumed by ML/analytics
  - Add/extend integration and validation tests
- **Frontend Exposure:**
  - Extend `UnifiedFeatureService` and adapters to return new fields
  - Update `BetAnalysisResponse` model and relevant component props
  - Add/extend tests and update docs

---

## 7. Where to Find More

- **Diagrams & Deep Dives:** `CLASS_DIAGRAM.md`, `ARCHITECTURE.md`, `ROUTE_OVERVIEW.md`
- **Roadmap:** `FEATURE_INTEGRATION_ROADMAP.md`, `PROJECT_STATUS.md`, `CHANGELOG.md`
- **Security/Compliance:** `sonar-project.properties`, `run_security_scan.sh`, audit log docs
- **ETL/ML Docs:** `ETL_IMPLEMENTATION_PLAN.md`, `ETL_PIPELINE_ARCHITECTURE.md`, `ML_ENSEMBLE_README.md`
- **Troubleshooting:** `README.md`, `advanced_best_practices.log`, `monitor_backend.py`

---

## 8. If You Do X, Do Y (Quick Reference)

- **Add a backend feature:** See section 6, update docs/tests
- **Expose new data to frontend:** Update adapters, models, docs
- **Change a rule or config:** Edit YAML, reload via admin API/UI, check audit log
- **Add a migration:** Use Alembic, verify models, test upgrade/downgrade
- **Add a test:** Place in correct test dir, follow naming conventions
- **Update docs:** Always update all relevant docs and diagrams
- **Handle secrets:** Never commit keys, always use `.env` and config manager
- **Debug:** Use logger context, check health endpoints, review monitoring scripts

---

## 9. Golden Rules

1. Never commit secrets or keys
2. Never bypass tests, lint, or security scans
3. Always document and test every feature/change
4. Always use async/await in backend
5. Always keep Alembic and models in sync
6. Always update all relevant docs and diagrams
7. Always escalate blockers with context and options
8. Always validate real data flow in ETL/ML pipelines before release

---

**This is the only instructions file you will ever need.**
