# Performance & Quota Claims Validation Plan

## Objectives

- Confirm reported frontend load time (<300 ms) and backend API latency (<100 ms) with reproducible benchmarks.
- Validate reliability of new free/open data feeds (post-SportRadar) including rate limits, freshness, and fallback behavior.
- Package verified results with provenance into the single PropFinder parity specification.

## Existing Artifacts

- `phase3_performance_report.json` / `phase3_performance_report.csv`: baseline system benchmark results (FastAPI startup, health checks).
- `networkperformance.har`: frontend HAR capture; may contain initial page load timing.
- `performance_metrics.log`, `performance_validation_system.py`: historical perf validation utilities.
- Historical ingestion logs: `backend_propfinder_opps_*`, prior SportRadar quota outputs (useful for benchmarking legacy state).

## Validation Tracks

### 1. Frontend (React 19) Load & Interaction Benchmarks

- Use Playwright or Lighthouse CI for cold load and warm navigation metrics.
- Capture: First Contentful Paint, Time to Interactive, median API fetch latency, virtual scroll responsiveness.
- Automation: add `scripts/perf/run_frontend_benchmarks.ts` or reuse existing Playwright setup.
- Output: JSON + Markdown summary with comparison to <300 ms target.

### 2. Backend API Latency & Throughput

- Extend `phase3_performance_benchmark.py` to hit `/api/propfinder/opportunities`, `/api/propfinder/search`, `/api/v1/sportradar/*`.
- Collect p50/p95 latency, throughput at 1× and 2× expected QPS, error counts.
- Record environment metadata (hardware, concurrency, dataset snapshot).

### 3. Free Data Feed Reliability & Fallbacks

- Inventory each replacement API (e.g., TheOddsAPI public tier, open league feeds, community datasets) with documented rate limits.
- Instrument ingestion middleware to log per-endpoint counts, response latency, and error codes; store in Prometheus or logs.
- Stress-test at projected production load (>= 2×) to ensure no hidden throttling; add automatic cooldown/queueing when approaching published caps.
- Design fallback hierarchy (cached data, synthetic fixtures) and simulate upstream outage to validate switch-over and user messaging.

## Deliverables

1. `analysis/performance_claims_summary.md` — includes measured metrics, methodology, confidence notes.
2. Raw benchmark artifacts under `validation_artifacts/performance/<date>/` (JSON, charts, HAR, logs).
3. Updates to PropFinder parity spec referencing validated figures with links to artifacts and documenting data source lineage.

## Open Questions

- What is the canonical dataset or fixture for backend opportunity generation during load tests?
- Which services currently own ingestion of legacy SportRadar data, and how will they be decoupled or refactored for the new feeds?
- Which environment (local vs staging) best reflects production hardware for benchmarks?

## Next Steps

1. Inventory existing benchmark scripts and confirm they run against current app factory (`backend/core/app.py`).
2. Design shared reporting schema (e.g., JSON with `metric`, `target`, `observed`, `status`).
3. Prototype backend latency test run locally; capture initial metrics and gaps.
4. Draft migration plan for each SportRadar-dependent service to new free APIs; track retired endpoints.
