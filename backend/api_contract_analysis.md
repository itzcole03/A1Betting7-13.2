# API Contract Standardization Analysis

## Current Contract Patterns Analysis

Based on inventory of `backend/routes/`, I've identified several contract patterns that need standardization:

### 🔴 Contract Violations Found

#### 1. **enhanced_api.py** - Mixed Patterns
- ✅ **Good**: Some endpoints use standardized return format: `{"message": "...", "status": "success"}`
- ❌ **Bad**: Direct HTTPException raises without standard format
- ❌ **Bad**: Some returns lack error handling wrapper
- **Sample Issues**:
  ```python
  # VIOLATION: Direct dict return without standard contract
  return {
      "message": "Enhanced API router is working",
      "status": "success", 
      "router_prefix": "/v1",
  }
  
  # VIOLATION: Direct HTTPException without standard format
  raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail="Registration failed",
  )
  ```

#### 2. **production_health_routes.py** - JSONResponse Pattern
- ❌ **Bad**: Uses `JSONResponse(content=data)` instead of standard format
- ❌ **Bad**: Direct error returns in content without raises
- **Sample Issues**:
  ```python
  # VIOLATION: Direct JSONResponse without standard contract
  return JSONResponse(content=health_data)
  
  # VIOLATION: Error handling in return instead of raise
  return JSONResponse(
      content={"status": "error", "error": str(e)}, status_code=500
  )
  ```

#### 3. **unified_api.py** - Partially Standard
- ✅ **Good**: Uses `ok()` wrapper for success cases
- ❌ **Bad**: Custom exception classes but inconsistent usage
- ❌ **Bad**: Some endpoints still return raw dicts
- **Sample Issues**:
  ```python
  # VIOLATION: Missing error handling wrapper
  raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail=f"Failed to generate MLB bet analysis: {str(e)}",
  ) from e
  ```

#### 4. **optimized_api_routes.py** - Custom APIResponse
- ❌ **Bad**: Uses custom `APIResponse` class instead of standard format
- ❌ **Bad**: Direct HTTPException raises
- **Sample Issues**:
  ```python
  # VIOLATION: Custom response format instead of standard
  return APIResponse(
      data=performance_data,
      message="ML performance analytics retrieved successfully"
  )
  ```

### 📊 Contract Pattern Summary

| Route File | Current Pattern | Compliance | Priority |
|------------|----------------|------------|----------|
| enhanced_api.py | Mixed dict/HTTPException | 30% | HIGH |
| production_health_routes.py | JSONResponse | 10% | HIGH |  
| unified_api.py | ok()/CustomExceptions | 60% | HIGH |
| optimized_api_routes.py | APIResponse class | 20% | HIGH |
| optimized_routes.py | TBD | TBD | MED |
| optimized_real_time_routes.py | TBD | TBD | MED |

### 🎯 Target Standard Contract

All endpoints should return:
```python
# SUCCESS CASE
{
    "success": True,
    "data": <actual_data>,
    "error": None,
    "meta": {
        "timestamp": "2025-01-14T10:30:00Z", 
        "processing_time_ms": 45.2,
        "version": "1.0.0"
    }
}

# ERROR CASE (via raised exception that gets handled by middleware)
{
    "success": False,
    "data": None, 
    "error": {
        "code": "BUSINESS_LOGIC_ERROR",
        "message": "User-friendly error message",
        "details": "Technical details for debugging"
    },
    "meta": {
        "timestamp": "2025-01-14T10:30:00Z",
        "version": "1.0.0"
    }
}
```

### 🔧 Required Changes Summary

1. **Create standard response wrapper functions**
2. **Add global exception handler middleware** 
3. **Replace all direct returns with standard format**
4. **Replace all direct HTTPException raises with custom exceptions**
5. **Add response_model annotations to all endpoints**
6. **Ensure all docstrings follow standard format**

## Next Steps

1. Create standard response models and wrappers
2. Implement global exception handler middleware
3. Patch hotspot routes first
4. Create comprehensive test suite
5. Run acceptance validation
