# CLV Metrics Operations Runbook

## Overview

This runbook provides operational procedures for monitoring and troubleshooting Customer Lifetime Value (CLV) metrics in the A1Betting PropFinder platform.

## Alert Conditions

### Critical Alerts

#### CLV High Failure Rate
- **Threshold**: `failure_rate > 5%` for 5 minutes
- **Severity**: Warning
- **Description**: CLV calculation failure rate exceeds acceptable threshold

#### CLV High Latency
- **Threshold**: `avg_latency > 500ms` for 2 minutes  
- **Severity**: Warning
- **Description**: CLV response time exceeds performance SLA

### Monitoring Metrics

| Metric | Normal Range | Warning Threshold | Critical Threshold |
|--------|--------------|-------------------|-------------------|
| Success Rate | >95% | <95% | <90% |
| P95 Latency | <300ms | >500ms | >1000ms |
| P99 Latency | <500ms | >800ms | >1500ms |
| Cache Hit Rate | >80% | <70% | <50% |

## Troubleshooting Procedures

### High Failure Rate (>5%)

#### Immediate Actions
1. **Check service health**:
   ```bash
   curl -s http://localhost:8000/api/propfinder/opportunities?clv_diag=1 | jq '.error'
   ```

2. **Verify database connectivity**:
   ```bash
   # Check if database is accessible
   curl -s http://localhost:8000/health | jq '.data.components.database'
   ```

3. **Check error logs**:
   ```bash
   tail -f backend/logs/propollama.log | grep -i "clv\|error"
   ```

#### Root Cause Analysis
- **Database Issues**: Connection timeouts, schema changes
- **Cache Problems**: Redis unavailable, memory pressure
- **Code Bugs**: Recent deployments, configuration changes
- **External Dependencies**: API rate limits, network issues

#### Resolution Steps
1. **Database Recovery**:
   - Restart database service if connection issues
   - Check for table locks or deadlocks
   - Verify schema integrity

2. **Cache Recovery**:
   - Restart Redis service
   - Clear corrupted cache entries
   - Monitor memory usage

3. **Application Recovery**:
   - Restart application server
   - Check configuration files
   - Rollback recent deployments if necessary

### High Latency (>500ms)

#### Immediate Actions
1. **Check system resources**:
   ```bash
   # CPU and memory usage
   top -p $(pgrep -f "uvicorn")
   
   # Disk I/O
   iostat -x 1 5
   ```

2. **Analyze slow queries**:
   ```bash
   # Check for slow database queries
   curl -s http://localhost:8000/api/propfinder/opportunities?clv_diag=1 | jq '.meta.timing'
   ```

3. **Monitor cache performance**:
   ```bash
   # Check cache hit rates
   curl -s http://localhost:8000/internal/metrics | grep clv_cache
   ```

#### Performance Optimization
1. **Database Optimization**:
   - Add missing indexes
   - Optimize query execution plans
   - Consider connection pooling adjustments

2. **Cache Optimization**:
   - Increase cache TTL for stable data
   - Implement cache warming strategies
   - Add cache partitioning

3. **Application Optimization**:
   - Profile code for bottlenecks
   - Implement request batching
   - Add async processing for non-critical operations

## Monitoring Setup

### Prometheus Configuration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'a1betting-clv'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/internal/metrics'
    scrape_interval: 30s
    params:
      include_clv: ['1']
```

### Alert Rules

```yaml
# clv_alerts.yml
groups:
  - name: clv_slo
    rules:
      - alert: CLVHighFailureRate
        expr: |
          (
            clv_failure_rate_total / 
            (clv_success_rate_total + clv_failure_rate_total)
          ) > 0.05
        for: 5m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "CLV failure rate above 5%"
          description: "CLV failure rate is {{ $value | humanizePercentage }} for 5 minutes"
          runbook: "https://docs.a1betting.com/runbooks/clv-metrics"
          
      - alert: CLVHighLatency
        expr: clv_latency_ms{quantile="0.95"} > 500
        for: 2m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "CLV 95th percentile latency above 500ms"
          description: "CLV latency is {{ $value }}ms at 95th percentile"
          runbook: "https://docs.a1betting.com/runbooks/clv-metrics"
          
      - alert: CLVCachePerformanceDegraded
        expr: |
          (
            clv_cache_hits_total / 
            (clv_cache_hits_total + clv_cache_misses_total)
          ) < 0.7
        for: 10m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "CLV cache hit rate below 70%"
          description: "CLV cache efficiency is {{ $value | humanizePercentage }}"
```

### Grafana Dashboard Queries

```promql
# Success Rate
100 * (clv_success_rate_total / (clv_success_rate_total + clv_failure_rate_total))

# P95 Latency
clv_latency_ms{quantile="0.95"}

