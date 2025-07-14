# UltimateSportsBettingApp Backend

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
- ****pycache**/**, **.pytest_cache/**: Python cache directories (should be excluded from production).

## Usage

- Run the backend with FastAPI using `main.py`.
- All services are modular and documented with docstrings.
- See each module for detailed usage and API documentation.

## API Integrations

### PrizePicks
- **Endpoint:** `https://api.prizepicks.com/projections`
- **Authentication:** No official API key required or available. This is a public, undocumented endpoint.
- **Note:** The system may be rate-limited or blocked by PrizePicks. All error handling and fallback logic should account for this.

### Sportradar / TheOdds
- **API Keys:** Required and stored in `.env` (never committed to version control).
- **Usage:** [Describe where/how these keys are used in the codebase.]

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
- If PrizePicks API is unavailable or rate-limited, the system will:
  - Surface a clear user-facing message:  
    _"Live data unavailable. Displaying sample data. Please try again later."_
  - Only use mock data in development or as a last-resort fallback, never silently in production.

---

_This README is auto-generated. Update as modules evolve._
