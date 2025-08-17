# Model Metrics Normalization

This document describes the model metrics normalization system designed to prevent `"Cannot read properties of undefined (reading 'optimization_level')"` errors and similar crashes when accessing AI/ML model metrics.

## Problem

Components were crashing when trying to access nested properties in model metrics objects:

```typescript
// ❌ DANGEROUS - Can crash if system_info is undefined
{metrics.system_info.optimization_level}

// ❌ DANGEROUS - Can crash if inferenceMetrics is undefined or missing fields  
{inferenceMetrics.throughput_per_second}
```

## Solution

A two-part solution provides safe access with legacy field mapping:

1. **Normalization Layer**: `ensureModelMetricsShape()` function that ensures consistent object structure
2. **Accessor Layer**: Safe accessor functions that handle legacy field mapping and provide defaults

## Canonical Schema

### ModelMetricsShape Interface

```typescript
interface ModelMetricsShape {
  model: {
    name: string;
    provider: string;
    version?: string;
    optimization_level: string;
    optimization_mode?: string;
  };
  performance: {
    throughput_rps: number;
    avg_latency_ms: number;
    p95_latency_ms: number;
    success_rate: number;
  };
  usage: {
    total_requests: number;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    cache_hits?: number;
    cache_hit_rate?: number;
  };
  tuning?: {
    temperature: number;
    top_p?: number;
    max_tokens?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
  };
  originFlags?: {
    mappedLegacy?: boolean;
    partialPayload?: boolean;
  };
}
```

## Legacy Mapping Table

| Legacy Key | Canonical Path | Description |
|------------|----------------|-------------|
| `optimizationLevel` | `model.optimization_level` | Legacy camelCase format |
| `opt_level` | `model.optimization_level` | Shortened legacy format |
| `optimization_mode` | `model.optimization_mode` | Alternative optimization field |
| `optimizationTier` | `model.optimization_level` | Tier-based legacy format |
| `modelName` | `model.name` | Legacy camelCase model name |
| `model_name` | `model.name` | Snake_case model name |
| `avg_latency` | `performance.avg_latency_ms` | Legacy without units |
| `latency_ms` | `performance.avg_latency_ms` | Alternative latency field |
| `throughput` | `performance.throughput_rps` | Legacy without units |
| `throughput_per_second` | `performance.throughput_rps` | Verbose legacy format |
| `total_inferences` | `usage.total_requests` | Legacy inference terminology |
| `system_info.optimization_level` | `model.optimization_level` | Nested legacy location |

## Usage Examples

### Normalization at Data Ingestion

```typescript
import { ensureModelMetricsShape } from '@/utils/ensureModelMetricsShape';

// At API response processing
const rawMetrics = await fetchModelMetrics();
const normalizedMetrics = ensureModelMetricsShape(rawMetrics);

// Store normalized metrics
setModelMetrics(normalizedMetrics);
```

### Safe Component Access

```typescript
import { getOptimizationLevel, getModelName, getThroughputRps } from '@/utils/modelMetricsAccessors';

// ✅ SAFE - Always returns a value, never crashes
const ModelDisplay = ({ metrics }) => (
  <div>
    <h3>{getModelName(metrics)}</h3>
    <p>Optimization: {getOptimizationLevel(metrics)}</p>
    <p>Throughput: {getThroughputRps(metrics)} RPS</p>
  </div>
);
```

### Available Accessors

```typescript
// Model metadata
getOptimizationLevel(obj: unknown): string      // Default: 'Basic'
getModelName(obj: unknown): string              // Default: 'Unknown Model'  
getProvider(obj: unknown): string               // Default: 'Unknown Provider'

// Performance metrics
getThroughputRps(obj: unknown): number          // Default: 0
getAvgLatencyMs(obj: unknown): number           // Default: 0
getP95LatencyMs(obj: unknown): number           // Default: 0
getSuccessRate(obj: unknown): number            // Default: 0, auto-normalizes percentages

// Usage metrics
getTotalRequests(obj: unknown): number          // Default: 0
getTotalTokens(obj: unknown): number            // Default: 0

// Tuning parameters
getTemperature(obj: unknown): number            // Default: 0.7
```

