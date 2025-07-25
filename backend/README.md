## Testing & E2E Integration

- Run backend tests with:
  ```bash
  cd backend
  pytest
  ```
- For E2E integration with the frontend:
  - Start the backend as above.
  - Start the frontend (`npm run dev` in `frontend/`).
  - Use Jest/RTL for frontend E2E tests (see `frontend/jest.setup.e2e.js`).
  - For browser-based E2E, use Playwright or Cypress (optional).

# UltimateSportsBettingApp Backend

## Alembic Migration Workflow (v4.0.2+)

Alembic is used for database migrations. Follow these steps for a clean migration workflow:

1. **Autogenerate Migration**
   - Run: `alembic revision --autogenerate -m "Your message"`
2. **Apply Migration**
   - Run: `alembic upgrade head`
3. **Troubleshooting Revision Errors**
   - If you see `Can't locate revision identified by ...`, do the following:
     - Delete all files in `alembic/versions/` and `alembic/__pycache__/`.
     - Drop the `alembic_version` table from your database:
       - For SQLite: `python -c "import sqlite3; conn = sqlite3.connect('your.db'); conn.execute('DROP TABLE IF EXISTS alembic_version;'); conn.commit(); conn.close()"`
     - Run: `alembic stamp head` to synchronize Alembic state.
     - Retry migration generation and upgrade.
4. **Verify Tables**
   - Use a database browser or Python to check that all expected tables exist.

**Note:** Always keep your Alembic environment clean and ensure all models are registered with the same SQLAlchemy Base. See `alembic/env.py` for best-practice imports.

---

This directory contains the backend services for the UltimateSportsBettingApp, providing all core data processing, prediction, feature engineering, monitoring, and API endpoints. Each module is documented below.

## Modules

- **admin_api.py**: Admin endpoints and utilities for backend management.
- **betting_opportunity_service.py**: Service for identifying and managing betting opportunities.
- **feature_cache.py**: In-memory cache for feature data with TTL support.
- **feature_engineering.py**: Feature extraction, transformation, selection, and engineering logic for ML models.
- **feature_flags.py**: Feature flag and experiment management system.
- **feature_logger.py**: Logging utility for feature processing and pipeline events.
- **feature_monitor.py**: Tracks feature processing metrics and performance.
- **feature_registry.py**: Registry for feature configurations and metadata.
- **feature_selector.py**: Feature selection logic for ML pipelines.
- **feature_transformation.py**: Feature transformation and normalization utilities.
- **feature_validator.py**: Validates feature data for completeness and correctness.
- **filtered_prediction_api.py**: FastAPI router for filtered prediction endpoints.
- **main.py**: Main FastAPI application entrypoint, service initialization, and API registration.
- **monitoring_service.py**: Service for monitoring backend performance and generating alerts.
- **prediction_engine.py**: Unified prediction engine with ensemble, SHAP explainability, and API endpoints.
- **shap_explainer.py**: SHAP explainability integration for model predictions.
- **unified_feature_service.py**: Unified pipeline for feature validation, transformation, selection, caching, and monitoring.
- **ws.py**: WebSocket endpoints for real-time prediction updates.

## Subdirectories

- **tests/**: Unit and integration tests for backend modules.
- **venv/**, **venv_integration/**, **venv_new/**: Python virtual environments (should be excluded from production).
- \***\*pycache**/**, **.pytest_cache/\*\*: Python cache directories (should be excluded from production).

## Usage

- **Main Backend Entry Point:**
  - Run the backend with FastAPI using `minimal_test_app.py`.
  - This unified backend includes ML predictions, user personalization, content recommendation, JWT authentication, and robust health/status endpoints.
  - All services are modular and documented with docstrings.
  - See each module for detailed usage and API documentation.

### Running the Backend

```bash
python backend/minimal_test_app.py
```

### Features

- ML Predictions
- User Personalization
- Content Recommendation
- JWT Authentication
- SQLite User Management
- Health/Status Endpoints
- Advanced Logging, CORS, GZip Middleware
- Robust Error Handling

Refer to `minimal_test_app.py` for endpoint details and usage examples.

## API Integrations & Data Sources

### PrizePicks (Real Data Only)

- **Endpoint:** `https://api.prizepicks.com/projections`
- **Authentication:** No official API key required or available. This is a public, undocumented endpoint.
- **Note:** All mock endpoints have been removed. Only real PrizePicks data is served via `backend/routes/prizepicks.py`.
- **Error Handling:** The system may be rate-limited or blocked by PrizePicks. All error handling and fallback logic should account for this.

### SportRadar & TheOdds (Live Sportsbook Data)

- **API Keys:** Required and must be stored in `.env` in the backend directory (never committed to version control).
- **Required keys:**
  - `SPORTRADAR_API_KEY=your_sportradar_key`
  - `ODDS_API_KEY=your_odds_api_key`
- **Integration:**
  - `/api/v1/sr/games` and `/api/v1/odds/{event_id}` endpoints use these keys for live data.
  - See `backend/main.py` for implementation details.
- **Note:** If keys are missing, endpoints will return a 503 error.

### .env Requirements

- You **must** create a `.env` file in the backend directory with the required API keys for production use.
- Example:
  ```
  SPORTRADAR_API_KEY=your_sportradar_key
  ODDS_API_KEY=your_odds_api_key
  ```

## Health Monitoring API

The backend provides a health monitoring endpoint for the PrizePicks scraper:

- **Endpoint:** `GET /api/prizepicks/health`
- **Response:** JSON object containing:
  - `status`: Current health status (green/yellow/red)
  - `last_successful_scrape`: Timestamp of last successful scrape
  - `error_streak`: Number of consecutive failures
  - `stale_data`: Boolean indicating if data is stale
  - `healing_attempts`: Number of autonomous healing attempts
  - `version`: Current scraper version

This endpoint is used by the frontend to display real-time scraper status and trigger autonomous healing when needed.

## Error Handling

- If PrizePicks, SportRadar, or Odds APIs are unavailable or rate-limited, the system will:
  - Surface a clear user-facing message:  
    _"Live data unavailable. Please try again later."_
  - **No mock data is used in production.**
  - Endpoints will return a 503 or 502 error if keys are missing or APIs are down.

---

**Note:** As of 2025-07-14, all mock endpoints have been removed from the backend. Only real data is served. See the main project README for setup and integration instructions.

---

_This README is auto-generated. Update as modules evolve._
