# Health Endpoint Migration Guide

## Overview

The A1Betting platform has migrated from a simple health check endpoint to a structured, comprehensive health monitoring system. This migration provides richer health information, component-level monitoring, and improved observability.

## Migration Summary

| Aspect | Legacy | New |
|--------|--------|-----|
| **Endpoint** | `/api/health` | `/api/v2/diagnostics/health` |
| **Response Format** | Simple envelope | Structured health status |
| **Component Monitoring** | None | WebSocket, Cache, Model Inference |
| **Uptime Tracking** | None | Precise uptime in seconds |
| **Version Info** | None | Version and build information |
| **Deprecation Status** | Deprecated | Current standard |

## New Health Response Format

### Endpoint: `/api/v2/diagnostics/health`

```json
{
  "status": "ok",
  "uptime_seconds": 3600.45,
  "version": "v2", 
  "timestamp": "2025-08-15T10:30:00.000Z",
  "components": {
    "websocket": {
      "status": "up",
      "last_check": "2025-08-15T10:30:00.000Z",
      "response_time_ms": 15.2,
      "details": {
        "active_connections": 0
      }
    },
    "cache": {
      "status": "up",
      "last_check": "2025-08-15T10:30:00.000Z", 
      "response_time_ms": 8.1,
      "details": {
        "cache_type": "memory"
      }
    },
    "model_inference": {
      "status": "degraded",
      "last_check": "2025-08-15T10:30:00.000Z",
      "response_time_ms": 120.5,
      "details": {
        "model_loaded": true,
        "inference_queue_size": 2
      }
    }
  },
  "build_info": {
    "version": "1.0.0",
    "environment": "production"
  }
}
```

### Response Fields

#### Root Level

- **`status`**: Overall system health (`"ok"` | `"degraded"` | `"unhealthy"`)
- **`uptime_seconds`**: Precise system uptime since startup (float)
- **`version`**: Health endpoint version (`"v2"`)
- **`timestamp`**: ISO8601 timestamp of health check
- **`components`**: Object containing individual component health
- **`build_info`**: Optional build and deployment information

#### Component Health Structure

Each component in `components` has:

- **`status`**: Component status (`"up"` | `"degraded"` | `"down"` | `"unknown"`)
- **`last_check`**: ISO8601 timestamp of last component check
- **`response_time_ms`**: Component check response time (optional)
- **`details`**: Component-specific additional information (optional)

## Legacy Endpoint Compatibility

### Current Behavior: `/api/health`

The legacy endpoint now returns a deprecation notice:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "deprecated": true,
    "forward": "/api/v2/diagnostics/health",
    "message": "This endpoint is deprecated. Use /api/v2/diagnostics/health for structured health information."
  },
  "error": null,
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Deprecation Timeline

- **Phase 1 (Current)**: Legacy endpoint returns deprecation warnings
- **Phase 2 (Target: Q1 2026)**: Legacy endpoint returns HTTP 410 Gone
- **Phase 3 (Target: Q2 2026)**: Legacy endpoint removed entirely

## Migration for Different Use Cases

### 1. Automated Monitoring Systems

**Before:**
```bash
curl http://localhost:8000/api/health
```

**After:**
```bash 
curl http://localhost:8000/api/v2/diagnostics/health
```

**Monitoring Script Migration:**
```bash
#!/bin/bash
# Old monitoring
if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
  echo "Service is healthy"
fi

# New monitoring with structured status
HEALTH_RESPONSE=$(curl -s http://localhost:8000/api/v2/diagnostics/health)
STATUS=$(echo $HEALTH_RESPONSE | jq -r '.status')
UPTIME=$(echo $HEALTH_RESPONSE | jq -r '.uptime_seconds')

if [ "$STATUS" = "ok" ]; then
  echo "Service is healthy (uptime: ${UPTIME}s)"
elif [ "$STATUS" = "degraded" ]; then
  echo "Service is degraded (uptime: ${UPTIME}s)"
  exit 1
else
  echo "Service is unhealthy (uptime: ${UPTIME}s)"
  exit 2
fi
```

