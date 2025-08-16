# K6 Load Testing Configuration and Scripts
# Performance optimization validation for A1Betting platform

## Quick Start

### Install k6
```bash
# Windows (using chocolatey)
choco install k6

# Or download from https://k6.io/docs/get-started/installation/
# Extract k6.exe to your PATH
```

### Run Load Tests

#### 1. Basic Sports Activation Test
```bash
k6 run --summary-trend-stats="avg,min,med,max,p(95),p(99)" tests/load/performance-load-test.js
```

#### 2. Specific Scenario Testing
```bash
# Test only sports activation
k6 run --env SCENARIO=sports_activation tests/load/performance-load-test.js

# Test only inference throughput  
k6 run --env SCENARIO=inference_throughput tests/load/performance-load-test.js

# Test only cache performance
k6 run --env SCENARIO=cache_performance tests/load/performance-load-test.js

# Test only pagination stress
k6 run --env SCENARIO=pagination_stress tests/load/performance-load-test.js
```

#### 3. Custom Configuration
```bash
# High load test
k6 run --vus 50 --duration 5m tests/load/performance-load-test.js

# Quick smoke test
k6 run --vus 1 --duration 30s tests/load/performance-load-test.js
```

## Test Scenarios

### 1. Sports Activation Workflow
- **Purpose**: Validate complete sports activation flow
- **Duration**: 4 minutes
- **Load Pattern**: Ramp 0→10→20→0 users
- **Tests**: 
  - Sport activation endpoint
  - Today's games fetching
  - Comprehensive props generation
  - Cache header validation

### 2. Inference Throughput
- **Purpose**: Measure ML inference performance under load
- **Duration**: 2 minutes  
- **Load Pattern**: Constant 30 RPS
- **Tests**:
  - Modern ML prediction endpoint
  - Batch prediction processing
  - Response time validation
  - Concurrent request handling

### 3. Cache Performance
- **Purpose**: Validate ETag and caching optimizations
- **Duration**: 2 minutes
- **Load Pattern**: Ramp 1→5→15→0 users
- **Tests**:
  - Static endpoint caching
  - ETag conditional requests
  - Cache hit rate measurement
  - Redis performance

### 4. Pagination Stress
- **Purpose**: Test server-side pagination under load
- **Duration**: 1 minute
- **Load Pattern**: Constant 10 users
- **Tests**:
  - Offset-based pagination
  - Cursor-based pagination
  - Various page sizes (50, 100, 200)
  - Response time validation

## Performance Thresholds

| Metric | Threshold | Description |
|--------|-----------|-------------|
| HTTP Request Duration (95th percentile) | < 2000ms | Overall response time |
| HTTP Request Failure Rate | < 10% | Error rate threshold |
| Inference Latency (95th percentile) | < 1500ms | ML prediction response time |
| Pagination Latency (95th percentile) | < 800ms | Pagination response time |
| Sports Activation Time (95th percentile) | < 3000ms | Complete activation workflow |
| Cache Hit Rate | > 70% | Caching effectiveness |

## Custom Metrics Tracked

- **errorRate**: Failed request percentage
- **cacheHitRate**: Successful cache validations
- **inferenceLatency**: ML prediction response times
- **paginationLatency**: Pagination endpoint response times
- **cacheMissCounter**: Number of cache misses
- **activationTime**: Complete sports activation workflow time

## Results Analysis

### Expected Performance Characteristics

**Optimal Performance Indicators:**
- Sports activation: < 2 seconds end-to-end
- Inference requests: < 1 second average
- Cache hit rate: > 80%
- Pagination: < 500ms average
- Error rate: < 2%

**Performance Bottleneck Indicators:**
- Activation time > 5 seconds (ML model loading issues)
- Inference latency > 2 seconds (GPU/CPU resource contention)
- Cache hit rate < 50% (ETag implementation issues)
- Pagination latency > 1 second (database query optimization needed)

### Interpreting Results

1. **Check Summary Report**: k6 automatically provides percentile analysis
2. **Monitor Error Rates**: Look for 4xx/5xx HTTP responses
3. **Analyze Trends**: Use `--summary-trend-stats` for detailed percentile data
4. **Resource Usage**: Monitor backend CPU/memory during tests

## Troubleshooting

### Backend Not Responding
```bash
# Check backend health
curl http://127.0.0.1:8000/health

# Verify services are running
curl http://127.0.0.1:8000/api/debug/status
```

### High Error Rates
- Check backend logs: `backend/logs/propollama.log`
- Verify Redis is running
- Ensure ML models are loaded
- Check database connections

### Poor Cache Performance  
- Verify ETag headers in responses
- Check Redis connectivity
- Review cache middleware configuration
- Monitor cache hit rates in backend logs

### Slow Inference
- Check GPU availability
- Monitor ML service logs
- Verify model loading status
- Review batch processing queues

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: Performance Load Test
on: [push, pull_request]

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install k6
        run: |
          wget -q -O - https://dl.k6.io/key.gpg | apt-key add -
          echo "deb https://dl.k6.io/deb stable main" | tee /etc/apt/sources.list.d/k6.list
          apt-get update && apt-get install k6
      
      - name: Start Backend
        run: |
          python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
          sleep 30  # Wait for startup
      
      - name: Run Load Tests
        run: k6 run --quiet tests/load/performance-load-test.js
```

## Advanced Usage

### Environment Variables
```bash
export K6_BACKEND_URL="http://custom-backend:8000"
export K6_TEST_DURATION="10m"
export K6_MAX_VUS="100"

k6 run tests/load/performance-load-test.js
```

### HTML Report Generation
```bash
k6 run --out html=report.html tests/load/performance-load-test.js
```

### JSON Results Export
```bash
k6 run --out json=results.json tests/load/performance-load-test.js
```

---

## Validation Checklist

Before running load tests, ensure:

- [ ] Backend is running on port 8000
- [ ] Redis is accessible
- [ ] ML models are loaded
- [ ] Database is connected
- [ ] Frontend is built (if testing full workflow)
- [ ] k6 is installed and in PATH
- [ ] Test environment has sufficient resources