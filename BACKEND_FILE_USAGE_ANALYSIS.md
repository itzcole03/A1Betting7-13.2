# BACKEND_FILE_USAGE_ANALYSIS.md

## API Versioning, Rule Reload, and Observability (2025-07-27)

- All FastAPI routers are now versioned under `/api/v1/` for auditability and safe upgrades.
- All backend responses include a `version` field; analysis/admin responses also include `ruleset_version` and `rules_last_updated`.
- The admin rule reload endpoint (`/api/v1/admin/reload-business-rules`) is observable, logs all reload attempts, and returns version/timestamp for audit.
- See `API_DOCUMENTATION.md` for endpoint contracts and response schemas.
- See `devops_api_monitoring_template.md` for monitoring/alerting setup.
- See `frontend_violation_ux_confirmation.md` for frontend integration and audit requirements.

## Key Files

- `backend/services/real_time_analysis_engine.py`: Core business logic, rule versioning, and metadata injection
- `backend/routes/admin.py`: Admin reload endpoint and observability
- `backend/routes/propollama.py`, `backend/routes/real_time_analysis.py`: API versioning and response structure
- `backend/config/business_rules.yaml`: Business rules, version, and last updated

## Audit Notes

- All changes are logged and observable for audit and onboarding.
- This file should be updated with any future changes to versioning, rule reload, or monitoring patterns.
- The backend now supports dynamic and time-windowed business rules, defined in `backend/config/business_rules.yaml` under the `rules:` section.
- Rules can specify a time window (start/end) and are only active during that period.
- The engine enforces these rules at runtime and reports violations in API responses.
- See `API_DOCUMENTATION.md` for schema and enforcement details.
