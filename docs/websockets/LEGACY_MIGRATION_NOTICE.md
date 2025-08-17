# Legacy WebSocket Path Migration Notice

## CRITICAL: Legacy Path Deprecated

**Legacy path observed in logs:**
```
ws://localhost:8000/client_/ws/<client_id>
```

**This path format is DEPRECATED and causes 403 errors.**

## Canonical Path Format

**Correct canonical format:**
```
ws://localhost:8000/ws/client?client_id=<client_id>&version=1&role=frontend
```

## Migration Guide

### For Developers

**OLD (deprecated):**
```typescript
const wsUrl = `ws://localhost:8000/ws/client_${clientId}`;
const ws = new WebSocket(wsUrl);
```

**NEW (canonical):**
```typescript
import { buildWebSocketUrl } from '@/websocket/buildWebSocketUrl';

const wsUrl = buildWebSocketUrl({ 
  clientId: 'my-client-id',
  version: '1',
  role: 'frontend'
});
const ws = new WebSocket(wsUrl);
```

### Environment Configuration

**OLD (.env.local):**
```
VITE_WS_URL=ws://localhost:8000/ws/client_
```

**NEW (.env.local):**
```
VITE_WS_URL=ws://localhost:8000
```

**Note:** The base URL should NOT include the path. The canonical path `/ws/client` is automatically appended with proper query parameters.

## Why This Change?

1. **Path vs Query Parameters:** Modern WebSocket implementations prefer query parameters over path parameters for client identification
2. **Security:** Query parameter validation is more robust than path-based routing
3. **Debugging:** Query parameters are more visible in network logs and debugging tools
4. **Standards Compliance:** Follows RFC 6455 WebSocket standard recommendations

## Regression Prevention

A guard script `tools/check-no-legacy-ws.sh` prevents reintroduction of legacy patterns:

```bash
npm run prebuild:ws-guard
```

This script fails the build if legacy `client_/ws` patterns are detected outside of this documentation.

## Timeline

- **Legacy path:** DEPRECATED as of 2025-08-16
- **Canonical path:** Required for all new WebSocket connections
- **Legacy support:** Removed (causes 403 errors)

## Support

If you encounter issues with the canonical WebSocket URL format, please:

1. Verify your `.env.local` uses the correct `VITE_WS_URL` format
2. Ensure you're using `buildWebSocketUrl()` for all URL construction  
3. Check that no legacy path construction remains in your code
4. Run the guard script to detect any remaining legacy patterns

## Testing

Unit tests verify canonical URL construction:

```bash
npm test -- buildWebSocketUrl.test.ts
```

Test ensures generated URLs match the canonical pattern and reject legacy formats.