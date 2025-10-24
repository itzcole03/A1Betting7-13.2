# Core shim TODO (prioritized)

Use this list to coordinate outstanding work on the lightweight runtime facades. Update the status column when items move forward and link to issues/PRs where possible.

| #   | Task                                                                             | Status  | Notes / Owner                                                                                                                      |
| --- | -------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | GuardedImport: resilient dynamic import with timeout + fallback + smoke coverage | ✅ Done | `GuardedImport/index.ts` shipped; JS/TS smoke assertions cover fallback behaviour                                                  |
| 2   | UnifiedCache: Map-based fallback with TTL + tests                                | ✅ Done | Default instance + class live in `UnifiedCache/index.ts`; smoke runner verifies `set/get/delete/has`                               |
| 3   | UnifiedLogger: structured console formatting + child loggers                     | ✅ Done | `getLogger(component)` returns `{debug/info/warn/error}` keeping payloads JSON-formatted                                           |
| 4   | TelemetryGate runtime + smoke coverage                                           | ✅ Done | `TelemetryGate/index.ts` shipped; JS/TS smoke runners assert metrics are blocked when consent is revoked                           |
| 5   | UnifiedState helpers (`resetState`, `rehydrate`)                                 | ✅ Done | Singleton manager with reset/rehydrate + broadcast support landed; dedicated test harness + unit coverage keep state deterministic |
| 6   | WorkerPool shim for browser/Node fallbacks                                       | ✅ Done | `LightweightWorkerPool.ts` provides queue + timeout + metrics; JS/TS smoke runners assert concurrency + timeout paths              |
| 7   | Smoke runners (JS + TS) + docs                                                   | ✅ Done | CommonJS runner updated; TypeScript runner added in `tests/smoke/unified_shims_runner.ts`; docs refreshed                          |
| 8   | Documentation refresh (quickstart, contributors, legal)                          | ✅ Done | `README.shims_quickstart.md`, `CI/local_run_instructions.md`, `docs/README_CONTRIBUTORS.md`, `docs/README.legal.md` updated        |
| 9   | PredictionValidator runtime normaliser + tests                                   | ✅ Done | `PredictionValidator.ts` normalizes payloads, logs warnings, and smoke runners cover happy-path + failure scenarios                |
| 10  | PluginSystem lifecycle hooks + audit events                                      | ✅ Done | Lifecycle-aware registry in `PluginSystem.ts`/`.cjs` (setup/enable/disable/reset) with JS/TS smoke coverage + audit logging        |
| 11  | FeatureComposition runtime helpers + tests                                       | ✅ Done | `FeatureComposition.ts`/`.cjs` expose merge & confidence helpers with JS/TS smoke coverage                                         |
| 12  | UnifiedMonitor integration test + Prometheus exporter shim                       | ✅ Done | Aggregation helpers + Prometheus exporter shipped; JS/TS smoke coverage exercises new paths                                        |

Add new items at the bottom with a brief justification. When a task completes, leave it in the table (status ✅) so future contributors know it is covered.
