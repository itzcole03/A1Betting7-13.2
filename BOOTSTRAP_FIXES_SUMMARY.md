# Bootstrap and Import-Time Failure Fixes

## Summary

This document summarizes the fixes applied to resolve bootstrap and import-time failures that were preventing proper route registration and causing the application to fall back to minimal compatibility shims.

## Issues Addressed

### 1. Syntax Errors in `lazy_sport_manager.py`

**Problem:** Invalid import statement syntax causing module import failures.

**Location:** `backend/services/lazy_sport_manager.py` (lines 346, 401, 420, 439)

**Error:**
```python
from backend.services.ml.ml_service import backend.services.ml.ml_service
```

**Fix:**
```python
from backend.services.ml.ml_service import enhanced_ml_service
```

**Impact:** This syntax error was preventing the sports services from initializing on startup, causing warnings like "Could not initialize sports services on startup: invalid syntax (lazy_sport_manager.py, line 346)" and missing expected endpoints (e.g., `/api/v2/sports/activate`).

**Files Modified:**
- `backend/services/lazy_sport_manager.py` (4 instances fixed)

---

### 2. Database Initialization Issues in `odds_store.py`

**Problem:** When SQLAlchemy is not available, the code was attempting to instantiate `Any` placeholders and call `select()` with them, causing `TypeError` and `ArgumentError` exceptions.

**Location:** `backend/services/odds_store.py`

**Fixes Applied:**

1. **`initialize_bookmakers` method (line 138):** Added guard to skip DB operations when SQLAlchemy is unavailable
2. **`store_odds_snapshot` method (line 194):** Added guard to skip odds snapshot storage
3. **`get_best_line` method (line 296):** Added guard to skip best line lookup
4. **`get_line_movement` method (line 417):** Added guard to skip line movement lookup
5. **`detect_steam_moves` method (line 503):** Added guard to skip steam move detection
6. **`create_enhanced_bookmaker_response` function (line 854):** Fixed OddsNormalizer instantiation check from `if OddsNormalizer` to `if OddsNormalizer is not None`

**Example Guard Pattern:**
```python
if not SQLALCHEMY_AVAILABLE:
    self.logger.warning("SQLAlchemy not available, skipping bookmaker initialization")
    return []
```

**Impact:** These runtime failures were causing the app to exit or leave background loops cancelling. The guards ensure graceful degradation when database dependencies are missing.

**Files Modified:**
- `backend/services/odds_store.py` (6 fixes)

---

### 3. File Corruption in `optimized_intelligent_caching_service.py`

**Problem:** The file had corrupted/duplicated content with indentation errors and unreachable code that referenced `logger` without importing it.

**Location:** `backend/services/optimized_intelligent_caching_service.py`

**Error:**
```
IndentationError: unexpected indent (optimized_intelligent_caching_service.py, line 29)
```

**Fix:** Rewrote the file as a clean minimal shim, removing all corrupted code fragments.

**Impact:** This file was causing import-time failures and preventing modules that depend on it from loading properly.

**Files Modified:**
- `backend/services/optimized_intelligent_caching_service.py` (complete rewrite)

---

## Verification

All modified files pass Python syntax compilation:

```bash
python3.11 -m py_compile \
  backend/services/lazy_sport_manager.py \
  backend/services/odds_store.py \
  backend/services/optimized_intelligent_caching_service.py
```

**Result:** ✓ All files compile successfully

---

## Expected Outcomes

After these fixes, the following improvements should be observed:

1. **Route Registration:** Opportunities routes, EV Feed routes, and PropFinder routes should register successfully without "name 'Field' is not defined" or "name 'logger' is not defined" errors.

2. **Bootstrap Validation:** The bootstrap validator should report fewer errors, and the app should not print "2 errors found during bootstrap validation" messages.

3. **Stable Startup:** The app should start reliably without runtime exceptions from odds_store.py or lazy_sport_manager.py.

4. **Graceful Degradation:** When SQLAlchemy or other optional dependencies are missing, the app will log warnings but continue operating with reduced functionality instead of crashing.

---

## Next Steps

1. **Frontend Fixes:** Clear the debug snapshot from localStorage (`propfinder.debug_snapshot`) to force the UI to call the backend instead of using mock data.

2. **Logging Configuration:** For local development on Windows, consider using a single backend instance (no `--reload`) or switch to console-only logging to avoid file rotation `PermissionError` issues.

3. **Dependency Installation:** Install missing optional dependencies (SQLAlchemy, pydantic-settings, etc.) to enable full functionality.

4. **Testing:** Run the application startup and verify that:
   - No import-time errors appear in logs
   - All expected routes are registered
   - Bootstrap validation passes
   - The PropFinder provider returns live data instead of shims

---

## Files Changed Summary

| File | Lines Changed | Type of Fix |
|------|---------------|-------------|
| `backend/services/lazy_sport_manager.py` | 4 | Syntax error (import statement) |
| `backend/services/odds_store.py` | 6 | Runtime guards for missing dependencies |
| `backend/services/optimized_intelligent_caching_service.py` | Full rewrite | File corruption / indentation errors |

---

**Date:** 2025-11-08  
**Author:** Automated Fix via Manus Agent
