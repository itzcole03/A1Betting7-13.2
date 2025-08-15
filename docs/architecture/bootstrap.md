# Bootstrap Architecture & Idempotency

## Purpose

Ensure a single, controlled initialization sequence for the A1Betting platform, preventing duplicate service initialization even under React 18 StrictMode's double-invocation of effects in development.

## Problems Solved

- **Duplicate Auth Restoration**: Authentication restored twice causing duplicate console logs
- **Duplicate ReliabilityOrchestrator**: Heavy monitoring services started multiple times
- **Environment Mismatch**: Log messages showing "Production Mode" in development
- **Scattered Bootstrap Logic**: Initialization spread across main.tsx, App.tsx, and multiple contexts
- **No Idempotency**: No protection against accidental re-initialization

## Architecture Overview

### Core Components

1. **Environment Abstraction** (`frontend/src/bootstrap/env.ts`)
   - Unified environment detection
   - Supports Vite (`import.meta.env.MODE`) and Node.js (`process.env.NODE_ENV`)
   - Type-safe environment information

2. **Bootstrap Module** (`frontend/src/bootstrap/bootstrapApp.ts`)
   - Idempotent initialization using global symbol guard
   - Centralized service orchestration
   - Performance timing instrumentation
   - Comprehensive error handling

3. **Service Coordination**
   - Auth restoration with duplicate prevention
   - ReliabilityOrchestrator singleton integration
   - Web Vitals service initialization
   - Global error handler registration

### Guard Mechanism

```typescript
const BOOTSTRAP_FLAG = Symbol.for('a1.bet.platform.bootstrapped');

export function isBootstrapped(): boolean {
  return !!getGlobal()[BOOTSTRAP_FLAG];
}
```

**Why Symbol.for()**: Creates a global symbol registry key that survives across module boundaries and Hot Module Replacement (HMR) in development.

**Global State Pattern**: Uses type-safe global property access to coordinate between:

- Bootstrap module
- AuthContext
- Service workers
- Error handlers

### Initialization Sequence

1. **Environment Detection & Logging Setup**
   - Accurate environment mode detection
   - Structured logging initialization
   - User agent and timestamp capture

2. **Error Handlers Registration** (Once Only)
   - Global error handler for unhandled exceptions
   - Promise rejection handler
   - WebSocket error suppression
   - API connectivity error filtering

3. **Auth Session Restoration** (Once Only)
   - Check existing authentication state
   - Set global coordination flag `__A1_AUTH_RESTORED`
   - Structured audit logging

4. **ReliabilityOrchestrator Initialization** (Once Only)
   - Singleton pattern with built-in `isActive` checks
   - Lean mode detection and bypass
   - Comprehensive monitoring startup

5. **Web Vitals Service Initialization** (Once Only)
   - Performance metrics collection
   - Core Web Vitals tracking
   - Analytics integration

## Usage Patterns

### Main Application Bootstrap

```typescript
// frontend/src/main.tsx
import { bootstrapApp } from './bootstrap/bootstrapApp';

async function start() {
  const bootstrapResult = await bootstrapApp();
  
  if (bootstrapResult.alreadyBootstrapped) {
    logger.debug('Application already bootstrapped', bootstrapResult);
  }
  
  // Proceed with React rendering...
}
```

### Service Coordination

```typescript
// frontend/src/contexts/AuthContext.tsx
useEffect(() => {
  // Skip if bootstrap already handled auth
  const globalState = window as typeof window & { __A1_AUTH_RESTORED?: boolean };
  if (globalState.__A1_AUTH_RESTORED) {
    return;
  }
  
  // Proceed with auth initialization...
}, []);
```

### Development Options

```typescript
// Force re-initialization for debugging
await bootstrapApp({ force: true });

// Skip specific services for testing
await bootstrapApp({ 
  skipAuth: true,
  skipReliability: true 
});
```

## Configuration Options

### Bootstrap Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `force` | boolean | false | Force re-initialization even if already bootstrapped |
| `skipAuth` | boolean | false | Skip authentication restoration |
| `skipReliability` | boolean | false | Skip reliability monitoring |
| `skipWebVitals` | boolean | false | Skip Web Vitals initialization |

### Environment Detection

| Environment | Detection Method | Log Message |
|-------------|-----------------|-------------|
| `development` | `import.meta.env.MODE` or `NODE_ENV` | "A1Betting Platform Loading - Development Mode" |
| `production` | `import.meta.env.MODE` or `NODE_ENV` | "A1Betting Platform Loading - Production Mode" |
| `test` | `import.meta.env.MODE` or `NODE_ENV` | "A1Betting Platform Loading - Test Mode" |

