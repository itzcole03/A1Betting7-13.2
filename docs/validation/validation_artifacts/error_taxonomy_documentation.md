# Error Taxonomy Documentation

## Overview

This document provides comprehensive documentation of the error taxonomy system implemented in Phase 1 Error & Security Hardening. The taxonomy provides structured, semantic error codes that enable consistent error handling and monitoring across the A1Betting platform.

## Architecture

### Error Code Structure

All error codes follow the pattern: `E[CATEGORY][TYPE][SPECIFIC]`

- **E**: Error prefix 
- **CATEGORY**: 1000-level category (1000=Client, 2000=Dependency, 5000=Internal)
- **TYPE**: 100-level type within category
- **SPECIFIC**: Individual error within type

### Categories

#### 1000 Series: CLIENT Errors
Errors caused by client requests or input validation failures.

#### 2000 Series: DEPENDENCY Errors  
Errors caused by external dependencies or service failures.

#### 5000 Series: INTERNAL Errors
Errors caused by internal system failures or configuration issues.

## Complete Error Taxonomy

### E1000 Series: Client Validation Errors

#### E1000_VALIDATION
- **HTTP Status**: 400 Bad Request
- **Category**: CLIENT
- **Retryable**: True (after fixing input)
- **Description**: General validation error for invalid input data
- **Common Triggers**: Invalid JSON, missing required fields, type mismatches
- **Example Response**:
```json
{
  "success": false,
  "error": {
    "code": "E1000_VALIDATION",
    "message": "Request validation failed",
    "details": {
      "field": "sport",
      "value": "INVALID_SPORT", 
      "expected": "One of: MLB, NFL, NBA, NHL"
    }
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-02T15:30:45.123Z",
    "category": "CLIENT",
    "retryable": true
  }
}
```

#### E1100_AUTH
- **HTTP Status**: 401 Unauthorized
- **Category**: CLIENT
- **Retryable**: True (with valid credentials)
- **Description**: Authentication failure
- **Common Triggers**: Missing API key, invalid token, expired session
- **Resolution**: Provide valid authentication credentials

#### E1200_RATE_LIMIT
- **HTTP Status**: 429 Too Many Requests
- **Category**: CLIENT  
- **Retryable**: True (after waiting)
- **Description**: Rate limit exceeded
- **Common Triggers**: Too many requests from single IP/user
- **Headers Added**:
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Requests remaining in window
  - `X-RateLimit-Reset`: Unix timestamp when window resets
  - `Retry-After`: Seconds to wait before retrying
- **Example Response**:
```json
{
  "success": false,
  "error": {
    "code": "E1200_RATE_LIMIT",
    "message": "Rate limit exceeded. Too many requests from your IP address.",
    "details": {
      "limit": 100,
      "window_seconds": 60,
      "retry_after_seconds": 45,
      "client_ip": "192.168.1.100"
    }
  },
  "meta": {
    "request_id": "req_def456",
    "timestamp": "2024-01-02T15:31:22.456Z",
    "category": "CLIENT",
    "retryable": true
  }
}
```

#### E1300_PAYLOAD_TOO_LARGE
- **HTTP Status**: 413 Payload Too Large
- **Category**: CLIENT
- **Retryable**: False
- **Description**: Request payload exceeds size limits
- **Common Triggers**: Large file uploads, excessive JSON data
- **Resolution**: Reduce payload size or use pagination

#### E1400_UNSUPPORTED_MEDIA_TYPE
- **HTTP Status**: 415 Unsupported Media Type
- **Category**: CLIENT
- **Retryable**: True (with correct media type)
- **Description**: Request content type not supported
- **Common Triggers**: Missing Content-Type header, unsupported format
- **Resolution**: Use supported content types (application/json)

#### E1404_NOT_FOUND (Legacy)
- **HTTP Status**: 404 Not Found
- **Category**: CLIENT
- **Retryable**: False
- **Description**: Legacy 404 error code (use E4040_NOT_FOUND for new implementations)
- **Status**: Deprecated in favor of E4040_NOT_FOUND

#### E4040_NOT_FOUND (Preferred)
- **HTTP Status**: 404 Not Found
- **Category**: CLIENT
- **Retryable**: False
- **Description**: Requested resource not found
- **Common Triggers**: Invalid endpoint URLs, non-existent resource IDs
- **Example Response**:
```json
{
  "success": false,
  "error": {
    "code": "E4040_NOT_FOUND", 
    "message": "The requested resource was not found",
    "details": {
      "path": "/api/games/invalid-game-id",
      "method": "GET",
      "suggestion": "Check the API documentation for valid endpoints"
    }
  },
  "meta": {
    "request_id": "req_ghi789",
    "timestamp": "2024-01-02T15:32:10.789Z",
    "category": "CLIENT",
    "retryable": false
  }
}
```

