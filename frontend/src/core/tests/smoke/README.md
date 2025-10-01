# Core shims smoke tests

Small, fast smoke checks for the frontend `core` shims. The goal is a quick runtime smoke (Node) and an optional focused TypeScript check that produce deterministic triage artifacts under `reports/`.

## Quick local run (recommended)

From the repository root:

```bash
# Run the reporter which executes the Node smoke and focused tsc and writes reports/
node frontend/src/core/tests/smoke/smoke_reporter.cjs

# Or from the frontend folder via npm script
cd frontend && npm run smoke:report
```

## What the reporter does

- Runs `unified_shims_runner.js` (fast Node smoke exercising UnifiedCache, UnifiedLogger, GuardedImport) and writes its stdout to `reports/shims_quickcheck/unified_shims_runner.txt`.
- Runs a focused `tsc` using `src/core/tsconfig.smoke.json` and writes output to `reports/ts_triage/frontend-guarded-import-smoke.txt`.
- Writes a concise JSON summary to `reports/shims_quickcheck_summary.json` with exit codes, durations and error counts for CI parsing.

## CI

- A GitHub Actions workflow (included in the repo) invokes the reporter and uploads the `reports/` directory as build artifacts for triage.

If you need to extend the smoke projection, edit `src/core/tsconfig.smoke.json` and add additional files to `include`.

## Notes

- The focused TypeScript projection is intentionally small to avoid repository-wide noise and keep the gate fast and deterministic.
- The reporter exits with non-zero if either the Node smoke or tsc smoke fails.
