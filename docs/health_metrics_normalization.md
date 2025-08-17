# Health Metrics Normalization

## Problem

Runtime error: "Cannot read properties of undefined (reading 'hit_rate')" occurring across multiple components due to inconsistent health/metrics data structures from backend APIs.

## Root Causes

1. **Inconsistent field names**: Different components expected `hit_rate`, `cache_hit_rate`, or `hit_rate_percent`
2. **Varied object structures**: Data could be nested in `performance`, `infrastructure.cache`, `cache_performance`, or flat
3. **Race conditions**: Objects being accessed before async data loading completed
4. **Missing null guards**: Direct property access without checking parent object existence

## Solution

### Unified Health Accessors (`src/utils/healthAccessors.ts`)

Created a unified accessor system that handles all hit_rate variants with priority order:

1. **`obj?.performance?.cache_hit_rate`** (canonical - preferred format)
2. **`obj?.performance?.hit_rate`** (legacy performance structure)
3. **`obj?.infrastructure?.cache?.hit_rate_percent`** (Phase 3 structure)  
4. **`obj?.cache_performance?.hit_rate`** (metrics structure)
5. **`obj?.hit_rate`** (flat legacy structure)
6. **Default: 0** (safe fallback)

### Key Functions

- **`getCacheHitRate(obj)`**: Safe extraction from any structure variant
- **`hasPerformanceSection(obj)`**: Check if performance data exists
- **`safeIterateCacheMetrics(array, callback)`**: Safe array iteration with filtering
- **`debugHealthStructure(obj, label)`**: DEV-only diagnostic logging

### Enhanced ensureHealthShape

Extended `ensureHealthShape.ts` to handle:
- Infrastructure structure mapping: `infrastructure.cache.hit_rate_percent` → `performance.cache_hit_rate`
- Backward compatibility with all existing mappings
- Development logging for field mapping diagnostics

## Implementation

### Components Updated

1. **PerformanceMonitoringDashboard.tsx**
   - Replaced: `metrics.cache_performance.hit_rate` → `getCacheHitRate(metrics)`
   - Replaced: `health.performance?.cache_hit_rate` → `getCacheHitRate(health)`

2. **UnifiedDashboard.tsx** 
   - Replaced: `healthData.infrastructure.cache.hit_rate_percent` → `getCacheHitRate(healthData)`

3. **RealTimeAnalytics.tsx**
   - Replaced: `health.infrastructure.cache.hit_rate_percent` → `getCacheHitRate(health)`

4. **DataEcosystemDashboard.tsx**
   - Replaced: `metric.hit_rate` direct access → `getCacheHitRate(metric)`
   - Added safe array iteration: `safeIterateCacheMetrics(cacheMetrics, callback)`

### Development Warnings

The system provides one-time console warnings (DEV only) when using legacy structures:
- `[HealthCompat] Using legacy performance.hit_rate, consider migrating to cache_hit_rate`
- `[HealthCompat] Using infrastructure.cache.hit_rate_percent, consider migrating to performance.cache_hit_rate`  
- `[HealthCompat] Using flat hit_rate, consider migrating to performance.cache_hit_rate`

## Testing

### Unit Tests (`healthAccessors.test.ts`)
- All priority orders tested
- Warning behavior verified  
- Edge cases: null, undefined, empty objects
- Integration with ensureHealthShape

### Regression Tests (`PerformanceMonitoringDashboard.regression.test.tsx`)
- Component mounting with various data structures
- No crash scenarios with missing data
- Proper percentage display

### Extended ensureHealthShape Tests
- Infrastructure mapping scenarios
- Priority preference verification

## Usage Guidelines

### For New Components
```typescript
import { getCacheHitRate } from '../../utils/healthAccessors';

// Instead of direct access:
// const rate = health.performance?.cache_hit_rate; // ❌ Fragile

// Use unified accessor:
const rate = getCacheHitRate(health); // ✅ Safe, handles all variants
```

### For Array Iteration
```typescript
import { safeIterateCacheMetrics } from '../../utils/healthAccessors';

// Instead of direct iteration:
// metrics.forEach(metric => metric.hit_rate); // ❌ Can crash on undefined

// Use safe iteration:
safeIterateCacheMetrics(metrics, (metric) => metric.hit_rate); // ✅ Filters nulls
```

### For Type Guards
```typescript
import { hasPerformanceSection } from '../../utils/healthAccessors';

if (hasPerformanceSection(healthData)) {
  // Safe to access performance-related data
  const rate = getCacheHitRate(healthData);
}
```

## Backend Recommendations

For future API consistency, backends should standardize on:
```typescript
{
  performance: {
    cache_hit_rate: number; // Always use this field name
    cache_type: string;
  }
}
```

## Backward Compatibility

- All existing data structures continue to work
- No breaking changes to component APIs
- Legacy warnings help identify migration opportunities
- Graceful degradation to 0% when no data available

## Monitoring

In development, check browser console for:
- `[HealthCompat]` warnings indicating legacy structure usage
- `[HealthDiag]` diagnostic logs showing data structure analysis
- `[ensureHealthShape]` mapping confirmation logs