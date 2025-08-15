# CORS & Sports Activation Endpoint

## Overview

The `/api/v2/sports/activate` endpoint initializes (or probes) sports ingestion / activation logic, and must be accessible from the browser with a valid CORS preflight.

This document outlines the CORS policy implementation and sports activation endpoint specifications for the A1Betting application.

## CORS Policy

### Allowed Origins

The CORS middleware is configured to allow requests from specific development origins:

```typescript
const origins = [
  "http://localhost:5173",    // Vite dev server (primary frontend)
  "http://127.0.0.1:5173",    // Alternative localhost (IP-based)
  "http://localhost:8000"     // Backend server (for testing)
];
```

### CORS Headers

For allowed origins, the following CORS headers are returned:

- `Access-Control-Allow-Origin`: The requesting origin (if allowed)
- `Access-Control-Allow-Methods`: `DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT`
- `Access-Control-Allow-Headers`: `Content-Type, Authorization` (and any requested headers)
- `Access-Control-Allow-Credentials`: `true`
- `Access-Control-Max-Age`: `600` (10 minutes preflight cache)

### Security Considerations

1. **Explicit Origin Allow-listing**: Only specific development origins are allowed. Production deployments should use environment variables to configure allowed origins.

2. **Credentials Support**: `allow_credentials=true` is enabled, which means:
   - Cookies and authentication headers will be sent with cross-origin requests
   - Origins must be explicitly listed (cannot use `*`)

3. **Preflight Caching**: 10-minute cache for preflight responses to reduce unnecessary OPTIONS requests.

## Sports Activation Endpoint

### Endpoint Details

- **URL**: `/api/v2/sports/activate`
- **Methods**: `POST`, `OPTIONS`
- **Content-Type**: `application/json`

### OPTIONS Preflight

The endpoint supports CORS preflight requests:

```http
OPTIONS /api/v2/sports/activate
Origin: http://localhost:5173
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type
```

**Response**:
```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 600
```

### POST Activation

**Request**:
```http
POST /api/v2/sports/activate
Content-Type: application/json
Origin: http://localhost:5173

{
  "sport": "MLB"
}
```

**Successful Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "sport": "MLB",
    "activated": true,
    "version_used": "v2"
  },
  "error": null
}
```

### Supported Sports

The endpoint accepts the following sports values:
- `MLB` (Major League Baseball)
- `NBA` (National Basketball Association) 
- `NFL` (National Football League)
- `NHL` (National Hockey League)

### Error Handling

#### Invalid Sport (400 Bad Request)
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "E1000_VALIDATION",
    "message": "Invalid sport 'INVALID_SPORT'. Must be one of: MLB, NBA, NFL, NHL"
  }
}
```

#### Missing Sport Field (400 Bad Request)
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "E1000_VALIDATION",
    "message": "Sport is required"
  }
}
```

#### Invalid Content Type (415 Unsupported Media Type)
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "E1400_UNSUPPORTED_MEDIA_TYPE",
    "message": "Unsupported content type: application/x-www-form-urlencoded"
  }
}
```

#### Malformed JSON (400 Bad Request)
```json
{
  "success": false,
  "data": null,  
  "error": {
    "code": "E1000_VALIDATION",
    "message": "Invalid JSON in request body"
  }
}
```

## Frontend Integration

### API Version Detection

The frontend uses OPTIONS preflight to detect API version availability:

```typescript
export async function detectSportsApiVersion(): Promise<'v2' | 'v1' | 'none'> {
  try {
    const v2resp = await httpFetch('/api/v2/sports/activate', {
      method: 'OPTIONS',
      logLabel: 'SportsService',
    });
    if (v2resp.ok) {
      return 'v2';  // CORS preflight successful
    } else if (v2resp.status === 405) {
      return 'v2';  // Endpoint exists but OPTIONS not handled
    }
  } catch (error) {
    // Handle network errors gracefully
    return 'none';
  }
  // Fall back to v1 detection...
}
```

### Graceful Degradation

The frontend is designed to handle various scenarios:

1. **v2 Available**: Uses POST `/api/v2/sports/activate`
2. **v1 Fallback**: Uses POST `/api/sports/activate/{sport}`  
3. **Demo Mode**: Returns mock activation response when backend unavailable

### Error Resilience

Network errors and backend unavailability trigger demo mode instead of throwing errors, ensuring the frontend remains functional even when the backend is down.

## Implementation Details

### FastAPI CORS Middleware

```python
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173", 
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Explicit OPTIONS Handler

```python
@app.options("/api/v2/sports/activate")
async def api_activate_preflight():
    """Handle CORS preflight for sports activation endpoint"""
    return Response(status_code=200)
```

The explicit OPTIONS handler ensures that preflight requests are handled correctly, even if FastAPI's automatic OPTIONS handling fails.

### Security Headers Integration

The endpoint maintains all security headers while supporting CORS:

- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Content-Security-Policy`
- `Cross-Origin-Opener-Policy`
- `Cross-Origin-Resource-Policy`
- `Cross-Origin-Embedder-Policy`

## Testing

### Automated Tests

The endpoint includes comprehensive test coverage in `backend/tests/test_sports_activation_cors.py`:

- ✅ OPTIONS preflight with allowed origins
- ✅ OPTIONS preflight without origin headers
- ✅ OPTIONS preflight with disallowed origins
- ✅ POST activation with CORS headers
- ✅ POST activation without CORS (same-origin)
- ✅ Security headers preservation
- ✅ Input validation for all scenarios
- ✅ Error handling and response formats

### Manual Testing

Test OPTIONS preflight:
```bash
curl -X OPTIONS "http://localhost:8000/api/v2/sports/activate" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

Test POST activation:
```bash
curl -X POST "http://localhost:8000/api/v2/sports/activate" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"sport": "MLB"}'
```

## Environment Configuration

For production deployments, use environment variables to configure allowed origins:

```bash
# Example .env configuration
A1_ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

This ensures production security while maintaining development flexibility.

## Troubleshooting

### Common Issues

1. **405 Method Not Allowed for OPTIONS**
   - **Cause**: Missing explicit OPTIONS handler
   - **Solution**: Ensure both POST and OPTIONS handlers are defined

2. **No CORS Headers in Response**
   - **Cause**: Origin not in allowed list or CORS middleware not configured
   - **Solution**: Verify origin is in `origins` array and middleware is added

3. **Credentials Not Working**
   - **Cause**: Using `allow_origins=["*"]` with `allow_credentials=True`
   - **Solution**: Use explicit origin list instead of wildcard

4. **Preflight Cache Issues**
   - **Cause**: Browser caching old preflight responses
   - **Solution**: Clear browser cache or use private browsing

### Debug Commands

Check if endpoint supports OPTIONS:
```bash
curl -X OPTIONS "http://localhost:8000/api/v2/sports/activate" -I
```

Verify CORS headers:
```bash
curl -X OPTIONS "http://localhost:8000/api/v2/sports/activate" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -I
```

Test actual activation:
```bash
curl -X POST "http://localhost:8000/api/v2/sports/activate" \
  -H "Content-Type: application/json" \
  -d '{"sport": "MLB"}' | jq
```