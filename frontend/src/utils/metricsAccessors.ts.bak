/**
 * Metrics accessors to prevent runtime errors from total_requests variations
 * Handles legacy field mappings and provides safe defaults with fallback paths
 * 
 * @module metricsAccessors
 */

// Metrics-like object types for better type safety  
interface MetricsLikeObject {
  api?: {
    total_requests?: number;
    success_requests?: number;
    error_requests?: number;
    avg_latency_ms?: number;
  };
  cache?: {
    hits?: number;
    misses?: number;
    total_requests?: number;
    hit_rate?: number;
    errors?: number;
  };
  // Legacy structures
  api_performance?: Record<string, unknown>;
  cache_performance?: {
    hits?: number;
    misses?: number;
    total_requests?: number;
    hit_rate?: number;
    errors?: number;
  };
  // Even flatter legacy
  total_requests?: number;
}

// Module-scoped warning flags to prevent spam
let hasWarnedLegacyCacheRequests = false;
let hasWarnedLegacyApiRequests = false;
let hasWarnedLegacyCacheHits = false;
let hasWarnedLegacyCacheErrors = false;

/**
 * Safe helper for nested property traversal (reserved for future use)
 */
const _getNestedValue = (obj: unknown, path: string[]): unknown => {
  let current = obj;
  for (const key of path) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return current;
};

/**
 * Safely extract total requests from various metrics object structures
 * 
 * Priority order:
 * 1. obj?.cache?.total_requests (canonical)
 * 2. obj?.cache_performance?.total_requests (legacy mapping)
 * 3. obj?.total_requests (flat legacy)
 * 4. Default: 0
 */
export function getTotalRequests(obj: unknown): number {
  if (!obj || typeof obj !== 'object') {
    return 0;
  }

  const metricsObj = obj as MetricsLikeObject;

  // Priority 1: Canonical cache.total_requests
  if (typeof metricsObj?.cache?.total_requests === 'number') {
    return metricsObj.cache.total_requests;
  }

  // Priority 2: Legacy cache_performance.total_requests
  if (typeof metricsObj?.cache_performance?.total_requests === 'number') {
    if (!hasWarnedLegacyCacheRequests && process.env.NODE_ENV === 'development') {
      hasWarnedLegacyCacheRequests = true;
      // eslint-disable-next-line no-console
      console.debug('[MetricsCompat] Using legacy cache_performance.total_requests, consider migrating to cache.total_requests');
    }
    return metricsObj.cache_performance.total_requests;
  }

  // Priority 3: Flat legacy structure
  if (typeof metricsObj?.total_requests === 'number') {
    if (!hasWarnedLegacyCacheRequests && process.env.NODE_ENV === 'development') {
      hasWarnedLegacyCacheRequests = true;
      // eslint-disable-next-line no-console
      console.debug('[MetricsCompat] Using flat total_requests, consider migrating to cache.total_requests');
    }
    return metricsObj.total_requests;
  }

  // Default: 0
  return 0;
}

/**
 * Safely extract success requests from API metrics
 */
export function getSuccessRequests(obj: unknown): number {
  if (!obj || typeof obj !== 'object') {
    return 0;
  }

  const metricsObj = obj as MetricsLikeObject;

  // Priority 1: Canonical api.success_requests
  if (typeof metricsObj?.api?.success_requests === 'number') {
    return metricsObj.api.success_requests;
  }

  // Priority 2: Calculate from total - errors
  const totalRequests = metricsObj?.api?.total_requests || 0;
  const errorRequests = metricsObj?.api?.error_requests || 0;
  if (totalRequests > 0) {
    return Math.max(0, totalRequests - errorRequests);
  }

  return 0;
}

/**
 * Safely extract error requests from API metrics
 */
export function getErrorRequests(obj: unknown): number {
  if (!obj || typeof obj !== 'object') {
    return 0;
  }

  const metricsObj = obj as MetricsLikeObject;

  // Priority 1: Canonical api.error_requests
  if (typeof metricsObj?.api?.error_requests === 'number') {
    return metricsObj.api.error_requests;
  }

  // Priority 2: Aggregate from legacy api_performance
  if (metricsObj?.api_performance && typeof metricsObj.api_performance === 'object') {
    let totalErrors = 0;
    Object.values(metricsObj.api_performance).forEach(stats => {
      if (stats && typeof stats === 'object') {
        const statsObj = stats as Record<string, unknown>;
        totalErrors += typeof statsObj.errors === 'number' ? statsObj.errors : 0;
      }
    });
    
    if (totalErrors > 0 && !hasWarnedLegacyApiRequests && process.env.NODE_ENV === 'development') {
      hasWarnedLegacyApiRequests = true;
      // eslint-disable-next-line no-console
      console.debug('[MetricsCompat] Aggregating legacy api_performance errors, consider canonical api.error_requests');
    }
    
    return totalErrors;
  }

  return 0;
}

/**
 * Safely calculate API error rate with safe division
 */
export function getApiErrorRate(obj: unknown): number {
  const totalRequests = getApiTotalRequests(obj);
  const errorRequests = getErrorRequests(obj);
  
  if (totalRequests === 0) {
    return 0; // No requests = no error rate
  }
  
  return (errorRequests / totalRequests) * 100; // Return as percentage
}

