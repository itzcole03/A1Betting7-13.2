# Metrics Catalog - Steps 5 & 6 Additions

## Payload Guard Metrics (Step 5)

### payload_rejected_total
- **Type**: Counter
- **Labels**: `reason` (size, content-type)
- **Description**: Total number of payload rejections by reason
- **Usage**: Monitor security boundary enforcement and potential attacks
- **Alerting**: Alert if >100 size rejections in 5 minutes (potential DoS)

### request_payload_bytes  
- **Type**: Histogram
- **Buckets**: 1KB, 5KB, 25KB, 100KB, 250KB, 500KB, 1MB
- **Description**: Request payload size distribution for accepted requests
- **Usage**: Understand payload size patterns and optimize size limits
- **Alerting**: Monitor for unusual size distributions

## Security Headers Metrics (Step 6)

### security_headers_applied_total
- **Type**: Counter
- **Labels**: `header_type` (hsts, csp, x-frame-options, x-content-type-options, coop, coep, corp, permissions-policy)
- **Description**: Total number of security headers applied by type
- **Usage**: Verify security header application and track coverage
- **Alerting**: Alert if header application rate drops below expected baseline

### csp_violation_reports_total
- **Type**: Counter
- **Labels**: `directive` (script, style, default, etc.), `violated_directive` (full directive name)
- **Description**: Total number of CSP violation reports received
- **Usage**: Monitor content security policy violations and potential attacks
- **Alerting**: Alert on high violation rates or new violation patterns

## Example Queries

```promql
# Size rejection rate (requests/sec)
rate(payload_rejected_total{reason="size"}[5m])

# Content-type rejection percentage  
100 * rate(payload_rejected_total{reason="content-type"}[5m]) / rate(http_requests_total[5m])

# 95th percentile payload size
histogram_quantile(0.95, rate(request_payload_bytes_bucket[5m]))

# Security header application rate by type
rate(security_headers_applied_total[5m])

# CSP violation rate by directive type
rate(csp_violation_reports_total[5m])

# Top violated CSP directives
topk(5, sum by (violated_directive) (rate(csp_violation_reports_total[1h])))

# Security headers coverage percentage (should be ~100% when enabled)
100 * rate(security_headers_applied_total{header_type="csp"}[5m]) / rate(http_requests_total[5m])
```
