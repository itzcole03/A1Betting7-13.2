# Core shims smoke checks — local quickstart

Use this guide when you need to reproduce the CI quickcheck locally.

## Prerequisites

- Node.js 18 or newer on your `PATH`
- `npm` (bundled with Node)
- Optional: `ts-node` (install globally or run via `npx`)
- Windows users: run commands from Git Bash/WSL so shebangs and env vars behave consistently

## Fast commands

Run the CommonJS smoke runner (no build step):

```bash
cd frontend/src/core/tests/smoke
node unified_shims_runner.js
```

Run the TypeScript variant (uses `ts-node` and exercises the same assertions):

```bash
cd frontend/src/core/tests/smoke
npx ts-node unified_shims_runner.ts
```

Run the focused TypeScript compile gate used by CI (`RUN_TSC_SMOKE=1`):

```bash
cd frontend/src/core/tests/smoke
npx tsc -p ../../tsconfig.smoke.json
```

All three commands should exit with code `0`. Non-zero exit codes indicate which phase failed.

## Troubleshooting

- **`node: SyntaxError` / ESM warnings** – make sure you are on Node ≥18 and run `node unified_shims_runner.js` directly from the smoke directory.
- **`command not found: ts-node`** – install the dev deps once (`npm install`) or run `npx ts-node ...` which downloads a temporary copy.
- **`tsc: not found`** – run `npm install` inside `frontend/src/core/tests/smoke/` to install the dev-only TypeScript dependency shipped with the smoke package.
- **Node not on PATH** – verify `node -v` prints a version; if not, open a new terminal after installing Node or update your PATH manually.

## Exit codes at a glance

- `0` – success
- `1` – general failure (inspect console output)
- `2` / `3` / `4` / `8` – step-specific failures emitted by the JS runner (logger, cache, guarded import)
- `9` – TelemetryGate runtime export missing required helpers
- `10` – TypeScript compile gate failed (`tsc -p ../../tsconfig.smoke.json`)
- `11` – TelemetryGate failed to block metrics when consent was revoked
- `12` – UnifiedState runtime export missing `createUnifiedState` or helpers
- `13` – UnifiedState returned invalid instance from `createUnifiedState`
- `14` – UnifiedState `setState` failed to persist changes
- `15` – UnifiedState `rehydrate` did not merge stored state correctly
- `16` – UnifiedState `resetState` did not restore defaults
- `17` – UnifiedState runtime error (see console for stack trace)
- `18` – LightweightWorkerPool runtime export invalid
- `19` – LightweightWorkerPool exceeded concurrency limit
- `20` – LightweightWorkerPool returned unexpected results
- `21` – LightweightWorkerPool stats validation failed
- `22` – LightweightWorkerPool missing `task_start` metrics event
- `23` – LightweightWorkerPool missing `task_complete` metrics event
- `24` – LightweightWorkerPool timeout scenario did not trigger
- `25` – LightweightWorkerPool runtime error (inspect console output)
- `26` – PredictionValidator missing `validate` export
- `27` – PredictionValidator returned unexpected validation payload
- `28` – PredictionValidator failed to produce normalized output
- `29` – PredictionValidator did not coerce numeric value
- `30` – PredictionValidator did not scale confidence as expected
- `31` – PredictionValidator metadata missing provider information
- `32` – PredictionValidator runtime error (inspect console output)
- `33` – PluginSystem runtime export missing helpers
- `34` – PluginSystem register/setup lifecycle failed
- `35` – PluginSystem enable lifecycle failed
- `36` – PluginSystem disable lifecycle failed
- `37` – PluginSystem reset lifecycle failed
- `38` – PluginSystem runtime error (inspect console output)
- `39` – FeatureComposition runtime export missing helpers
- `40` – FeatureComposition merge returned unexpected result
- `41` – FeatureComposition merge mutated original data
- `42` – FeatureComposition computeTopConfidence returned unexpected value
- `43` – FeatureComposition runtime error (inspect console output)
- `44` – UnifiedMonitor runtime export missing helpers
- `45` – UnifiedMonitor aggregation returned unexpected summary
- `46` – UnifiedMonitor Prometheus export missing expected metrics
- `47` – UnifiedMonitor runtime error (inspect console output)

If problems persist, capture the full console output and attach it to an issue referencing **frontend/core smoke**.
