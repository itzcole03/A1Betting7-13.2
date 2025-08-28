// NOTE: All model/inference metric field access must go through these accessors. Do not access raw nested fields directly.

/**
 * Model metrics accessor library to prevent property access crashes
 * Provides safe field access with legacy mapping and dev warnings
 * 
 * @module modelMetricsAccessors
 */

import type { ModelMetricsShape } from './ensureModelMetricsShape';
import { oneTimeLog } from './oneTimeLog';

/**
 * Generic field accessor descriptor
 */
interface FieldAccessorDescriptor<T> {
  name: string;
  canonical: string[];
  legacy?: string[][];
  type: 'number' | 'string';
  default: T;
  transform?: (value: unknown) => T;
}

/**
 * Creates a safe field accessor with legacy fallback
 */
function createFieldAccessor<T extends string | number>(
  descriptor: FieldAccessorDescriptor<T>
): (obj: unknown) => T {
  return (obj: unknown): T => {
    // Handle null/undefined objects
    if (!obj || typeof obj !== 'object') {
      return descriptor.default;
    }

    const rawObj = obj as Record<string, unknown>;

    // Try to get from canonical ModelMetricsShape first (post-normalization)
    let current: unknown = rawObj;
    let foundCanonical = true;

    for (const segment of descriptor.canonical) {
      if (current && typeof current === 'object' && segment in current) {
        current = (current as Record<string, unknown>)[segment];
      } else {
        foundCanonical = false;
        break;
      }
    }

  if (!(foundCanonical && current !== undefined)) {
      // Try legacy paths if canonical not found
  let usedLegacy = false;
      if (descriptor.legacy) {
        for (const legacyPath of descriptor.legacy) {
          let legacyCurrent: unknown = rawObj;
          let foundLegacy = true;
          
          for (const segment of legacyPath) {
            if (legacyCurrent && typeof legacyCurrent === 'object' && segment in legacyCurrent) {
              legacyCurrent = (legacyCurrent as Record<string, unknown>)[segment];
            } else {
              foundLegacy = false;
              break;
            }
          }
          
          if (foundLegacy && legacyCurrent !== undefined) {
            usedLegacy = true;
            current = legacyCurrent;
            break;
          }
        }
      }

      // Log one-time development warning for legacy usage
      if (usedLegacy) {
        // Check if we're in a development or test environment
        const isDevOrTest = process.env.NODE_ENV === 'development' ||
                           process.env.NODE_ENV === 'test' ||
                           typeof jest !== 'undefined';

        if (isDevOrTest) {
          oneTimeLog(
            descriptor.name,
            () => {
              // eslint-disable-next-line no-console
              console.warn(
                `[AIMetricsCompat] Field "${descriptor.name}" accessed via legacy path. Consider using normalized ModelMetricsShape for consistent access.`
              );
            },
            descriptor.name
          );
        }
      }      // If neither canonical nor legacy path was found, clear current so defaults are returned
      if (!foundCanonical && !usedLegacy) {
        current = undefined;
      }
    } else {
      // canonical found; leave current as-is
    }

    // Apply transform if available
    if (current !== undefined && descriptor.transform) {
      return descriptor.transform(current);
    }

    // Type coercion for direct values (apply for canonical and legacy)
    if (current !== undefined) {
      if (descriptor.type === 'number') {
        const num = Number(current);
        return (isFinite(num) ? num : descriptor.default) as T;
      } else {
        return String(current) as T;
      }
    }

    return descriptor.default;
  };
}

/**
 * Safe accessors for model metadata
 */
export const getOptimizationLevel = createFieldAccessor<string>({
  name: 'optimization_level',
  canonical: ['model', 'optimization_level'],
  legacy: [
    ['optimizationLevel'],
    ['opt_level'], 
    ['optimization_mode'],
    ['system_info', 'optimization_level'],
    ['optimizationTier'],
    ['optTier']
  ],
  type: 'string',
  default: 'Basic'
});

