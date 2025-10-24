### 5.305 frontend/src/core/CI/local_run_instructions.md

- **Status:** ✅ Completed (2025-09-30) — Document now covers smoke runner commands, the focused TypeScript gate, and troubleshooting for `ts-node`/`tsc` path issues.
- Purpose: Concise local developer steps to run the minimal smoke checks (install dependencies, run smoke runner, quick type-check).
- Action: Add commands and troubleshooting tips for common environment issues (ts-node, Node path, tsc missing).

### 5.306 frontend/src/core/tests/smoke/unified_shims_runner_instructions.md

- **Status:** ✅ Completed (2025-09-30) — Added step-by-step usage examples for both JS/TS runners and enumerated exit codes for CI parity.
- Purpose: How to run `unified_shims_runner.js` or `.ts` locally and in CI, with environment variables and expected exit codes.
- Action: Add sample commands and a note about the TypeScript fallback.

### 5.307 frontend/src/core/docs/README_CONTRIBUTORS.md

- **Status:** ✅ Completed (2025-09-30) — Checklist now points to smoke runners, CI quickchecks, and doc touchpoints for shim edits.
- Purpose: Short contributor-facing checklist for editing core shims, tests, and docs.
- Action: Provide links to smoke tests, CI guidelines, and PR checklist.

### 5.308 frontend/src/core/tests/smoke/unified_shims_runner.js

- **Status:** ✅ Completed (2025-09-30) — CommonJS smoke runner loads logger/cache/guarded import plus the broader shim surface and exits with meaningful codes on failure.
- Purpose: (Implementation file referenced earlier) Node-runner that imports the shims and exercises basic API.
- Action: Create a tiny runner that imports `UnifiedLogger`, `UnifiedCache`, `GuardedImport` and exits non-zero on failure.

### 5.309 frontend/src/core/GuardedImport/index.ts

- **Status:** ✅ Completed (2025-09-30) — Async helper attempts dynamic import with timeout, logs warnings, and returns fallbacks for smoke runners.
- Purpose: Implement the `guardedImport` helper (TypeScript entry point).
- Action: Provide an implementation that attempts a dynamic import, enforces optional timeout, and returns the fallback on failure. Log errors via `console.warn` or `UnifiedLogger` if present.

### 5.310 frontend/src/core/UnifiedLogger/index.ts

- **Status:** ✅ Completed (2025-09-30) — Singleton logger now exposes `getLogger` with `info/warn/error/debug` forwarding to structured console output.
- Purpose: Minimal `getLogger` runtime implementation that returns structured loggers with `info/warn/error/debug`.
- Action: Provide a small implementation that forwards to `console` and formats messages with `component` and `context` metadata.

### 5.311 frontend/src/core/UnifiedCache/index.ts

- **Status:** ✅ Completed (2025-09-30) — Map-backed fallback implements get/set/delete/has/clear with TTL handling for smoke scenarios.
- Purpose: Minimal `UnifiedCache` facade with in-memory fallback supporting `get/set/delete/has/clear` and TTL.
- Action: Implement a synchronous in-memory Map-based cache with TTL and a `size()` helper; document that it's an in-memory fallback for dev.

### 5.312 frontend/src/core/tests/smoke/unified_shims_runner.ts

- **Status:** ✅ Completed (2025-09-30) — ts-node runner mirrors the JS assertions, covering logger/cache/guarded import flows for TypeScript environments.
- Purpose: TypeScript runner variant for CI when `ts-node` is available (imports shims and exercises a small scenario).
- Action: Create runner that runs `getLogger('smoke')`, logs, sets and gets a cache key, and runs `guardedImport` with an invalid path to verify fallback.

### 5.313 frontend/src/core/README.shims_quickstart.md

- **Status:** ✅ Completed (2025-09-30) — Quickstart now demonstrates logger/cache/guarded import usage with caveats for shims.
- Purpose: Quickstart guide showing how to import and use `UnifiedLogger`, `UnifiedCache`, and `guardedImport` in components.
- Action: Add small code snippets demonstrating typical usage and caveats.

### 5.314 frontend/src/core/tests/smoke/package.json (dev only)

- **Status:** ✅ Completed (2025-09-30) — Package now publishes `test:smoke`, `test:smoke:ts`, and `test:tsc` scripts with scoped dev deps.
- Purpose: Small `package.json` snippet recommended for running smoke tests in CI or locally when project-level `node_modules` are absent.
- Action: Provide minimal devDependencies (`jest`, `ts-node`, `typescript`) and a `test:smoke` script running the runner.

### 5.315 frontend/src/core/README.legal.md

- Purpose: Short legal note reminding contributors to avoid including real credentials/data in checked-in fixtures; references `SECURITY_ACTIONS.md`.
- Action: Add to `frontend/src/core/docs` and link from contributor guides.

### 5.316 frontend/src/core/PROJECT_CORE_TODO.md

- Purpose: High-level TODO tracker for remaining core shim tasks and tests, prioritized by impact.
- Action: Add the top 12 items (GuardedImport, UnifiedCache, UnifiedLogger, TelemetryGate tests, UnifiedState helpers, WorkerPool, smoke runners, README updates) as explicit tickets.

### 5.317 backend/services/ev_feed_service.py

- **Status:** ✅ Completed (2025-10-01) — Added lazy initialization guards plus on-demand generation so `/api/ev/feed` and `/api/opportunities/positive-ev` return seeded data even when startup hooks are disabled or Redis is offline.
- Purpose: Ensure the +EV feed can hydrate itself during tests and lean-mode environments without relying on the background task.
- Action: Gate initialization with locks, reuse the ring buffer as a cache fallback, and trigger a single-shot generation whenever the cached payload is missing or stale while keeping Redis/unified-cache writes best-effort.

### 5.318 frontend — AbortSignal shim adoption sweep

- **Status:** ✅ Completed (2025-10-01) — Replaced direct `AbortSignal.timeout` usage across App health checks, AI dashboards, odds/risk widgets, and shared services with the resilient `createTimeoutSignal` helper.
- Purpose: Prevent undici/jsdom incompatibilities during Jest runs and guarantee timeout controllers are always cleaned up in browsers without native `AbortSignal.timeout`.
- Action: Updated `App.tsx`, `BestBetsDisplay`, `OddsComparison`, `KellyCalculator`, `RealTimePerformanceMonitor`, `AIRecommendationsDashboard`, `ArbitrageOpportunities`, and shared services (`api/client`, `cheatsheetsService`, `coreFunctionalityService`, `RealTimePlayerDataService`, `backendHealth`, `apiTester`, unified API clients) to allocate helper-controlled signals per request and dispose controllers in `finally` blocks; refreshed audit entry to flag the shim rollout.

### 5.319 frontend/public & test fixtures — AbortSignal polyfill backfill

- **Status:** ✅ Completed (2025-10-01) — Extended the resilient timeout shim pattern to browser-only E2E helpers so manual validations mirror the runtime safeguards.
- Purpose: Ensure the static console harness (`frontend/public/e2e-browser-validation.js`) and the fallback HTML test fixture behave predictably in Safari/legacy browsers and in environments where `AbortSignal.timeout` throws (jsdom/Jest), avoiding uncollected timers.
- Action: Inlined a lightweight `createTimeoutSignal` helper within the public E2E script and the `validate-fallback.html` test harness, routing all manual fetch probes through the polyfill + `cleanup()` to guarantee controller disposal and consistent error logging when native `AbortSignal.timeout` is unavailable or throws synchronously.

### 5.320 frontend/src/utils/createTimeoutSignal — regression tests

- **Status:** ✅ Completed (2025-10-02) — Added focused Jest coverage for the timeout shim to lock in native vs. fallback behaviour.
- Purpose: Prevent future regressions where `AbortSignal.timeout` availability or cleanup semantics diverge across Node/jsdom and browser environments.
- Action: Introduced `createTimeoutSignal.test.ts` under `frontend/src/utils/__tests__/`, exercising (a) native `AbortSignal.timeout` happy path, (b) fallback path when the native API throws, and (c) cleanup semantics that cancel pending timers, all under both real and fake timers to guarantee deterministic behaviour.

### 5.321 frontend lint guard — targeted timeout enforcement

- **Status:** ✅ Completed (2025-10-02) — Added a lightweight ESLint entrypoint dedicated to the timeout rule so CI can enforce the helper requirement without running the full lint suite.
- Purpose: Guarantee future code paths cannot call `AbortSignal.timeout` directly while keeping legacy lint noise isolated from timeout enforcement.
- Action: Introduced `frontend/eslint-timeouts.config.cjs` with a focused `no-restricted-properties` rule (ignoring the shared helper and browser fixtures) and wired `npm run lint:timeouts` to execute the check across `src/` and `scripts/` with zero-warning tolerance.

# A1Betting7-13.2 — Comprehensive Repository Audit

> **Status:** In progress (living document)
>
> **Last updated:** 2025-09-25

## 1. Methodology

- Enumerated repository contents (root, backend, frontend, supporting directories) via directory listings.
- Classified assets by purpose (runtime code, build/test tooling, documentation, generated artefacts).
- Sampled representative modules for each subsystem (backend routes/services, frontend components/hooks, scripts, infrastructure).
- Logged duplication, legacy artefacts, and security risks (e.g., committed DBs, autonomous agent code).
- Compiled actionable guardrails and immediate cleanup steps; document will be updated as deeper inspections occur.

## 2. Executive Summary

- The repo contains overlapping generations of backend/frontend implementations created by autonomous agents—numerous "enhanced/optimized/modern" variants coexist with unified services, causing maintenance overhead.
- Generated artefacts (logs, coverage reports, historical SQLite DBs, ML outputs) and sensitive files (cookies, chat histories) are committed; the latest sweep removed logs/coverage/SQLite snapshots, with `.gitignore` updates keeping them local-only.
- Documentation is abundant but fragmented; a concise contributor + AI-agent playbook is needed to prevent future sprawl.
- Backend should standardize on `backend/core/app.py:create_app`; redundant entry points and autonomous orchestration modules should be archived.
- Frontend modular architecture is in place (PropOllamaContainer, MasterServiceRegistry); the stray nested `frontend/frontend` project, the `legacy/` hook shim, Electron build artefacts, coverage reports, and committed frontend logs have all been removed, narrowing the remaining cleanup to oversized dependency caches.
- Immediate focus: lock down automation, prune artefacts, consolidate instructions, and reaffirm test baselines before additional feature work.

### Note: smoke TypeScript check for frontend/core

Added a smoke-only TypeScript config at `frontend/src/core/tsconfig.smoke.json` and wrapper support (`RUN_TSC_SMOKE`) to enable a focused type-check of the core shims and smoke runners. Rationale: the full frontend tree currently contains legacy files (e.g., `BankrollPageOld.tsx`) that generate many unrelated tsc errors. The smoke config allows CI to enforce a narrow compile gate for the core shims without forcing a full repo-wide type-fix before quickchecks are adopted.

Next steps: if the smoke check passes in CI, enable `RUN_TSC_SMOKE=1` in the workflow. Later, progressively broaden the TypeScript gate once the larger frontend compile errors are addressed.

## 3. Repository Structure Overview

### 3.1 Top-Level Directories (Functional Groups)

| Category               | Paths                                                                                                                                        | Notes                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Backend application    | `backend/`, `src/`                                                                                                                           | FastAPI app (primary). `src/` holds stray React components (e.g., `AnalyticsTab.tsx`) from earlier experiments |
| Frontend application   | `frontend/`                                                                                                                                  | React 18/Vite codebase + Jest/Playwright configs                                                               |
| Infrastructure & ops   | `ops/`, `scripts/`, `automation/`, `infrastructure/`, `helm/`, `docker-compose*.yml`, `Dockerfile*`, `Makefile`, `start*.ps1`                | Deployment scripts, automation pipelines, docker orchestration, platform ops                                   |
| Data & ML assets       | `models/`, `mlruns/`, multiple `*.db` files (SQLite/MLflow), `phase*_benchmark*.json`, `phase*_verification*.json`                           | Persisted training data, model artifacts, verification outputs                                                 |
| Documentation          | Numerous `*.md` at root (roadmaps, completion reports, summaries), `docs/`, `Roadmaps/`, `analysis/`, `propFinder research/`, etc.           | Extensive AI-generated documentation; many redundant/dated                                                     |
| Testing                | `tests/`, `test/`, `testing/`, `frontend/test*` scripts, `test_snapshots/`, coverage artefacts (`coverage/`, `htmlcov/`)                     | Multiple overlapping suites (pytest, Jest, custom scripts)                                                     |
| Automation & AI agents | `autonomous_*` scripts, `background_agents.py`, `agent_planner.py`, `recursive_intelligence.log`                                             | Autonomous agents used to modify repo; need containment                                                        |
| Native modules         | `native/` (Rust crate)                                                                                                                       | Potential performance extensions; verify integration                                                           |
| Observability & logs   | `logs/`, `performance_metrics.log`, `smoke_test_*.log`, `operational_risk_validation.log`                                                    | Runtime logs committed to repo (should relocate)                                                               |
| Generated artefacts    | `.coverage`, `.pytest_cache/`, `.mypy_cache/`, `coverage/`, `dist/`, `node_modules/`, snapshots (`openapi_snapshots/`, `test_report_*.json`) | Should be gitignored/archive                                                                                   |
| Assets & media         | `screenshots/`, `prizepicks_props.csv`, `propfinder_sample.json`, `mlb_odds_raw_dump.json`                                                   | Reference datasets/screens                                                                                     |

### 3.2 Notable Root Files

- Multiple environment templates: `.env`, `.env.example`, `.env.production.example`, `backend/.env*`, `postgres_dev.env`.
- Package manifests: `package.json`, `requirements.txt`, `requirements-dev.txt`, backend-specific variants (`backend/requirements*.txt`).
- Build/test configs: `vite.config.ts`, `jest.config*.cjs`, `eslint.config.mjs`, `tailwind.config.js`, `pytest.ini`, `.pre-commit-config.yaml`.
- Large number of status/summary markdowns (e.g., `PHASE*_...`, `IMPLEMENTATION_COMPLETE.md`) documenting past automation phases.
- Several SQLite databases (`a1betting.db`, `chat_history.db`, `users.db`, etc.) were stored in repo; they have now been deleted, and developers should regenerate them locally under `data/` when needed.

### 3.3 Working Tree Snapshot (2025-09-26)

Running `git status --short` on branch `chore/head-endpoints` shows extensive drift between the working tree and the expected audit baseline:

- 70+ modified or newly added GitHub workflow files, README variants, and backend/frontend source modules (e.g., `backend/betting/*`, numerous EV/odds React components) that are not documented in this audit and appear unrelated to PropFinder hardening.
- Sensitive artifacts flagged for removal earlier have re-surfaced as tracked changes: `backend/prizepicks_cookies.json`, `real_training_data.db`, `.coverage`, and multiple log files are present in the working tree despite `.gitignore` coverage.
- Several deletions are staged for previously acknowledged log/DB artifacts (e.g., `frontend/backend/logs/*.jsonl`, `frontend/logs/*.json`) but have not been committed; ensure these changes are reconciled before completing remediation tasks.
- Newly generated audit support files (e.g., `reports/service_dependency_report.json`, `reports/security/log_redaction_report.json`) remain untracked and correctly ignored.

**Action:** freeze feature development while the audit finishes, reconcile outstanding diff/noise, and align this document with the final source of truth before merge. Documented observations below refer to the repository content as inspected directly in the working tree on 2025-09-26.

## 4. Backend Analysis

### 4.1 Project Layout

- **Entry points:** `backend/main.py` (current), alternates (`main_unified.py`, `main_deprecated.py`, `main_backup.py`, `production_integration.py`, `optimized_production_integration.py`). Need consolidation onto a single supported factory (`backend/core/app.py:create_app` per VS Code tasks).
- **Application factory & core:** `backend/core/` (app factory, middleware registration, enhanced response normalizer), `backend/app/` (legacy application wiring).
- **Routing layer:** `backend/routes/` houses REST endpoints (prop finder, ML, ingest, admin, websocket). Additional routers live in standalone files (`filtered_prediction_api.py`, `production_api.py`, `ultra_accuracy_routes.py`).
- **Service layer:** Massive `backend/services/` directory with 250+ modules, including “unified\_\*” implementations intended to replace legacy variants.
- **Models & schemas:** `backend/models/`, `backend/users/`, `backend/validators/`, `backend/errors/`, `backend/constants/`.
- **Ingestion & ETL:** `backend/ingestion/`, `etl_mlb.py`, `statcast_*`, `comprehensive_prop_generator.py`, `sportradar_service.py`.
- **Monitoring & health:** `backend/health/`, `backend/metrics/`, `monitoring/`, `realtime_accuracy_monitor.py`, `system_monitor.py`.
- **Security & auth:** `backend/auth/`, `auth_service.py`, `security/` (middleware, hardening scripts), `security_config.py`.
- **Automation artefacts:** `autonomous_*`, `agent_planner.py`, `background_agents.py`, `self_modifying_engine.py`—legacy AI agent orchestrators.
- **Testing within backend:** `backend/tests/`, `backend/test/`, plus fixture files (`test_payloads.json`, `test_props.json`).

### 4.2 Service Layer Observations

- **Unified core:** `unified_data_fetcher`, `unified_cache_service`, `unified_error_handler`, `unified_logging`, `unified_prediction_service` provide consolidated patterns. They coexist with numerous `enhanced_*`, `optimized_*`, `modern_*` services performing similar work.
- **Dependency census (2025-09-26):** Regenerated `reports/service_dependency_report.json` enumerates **324** service-layer modules; **199** expose zero internal imports, underscoring the volume of leaf nodes and likely dead code. Prefix histogram highlights that `enhanced_*`, `modern_*`, `optimized_*`, and `legacy_*` families dominate—use this as the triage backlog when migrating functionality into the unified services.
- **Domain clusters:** Odds (`odds_*`), props (`propfinder_*`, `prop_analysis`), ML (`modern_ml_service`, `advanced_bayesian_ensemble`, `mlops_pipeline_service`), personalization (`personalization/`), streaming/websocket (`websocket/`, `streaming/`), risk (`risk_tools_service.py`). Each cluster has duplicated stacks (simple/real/enhanced versions).
- **External integrations:** SportRadar (`sportradar_service.py`, `mlb_provider_client.py`, `comprehensive_sportradar_integration.py`), PrizePicks (`real_prizepicks_service.py`, `enhanced_prizepicks_service_v2.py`), Baseball Savant (`baseball_savant_client.py`, `optimized_baseball_savant_client.py`).
- **ML pipelines:** `modern_ml_service.py`, `advanced_ml_service.py`, `real_ml_service.py`, `mlops_pipeline_service.py`, `production_deployment_service.py`, `autonomous_monitoring_service.py`. Expect heavy overlap; needs rationalization onto modern pipeline + fallbacks.
- **Caching stack:** `cache/`, `intelligent_cache_service.py`, `optimized_cache_service.py`, `redis_cache_service.py`, `event_driven_cache.py`.

### 4.3 Route Surface Inventory

- `backend/routes/` contains 90+ routers spanning admin, analytics, EV, ML, sportsbook integrations, observability, websocket, and diagnostics. Duplicate or patched files exist (e.g., `analytics_routes.py` vs `analytics_routes.py.broken`, `mlb_extras.py` vs `mlb_extras_broken.py`).
- Consolidated alternatives (`consolidated_admin.py`, `consolidated_ml.py`, `unified_api.py`) coexist with legacy/experimental routes (`priority2_*`, `meta_legacy.py`, `phase2_routes.py`). Determine which are actually included in `core/app.py` router registration.
- Security & compliance endpoints: `security_head_endpoints.py`, `security_routes.py`, `security_test.py` (target of current branch work).
- Websocket & streaming: `enhanced_websocket_routes.py`, `realtime_websocket_routes.py`, `ws_client*.py`, `streaming/` subpackage.
- ML/model registry: `modern_ml_routes.py`, `model_registry_routes.py`, `enterprise_model_registry_routes.py`, `phase3_routes.py`, `model_registry.py`. Need consolidation to a single registry API.
- Recommendation: trace router imports in application factory, remove `.broken` files, and archive unused route variants after verifying dependencies.

### 4.4 Supporting Infrastructure

- **Config & feature flags:** `config/`, `config_manager.py`, `feature_flags.py`, `feature_flags_service.py`, environment-specific toggles.
- **Database:** `database.py`, `enhanced_database.py`, migration scripts (`alembic/`, `migration_upgrade.sql`, `analytics_migration.sql`); previously committed SQLite snapshots (`backend/a1betting.db*`, etc.) removed in favor of local-only storage under `data/`.
- **Observability logs:** Historical runtime logs lived under `backend/logs/` (structured logs, mlflow.db); directory deleted—developers should rely on local logging only.
- **CLI & scripts:** `cli/`, `tasks/`, `scripts/` within backend for seeders (`seed_admin.py`, `seed_bookmakers.py`), validation (`validate_*`), smoke tests (`smoke_test_runner.py`).
- **Docs:** `backend/docs/`, reports (`ADVANCED_BEST_PRACTICES_REPORT_*.json`, `PRODUCTION_OPERATION_REPORT_*.json`), `README.md`, `ROADMAP.md`.

### 4.5 Risks & Cleanup Targets

- **Parallel implementations:** Need to deprecate unused entry points and service variants (keep unified + production-ready versions).
- **Checked-in state:** SQLite DBs, cookies (`prizepicks_cookies.json`), logs (`rules_audit_log.jsonl`), coverage artefacts should be moved out of VCS.
  - ✅ `prizepicks_cookies.json` purged from history tip and added to `.gitignore`; see `SECURITY_ACTIONS.md` for rotation follow-up.
  - ✅ Root-level SQLite/MLflow databases removed from the working tree; `.gitignore` already blocks reintroduction—communicate policy change to devs.
  - 🔄 Next: audit past commits for sensitive artefacts and ensure log redaction rules are documented.
- **Autonomous agent code:** Validate necessity; if not in active use, quarantine or remove to avoid accidental execution.
- **Redundant requirements:** Multiple `requirements*.txt`—standardize on minimal dev/prod sets.

### 4.6 Application Wiring (core/app.py)

- **Factory responsibilities:** `create_app()` is the single sanctioned entry point. It loads `.env`, evaluates feature flags (`DEV_LEAN_MODE`, `DISABLE_STARTUP_HOOKS`, rate-limit toggles), and instantiates FastAPI before wiring middleware, routers, and startup hooks. Lean mode trims heavy middleware while keeping core routing intact.
- **Middleware ordering:** CORS → Request/trace IDs → Structured logging → Prometheus metrics → Payload guard → Rate limiting → Security headers → Legacy forwarding. Many layers are optional; missing imports only log warnings, so the app silently operates without observability or security hardening if dependencies disappear.
- **Route registration:** The factory eagerly imports dozens of routers: consolidated PrizePicks/ML/Admin APIs (`/api/v2/...`), odds & EV stacks (`/v1/odds`, `/api/ev`, `/api/ev/enhanced`), streaming, risk/personalization, unified sports activation, HEAD endpoints, ingestion (standard + admin), metrics, alert engine, model registries (simple + enterprise with startup initializers), player performance, and more. Each inclusion wraps `ImportError` to avoid crashes in stripped environments, yet the breadth increases startup cost and obscures canonical surface area.
- **PropFinder handling:** After bulk registration, `register_feature_routers()` ensures `/api/propfinder` is mounted once; a compatibility router injects static sample data when the real service is unavailable, keeping tests alive but masking failures.
- **Response normalization:** An inner middleware inspects JSON payloads, normalizing envelope shapes, enriching metadata, and rejecting invalid `sport` values with a canonical 422 response. Legacy clients relying on `status`/`result` still receive compatible fields.
- **WebSockets & dev helpers:** A deprecated `/ws/legacy/{client_id}` endpoint remains included for telemetry. Dev-only auth helpers mount conditionally via `DEV_AUTH`. Startup hooks initialize enterprise model registry services when present.
- **Risks:** Import-order complexity and silent fallbacks make it hard to detect when critical routers fail to load. Multiple EV routers (`ev_routes`, `enhanced_ev_routes`) share the same prefix; clarify precedence. Document required vs optional integrations and add health checks that warn when a router suppresses an `ImportError`.
- **Regression snapshot (2025-09-26):** `python -m pytest tests/backend/routes -q` shows the legacy forwarding middleware now classifies `/api/propfinder/opportunities` as a legacy endpoint and returns HTTP 405 to the real router, failing 19 PropFinder contract tests. The same run reported the consolidated admin router failing to import (parameter with default ordering) and the risk personalization router crashing on a `NoneType` config; these wiring issues must be resolved before re-running the suite.

### 4.7 PropFinder API (routes/propfinder_routes.py)

- **Role & size**: 1,300+ line router powering the flagship dashboard. Declares rich Pydantic responses with Phase 1.2/4.x fields (EV, arbitrage, CLV) and helper `_convert_opportunity_to_response` that normalizes dataclass objects into API payloads while optionally enriching with EV and bookmaker analytics.
- **Dependencies**:
  - Primary service: `SimplePropFinderService` via `get_simple_propfinder_service()`; still marked “temporary” but now entrenched in production flow.
  - Surrounding integrations: bookmark persistence (`BookmarkService`), EV engine (`ev_engine`, `compute_ev_details`), odds enrichment (`create_enhanced_bookmaker_response`), CLV cache (`clv_persistence_service`). All imported defensively with try/except, meaning the route silently downgrades if optional modules fail.
- **Runtime behavior**:
  - Converts dataclass `PropOpportunity` values to API dictionaries, handling enums, optional bookmaker payloads, and CLV toggling (`include_clv` query flag). Logging reveals CLV mode toggles response shape between raw dict and Pydantic model, which has type implications for downstream clients.
  - Query parameters mirror dashboard filters (sports, confidence, edge, sharp money, alerts). Additional toggles include `force_flat_baseline`, `diagnostics`, and `include_clv`, hinting at evolving data science experiments layered onto the same endpoint.
- **Risks / cleanup targets**:
  - Size & responsibility creep—business logic (EV detail computation, bookmaker coercion) lives inside the route instead of a dedicated serializer.
  - Optional imports mask failures; we should surface warnings in health checks or tighten contracts so missing EV/CLV dependencies trigger explicit degradation alerts.
  - The “temporary” SimplePropFinderService dependency suggests a to‑do: either replace with a production abstraction or document that it is now canonical.

### 4.8 Service Directory Explosion (`backend/services/`)

- **Inventory snapshot:** directory contains 324 Python modules spanning prefixes `advanced_`, `enhanced_`, `optimized_`, `real_`, `modern_`, plus historical `simple_` shims. Subfolders (`alerting/`, `cache/`, `correlation/`, `events/`, `live/`, `llm/`, `monitoring/`, etc.) coexist with flat files, making discoverability difficult.
- **Overlap examples:**
  - Baseball clients (`baseball_savant_client.py`, `enhanced_baseball_savant_client.py`, `optimized_baseball_savant_client.py`).
  - Cache layers (`cache_service_ext.py`, `enhanced_caching_service.py`, `optimized_cache_service.py`, `intelligent_cache_service.py`, `unified_cache_service.py`).
  - Prop analysis (`enhanced_prop_analysis_service.py`, `enhanced_prop_analysis_service_fixed.py`, `batch_prop_analysis_service.py`, `propfinder_data_service.py`).
  - Modern ML stack duplicates (`modern_ml_service.py`, `modern_ml_integration.py`, `modern_ml_data_bridge.py`, `real_ml_service.py`, `advanced_ml_service.py`, `unified_prediction_service.py`).
