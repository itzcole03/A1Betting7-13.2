# A1Betting Observability Guide

This document describes the comprehensive observability system implemented in A1Betting, including key metrics, tracing capabilities, error tracking, and interpretation guidelines.

## Overview

The A1Betting observability system provides lightweight, production-ready monitoring capabilities focused on critical betting operations. The system is designed to have minimal performance impact while providing essential insights into system behavior.

## Architecture

The observability system consists of three main components:

1. **InstrumentationService**: Core tracing and metrics collection
2. **Observability API**: REST endpoints for monitoring data access
3. **Structured Error Tracking**: Automated error grouping and analysis

## Core Instrumentation

### Key Operations Tracked

The system automatically instruments four critical betting operations:

#### 1. EV Enrichment (`ev_enrichment`)

- **Purpose**: Tracks expected value calculations for betting opportunities
- **Key Metrics**: Duration, success rate, error patterns
- **Typical Duration**: 10-50ms per calculation
- **Usage**: `await instrumentation_service.trace_ev_enrichment(betting_data)`

#### 2. Arbitrage Detection (`arbitrage_detection`)

- **Purpose**: Monitors arbitrage opportunity identification across bookmakers
- **Key Metrics**: Detection speed, opportunity count, processing efficiency
- **Typical Duration**: 20-100ms per analysis
- **Usage**: `await instrumentation_service.trace_arbitrage_detection(odds_data)`

#### 3. Odds Normalization (`odds_normalization`)

- **Purpose**: Tracks odds format standardization and validation
- **Key Metrics**: Normalization speed, format conversions, validation errors
- **Typical Duration**: 5-30ms per odds set
- **Usage**: `await instrumentation_service.trace_odds_normalization(raw_odds)`

#### 4. Line Movement Snapshot (`line_movement_snapshot`)

- **Purpose**: Monitors line movement tracking and historical data capture
- **Key Metrics**: Snapshot creation time, data volume, historical comparisons
- **Typical Duration**: 15-75ms per snapshot
- **Usage**: `await instrumentation_service.trace_line_movement_snapshot(line_data)`

### Implementation Example

```python
from backend.services.instrumentation_service import instrumentation_service

# Automatic tracing with context manager
async def process_betting_opportunity(odds_data):
    # Trace odds normalization
    async with instrumentation_service.trace_operation("odds_normalization"):
        normalized_odds = await normalize_odds(odds_data)
    
    # Trace EV enrichment
    async with instrumentation_service.trace_operation("ev_enrichment"):
        ev_data = await calculate_expected_value(normalized_odds)
    
    # Trace arbitrage detection
    async with instrumentation_service.trace_operation("arbitrage_detection"):
        arbitrage_opps = await detect_arbitrage(normalized_odds)
    
    return {
        "normalized_odds": normalized_odds,
        "expected_value": ev_data,
        "arbitrage_opportunities": arbitrage_opps
    }
```

## API Endpoints

### Primary Snapshot Endpoint

**GET `/api/observability/snapshot`**

Returns comprehensive observability data with guaranteed baseline structure:

```json
{
  "timings": {
    "ev_ms_avg": 25.4,
    "arbitrage_ms_avg": 45.2,
    "odds_norm_ms_avg": 12.1,
    "line_movement_ms_avg": 30.8
  },
  "recentErrors": [
    {
      "error_hash": "abc123def456",
      "operation": "arbitrage_detection",
      "timestamp": "2024-01-15T14:30:00Z",
      "error_type": "ValueError",
      "error_message": "Invalid odds format",
      "occurrences": 3
    }
  ],
  "activeFlags": {
    "tracing_enabled": true,
    "error_hashing_enabled": true,
    "metrics_collection_enabled": true,
    "span_sampling_rate": 0.8
  },
  "operationMetrics": {
    "ev_enrichment": {
      "total_calls": 1250,
      "success_rate": 0.985,
      "avg_duration_ms": 25.4,
      "p95_duration_ms": 45.0,
      "error_rate": 0.015
    }
  },
  "snapshotTimestamp": "2024-01-15T14:35:00Z"
}
```