/**
 * Get total API requests (different from cache total_requests)
 */
export function getApiTotalRequests(obj: unknown): number {
  if (!obj || typeof obj !== 'object') {
    return 0;
  }

  const metricsObj = obj as MetricsLikeObject;

  // Priority 1: Canonical api.total_requests
  if (typeof metricsObj?.api?.total_requests === 'number') {
    return metricsObj.api.total_requests;
  }

  // Priority 2: Aggregate from legacy api_performance
  if (metricsObj?.api_performance && typeof metricsObj.api_performance === 'object') {
    let totalRequests = 0;
    Object.values(metricsObj.api_performance).forEach(stats => {
      if (stats && typeof stats === 'object') {
        const statsObj = stats as Record<string, unknown>;
        totalRequests += typeof statsObj.total_calls === 'number' ? statsObj.total_calls : 
                         typeof statsObj.total_requests === 'number' ? statsObj.total_requests : 0;
      }
    });
    
    if (totalRequests > 0 && !hasWarnedLegacyApiRequests && process.env.NODE_ENV === 'development') {
      hasWarnedLegacyApiRequests = true;
      // eslint-disable-next-line no-console
      console.debug('[MetricsCompat] Aggregating legacy api_performance total_calls, consider canonical api.total_requests');
    }
    
    return totalRequests;
  }

  return 0;
}

/**
 * Safely extract average latency from API metrics
 */
export function getAverageLatencyMs(obj: unknown): number {
  if (!obj || typeof obj !== 'object') {
    return 0;
  }

  const metricsObj = obj as MetricsLikeObject;

  // Priority 1: Canonical api.avg_latency_ms
  if (typeof metricsObj?.api?.avg_latency_ms === 'number') {
    return metricsObj.api.avg_latency_ms;
  }

  // Priority 2: Average from legacy api_performance
  if (metricsObj?.api_performance && typeof metricsObj.api_performance === 'object') {
    let totalLatency = 0;
    let endpointCount = 0;
    
    Object.values(metricsObj.api_performance).forEach(stats => {
      if (stats && typeof stats === 'object') {
        const statsObj = stats as Record<string, unknown>;
        const avgTime = typeof statsObj.avg_time_ms === 'number' ? statsObj.avg_time_ms :
                        typeof statsObj.avg_latency_ms === 'number' ? statsObj.avg_latency_ms : 0;
        if (avgTime > 0) {
          totalLatency += avgTime;
          endpointCount++;
        }
      }
    });
    
    return endpointCount > 0 ? totalLatency / endpointCount : 0;
  }

  return 0;
}

/**
 * Safely extract cache hits
 */
export function getCacheHits(obj: unknown): number {
  if (!obj || typeof obj !== 'object') {
    return 0;
  }

  const metricsObj = obj as MetricsLikeObject;

  // Priority 1: Canonical cache.hits
  if (typeof metricsObj?.cache?.hits === 'number') {
    return metricsObj.cache.hits;
  }

  // Priority 2: Legacy cache_performance.hits
  if (typeof metricsObj?.cache_performance?.hits === 'number') {
    if (!hasWarnedLegacyCacheHits && process.env.NODE_ENV === 'development') {
      hasWarnedLegacyCacheHits = true;
      // eslint-disable-next-line no-console
      console.debug('[MetricsCompat] Using legacy cache_performance.hits, consider migrating to cache.hits');
    }
    return metricsObj.cache_performance.hits;
  }

  return 0;
}

/**
 * Safely extract cache misses
 */
export function getCacheMisses(obj: unknown): number {
  if (!obj || typeof obj !== 'object') {
    return 0;
  }

  const metricsObj = obj as MetricsLikeObject;

  // Priority 1: Canonical cache.misses
  if (typeof metricsObj?.cache?.misses === 'number') {
    return metricsObj.cache.misses;
  }

  // Priority 2: Legacy cache_performance.misses
  if (typeof metricsObj?.cache_performance?.misses === 'number') {
    return metricsObj.cache_performance.misses;
  }

  return 0;
}

/**
 * Safely extract cache errors
 */
export function getCacheErrors(obj: unknown): number {
  if (!obj || typeof obj !== 'object') {
    return 0;
  }

  const metricsObj = obj as MetricsLikeObject;

  // Priority 1: Canonical cache.errors
  if (typeof metricsObj?.cache?.errors === 'number') {
    return metricsObj.cache.errors;
  }

  // Priority 2: Legacy cache_performance.errors
  if (typeof metricsObj?.cache_performance?.errors === 'number') {
    if (!hasWarnedLegacyCacheErrors && process.env.NODE_ENV === 'development') {
      hasWarnedLegacyCacheErrors = true;
      // eslint-disable-next-line no-console
      console.debug('[MetricsCompat] Using legacy cache_performance.errors, consider migrating to cache.errors');
    }
    return metricsObj.cache_performance.errors;
  }

  return 0;
}

/**
 * Re-export getCacheHitRate from healthAccessors for consistency
 * (Cache hit rate can come from either health or metrics contexts)
 */
export { getCacheHitRate } from './healthAccessors';