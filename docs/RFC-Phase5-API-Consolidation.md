# RFC — Phase 5: API Consolidation

## Context
After Phase 4 API contract cleanup, the backend is now 100% compliant.
We must now consolidate duplicate endpoints, improve maintainability, and ensure full documentation coverage.

## Goals
1. Reduce redundant route definitions
2. Improve discoverability of API functionality
3. Generate accurate OpenAPI documentation

## Scope
- Merge admin-related logic into `/backend/routes/admin.py`
- Group model prediction routes under `/backend/routes/predictions.py`
- Ensure all routes are imported into `backend/main.py` through a central `router`

## Deliverables
- Updated backend route structure
- Updated `API_AUDIT_REPORT.md` with:
  - Before/after file map
  - Updated API endpoint list
  - Notes on deprecated endpoints
- Regenerated OpenAPI spec
- PR with commit history showing file merges + endpoint refactoring

## Non-Goals
- Major frontend changes (out of scope for this RFC)
- Reworking business logic (focus is structural cleanup)

## Success Criteria
- All endpoints reachable at expected paths
- `pytest` integration tests pass
- OpenAPI spec validates successfully
