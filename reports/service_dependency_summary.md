# Backend Service Dependency Summary (2025-09-25)

Generated from `scripts/generate_service_dependency_report.py`.

- **Total modules scanned:** 324
- **Prefix distribution:**
  - `enhanced_*`: 29
  - `real_*`: 18
  - `advanced_*`: 13
  - `unified_*`: 13
  - `optimized_*`: 11
  - `modern_*`: 4
  - `simple_*`: 2
- **Modules with zero internal imports:** 199 (majority `enhanced_*` and miscellaneous helpers)
- **Heavy external dependencies:**
  - `numpy` referenced by 75 modules
  - `pandas` referenced by 57 modules
  - `scikit-learn`/`sklearn` and `optuna` appear across the `advanced_*` set

## Triage Candidates (no internal dependencies)

Examples of modules that only rely on external packages (prime candidates to retire once router usage is checked):

- `backend.services.advanced_arbitrage_engine`
- `backend.services.advanced_bayesian_ensemble`
- `backend.services.advanced_feature_engine`
- `backend.services.advanced_security_service`
- `backend.services.alert_service`
- `backend.services.analytics_persistence_service`
- `backend.services.async_performance_optimizer`
- `backend.services.auth_service`

## Next Steps

1. Cross-reference these modules against router/service imports to confirm whether they are unused.
2. Move redundant implementations into `backend/services/legacy/` (or delete) after confirming no live routes depend on them.
3. Update `SERVICES_README.md` (to be created) with the canonical service set and deprecation policy.
