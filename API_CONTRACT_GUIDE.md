# API Contract Guide - A1Betting7-13.2

## 🎯 Overview

This guide establishes standardized patterns for API responses in A1Betting7-13.2, ensuring consistent error handling and response formats across all endpoints.

## ✅ Contract Format

All API endpoints MUST return responses in this standardized format:

### Success Response
```json
{
  "success": true,
  "data": <any_data>,
  "error": null
}
```

### Error Response  
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

## 🚀 Implementation Patterns

### ✅ CORRECT - Using Exception Handlers

```python
from fastapi import HTTPException, APIRouter
from pydantic import BaseModel
from typing import Any, Dict, Optional

# Response models for consistent typing
class SuccessResponse(BaseModel):
    success: bool = True
    data: Any
    error: Optional[Dict[str, str]] = None

class ErrorResponse(BaseModel):
    success: bool = False
    data: Optional[Any] = None
    error: Dict[str, str]

router = APIRouter()

@router.get("/example", response_model=SuccessResponse)
async def example_endpoint():
    try:
        # Your business logic here
        result = await some_operation()
        
        if not result:
            # Use HTTPException - will be caught by exception handler
            raise HTTPException(
                status_code=400,
                detail="Operation failed"
            )
        
        return {
            "success": True,
            "data": result,
            "error": None
        }
        
    except ValueError as e:
        # Let exception handler convert to contract format
        raise HTTPException(
            status_code=400,
            detail=f"Invalid input: {str(e)}"
        )
    except Exception as e:
        # Let exception handler convert to contract format
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )
```

### ❌ WRONG - Direct Error Returns

```python
# DON'T DO THIS - Direct error dictionary returns
@router.get("/bad-example")
async def bad_example():
    try:
        result = await some_operation()
        return {"data": result}  # Missing success/error fields
    except Exception as e:
        # WRONG - Direct error return bypasses contract
        return {"error": str(e), "status": "failed"}

# DON'T DO THIS - Direct JSONResponse with errors
from fastapi.responses import JSONResponse

@router.get("/another-bad-example")
async def another_bad_example():
    try:
        result = await some_operation()
        return result
    except Exception as e:
        # WRONG - Direct JSONResponse bypasses exception handling
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )
```

## 🔧 Exception Handler Implementation

Add this exception handler to your FastAPI app to automatically convert HTTPExceptions to contract format:

```python
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

app = FastAPI()

@app.exception_handler(HTTPException)
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Convert HTTPException to contract format"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "data": None,
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": str(exc.detail)
            }
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions with contract format"""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "data": None,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred"
            }
        }
    )
```

## 📊 Status Code Mappings

| HTTP Status | Error Code | Use Case |
|-------------|-----------|----------|
| 200 | - | Success response |
| 400 | `BAD_REQUEST` | Invalid input, validation errors |
| 401 | `UNAUTHORIZED` | Authentication required |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource conflict (duplicate, etc.) |
| 422 | `VALIDATION_ERROR` | Pydantic validation errors |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected server errors |
| 503 | `SERVICE_UNAVAILABLE` | External service unavailable |

## 🎨 Response Model Patterns

### Simple Data Response
```python
from pydantic import BaseModel
from typing import List

class GameData(BaseModel):
    id: str
    home_team: str
    away_team: str
    start_time: str

@router.get("/games", response_model=SuccessResponse)
async def get_games():
    games = await fetch_games()
    return {
        "success": True,
        "data": [GameData(**game) for game in games],
        "error": None
    }
```

### Complex Nested Response
```python
class PropAnalysis(BaseModel):
    confidence: float
    reasoning: str
    factors: List[str]

class PropResponse(BaseModel):
    id: str
    player: str
    stat: str
    line: float
    analysis: PropAnalysis

@router.get("/props/{prop_id}", response_model=SuccessResponse)
async def get_prop_analysis(prop_id: str):
    if not await prop_exists(prop_id):
        raise HTTPException(status_code=404, detail="Prop not found")
    
    prop_data = await analyze_prop(prop_id)
    
    return {
        "success": True,
        "data": PropResponse(**prop_data),
        "error": None
    }
```

## 🔍 Validation Patterns

### Input Validation
```python
from pydantic import BaseModel, Field, validator

class CreatePropRequest(BaseModel):
    player: str = Field(..., min_length=1, max_length=100)
    stat: str = Field(..., regex=r'^[A-Z_]+$')
    line: float = Field(..., gt=0)
    
    @validator('stat')
    def validate_stat(cls, v):
        allowed_stats = ['POINTS', 'REBOUNDS', 'ASSISTS']
        if v not in allowed_stats:
            raise ValueError(f'Stat must be one of: {allowed_stats}')
        return v

@router.post("/props", response_model=SuccessResponse)
async def create_prop(prop_data: CreatePropRequest):
    # Validation happens automatically via Pydantic
    # Invalid data triggers 422 with contract-formatted error
    
    result = await create_new_prop(prop_data)
    return {
        "success": True,
        "data": {"prop_id": result.id, "created": True},
        "error": None
    }
```

### Custom Validation with Business Logic
```python
@router.post("/bets/place", response_model=SuccessResponse)
async def place_bet(bet_data: PlaceBetRequest):
    # Check user balance
    user_balance = await get_user_balance(bet_data.user_id)
    if user_balance < bet_data.amount:
        raise HTTPException(
            status_code=400,
            detail="Insufficient balance"
        )
    
    # Check if prop is still available
    prop = await get_prop(bet_data.prop_id)
    if not prop or not prop.is_active:
        raise HTTPException(
            status_code=409,
            detail="Prop no longer available"
        )
    
    bet_result = await place_user_bet(bet_data)
    return {
        "success": True,
        "data": {
            "bet_id": bet_result.id,
            "status": "placed",
            "remaining_balance": user_balance - bet_data.amount
        },
        "error": None
    }
```

