PR: Stabilize legacy compatibility shim, map instrumentation errors to deterministic 503, and add opt-in LEGACY_DEPRECATION_HINTS

Summary

This PR stabilizes a legacy testing compatibility shim used by PropFinder-related
tests, hardens observability endpoints to return deterministic 503 payloads
when instrumentation calls fail, and implements an opt-in environment flag
LEGACY_DEPRECATION_HINTS to control emission of legacy-shaped deprecation
metadata on health alias endpoints.

Files included in this patch bundle

- backend/routes/testing_compat_shims.py (complete rewritten compat shim)
- backend/routes/observability_routes.py (hardened snapshot/status endpoints)
- backend/middleware/legacy_middleware.py (gated deprecation hints and robust body handling)
- tests/backend/test_legacy_middleware_deprecation_flag.py (new)
- tests/backend/test_health_endpoints.py (modified)
- docs/LEGACY_DEPRECATION_HINTS.md (new)
- CHANGELOG.md (Unreleased entry)

Suggested local application (run from a git-enabled clone):

1. Create branch:
   git checkout -b fix/legacy-shim-observability-503

2. Copy files from patch_bundle into the repository root paths (overwrite files where shown).

3. Run tests locally:
   python -m pytest -q --tb=short

4. Commit and push:
   git add -A
   git commit -m "Stabilize legacy compatibility shim; deterministic observability 503; add LEGACY_DEPRECATION_HINTS opt-in"
   git push --set-upstream origin fix/legacy-shim-observability-503

5. Open PR with this description and assign reviewers as needed.
