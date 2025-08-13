# Backend API Audit Report

_Audit Date: 2025-08-13_  
**Legacy Cleanup Phase:** Active

## Systematic Legacy Route Cleanup Status

**Total Baseline Violations:** 862  
**Critical Violations:** 479  
**Files with Violations:** 60/62 (3.2% compliance rate)

### Top 5 Violating Files (Batch Cleanup Priority)
| File | Total Violations | Critical | Status |
|------|------------------|----------|---------|
| phase3_routes.py | 45 | 31 | � **Partial** (imports updated, 31 HTTPException + 14 returns remaining) |
| modern_ml_routes.py | 34 | 17 | ⏳ Pending |
| security_routes.py | 33 | 26 | ⏳ Pending |
| propollama.py | 30 | 15 | ⏳ Pending |
| priority2_realtime_routes.py | 29 | 14 | ⏳ Pending |

**Conversion Progress:** 0.5/5 files completed (phase3_routes.py partially complete)

---

### Phase 3 Routes Progress (Partially Complete)

**File:** `backend/routes/phase3_routes.py`  
**Initial Violations:** 45 (31 critical)  
**Current Status:** ✅ Imports updated, ⏳ HTTPExceptions remain  

**Completed:**
- ✅ Added standardized imports (ResponseBuilder, StandardAPIResponse, BusinessLogicException)
- ✅ Fixed request.client.host typing issue  
- ✅ File is syntactically valid and importable

**Remaining Work:**
- 🔄 Convert 31 HTTPException usages → BusinessLogicException patterns
- 🔄 Convert 14 non-standard returns → ResponseBuilder.success() patterns
- 🔄 Add response_model=StandardAPIResponse[T] to endpoints missing it
- 🔄 Add comprehensive docstrings with type information

**Next Steps:**
1. Complete phase3_routes.py conversion
2. Run contract test to verify 0 violations
3. Move to modern_ml_routes.py (34 violations)

---

## 1. API Route Inventory & Status

