# A1Betting8.13 — Development Roadmap Checklist (Phase 5+)

This roadmap is optimized for execution by the GitHub Copilot agent.
Each task should be completed in order, committed separately, and marked as complete.

---

## ✅ Phase 1: API Contract Compliance (DONE)
- [x] Scan all `backend/routes/` for violations
- [x] Replace `HTTPException` → `BusinessLogicException` / `AuthenticationException`
- [x] Enforce `response_model=StandardAPIResponse[...]` on all endpoints
- [x] Standardize all returns to `ResponseBuilder.success()` or `.error()`

---

## 🚀 Phase 2: Backend Refinement & Optimization

### 2.1 — Type Safety & Hints
- [x] Add strict type hints to **all** functions in:
  - [x] `backend/services/`
  - [x] `backend/core/`
  - [x] `backend/models/`
  - [x] `backend/utils/`
- [ ] Fix any `Any` types where a concrete type can be used
- [x] Add `from __future__ import annotations` to all backend Python files

### 2.2 — Response & Error Consistency
- [x] Audit `BusinessLogicException` error codes for duplicates / unclear naming
- [x] Consolidate into `backend/constants/error_codes.py`
- [x] Add automated test to validate all API error codes are unique

### 2.3 — Performance & Caching
- [x] Review all `@lru_cache` and `cache.set()` calls
- [x] Implement Redis caching for:
  - [x] Frequently accessed read-only endpoints
  - [x] Model prediction results with TTL
- [x] Add cache invalidation logic on relevant data updates

---

## 🎨 Phase 3: Frontend Enhancements (React + Vite + Tailwind)

### 3.1 — State Management Review
- [ ] Audit Zustand store usage in:
  - [ ] `frontend/src/store/filters.ts`
  - [ ] `frontend/src/store/predictions.ts`
- [ ] Remove unused slices
- [ ] Merge overlapping store logic into centralized `usePredictionStore`

### 3.2 — Component Optimization
- [ ] Replace heavy components with lazy-loaded versions:
  - [ ] Prediction tables
  - [ ] SHAP explainability view
- [ ] Extract shared UI elements into `/components/common/`

### 3.3 — UI/UX Consistency
- [ ] Enforce design tokens from `/frontend/src/styles/tokens.css`
- [ ] Standardize button sizes, colors, and variants
- [ ] Add loading & error states for all API-driven components

---

## 📊 Phase 4: Testing & CI/CD

### 4.1 — Backend Tests
- [ ] Add integration tests for:
  - [ ] Authentication routes
  - [ ] Prediction engine routes
  - [ ] Portfolio optimization routes
- [ ] Add contract tests to ensure API responses match `StandardAPIResponse`

### 4.2 — Frontend Tests
- [ ] Add Vitest + React Testing Library tests for:
  - [ ] Filters
  - [ ] Predictions display
  - [ ] Error boundaries

### 4.3 — CI/CD
- [ ] Update GitHub Actions workflow:
  - [ ] Run lint, type-check, tests on PR
  - [ ] Cache dependencies for faster builds
  - [ ] Deploy to staging after passing checks

---

## 📦 Phase 5: API Consolidation & Documentation

- [ ] Merge duplicate backend route files where possible
- [ ] Consolidate admin-related routes into `/backend/routes/admin.py`
- [ ] Update `API_AUDIT_REPORT.md` with final architecture diagram
- [ ] Generate OpenAPI spec and publish at `/docs/openapi.json`
