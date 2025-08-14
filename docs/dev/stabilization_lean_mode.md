# Lean Mode - Development Optimization (Stabilization Update)

## Purpose

Lean Mode is a development optimization feature that reduces runtime overhead by selectively disabling heavy monitoring, metrics collection, and non-essential middleware during development. This provides a cleaner, faster development experience while maintaining core API functionality.

**New in Stabilization Patch**: Enhanced middleware conditional loading, health endpoint standardization, and WebSocket optimization.

## Activation Precedence

Lean mode follows a hierarchical activation precedence (highest to lowest priority):

1. **Environment Variable** (highest priority)
   ```bash
   export APP_DEV_LEAN_MODE=true
   # or
   APP_DEV_LEAN_MODE=true uvicorn backend.main:app --reload
   ```

2. **Query Parameter** 
   ```
   GET /dev/mode?lean=true
   POST /api/sports/activate/MLB?lean=true
   ```

3. **Local Storage** (frontend only - lowest priority)
   ```javascript
   localStorage.setItem('dev_lean_mode', 'true');
   ```

4. **Default**: `false` (full feature mode)

## Impact - Disabled Features

When lean mode is active, the following features are disabled to reduce overhead:

### Backend Middleware Disabled:
- **PrometheusMetricsMiddleware** - Metrics collection and Prometheus endpoints
- **PayloadGuardMiddleware** - Request payload size validation (development only)
- **RateLimitMiddleware** - API rate limiting enforcement
- **SecurityHeadersMiddleware** - Security header injection (HSTS, CSP, etc.)

### Monitoring Services Disabled:
- **EnhancedMonitoringAlerting** - Real-time alerting system
- **RealTimePerformanceMetrics** - Performance metric collection
- **AutonomousMonitoringService** - Autonomous system monitoring
- **SystemMonitor** - System resource monitoring

### Background Tasks Disabled:
- **Model Performance Monitoring** - ML model performance tracking
- **Data Validation Jobs** - Periodic data integrity checks
- **Cache Warming** - Proactive cache population
- **Log Aggregation** - Centralized log processing

### Frontend Optimizations:
- **Reduced WebSocket Connections** - Minimal real-time features
- **Simplified State Management** - Core state only
- **Minimal Analytics** - Essential tracking only

## Status Check

Check current lean mode status:

```bash
# Via API endpoint
curl http://localhost:8000/dev/mode

# Response format:
{
  "success": true,
  "data": {
    "lean": false,
    "mode": "full", // or "lean"
    "features_disabled": []
  }
}
```

## Rollback / Re-enable Instructions

### Method 1: Environment Variable Reset
```bash
# Disable lean mode
unset APP_DEV_LEAN_MODE
# or explicitly set to false
export APP_DEV_LEAN_MODE=false

# Restart the application
uvicorn backend.main:app --reload
```

### Method 2: Runtime Toggle (if supported)
```bash
# Re-enable full mode
curl -X POST "http://localhost:8000/dev/mode" \
  -H "Content-Type: application/json" \
  -d '{"lean": false}'
```

### Method 3: Configuration File
```yaml
# backend/.env
APP_DEV_LEAN_MODE=false
```

### Method 4: Frontend Local Storage Reset
```javascript
// Clear lean mode preference
localStorage.removeItem('dev_lean_mode');
// or explicitly disable
localStorage.setItem('dev_lean_mode', 'false');

// Refresh the application
window.location.reload();
```

## Architecture Integration

Lean mode integrates with the core application factory pattern in `backend/core/app.py`:

```python
# Lean mode detection
is_lean_mode = settings.app.dev_lean_mode

# Conditional middleware loading
if not is_lean_mode:
    app.add_middleware(PrometheusMetricsMiddleware)
    app.add_middleware(PayloadGuardMiddleware)
    # ... other heavy middleware
```

This ensures clean separation between development optimization and production functionality.