| Method | Path                         | Filename                 | Status     | Docstring | Type Hints | Request Validation | Response Format | Notes                                                 |
| ------ | ---------------------------- | ------------------------ | ---------- | --------- | ---------- | ------------------ | --------------- | ----------------------------------------------------- |
| GET    | /analysis                    | unified_api.py           | Complete   | Yes       | Partial    | No                 | Inconsistent    | Returns dict, lacks type hints, no request validation |
| POST   | /debug/flush-redis-cache     | unified_api.py           | Complete   | Yes       | No         | No                 | Consistent      | Simple dict response                                  |
| GET    | /props/featured              | unified_api.py           | Complete   | Yes       | No         | No                 | Inconsistent    | Returns JSONResponse, lacks type hints                |
| GET    | /mlb-bet-analysis            | unified_api.py           | Complete   | Yes       | Yes        | Yes                | Consistent      | Uses response_model                                   |
| POST   | /unified/batch-predictions   | unified_api.py           | Complete   | Yes       | Yes        | No                 | Inconsistent    | Returns dict, errors as list of dicts                 |
| GET    | /portfolio-optimization      | unified_api.py           | Incomplete | Yes       | Partial    | No                 | Stub            | Returns {"status": "not implemented"}                 |
| GET    | /ai-insights                 | unified_api.py           | Complete   | Yes       | Yes        | No                 | Consistent      | Returns dict                                          |
| GET    | /live-context/{game_id}      | unified_api.py           | Complete   | Yes       | Yes        | No                 | Consistent      | Returns dict                                          |
| GET    | /multi-platform              | unified_api.py           | Complete   | Yes       | Yes        | No                 | Consistent      | Returns dict                                          |
| GET    | /health                      | unified_api.py           | Complete   | Yes       | Yes        | No                 | Inconsistent    | Returns dict, sometimes error as string               |
| GET    | /props                       | unified_api.py           | Complete   | No        | No         | No                 | Inconsistent    | Alias, returns JSONResponse                           |
| POST   | /predictions                 | unified_api.py           | Complete   | No        | No         | No                 | Inconsistent    | Alias, returns batch_predictions                      |
| GET    | /predictions                 | unified_api.py           | Complete   | Yes       | No         | No                 | Consistent      | Returns dict                                          |
| GET    | /analytics                   | unified_api.py           | Complete   | No        | No         | No                 | Inconsistent    | Alias, fallback returns dict with error as string     |
| GET    | /admin/rules-audit-log       | admin.py                 | Complete   | Yes       | No         | No                 | Inconsistent    | Returns list, no error handling                       |
| POST   | /admin/reload-business-rules | admin.py                 | Complete   | Yes       | No         | No                 | Inconsistent    | Returns dict, error as string                         |
| POST   | /activate                    | sports_routes.py         | Complete   | Yes       | Yes        | Yes                | Consistent      | Returns dict                                          |
| GET    | /                            | unified_sports_routes.py | Complete   | Yes       | No         | No                 | Consistent      | Returns dict                                          |
| GET    | /health                      | unified_sports_routes.py | Complete   | Yes       | No         | No                 | Consistent      | Returns dict                                          |
| GET    | /odds/unified                | unified_sports_routes.py | Complete   | Yes       | No         | No                 | Consistent      | Returns dict                                          |
| GET    | /{sport}/teams               | unified_sports_routes.py | Complete   | Yes       | No         | No                 | Consistent      | Returns dict                                          |
| GET    | /{sport}/players             | unified_sports_routes.py | Complete   | Yes       | No         | No                 | Consistent      | Returns dict                                          |
| GET    | /{sport}/games               | unified_sports_routes.py | Complete   | Yes       | No         | No                 | Consistent      | Returns dict                                          |
| GET    | /{sport}/games/today         | unified_sports_routes.py | Complete   | Yes       | No         | No                 | Consistent      | Returns dict                                          |
| GET    | /{sport}/odds                | unified_sports_routes.py | Complete   | Yes       | No         | No                 | Consistent      | Returns dict                                          |
| GET    | /{sport}/health              | unified_sports_routes.py | Complete   | Yes       | No         | No                 | Consistent      | Returns dict                                          |
| GET    | /analytics/summary           | unified_sports_routes.py | Complete   | Yes       | No         | No                 | Consistent      | Returns dict                                          |
| GET    | /trending-suggestions        | trending_suggestions.py  | Complete   | Yes       | Yes        | No                 | Inconsistent    | Returns list, fallback is list of dicts               |
| POST   | /calculate                   | advanced_kelly_routes.py | Complete   | Yes       | Yes        | Yes                | Consistent      | Uses response_model                                   |
| POST   | /portfolio-optimization      | advanced_kelly_routes.py | Complete   | Yes       | Yes        | Yes                | Consistent      | Uses response_model                                   |
| GET    | /portfolio-metrics           | advanced_kelly_routes.py | Complete   | Yes       | Yes        | No                 | Consistent      | Uses response_model                                   |
| GET    | /risk-management             | advanced_kelly_routes.py | Complete   | Yes       | Yes        | No                 | Consistent      | Uses response_model                                   |
| POST   | /risk-management/update      | advanced_kelly_routes.py | Complete   | Yes       | Yes        | Yes                | Consistent      | Returns dict                                          |
| POST   | /bankroll/update             | advanced_kelly_routes.py | Complete   | Yes       | Yes        | Yes                | Consistent      | Returns dict                                          |
| GET    | /bankroll/history            | advanced_kelly_routes.py | Complete   | Yes       | Yes        | No                 | Consistent      | Returns dict                                          |
| GET    | /simulation                  | advanced_kelly_routes.py | Complete   | Yes       | Yes        | Yes                | Consistent      | Returns dict                                          |
| GET    | /status                      | advanced_kelly_routes.py | Complete   | Yes       | Yes        | No                 | Consistent      | Returns dict                                          |
| POST   | /kelly/calculate             | risk_tools_routes.py     | Complete   | Yes       | Yes        | Yes                | Consistent      | Uses response_model                                   |
| POST   | /kelly/fractional            | risk_tools_routes.py     | Complete   | Yes       | Yes        | Yes                | Consistent      | Returns dict                                          |
| POST   | /kelly/simulate              | risk_tools_routes.py     | Complete   | Yes       | Yes        | Yes                | Consistent      | Returns dict                                          |
| POST   | /kelly/optimal-fraction      | risk_tools_routes.py     | Complete   | Yes       | Yes        | Yes                | Consistent      | Returns dict                                          |
| POST   | /sessions/save               | risk_tools_routes.py     | Complete   | Yes       | Yes        | Yes                | Consistent      | Returns dict                                          |
| GET    | /sessions                    | risk_tools_routes.py     | Complete   | Yes       | Yes        | No                 | Consistent      | Returns dict                                          |
| GET    | /stats                       | risk_tools_routes.py     | Complete   | Yes       | Yes        | No                 | Consistent      | Returns dict                                          |
| GET    | /tools/odds-converter        | risk_tools_routes.py     | Complete   | Yes       | Yes        | No                 | Consistent      | Returns dict                                          |
| GET    | /health                      | risk_tools_routes.py     | Complete   | Yes       | Yes        | No                 | Consistent      | Returns dict                                          |
| POST   | /explain                     | shap.py                  | Complete   | Yes       | Yes        | Yes                | Consistent      | Uses response_model                                   |
| GET    | /features                    | shap.py                  | Complete   | Yes       | Yes        | No                 | Consistent      | Returns dict                                          |
| POST   | /batch-explain               | shap.py                  | Complete   | Yes       | Yes        | Yes                | Consistent      | Returns list                                          |