- **Observations:** unified services (e.g., `unified_data_fetcher.py`, `unified_cache_service.py`, `unified_error_handler.py`) appear intended to replace earlier generations, but legacy variants remain committed without clear deprecation markers.
- **Automated feature engineering:** `automated_feature_engineering.py` orchestrates sports-specific rollups, TSFresh extraction (with statistical fallbacks), Featuretools DFS, and layered selectors to emit cached `FeatureSet` objects with importance/quality metadata. Optional dependencies are guarded—when libraries such as TSFresh or RandomForest are missing the pipeline gracefully degrades to basic heuristics—so downstream services should inspect metadata to detect reduced fidelity.
- **Advanced Bayesian ensemble:** `advanced_bayesian_ensemble.py` delivers uncertainty-aware stacking with Dirichlet weighting, conformal prediction bands, and fallback heuristics when heavy dependencies (PyTorch, pyro) are absent. It trains meta-learners on-demand, memoizes posterior weights, and exposes calibration diagnostics—modules consuming its output must account for multiple result shapes (`prediction`, `lower_bound`, `upper_bound`, `confidence_score`).
- **Intelligent cache:** `intelligent_cache_service.py` blends Redis pipelines, predictive warming, and sport-aware TTL heuristics with a memory fallback when Redis is unreachable. Background tasks manage pipeline batching, warming queues, and pattern analysis; metrics are tracked centrally so callers can surface hit-rate telemetry. Consumers should prefer `set(..., use_pipeline=True)` for bulk workloads and monitor degradation when `_use_memory_fallback` toggles on.
- **Modern ML service:** `modern_ml_service.py` is the orchestration hub for transformer/GNN ensembles, automated feature engineering, MLOps tracking, and Phase‑2 optimization hooks (distributed inference, hierarchical caching, real-time updates). Every dependency is optional: MLflow, Optuna, Featuretools, and the Phase‑2 stack each degrade gracefully with warnings, so production routing must verify capability flags before invoking advanced code paths. The API accepts rich `PredictionRequest` payloads, emits `ModernPredictionResult` with uncertainty bands, and can persist artifacts to MLflow depending on availability.
- **Phase 3 ops stack:** `mlops_pipeline_service.py`, `production_deployment_service.py`, and `autonomous_monitoring_service.py` coordinate automated training, staged promotion, blue/green deploys, and self-healing monitors. Each module checks for MLflow/Optuna/Ray/Kubernetes before executing, falling back to no-op shims when infrastructure isn’t present. Pipelines persist run metadata, update the shared model registry, and use `performance_monitor` + `intelligent_cache_service` for warm deployments; monitoring loops stream alerts when drift or SLO violations are detected.
- **Performance optimization:** `performance_optimization.py` bundles `ModelOptimizer`, `BatchProcessor`, and `MemoryOptimizer` utilities to quantize/compile Torch models, export ONNX artifacts, and orchestrate GPU-aware batching with async pipelines. Optional accelerators (ONNX Runtime, TensorRT) are guarded so the service degrades to pure PyTorch when absent; all optimizers emit speedup metrics so upstream callers can log adoption impact.
- **Modern data bridge:** `modern_ml_data_bridge.py` fuses Baseball Savant + MLB provider feeds with the advanced feature engineer, caching tensors for 5 min and exposing async helpers that return ML-ready Torch tensors. Each data source is wrapped in try/except so outages downgrade gracefully, while context/weather features and derived metrics (e.g., contact quality) ensure transformers/GNNs receive enriched inputs.
- **Real-time updates:** `real_time_updates.py` supplies online-learning managers, drift monitors, automated redeploy orchestration, and A/B testing hooks for continuous model refresh. Like the rest of the stack, MLflow logging is optional; when enabled, update cycles tag runs and archive metrics, otherwise the pipeline still queues gradients via asyncio and enforces rollback rules on drift alerts.
- **Security hardening:** `advanced_security_service.py` centralizes policies, encryption, token issuance, and model/data audit logging. It conditionally enables Fernet encryption/jwt signing when dependencies exist, tracks failed auth attempts for alerting, and exposes compliance-aware scan results—downstream routes should route sensitive actions through this service to ensure audit events and risk scores are captured.
- **Action plan:**
  1.  Generate dependency graph (imports + actual usage) to identify dead modules. Start with critical prefixes (`enhanced_`, `optimized_`, `real_`).
  - ✅ Script at `scripts/generate_service_dependency_report.py` now produces a JSON inventory (`module_count=324`; prefix counts: `enhanced` 29, `real` 18, `advanced` 13, `unified` 13, `optimized` 11, `modern` 4, `simple` 2). Output remains gitignored so reports stay local; a human-readable snapshot lives at `reports/service_dependency_summary.md`. Heavy dependency footprint (pandas 57 refs, numpy 75, sklearn/optuna present) shows that many "advanced" variants drag sizable ML stacks even when redundant. 199 modules have zero internal dependencies (majority `enhanced_*` and `other` prefixed files), suggesting candidates for archival once router usage is confirmed.
    - 🔍 Sample zero-dependency candidates: `advanced_arbitrage_engine`, `advanced_bayesian_ensemble`, `advanced_feature_engine`, `advanced_security_service`, `alert_service`, `async_performance_optimizer`, `analytics_persistence_service`, `auth_service`. Most rely solely on external libraries and aren't referenced internally, so we can triage them quickly by searching for router/service imports.
  2. Annotate keepers with docstrings tying them to active routers/services; move deprecated files into `services/legacy/` prior to deletion.
  3. Publish a `SERVICES_README.md` summarizing canonical entry points (use unified services first, fall back to shims only if necessary).

## 5. Frontend Analysis

### 5.1 Project Layout

- **Framework:** React 18 with Vite build. TypeScript-centric (TS configs present), though many `.js` remnants remain. Tailwind + custom CSS.
- **Entry points:** `frontend/src/main.tsx` (React root), `frontend/index.html` / `index.tsx`. Additional legacy entries (`index.js`, `index.minimal.html`) and Electron packaging configs (`electron-builder.config.js`; build artefacts now local-only).
- **Structure:** Feature-first organization under `frontend/src/`—directories for components, hooks, services, store, domains, analytics, unified, onboarding, etc. Extensive modularization plus remaining legacy folders.
- **Admin dashboard:** `frontend/admin/`, Monaco/Ace YAML editors per repo instructions, Material UI usage. `ADMIN_MODE.md` documents purpose.
- **State management:** Combination of Zustand stores (`store/`, `stores/`), React context (`contexts/`), and TanStack Query patterns (per instructions). Historical Redux-style helpers appear to have been superseded by the unified hooks.
- **Service registry:** `frontend/src/services/MasterServiceRegistry.ts` orchestrates data/cache services; numerous specific services under `services/` matching backend unified patterns.
- **Service registry:** `frontend/src/services/MasterServiceRegistry.ts` orchestrates data/cache services, maintains health/metrics snapshots, and exposes convenience getters for domain registries. Type safety is intentionally loose (`unknown`/`any`) to keep compatibility with legacy adapters; configuration updates propagate to registered services when `updateConfiguration` is called.
- **Hooks:** `hooks/usePropFinderData.tsx`, `usePropOllamaState.ts`, etc.—central to data fetching and caching logic.
- **Hooks:** `hooks/usePropFinderData.ts` is a backwards-compatible shim that fetches `/api/propfinder/opportunities`, transforms the opportunities list into simple performance/odds arrays, and implements auto-refresh + bookmark sync for legacy consumers. Broader hook suite (`usePropOllamaState.ts`, etc.) manages richer data orchestration.
- **Components:** `components/` holds modularized PropFinder/PropOllama UIs (CondensedPropCard, PropOllamaContainer, BetSlipComponent, VirtualizedPropList). Additional directories for layouts, navigation, onboarding, analytics visualizations.
- **Components:** `components/` holds modularized PropFinder/PropOllama UIs (CondensedPropCard, PropOllamaContainer, BetSlipComponent, VirtualizedPropList). `PropFinderDashboard.tsx` (~1,200 lines) orchestrates the flagship filters, EV/CLV toggles, TanStack virtualization, and bookmark syncing on top of the PropFinder hook—any refactor should break this monolith into focused subcomponents.
- **Services:** `services/` is extensive (EnhancedDataManager, RealDataManager, unified service wrappers, numerous `*Service.ts` variants). Duplicate generations (enhanced/optimized/real/unified) coexist; requires consolidation around MasterServiceRegistry-approved modules.
- **Services:** `services/` is extensive (EnhancedDataManager, RealDataManager, unified service wrappers, numerous `*Service.ts` variants). Duplicate generations (enhanced/optimized/real/unified) coexist; requires consolidation around MasterServiceRegistry-approved modules. `EnhancedDataManager.ts` is the de facto frontend data bus—providing intelligent caching, request deduplication, batching, WebSocket updates, and validation hooks—so other services should lean on it rather than cloning logic.

### 5.2 Build & Tooling

- **Configs:** `vite.config.ts`, `vite.config.optimized.ts`, `vitest.config.ts`, multiple Jest configs (`jest.config.cjs`, `jest.realtime.config.js`, etc.), ESLint (`eslint.config.cjs`, `.eslintrc.js`, `eslint-rules/`), Tailwind config.
- **Env management:** `.env*` files for dev/production; caution—actual credentials may be present (`frontend/a1betting.db`, `chat_history.db`).
- **Testing:** Jest + React Testing Library (`setupTests.ts`), Playwright (`e2e/`, `playwright.config.ts`), MSW integration (`msw-import.test.js`). Coverage outputs committed (`coverage/`, `junit.xml`, `type-check-output.txt`).
- **Desktop packaging:** Electron support (configs, scripts); distribution artefacts are no longer checked in.

### 5.3 Documentation & Reports

- Numerous consolidation/cleanup reports (`CONSOLIDATION_COMPLETE.md`, `FRONTEND_CONSOLIDATION_REPORT.md`, `FINAL_CONSOLIDATION_COMPLETE.md`).
- Feature references (`FEATURE_MATRIX.md`, `FUNCTIONALITY_STATUS.md`, `PROPFINDER_KILLER_IMPLEMENTATION.md`).
- Architecture diagrams (`ARCHITECTURE.md`, `ARCHITECTURE_CONNECTIONS_OVERVIEW.md`).
- Performance + monitoring docs (`PERFORMANCE_MONITORING.md`, `MONITORING_TESTING_DOC.md`).

### 5.4 Risks & Cleanup Targets

- **Duplicate structures:** Legacy hook shim, nested `frontend/frontend/` project, and Electron build output have been removed; continue pruning any remaining stale build artefacts to reflect the current architecture only.
- **Artifacts:** Previously committed `node_modules/` directories have been removed; frontend tree now contains only source and intentional assets.
- **Environment leakage:** `.env`, SQLite DBs, `chat_history.db` within frontend root—remove or secure.
- **Instruction overload:** Dozens of AI-generated documents cause confusion; curate definitive onboarding doc for copilots/humans.
- **Hook/service drift:** `usePropFinderData.ts` currently returns only performance/odds arrays for legacy clients, yet `PropFinderDashboard` expects richer `opportunities`+`stats` fields; confirm which implementation is canonical and deprecate the unused interface to avoid silent runtime mismatches.

## 5.5 Ongoing Audit Entries (continuing)

5.233. Frontend/core: `UnifiedCache.ts` — Purpose: facade for caching primitives used across services. Observation: currently exists as a `.d.ts` with no runtime logic in several builds; multiple services import `UnifiedCache` expecting a `get/set/ttl` API. Risk: runtime `ImportError` or undefined method errors cause UI crashes during hydration. Action: implement a thin re-export to the canonical `EnhancedDataManager` / `CacheManager` or provide a minimal in-memory fallback when Redis/localStorage clients are absent.

5.234. Frontend/core: `FeatureFlags.ts`

- **Status:** ✅ Completed (2025-10-05) — Runtime shim now exposes a registry-backed feature flag service, broadcasts change events, and ships with an integration test that confirms UI gating reacts to toggles.
- **Purpose:** Environment/remote toggles used by admin tooling and feature gating.
- **Observation:** `FeatureFlags.ts` previously shipped as an empty runtime stub next to declarations, leaving the admin YAML editor disconnected from the frontend runtime.
- **Risk:** Unregistered feature providers caused flags written by admins to be invisible at runtime, leading to silent rollout failures.
- **Action:** Wire the runtime to `MasterServiceRegistry`, surface a subscription-friendly service API (`isFeatureEnabled`, `registerFeature`, `subscribeToFeature`), and add a smoke test that flips a flag and asserts the `FeatureComponent` renders/blocks content accordingly.

  5.235. Frontend/core: `StrategyEngine.ts` — Purpose: orchestrates composite strategy evaluation for bets. Observation: large `.d.ts` surface with polymorphic contracts but no canonical runtime. Risk: complex consumers (PropOllamaUnified, Recommendation widgets) assume synchronous evaluation; missing implementations produce inconsistent UI states. Action: add a minimal synchronous shim implementing the narrow API paths currently exercised by `PropOllamaUnified` and document upgrade path for richer async scoring.

  5.236. Frontend/core: `PredictionValidator.ts` — Purpose: validate ML/LLM prediction payload shapes. Observation: present as types + tests but missing the runtime validator. Risk: invalid predictions from backend may render dangerously (NaNs, missing fields). Action: implement a guarded validator that normalizes unknown shapes into a safe canonical `PredictionResult` and logs warnings via `UnifiedLogger`.

  5.237. Frontend/core: `PluginSystem.ts` — Purpose: plugin registry used by admin/editor. Observation: minimal shim already present in `frontend/src/core/PluginSystem.ts` but lacks lifecycle hooks for enable/disable and audit logging. Risk: plugin side-effects could persist across reloads or create memory leaks. Action: extend the shim with lifecycle events (register, enable, disable, list) and wire simple audit events to `UnifiedMetrics`.

  5.238. Frontend/core: `UnifiedLogger.ts` — Purpose: centralized logging/structured logs. Observation: console-forwarding shim exists but not all modules import the canonical logger; some use `console` directly. Risk: inconsistent log formats hamper observability. Action: export `getLogger(name)` plus `setLevel(level)`, add a smoke test to ensure logs include the `component` field, and add a developer note to prefer `UnifiedLogger` over `console`.

  5.239. Frontend/core: `UnifiedMetrics.ts`

- **Status:** ✅ Completed (2025-10-04) — Runtime shim now exposes exporter bindings with telemetry gate coverage, adds optional Prometheus enablement hooks, and includes focused unit tests.
- **Purpose:** Metrics aggregation client for counters/histograms.
- **Observation:** Declaration-only in some variants; runtime shim implemented but missing Prometheus exporter binding.
- **Risk:** Missing metrics export reduces diagnostic telemetry in staging/production.
- **Action:** Ensure the shim exposes no-op methods when Prometheus/analytics services are missing and add an optional `prometheusExporter.bind()` hook for environments with `PROMETHEUS_ENABLED`.

  5.240. Frontend/core: `EventBus.ts` — **Status:** ✅ Completed (2025-09-30). Purpose: intra-frontend pub/sub used by navigation & analytics. Implementation now exposes `getInstance`, `publish`, and async-safe `emitAsync` in addition to legacy `emit/on/off`, ensuring promise-returning handlers are awaited where needed.

  5.241. Frontend/core: `GuardedImport.ts` — Purpose: helper for optional dynamic imports. Observation: helper is referenced in multiple services but lacking a central implementation. Risk: inconsistent guarded import patterns lead to duplicate shims and divergent behavior. Action: implement `guardedImport(modulePath, fallback)` that returns a stable promise resolving to fallback on failure, and standardize usage across services.

  5.242. Frontend/core: `FeatureComposition.ts` — Purpose: compose multiple feature transforms for UI cards. Observation: declared helpers exist but runtime composition functions are absent. Risk: absent composition causes missing derived metrics in Prop cards. Action: implement small pure functions for common compositions (mergeAlternativeProps, computeTopConfidence) and include unit tests.

  5.243. Frontend/core: `UnifiedState.ts` — **Status:** ✅ Completed (2025-10-02) — Purpose: centralized lightweight state helpers for cross-cutting concerns. Implemented dedicated reset/rehydrate flows via `createTestStateHarness`, wiring Jest `beforeEach` hooks to guarantee deterministic state in tests and adding unit coverage for harness + global helpers to avoid flakiness.

  5.244. Frontend/core: `TelemetryGate.ts` — Purpose: gate telemetry collection based on user/feature consent. Observation: spec exists as README but runtime gating is inconsistent. Risk: privacy/regulatory noncompliance if telemetry is sent without consent. Action: implement gating checks in `UnifiedMetrics` and `UnifiedLogger` to respect `TelemetryGate.isEnabled()` and add an audit test that toggles consent and asserts no network calls are sent.

  5.257. Frontend/app shell: `App.tsx`, `__tests__/App.e2e.test.tsx`, `_mocks_/framer-motion.ts`, and `ArbitrageOpportunities.tsx` — **Status:** ✅ Completed (2025-10-03). Purpose: ensure navigation readiness is emitted at runtime and quick links exercise all top-level destinations. Updates: `NavigationReadyAnnouncer` now fires `navReadySignal` on mount/route changes; regression tests cover AI/ML Models (`ml-model-center-heading`), Betting (`betting-interface-heading`), and Arbitrage (`arbitrage-opportunities-heading`) quick links; the Jest `framer-motion` mock filters motion-only props to eliminate the `whileHover` DOM warning; and the arbitrage toolbar no longer nests buttons, enabling clean rendering for the execute + refresh controls. Follow-ups: consider wiring a mock for `AbortSignal.timeout` in MLModelCenter tests to suppress the demo-mode warning during Jest runs.

### 5.221 frontend/src/core/PropFinderCompatibilityLayer.ts

- Purpose: Compatibility shim that maps legacy `usePropFinderData` outputs to the richer `opportunities`+`stats` shape expected by `PropFinderDashboard`.
- Observation: Several consumers expect the richer shape while the hook returns a slimmed result for legacy compatibility.
- Risks: Silent shape mismatches cause empty UI lists and hard-to-trace filtering bugs.
- Action items:
  - Implement a small compatibility layer that can be toggled via `FeatureFlags` (gradual rollout) and include unit tests to validate mapping rules.

### 5.222 frontend/src/core/TelemetryGate.ts

- Purpose: Helper to conditionally enable telemetry calls respecting privacy toggles and environment restrictions.
- Observation: Analytics calls are scattered; a central gate will reduce accidental PII leaks.
- Risks: Unchecked telemetry may violate privacy settings and regulations.
- Action items:
  - Implement `TelemetryGate.isAllowed(context)` that consults `UnifiedConfig` and `FeatureFlags`, and use it in high-traffic analytics paths.

### 5.223 frontend/src/core/ServerFallbackMocks.ts

- Purpose: Collection of deterministic server-side fallback mocks used during local dev and CI when backend features are missing.
- Observation: Many tests inline mocks; a consolidated set will reduce duplication.
- Risks: Divergent mocks produce test flakiness and inconsistent developer experiences.
- Action items:
  - Gather common mocked endpoints (propfinder/opportunities, ml/predict, auth/status) and provide toggleable fixtures for MSW or test setups.

### 5.224 frontend/src/core/WorkerizedFeatureComposer.ts

- Purpose: Offload expensive feature composition runs to workers with deterministic caching.
- Observation: Feature composition is sometimes run synchronously in UI paths; provide a workerized helper to avoid jank.
- Risks: Main-thread execution causes UI freezes on low-end devices.
- Action items:
  - Provide `composeFeaturesOffload(input): Promise<FeatureSet>` that uses `LightweightWorkerPool` with local cache and TTL.

### 5.225 frontend/src/core/ChangeLog/README.md

- Purpose: Document the change-log process for the core modules and outline the release strategy for small, low-risk runtime shim updates.
- Observation: No centralized change-log for small infra changes; this increases review friction.
- Risks: Small but breaking changes slip into dev without clear audit trail.
- Action items:
  - Add `ChangeLog/README.md` describing expected PR labels, semantic versioning for infra shims, and a minimal release checklist.

### 5.226 frontend/src/core/UnifiedCache/benchmarks/simple_benchmark.ts

- Purpose: Small benchmark harness to measure get/set throughput and TTL eviction under simulated load for the chosen `CacheManager`.
- Observation: No benchmark exists to compare candidate cache implementations; bench helps choose canonical impl.
- Risks: Choosing an unsuited cache impl may surface in production with poor latency characteristics.
- Action items:
  - Add a simple benchmark script that runs headless in Node (not browser) and outputs hit/miss/ops/sec for CI comparisons.

### 5.227 frontend/src/core/HealthCheck/README.md

- Purpose: Document client and admin health check expectations and how `ClientHealthProbe` and `UnifiedMonitor` produce snapshots.
- Observation: Health check concepts are spread across code and docs; this README consolidates expectations for devs and ops.
- Risks: Inconsistent health signals increase the cost of troubleshooting in staging/production.
- Action items:
  - Author `HealthCheck/README.md` with snapshot contract, example payloads, and integration test guidance.

### 5.228 frontend/src/core/fixtures/propfinder/sample_opportunity.json

- Purpose: Canonical sample opportunity JSON used by unit tests and local dev to mirror production `PropOpportunity` shape.
- Observation: Multiple ad-hoc sample files exist; standardize on one canonical sample to avoid drift.
- Risks: Divergent sample shapes hide serialization bugs until integration tests run.
- Action items:
  - Create a canonical sample and update tests to import it; add a smoke test that serializes/deserializes the sample through the route serializer.

### 5.229 frontend/src/core/Experimentation/experiment_schema.md

- Purpose: Document the schema for experiment definitions used by the frontend (flag name, percentage, start/end, metrics to emit).
- Observation: Experiment metadata lives in multiple places; schema harmonization reduces confusion.
- Risks: Inconsistent experiment metadata causes A/B measurement errors and rollout mishaps.
- Action items:
  - Draft `experiment_schema.md` and a simple validator used in dev to sanity-check experiment configs.

### 5.230 frontend/src/core/UnifiedMonitor/integration.test.ts

- Purpose: Integration test that simulates multiple failing subsystems and asserts `UnifiedMonitor` aggregates statuses correctly.
- Observation: `UnifiedMonitor` lacks an integration test covering multiple degraded inputs.
- Risks: Silent failures in monitor aggregation reduce observability fidelity.
- Action items:
  - Add integration test that injects mocked metric failures and verifies overall health status and emitted logs.

### 5.231 frontend/src/core/metrics/prometheus_exporter.ts

- **Status:** ✅ Completed (2025-10-02) — Added a lightweight exporter that renders `UnifiedMetrics` snapshots (counters, gauges, histograms, metric totals) into Prometheus text format with optional timestamps.
- Purpose: Small shim that exposes metrics snapshot via a Prometheus-compatible text format for local scraping during dev/devops demos.
- Action: Implemented `getPrometheusText(options?)` that normalizes label serialization, emits `# TYPE` headers, and produces `_count`/`_sum` samples for histograms while respecting telemetry gating through `UnifiedMetrics`.

### 5.232 frontend/src/core/README.md

- Purpose: Lightweight landing doc explaining core facades, runtime shim policy, and preferred canonical implementations.
- Observation: Multiple contributors reference different facades without a single source-of-truth. This README should become the canonical developer onboarding doc for `frontend/src/core`.
- Action items:
  - Draft `README.md` that lists canonical modules (UnifiedLogger, UnifiedMetrics, UnifiedCache, GuardedImport) and links to their smoke tests.

### 5.245 frontend/src/core/GuardedImport.ts

- **Status:** ✅ Completed (2025-09-30) — `guardedImport` helper now performs dynamic imports with optional timeouts, logs warnings, and returns provided fallbacks when resolution fails.
- Purpose: Centralized implementation for safe dynamic imports.
- Observation: Many modules implement ad-hoc guarded import logic leading to inconsistent fallback behavior.
- Risk: Duplicate patterns create hard-to-find bugs where a missing optional dependency behaves differently across modules.
- Action: Implement `guardedImport(modulePath, {timeout?, fallback?})` that returns a stable promise resolving to the module or the fallback. Add tests for failure cases (module not found, network error when remote loader used).

  5.246. frontend/src/core/UnifiedCache/index.ts — **Status:** ✅ Completed (2025-09-30). Purpose: canonical re-export + minimal fallback implementation. Observation: current shim provides an in-memory Map with TTL plus `set/get/delete/has/clear`, covering smoke-test expectations while remaining a safe fallback when richer caches are unavailable.

  5.247. frontend/src/core/UnifiedLogger/index.ts — **Status:** ✅ Completed (2025-09-30). Purpose: canonical logger export. Observation: shim now exposes `getLogger(name)` returning structured `info/warn/error/debug` methods with component metadata; console-forwarding satisfies smoke checks.

  5.248. frontend/src/core/UnifiedMetrics/index.ts — **Status:** ✅ Completed (2025-10-01). Purpose: basic metrics collector with no-op bindings when exporters are absent. Observation: singleton now offers `counter`, `gauge`, and `histogram` handles (each gated by `TelemetryGate`), maintains label-aware snapshots, and preserves `recordMetric` / `getMetrics` compatibility for existing smoke checks.

  5.249. frontend/src/core/FeatureFlags/index.ts — Purpose: runtime feature flag client. Observation: provide `getFlag(name)`, `setFlag(name, value)`, `subscribe(name, cb)`. Action: hook into `MasterServiceRegistry` or fallback to localStorage-backed flags.

  5.250. frontend/src/core/PluginSystem/index.ts — Purpose: extend the existing shim with lifecycle and audit hooks. Observation: add `registerPlugin(plugin)`, `enablePlugin(id)`, `disablePlugin(id)`, `listPlugins()`. Action: emit metrics on enable/disable and persist a minimal plugin registry in localStorage for dev.

  5.251. frontend/src/core/FeatureComposition/helpers.ts — **Status:** ✅ Completed (2025-09-30). Purpose: small pure helpers for composing alternative props and confidence scores. Observation: helper implementations live in `FeatureComposition.ts`, merging alternative props and computing top confidence with smoke coverage.

  5.252. frontend/src/core/UnifiedState/index.ts — Purpose: implement `resetState()` + `rehydrate(initial)`. Observation: tests rely on deterministic state resets; provide test helpers. Action: export `createTestStateStore()` used in `beforeEach` of unit tests.

  5.253. frontend/src/core/TelemetryGate/index.ts — Purpose: implement runtime gating checks used by metrics/logger. Observation: implement `isEnabled(context)` and tie into `FeatureFlags` + `UnifiedConfig`. Action: add audit test ensuring no HTTP requests are made when telemetry is disabled.

  5.254. frontend/src/core/tests/fixtures/sample_opportunity_v1.json — Purpose: canonical fixture for tests. Observation: create and use in unit tests to avoid divergent ad-hoc fixtures. Action: update tests to import this fixture.

  5.255. frontend/src/core/tests/smoke/unified_shims.smoke.test.ts — Purpose: smoke tests verifying the unified shims export the minimal runtime API expected by the codebase. Observation: create a Jest-based smoke test that imports `UnifiedLogger`, `UnifiedCache`, `GuardedImport`, `UnifiedMetrics` and asserts basic operations complete without throwing. Action: wire this test into CI and run in local dev before merging shim changes.

  5.256. frontend/src/core/docs/CONTRIBUTING.md — Purpose: contribution guidelines for infra shims. Observation: doc should instruct developers to add smoke tests and update `README.md` when adding or changing core facades. Action: draft minimal guidelines and PR template expectations.

