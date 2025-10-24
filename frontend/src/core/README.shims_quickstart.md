# Core shim quickstart

The `frontend/src/core` directory houses lightweight runtime facades used by smoke tests, CI quickchecks, and legacy consumers. This guide shows how to exercise the shims and what to expect.

## Run the smoke checks

```bash
# From the repo root
cd frontend/src/core/tests/smoke

# CommonJS runner (fastest)
node unified_shims_runner.js

# TypeScript runner (ts-node)
npx ts-node unified_shims_runner.ts

# Focused TypeScript compile gate
npx tsc -p ../../tsconfig.smoke.json
```

All commands should exit with status `0`. Non-zero exit codes indicate a missing shim export or behavioural regression.

See `core/CI/local_run_instructions.md` for additional troubleshooting tips and exit-code breakdowns.

## Canonical shims in scope

| Shim                    | Public surface                                                                                      | Behaviour                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `UnifiedLogger`         | `getLogger(component)` → `{ debug/info/warn/error }`                                                | Formats messages with timestamp + component, forwards to `console`                       |
| `UnifiedCache`          | `new UnifiedCache(ttl)` / `instance.set/get/delete/has/clear/size`                                  | Map-based in-memory cache with optional TTL per entry                                    |
| `guardedImport`         | `guardedImport(modulePath, { fallback, timeoutMs })`                                                | Attempts a dynamic import and resolves to the fallback on timeout/failure                |
| `TelemetryGate`         | `isTelemetryAllowed(context)` / `setTelemetryConsent(enabled)`                                      | Central consent toggle that gates metrics/telemetry helpers                              |
| `UnifiedState`          | `createUnifiedState(key, opts)` / `resetAllState()` / `teardownAllState()`                          | Singleton state manager with subscription, `resetState`, and async `rehydrate` helpers   |
| `LightweightWorkerPool` | `new LightweightWorkerPool(opts)` / `runTask(handler, payload, opts)` / `getStats()` / `shutdown()` | Queue-based worker facade with concurrency limits, timeouts, and optional metrics events |
| `PredictionValidator`   | `validatePrediction(payload, opts)` / `normalizePrediction(payload, opts)`                          | Coerces backend prediction payloads into canonical shapes and records validator warnings |
| `PluginSystem`          | `register(def, opts)` / `enable(id)` / `disable(id)` / `reset(opts)` / `getPlugin(id)`              | Lifecycle-aware plugin registry with UnifiedLogger auditing + setup/enable/disable hooks |
| `FeatureComposition`    | `mergeAlternativeProps(base, alternatives, opts)` / `computeTopConfidence(values)`                  | Pure helpers for merging alternative props and computing highest confidence values       |
| `UnifiedMonitor`        | `getInstance()` → `startTrace/endTrace/recordMetric/getMetricSummary/exportPrometheus()`            | Aggregates metrics for quick checks and emits Prometheus text for local scraping         |
| `UnifiedMetrics`        | `getInstance()` → `counter/gauge/histogram/bindExporter/bindPrometheusExporter`                     | Gated metrics aggregator with snapshot helpers and optional Prometheus exporter binding  |
| `FeatureFlags`          | `getFeatureFlagService()` / `isFeatureEnabled(name)` / `subscribeToFeature(name, cb)`               | Registers the flag manager with `MasterServiceRegistry` and broadcasts toggle events     |

These facades intentionally provide minimal behaviour. Production builds still rely on the richer implementations wired through the `MasterServiceRegistry`.

> **Developer note:** Always obtain scoped loggers via `UnifiedLogger.getLogger(...)` instead of calling `console.*` directly. The shim ensures consistent formatting, honours `setLevel(...)`, and plays nicely with the smoke runners.

## When you update a shim

1. Add or extend assertions in `tests/smoke/unified_shims_runner.(js|ts)` to cover the new behaviour.
2. Run the commands above and capture the output in your PR.
3. Update `docs/README_CONTRIBUTORS.md` or `PROJECT_CORE_TODO.md` if the change introduces new follow-up work.

Keeping the smoke checks green ensures that CI can continue guarding these critical facades without running the entire frontend type-check.