### Additional Endpoints

#### Health Check

**GET `/api/observability/health`**

- Returns system health status and basic metrics
- Use for liveness/readiness probes

#### Operation Metrics

**GET `/api/observability/metrics/operations`**

- Detailed performance metrics per operation
- Includes percentiles, error rates, throughput

#### Error Summary

**GET `/api/observability/errors/summary`**

- Grouped error analysis with hash-based clustering
- Error frequency and trend analysis

#### Feature Flags

**GET `/api/observability/flags`**

- Current feature flag states
- Use for dynamic configuration management

#### Timing Data

**GET `/api/observability/timings`**

- Isolated timing metrics for performance analysis
- Lightweight endpoint for frequent polling

## Key Metrics Interpretation

### Timing Metrics

#### Expected Value Enrichment (`ev_ms_avg`)
- **Healthy Range**: 10-50ms
- **Warning Threshold**: >75ms
- **Critical Threshold**: >150ms
- **Optimization**: Consider caching frequently calculated EVs

#### Arbitrage Detection (`arbitrage_ms_avg`)
- **Healthy Range**: 20-80ms
- **Warning Threshold**: >120ms
- **Critical Threshold**: >200ms
- **Optimization**: Implement parallel bookmaker analysis

#### Odds Normalization (`odds_norm_ms_avg`)
- **Healthy Range**: 5-25ms
- **Warning Threshold**: >40ms
- **Critical Threshold**: >75ms
- **Optimization**: Pre-validate odds formats, use lookup tables

#### Line Movement Snapshots (`line_movement_ms_avg`)
- **Healthy Range**: 15-60ms
- **Warning Threshold**: >90ms
- **Critical Threshold**: >150ms
- **Optimization**: Batch historical comparisons, optimize database queries

### Error Analysis

#### Error Hash System
Errors are automatically grouped using normalized stack traces:

```python
# Example error hash generation
def normalize_stack_trace(stack_trace: str) -> str:
    """
    Normalize stack trace by:
    1. Removing line numbers and file paths
    2. Standardizing function names
    3. Grouping similar error patterns
    """
    # Remove specific line numbers: "line 123" -> "line XXX"
    normalized = re.sub(r'line \d+', 'line XXX', stack_trace)
    
    # Remove file paths, keep only filenames
    normalized = re.sub(r'/[^/\s]+/', '', normalized)
    
    # Remove memory addresses
    normalized = re.sub(r'0x[0-9a-fA-F]+', '0xXXX', normalized)
    
    return normalized
```

#### Error Severity Levels
- **Low**: Individual operation failures with fallbacks available
- **Medium**: Multiple failures of same operation type
- **High**: Critical path failures affecting user experience
- **Critical**: System-wide failures or data integrity issues

### Performance Benchmarks

#### Baseline Performance Targets
Based on production analysis of betting applications:

| Operation | Target (ms) | Good (ms) | Acceptable (ms) | Poor (ms) |
|-----------|-------------|-----------|----------------|-----------|
| EV Enrichment | <25 | <50 | <75 | >75 |
| Arbitrage Detection | <40 | <80 | <120 | >120 |
| Odds Normalization | <15 | <25 | <40 | >40 |
| Line Movement | <30 | <60 | <90 | >90 |

#### Success Rate Targets
- **Excellent**: >99.5% success rate
- **Good**: >98% success rate
- **Acceptable**: >95% success rate
- **Poor**: <95% success rate

## Feature Flags

The system supports dynamic configuration through feature flags:

### Core Flags
- `tracing_enabled`: Enable/disable trace collection
- `error_hashing_enabled`: Enable/disable error grouping
- `metrics_collection_enabled`: Enable/disable metrics aggregation
- `span_sampling_rate`: Percentage of operations to trace (0.0-1.0)

### Usage Example
```python
# Check if tracing is enabled
if instrumentation_service.get_flag("tracing_enabled", True):
    async with instrumentation_service.trace_operation("my_operation"):
        result = await my_expensive_operation()
```