# Cache Hit Rate  
100 * (clv_cache_hits_total / (clv_cache_hits_total + clv_cache_misses_total))

# Requests Per Second
rate(clv_success_rate_total[5m]) + rate(clv_failure_rate_total[5m])
```

## Escalation Procedures

### Level 1: Platform Team
- **Response Time**: 15 minutes
- **Actions**: Basic troubleshooting, service restarts
- **Escalation Trigger**: Issue persists >30 minutes

### Level 2: Engineering Team  
- **Response Time**: 30 minutes
- **Actions**: Code analysis, database optimization
- **Escalation Trigger**: Issue persists >1 hour

### Level 3: Architecture Team
- **Response Time**: 1 hour
- **Actions**: System redesign, infrastructure changes
- **Escalation Trigger**: System-wide impact

## Contact Information

| Role | Primary | Backup |
|------|---------|---------|
| Platform Engineer | platform@a1betting.com | +1-555-PLATFORM |
| Database Admin | dba@a1betting.com | +1-555-DATABASE |
| Engineering Manager | eng-mgr@a1betting.com | +1-555-ENGINEER |

## Recovery Procedures

### Emergency Rollback
```bash
# Quick rollback to previous version
git checkout HEAD~1
docker build -t a1betting:rollback .
docker-compose up -d --force-recreate app

# Verify rollback
curl -s http://localhost:8000/health | jq '.data.version'
```

### Database Recovery
```sql
-- Check for corrupted CLV data
SELECT COUNT(*) FROM opportunities WHERE clv_score IS NULL;

-- Rebuild CLV metrics if necessary
UPDATE opportunities SET clv_score = calculate_clv(user_id, bet_amount) 
WHERE clv_score IS NULL;
```

### Cache Recovery
```bash
# Clear CLV-related cache entries
redis-cli EVAL "return redis.call('del', unpack(redis.call('keys', 'clv:*')))" 0

# Warm cache with recent data
curl -s "http://localhost:8000/api/propfinder/opportunities?include_clv=1&cache_warm=1"
```

## Performance Baselines

### Expected Performance
- **Success Rate**: 99%+ under normal load
- **P95 Latency**: <200ms for cached responses
- **P99 Latency**: <400ms for cache misses
- **Cache Hit Rate**: 85%+ during steady state

### Load Testing Results
- **Peak RPS**: 500 requests/second
- **Concurrent Users**: 1000+ simultaneous users
- **Memory Usage**: <512MB at peak load
- **CPU Usage**: <70% at peak load

## Change Log

| Date | Change | Impact |
|------|--------|--------|
| 2025-09-04 | Initial runbook creation | Baseline operational procedures |
| | CLV metrics instrumentation | Enhanced monitoring capabilities |
| | Alert thresholds established | Proactive issue detection |

---

**Last Updated**: September 4, 2025  
**Version**: 1.0  
**Owner**: Platform Engineering Team

## Related Analytics Interplay (New)

CLV analytics interacts with adjacent subsystems that also contribute metrics and operational context:

- EV Enrichment
  - Endpoint: `POST /api/ev/calc`
  - Observability timings key: `ev_ms_avg`
  - Runbook note: spikes in CLV latency with stable cache hit rate can coincide with heavy EV calculations; verify EV payload sizes and batching.

- Hardened Arbitrage Validation
  - Endpoints under: `/api/arbitrage/*`
  - Observability timings key: `arbitrage_ms_avg`
  - Validation warnings surfaced via `/api/data/validation/summary`; look for `arbitrage_probability_violation`, `arbitrage_missing_sides`.

- Line Movement
  - Endpoints under: `/api/lines/*` (e.g., snapshot, metrics, recent-significant)
  - Observability timings key: `line_movement_ms_avg`
  - Operation metrics: includes `line_movement_snapshot`
  - Interplay: CLV opportunity quality often correlates with recent line movement; consult line movement metrics during incident reviews.

- Smart Signals
  - Endpoints: `/api/signals/health`, `/api/signals/smart`
  - Feature flag gate: `ENABLE_SMART_SIGNALS`
  - Prometheus counter: `smart_signals_generated_total`
  - Interplay: Elevated smart-signal generation volume may increase background load; watch CLV latency and cache hit rate.

- Odds Provider Status
  - Endpoints under: `/api/odds/providers/*` (status, statistics, confidence-scores, health dashboard)
  - Use during CLV incidents to confirm upstream provider health and latency percentiles.

 

Cross-Checks

- `GET /api/observability/snapshot` → confirm presence and magnitude of `ev_ms_avg`, `arbitrage_ms_avg`, `odds_norm_ms_avg`, `line_movement_ms_avg`.
- `GET /api/observability/metrics/operations` → confirm operation counters progression.
