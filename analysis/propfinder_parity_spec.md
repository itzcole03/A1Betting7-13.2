# PropFinder Parity Specification (Single Source of Truth)

_Last updated: 2025-11-01_

## 1. Purpose

Provide an authoritative snapshot of PropFinder-clone readiness across product, data, performance, and compliance dimensions. This document consolidates earlier matrices, marketing claims, and benchmark artifacts into a maintained spec.

## 2. Platform Overview

- **Frontend**: React 19 + TypeScript, virtualized prop tables, advanced filter presets, responsive design.
- **Backend**: FastAPI (app factory `backend/core/app.py`), unified services, currently transitioning from SportRadar ingestion to free/open data APIs (e.g., TheOddsAPI public tier, league-provided feeds).
- **AI/ML**: Ensemble predictions (transformer, GNN, hybrid), Kelly/EV/edge outputs, local LLM explanations.
- **Performance Targets** (to validate): `<300 ms` frontend load, `<100 ms` API latency, 30-second data refresh, resilient ingestion without subscription-based quotas.

## 3. Feature Status Summary

| Category              | Capability                                | Status                | Evidence                                                                          | Notes                                                                 |
| --------------------- | ----------------------------------------- | --------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Multi-Book Odds       | Best line, arbitrage, EV, Kelly           | ✅ Complete           | `PROPFINDER_FEATURE_MATRIX.md`, `A1BETTING_PROPFINDER_IMPLEMENTATION_COMPLETE.md` | Uses TheOddsAPI + internal calculators                                |
| Prop Filtering UI     | Advanced filters, search, presets         | ✅ Complete           | README claims (PropFinder clone section), frontend implementation                 | Presets not yet user-customizable                                     |
| Data Volume           | 100-130 props per slate                   | ✅ Complete           | README, backend opp dumps (`backend_propfinder_opps_*`)                           | Need recurring audit                                                  |
| AI Explainability     | LLM + SHAP outputs                        | ✅ Exceeds            | `AI_FEATURES_SUMMARY.md`, `QUANTUM_AI_TRANSPARENCY_REPORT.md`                     | Ensure consistency with LLM safeguards                                |
| Line Movement         | Historical storage, CLV, steam, alerts    | 🔴 Missing            | `PROPFINDER_FEATURE_MATRIX.md`                                                    | Highest priority gap                                                  |
| Alerts                | Custom rules, delivery channels           | 🔴 Missing            | Matrix + README marketing                                                         | Backend hooks exist; UI + delivery pending                            |
| Data Source Migration | Replace SportRadar with free/public feeds | 🟡 In progress        | `analysis/performance_quota_validation_plan.md`, repo conversations               | Requires ingestion refactor + validation                              |
| Performance Metrics   | <300 ms load, <100 ms API                 | 🟡 Pending validation | README marketing                                                                  | Bench plan authored (`analysis/performance_quota_validation_plan.md`) |
| Documentation         | Unified parity spec                       | ⚠️ Newly created      | This file                                                                         | Must keep updated with change log                                     |

Legend: ✅ verified via code/tests; 🟡 implementation present but requires validation; 🔴 not implemented.

## 4. Acceptance Criteria

1. **Performance**
   - p95 latency for `/api/propfinder/opportunities` <= 100 ms (baseline) and <= 150 ms under 2× load.
   - Frontend cold load (TTFB + hydration) <= 300 ms on reference hardware.
2. **Data Integrity**
   - Prop feed freshness <= 60 seconds for active slates.
   - Consensus/no-vig price accuracy within 0.1 edge points vs raw books.
3. **Line Movement Parity** (P1 gap)
   - Historical odds captured every 30 seconds per book per prop.
   - CLV available for settled props with delta displayed in UI.
   - Alerts delivered within 90 seconds of threshold breach.
4. **Data Feed Resilience (post-SportRadar)**
   - New providers documented with rate limits and retry/backoff strategy.
   - Automatic fallback engages on elevated error rates with audit trail.
5. **Documentation & Observability**
   - Benchmarks and quota dashboards published under `validation_artifacts/` with timestamps.
   - README and marketing copy reference only validated metrics from this spec.

## 5. Validation Roadmap

- **Performance & Quota Verification**: see `analysis/performance_quota_validation_plan.md` (in progress).
- **Line Movement Program**: design doc pending; requires storage schema, diff calculator, alert pipeline, UI charts.
- **Documentation Hygiene**: merge duplicate README sections post-validation, link back to this spec for authoritative claims.

## 6. Outstanding Actions

1. Execute backend+frontend benchmark runs; update Section 3 with observed metrics, upload artifacts.
2. Produce detailed design for line movement and alert system (schema, services, UI flows, tests).
3. Instrument SportRadar limiter and capture quota burn simulation results.
4. Establish update workflow (pre-merge checklist) to keep this spec synchronized with shipping state.

## 7. Change Log

| Date       | Change                                                          | Owner          |
| ---------- | --------------------------------------------------------------- | -------------- |
| 2025-11-01 | Initial consolidation of parity status, linked validation plan. | GitHub Copilot |
