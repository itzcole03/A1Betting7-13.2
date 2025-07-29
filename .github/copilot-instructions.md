# Copilot Instructions for A1Betting7-13.2

## Project Overview

- **A1Betting7-13.2** is a comprehensive, full-stack AI-powered sports analytics and betting platform.
- **Backend**: FastAPI (Python) with modular async services, ML ensembles, ETL pipelines, and LLM integrations (PropOllama/GPT).
- **Frontend**: React + Vite (TypeScript) with Zustand for state management, Tailwind for styling, and Electron wrapper for desktop.
- **Auxiliary tools**: AutoHotkey scripts (in `ahk/`), Docker (backend & frontend), and CI/CD hooks.

## Current State & Plan (2025-07-28)

- **Sport-by-Sport Focus:**
  - We are now prioritizing a sport-by-sport approach for real data integration, feature engineering, and model validation.
  - Each sport (NBA, NFL, MLB, etc.) will have its own ETL, feature, and modeling pipeline, validated end-to-end before expanding to others.
  - **MLB integration now uses persistent caching (Redis or DB, TTL ≥ 10 min) and dynamic, quota-aware rate limiting for all API calls to SportRadar and TheOdds.**
  - See `mlb_provider_client.py` for implementation details and update as needed for persistent caching, dynamic throttling, and robust error handling.
  - This ensures high accuracy, reliability, and user trust for each sport before scaling horizontally.
- **Prompt Templates:**
  - See `/prompts/` for a dedicated prompt file for each sport, outlining the data flow, modeling focus, and next steps.
- **Recent Refactors:**
  - `BetAnalysisResponse` is now defined in `models/api_models.py` for unified import and maintainability.
  - `.env` and sensitive files are confirmed in `.gitignore`.
  - Backend and frontend are structured for modular, incremental expansion by sport.

## Implementation Roadmap

1. **Pick a sport (e.g., NBA) and integrate real data feeds.**
2. **Build and validate the ETL and feature engineering pipeline for that sport.**
3. **Train and evaluate sport-specific models.**
4. **Expose predictions via API and frontend.**
5. **Document lessons learned, then expand to the next sport.**

## Key Architectural Patterns

### Backend (Python, FastAPI)

- **Entrypoints**:
  - `backend/main.py` or `run_backend.py` for production.
  - `backend/minimal_test_app.py` and `backend/simple_backend.py` for lightweight testing.
- **Routing & Services**:
  - Routes in `backend/routes/` (e.g., `propollama_intelligence_service`, `enhanced_api_routes.py`, `unified_api.py`).
  - Business logic & feature engineering in `backend/services/` (e.g., `comprehensive_feature_engine.py`, `advanced_ml_ensemble_service.py`).
  - Core prop analysis in `backend/routes/propollama.py` via `_analyze_bet_unified_impl` and `pre_llm_business_logic`.
- **Data pipelines & integrations**:
  - ETL orchestrator: `data_pipeline.py`, `etl_providerx_sample.py`, and `deploy_etl_production.sh`.
  - Data fetchers: `data_fetchers_working.py`, enhanced variants, and real-time analytics in `real_time_analysis_engine.py`.
  - Database schema managed via Alembic (`alembic/versions/`), migrations in `migrations/`.
- **ML & LLM**:
  - ML ensemble & model training in `enhanced_model_service.py` and `real_ml_training_service.py`.
  - SHAP explainability in `shap_explainer.py` and `real_shap_service.py`.
  - LLM routing via `llm_routes.py` and toggling in `llm_toggle_api.py`.

### Frontend (TypeScript, React, Vite)

- **Components**:
  - Unified UI logic in `frontend/src/components/PropOllamaUnified.tsx`, `PredictionDisplay.tsx`, and new `PropGPT.tsx`.
  - Feature modules (LineupBuilder, BettingDashboard, BankrollManager, SHAPVisualization, etc.) under `components/`.
- **Adapters & API layer**:
  - Adapters for external data: `ESPNAdapter.ts`, `PrizePicksAdapter.ts`, `SocialSentimentAdapter.ts`, `SportsRadarAdapter.ts`, `TheOddsAdapter.ts`.
  - Unified service in `frontend/src/analytics/UnifiedFeatureService.ts` and `adapters/index.ts`.
- **State & styling**:
  - Zustand stores in `frontend/src/store/`.
  - Tailwind config in `tailwind.config.js`, global styles in `globals.css`.
- **Testing & QA**:
  - Unit & E2E tests in `__tests__/`, Vitest config in `vitest.config.ts`.
  - Accessibility audit report in `accessibility_report_2025-07-19T01-50-12-696Z.json`.

## Developer Workflows

### Backend

