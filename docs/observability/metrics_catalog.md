# Metrics Catalog - Step 5 Additions

## Payload Guard Metrics

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

## Example Queries

```promql
# Size rejection rate (requests/sec)
rate(payload_rejected_total{reason="size"}[5m])

# Content-type rejection percentage  
100 * rate(payload_rejected_total{reason="content-type"}[5m]) / rate(http_requests_total[5m])

# 95th percentile payload size
histogram_quantile(0.95, rate(request_payload_bytes_bucket[5m]))
```
