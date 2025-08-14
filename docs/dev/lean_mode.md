# Development Lean Mode Guide

## Overview

Lean mode is a development optimization feature that disables heavy monitoring, performance tracking, and non-essential background processes to provide a cleaner, faster development experience.

## When to Use Lean Mode

- **Development Environment**: Reduce console noise and HTTP request spam
- **Debugging Sessions**: Focus on core functionality without monitoring interference
- **Performance Testing**: Get baseline performance without monitoring overhead
- **CI/CD Testing**: Faster test runs with minimal logging

## Enabling Lean Mode

### Method 1: Environment Variable (Recommended)

Add to your environment or `.env` file:
```bash
DEV_LEAN_MODE=true
```

### Method 2: URL Parameter (Quick Toggle)

Add `?lean=true` to any URL:
```
http://localhost:5173/?lean=true
```

### Method 3: LocalStorage (Browser Console)

```javascript
localStorage.setItem('DEV_LEAN_MODE', 'true');
// Refresh page to apply
```

## What Gets Disabled in Lean Mode

### Backend
- Heavy monitoring middleware
- Detailed request/response logging 
- Performance metrics collection
- Rate limiting (set to high thresholds)
- Non-essential background tasks

### Frontend  
- ReliabilityMonitoringOrchestrator
- LiveDemoPerformanceMonitor  
- DataPipelineStabilityMonitor
- Automatic health checks every 5-15 seconds
- Console spam from monitoring systems

## What Stays Enabled

✅ Core application functionality  
✅ User interactions and navigation  
✅ API requests and responses  
✅ Error handling and logging  
✅ Basic health checks  
✅ WebSocket connections  

## Configuration Options

### Backend Settings

```python
# backend/config/settings.py
class AppSettings:
    dev_lean_mode: bool = Field(default=False)
```

### Frontend Settings

The frontend automatically detects lean mode through:
- `localStorage.getItem('DEV_LEAN_MODE')`  
- URL parameter `lean=true`

## Verification

### Check if Lean Mode is Active

**Backend**: Look for log message:
```
Lean mode enabled - skipping heavy monitoring
```

**Frontend Console**: Look for message:
```  
[ReliabilityIntegration] Lean mode enabled - monitoring disabled
```

### Network Tab
- Significantly fewer HEAD/GET requests to health endpoints
- No repeated calls to `/performance/stats`
- Reduced WebSocket message frequency

## Troubleshooting

### Lean Mode Not Working

1. **Clear browser cache and localStorage**
2. **Restart development servers** 
3. **Verify environment variables** are set
4. **Check console** for lean mode activation messages

### Re-enabling Monitoring

Remove the lean mode setting:

```javascript
// Browser console
localStorage.removeItem('DEV_LEAN_MODE');

// Or environment
unset DEV_LEAN_MODE
```

Then refresh/restart.

## Advanced Configuration

### Custom Monitoring Intervals

Even in non-lean mode, you can adjust monitoring frequency:

```typescript
// Frontend - adjust monitoring intervals
const config = {
  checkInterval: 30000,  // 30 seconds instead of 5
  enablePerformanceTracking: false,
  enableAutoRecovery: false
};
```

### Selective Monitoring

Enable only specific monitoring components:

```typescript  
const monitoringConfig = {
  minimal: {
    enablePerformanceTracking: false,
    enableDataPipelineMonitoring: false,
    enableServiceHealthChecks: true,  // Keep only basic health
    enableAutoRecovery: false
  }
};
```

## Development Workflow Integration

### VS Code Tasks

Add lean mode to your development tasks:

```json
{
  "type": "shell",
  "label": "Start Frontend (Lean Mode)",
  "command": "cd frontend && DEV_LEAN_MODE=true npm run dev"
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev:lean": "DEV_LEAN_MODE=true npm run dev",
    "dev:full": "npm run dev" 
  }
}
```

## Impact on Features

| Feature | Lean Mode | Normal Mode |
|---------|-----------|-------------|
| Core App | ✅ Full | ✅ Full |
| Health Checks | ⚡ Basic | 🔍 Comprehensive |
| Performance Monitoring | ❌ Disabled | ✅ Enabled |
| Error Recovery | ❌ Manual | ✅ Automatic |
| Trend Analysis | ❌ Disabled | ✅ Enabled |
| Console Logging | ⚡ Minimal | 🔍 Verbose |

## Restoring Full Monitoring

When you need full monitoring for debugging reliability issues:

1. **Disable lean mode**: Remove environment variable or URL parameter
2. **Refresh the application**  
3. **Check console** for monitoring startup messages
4. **Monitor network tab** for health check requests
5. **Wait 1-2 minutes** for comprehensive reports to generate

This allows switching between lean development and full monitoring as needed.
