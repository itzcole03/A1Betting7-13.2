Unified shims smoke runner - usage and expected exit codes

Usage (JS):

```bash
cd frontend/src/core/tests/smoke
node unified_shims_runner.js
```

Usage (TS):

```bash
cd frontend/src/core/tests/smoke
npx ts-node unified_shims_runner.ts
```

Exit codes:

- 0: success (all runtime assertions passed or TS sources present and checks skipped)
- 2-8: failures at various assertion steps (see runner logs for details)
- 9: TelemetryGate export missing expected helpers
- 10: focused TypeScript compile (`npx tsc -p ../../tsconfig.smoke.json`) failed
- 11: TelemetryGate failed to block metrics when consent was revoked

Notes:

- Runner will detect TS source files and skip runtime assertions to avoid false negatives when compiled JS is not present.
- Favor the JS runner in CI for fast deterministic checks; run the TS runner in developer environments when `ts-node` is available.
- If `ts-node` is missing, install the dev dependencies in this folder (`npm install`) or invoke `npx ts-node ...` which downloads a throwaway copy.
- `npm run test:smoke` mirrors the JS runner, and `npm run test:smoke:ts` executes the ts-node variant.
