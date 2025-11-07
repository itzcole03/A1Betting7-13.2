# Draft PR: refactor/phase-2-consolidation

## Summary

This PR consolidates data services onto canonical unified services (backend and frontend) and includes a small number of low-risk compatibility shims to keep the monorepo testable during the phased migration.

## What's included

- Backend
  - `backend/services/core/unified_data_service.py` remains the canonical unified backend service (no behavior changes in this PR).
  - Compatibility and safety fixes:
    - `backend/routes/bets_routes.py`: replaced a 410 deprecation shim with a minimal compatibility implementation (place bet, closing-update, list) backed by the existing in-memory bet store and CLV helpers so legacy tests and flows continue to work.
    - `backend/core/app.py`: mounted the auth router also at the legacy root path so existing `/auth/*` requests used in tests continue to resolve.
    - `backend/services/auth_service.py`: added a small `AsyncSession.exec` compatibility shim that delegates to `session.scalars(...)` when `exec` is absent so code written for SQLModel's `exec()` keeps working under plain SQLAlchemy AsyncSession test harnesses.
- Frontend
  - `frontend/src/services/unified/UnifiedDataService.ts` implemented earlier in the consolidation (types moved to top-level, helpers adjusted). No new frontend edits in this run.

## Test results

- Full backend pytest suite: 1377 passed, 7 skipped, 0 failed, 213 warnings (run time ~168s). All backend tests pass.

## Why these changes

The repository contained a small number of retired/deleted files and import-level consolidation that left legacy integration tests failing. To progress the consolidation safely we: (1) replaced small deprecated shims with minimal behavior-preserving implementations, and (2) added runtime compatibility shims in narrow, contained places to maintain SQLModel-like session behavior in test environments.

## Risk assessment

- Changes are small and focused. The `exec` shim in `auth_service` is only attached at runtime to session instances that lack `exec` and lives inside the service's session context manager (low blast radius).
- These edits are explicitly intended as temporary compatibility scaffolding to allow phased deletion of legacy code after the test-suite is green. We should decide whether to keep or remove these shims before merging to main.

## Suggested PR checklist

- [ ] Have maintainers review compatibility shim approach (auth_service.\_session).
- [ ] Decide `.bak` file policy and update the PR to delete or retain backup files accordingly.
- [ ] Run full frontend type-check and Jest suites in CI.
- [ ] Optionally add a small regression test asserting the `exec` shim behavior so we don't regress.
- [ ] Remove or transform shims into canonical implementations in a follow-up cleanup PR after team sign-off.

## How to push (local)

If you'd like to push this branch and open a PR from your environment, run:

```bash
git add -A
git commit -m "refactor: consolidate data services (phase 2) + compat shims"
git push origin refactor/phase-2-consolidation
# then open a PR on GitHub (draft) using the web UI or gh cli
```

## Questions / next steps

- Do you want me to: (A) create the PR draft body on GitHub via the gh CLI (requires network and credentials from your environment), (B) open a PR locally and provide the exact command you should run, or (C) continue with a safe `.bak` cleanup plan and prepare the first deletion batch (test-gated)?

If you choose option (C), I will scan for backup files and prepare a small batch (3–10 files) for deletion with tests run after each batch.
