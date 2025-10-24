# Frontend core contributor checklist

## Before you edit

- Run the baseline smoke check: `cd frontend/src/core/tests/smoke && node unified_shims_runner.js`
- (Optional) run the TypeScript variant: `npx ts-node unified_shims_runner.ts`
- Skim `CI/local_run_instructions.md` if you hit environment errors (missing `ts-node`, Node not on PATH, etc.)

## While touching shims

- Keep the public surface tiny:
  - Logger → `getLogger(name)` returning `{debug, info, warn, error}`
  - Cache → `set/get/delete/has/clear/size` with optional TTL
  - Guarded import → `guardedImport(modulePath, { fallback?, timeoutMs? })`
  - Telemetry gate → `isTelemetryAllowed(context)` plus `setTelemetryConsent(value)` for global toggles
- Extend `tests/smoke/unified_shims_runner.(js|ts)` to cover new behaviour
- Update `PROJECT_CORE_TODO.md` with any deferred work or follow-up owners

## PR checklist

- ✅ `node unified_shims_runner.js`
- ✅ `npx ts-node unified_shims_runner.ts`
- ✅ `npx tsc -p ../../tsconfig.smoke.json` (from the smoke folder)
- 📄 Docs touched if needed:
  - `README.shims_quickstart.md`
  - `CI/local_run_instructions.md`
  - `docs/README.legal.md` (only if data/fixtures policy changes)
- 🔗 Reference the CI quickcheck job (`shims_quickcheck`) in your PR description
- 🧾 Note any new smoke assertions or TODO items introduced

Helpful links: `README.shims_quickstart.md`, `CI/local_run_instructions.md`, `tests/smoke/unified_shims_runner_instructions.md`, `docs/README.legal.md`.