### Lean Mode Integration

Bootstrap automatically detects lean mode to prevent heavy monitoring:

```typescript
function isLeanMode(): boolean {
  return (
    localStorage.getItem('DEV_LEAN_MODE') === 'true' ||
    new URLSearchParams(window.location.search).get('lean') === 'true'
  );
}
```

## Testing Support

### Idempotency Testing

```typescript
// Reset bootstrap state for testing
import { __resetBootstrapForTesting } from './bootstrap/bootstrapApp';

beforeEach(() => {
  __resetBootstrapForTesting();
});
```

### Mock Integration

```typescript
// Mock services for unit testing
jest.mock('../services/reliabilityMonitoringOrchestrator');
jest.mock('../services/webVitalsService');
jest.mock('../services/authService');
```

## Performance Characteristics

### Bootstrap Timing

- **Cold start**: ~50-150ms (includes service initialization)
- **Warm start**: <5ms (idempotent skip)
- **Memory overhead**: <1KB (global state tracking)

### Service Impact

| Service | Initialization Cost | Idempotency Benefit |
|---------|-------------------|-------------------|
| Error Handlers | ~1-2ms | Prevents duplicate event listeners |
| Auth Restoration | ~5-10ms | Eliminates duplicate console logs |
| ReliabilityOrchestrator | ~20-50ms | Prevents multiple monitoring intervals |
| Web Vitals | ~10-20ms | Avoids duplicate metric observers |

## Error Handling

### Bootstrap Failures

```typescript
try {
  await bootstrapApp();
} catch (error) {
  // Bootstrap logs detailed error information
  // Fallback error UI shown to user
  // Application startup terminates gracefully
}
```

### Service Initialization Errors

- **Auth Service**: Non-blocking, continues without authentication
- **Reliability Service**: Non-blocking, continues without monitoring  
- **Web Vitals**: Non-blocking, continues without metrics
- **Error Handlers**: Blocking, critical for application stability

## Migration Guide

### From Previous Architecture

**Before (Scattered Initialization)**:

```typescript
// main.tsx - Mixed concerns
logger.info('🚀 A1Betting Platform Loading - Production Mode');
window.addEventListener('error', errorHandler);

// AuthContext.tsx - Duplicate restoration
useEffect(() => {
  // Auth restoration logic
}, []);

// ReliabilityIntegrationWrapper.tsx - Multiple initialization
useEffect(() => {
  reliabilityOrchestrator.startMonitoring();
}, []);
```

**After (Centralized Bootstrap)**:

```typescript
// main.tsx - Clean separation
await bootstrapApp();

// Services automatically coordinated
// No duplicate initialization
// Accurate environment detection
```

### Breaking Changes

**None**: Bootstrap system is additive and maintains backward compatibility.

### Gradual Migration

1. **Phase 1**: Add bootstrap call to main.tsx
2. **Phase 2**: Remove duplicate logic from individual components
3. **Phase 3**: Add coordination flags to prevent double initialization

## Troubleshooting

### Common Issues

**Issue**: Bootstrap called multiple times

- **Cause**: Missing idempotency check
- **Solution**: Use `isBootstrapped()` before manual calls

**Issue**: Services not initializing

- **Cause**: Mocked dependencies in tests
- **Solution**: Ensure proper mock setup or use `skipAuth`/`skipReliability` options

**Issue**: Environment detection incorrect

- **Cause**: Build tool configuration
- **Solution**: Verify Vite/Webpack environment variable setup

### Debug Information

Enable detailed bootstrap logging:

```typescript
const result = await bootstrapApp();
console.log('Bootstrap Result:', result);
```

View bootstrap timing:

```typescript
// Check result.durationMs for performance analysis
// Check result.services for service initialization status
```

## Future Enhancements

### Planned Features

1. **Dynamic Service Loading**: Lazy load services based on user permissions
2. **Bootstrap Plugins**: Extensible plugin system for custom initialization
3. **Health Checks**: Post-bootstrap service validation
4. **Metrics Collection**: Bootstrap performance analytics
5. **Feature Flags**: Dynamic service enabling/disabling

### Extension Points

- **Custom Services**: Add new services to bootstrap sequence
- **Environment Types**: Support additional environment modes
- **Coordination Flags**: Add new global state coordination
- **Error Handlers**: Extend error handling patterns

## Related Documentation

- [Performance Metrics](../observability/performance_metrics.md)
- [Environment Configuration](../configuration/environments.md)
- [Service Architecture](./services.md)
- [Testing Guidelines](../testing/unit_testing.md)

---

Last updated: August 15, 2025 - PR2: Environment & Bootstrap Deduplication