## Development Features

### Automatic Legacy Warnings

In development mode, accessors log one-time warnings when legacy fields are used:

```text
[AIMetricsCompat] Field "optimization_level" accessed via legacy path.
Consider using normalized ModelMetricsShape for consistent access.
```

### Normalization Warnings

The normalization function logs missing fields and legacy usage:

```text
[ModelMetricsGuard] Missing model metrics fields detected: performance section, usage section
[ModelMetricsGuard] Using legacy model metrics fields: optimizationLevel, model_name, throughput_per_second
```

### Debug Diagnostics

Components can add debug logging to track accessor usage:

```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('[ModelMetricsDiag]', {
    optLevel: getOptimizationLevel(metrics),
    provider: getProvider(metrics),
    mappedLegacy: metrics.originFlags?.mappedLegacy
  });
}
```

## Integration Checklist

### For New Components

- [ ] Import accessors: `import { getOptimizationLevel, ... } from '@/utils/modelMetricsAccessors'`
- [ ] Replace direct property access with accessor calls
- [ ] Add dev diagnostics for debugging
- [ ] Test with both canonical and legacy data structures

### For Existing Components

- [ ] Identify direct property access patterns (`.optimization_level`, `.model_name`, etc.)
- [ ] Replace with appropriate accessors
- [ ] Remove manual null checking (accessors handle this)
- [ ] Test regression scenarios

### For Data Ingestion Points

- [ ] Apply `ensureModelMetricsShape()` after API calls
- [ ] Apply normalization before storing in state
- [ ] Add comment: `// DO NOT store raw model metrics; always normalized via ensureModelMetricsShape()`
- [ ] Handle both REST and WebSocket data sources

## Adding New Metrics

To add a new metric field:

1. **Update Interface**: Add field to `ModelMetricsShape`
2. **Update Normalizer**: Add field extraction in `ensureModelMetricsShape()`
3. **Create Accessor**: Add new accessor function using `createFieldAccessor()`
4. **Add Legacy Mapping**: Document legacy field names in mapping table
5. **Update Tests**: Add test cases for new field

Example:

```typescript
// 1. Add to interface
interface ModelMetricsShape {
  performance: {
    // ... existing fields
    error_rate: number; // New field
  };
}

// 2. Add accessor
export const getErrorRate = createFieldAccessor<number>({
  name: 'error_rate',
  canonical: ['performance', 'error_rate'],
  legacy: [['errorRate'], ['error_rate']],
  type: 'number',
  default: 0
});
```

## Migration Guidance

### Phase 1: Add Normalization

- Integrate `ensureModelMetricsShape()` at data ingestion points
- Verify normalized structure in development logs

### Phase 2: Replace Direct Access

- Replace direct property access with accessors one component at a time
- Test each component with both legacy and canonical data

### Phase 3: Remove Manual Guards

- Remove now-redundant optional chaining (`?.`) and manual fallbacks
- Simplify component logic since accessors handle edge cases

### Phase 4: Add Advanced Features

- Add derived metrics (computed fields)
- Extend schema for new AI/ML metrics as needed

## Performance Considerations

- **Normalization Overhead**: Minimal - only applied once at data ingestion
- **Accessor Overhead**: Very low - simple property lookups with fallbacks  
- **Memory Impact**: Negligible - accessors are stateless functions
- **Development Warnings**: Guard checks prevent production impact

## Error Handling

The system is designed to never throw errors:

- Invalid inputs return safe defaults
- Missing nested objects are handled gracefully  
- Type coercion prevents numeric conversion errors
- Development warnings help identify data quality issues

This ensures components remain stable even with malformed API responses.