### 2. Load Balancer Health Checks

**NGINX:**
```nginx
upstream backend {
    server localhost:8000;
    
    # Old health check
    # health_check uri=/api/health;
    
    # New health check
    health_check uri=/api/v2/diagnostics/health match=healthy_response;
}

match healthy_response {
    status 200;
    header Content-Type ~ "application/json";
    body ~ '"status":"ok"';
}
```

**HAProxy:**
```haproxy
backend webservers
    balance roundrobin
    
    # Old health check
    # option httpchk GET /api/health
    
    # New health check  
    option httpchk GET /api/v2/diagnostics/health
    http-check expect status 200
    http-check expect string "\"status\":\"ok\""
    
    server web1 localhost:8000 check
```

### 3. Kubernetes Readiness/Liveness Probes

**Before:**
```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: a1betting
        livenessProbe:
          httpGet:
            path: /api/health
            port: 8000
```

**After:**
```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: a1betting
        livenessProbe:
          httpGet:
            path: /api/v2/diagnostics/health
            port: 8000
          # Optional: Check for specific status
        readinessProbe:
          httpGet:
            path: /api/v2/diagnostics/health
            port: 8000
          # Readiness can be more strict
          successThreshold: 1
          failureThreshold: 3
```

### 4. Frontend Integration

**Before:**
```typescript
// Legacy health check
const checkHealth = async () => {
  const response = await fetch('/api/health');
  const data = await response.json();
  return data.success && data.data.status === 'ok';
};
```

**After:**
```typescript
// New structured health check
import { useHealthStatus } from '../health/useHealthStatus';

const HealthMonitor: React.FC = () => {
  const { data, loading, error } = useHealthStatus({
    pollInterval: 60000, // Poll every minute
    maxRetries: 5
  });

  if (loading) return <div>Checking health...</div>;
  if (error) return <div>Health check failed: {error.message}</div>;
  
  return (
    <div className={`health-status ${data?.status}`}>
      <span>Status: {data?.status}</span>
      <span>Uptime: {formatUptime(data?.uptime_seconds)}</span>
      <ComponentHealthDetails components={data?.components} />
    </div>
  );
};
```

## Component Health Interpretation

### Status Values

#### System Status
- **`"ok"`**: All components healthy, system fully operational
- **`"degraded"`**: One or more components degraded, system partially functional
- **`"unhealthy"`**: Critical components down, system impaired

#### Component Status  
- **`"up"`**: Component fully functional
- **`"degraded"`**: Component functional but performance impacted
- **`"down"`**: Component not functional
- **`"unknown"`**: Component status could not be determined

### Component Types

#### WebSocket (`websocket`)
- **Purpose**: Real-time communication health
- **Key Details**: `active_connections` count
- **Degraded Conditions**: High connection count, slow responses
- **Down Conditions**: WebSocket server unavailable

#### Cache (`cache`)  
- **Purpose**: Caching layer health
- **Key Details**: `cache_type`, memory usage
- **Degraded Conditions**: High memory usage, slow cache operations
- **Down Conditions**: Cache service unavailable

#### Model Inference (`model_inference`)
- **Purpose**: ML/AI model availability 
- **Key Details**: `model_loaded`, `inference_queue_size`
- **Degraded Conditions**: High queue size, slow inference
- **Down Conditions**: Models not loaded, inference service down

## Troubleshooting

### Common Migration Issues

#### 1. Health Check Failures After Migration

**Symptom**: Health checks fail after switching to new endpoint

**Possible Causes**:
- New endpoint not available (check routing)
- Response format expectations not updated
- Monitoring thresholds too strict

