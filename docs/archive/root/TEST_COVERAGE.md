# TEST_COVERAGE.md

## A1Betting7-13.2 Test Coverage Summary (2025)

This document tracks the current state of test coverage for backend, frontend, and ML/data modules as part of the modernization initiative.

---

### Backend Test Coverage

- **Pytest Coverage:**
  - All unified services (`unified_data_fetcher`, `unified_cache_service`, `unified_error_handler`, `unified_logging`, `unified_config`) have dedicated Pytest suites.
  - ML/data pipeline stages (data ingestion, preprocessing, model training, inference, caching) are covered by modular Pytest tests.
  - Circuit breaker, async resource management, and batch processing patterns are validated in `test_circuit_breaker.py`, `test_async_patterns.py`, `test_resource_management.py`, and `test_batch_processing.py`.
  - Final system validation in `test_final_validation.py`.
  - **Coverage Goal:** 90%+ for all backend modules.

---

### Frontend Test Coverage

- **Jest/Playwright Coverage:**
  - All modular components and containers (e.g., `MLModelCenter.tsx`) have Jest unit tests and Playwright E2E tests.
  - State management hooks and service registry patterns are covered by dedicated tests.
  - Virtualization logic and UI/UX features are validated for performance and correctness.
  - **Coverage Goal:** 90%+ for all frontend modules.

---

### ML/Data Module Test Coverage

- **Pytest Coverage:**
  - Model factory/configuration patterns, async/await compliance, and error boundaries are covered by Pytest suites.
  - Docstring and architectural note validation included in test rationale.
  - Legacy code and migration rationale are referenced in test documentation.
  - **Coverage Goal:** 90%+ for all ML/data modules.

---

### Coverage Tracking & Next Steps

- All new and refactored modules must be added to this document.
- Coverage reports should be updated after each major release or refactor.
- Any legacy code blocks must be documented with test rationale and migration notes.
- **Next Audit:** Scheduled for September 2025.

---

---

## Repository Modernization Checklist (2025)

This section tracks actionable modernization items for the A1Betting7-13.2 codebase, based on audit findings and architectural goals. Items are organized by action type and priority for assignment and ongoing review.

### Phase 1: High-Priority Refactor & Rewire

- **Refactor**

  - `backend/services/legacy_*`: Replace legacy services with unified services for maintainability and performance.
  - `frontend/src/components/PropOllamaUnified.tsx`: Modularize monolithic component into container/component pattern.
  - `backend/routes/mlb_extras.py`: Refactor for async/await compliance and modular endpoint structure.
  - `frontend/src/hooks/usePropOllamaState.ts`: Ensure state management follows best practices and is fully covered by tests.
  - `backend/services/comprehensive_prop_generator.py`: Refactor for lazy enterprise service initialization and graceful fallbacks.

- **Rewire**
  - All direct API fetches in frontend: Replace with calls to `MasterServiceRegistry.getInstance().getService('data')`.
  - Backend service imports: Standardize on unified service imports and try/except fallback patterns.

### Phase 2: Restructure & Remove

- **Restructure**

  - Move any duplicate or redundant service files to `cleanup_archive/`.
  - Organize frontend components into modular directories: `containers/`, `filters/`, `sorting/`, `lists/`, `betting/`, `ml/`, `user-friendly/`.

- **Remove**
  - `frontend/src/components/monolithic_PropOllama.tsx`: Superseded by modular components.
  - `backend/services/old_cache_service.py`, `backend/services/old_data_fetcher.py`: Replaced by unified services.
  - Any unused test files or scripts not referenced in this document.

### Phase 3: Documentation, Tests, Architectural Review

- **Other Actions**
  - Update `README.md`, `API_DOCUMENTATION.md`, and architectural docs to reflect unified services and modular frontend.
  - Add/expand tests for new/refactored modules (see coverage goals above).
  - Review and update docstrings, type annotations, and architectural notes in backend ML/data modules.
  - Schedule architectural review for new enterprise features (Phase 3 MLOps, arbitrage, trading interface).

---

**Assignment & Tracking:**

- Use this checklist to assign items to contributors and track modernization progress alongside test coverage.

**Status:** All major modules are covered; ongoing improvements and modernization will be tracked here.