- Observation: Export format is missing; adding a no-op browser-safe exporter helps local debugging.
- Risks: Without a standard exporter, metrics snapshots remain in-memory and are inaccessible to tooling.
- Action items:
  - Implement `getPrometheusText()` that serializes counters/timers into the Prometheus text exposition format for local use.

### 5.232 frontend/src/core/README.md

- Purpose: A concise roadmap for the `core` folder: responsibilities, canonical facades, and fast links to tests and smoke harnesses.
- Observation: `core/` is large and the developer onboarding points are fragmented; a top-level README will speed up new contributor ramp.
- Risks: New contributors spend more time finding core contracts and duplicate existing helpers.
- Action items:
  - Create `frontend/src/core/README.md` summarizing the key facades (`UnifiedCache`, `UnifiedLogger`, `UnifiedMonitor`, `EnhancedDataManager`) and linking to `ChangeLog`, `HealthCheck`, and `CacheManager/README.md`.

### 5.94 frontend/src/core/FeatureComposition.ts

- **Status:** ✅ Completed (2025-09-30) — Runtime implementation now supplies `mergeAlternativeProps`, `computeTopConfidence`, and supporting helpers used by the smoke runner and utilities.
- Purpose: Core facade expected to expose composition helpers for feature engineering, feature sets, and feature merging across model inputs. In the working tree this file is an empty runtime stub (exports nothing) and type declarations are present separately.
- Strengths: Placeholder keeps import paths stable for modules that may expect `core/FeatureComposition` at runtime.
- Risks: Empty runtime module + existing `.d.ts` leads to runtime failures if other code imports methods at runtime. TypeScript consumers may compile while runtime consumers (tests, bundles) crash.
- Action items:
  - If the feature composition helpers are implemented elsewhere, replace this file with a thin runtime export that re-exports the concrete implementation (avoid duplicated logic).
  - Otherwise implement minimal runtime functions, add unit tests, and regenerate `.d.ts` to match the runtime API.

### 5.95 frontend/src/core/FeatureFlags.ts

- Purpose: Feature flag utilities and central toggles for frontend experiments. Current `FeatureFlags.ts` is an empty runtime file while `FeatureFlags.d.ts` exists.
- Strengths: Keeps import surface stable while the flag system is being designed.
- Risks: Runtime consumers that attempt to read flags will receive `undefined` or a broken interface. Divergence between `d.ts` and runtime can hide the issue during type-checking.
- Action items:
  - Implement a small runtime feature flag provider that reads `VITE_*` env toggles and exposes `isFeatureEnabled(name)` and `withFeature(flag, fn)` helpers.
  - Add tests and update TypeScript declarations to match.

### 5.96 frontend/src/core/PredictionEngine.ts

- Purpose: Runtime re-export. This module re-exports `Recommendation` and `PredictionEngine as UnifiedPredictionEngine` from `../utils/PredictionEngine` and therefore is a safe runtime pass-through shim.
- Strengths: Good pattern — centralizes the public import path and keeps implementations under `utils/` while maintaining `core/` contract.
- Risks: If `../utils/PredictionEngine` changes shape without updating this shim, callers will break. No immediate mismatch detected (this file contains actual re-exports at runtime).
- Action items:
  - Add a lightweight unit test ensuring the re-exported `UnifiedPredictionEngine` is instantiable and matches the expected interface.
  - Document the contract in `frontend/README.md` so future refactors keep the shim stable.

### 5.97 frontend/src/core/StrategyEngine.ts

- Purpose: Strategy orchestration facades (strategy composition, backtests, bet sizing). At present this runtime file is an empty stub while a `.d.ts` exists.
- Strengths: Reserves the path for future strategy orchestration code.
- Risks: Import-time runtime errors if code expects strategy helpers. Type-only declarations will give false confidence during compile-time.
- Action items:
  - If the real implementation lives elsewhere, convert this file to a re-export shim to the canonical implementation.
  - Otherwise implement minimal runtime functions (composeStrategy, evaluateStrategy) and tests, then regenerate declarations.

### 5.98 frontend/src/core/PluginSystem.ts

- Purpose: Plugin system orchestrator for runtime extension points (data adapters, UI plugins). The runtime file is currently an empty `export {};` stub.
- Strengths: Having a canonical plugin entrypoint simplifies future plugin registration and discovery.
- Risks: Without a runtime implementation, dynamic plugin registration attempts (tests or runtime discovery) will fail. `.d.ts` likely claims APIs that aren't present at runtime.
- Action items:
  - Implement a minimal plugin registry (register/unregister/getPlugins) with a typed interface and event hooks.
  - Add tests around plugin lifecycle and document the plugin contract to reduce accidental breakage.

### 5.99 frontend/src/core/FeatureComposition.d.ts

- Observation: The `.d.ts` declaration for `FeatureComposition` is empty. This indicates a declaration file exists but does not describe any exported types or runtime surface.
- Risk: Empty declaration files adjacent to empty runtime stubs compound confusion — TypeScript tooling might not help detect missing runtime behavior.
- Action items:
  - Regenerate `.d.ts` from implementation once runtime exports are added, or remove the `.d.ts` to avoid confusion until the feature is implemented.

### 5.100 frontend/src/core/FeatureFlags.d.ts

- Observation: `FeatureFlags.d.ts` is an empty declaration file. No typed contract is provided for the expected feature toggle helpers.
- Action items:
  - Provide minimal type definitions for `isFeatureEnabled(flag: string): boolean` and `withFeature(flag, fn)` or remove the declaration until the runtime API exists.

### 5.101 frontend/src/core/PluginSystem.d.ts

- Observation: Empty `.d.ts` declaration. The declaration surface does not help plugin implementers.
- Action items:
  - Add a typed interface for `Plugin`, `PluginRegistry`, and lifecycle hooks. If the runtime will be a simple registry, keep the types minimal to reduce maintenance friction.

### 5.102 frontend/src/core/StrategyComposition.ts

- Observation: Runtime file is empty — no exported helpers for composing strategies are present.
- Action items:
  - If strategy composition utilities are provided elsewhere, convert this file to re-export them. Otherwise add a minimal implementation (composeStrategy, evaluateStrategy) and tests.

### 5.103 frontend/src/core/StrategyEngine.d.ts

- Observation: `StrategyEngine.d.ts` is empty. The TypeScript contract for strategy orchestration is missing.
- Action items:
  - Provide a typed contract for strategy entrypoints and ensure the runtime matches it. Prefer small surface area to keep maintenance simple.

### 5.104 frontend/src/core/models/ModelManager.ts

- Purpose: Runtime manager for model lifecycle (register, load, unload, versioning hooks).
- Observation: Runtime file exists but appears minimal; some helpers are fowarded to `models/*` utilities while declarations live in `.d.ts`.
- Risks: Lightweight runtimes that don't persist state or validate model metadata can cause silent model swaps and incompatible inference calls at runtime.
- Action items:
  - Add tests for register/load/unload lifecycle and version mismatch behavior.
  - Harden the manager to validate model manifests and expose a health/ready API for consumers.

### 5.105 frontend/src/core/models/ModelRegistry.ts

- Purpose: Central index of available frontend ML models and metadata used by prediction engines and analytics.
- Observation: Implementation is present but lacks robust manifest validation and lacks clear eviction/TTL policies for hot models.
- Risks: Unverified model metadata may lead to runtime errors during inference; lack of eviction may leak memory in long-running dev shells.
- Action items:
  - Implement manifest schema validation and unit tests.
  - Add an optional eviction or LRU policy and document expected lifecycle in README.

### 5.106 frontend/src/core/models/ModelEvaluator.ts

- Purpose: Utilities to compute model-level diagnostics (latency, confidence distributions, basic calibration checks).
- Observation: File exists; some functions are placeholders returning default metrics.
- Risks: Consumers expecting real diagnostics will receive mock values, hiding model drift or live regressions.
- Action items:
  - Replace placeholders with real sampling and histogram generation; add tests to exercise the evaluator against canned model outputs.
  - Integrate evaluator summaries with `analytics/ModelPerformanceTracker` for UI surface.

### 5.107 frontend/src/core/models/MLService.ts

- Purpose: Facade for ML service calls (local worker, remote HTTP, or Electron IPC) with retry and fallback.
- Observation: Contains stubs and type-only declarations; feature-flag gating exists but behavior lacks graceful fallbacks.
- Risks: Calling code may assume an available ML service and crash when bridging layers do not exist in a target environment (browser vs electron vs tests).
- Action items:
  - Implement environment-guarded adapters (worker/http/ipc) and a deterministic fallback for tests.
  - Add end-to-end test that toggles adapters and verifies deterministic responses.

### 5.108 frontend/src/core/models/BaseMLService.ts

- Purpose: Abstract base class specifying adapter lifecycle (initialize, predict, warmup, shutdown).
- Observation: Declaration file and minimal runtime present; several abstract methods are unimplemented in concrete adapters.
- Risks: Incomplete adapter implementations can raise runtime type errors when `predict` is expected to return a consistent shape.
- Action items:
  - Provide integration tests that assert the BaseMLService contract against every adapter implementation.
  - Add runtime guards that normalize responses to the canonical `Prediction` shape.

### 5.109 frontend/src/core/ModelVersioning.ts

- Purpose: Track model versions, migration rules, and compatibility matrices for client-side usage.
- Observation: Types and lightweight helpers exist but migration rules are absent; version compatibility checks are advisory only.
- Risks: UI and prediction consumers may use incompatible models without warning, producing inconsistent results across clients.
- Action items:
  - Implement a `isCompatible(modelVersion, requiredSchemaVersion)` helper and surface warnings via `UnifiedLogger` when incompatibilities are detected.
  - Add a simple migration shim that maps legacy response shapes into the current canonical format for short-term compatibility.

### 5.110 frontend/src/core/logging/logger.ts

- Purpose: Detailed logging transports and structured message helpers used by `EnhancedLogger` and services.
- Observation: Runtime file exists but some transports are no-ops or console-only; TypeScript declarations expect more features (sinks, serializers).
- Risks: Lack of structured sinks prevents reliable telemetry in production; console-only transports leak to end user consoles and make debugging noisy.
- Action items:
  - Add an adapter interface for transports and wire a default console transport plus a no-op remote sink for CI tests.
  - Write a small integration test that verifies log messages are serialized correctly and metrics counters increment.

### 5.111 frontend/src/core/metrics/metrics.ts

- Purpose: Core metrics registry used by frontend services for counts/timings and feeding the unified metrics facade.
- Observation: The module is present but contains lightweight in-memory counters; some exported helpers are unimplemented.
- Risks: Memory-only metrics without export means operational teams cannot observe frontend degradation; tests may rely on metrics that are silently missing.
- Action items:
  - Implement basic export hooks (getSnapshot, reset) and integrate with `UnifiedMetrics` shim.
  - Add unit tests for counter increments, timing accuracy (mocked), and snapshot integrity.

### 5.112 frontend/src/core/UnifiedLogger.ts

- Purpose: Public core-layer logger facade that other `core/*` modules can import to get a stable logging surface.
- Observation: A minimal runtime shim is present elsewhere in `utils/`, but this `core` facade sometimes contains `export {}` or an empty surface leading to mismatch between `@/utils` and `@/core` import paths.
- Risks: Inconsistent import paths can cause duplicate loggers or missing functionality when consumers import the wrong path.
- Action items:
  - Convert `@/core/UnifiedLogger.ts` into a thin re-export of the canonical `logging/logger.ts` (or the `enhancedLogger`) so both import paths resolve to the same runtime object.
  - Add a smoke test that imports from both paths and asserts identity equality (===).

### 5.113 frontend/src/core/UnifiedCache.ts

- Purpose: Expose a canonical cache facade for core-layer consumers.
- Observation: File currently exists and has been noted as empty in multiple places. The canonical cache logic lives in `services/EnhancedDataManager` and `CacheManager` subfolders.
- Risks: Dual implementations or empty facades lead to consumers quietly bypassing the authoritative cache, producing inconsistent cache semantics across the app.
- Action items:
  - Implement `UnifiedCache.ts` as a thin re-export to the authoritative cache (e.g., `CacheManager` or `EnhancedDataManager`) to prevent divergence.
  - Add tests that verify get/set/invalidate semantics match the underlying implementation.

### 5.114 frontend/src/core/StrategyEngine.ts

- Purpose: Orchestrates strategy registration and evaluation pipeline used by betting/hedging components.
- Observation: Runtime present but many methods are placeholders and strategy composition helpers are split across `StrategyComposition.ts`.
- Risks: Placeholder behavior can yield incorrect stake recommendations and misleading strategy events in dashboards.
- Action items:
  - Consolidate composition helpers and implement a minimal evaluation pipeline with deterministic outputs for default strategies.
  - Add unit tests for strategy registration, evaluation, event emission, and configuration validation.

### 5.115 frontend/src/core/StrategyComposition.ts

- Purpose: Helpers to combine, score, and order strategy building blocks into coherent strategy objects.
- Observation: Mostly type-level utilities with some runtime glue missing; `d.ts` exists but the runtime glue lacks completeness.
- Risks: Compositions that rely on missing glue will behave unpredictably and degrade downstream ranking/sorting logic.
- Action items:
  - Fill in the runtime composition glue that materializes composed strategies from declared inputs and add tests ensuring composed strategies evaluate deterministically.
  - Document expected composition semantics so strategy authors can reason about priority, weighting, and overrides.

### 5.149 frontend/src/core/PluginSystem.ts

- Purpose: Runtime plugin registry and discovery surface used by UI extension points and data adapters.
- Observation: Previously flagged as an empty runtime stub in earlier scans; a minimal singleton registry was implemented as a pragmatic shim but lacks lifecycle event hooks and persistence guarantees.
- Risks: Without lifecycle hooks (activate/deactivate) and safe error handling on plugin activation, third-party plugins may destabilize the host app or leak resources.
- Action items:
  - Harden the registry with activation/deactivation hooks, sandboxing (try/catch around plugin code), and optional health checks per plugin.
  - Add unit tests for lifecycle transitions and a smoke test that loads a test plugin and asserts isolation.

### 5.150 frontend/src/core/FeatureFlags.ts

- Purpose: Flag evaluation helpers for feature gating across the frontend.
- Observation: Runtime file was empty; add a small runtime provider that maps `import.meta.env` (Vite) variables to runtime flags and falls back to an in-memory store.
- Risks: Inconsistent flag resolution between build-time and runtime can cause unexpected behavior in A/B flows and feature rollouts.
- Action items:
  - Implement `isFeatureEnabled(name)` and `withFeature(flag, fn)` helpers and wire them to `MasterServiceRegistry` for central visibility.
  - Add an integration test that toggles flags via environment variables and verifies UI behavior (e.g., feature-specific DOM nodes appear/disappear).

### 5.151 frontend/src/core/UnifiedCache.ts

- Purpose: Canonical cache facade for core-layer consumers.
- Observation: Empty facade previously — convert to a thin re-export to `services/cache/CacheManager` or `EnhancedDataManager` to avoid divergence.
- Risks: Duplicate or missing cache semantics across modules if facades remain empty.
- Action items:
  - Implement re-export, add smoke tests for basic get/set/invalidate semantics, and include TTL behavior verification.

### 5.152 frontend/src/core/logging/logger.ts

- Purpose: Structured logging transports and serialization helpers.
- Observation: Runtime exists but transports are largely console-only; add a default transport adapter and a no-op remote sink for tests.
- Risks: Lack of structured transports prevents operational telemetry collection in hosted environments.
- Action items:
  - Add transport adapter interface, wire console + noop transports, and add serialization tests.

### 5.153 frontend/src/core/metrics/metrics.ts

- Purpose: In-memory metrics registry used by frontend services for counters/timings.
- Observation: Present but lightweight; expand with snapshot/export hooks and ensure integration with `UnifiedMetrics` facade.
- Risks: Missing export and snapshot APIs reduce observability and complicate debugging for intermittent client-side issues.
- Action items:
  - Add `getSnapshot()`, `reset()`, and `exportPrometheus()` helper (no-op in browser) and unit tests for timing accuracy (mock clocks).

### 5.154 frontend/src/core/models/ModelRegistry.ts

- Purpose: Central index for frontend-side models and metadata.
- Observation: Implementation exists but lacks manifest validation and eviction policies.
- Risks: Unvalidated manifests can cause incompatible inference calls and memory leaks in long-running Electron shells.
- Action items:
  - Add manifest schema validation, optional LRU eviction, and tests exercising register/load/unload scenarios.

### 5.155 frontend/src/core/models/ModelEvaluator.ts

- Purpose: Model diagnostic utilities (latency, calibration, confidence distributions).
- Observation: Several placeholders return defaults — replace with sampling-based diagnostics or ensure clear developer warnings when diagnostics are mocked.
- Risks: Consumers may treat mocked diagnostics as real, masking model drift.
- Action items:
  - Implement sampling-based diagnostics, add integration with `analytics/ModelPerformanceTracker`, and unit tests for histogram summaries.

### 5.156 frontend/src/core/models/MLService.ts

- Purpose: Facade for calling ML adapters (worker/http/ipc) with retries and deterministic fallbacks for test environments.
- Observation: Stubs exist; propose deterministic test adapter and environment-guarded adapters for browser/Electron.
- Risks: Calls to absent adapters in some environments can crash UI flows expecting predictions.
- Action items:
  - Implement adapter registry, deterministic mock adapter for tests, and e2e test verifying adapter fallback logic.

### 5.157 frontend/src/core/ModelVersioning.ts

- Purpose: Track model compatibility and migration rules.
- Observation: Helpers are lightweight; implement explicit compatibility checks and short-term migration shims.
- Risks: Incompatible clients and models may produce inconsistent predictions.
- Action items:
  - Add `isCompatible()` helper, warn via `UnifiedLogger` on mismatches, and provide migration shims for legacy shapes.

### 5.158 frontend/src/core/StrategyEngine.ts

- Purpose: Strategy registration and evaluation for betting flows.
- Observation: Contains placeholders — consolidate with `StrategyComposition` and add deterministic evaluation mechanics for default strategies.
- Risks: Placeholder outputs may mislead downstream bet-sizing consumers.
- Action items:
  - Implement evaluation pipeline with deterministic outputs and test coverage for common strategies.

### 5.159 frontend/src/core/StrategyComposition.ts

- Purpose: Runtime composition helpers for strategies.
- Observation: Mostly types and partial glue — implement concrete composition glue and document semantics.
- Risks: Missing glue produces unpredictable strategy behavior.
- Action items:
  - Implement compose/evaluate helpers and tests for priority/weight handling.

### 5.160 frontend/src/core/FeatureComposition.ts

- Purpose: Feature engineering composition utilities (facade for feature merges and pipelines).
- Observation: Previously empty — if canonical implementation exists elsewhere, convert this to a re-export; otherwise implement minimal runtime helpers and unit tests.
- Risks: Missing runtime leads to import failures and runtime crashes where feature composition is expected.
- Action items:
  - Re-export concrete implementation if present, otherwise implement small runtime API and regenerate `.d.ts`.

### 5.161 frontend/src/core/EventBus.ts

- Purpose: Lightweight event bus used for cross-component signaling within the frontend.
- Observation: A minimal EventBus implementation was detected (on/off/emit) but tests for handler isolation and exception swallowing are missing.
- Risks: Uncaught exceptions in handlers can bubble and break unrelated components; listener leaks may build up during long running dev sessions.
- Action items:
  - Add tests asserting handler exception isolation, ensure off/unsubscribe semantics remove handlers correctly, and add a weak-ref or manual cleanup pattern for ephemeral listeners.

### 5.162 frontend/src/core/PredictionValidator.ts

- Purpose: Central validation helpers for prediction payloads and local shape normalization.
- Observation: The runtime file exists but contains minimal validators; strengthen schema checks and provide helpful error messages for downstream consumers.
- Risks: Weak validation permits malformed predictions to propagate and crash UI components consuming model outputs.
- Action items:
  - Implement stricter runtime checks, add a small error wrapper type to normalize errors to a canonical shape, and add unit tests for common invalid payloads.

### 5.163 frontend/src/core/UnifiedDataEngine.ts

- Purpose: Canonical data orchestration facade that upstream services can rely on for caching/batching and normalization.
- Observation: Present but light — ensure it delegates to `EnhancedDataManager` and documents behavior around request deduplication and TTL semantics.
- Risks: Divergent implementations across services may cause inconsistent caching and duplicate network calls.
- Action items:
  - Convert to thin re-export to `EnhancedDataManager` or adaptors, add contract tests verifying dedup and TTL behavior under parallel requests.

### 5.164 frontend/src/core/UnifiedAnalytics.ts

- Purpose: Public facade for analytics tracking and event instrumentation used by UI components.
- Observation: Facade exists but transports are mostly no-op; integrate with a simple in-memory queue and a no-op remote sender for CI.
- Risks: Missing transport adapters mean analytics events are lost in production unless explicitly wired.
- Action items:
  - Add transport adapter interface, wire default console adapter + noop remote sink, and add tests that assert event enrichment and batching behavior.

### 5.165 frontend/src/core/UnifiedConfigManager.ts

- Purpose: Central runtime configuration manager for feature flags, endpoints, and health toggles.
- Observation: Implementation is lightweight; ensure observers can subscribe to config changes and that it exposes a stable runtime API.
- Risks: Consumers reading stale config may act on outdated toggles or incorrect endpoints.
- Action items:
  - Add subscription API, add tests for config hot-reload (mock env changes), and document expected lifecycle.

### 5.166 frontend/src/core/ErrorHandler.ts

- Purpose: Centralized runtime error classification and reporting helper used by services.
- Observation: Present but basic; add classification levels, user-facing message extraction, and mapping to telemetry events.
- Risks: Unstructured error propagation produces noisy logs and hides actionable metrics.
- Action items:
  - Implement structured error shape, add severity classification, integrate with `UnifiedLogger` and add unit tests.

### 5.167 frontend/src/core/UnifiedPredictionEngine.ts

- Purpose: Public engine facade used by components to request predictions from local or remote models.
- Observation: Implementation present but needs explicit fallbacks and a deterministic test adapter for CI runs.
- Risks: Absent fallbacks may lead to runtime failures when models are unavailable.
- Action items:
  - Encode adapter priority (local -> worker -> remote), add deterministic mock adapter and tests for fallback behavior.

### 5.168 frontend/src/core/UnifiedRiskManager.ts

- Purpose: Risk scoring and betting constraint facade used by strategy components.
- Observation: File exists with limited runtime logic; add risk rule evaluation and deterministic tests for common risk profiles.
- Risks: Missing or inconsistent risk checks can surface unsafe stake recommendations.
- Action items:
  - Implement core risk rule evaluation, add unit tests, and document API for strategy consumers.

### 5.169 frontend/src/core/UnifiedMonitor.ts

- Purpose: Lightweight runtime monitor for client-side health checks and metric emissions.
- Observation: Minimal implementation detected; ensure it can publish health snapshots and that it integrates with `metrics` and `logging` facades.
- Risks: Without health snapshots, transient client issues are harder to triage in production.
- Action items:
  - Implement health snapshot API (`getHealthSnapshot()`), wire to metrics, and add smoke tests for snapshot integrity.

### 5.170 frontend/src/core/UnifiedPredictionService.ts

- Purpose: Backend-facing prediction service wrapper used by the app to call server-side prediction endpoints.
- Observation: Present but not hardened for retries/timeout; add a resilient HTTP adapter with exponential backoff and circuit-breaker semantics.
- Risks: Naive HTTP calls may increase error propagation during transient backend failures.
- Action items:
  - Implement retry/backoff policy, add a circuit-breaker wrapper, and tests that simulate transient failures.

### 5.171 frontend/src/core/UnifiedConfig.ts

- Purpose: Lightweight configuration schema and defaults used across the frontend.
- Observation: Defaults exist but the module needs clearer merging semantics (env override vs code defaults).
- Risks: Confusing override semantics can lead to mismatched behavior between environments.
- Action items:
  - Clarify merge order, add tests for override precedence, and document expected sources of truth.

### 5.172 frontend/src/core/PredictionEngine.ts

- Purpose: Confirmed as a runtime re-export to `../utils/PredictionEngine` — keep as a stable public import surface.
- Observation: Re-export is correct and reduces risk for public imports; add a tiny smoke test ensuring the re-export is identity-equal to the canonical export.
- Action items:
  - Add simple smoke test asserting the re-export and document the contract in `frontend/README.md`.

### 5.173 frontend/src/core/PerformanceMonitor.ts

- Purpose: Client-side performance monitoring utilities used to measure render times, network latencies, and heavy computations.
- Observation: File exists as a declaration and lightweight runtime; extend to collect sampled histograms and expose snapshot APIs.
- Risks: Without accurate sampling and export capabilities, front-end performance regressions go unnoticed.
- Action items:
  - Implement sampled histograms, a compact export format, and unit tests around timing accuracy using mocked clocks.

### 5.174 frontend/src/core/CacheManager/

- Purpose: Local cache manager implementation folder referenced by `UnifiedCache` and other services.
- Observation: Several implementations exist under `CacheManager/`; select the authoritative one and re-export via `UnifiedCache` to avoid split-brain caching.
- Risks: Multiple cache implementations lead to inconsistent TTLs and cache invalidation semantics.
- Action items:
  - Identify canonical `CacheManager` implementation, update `UnifiedCache.ts` to re-export it, and add contract tests for consistency.

### 5.175 frontend/src/core/DataPipeline.ts

- Purpose: Declarative pipeline builder for transforming raw inputs into model-ready features and UI payloads.
- Observation: Present but lacks runtime validation and failure isolation (step-level errors may abort entire pipelines).
- Risks: A single pipeline transform failure can block downstream UI rendering.
- Action items:
  - Add step-level error isolation, optional retries for idempotent steps, and unit tests for common pipeline topologies.

### 5.176 frontend/src/core/DataIntegrationHub.ts

- Purpose: Central hub for integrating multiple data sources (ML, odds, stats) and emitting normalized events.
- Observation: Present but light on dedup and normalization rules; ensure the hub delegates to `EnhancedDataManager` for caching.
- Risks: Duplicate upstream calls and inconsistent normalization across consumers.
- Action items:
  - Improve normalization rules, add dedup guarantees, and integration tests that simulate parallel consumer loads.

### 5.177 frontend/src/core/AdvancedAnalysisEngine.ts

- Purpose: Frontend analytic helpers that wrap ML inference, local aggregation, and quick explainability utilities.
- Observation: Declaration exists; runtime may be stubbed — ensure it falls back to server-side analysis or a deterministic mock in browser contexts.
- Risks: Heavy client-side analysis can bloat the bundle and cause performance problems in low-end devices.
- Action items:
  - Implement environment-aware adapters (server/local/mock), add bundle-size gating for advanced features, and tests verifying fallback behavior.

### 5.178 frontend/src/core/Analyzer.ts