### Dynamic Updates
Feature flags can be updated at runtime:

```bash
# Disable tracing temporarily
curl -X POST "http://localhost:8000/api/observability/flags/tracing_enabled" \
     -H "Content-Type: application/json" \
     -d false

# Reduce sampling rate during high load
curl -X POST "http://localhost:8000/api/observability/flags/span_sampling_rate" \
     -H "Content-Type: application/json" \
     -d 0.5
```

## Monitoring Best Practices

### Alert Configuration

#### Critical Alerts
- EV Enrichment failure rate >5%
- Arbitrage detection completely failing
- Any operation timing >200ms sustained
- Error hash cluster growing rapidly

#### Warning Alerts
- Operation timing exceeding 75th percentile for >5 minutes
- Error rate increasing trend over 15 minutes
- New error hash patterns emerging

### Dashboard Setup

#### Primary Metrics Dashboard
1. **Timing Overview**: All four operation timings on single chart
2. **Success Rates**: Success/failure rates per operation
3. **Error Trends**: Error count trends over time
4. **Performance Percentiles**: P50, P95, P99 timing distributions

#### Error Analysis Dashboard
1. **Error Hash Clusters**: Top error patterns by frequency
2. **Error Rate Trends**: Error rates over time by operation
3. **New Error Detection**: Recently discovered error patterns
4. **Error Resolution Status**: Tracking error pattern fixes

### Operational Procedures

#### Daily Health Check
```bash
# Quick health assessment
curl "http://localhost:8000/api/observability/snapshot" | jq '.timings'

# Check for new error patterns
curl "http://localhost:8000/api/observability/errors/summary" | jq '.errorSummaries | length'

# Verify feature flag states
curl "http://localhost:8000/api/observability/flags"
```

#### Performance Investigation
When performance issues are detected:

1. **Check snapshot for timing spikes**
2. **Review recent errors for correlation**
3. **Examine operation metrics for pattern changes**
4. **Verify feature flag states haven't changed**
5. **Check system resources and external dependencies**

#### Error Investigation
When new error patterns emerge:

1. **Identify error hash and affected operations**
2. **Check error frequency and growth rate**
3. **Review error messages for actionable information**
4. **Correlate with recent code deployments**
5. **Implement fixes and monitor error hash resolution**

## Integration Guidelines

### Adding New Operations

To instrument a new operation:

1. **Add convenience method to InstrumentationService**:
```python
async def trace_new_operation(self, data: dict) -> TraceSpan:
    """Trace a new betting operation"""
    return await self.trace_operation("new_operation", {
        "operation_type": "new_operation",
        "data_size": len(data),
        **data
    })
```

2. **Update baseline keys** in snapshot endpoint
3. **Add operation to monitoring dashboards**
4. **Define performance benchmarks**

### Custom Metrics

Add custom metrics to existing operations:

```python
async def my_betting_function():
    async with instrumentation_service.trace_operation("my_operation") as span:
        # Add custom metrics
        span.add_metric("custom_value", 42)
        span.add_metric("processing_complexity", "high")
        
        result = await process_data()
        
        # Add result metrics
        span.add_metric("result_count", len(result))
        span.add_metric("success", True)
        
        return result
```

### Error Context Enhancement

Provide rich error context for better debugging:

```python
try:
    result = await risky_operation()
except Exception as e:
    # Add context to error tracking
    instrumentation_service.track_error(e, "risky_operation", {
        "user_id": user_id,
        "operation_complexity": "high",
        "data_source": "external_api",
        "retry_count": retry_count
    })
    raise
```

## Performance Impact

The observability system is designed for minimal performance overhead:

### Timing Overhead
- **Trace creation**: <0.1ms per operation
- **Metric collection**: <0.05ms per metric
- **Error hashing**: <0.2ms per error
- **Total overhead**: <1% of operation time

### Memory Usage
- **Active spans**: ~200 bytes per span
- **Completed spans**: ~100 bytes per span (LRU cache)
- **Error hashes**: ~50 bytes per unique error
- **Total memory**: <10MB under normal load

