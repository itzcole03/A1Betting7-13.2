# BACKEND_FILE_USAGE_ANALYSIS.md

## API Versioning, Rule Reload, and Observability (2025-07-27)

- All FastAPI routers are now versioned under `/api/v1/` for auditability and safe upgrades.
- All backend responses include a `version` field; analysis/admin responses also include `ruleset_version` and `rules_last_updated`.
- The admin rule reload endpoint (`/api/v1/admin/reload-business-rules`) is observable, logs all reload attempts, and returns version/timestamp for audit.
- See `API_DOCUMENTATION.md` for endpoint contracts and response schemas.
- See `devops_api_monitoring_template.md` for monitoring/alerting setup.
- See `frontend_violation_ux_confirmation.md` for frontend integration and audit requirements.

## Key Files (MLB Integration 2025-07-28)

- `backend/services/mlb_provider_client.py`: MLB ETL client for SportRadar and TheOdds
- `backend/etl_mlb.py`: MLB ETL pipeline runner
- `backend/services/mlb_feature_engineering.py`: MLB-specific feature engineering
- `backend/enhanced_model_service.py`: Unified model service (MLB now supported)
- `backend/routes/propollama.py`: Unified API endpoint for all sports, including MLB
- `frontend/src/components/PropOllamaUnified.tsx`: Frontend MLB prop display

## Lessons Learned

- Modular ETL and feature engineering per sport enables robust, incremental expansion
- Unified API and response model simplifies frontend integration
- Real API keys are required for full data ingestion; pipeline handles missing keys gracefully

## Audit Notes

- All changes are logged and observable for audit and onboarding.
- This file should be updated with any future changes to versioning, rule reload, or monitoring patterns.
- The backend now supports dynamic and time-windowed business rules, defined in `backend/config/business_rules.yaml` under the `rules:` section.
- Rules can specify a time window (start/end) and are only active during that period.
- The engine enforces these rules at runtime and reports violations in API responses.
- See `API_DOCUMENTATION.md` for schema and enforcement details.
