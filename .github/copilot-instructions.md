# Copilot Instructions for A1Betting7-13.2

## Project Overview

- **A1Betting7-13.2** is a full-stack AI-powered sports analytics platform (PropOllama) with a FastAPI backend (Python) and a React/Vite frontend (TypeScript).
- The backend provides advanced prop analysis, game predictions, and real-time data enrichment using modular async services and ML models.
- The frontend consumes unified API endpoints for prop analysis, predictions, and user interaction.

## Key Architectural Patterns

- **Backend (FastAPI, Python):**
  - All business logic is modularized in `backend/services/` and `backend/routes/`.
  - Main entrypoint: `backend/main.py` (production) or `backend/minimal_test_app.py` (testing/dev).
  - Core prop analysis logic is in `backend/routes/propollama.py` (see `_analyze_bet_unified_impl`, `pre_llm_business_logic`).
  - Feature engineering, ML ensemble, and prediction logic are separated into their own modules and called asynchronously.
  - API endpoints are versioned and documented with OpenAPI/Swagger (see `/docs`).
  - All external API keys (e.g., SportRadar, Odds API) must be set in `backend/.env`.
  - Robust error handling and logging are enforced throughout (see logger config in `propollama.py`).
  - Health and readiness endpoints: `/api/propollama/health`, `/api/propollama/readiness`.
- **Frontend (React, Vite, TypeScript):**
  - Main UI logic in `frontend/src/components/PropOllamaUnified.tsx` and `PredictionDisplay.tsx`.
  - State management via Zustand (`frontend/src/store/`).
  - API calls use a unified service layer with error handling and fallback.
  - All prop and prediction data is surfaced via the backend's unified response model.

## Developer Workflows

- **Backend:**
  - Start: `python -m backend.main` (or `python backend/minimal_test_app.py` for dev)
  - Test: `cd backend && pytest`
  - Migrations: Use Alembic (`alembic revision --autogenerate -m "msg"`, `alembic upgrade head`)
  - Linting: `flake8` or `pylint` (if configured)
- **Frontend:**
  - Start: `cd frontend && npm run dev`
  - Build: `npm run build`
  - Test: `npm run test`
  - Lint: `npm run lint`

## Project-Specific Conventions

- All prop analysis and prediction endpoints return a unified response (`BetAnalysisResponse`) with both summary and full enrichment data (`enriched_props`).
- Async/await is used throughout backend for all I/O and ML calls; always propagate errors with logging.
- API keys and secrets are never committed; always use `.env`.
- All new backend modules should include docstrings and type annotations.
- Use the logger (`logging.getLogger("propollama")`) for all debug/info/error output.
- Frontend expects all prop and prediction data to be present in the API response for display and further processing.

## Integration Points

- **External APIs:**
  - PrizePicks (public, no key), SportRadar, TheOdds (API keys required)
  - See `backend/routes/propollama.py` and `backend/services/` for integration logic
- **ML/LLM:**
  - ML ensemble and feature engineering in `backend/services/`
  - LLM integration via Ollama client (see `propollama.py`)

## Examples

- To add a new enrichment step, create a service in `backend/services/`, import and call it in `pre_llm_business_logic`.
- To expose new data to the frontend, add it to the `enriched_props` field in the response model.
- For debugging, use the logger and check logs in `logs/propollama.log`.

---

For more, see `README.md`, `backend/README.md`, and `backend/routes/propollama.py`.
