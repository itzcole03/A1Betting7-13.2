# Route Consolidation Status

_Last updated: 2025-11-02_

## Cleanup Summary

- Removed 163 backup or legacy route artifacts (`*.py.bak`, `*.py.orig`, `*.py.broken`, and mlb_extras_broken variants).
- Deleted the archived `_orig_backups_20251019_225641/` tree and stale `streaming_api.py.pass*.orig` files.
- `backend/routes/` now contains only the canonical route implementations plus active shims.
- Archived the legacy `advanced_arbitrage_routes` module; production wiring no longer registers it (compat stub retained for straggler imports).
- Archived the legacy `advanced_kelly_routes` module alongside its secured shim; consolidated bankroll tooling now owns the feature space.
- Archived the legacy `live_betting_routes`, `cheatsheets_routes`, `risk_tools_routes`, `model_registry_routes`, and `ai_recommendations_routes` modules; production wiring now relies on consolidated counterparts only.
- Archived the legacy `advanced_search_routes`, `priority2_realtime_routes`, `priority2_demo_routes`, and `optimized_real_time_routes`; production wiring no longer registers the Priority 2 shims.
- Archived the legacy `enhanced_data_validation_routes`, `realtime_websocket_routes`, and `enhanced_sportsbook_routes`; websocket coverage now flows through the consolidated `ws` package only.
- Archived the legacy `optimized_api_routes`, `optimized_routes`, `modern_async_routes`, `modern_ml_routes`, and `phase2_routes`; consolidated `unified_api` and `modern_ml_phase2_routes` now cover feature parity.
- Archived the legacy `ai_routes`, `data_validation_routes`, `enhanced_api`, `dashboard_customization_routes`, and `data_export_routes`; consolidated and unified endpoints now serve these surfaces.
- Standardized deprecation shims for `bets_routes`, `debug_api`, `draftkings_integration_routes`, `fanduel`, and `metrics` to use the shared `ResponseBuilder` envelope and removed leftover FanDuel mock handlers.
- Extended the shared `ResponseBuilder` deprecation pattern to `advanced_*`, `priority2_*`, `optimized_*`, `modern_*`, `ai_recommendations_routes`, `cheatsheets_routes`, `risk_tools_routes`, `live_betting_routes`, `ai_routes`, `data_validation_routes`, `enhanced_api`, `data_export_routes`, and `dashboard_customization_routes` for consistent 410 responses.
- Archived the legacy `model_registry` module; the compatibility shim now emits the standardized 410 ResponseBuilder envelope.
- Deduplicated and standardized `production_health_routes_standardized` so the shim now returns the canonical ResponseBuilder-backed health payload.
- Updated `provider_status_routes` shim to emit ResponseBuilder-backed success and not-found envelopes for consistency.
- Normalized the `llm_explanations` shim to the canonical ResponseBuilder success envelope.
- Converted `provider_confidence_routes` to the standard ResponseBuilder success envelope and aligned the test suite expectations.
- Wrapped `schema_validation_routes` endpoints with the canonical ResponseBuilder success envelope and refreshed the route tests to assert the new contract.
- Updated the legacy `security_routes` shim to return ResponseBuilder-backed success payloads.
- Normalized the `llm_explanations` shim to the canonical ResponseBuilder success envelope.
- Migrated `smart_fallback_routes` to ResponseBuilder-backed envelopes across health, analytics, and management endpoints with updated route tests.
- Converted `ws_client` and `ws_client_unified` shims to ResponseBuilder success helpers and added targeted route tests.
- Standardized `cache_management_routes` shim to ResponseBuilder envelopes and added a health-check test.
- Converted `versioned_api_routes` shim to ResponseBuilder envelopes with accompanying route tests.
- Refreshed `provider_status_routes` shim to use ResponseBuilder success/error helpers and introduced focused tests.

## Current Inventory

- Active (auto-registered via `backend/core/app.py`): **69** modules.
- Present but not registered: **80** modules (legacy or optional candidates for archival).

### Active Modules