### Storage Impact
- **Metrics retention**: 7 days in memory
- **Error retention**: 1000 most recent errors
- **Automatic cleanup**: Runs every hour
- **Optional Redis**: For persistent storage across restarts

## Troubleshooting

### Common Issues

#### High Memory Usage
**Symptoms**: Increasing memory consumption over time
**Causes**: Error accumulation, span retention
**Solutions**:
- Reduce span sampling rate
- Clear metrics periodically
- Implement error rate limiting

#### Missing Timing Data
**Symptoms**: Zero values in timing metrics
**Causes**: Disabled tracing, operation not instrumented
**Solutions**:
- Verify `tracing_enabled` flag
- Check operation instrumentation
- Review sampling rate settings

#### Inconsistent Error Hashing
**Symptoms**: Same errors creating multiple hashes
**Causes**: Environment-specific data in stack traces
**Solutions**:
- Enhance stack trace normalization
- Remove environment-specific patterns
- Update error hash algorithm

### Debug Mode

Enable detailed debugging:

```python
# Enable debug logging
instrumentation_service.update_flag("debug_mode", True)

# Increase span sampling
instrumentation_service.update_flag("span_sampling_rate", 1.0)

# Disable error hash clustering for detailed errors
instrumentation_service.update_flag("error_hashing_enabled", False)
```

### Performance Testing

Test observability overhead:

```python
import time
import asyncio

async def benchmark_tracing():
    """Benchmark tracing overhead"""
    
    # Test without tracing
    start = time.time()
    for i in range(1000):
        await simple_operation()
    baseline_time = time.time() - start
    
    # Test with tracing
    start = time.time()
    for i in range(1000):
        async with instrumentation_service.trace_operation("test"):
            await simple_operation()
    traced_time = time.time() - start
    
    overhead_pct = ((traced_time - baseline_time) / baseline_time) * 100
    print(f"Tracing overhead: {overhead_pct:.2f}%")
```

## Advanced Configuration

### Redis Integration

For production persistence:

```python
# Configure Redis backend
instrumentation_service.configure_redis(
    host="redis.example.com",
    port=6379,
    db=0,
    password="your_password"
)

# Enable Redis persistence
instrumentation_service.update_flag("redis_persistence", True)
```

### Custom Sampling

Implement intelligent sampling:

```python
def custom_sampling_strategy(operation: str, context: dict) -> bool:
    """Custom sampling logic"""
    
    # Always sample errors
    if context.get("has_error", False):
        return True
    
    # Sample high-value operations more frequently
    if operation in ["arbitrage_detection", "ev_enrichment"]:
        return random.random() < 0.8
    
    # Lower sampling for routine operations
    return random.random() < 0.2

# Apply custom sampling
instrumentation_service.set_sampling_strategy(custom_sampling_strategy)
```

### Metrics Export

Export metrics for external monitoring:

```python
def export_prometheus_metrics():
    """Export metrics in Prometheus format"""
    snapshot = instrumentation_service.get_observability_snapshot()
    
    metrics = []
    for operation, timing in snapshot["timings"].items():
        metrics.append(f'betting_operation_duration_ms{{operation="{operation}"}} {timing}')
    
    for operation, metrics_data in snapshot["operationMetrics"].items():
        success_rate = metrics_data["success_rate"]
        metrics.append(f'betting_operation_success_rate{{operation="{operation}"}} {success_rate}')
    
    return "\n".join(metrics)
```

## Conclusion

The A1Betting observability system provides comprehensive monitoring capabilities with minimal performance impact. Key benefits include:

- **Automatic instrumentation** of critical betting operations
- **Structured error tracking** with intelligent grouping
- **Real-time performance metrics** with configurable alerting
- **Feature flag support** for dynamic configuration
- **Minimal overhead** design for production deployment

Regular monitoring of the snapshot endpoint and proactive alert configuration will ensure optimal system performance and rapid issue resolution.

For questions or issues with the observability system, consult the API documentation or contact the development team.