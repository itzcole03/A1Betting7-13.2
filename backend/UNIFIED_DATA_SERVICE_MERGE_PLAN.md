# Backend Merge Plan — unified_data_service consolidation

Goal

- Ensure `backend.services.core.unified_data_service` is the canonical implementation for all data flows.
- Remove or deprecate legacy entrypoints safely and update callers.

High-level approach

1. Inventory
   - Find any imports/callers referencing legacy entrypoints (`backend.services.real_data_service`, `backend.services.optimized_data_service`, etc.).
   - Find callers using the unified public wrapper `backend.services.unified_data_service` (this is the preferred entrypoint).
2. Safety shims
   - Keep existing deprecated stubs that raise on import to force fast detection of lingering usage (we already have `backend/services/real_data_service.py` raising ImportError).
   - If removal must be staged, replace raising stub with a thin shim that delegates to `unified_data_service` and emits a deprecation warning (use for a short migration window).
3. Tests & Validation
   - Run full backend unit tests (pytest -q). Fix failing tests by updating imports to unified facade.
   - Add new tests that assert the unified facade API matches expected legacy semantics for critical endpoints (player data, optimized engine, real betting opps).
4. Incremental migration
   - For each package that currently imports a legacy module (if any), update to import from `backend.services.unified_data_service`.
   - Commit in small batches (2-5 files), run tests after each batch.
5. Cleanup
   - Once no imports remain and tests pass, delete the deprecated stub files.
   - Run codebase lint/type checks and pytests one final time.
6. Deployment & Monitoring
   - Deploy to staging. Exercise key endpoints (propfinder, real betting feed, optimized player fetch) and monitor logs/metrics.
   - Rollout to production after smoke verification.

Backwards-compatibility & rollback

- Keep a short-lived compatibility shim (deprecated) that logs and delegates to unified facade.
- If regression discovered in staging, revert the small PR(s) that changed imports; the shim keeps behavior working.

Checklist & commands

- Inventory callers (run from repo root):

  grep -R "backend.services.real_data_service" -n || true
  grep -R "backend.services.optimized_data_service" -n || true
  grep -R "from backend.services.unified_data_service" -n || true

- Run backend tests (prefer running targeted tests first):

  # Run all backend tests (can be slow)

  python -m pytest backend -q

  # Focused test run examples

  python -m pytest backend/tests/test_query_optimizer.py -q --maxfail=1

- Migration flow for a batch of files:

  1. Create branch `unified-merge/backend-step-<n>`
  2. Replace legacy import(s) with `from backend.services import unified_data_service as uds` or direct functions from `backend.services.unified_data_service`
  3. Run unit tests covering changed modules
  4. Push PR with clear description and tests run

- Removal flow when safe:
  1. Ensure no references to `backend.services.real_data_service` or `optimized_data_service` with `git grep`.
  2. Delete the stub file(s) and run tests.
  3. Bump changelog and include migration note.

Risk assessment

- High-risk areas: any code that interacts with the optimized real-time service (`OptimizedRealTimeDataService`) — optional deps and environment differences can cause runtime errors.
- Mitigations: keep real-time code guarded behind configuration flags, run in staging with the same infra (Redis, etc.).

Next actions I can take now (choose one or more):

- Run the backend test suite (or focused tests) locally and report failures.
- Search the codebase for lingering legacy imports and produce a precise list.
- Create thin compatibility shims for any legacy modules that are still imported (non-throwing, delegating to unified facade) to ease migration.
- Start a small batch of import updates (2-4 files) and run tests after changes.

If you want me to proceed automatically, tell me which of the "Next actions" to execute first. If you prefer a conservative approach, I'll run the inventory and tests and report findings before modifying any backend files.
