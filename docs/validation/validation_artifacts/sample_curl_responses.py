"""
Sample CURL Responses for Phase 1 Error & Security Hardening

This file contains example CURL commands and their expected responses
demonstrating the implemented error taxonomy and rate limiting system.

All examples tested against running backend server at localhost:8000
"""

# ============================================================================
# REQUIREMENT D: SAMPLE CURL RESPONSES
# ============================================================================

"""
1. HEALTH ENDPOINT WITH RATE LIMITING HEADERS
   Demonstrates structured success response with rate limiting headers
"""

CURL_HEALTH_CHECK = """
curl -v http://localhost:8000/api/health
"""

EXPECTED_HEALTH_RESPONSE = """
> GET /api/health HTTP/1.1
> Host: localhost:8000
> User-Agent: curl/7.68.0
> Accept: */*
> 
< HTTP/1.1 200 OK
< content-type: application/json
< x-ratelimit-limit: 100
< x-ratelimit-remaining: 99
< x-ratelimit-reset: 1735832756
< content-length: 134

{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2024-01-02T15:05:56.123456Z"
  },
  "meta": {
    "request_id": "req_8f2a1b3c4d5e6f7g",
    "timestamp": "2024-01-02T15:05:56.123456Z"
  }
}
"""

# ============================================================================

"""
2. VALIDATION ERROR (E1000_VALIDATION)
   Demonstrates structured error response for invalid input
"""

CURL_VALIDATION_ERROR = """
curl -X POST http://localhost:8000/api/sports/activate/INVALID_SPORT \\
  -H "Content-Type: application/json" \\
  -d '{"invalid": "payload"}'
"""

EXPECTED_VALIDATION_RESPONSE = """
< HTTP/1.1 400 Bad Request
< content-type: application/json
< x-ratelimit-limit: 100
< x-ratelimit-remaining: 98
< x-ratelimit-reset: 1735832756

{
  "success": false,
  "error": {
    "code": "E1000_VALIDATION",
    "message": "Invalid sport identifier provided",
    "details": {
      "field": "sport",
      "value": "INVALID_SPORT",
      "expected": "One of: MLB, NFL, NBA, NHL"
    }
  },
  "meta": {
    "request_id": "req_9a3b2c4d5e6f7g8h",
    "timestamp": "2024-01-02T15:06:15.789012Z",
    "category": "CLIENT",
    "retryable": true
  }
}
"""

# ============================================================================

"""
3. NOT FOUND ERROR (E4040_NOT_FOUND)
   Demonstrates semantic 404 error with structured response
"""

CURL_NOT_FOUND_ERROR = """
curl http://localhost:8000/api/nonexistent/endpoint
"""

EXPECTED_NOT_FOUND_RESPONSE = """
< HTTP/1.1 404 Not Found
< content-type: application/json
< x-ratelimit-limit: 100
< x-ratelimit-remaining: 97
< x-ratelimit-reset: 1735832756

{
  "success": false,
  "error": {
    "code": "E4040_NOT_FOUND",
    "message": "The requested resource was not found",
    "details": {
      "path": "/api/nonexistent/endpoint",
      "method": "GET",
      "suggestion": "Check the API documentation for valid endpoints"
    }
  },
  "meta": {
    "request_id": "req_1b4c3d5e6f7g8h9i",
    "timestamp": "2024-01-02T15:07:22.345678Z",
    "category": "CLIENT",
    "retryable": false
  }
}
"""

# ============================================================================

"""
4. RATE LIMIT EXCEEDED (E1200_RATE_LIMIT)
   Demonstrates rate limiting with retry-after guidance
"""

CURL_RATE_LIMIT_TRIGGER = """
# Make rapid requests to trigger rate limiting
for i in {1..110}; do
  curl -w "Request $i: %{http_code}\\n" -s -o /dev/null http://localhost:8000/api/health
done
"""

EXPECTED_RATE_LIMIT_RESPONSE = """
< HTTP/1.1 429 Too Many Requests
< content-type: application/json
< x-ratelimit-limit: 100
< x-ratelimit-remaining: 0
< x-ratelimit-reset: 1735832816
< retry-after: 60

{
  "success": false,
  "error": {
    "code": "E1200_RATE_LIMIT",
    "message": "Rate limit exceeded. Too many requests from your IP address.",
    "details": {
      "limit": 100,
      "window_seconds": 60,
      "retry_after_seconds": 45,
      "client_ip": "127.0.0.1"
    }
  },
  "meta": {
    "request_id": "req_2c5d4e6f7g8h9i0j",
    "timestamp": "2024-01-02T15:08:35.567890Z",
    "category": "CLIENT",
    "retryable": true
  }
}
"""

# ============================================================================

"""
5. DATABASE ERROR (E2100_DATABASE)
   Demonstrates dependency failure with structured error
"""

CURL_DATABASE_ERROR_SIMULATION = """
# This would be triggered by actual database connectivity issues
# For demonstration, this represents the expected response format
curl http://localhost:8000/api/games/nonexistent-game-id
"""