**Resolution**:
```bash
# Test new endpoint directly
curl -v http://localhost:8000/api/v2/diagnostics/health

# Check for proper JSON response
curl -s http://localhost:8000/api/v2/diagnostics/health | jq .

# Verify response status
curl -s http://localhost:8000/api/v2/diagnostics/health | jq -r '.status'
```

#### 2. False Degraded Status

**Symptom**: System reports "degraded" when it appears healthy

**Possible Causes**:
- Component health check timeouts
- Strict performance thresholds
- Resource constraints

**Resolution**:
- Check individual component status in response
- Review component details for specific issues
- Adjust monitoring thresholds if needed

#### 3. Legacy Endpoint Still In Use

**Symptom**: Applications still using deprecated `/api/health`

**Detection**:
```bash
# Check server logs for deprecated endpoint usage
grep "/api/health" /var/log/a1betting/access.log

# Monitor deprecation warnings
curl -s http://localhost:8000/api/health | jq -r '.data.deprecated'
```

**Resolution**:
- Audit all health check configurations
- Update monitoring scripts and infrastructure
- Set up alerts for deprecated endpoint usage

### Health Check Best Practices

#### 1. Appropriate Polling Intervals
- **Production**: 60-120 seconds
- **Development**: 30-60 seconds  
- **CI/CD**: 10-30 seconds

#### 2. Timeout Configuration
- **Connection Timeout**: 5 seconds
- **Read Timeout**: 10 seconds
- **Total Timeout**: 15 seconds

#### 3. Retry Logic
- **Maximum Retries**: 3-5 attempts
- **Backoff Strategy**: Exponential with jitter
- **Circuit Breaker**: After 5 consecutive failures

#### 4. Alert Thresholds
- **Immediate**: System status "unhealthy"
- **Warning**: System status "degraded" for >5 minutes
- **Info**: Individual component status changes

## Integration Examples

### Prometheus Monitoring

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'a1betting-health'
    metrics_path: '/api/v2/diagnostics/health'
    static_configs:
      - targets: ['localhost:8000']
    metric_relabel_configs:
      - source_labels: [status]
        target_label: health_status
      - source_labels: [uptime_seconds]
        target_label: uptime
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "A1Betting Health Monitoring",
    "panels": [
      {
        "title": "System Health Status",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"a1betting-health\"}"
          }
        ]
      },
      {
        "title": "Component Health",
        "type": "table", 
        "targets": [
          {
            "expr": "a1betting_component_status"
          }
        ]
      }
    ]
  }
}
```

## Rollback Plan

If migration issues occur, you can temporarily revert to legacy behavior:

### 1. Emergency Rollback

```bash
# Restore legacy health endpoint behavior
export HEALTH_LEGACY_MODE=true
systemctl restart a1betting
```

### 2. Gradual Rollback

Update monitoring systems to use legacy endpoint temporarily while investigating issues:

```bash
# Update monitoring to use legacy endpoint  
sed -i 's|/api/v2/diagnostics/health|/api/health|g' /etc/monitoring/config.yml
systemctl reload monitoring-service
```

### 3. Permanent Rollback (Not Recommended)

If permanent rollback is necessary:

1. Update all infrastructure configurations
2. Remove new health endpoint references
3. Document reasons for rollback
4. Plan future migration strategy

## Support and Resources

### Documentation
- [API Reference](../api/health-endpoints.md)
- [Monitoring Best Practices](../monitoring/health-checks.md)
- [Component Architecture](../architecture/health-system.md)

### Troubleshooting
- Check application logs for health service errors
- Verify network connectivity to health endpoints  
- Review component-specific monitoring logs
- Test health endpoints manually with curl/Postman

### Migration Assistance
For migration support:
1. Review this documentation thoroughly
2. Test changes in development environment
3. Plan phased rollout for production systems
4. Monitor systems closely during migration
5. Have rollback plan ready

---

*Last Updated: 2025-08-15*  
*Migration Guide Version: 1.0*