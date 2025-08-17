/**
 * Metrics normalization to prevent "Cannot read properties of undefined (reading 'total_requests')" errors
 * Provides shape normalization and legacy field mapping similar to ensureHealthShape
 * 
 * @module ensureMetricsShape
 */

// Guard to prevent multiple logging
let hasLoggedMissingFields = false;

export interface MetricsShape {
  api: {
    total_requests: number;
    success_requests: number;
    error_requests: number;
    avg_latency_ms: number;
  };
  cache: {
    hits: number;
    misses: number;
    total_requests: number;
    hit_rate: number;
    errors: number;
  };
  timestamps?: {
    updated_at?: string;
  };
  originFlags?: {
    mappedLegacy?: boolean;
  };
}

/**
 * Safe stringify for logging
 */
const safeStringify = (obj: unknown): string => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
};

/**
 * Safely coerce value to number with fallback
 */
const coerceToNumber = (value: unknown, fallback: number = 0): number => {
  if (typeof value === 'number') {
    // Handle Infinity and NaN
    if (!isFinite(value)) {
      return fallback;
    }
    return value;
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

/**
 * Aggregate API endpoint stats into totals
 */
const aggregateApiStats = (apiPerformance: Record<string, unknown>): MetricsShape['api'] => {
  let totalRequests = 0;
  let totalErrors = 0;
  let totalLatency = 0;
  let endpointCount = 0;

  Object.values(apiPerformance).forEach(stats => {
    if (stats && typeof stats === 'object') {
      const statsObj = stats as Record<string, unknown>;
      totalRequests += coerceToNumber(statsObj.total_calls || statsObj.total_requests, 0);
      totalErrors += coerceToNumber(statsObj.errors || statsObj.error_requests, 0);
      totalLatency += coerceToNumber(statsObj.avg_time_ms || statsObj.avg_latency_ms, 0);
      endpointCount++;
    }
  });

  const avgLatency = endpointCount > 0 ? Math.round((totalLatency / endpointCount) * 100) / 100 : 0;
  const successRequests = Math.max(0, totalRequests - totalErrors);

  return {
    total_requests: totalRequests,
    success_requests: successRequests,
    error_requests: totalErrors,
    avg_latency_ms: avgLatency,
  };
};

/**
 * Ensures metrics data conforms to MetricsShape with safe defaults
 * 
 * Features:
 * - Normalizes missing nested objects to safe defaults (all zeros)
 * - Maps legacy cache_performance.* to cache.*
 * - Maps legacy api_performance.* to aggregated api.*
 * - Coerces numeric fields to numbers
 * - Adds development metadata in originFlags
 * - One-time logging for missing fields and legacy usage
 */
export function ensureMetricsShape(raw: unknown): MetricsShape {
  const originFlags: MetricsShape['originFlags'] = {};
  
  // Type guard for raw data
  const rawObj = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};

  // Check for legacy cache_performance structure
  const legacyCacheObj = rawObj.cache_performance && typeof rawObj.cache_performance === 'object' 
    ? rawObj.cache_performance as Record<string, unknown> 
    : {};

  // Check for canonical cache structure
  const canonicalCacheObj = rawObj.cache && typeof rawObj.cache === 'object'
    ? rawObj.cache as Record<string, unknown>
    : {};

  // Check for legacy api_performance structure
  const legacyApiObj = rawObj.api_performance && typeof rawObj.api_performance === 'object'
    ? rawObj.api_performance as Record<string, unknown>
    : {};

  // Check for canonical api structure
  const canonicalApiObj = rawObj.api && typeof rawObj.api === 'object'
    ? rawObj.api as Record<string, unknown>
    : {};

  const hasLegacyCache = Object.keys(legacyCacheObj).length > 0;
  const hasLegacyApi = Object.keys(legacyApiObj).length > 0;
  const hasCanonicalCache = Object.keys(canonicalCacheObj).length > 0;
  const hasCanonicalApi = Object.keys(canonicalApiObj).length > 0;

  if (hasLegacyCache || hasLegacyApi) {
    originFlags.mappedLegacy = true;
  }

  // Build cache metrics (canonical first, then legacy fallback with multiple field name patterns)
  const cacheMetrics = {
    hits: canonicalCacheObj.hits !== undefined 
      ? coerceToNumber(canonicalCacheObj.hits, 0) 
      : coerceToNumber(legacyCacheObj.hits || legacyCacheObj.cache_hits, 0),
    misses: canonicalCacheObj.misses !== undefined 
      ? coerceToNumber(canonicalCacheObj.misses, 0) 
      : coerceToNumber(legacyCacheObj.misses || legacyCacheObj.cache_misses, 0),
    total_requests: canonicalCacheObj.total_requests !== undefined 
      ? coerceToNumber(canonicalCacheObj.total_requests, 0) 
      : coerceToNumber(legacyCacheObj.total_requests, 0),
    hit_rate: canonicalCacheObj.hit_rate !== undefined 
      ? coerceToNumber(canonicalCacheObj.hit_rate, 0) 
      : coerceToNumber(legacyCacheObj.hit_rate, 0),
    errors: canonicalCacheObj.errors !== undefined 
      ? coerceToNumber(canonicalCacheObj.errors, 0) 
      : coerceToNumber(legacyCacheObj.errors, 0)
  };

  // Build API metrics (canonical first, then aggregate legacy)
  let apiMetrics: MetricsShape['api'];
  if (hasCanonicalApi) {
    apiMetrics = {
      total_requests: coerceToNumber(canonicalApiObj.total_requests, 0),
      success_requests: coerceToNumber(canonicalApiObj.success_requests, 0),
      error_requests: coerceToNumber(canonicalApiObj.error_requests, 0),
      avg_latency_ms: coerceToNumber(canonicalApiObj.avg_latency_ms, 0),
    };
  } else if (hasLegacyApi) {
    apiMetrics = aggregateApiStats(legacyApiObj);
  } else {
    apiMetrics = {
      total_requests: 0,
      success_requests: 0,
      error_requests: 0,
      avg_latency_ms: 0,
    };
  }

  // One-time logging for missing critical fields and legacy usage
  const missingFields: string[] = [];
  if (!raw) missingFields.push('entire metrics object');
  if (!hasCanonicalCache && !hasLegacyCache) missingFields.push('cache or cache_performance');
  if (!hasCanonicalApi && !hasLegacyApi) missingFields.push('api or api_performance');
  
  if ((missingFields.length > 0 || originFlags.mappedLegacy) && !hasLoggedMissingFields && process.env.NODE_ENV === 'development') {
    hasLoggedMissingFields = true;
    
    if (missingFields.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        '[MetricsGuard] Missing metrics fields detected:',
        missingFields.join(', '),
        '\nRaw data sample:',
        safeStringify(rawObj)?.substring(0, 500) + '...'
      );
    }
    
    if (originFlags.mappedLegacy) {
      // eslint-disable-next-line no-console
      console.warn(
        '[MetricsGuard] Using legacy metrics structure (cache_performance/api_performance)',
        'Consider migrating to canonical structure (cache/api)'
      );
    }
  }

  // Build normalized metrics object
  const normalized: MetricsShape = {
    api: apiMetrics,
    cache: cacheMetrics,
    timestamps: {
      updated_at: rawObj.updated_at ? String(rawObj.updated_at) : new Date().toISOString(),
    },
    originFlags,
  };

  return normalized;
}