## 2. Inconsistent Response Formats & Recommendations

### Common Issues

- Some endpoints return plain dicts, lists, or strings instead of a standard JSON contract.
- Error responses are sometimes plain strings, lists, or dicts with "error" fields, not a unified structure.
- Fallbacks and stubs (e.g., /portfolio-optimization) return minimal or placeholder responses.
- Type hints and response models are missing in many endpoints.
- Request validation is inconsistent (some endpoints accept raw dicts, others use Pydantic models).

### Recommended Standard Response Contract

All endpoints should return:

```json
{
  "success": boolean,
  "data": any,
  "error": { "code": string, "message": string } | null
}
```

### Standardization: Batch 1 Changelog (2025-08-12)

| Endpoint Path                | File Name                       | Changes Made                                                                               |
| ---------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------ |
| /admin/rules-audit-log       | admin.py                        | Standardized response (ok), raised exceptions, added type hints, docstring, response_model |
| /admin/reload-business-rules | admin.py                        | Standardized response (ok), raised exceptions, added type hints, docstring, response_model |
| /trending-suggestions        | trending_suggestions.py         | Standardized response (ok), raised exceptions, added type hints, docstring, response_model |
| /trending-suggestions        | trending_suggestions.py         | Removed broken async/HTTPX code, deduplicated endpoint, fixed function signature           |
|                              | tests/test_response_contract.py | Added happy-path and error-path tests for both endpoints                                   |

#### Before (Inconsistent)

```python
@router.get("/health")
async def get_unified_health():
    ...
    return {"status": "error", "error": str(e), "overall_status": "DEGRADED"}
```

#### After (Standardized)

```python
@router.get("/health")
async def get_unified_health():
    ...
    if error:
        return {
            "success": False,
            "data": None,
            "error": {"code": "INTERNAL_ERROR", "message": str(e)}
        }
    return {
        "success": True,
        "data": health_status,
        "error": None
    }
```

#### Before (Plain List)

```python
@router.get("/admin/rules-audit-log")
def get_rules_audit_log(...):
    ...
    return entries
```

#### After (Standardized)

```python
@router.get("/admin/rules-audit-log")
def get_rules_audit_log(...):
    ...
    return {
        "success": True,
        "data": entries,
        "error": None
    }
```

#### Before (Fallback Error)

```python
return {"status": "error", "message": f"Failed to reload business rules: {e}", "timestamp": ...}
```

#### After (Standardized)

```python
return {
    "success": False,
    "data": None,
    "error": {"code": "RELOAD_FAILED", "message": str(e)}
}
```

## 3. Error Handling Audit

- Many endpoints use plain strings or dicts for errors (e.g., {"error": str(e)}).
- Some endpoints return HTTPException with only a string message.
- Recommend using centralized error handler: `backend/exceptions/handlers.py` for all error responses.
- All error responses should follow the standard contract above.

## 4. Stub/Incomplete Endpoints

- `/portfolio-optimization` (unified_api.py): Returns {"status": "not implemented"} — needs full implementation.
- Any endpoint returning only status or message should be updated to return full contract.

## 5. Summary Table

- See above for full table. Most endpoints are complete but lack type hints and consistent response formatting.
- Key improvements:
  - Add/expand type hints and response models.
  - Use Pydantic models for all requests and responses.
  - Standardize error handling and response contract.
  - Document all endpoints with docstrings.

## 6. Code Pattern for Improved Endpoints

```python
from backend.exceptions.handlers import handle_error
from fastapi import HTTPException

@router.get("/example")
async def example_endpoint():
    try:
        data = ... # business logic
        return {"success": True, "data": data, "error": None}
    except Exception as e:
        error_info = handle_error(e, message="Failed to fetch example")
        return {"success": False, "data": None, "error": {"code": error_info.code, "message": error_info.user_message}}
```

---

**Next Steps:**

- Refactor endpoints to use the standard contract and centralized error handler.
- Add missing type hints and request/response models.
- Ensure all endpoints have docstrings and validation.
- Unify error responses and document all API contracts for frontend integration.

_Audit performed by GitHub Copilot, August 2025._