- Purpose: Small utility modules used by admin and analytics pages for data inspection.
- Observation: Files are present — add tests and ensure they are not imported in critical client bundles to avoid bloat.
- Risks: Accidentally bundling heavy analyzer utilities increases initial load.
- Action items:
  - Mark analyzer modules as dev-only or lazy-load, add tests for core helpers, and document intended usage.

### 5.179 frontend/src/core/BestBetSelector/

- Purpose: UI + algorithmic helpers for selecting candidate bets and presenting them to users.
- Observation: Folder exists; implement deterministic selection pipeline and tests for sorting, de-duplication, and confidence thresholds.
- Risks: Non-deterministic selection confuses users and A/B experiments.
- Action items:
  - Implement deterministic selection heuristics, unit tests, and document the selection scoring formula.

### 5.180 frontend/src/core/UnifiedErrorHandler.ts

- Purpose: Central handler that classifies, logs, and surfaces user-friendly messages for runtime errors.
- Observation: Declarations present; implement mapping to telemetry and standard user messages.
- Risks: Unstructured errors lead to poor UX and noisy observability.
- Action items:
  - Add mapping rules, integration with `UnifiedLogger`, and tests for classification/serialization.

### 5.181 frontend/src/core/UnifiedState.ts

- Purpose: Lightweight core state helpers used by small modules when a full store is unnecessary.
- Observation: Present as a minimal runtime stub — ensure serialization helpers and reset semantics exist for tests.
- Risks: Global state leaks across tests and long-running dev sessions if not resettable.
- Action items:
  - Provide `reset()` for test cleanup, document intended use, and add unit tests for isolation.

### 5.182 frontend/src/core/UnifiedBettingSystem.ts

- Purpose: High-level facade combining odds, strategies, risk, and betting APIs for the UI.
- Observation: Present but heavy; break responsibilities into smaller services behind a registry to improve testability.
- Risks: Monolithic facade increases coupling and test surface area.
- Action items:
  - Extract subservices (odds, strategies, risk) behind `MasterServiceRegistry` and add integration tests.

### 5.183 frontend/src/core/MasterIntegrationHub.tsx

- Purpose: UI-level integration container for admin and diagnostics pages; wires service health to the dashboard.
- Observation: Present — ensure it lazily loads heavy integrations and reports health snapshots to `UnifiedMonitor`.
- Risks: Eager loading of heavy services during admin pages causes unnecessary network activity.
- Action items:
  - Implement lazy loading, wire to `UnifiedMonitor` snapshots, and add UI tests for health representation.

### 5.184 frontend/src/core/FeatureComponent.ts

- Purpose: Small presentational helper used to render feature-driven components.
- Observation: Present but likely simple — add tests verifying feature flag gating and accessibility attributes.
- Risks: Missing a11y attributes and flag gating can create inconsistent UX.
- Action items:
  - Add unit tests for flag gating, add `aria-*` attribute checks, and document usage.

### 5.185 frontend/src/core/core.ts

- Purpose: Central runtime bootstrap for `core` helpers and shared exports used by the frontend.
- Observation: `core.ts` is present; ensure it only aggregates stable, runtime-safe exports (avoid exporting heavy dev-only modules here).
- Risks: Aggregating unstable or dev-only modules into `core.ts` increases bundle surface and can cause runtime import failures.
- Action items:
  - Audit `core.ts` exports, restrict to small, stable facades, and document any heavyweight exports as lazy-load-only.

### 5.186 frontend/src/core/core.d.ts

- Purpose: Type declarations for the `core` runtime surface.
- Observation: Declarations should match the runtime in `core.ts` — verify and regenerate if there is any mismatch after runtime edits.
- Risks: Drift between `.d.ts` and runtime leads to false-positive type checks and run-time breakages.
- Action items:
  - Regenerate or manually sync `core.d.ts` after any runtime change and add a CI gate to detect mismatch patterns.

### 5.187 frontend/src/core/DataSource.ts

- Purpose: Adapter interface for upstream data sources (APIs, WebSockets, local fixtures).
- Observation: Present but ensure adapters follow a consistent async interface and expose health/ping semantics.
- Risks: Inconsistent adapter contracts cause runtime surprises and complicate health checks.
- Action items:
  - Standardize adapter interface, add health/ping, and unit tests for common network failure scenarios.

### 5.188 frontend/src/core/errors.ts

- Purpose: Shared runtime error types and helper constructors used across the frontend.
- Observation: Ensure the exported error shapes align with `UnifiedErrorHandler` and `UnifiedLogger` expectations.
- Risks: Divergent error shapes hinder centralized classification and telemetry mapping.
- Action items:
  - Consolidate canonical error shapes, add factory helpers, and tests asserting serialization and mapping to telemetry events.

### 5.189 frontend/src/core/index.ts

- Purpose: Barrel file that re-exports core surfaces for convenient imports.
- Observation: Keep barrel stable and lightweight — avoid re-exporting experimental or heavy modules.
- Risks: Barrels that re-export many modules can pull in unintended dependencies during bundling.
- Action items:
  - Prune barrel exports to stable facades and add a bundler-size smoke test to detect accidental heavy re-exports.

### 5.190 frontend/src/core/logging/

- Purpose: Directory for logging transports, serializers, and adapters.
- Observation: Logging runtime is present but some transports are no-op; ensure transports are pluggable and well-documented.
- Risks: Hard-coded transports or environment-specific assumptions reduce portability and increase debugging friction.
- Action items:
  - Add transport interface docs, provide default console + noop transports, and integration tests for serialization.

### 5.191 frontend/src/core/metrics/

- Purpose: Directory for metrics registries, exporters, and helpers.
- Observation: Basic in-memory metrics exist — extend with snapshot/export and wire to `UnifiedMonitor` and `UnifiedMetrics`.
- Risks: Metrics that cannot be exported or inspected reduce observability for client-side performance issues.
- Action items:
  - Implement snapshot/export hooks and add tests for counter/timer semantics.

### 5.192 frontend/src/core/models/

- Purpose: Folder for client-side model helpers, registries, and evaluators.
- Observation: Several model-related modules were audited earlier (ModelRegistry, ModelEvaluator, MLService); ensure the folder has a small README describing expected runtime and test contracts.
- Risks: Lack of documentation leads to duplicate implementations and incorrect usages.
- Action items:
  - Add `models/README.md` documenting canonical module responsibilities and add contract tests for adapters.

### 5.193 frontend/src/core/types/

- Purpose: Central file(s) for shared TypeScript types across `core` modules.
- Observation: Types must remain minimal and stable; avoid overloading with environment-specific types.
- Risks: Types that diverge from runtime contracts give false confidence during type-checking.
- Action items:
  - Keep types minimal, regenerate `.d.ts` as needed, and run type-check gates before merging runtime changes.

### 5.194 frontend/src/core/UltimateBrain/

- Purpose: Experimental or advanced orchestration pieces (often heavy and research-focused).
- Observation: Treat as experimental — mark files as dev-only and ensure they are lazy-loaded to avoid inflating production bundles.
- Risks: Bundling research code causes large client payloads and unpredictable performance regressions.
- Action items:
  - Mark the folder with `README.md` stating experimental status, enforce lazy-loading, and exclude from production bundle unless explicitly enabled.

### 5.195 frontend/src/core/websocket/

- Purpose: WebSocket helpers, connection managers, and reconnection logic for real-time updates.
- Observation: Ensure reconnection/backoff and health-check logic exists; provide no-op fallbacks for non-WS environments (e.g., static tests).
- Risks: Unbounded reconnection loops can create noisy logs and CPU spikes in failing networks.
- Action items:
  - Implement jittered exponential backoff, add circuit-breaker for repeated failures, and tests simulating flaky networks.

### 5.196 frontend/src/core/FinalPredictionEngine/

- Purpose: Any final or alternate prediction engine implementations used for experimentation.
- Observation: Treat as canary/experimental; ensure it does not become a silent dependency for consumers expecting a canonical `PredictionEngine`.
- Risks: Multiple prediction engine implementations increase confusion over which is canonical.
- Action items:
  - Document experimental status, provide explicit factory selection mechanics, and add tests ensuring consumers pick the intended engine by default.

### 5.197 frontend/src/core/AnalysisFramework.ts

- Purpose: Provides runtime helpers and orchestration for client-side analytic workflows and test harnesses.
- Observation: Runtime file exists — ensure heavy computations are offloaded or optional and that the framework is only enabled behind feature flags.
- Risks: Performing heavy analysis in the UI thread will degrade responsiveness on low-end devices.
- Action items:
  - Ensure analysis tasks are workerized where possible, add config-driven gating, and include tests for worker vs. main-thread execution.

### 5.198 frontend/src/core/AnalysisFramework.d.ts

- Purpose: Type declarations for the analysis framework.
- Observation: Keep types in sync with runtime; CI should detect divergences.
- Action items:
  - Regenerate declarations when runtime changes and add type-check CI steps.

### 5.199 frontend/src/core/AdvancedAnalysisEngine.ts

- Purpose: Experimental frontend analysis engine (may wrap local models or remote endpoints).
- Observation: Treat as experimental; ensure fallbacks to remote analysis when local capabilities are missing.
- Risks: Large local models increase bundle size and memory usage.
- Action items:
  - Add clear adapter patterns (local vs remote), gating by feature flags, and tests for fallback logic.

### 5.200 frontend/src/core/analytics/

- Purpose: Collection of analytics tracking and reporting utilities used by the UI.
- Observation: Ensure analytics code is lazy-loaded and respects privacy toggles (e.g., telemetry opt-out).
- Risks: Unprotected analytics calls may leak PII or create excessive network chatter.
- Action items:
  - Add privacy toggles, lazy-load analytics bundles, and tests that verify opt-out behavior.

### 5.201 frontend/src/core/DataIntegrationHub.ts

- Purpose: Central orchestration point for data inputs; see earlier DataIntegration notes.
- Observation: Both `.d.ts` and `.ts` exist — ensure runtime delegates to `EnhancedDataManager` for caching and dedup.
- Action items:
  - Validate dedup behavior and add integration tests simulating concurrent consumers.

### 5.202 frontend/src/core/DataPipeline.ts

- Purpose: Declarative pipeline helpers (see earlier DataPipeline notes).
- Observation: Both declaration and runtime present — add step-level isolation and retry semantics.
- Action items:
  - Add tests for idempotent step retries and failure isolation.

### 5.203 frontend/src/core/DataSource.ts

- Purpose: Base adapter contract for upstream data sources.
- Observation: Ensure implementations expose `connect()`, `disconnect()`, `fetch()` and `health()` hooks.
- Action items:
  - Standardize interface and add test adapters (mock HTTP, mock WS) used in unit/integration tests.

### 5.204 frontend/src/core/errors.d.ts

- Purpose: Type declarations for shared error shapes.
- Action items:
  - Ensure declarations align with `errors.ts` runtime shapes and with `UnifiedErrorHandler` mapping.

### 5.205 frontend/src/core/errors.ts

- Purpose: Runtime shared errors — implement helpful constructors and serialization helpers.
- Action items:
  - Add factory helpers, serialize/deserialize functions, and tests for mapping to telemetry.

### 5.206 frontend/src/core/error/

- Purpose: Subfolder for specialized error helpers and domain-specific error types.
- Action items:
  - Audit files for duplication with `errors.ts`, consolidate where possible, and document usage.

### 5.207 frontend/src/core/Analyzer.ts

- Purpose: Light-weight analysis helpers already previously referenced — ensure dev-only classification and lazy-loading.
- Action items:
  - Mark as dev-only where applicable and add tests for core helper correctness.

### 5.208 frontend/src/core/Analyzer.d.ts

- Purpose: Declaration file for `Analyzer` helpers — keep synchronized with runtime implementation.

## 6. Data & ML Assets

- **Model stores:**
  - `mlruns/` (MLflow run history), `mlflow.db` (tracking DB), `model_performance.db` (metrics), `phase*_performance_report.*` outputs.
  - `backend/models/` contains schema modules plus `win_probability_model.pkl` (serialized model) and various domain models; evaluate whether pickle should remain in repo.
- **Training datasets:** Historical SQLite snapshots (`real_training_data.db`, `a1betting.db*`, `prizepicks_data.db`, `users.db`, etc.) have been deleted from version control; regenerate locally under `data/` if needed.
  - ✅ Initial purge completed for backend/frontend DB artefacts and log-based mlflow.db; ensure developers recreate local fixtures via documented scripts when required.
  - ➡️ Relocate necessary fixtures into a protected storage bucket or dev-only `data/` directory documented in `SECURITY_ACTIONS.md`.
  - ✅ Authored `data/README.md` to define local-only storage practices; coordinate migrating backend/frontend snapshots and MLflow runs there.
- **Generated dumps:** `mlb_odds_raw_dump.json`, `prizepicks_props.csv`, `pf_raw.json`, `propfinder_sample.json`, `mlb_odds_sample.json`.
- **Scripts & pipelines:**
  - Backend: `comprehensive_prop_generator.py`, `etl_mlb.py`, `statcast_*`, `retrain_win_probability_model.py`, `phase2_performance_benchmark.py`, `phase3_performance_benchmark.py`.
  - Frontend: `mlb_odds_sample.json` for tests, `ML_ENSEMBLE_README.md` documentation.
- **Verification artefacts:** numerous JSON/CSV reports under root (`phase*_verification_*.json`, `phase3_performance_report.*`, `performance_optimization_implementation_complete.json`). These are historical outputs—archive if not needed.
- **Scripts:** `deploy_etl_production.sh`, `deploy_phase1_optimization.sh`, `deploy_phase1_optimization.sh`, `start-dev.ps1`, `start.bat`, numerous PowerShell helpers.
- Some scripts hardcode Windows paths (PowerShell) while others assume bash; create a supported matrix and delete one-off automation leftovers.
- **Ops configs:** `ops/` (currently baseline metric snapshots), `config/` for application settings.
- **Monitoring tooling:** `monitor_backend.py`, `performance_validation_system.py`, `observability_smoke_test.py`, `slo_monitoring_system.py`.
- **CI aides:** `.github/` instructions, `create-issues.ps1`, `ci_contract_scanner.py`, `ci_statistical_results.json`.

_Action:_ nominate a single deployment story (compose vs Helm), delete or archive unmaintained alternatives, and refresh manifests with consistent env toggles and secrets handling. Capture the decision in `PRODUCTION_DEPLOYMENT_GUIDE.md` so future agents know which files control reality.

## 7. Infrastructure & Deployment

- **Containers:** `Dockerfile`, `Dockerfile.frontend.optimized`, `frontend/Dockerfile*`, `docker-compose*.yml` (dev/test/optimized). Need to confirm which compose file is canonical.
- `docker-compose.dev.yml` spins up FastAPI + Vite with Redis/Postgres placeholders; `docker-compose.test.yml` adds mocked services for CI; `docker-compose.optimized.yml` targets production-ish tuning. All share overlapping service names—document a primary one (likely `docker-compose.dev.yml`) and archive alternates after verifying parity.
- **Helm/K8s:** `helm/` charts, `k8s/` manifests, `windsurf_deployment.yaml`. Appears partially automated; validate freshness.
- Helm chart values reference deprecated image tags and environment variables; ensure registry paths exist and keep only actively deployed chart(s).
- **Infrastructure manifests:** `infrastructure/` divided into `backup/`, `database/`, `ingress/`, `monitoring/`, `production/app-deployment.yaml`, `secrets/`, `security/`. Review for environment parity and secret management.
- `production/app-deployment.yaml` provisions namespace-scoped backend/frontend deployments with OTEL, HPA, and network policies, but references Docker images `a1betting/backend:latest` & `a1betting/frontend:latest` without build pipeline provenance and creates a service `a1betting-backend-service` while the ingress manifest targets `a1betting-backend`, implying a naming mismatch that would break routing.
- `ingress/ingress-controller.yaml` installs a bespoke NGINX controller with extensive annotations (rate limiting, CSP, cert-manager issuers) yet hardcodes AWS load-balancer annotations and rewrites `/api/(.*)` to a service named `a1betting-backend` (nonexistent per current Service objects). Need to reconcile service names and confirm desired cloud provider.
- `monitoring/observability-stack.yaml` deploys Prometheus, Grafana, Jaeger, Alertmanager integration, and exporters; storage classes (`fast-ssd`) and credentials (`grafana-credentials`) must be provided by ops. Validates ambition but requires parameterization/Helm to avoid hand-maintained YAML drift.
- Several manifests duplicate docker-compose env values but diverge (e.g., `production/app-deployment.yaml` sets different feature flags). Align configurations or centralize via Helm.
- **Scripts:** `deploy_etl_production.sh`, `deploy_phase1_optimization.sh`, `deploy_phase1_optimization.sh`, `start-dev.ps1`, `start.bat`, numerous PowerShell helpers.
- Some scripts hardcode Windows paths (PowerShell) while others assume bash; create a supported matrix and delete one-off automation leftovers.
- **Ops configs:** `ops/` (currently baseline metric snapshots), `config/` for application settings.
- **Monitoring tooling:** `monitor_backend.py`, `performance_validation_system.py`, `observability_smoke_test.py`, `slo_monitoring_system.py`.
- **CI aides:** `.github/` instructions, `create-issues.ps1`, `ci_contract_scanner.py`, `ci_statistical_results.json`.

_Action:_ nominate a single deployment story (compose vs Helm), delete or archive unmaintained alternatives, and refresh manifests with consistent env toggles and secrets handling. Capture the decision in `PRODUCTION_DEPLOYMENT_GUIDE.md` so future agents know which files control reality.

## 8. Automation & Scripts

- **Scripts hub:** `scripts/` includes recon, smoke, endpoint tests, ingestion triggers, scraping utilities, and debugging aids. Many were generated for automation phases—audit usage before keeping.
- Key clusters:
  - `recon/` & `smoke/` utilities for PropFinder monitoring.
  - Deployment helpers (`deploy_*`, `sync_*`), many with stale env assumptions.
  - Data maintenance (`normalize_*`, `phase*_verification.py`).
  - Newly added `generate_service_dependency_report.py` outputs `reports/service_dependency_report.json` to map backend service imports—treat this as the source of truth while pruning legacy analysis scripts.
  - Added `scripts/security/generate_sensitive_blob_list.py` to produce a gitignored report of sensitive blobs prior to running filter-repo; this supports the security tasks in Section 16.
  - Added `scripts/security/audit_logs_for_secrets.py` to scan gitignored log folders for leaked tokens; latest run (2025-09-26) produced `reports/security/log_redaction_report.json` with zero findings, fulfilling the log redaction verification task.
- `scripts/README.md` now includes a guardrail table that classifies diagnostic vs side-effecting scripts and highlights autonomous helpers slated for archival. Ensure it stays in sync as tooling evolves.
- **Automation frameworks:** backend `autonomous_*` modules, `agent_planner.py`, `autonomous_project_development_handler.py`, `self_modifying_engine.py`.
- **Task runners:** `dev-manager.sh`, `devops_api_monitoring_template.md`, `start_dev_uvicorn.ps1`, `start_python_backend.sh`.
- **Automation pipeline directory:** `automation/` (model deployment, ETL, feature engineering scripts + shell wrappers). Determine if superseded by unified services; remove unused pipeline orchestration.
- **Instrumentation:** `audit-virtualization.*`, `auto_*` tests, `detect-model-metrics-violations.js`.
- **Recommendation:** centralize supported scripts in a curated README (keep minimal set); archive the rest.

## 9. Tests & Quality Gates

- **Backend pytest suites:** `tests/`, `test/`, `testing/` (duplicative). Focused suites include `tests/backend/routes/test_enhanced_ml_compat.py` (invalid sport case), CLV tests, EV integration, websocket suites. Root `pytest.ini` config.
- **Frontend tests:** Jest unit tests under `frontend/__tests__/`, `frontend/tests/`, `frontend/test/` plus Playwright e2e (`frontend/e2e/`). Type-check via `npm run type-check` and lint via ESLint configs.
- **Smoke & validation scripts:** `smoke_test_core.py`, `smoke_test_suite.py`, `smoke.py`, `validate_*` scripts, `phase*_verification.py` for milestone gates.
- **Coverage artefacts:** `coverage/`, `frontend/coverage/`, `htmlcov/`, `type-check-output.txt`, `tsc_frontend_output.txt` committed—should be regenerated on demand.
- **CI tasks:** workspace tasks defined (backend server, frontend dev, tests). Need to ensure minimal reproducible command set documented for future agents.
- **Latest validation (2025-09-26):** `python -m pytest tests/backend/routes -q` currently **fails (20 failures)**. Highlights:
  - `/api/propfinder/*` requests are intercepted by the legacy forwarding middleware and return HTTP 405, breaking 19 PropFinder contract assertions (EV fields, line-movement, force-flat-baseline, and route-presence suites).
  - `backend/routes/consolidated_admin.py` fails to import due to a `parameter without a default follows parameter with a default` syntax error, suppressing the consolidated admin router.
  - Risk personalization wiring dereferences `None` while mounting (`alert_evaluation_interval_seconds`), leaving those routes offline.
  - `tests/backend/routes/test_odds_history_route_db_enabled.py::test_odds_history_uses_db_when_enabled` now fails (expected mocked DB access count 2 vs actual 1), indicating regression in odds history feature flag path.
  - `python -m pytest tests/test_clv_metrics_service.py -q` (2025-09-27) **passes**, confirming the CLV metrics service remains stable during the audit window.
    Frontend `npm run type-check` / `npm run test` were **not re-run** during this pass; schedule once backend regressions are fixed so quality gates regain signal.

## 10. Documentation & Instructions