export const getModelName = createFieldAccessor<string>({
  name: 'model_name',
  canonical: ['model', 'name'],
  legacy: [
    ['modelName'],
    ['model_name'], 
    ['name']
  ],
  type: 'string',
  default: 'Unknown Model'
});

export const getProvider = createFieldAccessor<string>({
  name: 'provider',
  canonical: ['model', 'provider'],
  legacy: [
    ['provider'],
    ['model_provider'], 
    ['modelProvider']
  ],
  type: 'string',
  default: 'Unknown Provider'
});

/**
 * Safe accessors for performance metrics
 */
export const getThroughputRps = createFieldAccessor<number>({
  name: 'throughput_rps',
  canonical: ['performance', 'throughput_rps'],
  legacy: [
    ['throughput'],
    ['throughput_per_second'], 
    ['rps']
  ],
  type: 'number',
  default: 0
});

export const getAvgLatencyMs = createFieldAccessor<number>({
  name: 'avg_latency_ms',
  canonical: ['performance', 'avg_latency_ms'],
  legacy: [
    ['avg_latency'],
    ['latency_ms'], 
    ['avg_latency_ms']
  ],
  type: 'number',
  default: 0
});

export const getP95LatencyMs = createFieldAccessor<number>({
  name: 'p95_latency_ms',
  canonical: ['performance', 'p95_latency_ms'],
  legacy: [
    ['p95_latency'],
    ['p95_latency_ms']
  ],
  type: 'number',
  default: 0
});

export const getSuccessRate = createFieldAccessor<number>({
  name: 'success_rate',
  canonical: ['performance', 'success_rate'],
  legacy: [
    ['success_rate']
  ],
  type: 'number',
  default: 0,
  transform: (value: unknown): number => {
    const rate = Number(value);
    if (isFinite(rate)) {
      // Normalize to 0-1 range if it appears to be a percentage
      return rate > 1 ? rate / 100 : rate;
    }
    return 0;
  }
});

/**
 * Safe accessors for usage metrics
 */
export const getTotalRequests = createFieldAccessor<number>({
  name: 'total_requests',
  canonical: ['usage', 'total_requests'],
  legacy: [
    ['total_requests'],
    ['total_inferences'], 
    ['totalRequests']
  ],
  type: 'number',
  default: 0
});

export const getTotalTokens = createFieldAccessor<number>({
  name: 'total_tokens',
  canonical: ['usage', 'total_tokens'],
  legacy: [
    ['total_tokens'],
    ['totalTokens']
  ],
  type: 'number',
  default: 0,
  transform: (value: unknown): number => {
    const tokens = Number(value);
    if (isFinite(tokens) && tokens > 0) {
      return tokens;
    }
    
    // Try to derive from input + output tokens if total is missing/zero
    // This would require access to the parent object, but for now we'll return the default
    return 0;
  }
});

/**
 * Safe accessors for tuning parameters
 */
export const getTemperature = createFieldAccessor<number>({
  name: 'temperature',
  canonical: ['tuning', 'temperature'],
  legacy: [
    ['temperature']
  ],
  type: 'number',
  default: 0.7
});

/**
 * Utility function to safely access nested metrics without crashes
 * Use this for one-off field access that doesn't need a dedicated accessor
 */
export function safeMetricsAccess<T>(
  obj: unknown, 
  path: string[], 
  defaultValue: T
): T {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }
  
  let current: unknown = obj;
  for (const segment of path) {
    if (current && typeof current === 'object' && segment in current) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return defaultValue;
    }
  }
  
  return current !== undefined ? (current as T) : defaultValue;
}

/**
 * Helper to check if metrics object has been normalized
 */
export function isNormalizedModelMetrics(obj: unknown): obj is ModelMetricsShape {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const typed = obj as Record<string, unknown>;
  return !!(
    typed.model && 
    typeof typed.model === 'object' &&
    typed.performance && 
    typeof typed.performance === 'object' &&
    typed.usage && 
    typeof typed.usage === 'object'
  );
}