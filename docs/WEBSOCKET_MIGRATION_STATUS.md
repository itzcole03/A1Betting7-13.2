# WebSocket Migration Status

## Summary

The A1Betting7-13.2 WebSocket implementation has been migrated from legacy `client_/ws` paths to the canonical `/ws/client` pattern. This migration ensures:

- **Single Source of Truth**: All WebSocket URLs are constructed via `buildWebSocketUrl()`
- **Path Consistency**: Canonical `/ws/client?client_id=xyz` format across all connections
- **Development Guards**: Runtime assertions prevent legacy path construction
- **Environment Safety**: Automatic sanitization of legacy environment variables

## Canonical Pattern

### ✅ CORRECT Usage

```typescript
import { buildWebSocketUrl } from '../utils/websocketBuilder';

// Single source of truth for all WebSocket URLs
const url = buildWebSocketUrl({
  clientId: 'optional-custom-id',  // Auto-generated if not provided
  role: 'frontend',                // Default: 'frontend'  
  version: 1                       // Default: 1
});

// Result: ws://localhost:8000/ws/client?client_id=xyz&version=1&role=frontend
```

### ❌ PROHIBITED Legacy Pattern

```typescript
// NEVER DO THIS - will trigger dev-mode assertion errors
const legacyUrl = `${baseUrl}/client_/ws/client_${clientId}`;
const manualUrl = `ws://localhost:8000/ws/${clientId}`;  // Missing query params
```

## Environment Variable Configuration

### Base URL Override

Set the WebSocket base URL (without path):

```bash
# Development
VITE_WS_URL=ws://localhost:8000

# Production
VITE_WS_URL=wss://api.yourapp.com
```

### Environment Sanitization

The system automatically sanitizes legacy paths from environment variables:

```bash
# This legacy configuration...
VITE_WS_URL=ws://localhost:8000/ws/client_/legacy

# Gets sanitized to:
# ws://localhost:8000
# (with warning logged in console)
```

## Testing Instructions

### Unit Tests

Run the WebSocket legacy elimination tests:

```bash
cd frontend
npm test -- websocketUrlLegacyElimination.test.ts
```

### CI Guards

Check for any legacy paths in source code:

```bash
# Check only (non-failing)
npm run check:legacy-ws

# CI enforcement (fails on detection)
npm run ci:ensure-no-legacy-ws
```

### Manual Verification

1. Start the development server:
   ```bash
   cd frontend && npm run dev
   ```

2. Open browser dev tools and check WebSocket connections in Network tab

3. Verify URLs follow pattern: `ws://localhost:8000/ws/client?client_id=...`

4. Look for diagnostic logs in console:
   ```
   [WSBuildDiag] Built canonical WebSocket URL: ws://localhost:8000/ws/client?...
   [ClientIdDiag] { initialFromStorage: true, passedIn: false, finalClientId: "client_abc123def" }
   ```

## Troubleshooting Matrix

| Symptom | Likely Cause | Resolution |
|---------|--------------|------------|
| 403 errors on WebSocket connections | Legacy URL still being constructed | Check env vars, ensure all services use `buildWebSocketUrl()` |
| WebSocket URLs contain `client_/ws` | Environment variable has legacy path | Update `VITE_WS_URL` to base URL only |
| Infinite reconnection loops | URL construction throwing errors | Check browser console for `[WSBuildDiag]` error logs |
| Missing client ID in WebSocket URL | Not using canonical builder | Replace manual URL building with `buildWebSocketUrl()` |
| Dev-mode assertion errors | Legacy path constructed after migration | Fix the URL construction code triggering the error |

## Architecture Overview

### Client ID Persistence

Client IDs are automatically generated and persisted across sessions:

```typescript
// Handled automatically by buildWebSocketUrl()
const clientId = getOrPersistClientId('ws_client_id', optionalCustomId);
// Stored in: localStorage['ws_client_id']
```

### URL Construction Flow

1. **Environment Resolution**: Get base URL from `VITE_WS_URL` or auto-detect
2. **Path Sanitization**: Strip any legacy path segments from environment
3. **Client ID Resolution**: Get from storage, parameter, or generate new
4. **Canonical Building**: Use URL constructor for `/ws/client` path
5. **Query Parameters**: Add `client_id`, `version`, `role`
6. **Development Assertion**: Verify no legacy path in result

### Reconnection Strategy

The WebSocket manager includes hardened reconnection with:
- **Exponential Backoff**: 1s → 2s → 4s → 8s → 16s (capped)
- **Jitter**: ±20% randomization to prevent thundering herd
- **Max Attempts**: Configurable limit (default: 12 attempts)
- **State Management**: Proper connection lifecycle tracking

## Migration Checklist

- [x] Environment variable sanitized (removed `client_/ws` segment)
- [x] Canonical `buildWebSocketUrl()` function created
- [x] `EnhancedDataManager` updated to use canonical builder
- [x] Development assertions added for legacy path detection
- [x] Client ID persistence unified via `getOrPersistClientId()`
- [x] Comprehensive test suite created
- [x] CI guard scripts added to package.json
- [x] Documentation and troubleshooting guide created

## API Reference

### buildWebSocketUrl(options?)

Canonical WebSocket URL builder - single source of truth.

**Parameters:**
- `options.clientId?: string` - Custom client ID (auto-generated if not provided)
- `options.role?: string` - Connection role (default: 'frontend')  
- `options.version?: number` - Protocol version (default: 1)
- `options.baseUrl?: string` - Base URL override

**Returns:** `string` - Complete WebSocket URL with query parameters

**Throws:** Error in development mode if legacy path constructed

### getOrPersistClientId(storageKey?, passedClientId?)

Client ID persistence utility.

**Parameters:**
- `storageKey?: string` - localStorage key (default: 'ws_client_id')
- `passedClientId?: string` - Use this ID if provided

**Returns:** `string` - Client ID (existing, provided, or newly generated)

### resolveWebSocketBase()

Environment-aware base URL resolution with legacy path sanitization.

**Returns:** `string` - Base WebSocket URL (protocol://host:port)

### validateWebSocketUrl(url)

Validate that a URL doesn't contain legacy path patterns.

**Parameters:**
- `url: string` - URL to validate

**Returns:** `boolean` - true if URL is valid (no legacy paths)

---

**Status**: ✅ Migration Complete  
**Last Updated**: August 2025  
**Next Review**: On any WebSocket-related changes