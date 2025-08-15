# Performance Metrics Normalization (PR1)

This document describes the unified performance metrics strategy introduced in PR1 (Performance Metrics Correction).

## Goals

1. Eliminate negative `totalLoadTime` values
2. Prevent duplicate Largest Contentful Paint (LCP) logging
3. Provide a single normalization surface for navigation timing & web vitals
4. Maintain backward compatibility with existing logging consumers
5. Establish comprehensive testing coverage for performance utilities

## Implementation Overview

| Concern | Previous State | New State |
|---------|----------------|-----------|
| LCP Duplication | `performance.ts` observer + `webVitalsService` | Single source via `initWebVitals` guard (first LCP only) |
| Total Load Time | Mixed legacy `performance.timing` + modern `duration` | Always prefer `PerformanceNavigationTiming.duration` |
| Negative Values | Possible when mixing `Date.now()` & `performance.now()` | Clamp to non-negative in normalization helper |
| Initialization | Multiple scattered observers | Idempotent `initWebVitals()` function |
| Test Coverage | Minimal unit tests | Comprehensive test suites with edge cases |

## Key Modules

### `frontend/src/perf/performanceMetrics.ts`

Core performance utilities providing:

* `getNavigationTiming()` - Unified metrics (prefers navigation entry, falls back to legacy timing)
* `initWebVitals()` - Single-init guard + LCP single-fire protection
* Internal clamping & validation helpers
* TypeScript interfaces for consistent metric structure

### `frontend/src/utils/performance.ts`

Component performance tracking:

* Refactored to call `initWebVitals()` instead of manual observers
* Component load time tracking with `startLoading()` / `endLoading()`
* HOC `withPerformanceTracking()` for automatic component monitoring
* Performance summary statistics and warnings
* Normalized navigation timing debug logs

## Guard Logic

```typescript
let webVitalsInitialized = false; // prevents multiple subscriptions
let lcpRecorded = false; // ensures only first LCP metric emitted

// Testing support
export function __resetPerformanceGuardsForTests(): void {
  webVitalsInitialized = false;
  lcpRecorded = false;
}
```

## Navigation Timing Normalization

Order of preference:

1. `performance.getEntriesByType('navigation')[0].duration`
2. Legacy: `performance.timing.loadEventEnd - performance.timing.navigationStart`

All derived values are clamped: `< 0 => 0`, non-finite discarded.

```typescript
function clampNonNegative(value: number | undefined | null): number | undefined {
  if (value == null) return undefined;
  if (!Number.isFinite(value)) return undefined;
  return value < 0 ? 0 : value;
}
```

## Emitted Metric Names

| Metric | Source | Format |
|--------|--------|--------|
| CLS / INP / LCP / FCP / TTFB | web-vitals library | Standard Web Vitals |
| navigation-total-load-time | normalization helper | Milliseconds |
| navigation-dom-content-loaded | normalization helper | Milliseconds |

## API Reference

### getNavigationTiming()

```typescript
interface NavigationTimingMetrics {
  startTime: number;
  domContentLoaded: number;
  totalLoadTime: number; // Always non-negative
  type: string;
  timestamp: number;
  source: 'navigation-timing' | 'legacy-timing';
}

const timing = getNavigationTiming();
```

### initWebVitals()

```typescript
interface InitWebVitalsOptions {
  onMetric?: (metric: WebVitalMetricRecord) => void;
  includeNavigationMetrics?: boolean;
  force?: boolean; // For testing only
}

const initialized = initWebVitals({
  onMetric: (metric) => logger.info(`📊 ${metric.name}: ${metric.value}ms`),
  includeNavigationMetrics: true,
});
```

### Performance Monitor

```typescript
// Component tracking
performanceMonitor.startLoading('MyComponent');
performanceMonitor.endLoading('MyComponent');

// HOC usage
const TrackedComponent = withPerformanceTracking(MyComponent, 'CustomName');

// Web Vitals integration
performanceMonitor.trackWebVitals();

// Get metrics
const summary = performanceMonitor.getSummary();
```

## Testing Strategy (Implemented)

### Unit Test Coverage