### E2000 Series: Dependency Errors

#### E2000_DEPENDENCY
- **HTTP Status**: 503 Service Unavailable
- **Category**: DEPENDENCY
- **Retryable**: True
- **Description**: General dependency service failure
- **Common Triggers**: Third-party API failures, service timeouts
- **Resolution**: Wait and retry, check service status

#### E2100_DATABASE
- **HTTP Status**: 503 Service Unavailable
- **Category**: DEPENDENCY
- **Retryable**: True
- **Description**: Database operation failure
- **Common Triggers**: Connection timeouts, query failures, deadlocks
- **Example Response**:
```json
{
  "success": false,
  "error": {
    "code": "E2100_DATABASE",
    "message": "Database operation failed. Please try again later.",
    "details": {
      "operation": "game_lookup",
      "timeout_seconds": 30,
      "retry_suggested": true
    }
  },
  "meta": {
    "request_id": "req_jkl012",
    "timestamp": "2024-01-02T15:33:45.012Z",
    "category": "DEPENDENCY",
    "retryable": true
  }
}
```

#### E2200_EXTERNAL_API
- **HTTP Status**: 503 Service Unavailable
- **Category**: DEPENDENCY
- **Retryable**: True
- **Description**: External API service failure
- **Common Triggers**: MLB API downtime, TheOdds API failures, timeout errors
- **Resolution**: Wait and retry, check external service status

#### E2300_CACHE
- **HTTP Status**: 503 Service Unavailable  
- **Category**: DEPENDENCY
- **Retryable**: True
- **Description**: Cache service failure (Redis, memory cache)
- **Common Triggers**: Redis connection failure, cache eviction errors
- **Resolution**: Retry request, may fall back to primary data source

#### E2400_TIMEOUT
- **HTTP Status**: 504 Gateway Timeout
- **Category**: DEPENDENCY  
- **Retryable**: True
- **Description**: Operation timeout exceeded
- **Common Triggers**: Slow database queries, external API delays
- **Resolution**: Retry with exponential backoff

### E5000 Series: Internal System Errors

#### E5000_INTERNAL
- **HTTP Status**: 500 Internal Server Error
- **Category**: INTERNAL
- **Retryable**: False (usually)
- **Description**: Unexpected internal system error
- **Common Triggers**: Unhandled exceptions, code bugs, system failures
- **Example Response**:
```json
{
  "success": false,
  "error": {
    "code": "E5000_INTERNAL",
    "message": "An unexpected error occurred. Our team has been notified.",
    "details": {
      "incident_id": "inc_mno345",
      "support_contact": "support@a1betting.com"
    }
  },
  "meta": {
    "request_id": "req_pqr678",
    "timestamp": "2024-01-02T15:35:20.345Z", 
    "category": "INTERNAL",
    "retryable": false
  }
}
```

#### E5100_CONFIGURATION
- **HTTP Status**: 500 Internal Server Error
- **Category**: INTERNAL
- **Retryable**: False
- **Description**: System configuration error
- **Common Triggers**: Missing environment variables, invalid config values
- **Resolution**: Check server configuration, restart services

#### E5200_RESOURCE_EXHAUSTED
- **HTTP Status**: 503 Service Unavailable
- **Category**: INTERNAL
- **Retryable**: True (after resource availability)
- **Description**: System resources exhausted
- **Common Triggers**: Out of memory, disk space full, CPU overload
- **Resolution**: Wait for resource availability, scale infrastructure

## Implementation Guide

### Error Response Structure

All errors follow a consistent structure:

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;           // Error taxonomy code (e.g., "E1000_VALIDATION")
    message: string;        // Human-readable error message
    details?: object;       // Additional error-specific details
  };
  meta: {
    request_id: string;     // Unique request identifier
    timestamp: string;      // ISO 8601 timestamp
    category: string;       // Error category (CLIENT, DEPENDENCY, INTERNAL)
    retryable: boolean;     // Whether the request can be retried
  };
}
```

### Usage in Code

#### Backend (Python)

```python
from backend.errors.catalog import ErrorCode, build_error, ApiError

# Raise an error with taxonomy
raise ApiError(
    error_code=ErrorCode.E1000_VALIDATION,
    message="Invalid sport identifier",
    details={"field": "sport", "value": sport_id}
)

