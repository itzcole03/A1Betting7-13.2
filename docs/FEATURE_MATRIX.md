# A1Betting Feature Matrix

This matrix summarizes the current backend capabilities, their status, key endpoints, governing feature flags, and notable metrics/observability keys. See `METRICS_IMPLEMENTATION_COMPLETE.md` and `docs/clv_metrics_runbook.md` for deeper operational detail.

## Legend

- Status: Stable (prod-ready), Beta (behind flag), Experimental (subject to change)

## Capabilities

### EV Hardening

- Status: Stable
- Endpoints:
  - `POST /api/ev/calc`
- Feature Flags:
  - `ENABLE_EV_ENRICHMENT`
- Observability/Metrics:
  - Timings: `ev_ms_avg`
  - Operations: see `/api/observability/metrics/operations`

### Odds Provider Status

- Status: Stable
- Endpoints:
  - `GET /api/odds/providers/status`
  - `GET /api/odds/providers/statistics`
  - `GET /api/odds/providers/health`
- Feature Flags:
  - n/a (always-on; governed by provider integration readiness)
- Observability/Metrics:
  - Provider health/uptime via provider statistics integration

### Arbitrage Validation (Hardened)

- Status: Stable
- Endpoints:
  - `POST /api/arbitrage/validate`
  - `GET /api/data/validation/summary`
- Feature Flags:
  - n/a
- Observability/Metrics:
  - Timings: `arbitrage_ms_avg`
  - Validation warnings keys include: `arbitrage_probability_violation`, `arbitrage_missing_sides`

### Line Movement

- Status: Beta
- Endpoints:
  - `POST /api/lines/snapshot`
  - `GET /api/lines/metrics`
  - `GET /api/lines/recent-significant`
  - `GET /api/lines/health`
- Feature Flags:
  - `ENABLE_LINE_MOVEMENT`
- Observability/Metrics:
  - Timings: `line_movement_ms_avg`
  - Operations: `line_movement_snapshot`

### Smart Signals

- Status: Beta
- Endpoints:
  - `GET /api/signals/health`
  - `POST /api/signals/smart`
  - `GET /api/signals/player/{player_id}`
- Feature Flags:
  - `ENABLE_SMART_SIGNALS`
- Observability/Metrics:
  - Prometheus: `smart_signals_generated_total`

### Observability Surfaces

- Status: Stable
- Endpoints:
  - `GET /api/observability/snapshot`
  - `GET /api/observability/timings`
  - `GET /api/observability/metrics/operations`
  - `GET /api/observability/flags`
- Feature Flags:
  - Surfaces reflect admin flags from `/api/admin/feature-flags`
- Observability/Metrics:
  - Timings keys: `ev_ms_avg`, `arbitrage_ms_avg`, `odds_norm_ms_avg`, `line_movement_ms_avg`

### Admin Feature Flags

- Status: Stable
- Endpoints:
  - `GET /api/admin/feature-flags`
  - `GET /api/admin/feature-flags/audit`
- Flags:
  - `ENABLE_EV_ENRICHMENT`, `ENABLE_SMART_SIGNALS`, `ENABLE_LINE_MOVEMENT`

---

Cross-references:

- Metrics: `METRICS_IMPLEMENTATION_COMPLETE.md`
- CLV Runbook: `docs/clv_metrics_runbook.md`