Comprehensive Jest tests validate:

#### Performance Metrics (`performanceMetrics.test.ts`)

* ✅ Single initialization returns `true` first call, `false` second
* ✅ LCP metric emitted only once even if callback invoked multiple times
* ✅ Navigation timing returns non-negative `totalLoadTime`
* ✅ Graceful fallback when APIs unavailable
* ✅ Exception handling for malformed timing data
* ✅ Edge cases: negative, infinite, and NaN duration values
* ✅ Navigation metrics inclusion when requested

#### Performance Monitor (`performance.test.ts`)

* ✅ Component load time tracking accuracy
* ✅ Metrics storage limits (100 entries max)
* ✅ Performance warnings for slow components (>2000ms)
* ✅ Web Vitals integration with proper callbacks
* ✅ HOC wrapper functionality and displayName setting
* ✅ Summary statistics calculation (average, fastest, slowest)

### Test Execution

```bash
# Run performance-specific tests
cd frontend && npm test -- --testPathPattern="performance"

# Run with coverage
cd frontend && npm test -- --coverage --testPathPattern="performance"
```

### Mock Performance Objects

Tests use sophisticated mocking to simulate various browser conditions:

```typescript
const mockPerformance = {
  getEntriesByType: jest.fn(),
  now: jest.fn(),
  timing: mockTiming, // Legacy fallback
} as jest.Mocked<Performance>;
```

## Error Handling & Edge Cases

### Robust Value Validation

* Handles `undefined`, `null`, `NaN`, and `Infinity` values
* Clamps negative durations to zero
* Provides fallback values when APIs unavailable

### Exception Safety

All performance measurement is wrapped in try-catch blocks to prevent disruption of application functionality.

### Browser Compatibility

* Modern PerformanceNavigationTiming API preferred
* Graceful degradation to legacy `performance.timing`
* Feature detection prevents errors on unsupported browsers

## Performance Impact

### Minimal Overhead

* Guard flags prevent redundant observer creation
* Metrics storage capped at 100 entries per component
* Single Web Vitals observer registration
* No impact on critical rendering path

### Memory Management

```typescript
// Automatic cleanup prevents memory leaks
if (this.metrics.length > 100) {
  this.metrics = this.metrics.slice(-100);
}
```

## Debugging & Troubleshooting

### Console Output

Performance metrics appear with structured logging:

```text
📊 LCP: 1234.50ms { metric: 'LCP', value: 1234.5, rating: 'good' }
📊 Navigation Timing (normalized) { totalLoadTime: 1500, source: 'navigation-timing' }
✅ FastComponent loaded in 250.00ms
🐌 Slow component load: SlowComponent took 2500.00ms
```

### Common Issues

1. **Still seeing negative totalLoadTime**: Check for mixed timing sources in custom components
2. **Multiple LCP logs**: Ensure `initWebVitals()` is called only once
3. **Missing metrics**: Verify browser API support and error handling
4. **Test failures**: Use `__resetPerformanceGuardsForTests()` between tests

## Future Enhancements

* **Percentile Aggregation**: P95/P99 metrics calculation for performance budgets
* **Real User Monitoring**: Remote metrics collection and analytics
* **Advanced Dashboard**: React hook `usePerformanceMetrics()` for real-time monitoring
* **Performance Budgets**: Configurable thresholds with automated alerts
* **Correlation Analysis**: Link performance metrics to user interactions

## Related Files

* `frontend/src/perf/performanceMetrics.ts` - Core utilities
* `frontend/src/utils/performance.ts` - Component tracking
* `frontend/src/perf/__tests__/performanceMetrics.test.ts` - Core tests
* `frontend/src/utils/__tests__/performance.test.ts` - Component tests
* `frontend/src/services/liveDemoPerformanceMonitor.ts` - Live demo monitoring
* `frontend/src/services/webVitalsService.ts` - Web Vitals service
* `PERFORMANCE_MONITORING_OPTIMIZATION_COMPLETE.md` - Previous optimization summary

---
PR1 establishes a stable, well-tested baseline for subsequent observability improvements (logging unification & diagnostics panel in later PRs).