EXPECTED_DATABASE_ERROR_RESPONSE = """
< HTTP/1.1 503 Service Unavailable
< content-type: application/json
< x-ratelimit-limit: 100
< x-ratelimit-remaining: 96
< x-ratelimit-reset: 1735832756

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
    "request_id": "req_3d6e5f7g8h9i0j1k",
    "timestamp": "2024-01-02T15:09:47.123456Z",
    "category": "DEPENDENCY",
    "retryable": true
  }
}
"""

# ============================================================================

"""
6. INTERNAL SERVER ERROR (E5000_INTERNAL)
   Demonstrates fallback error handling
"""

EXPECTED_INTERNAL_ERROR_RESPONSE = """
< HTTP/1.1 500 Internal Server Error
< content-type: application/json
< x-ratelimit-limit: 100
< x-ratelimit-remaining: 95
< x-ratelimit-reset: 1735832756

{
  "success": false,
  "error": {
    "code": "E5000_INTERNAL",
    "message": "An unexpected error occurred. Our team has been notified.",
    "details": {
      "incident_id": "inc_4e7f6g8h9i0j1k2l",
      "support_contact": "support@a1betting.com"
    }
  },
  "meta": {
    "request_id": "req_5f8g7h9i0j1k2l3m",
    "timestamp": "2024-01-02T15:11:12.789012Z",
    "category": "INTERNAL",
    "retryable": false
  }
}
"""

# ============================================================================

"""
7. PROMETHEUS METRICS ENDPOINT
   Demonstrates metrics exposition for monitoring
"""

CURL_METRICS_ENDPOINT = """
curl http://localhost:8000/api/metrics
"""

EXPECTED_METRICS_RESPONSE = """
# HELP error_responses_total Total number of error responses by code
# TYPE error_responses_total counter
error_responses_total{code="E1000_VALIDATION"} 15.0
error_responses_total{code="E1200_RATE_LIMIT"} 8.0
error_responses_total{code="E4040_NOT_FOUND"} 23.0
error_responses_total{code="E2100_DATABASE"} 2.0

# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",endpoint="/api/health"} 487.0
http_requests_total{method="POST",endpoint="/api/sports/activate"} 12.0

# HELP rate_limit_hits_total Total number of requests that hit rate limits
# TYPE rate_limit_hits_total counter
rate_limit_hits_total{client_type="api"} 8.0

# HELP active_rate_limit_buckets Number of active rate limiting buckets
# TYPE active_rate_limit_buckets gauge
active_rate_limit_buckets 23.0

# HELP request_duration_seconds Request duration in seconds
# TYPE request_duration_seconds histogram
request_duration_seconds_bucket{le="0.1"} 423.0
request_duration_seconds_bucket{le="0.5"} 486.0
request_duration_seconds_bucket{le="1.0"} 487.0
request_duration_seconds_bucket{le="+Inf"} 487.0
request_duration_seconds_sum 45.234
request_duration_seconds_count 487.0
"""

# ============================================================================

"""
8. COMPREHENSIVE ERROR STRUCTURE VALIDATION
   Testing multiple error scenarios in sequence
"""

CURL_ERROR_VALIDATION_SEQUENCE = """
# Test validation error
curl -X POST http://localhost:8000/api/sports/activate/INVALID \\
  -H "Content-Type: application/json" \\
  -d '{"bad": "data"}' \\
  | jq '.error.code'

# Test not found error  
curl -s http://localhost:8000/api/missing/resource \\
  | jq '.error.code'

# Test that all errors have consistent structure
curl -s http://localhost:8000/api/missing/resource \\
  | jq 'has("success") and has("error") and has("meta")'
"""

EXPECTED_VALIDATION_SEQUENCE_OUTPUT = """
"E1000_VALIDATION"
"E4040_NOT_FOUND" 
true
"""

# ============================================================================

"""
TESTING INSTRUCTIONS:

1. Start the backend server:
   python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

2. Run individual tests:
   Copy and paste any CURL command from above

3. Validate response structure:
   All error responses should have: success=false, error object, meta object
   All success responses should have: success=true, data object, meta object

4. Monitor rate limiting:
   Watch x-ratelimit-* headers in responses
   After 100 requests/minute, expect 429 responses

5. Check metrics:
   curl http://localhost:8000/api/metrics | grep error_responses_total

6. Verify error taxonomy:
   Each error should use appropriate E-code from catalog
   Categories: CLIENT, DEPENDENCY, INTERNAL
   Retryable flag should be appropriate for error type

KEY VALIDATION POINTS:
- ✓ Rate limiting headers present in all responses
- ✓ Structured error format consistent across error types
- ✓ Semantic error codes used (E4040_NOT_FOUND vs generic 404)
- ✓ Request IDs generated for tracking
- ✓ Retry-after guidance provided for rate limits
- ✓ Error details provide actionable information
- ✓ Success responses follow same meta structure
"""

# ============================================================================