# Build error response
error_response = build_error(
    error_code=ErrorCode.E4040_NOT_FOUND,
    message="Game not found",
    details={"game_id": game_id}
)
```

#### Frontend (TypeScript)

```typescript
// Handle structured errors
if (!response.success) {
  const error = response.error;
  
  switch (error.code) {
    case 'E1200_RATE_LIMIT':
      // Show rate limit message with retry time
      showRetryMessage(error.details.retry_after_seconds);
      break;
      
    case 'E4040_NOT_FOUND':
      // Redirect to 404 page
      navigate('/not-found');
      break;
      
    case 'E2100_DATABASE':
      // Show temporary service error
      if (response.meta.retryable) {
        showRetryButton();
      }
      break;
  }
}
```

## Monitoring and Observability

### Metrics

The error taxonomy integrates with Prometheus metrics:

```
# Error response counters by code
error_responses_total{code="E1000_VALIDATION"} 15
error_responses_total{code="E1200_RATE_LIMIT"} 8  
error_responses_total{code="E4040_NOT_FOUND"} 23

# Error response counters by category
error_responses_total{category="CLIENT"} 46
error_responses_total{category="DEPENDENCY"} 5
error_responses_total{category="INTERNAL"} 1
```

### Logging

All errors are logged with structured data:

```json
{
  "timestamp": "2024-01-02T15:30:45.123Z",
  "level": "ERROR",
  "message": "Request validation failed",
  "error_code": "E1000_VALIDATION",
  "request_id": "req_abc123",
  "user_id": "user_456",
  "endpoint": "/api/sports/activate",
  "details": {
    "field": "sport",
    "value": "INVALID_SPORT"
  }
}
```

### Alerting Rules

Recommended alerting thresholds:

- **E1200_RATE_LIMIT**: Alert if >100 rate limit errors in 5 minutes
- **E2xxx_DEPENDENCY**: Alert if >10 dependency errors in 1 minute  
- **E5xxx_INTERNAL**: Alert on any internal errors
- **Overall Error Rate**: Alert if error rate >5% over 10 minutes

## Best Practices

### When to Use Each Category

#### CLIENT Errors (E1xxx)
- Input validation failures
- Authentication/authorization issues
- Rate limiting violations
- Resource not found scenarios

#### DEPENDENCY Errors (E2xxx)
- Database connection failures
- External API unavailability
- Cache service issues
- Network timeouts

#### INTERNAL Errors (E5xxx)
- Unexpected exceptions
- Configuration problems
- Resource exhaustion
- System bugs

### Error Message Guidelines

1. **Be Specific**: Include relevant details about what went wrong
2. **Be Actionable**: Tell users what they can do to resolve the issue
3. **Be Consistent**: Use consistent language and tone across errors
4. **Be Secure**: Don't expose sensitive system details

### Testing Error Handling

```python
# Test error taxonomy responses
def test_validation_error_structure():
    response = client.post("/api/sports/activate/INVALID")
    
    assert response.status_code == 400
    data = response.json()
    
    assert data["success"] is False
    assert data["error"]["code"] == "E1000_VALIDATION"
    assert "request_id" in data["meta"]
    assert data["meta"]["category"] == "CLIENT"
    assert data["meta"]["retryable"] is True
```

## Migration Guide

### From Generic HTTP Errors

**Before:**
```python
raise HTTPException(status_code=404, detail="Not found")
```

**After:**
```python
raise ApiError(
    error_code=ErrorCode.E4040_NOT_FOUND,
    message="The requested resource was not found",
    details={"resource": resource_name}
)
```

### From String Error Codes

**Before:**
```python
return {"error": "INVALID_INPUT", "message": "Bad data"}
```

**After:**
```python
return build_error(
    error_code=ErrorCode.E1000_VALIDATION,
    message="Request validation failed",
    details={"field": field_name, "issue": validation_issue}
)
```

## Frequently Asked Questions

### Q: When should I create a new error code?
A: Only create new error codes for fundamentally different error scenarios that require different handling. Try to reuse existing codes with different details first.

### Q: Should all 404 errors use E4040_NOT_FOUND?
A: Yes, E4040_NOT_FOUND is the preferred code for all "resource not found" scenarios. E1404_NOT_FOUND is deprecated.

### Q: How do I handle errors that could be client or server issues?
A: Err on the side of being more specific. If the error is primarily due to client input, use CLIENT category. If it's primarily a system issue, use DEPENDENCY or INTERNAL.

### Q: Can error details contain sensitive information?
A: No, error details should never contain sensitive information like passwords, tokens, or internal system details. Include only information that helps the client resolve the issue safely.

### Q: How do I test error scenarios?
A: Use the test utilities in `tests/errors/` to validate error response structure and behavior. Create integration tests that trigger actual error conditions.

## Related Documentation

- [API Contract Guide](API_CONTRACT_GUIDE.md)
- [Rate Limiting Documentation](RATE_LIMITING.md)
- [Monitoring and Observability](MONITORING.md)
- [Backend Error Handling](backend/errors/README.md)