## 🚨 Error Handling Best Practices

### 1. Specific Error Messages
```python
# ✅ GOOD - Specific, actionable error
raise HTTPException(
    status_code=400,
    detail="Player 'John Doe' not found in active roster"
)

# ❌ BAD - Generic, unhelpful error  
raise HTTPException(
    status_code=400,
    detail="Invalid request"
)
```

### 2. Error Context
```python
# ✅ GOOD - Include context for debugging
if not game_data:
    raise HTTPException(
        status_code=404,
        detail=f"Game {game_id} not found or not scheduled for today"
    )

# ❌ BAD - No context
if not game_data:
    raise HTTPException(status_code=404, detail="Not found")
```

### 3. Sensitive Information
```python
# ✅ GOOD - Hide sensitive details in production
try:
    result = await external_api_call()
except ExternalAPIError as e:
    # Log full error internally
    logger.error(f"External API failed: {e}")
    
    # Return generic error to client
    raise HTTPException(
        status_code=503,
        detail="External service temporarily unavailable"
    )
```

## 🧪 Testing Patterns

### Contract Validation Testing
```python
import pytest
from fastapi.testclient import TestClient

def test_endpoint_contract_success(client: TestClient):
    """Test successful response follows contract"""
    response = client.get("/api/props")
    
    assert response.status_code == 200
    data = response.json()
    
    # Validate contract format
    assert "success" in data
    assert "data" in data  
    assert "error" in data
    assert data["success"] is True
    assert data["error"] is None
    assert data["data"] is not None

def test_endpoint_contract_error(client: TestClient):
    """Test error response follows contract"""
    response = client.get("/api/props/nonexistent")
    
    assert response.status_code == 404
    data = response.json()
    
    # Validate error contract format
    assert "success" in data
    assert "data" in data
    assert "error" in data
    assert data["success"] is False
    assert data["data"] is None
    assert isinstance(data["error"], dict)
    assert "code" in data["error"]
    assert "message" in data["error"]
```

### Parametrized Contract Testing
```python
@pytest.mark.parametrize("endpoint,method,expected_status", [
    ("/api/health", "GET", 200),
    ("/api/props", "GET", 200),
    ("/api/analytics", "GET", 200),
])
def test_endpoints_follow_contract(client: TestClient, endpoint: str, method: str, expected_status: int):
    """Ensure all endpoints follow contract format"""
    if method == "GET":
        response = client.get(endpoint)
    elif method == "POST":
        response = client.post(endpoint, json={"test": "data"})
    
    assert response.status_code == expected_status
    data = response.json()
    
    # All responses must have contract fields
    required_fields = {"success", "data", "error"}
    assert required_fields.issubset(data.keys())
    
    if response.status_code < 400:
        assert data["success"] is True
        assert data["error"] is None
    else:
        assert data["success"] is False
        assert data["data"] is None
        assert isinstance(data["error"], dict)
```

## 📋 Migration Checklist

When updating existing endpoints to follow this contract:

### For Each Endpoint:
- [ ] Add appropriate response_model annotation
- [ ] Replace direct error returns with HTTPException raises
- [ ] Remove direct JSONResponse usage for errors
- [ ] Ensure success responses include all three fields: success, data, error
- [ ] Test both success and error paths
- [ ] Update any client code expecting old format

### For Route Files:
- [ ] Add exception handlers if not using global ones
- [ ] Import HTTPException instead of custom error classes
- [ ] Update return statements to contract format
- [ ] Add response model definitions for complex responses

### Testing:
- [ ] Add contract validation tests for new endpoints
- [ ] Update existing tests to expect contract format
- [ ] Test error paths return proper contract format
- [ ] Verify response_model annotations work correctly

## 🔧 Development Tools

### Pre-commit Hook Setup
```bash
# Install pre-commit
pip install pre-commit

# Install hooks (includes contract validation)
pre-commit install

# Run manually
pre-commit run --all-files
```

### Contract Validation Script
```bash
# Run contract validation tests
python -m pytest backend/tests/test_contract_http_comprehensive.py -v

# Check for violations across all route files  
python -c "
import re
from pathlib import Path

violations = []
for py_file in Path('backend/routes').glob('*.py'):
    with open(py_file) as f:
        content = f.read()
    if 'raise HTTPException(' in content:
        violations.append(str(py_file))

print(f'Files with HTTPException: {len(violations)}')
for v in violations[:10]:
    print(f'  {v}')
"
```

## 📚 Additional Resources

- [FastAPI Exception Handling](https://fastapi.tiangolo.com/tutorial/handling-errors/)
- [HTTP Status Codes Reference](https://httpstatuses.com/)
- [API Design Best Practices](https://docs.microsoft.com/en-us/azure/architecture/best-practices/api-design)
- [Pydantic Validation](https://pydantic-docs.helpmanual.io/usage/validators/)

## 🆘 Support

If you encounter issues implementing these patterns:

1. **Check existing compliant endpoints** in `backend/routes/enhanced_api.py`
2. **Run the contract tests** to validate your implementation
3. **Review the exception handler** in `backend/main.py`
4. **Ask in the team chat** with specific error messages

## 🎯 Goals

- **100% contract compliance** for new endpoints
- **Consistent error experience** across all APIs  
- **Easier debugging** with standardized error formats
- **Future-proof architecture** ready for frontend integration
- **Automated regression prevention** via CI/CD pipeline

---

*This guide is enforced automatically via pre-commit hooks and CI/CD pipeline. Contract violations will prevent commits and deployments.*