1. **Install & Environment**:
   - Copy `.env.example` to `.env` and populate API keys (SportRadar, TheOdds, PrizePicks).
   - **API keys must be loaded from environment variables or config files via `config_manager.py`. Never hardcode secrets in source.**
   - **WARNING:** For production, all API keys must be managed securely and rotated regularly. Do not commit secrets to source control.
   - `pip install -r requirements.txt` (or `requirements-production.txt`).
2. **Run & Test**:
   - Start dev server: `uvicorn backend.main:app --reload` or `bash start-python-backend.sh`.
   - Minimal test: `python backend/minimal_test_app.py`.
   - Run full tests: `pytest -q --disable-warnings`.
3. **Database & Migrations**:
   - Generate migration: `alembic revision --autogenerate -m "<msg>"`.
   - Apply: `alembic upgrade head` (or via `deploy_production.sh`).
4. **Lint & Security**:
   - Lint: `flake8 .` or `pylint backend/`.
   - Security scan: `bash run_security_scan.sh` and `sonar-project.properties` for SonarQube.

### Frontend

1. **Install**: `cd frontend && npm ci`.
2. **Dev Server**: `npm run dev` or `bash start-dev.ps1`.
3. **Build**: `npm run build`.
4. **Test & Lint**: `npm run test`, `npm run lint`.

### Auxiliary Tools

- **Docker Compose**: `docker-compose up --build` orchestrates backend, frontend, and ETL.
- **AutoHotkey**: Scripts in `ahk/` (`AFKToggle.ahk`, `generate_prompt.py`) automate Copilot prompts.
- **Monitoring**: `monitor_backend.py` and `realtime_accuracy_monitor.py` for health and performance.

## Project-Specific Conventions

- **Unified Response**: All endpoints return `BetAnalysisResponse` with `enriched_props`, `confidence_score`, and diagnostic metadata.
- **Async/Await**: Mandatory across services; errors must bubble with logger context (`logging.getLogger("propollama")`).
- **Secret Management**: No keys in source; `.env` + `config_manager.py` handles secure retrieval. API keys must be rotated regularly and monitored for unauthorized usage.
- **API Integration Best Practices**:
  - Use persistent caching (Redis or DB, TTL ≥ 10 min) for all event, team, odds, and event mapping data.
  - Implement dynamic, quota-aware rate limiting and throttle requests based on API response headers (e.g., `x-requests-remaining`).
  - Integrate SportRadar event mapping endpoints for robust cross-provider event ID matching.
  - Use TheOdds `/participants` endpoint to maintain an up-to-date canonical team list.
  - Always match on normalized team names and event start times (±5 min window) for cross-provider mapping.
  - Add exponential backoff and retry logic for all 429/5xx errors, with logging and alerting on persistent failures.
  - Log all API usage, including quota headers and error rates, and monitor for quota exhaustion and mapping failures.
  - Use `/events` and `/participants` endpoints to prefetch metadata and minimize quota usage.
  - Ensure all API keys are loaded from environment variables and never hardcoded.
  - Update documentation and alert on persistent mapping or quota issues.
- **Documentation**:
  - Update `API_DOCUMENTATION.md`, `FEATURE_INTEGRATION_ROADMAP.md`, and `BACKEND_FILE_USAGE_ANALYSIS.md` when adding features.
  - Use OpenAPI docs at `/docs` for endpoint changes.

## Integration Points

- **External APIs**:
  - SportRadar, TheOdds, PrizePicks, ESPN, SocialSentiment (API keys/config in `config/business_rules.yaml`).
- **Data Storage**:
  - PostgreSQL in production, SQLite default for dev (configured in `database.py`).
  - Redis for persistent caching & dynamic rate-limiting (`redis_rate_limiter.py`).
- **ETL & Analytics**:
  - ETL pipelines orchestrated by `deploy_etl_production.sh` and `ETL_MONITORING_SETUP.md`.
- **CI/CD**:
  - GitHub Actions workflows in `.github/` (not shown) integrate tests, lint, and deploy steps.

## Examples & Tips

- **Adding a new feature service**:

  1. Create `backend/services/<feature>_service.py` with async functions.
  2. Import and call in `pre_llm_business_logic` of `propollama.py` or relevant route.
  3. Add configuration in `config/prompt_templates.yaml` and `business_rules.yaml`.

- **Frontend Data Exposure**:
  - Extend the `UnifiedFeatureService` and corresponding adapter to return new fields.
  - Update `BetAnalysisResponse` model in `models/api_models.py` and component props in `PropOllamaUnified.tsx`.

---

For detailed architecture diagrams and additional context, refer to `CLASS_DIAGRAM.md`, `ARCHITECTURE.md`, and `ROUTE_OVERVIEW.md`.