- **Central docs:** Root-level markdowns for each phase (`PHASE*_`, `IMPLEMENTATION_COMPLETE.md`, `SUMMARY.md`) plus `README.md`, `README.modern.md`. Many are historical and partially redundant.
- **Instructions for AI agents:** `.github/copilot-instructions.md` (very long), `copilot-instructions.md` at root, `AI_PERSONA.md`, `AUTONOMOUS_EXECUTION_SUMMARY.md`, `COPILOT_HANDOFF_SUMMARY.md`—need consolidation into a concise playbook.
- **Domain docs:** `docs/` contains structured subfolders (API, architecture, security, observability, migration). Additional specialized guides across repo (e.g., `ADMIN_MODE_FEATURES.md`, `PRODUCTION_DEPLOYMENT_GUIDE.md`). Adjacent directories include `analysis/`, `reports/`, `synthetic-reports/`, `Roadmaps/`, and `prompts/` (LLM prompt inventories).
- `docs/` alone spans 20+ top-level files and 12 subdirectories (e.g., `security/`, `architecture/adr`, `observability/`, `ml/`, `issues/`), each mixing high-level references (roadmaps, RFCs) with runbooks (`backfill_runbook.md`, `clv_metrics_runbook.md`) and status logs (`WEBSOCKET_MIGRATION_STATUS.md`). Many are stale or duplicate (`FEATURE_MATRIX.md` appears both in root and under `docs/`).
- Security subfolder contains the active runbooks authored this audit (`secret_scanning_plan.md`, `git_history_sanitization.md`, `log_redaction_policy.md`) alongside legacy “PHASE1_STEP6_COMPLETE.md`; architecture subfolder hosts ADRs plus ad hoc notes (`architecture_notes.md`, `middleware_decisions.md`), and observability adds further stack guides—reinforces the need for a curated index.
- Developer onboarding spreads across `docs/dev/`, `docs/developer/`, `docs/pr/`, and multiple root-level summaries; none are clearly marked canonical, which confuses newcomers and AI agents alike.
- Added `docs/README.md` as a living index of canonical references, active runbooks, and open actions; keep it updated as consolidation work lands.
- **Roadmaps & reports:** `A1BETTING*_IMPLEMENTATION_*.md`, `ROADMAP.md`, `roadmap-v2.md`, `ARCHITECTURAL_ROADMAP_2025.md`, `PROJECT_STATUS.md`.
- **Testing references:** `TESTING_CICD_IMPLEMENTATION_COMPLETE.md`, `PHASE4_*_TESTING_COMPLETE.md`, `TEST_AUDIT.md`.

_Action:_ curate a single authoritative README (backend & frontend) + contributor guide; move historical summaries to `/docs/archive/` to reduce noise.

## 11. Security & Secret Exposure

- **Committed cookies:** `backend/prizepicks_cookies.json` stores live session cookies (Cloudflare tokens, CSRF, rl_session) with expiry dates well into the future. These enable authenticated requests and constitute sensitive credentials—remove immediately and rotate affected PrizePicks account tokens.
  - ✅ File removed from repo tip (2025-09-25) and locked behind `.gitignore` plus the `block-sensitive-artifacts` hook; follow up on credential rotation in `SECURITY_ACTIONS.md`.
  - 🔄 Run history scrub (`git filter-repo`) once credential rotation plan is confirmed.
- **Historical exposure:** Git history contains multiple commits (e.g., `8992545c9a0b31d4836cac1d3378f6e3f01ab7ac`, `c8823b4bb0bea8344f9671f010b1aed937df9513`, `cdbf31f4d6c9584b390bf2e27c0685b994cc10a6`) with `prizepicks_cookies.json`, SQLite snapshots (`prizepicks_data.db`, `real_training_data.db`, `users.db`, `frontend/users.db`), and bulk test reports. Credential rotation and a history rewrite are required to eliminate residual access.
- **Databases with PII:** root and backend house numerous SQLite files (`users.db`, `user_auth.db`, `chat_history.db`, betting histories). Until contents are verified and scrubbed, treat them as sensitive; relocate to a secure storage bucket and add to `.gitignore`.
- **Environment templates:** check `backend/.env.example`, `config/*.json`, and `ops/` for embedded keys. Spot-check indicates placeholder values, but automated scripts sometimes copy real envs—confirm before sharing repo.
- **Logging footprint:** `logs/` and `recursive_intelligence.log` capture request payloads, possibly containing auth headers or user metadata. Implement log redaction and purge committed history.
- **Action:** Create a `SECURITY_ACTIONS.md` checklist (cookie removal, DB relocation, token rotation, log redaction policy) and run `git filter-repo` if secrets ever existed historically.
  - 📄 Secret scanning rollout captured in `docs/security/secret_scanning_plan.md`; complete GitHub push protection + TruffleHog integration before closing the checklist item.
  - ✅ Added `.github/workflows/secret-scan.yml` to run daily TruffleHog filesystem scans with artifact uploads; pending steps include enabling GitHub push protection and routing alerts to the security distribution list.
  - ✅ Introduced `scripts/security/generate_sensitive_blob_list.py` so security can snapshot matching blobs/commits before executing the history rewrite runbook; latest run (2025-09-26) produced 125 matches stored under `reports/security/sensitive_blobs.json`.
  - ✅ Introduced `scripts/security/audit_logs_for_secrets.py` to automate log redaction verification; first run (2025-09-26) generated `reports/security/log_redaction_report.json` with no findings and updated `docs/security/log_redaction_policy.md` checklist.
  - 📄 `docs/security/git_history_sanitization.md` documents the credential rotation + `git filter-repo` plan for scrubbing exposed cookies and databases from history.
  - 📄 `docs/security/log_redaction_policy.md` outlines required masking rules, storage guidelines, and verification cadence for logs.

## 12. Artifacts & Bloat Inventory

- **Heavy directories:** `node_modules/`, `dist/`, `coverage/`, `frontend/coverage/`, `.pytest_cache/`, `.mypy_cache/`, `htmlcov/`, `mlruns/` (large).
- **Logs & reports:** `logs/`, `performance_metrics.log`, `smoke_test_*.log`, `recursive_intelligence.log`, `operational_risk_validation.log`, JSON reports (phase benchmarks, verification outputs).
  - ✅ Root-level `logs/` directory and legacy log files (`performance_metrics.log`, `smoke_test_20250815_221207.log`, `recursive_intelligence.log`, `operational_risk_validation.log`, `logs/app.log.5`, `backend_server.log`) removed; `.gitignore` updated to include `logs/` and `*.jsonl`.
- **Caches & build artefacts:** `.coverage`, `.mypy_cache/`, `.pytest_cache/`, `.jest-cache/`, `htmlcov/`, `dist/`, `mlruns/`.
  - ✅ Removed cached coverage/build directories and MLflow runs from version control; rely on local generation under gitignored paths (`data/`, `mlruns/`).
- **New audit artefacts:** `reports/service_dependency_report.json` generated by `scripts/generate_service_dependency_report.py`; output now gitignored alongside `mlruns/` so the script and MLflow runs do not pollute commits.
- **Databases & binaries:** multiple `*.db` files across root/backend/frontend, `chat_history.db`, `users.db`, `mlflow.db`.
- **Snapshots:** `openapi_snapshots/`, `test_snapshots/`, `backend/openapi/*.json`, `frontend/unified-*.json`.
- **Duplicated converters/scripts:** `convert_*` python scripts, `improved_contract_scanner.py` vs `contract_converter.py`, etc.—validate necessity.
- **Old instructions:** `Improving A1Betting App...` folder, `Refactoring and Unifying...` folder, numerous `*_SUMMARY.md` from past automation passes.
- **Misc leftovers:** version marker files at root (`=0.17.2`, `=2.2.7`), stray workspace artifacts (`A1Betting7-13-2_digest.txt`, `frontend/A1Betting-master-27-25-main-main.code-workspace`).

_Action:_ compile deletion/archival plan (artifacts to remove vs move to storage); update `.gitignore` to prevent regeneration.

## 13. Guardrails & Future Workflow

- **Branch protection:** Require PR reviews; disallow direct pushes by automation. Enforce CI (pytest + frontend tests) before merge.
- **Approved command set:** Document minimal run commands (backend `python -m uvicorn backend.core.app:create_app`, `pytest`, frontend `npm run type-check`, `npm run test`). Ban unsupervised automation scripts.
- **AI agent policy:** Provide trimmed instructions summarizing directory discipline, cleanup workflow, testing requirements, and forbidden operations (no DB commits, no log uploads, no generating new “enhanced\_\*” clones).
- **Dependency management:** Standardize on `requirements.txt` + `requirements-dev.txt` and single `package.json`. Remove variant manifests.
- **Asset handling:** Mandate storing datasets/DBs/logs outside repo (e.g., `/data/local/`). Add pre-commit hook to block large binary commits.
- **Documentation hygiene:** Maintain `PROJECT_GLOBAL_AUDIT.md` and a short `docs/AI_USAGE.md` to orient future copilots.
- **Cleanup cadence:** Schedule quarterly artifact cleanup (coverage, logs, verification outputs) to keep repo lean.

## 14. Immediate Next Steps

1. **Stabilize instructions:** Extract concise AI playbook (branch rules, command matrix, cleanup checklist) and archive legacy automation docs.
2. **Remove generated artefacts:** Delete committed logs/coverage/db snapshots; update `.gitignore` accordingly.
3. **Consolidate entry points:** Decide on canonical backend startup (`backend/core/app.py`) and remove/mark others as deprecated.
4. **Rationalize services:** Inventory `backend/services/` to identify unused `enhanced_*`/`optimized_*` modules; plan staged deprecation in favor of unified services (start with the 199 modules that have zero internal dependencies per the latest report).
5. **Frontend cleanup:** ✅ Nested `frontend/frontend/` project, `legacy/` hook shim, and Electron build output removed. Documentation now captures MasterServiceRegistry, EnhancedDataManager, PropFinder hooks, and dashboard responsibilities; next step is to codify the cleanup plan in `docs/frontend/CONSOLIDATION_PLAN.md` before pruning remaining duplicates.
6. **Data governance:** Relocate SQLite/JSON datasets to secure storage; scrub secrets (`prizepicks_cookies.json`). Storage policy now documented in `data/README.md` and the new “Secure local storage & secrets” section of `README.md`—migrate backend/frontend snapshots accordingly.
7. **Testing baseline:** Address the 20 failures surfaced by `python -m pytest tests/backend/routes -q` (PropFinder 405 responses, `consolidated_admin.py` syntax error, risk personalization import gap, odds history DB regression), then rerun the backend suite followed by `npm run type-check` / `npm run test -- --watchAll=false`; record pass/fail once stabilized.

## 15. Review Progress Tracker

| Area                                       | Audit coverage | Remediation | Notes                                                                                                                |
| ------------------------------------------ | -------------- | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| Root inventory                             | ✅             | 🔄          | Coverage complete; prune tracked artefacts per Section 12.                                                           |
| Backend (entry points, services, routes)   | ✅             | 🔄          | Wiring documented; dependency report shows 324 service modules—prioritize consolidating redundant prefixes next.     |
| Frontend (structure, components, services) | ✅             | 🔄          | Legacy folders cataloged; prepare removal plan aligned with MasterServiceRegistry.                                   |
| Automation scripts                         | ✅             | 🔄          | Script taxonomy captured; curate supported list and retire autonomous tooling.                                       |
| Data/ML assets                             | ✅             | 🔄          | Assets inventoried; root SQLite + cookie artefacts removed—formalize storage policy and relocate remaining datasets. |
| Infrastructure                             | ✅             | 🔄          | Compose/Helm landscape mapped; choose canonical deployment path and refresh manifests.                               |
| Documentation corpus                       | ✅             | 🔄          | Corpus cataloged; consolidate into focused contributor + AI guide.                                                   |
| Tests & CI workflows                       | ✅             | 🔄          | Command matrix identified; rerun baseline suites and record status.                                                  |
| Security/secrets review                    | ✅             | 🔄          | Exposure logged and initial files purged; execute rotation checklist in `SECURITY_ACTIONS.md`.                       |
| Cleanup plan execution                     | ✅             | 🔄          | Initial log purge complete; continue deleting/generated artefacts and archiving reports.                             |

## 16. Gap Analysis (Coverage → Completion)

| Track                 | Why coverage ≠ completion                                                                                                                                                                                                  | Blocking tasks                                                                                                                                                               | Owner         | Target   |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------- |
| Security              | Credentials & logs removed from tip but history still leaks secrets; push protection disabled                                                                                                                              | Rotate PrizePicks creds → mark in `SECURITY_ACTIONS.md`; run `git filter-repo`; enable GitHub push protection & TruffleHog alert routing; execute log redaction verification | Security lead | Oct 2025 |
| Backend services      | Dependency census done but 199 zero-dependency modules still active; multiple entry points cause drift                                                                                                                     | Produce triage list from `reports/service_dependency_report.json`; move unused modules to `services/legacy/`; mark `core/app.py:create_app` as canonical in docs + scripts   | Backend lead  | Nov 2025 |
| Automation governance | Autonomous agents & legacy scripts remain executable                                                                                                                                                                       | Publish `scripts/README.md` allowlist; quarantine/deprecate autonomous tooling; archive retired pipelines                                                                    | Platform/Ops  | Oct 2025 |
| Data/ML assets        | Local-only policy documented yet datasets/MLflow DB still within repo history                                                                                                                                              | Relocate remaining datasets/MLflow runs to secure storage; update `data/README.md`; confirm `.gitignore` enforcement; scrub history                                          | Data/ML owner | Nov 2025 |
| Infrastructure        | Multiple Compose/Helm stories; no canonical deployment                                                                                                                                                                     | RFC to choose primary deployment path; archive alternates; refresh `PRODUCTION_DEPLOYMENT_GUIDE.md`                                                                          | DevOps        | Nov 2025 |
| Quality gates         | Backend route suite currently failing (20 regressions: PropFinder 405s via legacy middleware, `consolidated_admin.py` syntax error, risk personalization import, odds history DB assertion); frontend checks pending rerun | Fix backend regressions, then run `python -m pytest tests/backend/routes -q`, `npm run type-check`, `npm run test -- --watchAll=false`; log PASS/FAIL                        | QA            | Oct 2025 |
| Documentation         | Inventory complete but onboarding still fragmented                                                                                                                                                                         | Draft authoritative `README`, `CONTRIBUTING`, `AI_PLAYBOOK`; archive legacy reports                                                                                          | Docs team     | Nov 2025 |
| Automation tooling    | Scripts catalogued but lack allowlist/guardrails                                                                                                                                                                           | Publish `scripts/README.md` allowlist, tag side-effecting utilities, and quarantine autonomous executables pending archival                                                  | Platform/Ops  | Oct 2025 |

### Immediate focus (next sprint)

1. Execute security tranche (credential rotation + history scrub + push protection) and update both this document and `SECURITY_ACTIONS.md` with completion evidence.
2. Generate backend service triage list from dependency report, move first batch of unused `enhanced_*` modules into `services/legacy/`, and flag deprecated entry points.
3. Prepare `scripts/README.md` with approved run commands and quarantine autonomous agent executables pending review.

### 5.209 frontend/src/core/FeatureToggleProvider.ts

- Purpose: Lightweight runtime provider that centralizes feature flag lookups and feature-scoped fallbacks for components.
- Observation: File missing in runtime surface; `FeatureFlags` helpers were added earlier but a dedicated provider pattern is absent.
- Risks: Ad-hoc flag checks spread across codebase increase divergence and make rollouts error-prone.
- Action items:
  - Add `FeatureToggleProvider` that reads `import.meta.env` and an in-memory overrides map; provide React context + hook `useFeatureToggle(name)` for consumer ergonomics.
  - Add unit tests verifying env override precedence and runtime override API.

### 5.210 frontend/src/core/ClientHealthProbe.ts

- Purpose: Small client-side health probe that aggregates `UnifiedMonitor` snapshots, WS connectivity, and key service ready signals.
- Observation: No single probe exists; health information is scattered and duplicated in admin pages.
- Risks: Lack of a single probe complicates health UI and makes automated smoke-tests brittle.
- Action items:
  - Implement `ClientHealthProbe.getSnapshot()` that composes health from `UnifiedMonitor`, `UnifiedCache`, and `UnifiedPredictionService` readiness booleans.
  - Expose a simple `/health` JSON endpoint for local dev harnesses and add a smoke-test that asserts healthy state in CI when backend is reachable.

### 5.257 frontend/src/core/LightweightWorkerPool.ts

- Purpose: Small worker pool abstraction to run CPU-bound tasks off the main thread.
- Observation: Several modules (feature composer, virtualized rendering computations) reimplement worker logic; a unified lightweight pool would reduce duplication.
- Risks: Inconsistent worker lifecycles and memory leaks across modules; lack of a central pool prevents reuse and instrumentation.
- Action: Implement `LightweightWorkerPool` with sized concurrency, TTL for idle workers, and basic metrics hooks. Provide a polyfill for environments without WebWorker support.

### 5.258 frontend/src/core/ClientHealthProbe/smoke.test.ts

- Purpose: Smoke test ensuring `ClientHealthProbe.getSnapshot()` returns expected keys and health booleans.
- Observation: No existing smoke test consolidates client health expectations.
- Action: Add Jest-based smoke test that fakes `UnifiedMonitor` and `UnifiedCache` readiness flags and asserts snapshot shape.

### 5.259 frontend/src/core/LegacyForwardingMiddlewareGuard.ts

- Purpose: Helper used by the app to detect and disable legacy forwarding in dev/test when it interferes with current routers.
- Observation: Legacy forwarding middleware currently intercepts PropFinder requests causing test regressions; a guard would make disabling straightforward.
- Risks: Silent interception breaks contract tests and hides missing route wiring.
- Action: Implement a guard that can be toggled by env or feature flag to bypass legacy forwarding during tests and CI.

### 5.260 frontend/src/core/CacheManagerAdapter.ts

- Purpose: Adapter that maps `UnifiedCache` calls to either `EnhancedDataManager` or localStorage/Memory based on environment.
- Observation: Many callers expect different cache shapes; adapter standardizes calls and metrics tagging.
- Action: Provide adapter with explicit TTL semantics and `usePipeline` flag for bulk ops.

### 5.261 frontend/src/core/experimental/LocalModelShim.ts

- Purpose: Lightweight shim for experimenting with small local inference models in the browser (e.g., tiny decision trees for feature flags).
- Observation: Experimental local inference code exists but lacks a safe shim for dev toggles.
- Risks: Shipping experimental code by accident increases bundle size and leaks research artifacts.
- Action: Place under `experimental/` with feature flag gating and add CI check to prevent accidental inclusion in production builds.

### 5.262 frontend/src/core/FeatureFlagOverrides.test.ts

- Purpose: Unit tests verifying runtime flag override precedence (env > remote > local override > default).
- Observation: No systematic test exists to assert precedence across consumers.
- Action: Add tests that assert hook `useFeatureToggle` returns expected values under various override combinations.

### 5.263 frontend/src/core/Monitoring/console_forwarder.ts

- Purpose: Optional helper to forward structured logs to `UnifiedMonitor` during local dev for unified visibility.
- Observation: Developers scatter console logs; a console-forwarder can centralize capture and format.
- Action: Implement `installConsoleForwarder()` which can be toggled by `DEV_CONSOLE_FORWARD` env and attaches to window.console.

### 5.264 frontend/src/core/BackfillManager.md

- Purpose: Document the admin backfill endpoints and local testing workflow (referencing `backend/ingestion/backfill_manager.py`).
- Observation: Admin backfill endpoints exist but developer workflow is not documented in frontend dev docs.
- Action: Draft `BackfillManager.md` describing routes, job polling strategy, and mock data harness for local testing.

### 5.265 frontend/src/core/ClientUtils/safeParseJSON.ts

- Purpose: Utility to safely parse JSON with canonical fallback and logging.
- Observation: Multiple ad-hoc JSON.parse wrappers exist across the codebase.
- Action: Add `safeParseJSON(str, fallback)` that returns fallback and logs to `UnifiedLogger` on parse errors.

### 5.266 frontend/src/core/TelemetryGate/audit.test.ts

- Purpose: Integration test that ensures telemetry is gated when consent is false.
- Observation: Telemetry gating is spec'd but not covered by tests.
- Action: Add test that toggles `TelemetryGate` off and asserts `fetch`/network mocks receive no telemetry payloads.

### 5.267 frontend/src/core/FeatureComposition/benchmarks/merge_perf.bench.ts

- Purpose: Micro-benchmark measuring `mergeAlternativeProps` performance on large arrays; helps decide when to offload to workers.
- Observation: Feature merges can be expensive on large datasets; benchmark informs thresholds for workerization.
- Action: Add Node-based benchmark and record thresholds in `FeatureComposition/README.md`.

### 5.268 frontend/src/core/README.updates.md

- Purpose: Patch notes for the `frontend/src/core/README.md` documenting recent shim changes and recommended migration steps for contributors.
- Action: Keep as a short changelog with links to smoke tests and migration guidance.

### 5.211 frontend/src/core/LightweightWorkerPool.ts

- Purpose: Utility to offload CPU-heavy tasks (feature engineering, explainability) to web workers with limited concurrency.
- Observation: Analysis helpers hint at worker usage but no small general-purpose pool exists to coordinate workers safely.
- Risks: Ad-hoc worker management leads to leaking workers and inconsistent throttling across features.
- Action items:
  - Implement a small worker pool with queueing and task timeouts; provide a `runTask(taskModulePath, payload)` API and tests for concurrency/timeout semantics.

### 5.212 frontend/src/core/FeatureFlagOverrides.test.ts

- Purpose: Test scaffold to validate runtime feature flag override behaviors across environments.
- Observation: Tests around `FeatureFlags` are missing; earlier action items requested integration tests for toggling env variables.
- Risks: Deploy-time misconfigurations (Vite env vs runtime overrides) will go undetected without tests.
- Action items:
  - Add unit tests that simulate `import.meta.env` values and runtime override calls; ensure `withFeature` executes decorated functions only when enabled.

### 5.213 frontend/src/core/CacheManager/README.md

- Purpose: Documentation for the canonical `CacheManager` implementation chosen for `UnifiedCache` re-export.
- Observation: Multiple CacheManager implementations exist; a short README is missing to clarify the canonical choice and usage patterns.
- Risks: Lack of documentation leads to accidental imports of non-authoritative cache implementations.
- Action items:
  - Create `README.md` describing TTL behaviour, recommended API (get/set/invalidate/bulkSet), eviction policy, and integration examples with `EnhancedDataManager`.

### 5.214 frontend/src/core/UnifiedCache.smoke.test.ts

- Purpose: Smoke tests to assert that `UnifiedCache` facade delegates correctly to the chosen `CacheManager` and preserves semantics.
- Observation: No quick smoke tests exist that validate re-export identity and basic get/set behaviour.
- Risks: Re-export mismatches can silently bypass cache leading to excessive network calls in production.
- Action items:
  - Add smoke tests that import `UnifiedCache` and the canonical `CacheManager`, assert identity, and exercise TTL/invalidate paths.

### 5.215 frontend/src/core/DevOnly/mocks/MLServiceMock.ts

- Purpose: Deterministic mock adapter for ML service used in unit and integration tests.
- Observation: Tests expect predictable ML responses but no centralized mock adapter exists; several tests create ephemeral mocks inline.
- Risks: Duplicate inline mocks increase test maintenance cost and create inconsistent expectations across suites.
- Action items:
  - Implement `MLServiceMock` that supports predictable `predict()` results, latency simulation, and configurable failure modes; wire tests to use this mock via `MasterServiceRegistry` in test setup.

### 5.216 frontend/src/core/UnifiedLogger.smoke.test.ts

- Purpose: Validate `UnifiedLogger` re-export and that transports serialize structured logs consistently.
- Observation: Logger transports are partially implemented; a targeted smoke test will help detect regressions early.
- Risks: Logger regressions can cause noisy console output and hide structured telemetry errors.
- Action items:
  - Add smoke tests that swap logger transports to a test sink and assert message shapes, metadata, and performance counters.

### 5.217 frontend/src/core/GuardedImport.ts

- Purpose: Small helper that wraps dynamic imports with a guarded fallback and optional telemetry logging.
- Observation: The codebase defensively imports many optional modules with try/catch; a small helper would standardize this pattern.
- Risks: Inconsistent import guards lead to duplicated code and varied fallback shapes.
- Action items:
  - Implement `guardedImport(path, fallbackFactory, logger?)` that returns a safe value and logs import failures; replace a few high-traffic try/catch instances with this helper.

### 5.218 frontend/src/core/Experimentation/README.md

- Purpose: Document the experimentation patterns (feature flagging, telemetry, safe rollouts) used by the frontend.
- Observation: Experimentation guidance is scattered across many docs; a focused README under `Experimentation/` will help feature owners.
- Risks: Inconsistent experiment setup leads to misconfigured rollouts and data loss for A/B analysis.
- Action items:
  - Create a short guide covering `isFeatureEnabled`, `withFeature`, rollout percentages (client-side), and telemetry events to record for experiments.

### 5.219 frontend/src/core/UnifiedMonitor.smoke.test.ts

- Purpose: Small smoke test to assert `UnifiedMonitor.getHealthSnapshot()` returns expected shape and integrates with `metrics` and `logging` facades.
- Observation: `UnifiedMonitor` exists but lacks a compact smoke test to detect integration drift.
- Risks: Silent integration regressions between monitor, metrics, and logger reduce observability.
- Action items:
  - Add smoke test that simulates a failing metric and asserts monitor snapshot includes `degraded` status and corresponding log entry.

### 5.220 frontend/src/core/FeatureFlags.e2e.test.ts

- Purpose: End-to-end test that toggles a feature flag and verifies the full UI path (flag gating, network calls, telemetry) behaves as expected.
- Observation: Unit tests are necessary but E2E coverage for flags is missing; this helps catch bundling/build-time vs runtime flag mismatches.
- Risks: Flags that compile-time replace code vs runtime toggles can cause inconsistent behavior between builds.
- Action items:
  - Add an E2E test using Playwright that toggles a runtime override and verifies UI change and telemetry event emitted; keep test optional in CI to reduce flakiness.

### 5.269 frontend/src/core/CI/smoke_pipeline.md

- Purpose: Document the minimal CI smoke pipeline that must pass before core infra shims are merged (smoke tests, lint, type-check, selected backend route tests).
- Observation: PRs touching `frontend/src/core` often bypass infra smoke tests; a minimal pipeline reduces regressions.
- Action: Draft `CI/smoke_pipeline.md` describing required checks and where to run them locally.

### 5.270 frontend/src/core/perf/virtualization_thresholds.md

- Purpose: Document empirically derived thresholds for when virtualization or workerization should be applied (props count, card height, merge cost).
- Observation: Thresholds are currently ad-hoc across components; codify them for consistent UX.
- Action: Add thresholds and a short recipe for switching to `VirtualizedPropList` or `LightweightWorkerPool`.

### 5.271 frontend/src/core/metrics/test_helper.ts

- Purpose: Test helper that stubs `UnifiedMetrics` counters and verifies increments/observations without emitting network calls.
- Observation: Metric assertions appear inline in tests; a helper centralizes the pattern.
- Action: Implement `withMetricsStub(fn)` that supplies a test sink and returns assertions helpers.

### 5.272 frontend/src/core/guard/legacy_middleware_disable_hook.ts

- Purpose: Small utility to disable legacy middleware hooks during test runs and CI.
- Observation: Tests failing due to middleware interception indicate the need for a uniform toggle.
- Action: Implement a simple hook reading `DISABLE_LEGACY_FORWARDING=true` from env and disabling middleware registration when set.

### 5.273 frontend/src/core/README.migration_notes.md

- Purpose: Short migration notes for maintainers transitioning from legacy facades to `Unified*` shims.
- Action: Add examples of refactor patterns and recommended deprecation timelines.

### 5.274 frontend/src/core/FeatureComposition/README.md

- Purpose: Document composition helpers semantics, examples, and when to workerize heavy merges.
- Action: Add usage examples for `mergeAlternativeProps`, `computeTopConfidence`, and link to benchmarks.

### 5.275 frontend/src/core/PluginSystem/audit.test.ts

- Purpose: Integration test that ensures plugin lifecycle events (register/enable/disable) emit metrics and persist minimal registry state.
- Action: Implement test that simulates plugin registration and toggles and asserts localStorage persistence and metrics increments.

### 5.276 frontend/src/core/UnifiedCache/README.md

- Purpose: Document chosen cache semantics (TTL units, eviction behavior) and best-practice usage for hot/cold caches.
- Action: Add simple usage examples and a note about `usePipeline` for bulk operations.

### 5.277 frontend/src/core/UnifiedLogger/README.md

- Purpose: Document `getLogger` usage, supported transports, and best-practice for structured logging (include `component` and `context`).
- Action: Include examples for React components and backend-aligned structured fields.

### 5.278 frontend/src/core/telemetry/consent_flow.md

- Purpose: Document the telemetry consent flow and how `TelemetryGate` integrates with opt-in UI and persisted consent.
- Action: Add developer notes to ensure `TelemetryGate` checks are evaluated before any network metric/trace is dispatched.

### 5.279 frontend/src/core/tests/smoke/unified_shims_runner.js

- Purpose: Small Node script to run the unified shims smoke tests without full test suites (useful for local dev and CI warmups).
- Action: Implement script that imports shims, runs basic ops, and exits with non-zero on failure.

### 5.280 frontend/src/core/CONTRIBUTING_SHIMS.md

- Purpose: Minimal contribution guide for adding or modifying core runtime shims (tests required, README updates, smoke tests).
- Action: Draft and require PR checklist enforcement for core infra changes.

### 5.281 frontend/src/core/experimental/README.md

- Purpose: Document experimental modules and gating policies (what can be merged to `experimental/` and how to keep them out of prod bundles).
- Action: Add a tiny README that outlines gating, test expectations, and packaging rules.

### 5.282 frontend/src/core/tests/setup/registry_test_setup.ts

- Purpose: Shared test setup that injects test doubles into `MasterServiceRegistry` prior to tests.
- Action: Implement setup that registers `MLServiceMock`, `UnifiedCache` test adapter, and `UnifiedMetrics` stub.

### 5.283 frontend/src/core/metrics/prometheus_exporter.md

- Purpose: Developer notes for enabling Prometheus-compatible metric export during local dev and CI demos.
- Action: Document how to enable `PROMETHEUS_ENABLED` and how to scrape the exporter in dev.

### 5.284 frontend/src/core/FeatureFlags/fixtures/default_flags.json

- Purpose: Canonical defaults for feature flags used in tests and local dev.
- Action: Create file and update `FeatureFlags` runtime to load defaults when no remote provider is configured.

### 5.285 frontend/src/core/UnifiedState/README.md

- Purpose: Document `resetState` and `rehydrate` helpers for tests, and provide patterns for ephemeral state in unit tests.
- Action: Add examples and recommended `beforeEach`/`afterEach` patterns.

### 5.286 frontend/src/core/GuardedImport/README.md

- Purpose: Document `guardedImport` usage patterns and edge-cases (timeouts, fallback factories, telemetry hooks).
- Action: Add examples and recommendations for using guarded imports in optional feature adapters.

### 5.375 frontend/src/core/GuardedImport/implementation.md

- Purpose: Concrete implementation note describing `guardedImport(path, options)` behavior, timeout semantics, fallback factory signature, and recommended telemetry hooks.
- Observation: Many modules implement ad-hoc try/catch guarded imports; a single implementation note reduces duplication and ensures consistent fallback shapes.
- Risk: Divergent guarded import patterns produce different fallback shapes and inconsistent runtime contracts across modules.
- Action: Add `implementation.md` with API examples, fallback factory contract, and guidance to prefer returning minimal no-op objects matching the expected interface rather than null.

### 5.376 frontend/src/core/tests/smoke/shims_quickcheck.js

- Purpose: Low-friction Node-only quickcheck to validate that core runtime shims are present without requiring TypeScript tooling.
- Observation: CI agents and minimal dev containers often lack `ts-node` or a full TypeScript toolchain; a JS quickcheck ensures basic runtime checks remain accessible.
- Risk: Requiring TypeScript runtimes in all CI images increases image size and slows pipelines; missing quickchecks let runtime-only failures reach later stages.
- Action: Add `shims_quickcheck.js` that `require()`s canonical `core` facades (with safe path fallbacks), asserts exported methods exist, writes a compact JSON report to `reports/shims_quickcheck/<sha>.json`, and exits non-zero on failure.

### 5.377 CI/smoke_runner_wrapper.sh (proposal)

- Purpose: Describe a minimal CI/local wrapper that runs the JS quickcheck, optional TS runner, and metrics checker in sequence and writes normalized artifacts.
- Observation: Contributors run inconsistent check sequences; documenting a single wrapper reduces onboarding friction and makes CI gates reproducible locally.
- Risk: Divergent smoke sequences lead to noisy PRs and reviewers missing infra regressions.
- Action: Add `CI/smoke_runner_wrapper.sh` that supports `SMOKE_ONLY_JS=1` and `SKIP_METRICS_CHECK=1` flags, sets `DISABLE_LEGACY_FORWARDING=true` for route tests, and writes `reports/shims_quickcheck/<sha>.json` on completion.

### 5.378 frontend/src/core/LegacyForwardingMiddlewareGuard.md

- Purpose: Documentation for implementing a guard to disable legacy forwarding middleware when running tests or CI.
- Observation: Legacy forwarding middleware has caused PropFinder tests to return 405/forwarded responses in prior runs; a simple env/flag-driven guard mitigates this.
- Risk: Without the guard, route contract tests can be masked by legacy routing and lead to hidden regressions.
- Action: Add `LegacyForwardingMiddlewareGuard.md` with recommended env var (`DISABLE_LEGACY_FORWARDING`), feature-flag wiring, and guidance for `backend/core/app.py` to consult the guard during middleware registration.

### 5.379 frontend/src/core/FeatureToggleProvider/README.md

- Purpose: Implementer guide for `FeatureToggleProvider` (React context + `useFeatureToggle`) explaining precedence (env > remote provider > runtime override > default) and test utilities.
- Observation: Flag resolution precedence is a common source of confusion and rollout mismatch; explicit docs avoid misunderstanding.
- Risk: Mismatched flag precedence causes partial rollouts and flaky tests between build-time and runtime evaluations.
- Action: Add `README.md` describing provider API, sample remote provider adapter, and unit/e2e test recipes (Playwright steps) to validate runtime toggles.

### 5.380 frontend/src/core/ClientHealthProbe/README.md

- Purpose: Document the `ClientHealthProbe.getSnapshot()` contract, fields to include (cache/ws/prediction readiness), and how smoke tests should use the snapshot.
- Observation: A single health probe simplifies smoke scripts and CI assertions compared to ad-hoc checks spread across admin pages.
- Risk: Without a canonical probe, smoke checks become brittle and inconsistent across environments.
- Action: Add README with example snapshot payload, code snippet to call the probe from Node/TS smoke scripts, and guidance to expose a dev-only `/health` endpoint for local CI consumption.

### 5.381 frontend/src/core/LightweightWorkerPool/README.md

- Purpose: Developer notes describing `LightweightWorkerPool` API, concurrency defaults, idle TTL, and polyfill fallback behavior for environments without WebWorkers.
- Observation: Workerization decisions need standard defaults to avoid memory leaks and provide predictable behavior across browsers and Node tests.
- Risk: Lacking guidance leads to ad-hoc worker implementations that can leak resources or not respect device constraints.
- Action: Add `README.md` with usage examples, recommended defaults (concurrency 2–4, idle TTL 30s), and testing notes for both browser (worker threads) and Node (worker_threads/polyfill).

### 5.382 frontend/src/core/UnifiedCache/benchmarks/README.md

- Purpose: How-to-run and interpret micro-benchmarks for `UnifiedCache` (ops/sec, hit-rate, TTL eviction behavior) to inform cache selection decisions.
- Observation: Benchmarks help decide when to use in-memory fallback vs EnhancedDataManager for high-throughput flows.
- Risk: Choosing cache strategies without empirical data leads to production surprises under load.
- Action: Add `benchmarks/README.md` with commands, expected baseline numbers, and a decision rubric (e.g., prefer EnhancedDataManager for sustained >1k ops/sec patterns).

### 5.383 frontend/src/core/metrics/ci_metrics_checker.md

- Purpose: Documentation for the `ci_metrics_checker` utility (how it consumes JSON snapshots and rule files) and integration guidance for CI pipelines.
- Observation: Metric regressions should be surfaced by smoke gates; a short doc helps developers add/modify thresholds safely.
- Risk: Absent or unclear metric rules cause noisy CI or missed regressions.
- Action: Add `ci_metrics_checker.md` with example threshold JSON shape, command-line usage, and instructions to opt-out for known noisy PRs.

### 5.384 frontend/src/core/PluginSystem/disabled_plugins_list.md

- Purpose: Authoritative list of intentionally-disabled or incompatible plugins with reason, owner, and steps required to safely re-enable.
- Observation: Several plugins were disabled after cleanup but lack documented rationale, resulting in accidental re-enablement attempts.
- Risk: Re-enabling plugins without remediation can reintroduce regressions or security issues.
- Action: Create `disabled_plugins_list.md` capturing plugin ID, disable reason, and remediation checklist; require an owner for re-enable PRs.

### 5.385 frontend/src/core/UnifiedLogger/async_transport.test.md

- Purpose: Test plan for verifying async/batched logger transport flush and graceful shutdown behavior; include test harness recipe and expected assertions.
- Observation: Batched transports can drop messages on abrupt shutdown; tests must assert flush semantics to avoid lost audit logs.
- Risk: Lost logs obscure failures and complicate incident response.
- Action: Add `async_transport.test.md` describing how to run the test with Node and a headless browser, expected flush timing, and pass/fail criteria.

### 5.386 frontend/src/core/CONTRIBUTING_SHIMS_PRIORITY.update.md

- Purpose: Update to the contributor priorities to ensure PRs that modify `core` shims include the quickcheck, smoke-runner artifact, and a changelog entry.
- Observation: Past PRs missed smoke artifacts leading to runtime regressions; explicit PR checklist items reduce this risk.
- Risk: Incomplete PRs land and produce CI failures or runtime issues that are costly to rollback.
- Action: Update `CONTRIBUTING_SHIMS_PRIORITY.md` to include the sample PR checklist and add a small GitHub Action snippet to verify presence of `reports/shims_quickcheck/*.json` for PRs touching `frontend/src/core/**`.

### 5.387 frontend/tsconfig.eslibs.recommendation.md

- Purpose: Provide a minimal tsconfig `lib` recommendation for frontend developers and CI images that fixes missing standard library symbols (Map/Promise/Date) during TypeScript checks.
- Observation: Editor diagnostics and CI runs commonly report missing `Map`/`Promise`/`Date` when `lib` is not set or when TS runs under constrained images.
- Risk: Developers add runtime shims then CI fails at type-check time causing wasted cycles and blocked PRs.
- Action: Recommend adding or merging the following snippet into `frontend/tsconfig.json` (or a shared base tsconfig):

```json
"compilerOptions": {
  "target": "ES2019",
  "lib": ["ES2019", "DOM"],
  "skipLibCheck": true
}
```

Include a short note to re-evaluate `target`/`lib` for older browser support if needed.

### 5.388 frontend/src/core/tests/smoke/shims_quickcheck.js (audit plan)

- Purpose: Exact quickcheck script shape and reporting contract for CI and local runs.
- Observation: The quickcheck must be Node-runable (CommonJS) to run in minimal images; it should not rely on Vite or ts-node.
- Risk: If quickcheck is TypeScript-only, minimal CI images fail and produce false negatives delaying merges.
- Action: Implement `shims_quickcheck.js` with the following behavior: require known `frontend/src/core` facades (guarded import fallback paths), assert presence of exported API names, run small smoke assertions (cache set/get, logger.getLogger returns object with `info` method, guardedImport resolves or returns fallback), and write `reports/shims_quickcheck/<short_sha>.json` with {ok:boolean, checks:[...], runtime: {node:process.version}}.

### 5.389 CI/smoke_runner_wrapper.sh (implementation checklist)

- Purpose: Checklist and minimal implementation guidance for the CI wrapper script described earlier.
- Observation: Wrapper must be idempotent, support `SMOKE_ONLY_JS`, and return normalized exit codes for CI consumption.
- Risk: Non-deterministic wrappers lead to flaky CI and noisy PRs.
- Action: Add a shell script with steps:
  - set -euo pipefail
  - compute short sha: `sha=$(git rev-parse --short HEAD)`
  - run Node quickcheck: `node frontend/src/core/tests/smoke/shims_quickcheck.js || exit_code=$?`
  - optionally run TS check if `RUN_TSC=1` set: `cd frontend && npx tsc --noEmit -p tsconfig.json`
  - run `ci_metrics_checker` if present
  - write `reports/shims_quickcheck/${sha}.json` and exit with non-zero code on failure

### 5.390 .github/workflows/shims_quickcheck.yml (proposal)

- Purpose: GitHub Action workflow to run smoke checks on PRs modifying `frontend/src/core/**` and fail early if quickcheck artifacts are missing or checks fail.
- Observation: Adding a lightweight action reduces reviewer overhead and enforces the PR checklist.
- Risk: Overly heavy actions (installing full toolchains) slow PR feedback; workflow should default to minimal Node runtime and only run tsc when `RUN_TSC=true` label is present.
- Action: Add a workflow that:
  - triggers on pull_request with path filter `frontend/src/core/**`
  - uses Node 20 setup, runs `npm ci` in `frontend` only when `package.json` changed, runs `CI/smoke_runner_wrapper.sh` with `SMOKE_ONLY_JS=1` by default, uploads `reports/shims_quickcheck/*.json` as workflow artifacts, and posts a short summary as PR comment (optional bot).

### 5.391 frontend/src/core/ci_thresholds.baseline.json

- Purpose: Provide the first baseline metric thresholds consumed by `ci_metrics_checker` (latency, hit-rate, ephemeral eviction rate) used by smoke gates.
- Observation: Without an agreed baseline, metric gates will either always fail or be ignored.
- Risk: Arbitrary thresholds cause noisy CI or mask regressions.
- Action: Add `ci_thresholds.baseline.json` with conservative thresholds and owners; example keys: {"cache_hit_rate_min":0.6, "quickcheck_max_time_ms":500, "logger_flush_max_time_ms":200} and require maintainers to tune after 3 PR cycles.

### 5.392 frontend/src/core/docs/run_local_quickcheck.md

- Purpose: Small developer doc describing how to run the quickcheck and interpret results locally (fallback for offline contributors).
- Observation: Many contributors attempt to run `npx tsc` first and confuse TypeScript errors with runtime issues.
- Risk: Developers misdiagnose failures and open noisy PRs.
- Action: Add `run_local_quickcheck.md` with commands:

```bash
node frontend/src/core/tests/smoke/shims_quickcheck.js
# optional: RUN_TSC=1 ./CI/smoke_runner_wrapper.sh
```

and troubleshooting tips (tsconfig lib fix, Node version expectation).

### 5.393 frontend/src/core/OwnerAssignments/OWNERS_SHIMS.md

- Purpose: Assign short-term owners for the shim surface area (cache/logger/guardedImport/metrics) to accelerate triage and reduce merge friction.
- Observation: Multiple teams edit core shims; lack of ownership slows decisioning.
- Risk: No clear owner → PRs linger and regressions slip through.
- Action: Create `OWNERS_SHIMS.md` listing owners (team aliases/emails) and fallback on `infra@` for CI issues; require at least one owner approval for PRs modifying `frontend/src/core/**`.

### 5.394 frontend/src/core/Followups/TSC_FAIL_REPRO.md

- Purpose: Repro steps and logs template to attach to PRs when TypeScript compilation fails in CI (captures node, npm, npx, OS, and full tsc output).
- Observation: When `npx tsc` fails, reproducing locally is often the fastest path to closure; having a reproducible template helps triage.
- Risk: Missing repro information prolongs cycles and context switching.
- Action: Add `TSC_FAIL_REPRO.md` with a copyable template and recommended diagnostic commands (node -v, npx -v, cat frontend/tsconfig.json, npx tsc --version, npx tsc --noEmit -p frontend/tsconfig.json > tsc.out).

### 5.395 frontend/src/core/Followups/QUICKCHECK_FIX_GUIDE.md

- Purpose: Small guide for maintainers on the quickest fixes when quickcheck fails (common failure modes and minimal patches to unblock CI).
- Observation: Common failures: missing exports, guard import path divergence, and missing Node-friendly entrypoints.
- Risk: Without quick fixes, many PRs will stall waiting for heavy changes.
- Action: Add `QUICKCHECK_FIX_GUIDE.md` with recommended patches (add CommonJS entrypoint `module.exports = require('./index.cjs')` or small adapters `index.js` that require TS-compiled files) and a sample PR template to propose the fix.

### 5.396 frontend/src/core/next_steps.md

- Purpose: Short task list to finalize shims rollout and CI integration within two weeks.
- Observation: The audit has grown and contributors need a concise sprintable checklist.
- Risk: Without a short roadmap, work remains piecemeal and uncoordinated.
- Action: Create `next_steps.md` enumerating the top 8 tasks: implement quickcheck JS, add CI wrapper, add GitHub Action, land tsconfig lib fix, add owners file, run 3 smoke PRs, adjust ci_thresholds after measurement, and merge CONTRIBUTING checklist update. Assign tentative owners and ETA (2 weeks).

### 5.397 frontend/src/core/tests/smoke/shims_quickcheck.js (implementation)

- Purpose: Actual Node quickcheck implementation that can be run in minimal CI images and locally to validate runtime shim presence.
- Observation: The audit has specified the contract; implementing the script closes the loop and creates artifacts that CI can upload.
- Risk: Without the script, reviewers can't validate runtime shape quickly and CI must fall back to heavier tsc runs.
- Action: Implement `shims_quickcheck.js` as CommonJS, robustly `require()` the following modules with safe fallback paths: `../GuardedImport`, `../UnifiedCache`, `../UnifiedLogger`, `../ClientHealthProbe`. Perform simple assertions: cache.set/get, logger.getLogger('x').info exists, guardedImport returns function or fallback, health probe returns object with readiness flags. On completion write `reports/shims_quickcheck/<short_sha>.json` with results and exit 0 on success, non-zero on failure.

### 5.398 CI/smoke_runner_wrapper.sh (implementation)

- Purpose: Minimal, idempotent shell wrapper used by local runs and CI to execute the Node quickcheck, optional TS check, and the `ci_metrics_checker`.
- Observation: A single wrapper reduces variance and makes artifact production consistent for CI uploads.
- Risk: A brittle wrapper with undeclared environment assumptions causes noisy CI failures.
- Action: Implement wrapper with sensible defaults:
  - Use `set -euo pipefail` and trap to upload partial artifacts.
  - Default to `SMOKE_ONLY_JS=1` unless `RUN_TSC=1` is explicitly set.
  - Compute short sha with `git rev-parse --short HEAD` and write reports to `reports/shims_quickcheck/${sha}.json`.
  - Return meaningful exit codes and echo a short summary for the workflow log.

### 5.399 .github/workflows/shims_quickcheck.yml (implementation)

- Purpose: Lightweight GitHub Action to run `CI/smoke_runner_wrapper.sh` on PRs touching `frontend/src/core/**` and upload the quickcheck artifact.
- Observation: The workflow enforces the PR checklist and gives reviewers a machine-produced artifact to validate.
- Risk: Too broad a path filter or heavy tooling will slow PR feedback; keep Node-only by default.
- Action: Create workflow with steps:
  - checkout, setup-node (20.x), run the wrapper with `SMOKE_ONLY_JS=1`, upload `reports/shims_quickcheck/*.json` as artifacts, and post a terse status comment on the PR with pass/fail summary.

### 5.400 frontend/tsconfig.json (tslib proposal commit)

- Purpose: Record a proposed concrete change to `frontend/tsconfig.json` to include the recommended `lib` settings so `Map`, `Promise`, and `Date` errors disappear during `npx tsc` runs.
- Observation: A single-line tsconfig change can unblock many PRs; however, changes to `target`/`lib` require review for browser support.
- Risk: If target/lib are bumped without analysis, older browser support may break. Mitigation: a short compatibility test stage must run in the action if target/lib are changed.
- Action: Propose PR template patch that adds/merges the snippet from entry 5.387 into `frontend/tsconfig.json` and a CI conditional that runs compatibility smoke tests when target/lib are modified.

### 5.401 frontend/src/core/metrics/ci_metrics_checker.js (node shim)

- Purpose: Provide a small Node utility (JS) that loads `reports/shims_quickcheck/*.json` and evaluates them against `ci_thresholds.baseline.json`. Implemented in JS to avoid requiring TypeScript runtime in CI.
- Observation: Metrics checking logic is lightweight; a JS implementation reduces friction and speeds PR feedback.
- Risk: Divergent implementations (TS vs JS) cause confusion; document the canonical location (`frontend/src/core/metrics/ci_metrics_checker.js`).
- Action: Implement the JS checker and a small CLI `node metrics/ci_metrics_checker.js reports/shims_quickcheck/*.json` returning 0/1 based on thresholds.

### 5.402 frontend/src/core/CONTRIBUTING_SHIMS_PRIORITY.md (PR policy enforcement snippet)

- Purpose: Add a small code snippet and example GitHub Action check that fails PRs if `frontend/src/core/**` is modified without `reports/shims_quickcheck/*.json` attached.
- Observation: This enforcement dramatically reduces regressions by making artifacts part of the PR completion criteria.
- Risk: Artifacts may be missing because the contributor didn't run the wrapper; provide a clear local dev doc to run it.
- Action: Add enforcement snippet and include a gentle reminder in PR templates and the contributor docs.

### 5.403 frontend/src/core/OWNERS_SHIMS.md (finalize)

- Purpose: Finalize owners file and require at least one owner approval for PRs that change `frontend/src/core/**`.
- Observation: Owners accelerate decisioning and make the audit actionable.
- Risk: Tiny overhead for larger teams; mitigate by rotating owners quarterly.
- Action: Commit `OWNERS_SHIMS.md` and add a line to the pull request template mandating owner approval for core-shim changes.

### 5.404 frontend/src/core/tests/smoke/README.md

- Purpose: README describing the smoke test folder, quickcheck usage, and how to interpret `reports/shims_quickcheck/*.json`.
- Observation: Clear readme reduces confusion for first-time contributors and reviewers.
- Risk: If outdated, the README becomes misleading; mark it as living and tie to the audit maintenance owner.
- Action: Create `README.md` with examples and commands to run both the quickcheck and the wrapper.

### 5.405 frontend/src/core/Followups/POST_QUICKCHECK_ADJUST.md

- Purpose: Guidance for minor followups after the first 3 quickchecks land (tuning thresholds, consolidating fail modes, and adjusting ownership based on noise).
- Observation: The first runs will reveal noisy or fragile checks requiring triage.
- Risk: Overreaction to initial noise can remove valuable gates; plan iterative tuning.
- Action: Add `POST_QUICKCHECK_ADJUST.md` with a 3-run adjustment plan and rollback steps.

### 5.406 frontend/src/core/AUDIT_LOG_INDEX.md

- Purpose: Maintain a small index mapping audit entries -> file paths and owners to make the audit machine-searchable.
- Observation: As entries grow, reviewers need quick navigation to files and responsible owners.
- Risk: Without an index, large audits become hard to navigate.
- Action: Add `AUDIT_LOG_INDEX.md` and keep it updated alongside `PROJECT_GLOBAL_AUDIT.md` — add a CI lint that warns if an audit entry refers to a non-existent file.

### 5.407 frontend/src/core/tests/smoke/shims_quickcheck.js (implement & run)

- Purpose: Node-only quickcheck that validates the minimal runtime shim surface without requiring the TypeScript toolchain.
- Observation: This is the highest-value unblock for CI and contributor feedback — JS quickcheck can run in minimal images and produce deterministic artifacts for PRs.
- Action: Implement `shims_quickcheck.js` (CommonJS) that `require()`s canonical facades (`GuardedImport`, `UnifiedCache`, `UnifiedLogger`, `ClientHealthProbe`), performs simple assertions (cache set/get, logger.info present, guardedImport returns fallback on failure, health snapshot shape), writes `reports/shims_quickcheck/<short_sha>.json` and exits with non-zero on failure.
- Status: Proposed (high priority). Recommend implementing immediately and gating PRs on artifact presence.

### 5.408 CI/smoke_runner_wrapper.sh (implement)

- Purpose: Small idempotent wrapper used by CI and local dev to run the JS quickcheck, optionally run TypeScript check, and run the metrics checker.
- Observation: A single wrapper reduces variance across contributors and ensures CI artifact location/shape is predictable.
- Action: Implement `CI/smoke_runner_wrapper.sh` with `set -euo pipefail`, support for `SMOKE_ONLY_JS=1` and `RUN_TSC=1`, compute short sha, run quickcheck, optionally run `npx tsc --noEmit -p frontend/tsconfig.json` when requested, run `ci_metrics_checker`, emit `reports/shims_quickcheck/${sha}.json`, and return meaningful exit codes. Ensure it sets `DISABLE_LEGACY_FORWARDING=true` for route tests when appropriate.
- Status: Proposed (implement as next step). Document usage in `frontend/src/core/tests/smoke/README.md` and `run_local_quickcheck.md`.

### 5.409 frontend/src/core/metrics/ci_metrics_checker.js (implement)

- Purpose: Node script that evaluates quickcheck JSON artifacts against conservative thresholds and emits pass/fail for CI gating.
- Observation: Implementing in JS avoids requiring TS runtime in CI and accelerates PR feedback. Baseline thresholds should be conservative and tuned after 3 PR runs.
- Action: Implement `ci_metrics_checker.js` that loads `ci_thresholds.baseline.json` and quickcheck artifact(s), compares metrics (quickcheck duration, cache hit-rate indicator if present, logger flush time), prints summary, and exits 0 or 1.
- Status: Proposed (complement to quickcheck & wrapper).

### 5.410 .github/workflows/shims_quickcheck.yml (workflow)

- Purpose: Lightweight workflow to run the wrapper on PRs touching `frontend/src/core/**` and upload `reports/shims_quickcheck/*.json` as an artifact.
- Observation: Default to Node-only quickcheck (`SMOKE_ONLY_JS=1`) to keep runs fast; only run TS checks when label `RUN_TSC` is present or `package.json` changed.
- Action: Add the workflow with checkout, setup-node, run wrapper, upload artifact, and optional PR comment summarizing results.
- Status: Proposed (workflow should be added after wrapper + quickcheck exist).

### 5.411 frontend/src/core/tests/smoke/README.md & run_local_quickcheck.md (docs)

- Purpose: Short how-to for contributors: run the quickcheck locally, interpret artifacts, and quick remediation tips for common failures (tsconfig lib fix, missing exports, guarded import path mismatches).
- Action: Add `README.md` inside `frontend/src/core/tests/smoke/` and a top-level `run_local_quickcheck.md` pointing to the wrapper. Include troubleshooting steps and the `TSC_FAIL_REPRO.md` template reference.
- Status: Planned (low-effort docs; add when quickcheck implemented).

### 5.412 frontend/src/core/OwnerAssignments/OWNERS_SHIMS.md (owners)

- Purpose: Assign short-term owners for the core shim surface (GuardedImport, UnifiedCache, UnifiedLogger, metrics) to accelerate triage and PR approvals for infra changes.
- Action: Add `OWNERS_SHIMS.md` listing owner aliases/emails and require at least one owner approval for PRs touching `frontend/src/core/**`.
- Status: Planned (owner assignments reduce review friction).

### 5.413 frontend/tsconfig.json (lib recommendation — apply via PR)

- Purpose: Concrete tsconfig change to fix missing standard lib symbols (`Map`/`Promise`/`Date`) seen in type-check runs.
- Observation: Instead of immediate in-repo mutation, propose a small PR that merges the recommended snippet into `frontend/tsconfig.json` after compatibility review:

```json
"compilerOptions": {
  "target": "ES2019",
  "lib": ["ES2019", "DOM"],
  "skipLibCheck": true
}
```

- Action: Open a focused PR that updates `frontend/tsconfig.json` with the above and triggers a compatibility smoke stage; document the change in `TSC_FAIL_REPRO.md`.
- Status: Proposed (low-risk but requires owners' signoff for browser-compat concerns).

### 5.414 LegacyForwardingMiddlewareGuard & backend flag (`DISABLE_LEGACY_FORWARDING`)

- Purpose: Prevent legacy forwarding middleware from intercepting PropFinder route tests in CI and local smoke runs.
- Observation: Legacy forwarding caused PropFinder contract tests to return 405 in prior runs; gating it by an env var makes test runs deterministic.
- Action: Add `LegacyForwardingMiddlewareGuard.md` and ensure `backend/core/app.py` checks `DISABLE_LEGACY_FORWARDING` (or feature flag) before registering the legacy forwarding middleware. Use this env in `CI/smoke_runner_wrapper.sh` and GitHub action runs.
- Status: Proposed (backend change required; coordinate with backend owner).

### 5.415 Initial runs & baseline tuning

- Purpose: Execute the quickcheck + wrapper on the branch, upload the first artifacts, and collect 3 successful runs to establish `ci_thresholds.baseline.json` defaults.
- Action: After implementing quickcheck & checker, run the wrapper in local and CI for three PRs, review noise, and adjust thresholds conservatively. Document adjustments in `POST_QUICKCHECK_ADJUST.md`.
- Status: Pending (depends on earlier implementations).

### 5.416 Followups / CI enforcement

- Purpose: Enforce presence of `reports/shims_quickcheck/*.json` for PRs touching `frontend/src/core/**` via a simple workflow or PR check, and require owner approval per `OWNERS_SHIMS.md`.
- Action: Add a PR template note and the GitHub Action (5.410). Add a small enforcement snippet in `CONTRIBUTING_SHIMS_PRIORITY.md` to make the artifact presence part of the PR checklist.
- Status: Planned (enforcement only after artifact workflow is stable).

### 5.417 AUDIT: next steps & short-term owner checklist

- Purpose: Keep a concise set of owner-driven tasks to land the quickcheck gating in one sprint:
  1. Implement `shims_quickcheck.js` and `CI/smoke_runner_wrapper.sh` (owner: infra/shims)
  2. Implement `ci_metrics_checker.js` and add conservative `ci_thresholds.baseline.json` (owner: metrics)
  3. Add `OWNERS_SHIMS.md` and PR template reminder (owner: repo-admin)
  4. Draft `.github/workflows/shims_quickcheck.yml` (owner: CI)
  5. Open PR with `frontend/tsconfig.json` lib recommendation (owner: frontend lead)
- Status: Ready to execute — assign owners and schedule.

### 5.418 Audit index update note

- Purpose: After these files land, update `AUDIT_LOG_INDEX.md` to point the new entries (5.407–5.416) to their file paths and owners so reviewers can quickly navigate to implementations.
- Action: Add an automated CI lint (optional) that validates audit references exist and warns if they don't.
- Status: Planned.

### 5.287 frontend/src/core/UnifiedCache/tests/cache_ttl.test.ts

- Purpose: Unit test verifying TTL eviction semantics in the fallback in-memory cache.
- Action: Add test that sets short TTLs and asserts eviction behavior.

### 5.288 frontend/src/core/UnifiedLogger/tests/logger_format.test.ts

- Purpose: Test that serialized logs include `component`, `level`, `message`, and optional `context` fields.
- Action: Add test using a transport sink to capture serialized messages.

### 5.289 frontend/src/core/TelemetryGate/tests/consent_flow.test.ts

- Purpose: Test that toggling consent persists preference and gates metrics/logs accordingly.
- Action: Implement test with localStorage-backed consent persistence and mock `fetch` to assert no network calls when disabled.

### 5.290 frontend/src/core/LightweightWorkerPool/README.md

- Purpose: Document worker pool API, concurrency defaults, and graceful shutdown behavior for tests.
- Action: Add examples and notes for workerization thresholds and polyfill fallbacks.

### 5.291 frontend/src/core/GuardedImport/tests/guarded_import.test.ts

- Purpose: Unit test covering successful dynamic import, module-not-found fallback, and timeout behavior.
- Action: Implement Jest tests using dynamic import stubs and validate fallback usage.

### 5.292 frontend/src/core/README.audit_log.md

- Purpose: Maintain a short audit log of major changes to `frontend/src/core` (shims added, migration steps, CI changes).
- Action: Append entries as shims/tests/docs land to provide a human-readable migration trail.

### 5.293 frontend/src/core/metrics/README.md

- Purpose: Central docs for frontend metrics conventions, naming, and exporter configuration.
- Action: Document metric naming conventions, label usage, and tie-ins with backend prometheus labels.

### 5.294 frontend/src/core/tests/smoke/unified_shims_runner.ts

- Purpose: TypeScript version of the small smoke runner script; preferred in CI when `ts-node` is available.
- Action: Implement runner that imports shims and asserts minimal API compliance; fallback to JS runner when ts-node absent.

### 5.295 frontend/src/core/FeatureFlags/README.md

- Purpose: Document how flags are defined, default loading order, and remote provider expectations.
- Action: Add examples for local dev, test fixtures, and how to register a remote provider in `MasterServiceRegistry`.

### 5.296 frontend/src/core/UnifiedCache/adapter_examples.md

- Purpose: Show examples wiring `UnifiedCache` to `EnhancedDataManager`, `localStorage`, and the in-memory fallback.
- Action: Add code snippets illustrating `get/set/has/clear` usage and measuring hit/miss.

### 5.297 frontend/src/core/UnifiedLogger/transport_examples.md

- Purpose: Examples for adding transports (console, in-memory test sink, remote HTTP transport).
- Action: Provide minimal code for each transport and notes about format and performance.

### 5.298 frontend/src/core/TelemetryGate/README.md

- Purpose: Document runtime contract for telemetry gating and how to integrate with consent UI components.
- Action: Add example consent flow and integration tests to validate gating behavior.

### 5.299 frontend/src/core/LightweightWorkerPool/tests/worker_pool.test.ts

- Purpose: Unit tests verifying concurrency, idle TTL, and graceful shutdown semantics of the worker pool.
- Action: Add Node-based tests (when worker_threads available) and browser-compatible tests using `jest-webworker-mock`.

### 5.300 frontend/src/core/README.changelog.md

- Purpose: Keep a rolling changelog of README edits for `frontend/src/core`.
- Action: Append entries each time core docs or shims are updated.

### 5.301 frontend/src/core/FeatureComposition/tests/merge_perf.test.ts

- Purpose: Unit test verifying `mergeAlternativeProps` correctness for edge cases (missing lines, null confidences).
- Action: Add tests covering common edge cases and expected outputs.

### 5.302 frontend/src/core/GuardedImport/CHANGELOG.md

- Purpose: Record changes and rationale for updates to the `guardedImport` helper.
- Action: Maintain changelog whenever behavior (timeouts, fallback rules) changes.

### 5.303 frontend/src/core/UnifiedState/tests/reset_rehydrate.test.ts

- Purpose: Tests ensuring `resetState()` clears stores and `rehydrate()` restores initial values deterministically.
- Action: Implement test helpers and verify usage in integration suites.

### 5.304 frontend/src/core/README.todo.md

- Purpose: Short TODO list for items pending implementation (list of test files, readmes, and shims outstanding).
- Action: Keep updated to guide contributors towards the smallest high-impact tasks.

### 5.317 frontend/src/core/CI/smoke_runner_wrapper.sh

- Purpose: Small shell wrapper that runs the minimal CI smoke checks in sequence (backend smoke, frontend shims runner, typecheck).
- Observation: Contributors often run checks manually and use different commands; a single wrapper reduces mistakes and ensures consistent env variables are set.
- Risks: Inconsistent local environments may yield false negatives; wrapper should be explicit about required tools and exit non-zero on failures.
- Action: Add wrapper script with clear usage notes; document required tools (python, node, curl) and recommended env (USE_FREE_INGESTION=false).

### 5.318 frontend/src/core/FeatureFlags/auto_sync_worker.ts

- Purpose: Optional tiny worker that periodically syncs remote feature flags into local override storage for dev sessions.
- Observation: Local dev sometimes runs without remote feature toggles causing surprising behavior.
- Risks: Periodic background sync must be gated by a `DEV_FEATURE_SYNC` flag and never run in production builds.
- Action: Implement as an opt-in dev-only worker with safe abort on page unload and a small TTL for fetched flags.

### 5.319 frontend/src/core/UnifiedCache/metrics_integration.md

- Purpose: Document how `UnifiedCache` emits hit/miss/eviction metrics and how to wire to the `UnifiedMetrics` facade.
- Observation: Metrics integration exists in code paths but lacks an implementation guide for metric names/labels.
- Risks: Inconsistent metric naming hinders aggregation in Prometheus/Grafana and leads to blind spots.
- Action: Provide recommended metric names (e.g., `frontend_unifiedcache_hit_total`) and example ingestion snippets.

### 5.320 frontend/src/core/UnifiedLogger/async_transport.ts

- Purpose: Transport implementation that queues log payloads and sends them in batches asynchronously to reduce blocking on critical paths.
- Observation: Some components emit high-frequency logs that could affect UI performance if serialized synchronously.
- Risks: Batching introduces potential loss of logs on abrupt shutdown; provide a graceful flush API used by test harness and `beforeunload` handler.
- Action: Implement transport with bounded queue, backpressure policy, and a test verifying flush behavior.

### 5.321 frontend/src/core/TelemetryGate/edge_cases.md

- Purpose: Document edge cases (private/incognito, localStorage quota, server-side rendering) and recommended handling for telemetry gating.
- Observation: Telemetry behavior in unusual environments isn't codified — teams handle it ad-hoc.
- Risks: Telemetry leaks or runtime errors in SSR environments if gating checks assume browser-only APIs.
- Action: Produce a short doc listing detection strategies and safe fallbacks for SSR and limited-storage scenarios.

### 5.322 frontend/src/core/LightweightWorkerPool/polyfill_short_note.md

- Purpose: Small developer note describing the polyfill approach when WebWorker isn't available (use setImmediate/worker-threads fallback in Node tests).
- Observation: Tests and Node-based benchmarks sometimes run without worker support and require deterministic fallbacks.
- Risks: Divergent behavior between polyfill and real WebWorker can mask concurrency bugs.
- Action: Add guidance and simple polyfill implementation; ensure tests run both with and without the polyfill in CI matrix.

### 5.323 frontend/src/core/GuardedImport/benchmark_import_latency.ts

- Purpose: Micro-benchmark to measure dynamic import latency vs eager import for optional modules at runtime.
- Observation: Decisions to lazy-load were based on heuristics; quantifying costs helps standardize patterns.
- Risks: Misapplied lazy-loading can increase TTI for interactive flows.
- Action: Add a small benchmark script and record baseline numbers in `README.updates.md`.

### 5.324 frontend/src/core/UnifiedState/rehydration_examples.md

- Purpose: Document common rehydration patterns for `UnifiedState` across tests and storybook stories (shallow merge vs full replace semantics).
- Observation: Test suites inconsistently rehydrate stores causing brittle assertions.
- Risks: Incorrect rehydration leads to state leakage across tests and false positives/negatives.
- Action: Provide examples, recommended hooks, and `beforeEach`/`afterEach` patterns for Jest setups.

### 5.325 frontend/src/core/UnifiedMonitor/health_endpoints_doc.md

- Purpose: Document the lightweight local health endpoints exposed by `UnifiedMonitor` (for dev harnesses) and how to consume them from CI smoke tests.
- Observation: There is code to collect monitor snapshots, but CI smoke scripts lack a canonical consumption pattern.
- Risks: Ad-hoc checks make CI flaky and slow to diagnose.
- Action: Add doc with sample curl commands and expected JSON shapes; include retry/backoff guidance for transient checks.

### 5.326 frontend/src/core/PluginSystem/compatibility_notes.md

- Purpose: Capture compatibility rules and deprecation guidance for plugin authors (lifecycle hooks, minimal metadata, versioning scheme).
- Observation: Multiple plugins exist with subtle contract differences; upgrading core can break plugins silently.
- Risks: Plugin ecosystem fragmentation will slow adoption and increase maintenance overhead.
- Action: Draft compatibility table and recommended semver scheme for plugin APIs; add a CI check that validates plugin manifest shape.

### 5.327 frontend/src/core/tests/smoke/shims_quickcheck.ts

- Purpose: Lightweight TypeScript smoke test that imports all `frontend/src/core` shims and asserts minimal API surface (methods exist, types are callable).
- Observation: A single quickcheck can catch missing runtime files early in PRs before running full test suites.
- Risks: This test depends on `ts-node` in CI; provide a JS fallback runner as well.
- Action: Implement `shims_quickcheck.ts` and `shims_quickcheck.js` and add instructions in `CI/smoke_pipeline.md`.

### 5.328 frontend/src/core/README.quicklinks.md

- Purpose: A short index of high-value docs (shims quickstart, CI smoke pipeline, contributing shims) for maintainers and reviewers.
- Observation: Docs are scattered; reviewers spend time hunting for the right README.
- Risks: Onboarding friction and inconsistent review quality for infra PRs.
- Action: Create the quicklinks file with one-line descriptions and links to the docs mentioned in this audit.

### 5.329 frontend/src/core/UnifiedCache/eviction_strategies.md

- Purpose: Document canonical eviction strategies for the chosen `UnifiedCache`/`CacheManager` implementation.
- Observation: Multiple cache implementations exist with differing eviction semantics (TTL vs LRU vs size-based) and no canonical guidance.
- Risk: Selecting an inconsistent eviction policy across services can cause surprising cache churn, OOM, or stale data windows.
- Action: Write `eviction_strategies.md` describing TTL, LRU, and hybrid strategies, recommended defaults for frontend (TTL + soft LRU), and migration notes for consumers.

### 5.330 frontend/src/core/UnifiedLogger/sync_console_transport.ts

- Purpose: Provide a simple synchronous console transport for `UnifiedLogger` that preserves structured JSON shapes in Node shells and dev consoles.
- Observation: Some transports are async/batched and tests expect immediate console visibility; a sync transport stabilizes smoke-run output.
- Risk: Without a sync transport, smoke runners and CI log parsers may miss early messages or ordering may mislead debuggers.
- Action: Add `sync_console_transport.ts` implementing a synchronous transport with JSON serialization and a small flush API used by test harnesses.

### 5.331 frontend/src/core/GuardedImport/fallback_index.js

- Purpose: Provide a tiny JS fallback index that guarded/dynamic imports can rely on when optional modules are absent.
- Observation: Numerous guarded import patterns exist; a single fallback module reduces duplication and clarifies fallback shapes.
- Risk: Divergent fallback shapes across modules produce type/shape mismatches and brittle runtime branches.
- Action: Add `fallback_index.js` exporting safe defaults (empty objects, noop functions) and document expected fallback contracts for `guardedImport` consumers.

### 5.332 frontend/src/core/tests/smoke/unified_shims_runner.md

- Purpose: Describe how to run the `unified_shims_runner` smoke script (JS and TS variants), environment variables, and expected exit codes.
- Observation: Instructions are scattered between README and CI docs; a focused smoke-run doc helps contributors run quick checks locally.
- Risk: Contributors running shims incorrectly may submit PRs that break CI or miss missing-runtime errors.
- Action: Create `unified_shims_runner.md` with sample commands, env vars (`DISABLE_LEGACY_FORWARDING`, `PROMETHEUS_ENABLED`), and expected output snippets.

### 5.333 frontend/src/core/TelemetryGate/consent_migration_notes.md

- Purpose: Document migration steps and compatibility notes for telemetry consent flows (old localStorage keys → new TelemetryGate API).
- Observation: Multiple legacy consent keys are present in localStorage and tests; migration must be explicit to avoid coaxing telemetry when toggles changed.
- Risk: Silent consent drift could cause telemetry to be sent despite user settings or test expectations.
- Action: Add `consent_migration_notes.md` describing migration strategy, a small compatibility shim, and test steps to validate gating across versions.

### 5.334 frontend/src/core/LightweightWorkerPool/worker_limits.md

- Purpose: Document recommended worker pool sizing, idle TTL, and guidelines for workerized tasks on low-end devices.
- Observation: Worker usage is ad-hoc and lacks documented defaults; incorrect sizing can create CPU contention or memory pressure.
- Risk: Excessive worker spawning in client contexts can degrade battery/CPU and harm UX on mobile devices.
- Action: Author `worker_limits.md` with conservative defaults, tuning tips, and benchmark guidance for common tasks (feature merges, explainability runs).

### 5.335 frontend/src/core/PluginSystem/disabled_plugins_list.md

- Purpose: Track known-incompatible or intentionally-disabled plugins and the rationale for disabling them.
- Observation: Several plugins were disabled during previous cleanups but lack an authoritative list documenting why.
- Risk: Re-enabling incompatible plugins without context can reintroduce regressions or break plugins' consumers.
- Action: Add `disabled_plugins_list.md` recording plugin id, reason disabled, and remediation steps required to re-enable safely.

### 5.336 frontend/src/core/README.shims_faq.md

- Purpose: Frequently asked questions about runtime shims, when to add a shim vs re-export, and best-practices for testing shims.
- Observation: Contributors are unsure when to implement full runtime logic versus a minimal fallback; this slows reviews.
- Risk: Over- or under-engineered shims cause bundle bloat or fragile fallbacks.
- Action: Create `README.shims_faq.md` with short decision rules, examples, and PR checklist items for shims (smoke tests, README, CHANGELOG entry).

### 5.337 frontend/src/core/tests/smoke/shims_quickcheck_instructions.md

- Purpose: Provide step-by-step instructions for running the `shims_quickcheck` (TS + JS variants) locally and in CI, including fallbacks when `ts-node` is absent.
- Observation: The quickcheck is valuable for catching missing runtime files early, but maintainers need runnable instructions across environments.
- Risk: Inconsistent quickcheck usage leads to PRs that pass type-check but fail at runtime in CI.
- Action: Add `shims_quickcheck_instructions.md` documenting both `node` and `ts-node` execution paths and integration tips for CI wrappers.

### 5.338 frontend/src/core/UnifiedState/serialize_policy.md

- Purpose: Define a canonical serialization policy for `UnifiedState` (versioning, field whitelists, and rehydration semantics).
- Observation: Tests and storybooks rehydrate state differently—no canonical policy exists for safe persistence across versions.
- Risk: Incompatible serialized shapes cause load-time exceptions or stale state being applied to newer code paths.
- Action: Add `serialize_policy.md` describing stable keys, version bumps, migration shims, and tooling to validate persisted snapshots.

### 5.339 frontend/src/core/metrics/ci_metrics_checker.ts

- **Status:** ✅ Completed (2025-10-01) — Added a TypeScript-first metrics checker with shared CommonJS wrapper, wired it into the smoke runner artifact flow, and enforced it via the `Core Shims Quickcheck` GitHub Action.
- Purpose: Small CI utility that checks presence of critical frontend metric snapshots (UnifiedCache hit rate, UnifiedMonitor health) and fails CI on regressions.
- Observation: Metrics are present but not wired into CI checks; adding a lightweight check will surface regressions earlier.
- Risk: Silent metric regressions reduce visibility into performance and cache effectiveness between PRs.
- Action: Implement `ci_metrics_checker.ts` that loads exported metric snapshots and asserts threshold expectations; wire into smoke pipeline.

### 5.340 frontend/src/core/CONTRIBUTING_SHIMS_PRIORITY.md

- Purpose: Provide a prioritized list and rationale for shim implementations (what to implement first and why) to guide contributors.
- Observation: Many shim tasks are low-risk but high-impact; contributors need a prioritized backlog to reduce reviewer friction.
- Risk: Uncoordinated shim additions may duplicate effort or cause CI churn.
- Action: Create `CONTRIBUTING_SHIMS_PRIORITY.md` enumerating the top-10 recommended shims (guarded import, UnifiedCache, UnifiedLogger, UnifiedMetrics, telemetry gating, UnifiedState reset, LightweightWorkerPool, shims smoke tests, README updates, CI quickchecks) and include suggested PR templates.

### 5.341 frontend/src/core/FeatureToggleProvider.ts

- Purpose: Provide a runtime React `FeatureToggleProvider` and `useFeatureToggle` hook to standardize feature flag access.
- Observation: Flag checks are scattered and vary in precedence (env, local overrides, remote), causing rollout inconsistencies.
- Risk: Inconsistent flag resolution across components leads to partial rollouts and test/production mismatch.
- Action: Implement `FeatureToggleProvider.ts` with env defaults, in-memory overrides, and a subscribe API; add unit tests for precedence.

### 5.342 frontend/src/core/ClientHealthProbe.ts

- Purpose: Small client-side health probe combining `UnifiedMonitor` snapshots, WS connectivity, and service readiness booleans for smoke checks.
- Observation: No canonical client probe exists; admin pages replicate health logic.
- Risk: Fragmented health checks create brittle smoke tests and inconsistent admin displays.
- Action: Implement `ClientHealthProbe.getSnapshot()` and a local `/health` dev endpoint used by the smoke runner; add a smoke test asserting healthy state when backend reachable.

### 5.343 frontend/src/core/LightweightWorkerPool.ts

- Purpose: Implement a small worker pool used by feature composition and heavy local computations with concurrency limits and idle TTL.
- Observation: Worker patterns are duplicated; a single small pool reduces leaks and provides test harnesses.
- Risk: Ad-hoc workers leak threads and are hard to instrument; central pool is safer and testable.
- Action: Add `LightweightWorkerPool.ts` with a `runTask(modulePath, payload, timeout)` API, polyfill fallbacks for non-worker environments, and unit tests for concurrency limits.

### 5.344 frontend/src/core/LegacyForwardingMiddlewareGuard.ts

- Purpose: Enable toggling legacy forwarding middleware to avoid intercepting test/CI requests (helps PropFinder route tests pass reliably).
- Observation: Legacy forwarding middleware currently intercepts PropFinder requests causing test regressions.
- Risk: Tests and CI can be silently broken by middleware that forwards requests to legacy handlers.
- Action: Implement `LegacyForwardingMiddlewareGuard` that disables legacy forwarding when `DISABLE_LEGACY_FORWARDING` env is set or a feature flag is active.

### 5.345 frontend/src/core/CacheManagerAdapter.ts

- Purpose: Adapter to map `UnifiedCache` calls to the canonical cache backend (`EnhancedDataManager`), localStorage, or memory fallback based on environment.
- Observation: Consumers expect consistent TTL and `usePipeline` semantics; adapters currently differ.
- Risk: Inconsistent adaptors cause cache invalidation bugs and duplicated network calls.
- Action: Implement `CacheManagerAdapter.ts` with explicit TTL semantics and an adapter factory; add smoke tests validating identity and metrics tagging.

### 5.346 frontend/src/core/DevOnly/mocks/MLServiceMock.ts

- Purpose: Deterministic mock adapter for ML predictions used in unit and integration tests, configurable for latency and failure modes.
- Observation: Many tests define inline mocks; a central mock reduces duplication and improves consistency.
- Risk: Divergent test mocks lead to inconsistent test expectations and maintenance overhead.
- Action: Add `MLServiceMock.ts` and update test setups to use it via `MasterServiceRegistry` test injection.

### 5.347 frontend/src/core/TelemetryGate/audit.test.ts

- Purpose: Integration test ensuring telemetry is gated when consent is disabled and that no network calls are made for telemetry events.
- Observation: Telemetry gating lacks integration coverage.
- Risk: Telemetry may be sent despite opt-out in edge-cases or SSR.
- Action: Add `audit.test.ts` that toggles TelemetryGate and asserts network mocks receive no telemetry payloads.

### 5.348 frontend/src/core/UnifiedCache/adapter_examples.md

- Purpose: Document examples wiring `UnifiedCache` to `EnhancedDataManager`, `localStorage`, and the in-memory fallback, including `usePipeline` examples.
- Observation: Lack of documentation causes contributors to pick ad-hoc adapters incorrectly.
- Risk: Misconfigured adapters lead to inconsistent caching and hard-to-trace network loads.
- Action: Create `adapter_examples.md` demonstrating common patterns and pitfalls.

### 5.349 frontend/src/core/UnifiedLogger/async_transport.ts

- Purpose: Async batched transport for `UnifiedLogger` to avoid blocking on high-frequency logs; includes bounded queue and flush API.
- Observation: High-frequency logs can affect UI performance when serialized synchronously.
- Risk: Batching increases risk of lost logs on abrupt shutdown if not flushed properly.
- Action: Implement `async_transport.ts` with backpressure and a test verifying graceful flush on unload.

### 5.350 frontend/src/core/TelemetryGate/edge_cases.md

- Purpose: Document edge-case handling for telemetry gating (incognito, SSR, localStorage full, privacy modes) and recommended safe fallbacks.
- Observation: Telemetry checks occasionally assume browser APIs leading to SSR/edge-case errors.
- Risk: Telemetry leakage or runtime exceptions in special environments.
- Action: Add `edge_cases.md` describing detection and safe fallback strategies.

### 5.351 frontend/src/core/GuardedImport/benchmark_import_latency.ts

- Purpose: Micro-benchmark to measure dynamic import latency vs eager import for optional modules; helps inform lazy-loading decisions.
- Observation: Decisions to lazy-load were heuristics; empirical measurements improve decisions for TTI-sensitive flows.
- Risk: Incorrect lazy-loading increases TTI or adds unpredictable runtime costs.
- Action: Add the small benchmark script and record baseline numbers in the `GuardedImport/README.updates.md`.

### 5.352 frontend/src/core/README.migration_notes.md

- Purpose: Short migration notes for maintainers moving from legacy facades to `Unified*` shims with examples and timelines.
- Observation: Contributors need practical migration patterns to avoid regressions when deprecating old imports.
- Risk: Uncoordinated migrations cause runtime breakages and increased review load.
- Action: Create `README.migration_notes.md` with suggested refactors, tests to add, and a deprecation policy.

### 5.353 frontend/src/core/UnifiedState/serialization_policy.md

- Purpose: Define canonical serialization rules for `UnifiedState` (what to persist, versioning, migration).
- Observation: Multiple ad-hoc serializations exist across apps leading to incompatible persisted shapes.
- Risk: State corruption or silent failures during deserialization across versions.
- Action: Add `serialization_policy.md` with examples, version headers, and migration snippets.

### 5.354 frontend/src/core/FeatureToggle/FeatureToggleProvider.ts

- Purpose: Central provider for feature flags with safe defaults and server-sourced overrides.
- Observation: Feature toggles are scattered; some toggles are read at import time.
- Risk: Import-time evaluation causes feature drift between server-render and client.
- Action: Implement `FeatureToggleProvider.ts` that supports lazy evaluation and hydrate-from-server.

### 5.355 frontend/src/core/Health/ClientHealthProbe.ts

- Purpose: Lightweight client-side health probe that pings local services (cache, telemetry) and reports status.
- Observation: No standard client health metric; debugging requires manual checks.
- Risk: Silent failures reduce observability of client-side regressions.
- Action: Add `ClientHealthProbe.ts` with a small UI overlay usable in development and diagnostic builds.

### 5.356 frontend/src/core/LightweightWorkerPool/limits.md

- Purpose: Document safe concurrency limits and heuristics for the `LightweightWorkerPool`.
- Observation: Workers are configured differently across consumers with no documented limits.
- Risk: Excessive workers cause CPU contention; too few reduce throughput.
- Action: Create `limits.md` and a runtime guard that caps workers to a safe default and exposes env override.

### 5.357 frontend/src/core/Middleware/LegacyForwardingMiddlewareGuard.ts

- Purpose: Middleware guard to exclude admin and ingestion paths from legacy forwarding layers.
- Observation: Legacy middleware sometimes forwards admin routes causing auth regressions.
- Risk: Admin APIs getting proxied and failing authentication checks.
- Action: Implement `LegacyForwardingMiddlewareGuard.ts` and add unit tests for path exclusion rules.

### 5.358 frontend/src/core/UnifiedCache/CacheManagerAdapter.ts

- Purpose: Minimal adapter layer to consistently tag cache metrics and unify adapter signatures.
- Observation: Various cache adapters have different method names and behaviors.
- Risk: Metrics fragmentation and adapter incompatibility.
- Action: Add `CacheManagerAdapter.ts` (implementation note already planned in 5.345) and update example docs.

### 5.359 frontend/src/core/DevOnly/MLServiceMockFactory.ts

- Purpose: Factory that returns `MLServiceMock` instances with preset profiles (fast, realistic, flaky).
- Observation: Tests need varying ML behavior to exercise retries and backoff.
- Risk: Single-mode mocks miss edge-case behavior.
- Action: Implement `MLServiceMockFactory.ts` and wire into test fixtures.

### 5.360 frontend/src/core/TelemetryGate/integration.test.ts

- Purpose: End-to-end test that simulates consent flows (opt-in, opt-out, migration) and verifies telemetry behavior across page loads.
- Observation: Manual testing shows gaps during consent-change flows.
- Risk: Incorrect telemetry during consent transitions.
- Action: Add `integration.test.ts` and run in CI in a headless browser step.

### 5.361 frontend/src/core/adapter_examples/usage_snippets.md

- Purpose: Small cookbook with copy-paste snippets showing adapters (cache, logger, telemetry) wired into components and services.
- Observation: Contributors often reinvent wiring patterns.
- Risk: Inconsistent integrations leading to bugs.
- Action: Add `usage_snippets.md` under `adapter_examples` and link from main docs.

### 5.362 frontend/src/core/UnifiedLogger/async_unload_flush.test.ts

- Purpose: Test ensuring `async_transport` flushes queued logs on page unload and during graceful app shutdown.
- Observation: Batching implementations risk losing logs at unload if not flushed.
- Risk: Missing important audit logs.
- Action: Implement the test and CI job that runs it in a real browser environment.

### 5.363 frontend/src/core/GuardedImport/README.updates.md

- Purpose: Record benchmark baselines, recommended lazy-vs-eager patterns, and migration suggestions based on the `benchmark_import_latency` results.
- Observation: Decisions should be data-driven; maintain a changelog for these patterns.
- Risk: Absent guidance can cause regressions when refactors change import timing.
- Action: Add `README.updates.md` and update it from benchmark results.

### 5.364 frontend/src/core/CONTRIBUTING.shims_priority.md

- Purpose: Short contributor guidance listing top-priority shims to land first (GuardedImport, UnifiedCache, UnifiedLogger) and CI checks to add.
- Observation: PR authors need explicit guidance to prioritize small, stabilizing changes.
- Risk: Low-priority refactors crowd out infrastructure fixes.
- Action: Create `CONTRIBUTING.shims_priority.md` and reference it in the main `CONTRIBUTING.md`.

### 5.365 frontend/src/core/LegacyForwardingMiddlewareGuard.ts

- Purpose: Runtime guard to disable legacy request-forwarding middleware that intercepts and proxies requests (causing tests and CI to receive stale responses).
- Observation: Legacy forwarding middleware currently intercepts `/api/propfinder/*` and other admin paths during tests; a toggleable guard would prevent silent interception in CI/test runs.
- Risk: Without an explicit guard, contract tests and CI smoke checks can be broken by middleware that secretly forwards to legacy handlers, producing false negatives and masking missing route wiring.
- Action: Implement `LegacyForwardingMiddlewareGuard` that is consulted by the application factory; support disabling via `DISABLE_LEGACY_FORWARDING=true` env or a `FeatureFlag`. Add a small unit test and update CI/Local smoke wrapper to set the env when running route tests.

### 5.366 frontend/src/core/tests/smoke/shims_quickcheck.ts

- Purpose: Very small TypeScript quickcheck that imports every `frontend/src/core` shim to catch missing runtime files early in PRs (fast, local pre-merge check).
- Observation: Many PRs only run type-checking, which can miss empty runtime stubs; a quick import-all smoke catches runtime missing exports before CI.
- Risk: Missing runtime shims slip into the bundle and cause runtime crashes or test failures that are harder to triage later in the pipeline.
- Action: Add `shims_quickcheck.ts` (and a JS fallback `shims_quickcheck.js`) that imports canonical `core` facades and asserts exported methods exist. Add instructions to run it locally and wire into the CI smoke pipeline as an optional fast check.

### 5.367 frontend/src/core/tests/smoke/unified_shims_runner.js

- Purpose: Node-runner (plain JavaScript) that exercises `UnifiedLogger`, `UnifiedCache`, and `GuardedImport` without requiring `ts-node` so CI/local dev can run with just Node.
- Observation: TypeScript runners are convenient but require `ts-node` or compilation step; a JS runner reduces friction for quick CI smoke checks and contributor runs.
- Risk: Requiring `ts-node` in all environments increases setup friction and causes quick checks to fail in minimal containers/agents.
- Action: Implement `unified_shims_runner.js` that requires the shim modules (relative imports), exercises basic flows (logger.info, cache.set/get, guardedImport with an invalid path to verify fallback) and exits non-zero on failure. Reference it from `CI/smoke_pipeline.md` and `CI/smoke_runner_wrapper.sh`.

### 5.368 frontend/src/core/FeatureToggleProvider.ts

- Purpose: Provide a runtime React provider (`FeatureToggleProvider`) and hook (`useFeatureToggle`) to unify feature flag resolution (env > remote > local override) across the frontend.
- Observation: Flag checks are currently scattered and vary in precedence; runtime toggles sometimes differ from build-time Vite envs causing rollout mismatch.
- Risk: Inconsistent flag resolution leads to partial rollouts, flaky tests, and diverging developer/CI behaviors.
- Action: Implement `FeatureToggleProvider` that reads `import.meta.env` defaults, loads optional remote provider (if registered in `MasterServiceRegistry`), and supports in-memory overrides for tests. Add `useFeatureToggle(name)` hook, unit tests for precedence, and documentation on runtime vs build-time behavior.

### 5.369 frontend/src/core/ClientHealthProbe.ts

- Purpose: Small client-side health probe that aggregates readiness from `UnifiedMonitor`, `UnifiedCache`, WebSocket connectivity and key services; expose a `/health` JSON snapshot usable by local smoke scripts.
- Observation: Health indicators are scattered across admin pages; CI smoke scripts and contributors lack a single compact client health snapshot to assert in smoke runs.
- Risk: Without a canonical probe, smoke runners use brittle heuristics and tests may become flaky when partial services are offline.
- Action: Implement `ClientHealthProbe.getSnapshot()` returning `{ ok: boolean, checks: {cache:boolean, ws:boolean, prediction:boolean}, details: {} }`. Provide a dev-only `/health` endpoint (served from a small dev shim or via the frontend dev server) and add a smoke test that asserts healthy state when backend is reachable.

### 5.370 frontend/src/core/LightweightWorkerPool.ts

- Purpose: A small, reusable worker pool abstraction to run CPU-heavy feature composition and merge operations off the main thread with bounded concurrency and idle TTL.
- Observation: Several modules reimplement ad hoc worker management; a central, lightweight pool will standardize behavior and reduce leaks.
- Risk: Ad-hoc workers leak resources and create inconsistent concurrency semantics; on low-end devices heavy synchronous merges cause jank.
- Action: Implement `LightweightWorkerPool` with `runTask(modulePath, payload, timeout)` API, default concurrency limits, an idle worker TTL, and a Node/polyfill fallback for environments without WebWorker. Add unit tests for concurrency/timeouts and a README describing when to prefer workerization.

### 5.371 frontend/src/core/CI/smoke_runner_wrapper.sh

- Purpose: Small shell wrapper that runs minimal smoke checks in sequence: backend smoke (if present), `unified_shims_runner.js`, and quick frontend type-checks. Intended for local dev and as a CI pre-merge smoke step.
- Observation: Contributors run varied sequences causing inconsistent outcomes; a single wrapper with clear env expectations reduces mistakes.
- Risk: Inconsistent smoke sequences increase brittle PRs and cause reviewers to miss infra regressions.
- Action: Add `CI/smoke_runner_wrapper.sh` that documents required tools and env vars, sets `DISABLE_LEGACY_FORWARDING=true` for route tests, runs the JS shims runner, then (optionally) runs `npx tsc --noEmit -p frontend/tsconfig.json`. Make it idempotent and explicit about its non-production role.

### 5.372 frontend/src/core/UnifiedCache/README.md

- Purpose: Document the canonical `UnifiedCache` facade: TTL semantics, eviction policy, recommended usage patterns (`usePipeline`, bulk-set), and examples wiring to `EnhancedDataManager` or localStorage fallback.
- Observation: Multiple cache variants exist and consumers are uncertain which semantics to rely on; adding a small README will reduce ad-hoc adapters.
- Risk: Divergent cache choices cause inconsistent invalidation and increased network calls in production.
- Action: Draft `UnifiedCache/README.md` with recommended defaults (TTL units, soft-LRU fallback), sample code snippets, and a link to the `UnifiedCache` smoke tests/benchmarks. Include a note about metrics labels and integration points for `UnifiedMetrics`.

### 5.373 frontend/src/core/tests/smoke/shims_quickcheck_instructions.md

- Purpose: Precise instructions for running the `shims_quickcheck` (both TypeScript and JS variants) locally and in CI with fallbacks when `ts-node` is not available.
- Observation: Quickcheck tests catch missing runtime shims early, but contributors need clear commands and environment expectations to run them consistently across platforms.
- Risk: Without runnable documentation, contributors skip the quickcheck and PRs land with runtime-only failures that bypass type-check gates.
- Action: Add `shims_quickcheck_instructions.md` with copyable commands for Node-only environments, `ts-node` environments, and CI containers; document required env vars (`DISABLE_LEGACY_FORWARDING`, `PROMETHEUS_ENABLED`) and expected exit codes.

### 5.374 frontend/src/core/GuardedImport/README.md

- Purpose: Document `guardedImport` usage patterns, configuration options (timeout, fallback factory), telemetry hooks, and common pitfalls.
- Observation: A standardized `guardedImport` helps unify optional dependency loading but contributors need explicit prescriptions for fallback shapes and telemetry integration.
- Risk: Divergent guarded import patterns lead to inconsistent fallback shapes and fragmented error handling in the UI.
- Action: Create `GuardedImport/README.md` containing examples (simple fallback, factory fallback, import-time telemetry), recommended timeout defaults (1000–3000ms), and migration notes for replacing ad-hoc try/catch blocks.

### 5.375 frontend/src/core/GuardedImport/benchmark_import_latency.ts

- Purpose: Micro-benchmark to measure lazy import latency vs eager import across typical optional modules to guide decisions about lazy-loading vs bundling.
- Observation: Lazy-loading decisions were previously heuristic-driven; recorded numbers will help standardize thresholds for TTI-sensitive flows.
- Risk: Misapplied lazy-loading can inadvertently increase Time-to-Interactive or create unpredictable CPU spikes when optional modules are first used.
- Action: Add `benchmark_import_latency.ts` to run in Node (or browser dev harness) and record results for common optional modules; publish a short guidance note in the `GuardedImport/README.updates.md`.

### 5.376 frontend/src/core/UnifiedCache/tests/cache_ttl.test.ts

- Purpose: Unit test verifying TTL eviction semantics for the in-memory fallback used by `UnifiedCache` to prevent regressions in eviction behavior.
- Observation: Different cache implementations used different TTL semantics (ms vs seconds) — tests ensure canonical behavior is stable.
- Risk: Incorrect TTL units or eviction logic cause stale data to persist or premature invalidation, producing hard-to-trace UI inconsistencies.
- Action: Add `cache_ttl.test.ts` that sets short TTLs, asserts timely eviction, and verifies metrics emitted for evictions/hits; wire into smoke pipeline.

### 5.377 frontend/src/core/UnifiedLogger/tests/logger_format.test.ts

- Purpose: Smoke test ensuring structured logs emitted by `UnifiedLogger` include expected fields (`component`, `level`, `message`, optional `context`) and honor sync/async transports.
- Observation: Contributors sometimes use `console` directly; tests enforce the canonical shape and help maintain transport compatibility.
- Risk: Inconsistent log shapes break downstream parsers and obscure telemetry correlation across client/server traces.
- Action: Implement `logger_format.test.ts` using a test transport sink and assert serialization shape; include a test for `sync_console_transport` to stabilize smoke-run output.

### 5.378 frontend/src/core/TelemetryGate/tests/consent_flow.test.ts

- Purpose: Integration test verifying telemetry gating and consent persistence (localStorage) prevent network emission when disabled.
- Observation: Telemetry gating logic is specified but lacks integration coverage that proves no telemetry network calls occur when consent is off.
- Risk: Telemetry could be emitted despite opt-out in edge-cases (migration, SSR) exposing privacy compliance risks.
- Action: Add `consent_flow.test.ts` that toggles `TelemetryGate` off, stubs `fetch`, and asserts no telemetry payloads are sent; repeat for consent migration scenarios.

### 5.379 frontend/src/core/LightweightWorkerPool/polyfill_short_note.md

- Purpose: Developer note on polyfill strategy for environments without WebWorker support (Node tests, CI), and deterministic fallback semantics.
- Observation: Worker-based tests run in Node/CI often lack WorkerThreads; a documented polyfill strategy avoids test divergence.
- Risk: Polyfill behavior differs from real workers and can hide concurrency-related bugs if not explicitly tested both ways.
- Action: Add `polyfill_short_note.md` describing fallback behavior (synchronous task runner with setImmediate), recommended CI matrix to run both polyfill and real-worker modes, and guidance for deterministically enabling polyfill.

### 5.380 frontend/src/core/UnifiedCache/metrics_integration.md

- Purpose: Document how `UnifiedCache` emits metrics (hit/miss/eviction) and recommended label names for Prometheus/Grafana integration.
- Observation: Metrics exist but naming and labels vary across adapters; consistent names are needed for reliable dashboards and CI checks.
- Risk: Inconsistent metric labels fragment observability and make it difficult to detect regressions in caching behavior.
- Action: Create `metrics_integration.md` recommending metric names (e.g., `frontend_unifiedcache_hit_total`, `frontend_unifiedcache_miss_total`, `frontend_unifiedcache_eviction_total`), label patterns (`cache=unified, adapter=memory|localStorage|enhanced`), and sample scraping instructions.

### 5.381 frontend/src/core/GuardedImport/CHANGELOG.md

- Purpose: Maintain a changelog documenting behavioral changes to `guardedImport` (timeouts, fallback shapes, telemetry hooks) to help maintainers reason about regressions.
- Observation: Small changes to import fallback behavior can have outsized client impact; a changelog reduces surprise.
- Risk: Silent changes in fallback shapes can break consumers relying on specific API shapes from optional modules.
- Action: Add `CHANGELOG.md` and require PRs that modify `guardedImport` behavior to append a short entry and a rationale.

### 5.382 frontend/src/core/CI/smoke_pipeline.md

- Purpose: Author the minimal CI smoke pipeline expectations for `frontend/src/core` changes (run JS shims runner, quick TS check, unified cache/logger smoke tests, and optional backend route sanity check with `DISABLE_LEGACY_FORWARDING=true`).
- Observation: Core infra PRs land without a concise CI smoke step; this doc will be referenced by `CI/smoke_runner_wrapper.sh`.
- Risk: Without a canonical smoke pipeline, infra regressions slip into main branches and cause large-scale flakiness.
- Action: Draft `CI/smoke_pipeline.md` enumerating sequence, required tooling, allowed failure thresholds, and a link to `shims_quickcheck_instructions.md` for local reproduction.

### 5.383 frontend/src/core/CONTRIBUTING_SHIMS_PRIORITY.md (follow-up)

- Purpose: Follow-up note reminding contributors to include smoke tests and README updates when adding or modifying `core` facades; tie PR checklist entries to CI smoke gates.
- Observation: The earlier `CONTRIBUTING.shims_priority.md` is present; this follow-up ties it to required CI artifacts and test expectations.
- Risk: Without enforced checklist entries, some PRs modify shims without the minimal verification artifacts causing regressions.
- Action: Update `CONTRIBUTING_SHIMS_PRIORITY.md` to require (1) smoke runner invocation instructions, (2) a small smoke test, and (3) README/CHANGELOG entries for any shim changes. Add a sample PR checklist snippet.

### 5.384 frontend/src/core/tests/smoke/unified_shims_runner.md

- Purpose: Short guide showing how to run the `unified_shims_runner` JS and TS variants, environment variables required, and expected outputs for quick local verification.
- Observation: Contributors benefit from an explicit runner doc separate from CI pipeline docs — keeps local iteration fast.
- Risk: Lack of runnable, documented smoke-run steps increases PR friction and slows reviewers.
- Action: Create `unified_shims_runner.md` with copyable commands for (Node-only) and (ts-node) flows, example outputs for success/failure, and notes about setting `DISABLE_LEGACY_FORWARDING` when route tests are included.

### 5.385 frontend/src/core/LegacyForwardingMiddlewareGuard.ts (implementation)

- Purpose: Implementation artifact for the runtime guard that disables legacy forwarding in dev/test environments.
- Observation: The audit recommends a guard but a runtime file must be created and wired into `backend/core/app.py:create_app` to be effective.
- Risk: Without a concrete implementation and app-factory wiring, the guard remains a doc-only mitigation and tests continue to fail intermittently.
- Action: Add `LegacyForwardingMiddlewareGuard.ts` (or `.py` shadow equivalent where the middleware lives) implementing a simple env/flag check and a unit test. Update `create_app` to consult the guard during middleware registration and ensure `DISABLE_LEGACY_FORWARDING=true` is honored in CI runs.

### 5.386 frontend/src/core/tests/smoke/shims_quickcheck.js

- Purpose: Plain-JS implementation of the `shims_quickcheck` to run without `ts-node` (low-friction local/CI check).
- Observation: Many contributors use minimal containers that lack TypeScript tools — adding a JS quickcheck reduces friction and catches empty runtime stubs.
- Risk: TypeScript-only quickchecks exclude minimal CI agents and make PRs fail unexpectedly in downstream pipelines with different environments.
- Action: Add `shims_quickcheck.js` that `require()`s canonical `core` exports and asserts expected methods exist (throw on missing). Wire it into the `CI/smoke_runner_wrapper.sh` and document usage in `shims_quickcheck_instructions.md`.

### 5.387 frontend/src/core/tests/smoke/unified_shims_runner_impl_note.md

- Purpose: Implementation note describing what the `unified_shims_runner` (JS) should exercise (logger, cache, guardedImport fallback, TelemetryGate off behavior) and expected return codes.
- Observation: Multiple teams may implement slightly different runners; a short spec ensures consistent behavior across JS/TS variants.
- Risk: Divergent runner behavior reduces value of the smoke step and makes CI signal noisy.
- Action: Add `unified_shims_runner_impl_note.md` listing concrete assertions the runner must perform and example JSON outputs for success/failure for CI parsers.

### 5.388 frontend/src/core/FeatureToggleProvider/e2e.recipe.md

- Purpose: E2E recipe demonstrating how to validate feature toggles end‑to‑end using Playwright (toggle override → UI expected change → telemetry event assertion).
- Observation: Unit tests are necessary but E2E recipes validate build/runtime flag precedence and bundling-time differences.
- Risk: Build-time vs runtime flag mismatches lead to production rollouts where toggles do not behave as expected.
- Action: Add `e2e.recipe.md` with Playwright steps, sample fixtures, and recommended optional gating of E2E in CI to avoid flakiness.

### 5.389 frontend/src/core/ClientHealthProbe/smoke.test.ts

- Purpose: Minimal smoke test that calls the local `ClientHealthProbe.getSnapshot()` and asserts presence of key readiness booleans (cache/ws/prediction) for CI runs.
- Observation: A single decisive probe simplifies smoke assertions and reduces flaky health heuristics across pipelines.
- Risk: Without a canonical probe, multiple brittle health checks will continue to exist across scripts and tests.
- Action: Implement `smoke.test.ts` (or `.js`) that invokes the probe in a dev harness with `DISABLE_LEGACY_FORWARDING=true` and fails CI when core readiness isn't met.

### 5.390 frontend/src/core/LightweightWorkerPool/implementation_notes.md

- Purpose: Implementation notes detailing API surface, concurrency defaults, fallback behavior, and test harness patterns for `LightweightWorkerPool`.
- Observation: A clear implementation note reduces rework and allows contributors to implement pool in different environments consistently.
- Risk: Inconsistent pool designs across modules cause leaked workers, differing timeout semantics, and fragmentation of metrics reporting.
- Action: Add `implementation_notes.md` describing `runTask(modulePath, payload, options)`, default concurrency (2–4), idle TTL (30s), and polyfill behavior for Node/CI.

### 5.391 frontend/src/core/UnifiedCache/benchmarks/README.md

- Purpose: Describe how to run the `UnifiedCache` micro-benchmarks and interpret ops/sec/hit-rate outputs for cache selection decisions.
- Observation: Bench results should be captured in a small README to guide adoption and thresholds for when the `EnhancedDataManager` should be preferred.
- Risk: Without recorded benchmark guidance, teams will pick cache options without empirical basis leading to production surprises.
- Action: Create `benchmarks/README.md` with commands, expected baseline numbers, and a brief decision rubric (use memory fallback for <1k ops/sec; prefer EnhancedDataManager for high-throughput flows).

### 5.392 frontend/src/core/metrics/ci_metrics_checker.ts (implementation)

- Purpose: Small CI utility that loads metric snapshots (exported from smoke runs) and fails the CI if key metrics regress below thresholds (UnifiedCache hit rate, UnifiedMonitor health).
- Observation: Metric regressions are currently not surfaced in PR smoke gates — a tiny checker will raise early warnings and give PRs actionable feedback.
- Risk: Without metric checks, subtle regressions in caching/monitoring silently degrade performance and observability.
- Action: Implement `ci_metrics_checker.ts` that reads JSON snapshots and compares against baseline thresholds stored in `frontend/src/core/metrics/ci_thresholds.json`; wire it as an optional step in the smoke pipeline.

### 5.393 frontend/src/core/PluginSystem/disabled_plugins_list.md (implementation)

- Purpose: Published list of intentionally disabled/incompatible plugins, with rationale and steps required to re-enable them safely.
- Observation: Several plugins were disabled during cleanup but lack an authoritative list and remediation steps.
- Risk: Re-enabling incompatible plugins without context may reintroduce regressions or security issues.
- Action: Create `disabled_plugins_list.md` documenting plugin id, reason disabled, test steps to re-enable, and owner for follow-up.

### 5.394 frontend/src/core/UnifiedLogger/async_transport.test.ts

- Purpose: Test ensuring the async/batched logger transport flushes messages on unload and during graceful shutdown (important for CI and smoke-run reliability).
- Observation: Batched transports can drop data; tests guarantee ordered flush semantics and avoid lost logs in smoke runs.
- Risk: Missing flush behavior loses first-run telemetry and makes debugging smoke failures harder.
- Action: Add `async_transport.test.ts` verifying flush semantics and bound queue/backpressure behavior.

### 5.395 frontend/src/core/CONTRIBUTING_SHIMS_PRIORITY.update.md

- Purpose: Short note updating the contributor priorities to enforce PR checklist items: smoke test, README update, and CHANGELOG entry for any `core` shim change.
- Observation: Earlier CONTRIBUTING guidance exists; this update ensures the PR validation checklist aligns with CI smoke gates.
- Risk: Without enforced checklist items PRs may land with incomplete verification artifacts.
- Action: Update `CONTRIBUTING_SHIMS_PRIORITY.md` and add a sample PR checklist snippet to the file.

### 5.396 frontend/src/core/tests/smoke/shims_quickcheck_report.md

- Purpose: Template for quickcheck run reports (what the quickcheck validates, timestamp, environment, and failures) to be saved under `reports/` when CI runs the quickcheck.
- Observation: Quickcheck output should be machine-readable for CI dashboards; a template standardizes reporting across agents and environments.
- Risk: Unstructured quickcheck output complicates automated triage and historical regression analysis.
- Action: Add `shims_quickcheck_report.md` template and instruct CI wrapper to write a compact JSON/MD report to `reports/shims_quickcheck/<sha>.json` on each run.

### 5.397 CI/smoke_runner_wrapper.sh (implementation)

- Purpose: A minimal, cross-platform shell wrapper that runs the JS quickcheck, the TS runner (if present), and the metrics checker, producing normalized exit codes and writing a `reports/` artifact.
- Observation: CI pipelines today mix bash and powershell agents; a single wrapper with clear inputs/outputs simplifies adoption.
- Risk: Without a canonical wrapper, duplicative scripts proliferate and CI signals become inconsistent.
- Action: Create `CI/smoke_runner_wrapper.sh` that supports these environment toggles: `SMOKE_ONLY_JS=1`, `SKIP_METRICS_CHECK=1`, and records outputs to `reports/shims_quickcheck/<sha>.json`. Add a `bin/smoke-runner` minimal shim that makes the wrapper discoverable from platform-agnostic CI steps.

### 5.398 frontend/src/core/tests/smoke/shims_quickcheck.js (implementation)

- Purpose: Provide the low-friction Node.js quickcheck runner that requires only Node (no TS compilation) and asserts presence/shape of core shims (UnifiedCache, GuardedImport, UnifiedLogger).
- Observation: This runner is critical for many downstream CI agents and container images that intentionally omit TypeScript tooling to reduce image size.
- Risk: Without this runner, CI on minimal images will continue to get false negatives or skip important runtime checks.
- Action: Add `shims_quickcheck.js` that `require()`s the compiled/JS path or attempts to use `ts-node/register` fallback; assert methods and write a normalized JSON report on success/failure.

### 5.399 frontend/src/core/metrics/ci_thresholds.json (baseline)

- Purpose: Machine-readable thresholds for CI metric checks (cache hit-rate, probe readiness, logger flush time) used by `ci_metrics_checker`.
- Observation: Having thresholds in source makes PR-level changes clearer and easier to update with co-owned PRs.
- Risk: Thresholds that are too strict cause noisy PR failures; too lax hide regressions.
- Action: Commit `ci_thresholds.json` with conservative defaults and a clear comment block explaining how to update with measured baselines and who owns threshold changes.

### 5.400 backend/ingestion/backfill_manager_test.py (unit tests)

- Purpose: Validate the in-memory `BackfillManager` and `JobStore` behaviors documented in the earlier audit (job lifecycle, cancellation semantics, idempotence).
- Observation: The repo contains a test-only `BackfillManager` but lacks a focused unit test exercising concurrency and error handling.
- Risk: Backfill jobs misbehaving in CI/production could cause data duplication or silent failures.
- Action: Add `backfill_manager_test.py` exercising job creation, duplicate job handling, cancellation, and persisted job visibility; integrate into `pytest` focused runs.

### 5.401 backend/middleware/legacy_middleware.md (docs)

- Purpose: Document middleware exclusion rules (admin prefixes, ingestion admin paths) and explain the reasoning for explicit exclusions in `legacy_middleware.py`.
- Observation: Middleware historically forwarded unknown admin paths causing confusing 404/forward loops; the code now excludes `/api/ingestion/admin` and `/api/admin` but lacks developer-facing docs.
- Risk: Future contributors may reintroduce forwarding for admin routes leading to opaque failures and security holes.
- Action: Add `legacy_middleware.md` documenting the safe list, tests to assert middleware behavior, and guidance on adding new admin prefixes.

### 5.402 backend/core/enhanced_ml_validation_note.md

- Purpose: Short note capturing the enhanced-ML response normalizer validation rule (invalid sport -> HTTP 422 and canonical error object with top-level message) and the related unit tests that must exist.
- Observation: This validation was introduced to prevent invalid-sport payloads returning HTTP 200; tests must be kept to avoid regressions.
- Risk: Regressing this behavior will allow invalid requests to appear successful and hide data quality issues downstream.
- Action: Add `enhanced_ml_validation_note.md` and ensure the test `tests/backend/routes/test_enhanced_ml_compat.py` remains in CI; add an explicit CI check that failure to validate returns HTTP 422 for a set of invalid sports.

### 5.403 backend/routes/admin_auth_audit.md

- Purpose: Audit the admin API authentication patterns and ensure all admin endpoints use consistent auth/audit logging and are excluded from legacy forwarding.
- Observation: Admin routes are sensitive and require consistent, auditable behavior; some admin ingestion endpoints were recently added and must follow the same pattern.
- Risk: Inconsistent auth or audit logging across admin routes opens an attack surface or creates gaps in traceability.
- Action: Add `admin_auth_audit.md` documenting required auth middleware, audit log format, and a small checklist that CI will assert for any PR touching `backend/routes/admin*` or `backend/routes/ingestion_admin*`.

### 5.404 repo/DEPENDENCY_MAP.md

- Purpose: High-level map of major runtime dependencies (backend python libs, frontend node packages, optional ML libs) with owners and fallback notes (which can be used during CI triage when imports fail at runtime).
- Observation: Many failures in CI originate from missing optional ML libraries; a dependency map with fallbacks speeds triage.
- Risk: Without a clear map, contributors repeatedly add imports that break CI or cause expensive image builds.
- Action: Create `DEPENDENCY_MAP.md` with each major dependency, purpose, owner, optional/required flag, and recommended minimal dev container install commands.

### 5.405 frontend/tsconfig_libs_check.md

- Purpose: Reminder and short guide to ensure `frontend/tsconfig.json` includes `lib` entries required for Map/Promise/Date when running `npx tsc` (common CI failure observed in this session).
- Observation: The workspace reported `Cannot find name 'Map'` / `Promise` in earlier diagnostics — most likely `tsconfig.json` lacks ES2015+ libs.
- Risk: Missing lib entries lead to spurious type errors on otherwise correct code and confuse contributors.
- Action: Add `tsconfig_libs_check.md` with a single recommended delta snippet for `frontend/tsconfig.json` (lib: ["ES2015", "DOM"]) and instructions to re-run `npx tsc --noEmit` in CI smoke gates.

### 5.406 CI/PR_POLICY_AUTOMATION.md

- Purpose: Enforce PR automation rules: all `core` shim PRs must include (1) `shims_quickcheck` success, (2) `reports/` artifact, and (3) a CHANGELOG fragment. The policy file will be used to create a GitHub action that fails PRs missing required artifacts.
- Observation: Many shims landed without tests or report artifacts; automated enforcement reduces human review fatigue and improves rollbacks.
- Risk: Overly strict automation causes friction; keep rules conservative initially.
- Action: Add `PR_POLICY_AUTOMATION.md` and a template GitHub Action that looks for `reports/shims_quickcheck/*.json` or `reports/shims_quickcheck/*.md` and fails when missing for PRs touching `frontend/src/core/**`.