```
admin_control
admin_feature_flags_routes
alert_engine_routes
alert_routes
analytics_routes
auth
bankroll_routes
betting
clv_trends_routes
compat_shims
consolidated_admin
consolidated_ml
consolidated_prizepicks
csp_report
dependencies
dev_mode_compat
diagnostics
enhanced_ev_routes
enhanced_ml_routes
enhanced_websocket_routes
enterprise_model_registry_routes
ev_feed_debug_routes
ev_feed_routes
ev_routes
hardened_arbitrage_routes
health
health_compat
health_extended
ingestion_admin_routes
ingestion_routes
lazy_sport_routes
line_movement_routes
meta_cache
meta_legacy
metrics_routes
model_registry_simple
models_inference
modern_ml_phase2_routes
multiple_sportsbook_routes
observability_events
odds_history_routes
odds_history_routes_fallback
odds_refresh_stub
odds_routes
opportunities_routes
parlay_routes
player_performance_routes
prizepicks_compat
propfinder_routes
provider_resilience_routes
query_optimizer_routes
risk_personalization
security_head_endpoints
smart_signals_routes
sports_activation_extras
sports_routes
streaming.streaming_api
system_capabilities
testing_compat_shims_minimal
tools_routes
trace_test_routes
trends_routes
unified_api
unified_batch_compat
unified_sports_routes
validation_routes
version_routes
websocket_logging_routes
ws_client_enhanced
```

### Inactive Modules (require decision)

```
_feedback_stub
admin
bets_routes
cache_management_routes
clv_bet_tracking_routes
clv_history_segmentation_routes
comprehensive_sportradar_routes
correlation_and_tickets
debug_api
draftkings_integration_routes
enhanced_search_routes
fanduel
feedback
llm_explanations
metrics
mlb_extras
mlb_extras_fixed
model_performance_monitoring_routes
model_registry
nba_routes
observability_routes
optimization_and_simulation
performance
phase3_routes
player_dashboard_routes
prizepicks
prizepicks_router
prizepicks_routes
prizepicks_simple
production_health_routes
production_health_routes_standardized
propollama
propollama_router
provider_confidence_routes
provider_status_routes
pytest_plugins
real_time_analysis
risk_personalization_backup
schema_validation_routes
security_routes
security_test
shap
smart_fallback_routes
streaming.__init__
test_helpers
testing_compat_shims
testing_shim_proxy
trending_suggestions
user
user_clv_analytics_routes
valuation_and_edges
versioned_api_routes
ws_client
ws_client_unified
```

## Next Actions

1. Classify inactive modules into _keep_, _migrate_, or _archive_ buckets and capture owners.
2. Fold surviving functionality into the consolidated routers (e.g., `unified_api`, `consolidated_*`).
3. Remove remaining orphan modules once their functionality is either adopted or confirmed obsolete.

## Preliminary Classification (draft)

### A. Superseded by consolidated routers — archive after verification

`admin`, `bets_routes`, `clv_bet_tracking_routes`, `clv_history_segmentation_routes`, `comprehensive_sportradar_routes`, `correlation_and_tickets`, `debug_api`, `draftkings_integration_routes`, `enhanced_search_routes`, `fanduel`, `feedback`, `metrics`, `model_performance_monitoring_routes`, `nba_routes`, `observability_routes`, `optimization_and_simulation`, `performance`, `phase3_routes`, `player_dashboard_routes`, `propollama`, `propollama_router`, `real_time_analysis`, `risk_personalization_backup`, `security_test`, `shap`, `trending_suggestions`, `user`, `user_clv_analytics_routes`, `valuation_and_edges`.

### B. Keep for scaffolding or package hygiene (no route inclusion)

`_feedback_stub`, `pytest_plugins`, `streaming.__init__`, `test_helpers`, `testing_compat_shims`, `testing_shim_proxy`.

### C. Needs migration or guardrail work before removal

`cache_management_routes`, `llm_explanations`, `mlb_extras`, `mlb_extras_fixed`, `model_registry`, `model_registry_routes`, `model_registry_simple`, `prizepicks_*` (confirm all traffic now handled by `consolidated_prizepicks`), `production_health_routes*` (align with `health` endpoints), `provider_confidence_routes`, `provider_status_routes`, `schema_validation_routes`, `security_routes`, `smart_fallback_routes`, `versioned_api_routes`, `ws_client*` (review websocket coverage).

> Assign module owners and draft migration tickets for every entry in bucket C before deletion.
