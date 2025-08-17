/**
 * Unified health data accessors to prevent runtime errors from hit_rate variations
 * Handles legacy field mappings and provides safe defaults
 * 
 * @module healthAccessors
 */

/**
 * Unified health data accessors to prevent runtime errors from hit_rate variations
 * Handles legacy field mappings and provides safe defaults
 * 
 * @module healthAccessors
 */

// Health-like object types for better type safety
interface HealthLikeObject {
  performance?: {
    cache_hit_rate?: number;
    hit_rate?: number;
  };
  infrastructure?: {
    cache?: {
      hit_rate_percent?: number;
    };
  };
  cache_performance?: {
    hit_rate?: number;
  };
  hit_rate?: number;
}

// Module-scoped warning flags to prevent spam
let hasWarnedLegacyHitRate = false;
let hasWarnedFlatHitRate = false;
let hasWarnedInfrastructure = false;

/**
 * Safely extract cache hit rate from various health/metrics object structures
 * 
 * Priority order:
 * 1. obj?.performance?.cache_hit_rate (canonical)
 * 2. obj?.performance?.hit_rate (legacy mapping)
 * 3. obj?.infrastructure?.cache?.hit_rate_percent (Phase 3 structure)
 * 4. obj?.cache_performance?.hit_rate (metrics structure)
 * 5. obj?.hit_rate (flat legacy)
 * 6. Default: 0
 */
export function getCacheHitRate(obj: unknown): number {
  if (!obj || typeof obj !== 'object') {
    return 0;
  }

  const healthObj = obj as HealthLikeObject;

  // Priority 1: Canonical cache_hit_rate
  if (typeof healthObj?.performance?.cache_hit_rate === 'number') {
    return healthObj.performance.cache_hit_rate;
  }

  // Priority 2: Legacy performance.hit_rate
  if (typeof healthObj?.performance?.hit_rate === 'number') {
    if (!hasWarnedLegacyHitRate && process.env.NODE_ENV === 'development') {
      hasWarnedLegacyHitRate = true;
      // eslint-disable-next-line no-console
      console.warn('[HealthCompat] Using legacy performance.hit_rate, consider migrating to cache_hit_rate');
    }
    return healthObj.performance.hit_rate;
  }

  // Priority 3: Phase 3 infrastructure structure
  if (typeof healthObj?.infrastructure?.cache?.hit_rate_percent === 'number') {
    if (!hasWarnedInfrastructure && process.env.NODE_ENV === 'development') {
      hasWarnedInfrastructure = true;
      // eslint-disable-next-line no-console
      console.warn('[HealthCompat] Using infrastructure.cache.hit_rate_percent, consider migrating to performance.cache_hit_rate');
    }
    return healthObj.infrastructure.cache.hit_rate_percent;
  }

  // Priority 4: Metrics structure (for PerformanceMonitoringDashboard)
  if (typeof healthObj?.cache_performance?.hit_rate === 'number') {
    return healthObj.cache_performance.hit_rate;
  }

  // Priority 5: Flat legacy structure
  if (typeof healthObj?.hit_rate === 'number') {
    if (!hasWarnedFlatHitRate && process.env.NODE_ENV === 'development') {
      hasWarnedFlatHitRate = true;
      // eslint-disable-next-line no-console
      console.warn('[HealthCompat] Using flat hit_rate, consider migrating to performance.cache_hit_rate');
    }
    return healthObj.hit_rate;
  }

  // Default: 0
  return 0;
}

/**
 * Check if object has a performance section (any variant)
 */
export function hasPerformanceSection(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const healthObj = obj as HealthLikeObject;

  return !!(
    healthObj.performance ||
    healthObj.infrastructure?.cache ||
    healthObj.cache_performance ||
    typeof healthObj.hit_rate === 'number'
  );
}

/**
 * Safe iteration over cache metrics arrays
 * Filters out undefined/null entries and ensures hit_rate exists
 */
export function safeIterateCacheMetrics<T>(
  metrics: T[] | undefined | null,
  callback: (metric: T & { hit_rate: number }, index: number) => unknown
): unknown[] {
  if (!Array.isArray(metrics)) {
    return [];
  }

  return metrics
    .filter((metric): metric is T & { hit_rate: number } => {
      return metric != null && 
             typeof metric === 'object' && 
             typeof (metric as { hit_rate?: number }).hit_rate === 'number';
    })
    .map(callback);
}

/**
 * DEV-only diagnostic helper for debugging health data structures
 */
export function debugHealthStructure(obj: unknown, label: string = 'Health'): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const cacheHitRate = getCacheHitRate(obj);
  const hasPerf = hasPerformanceSection(obj);
  const healthObj = obj as HealthLikeObject;
  
  const rawPresence = {
    'performance.cache_hit_rate': typeof healthObj?.performance?.cache_hit_rate === 'number',
    'performance.hit_rate': typeof healthObj?.performance?.hit_rate === 'number',
    'infrastructure.cache.hit_rate_percent': typeof healthObj?.infrastructure?.cache?.hit_rate_percent === 'number',
    'cache_performance.hit_rate': typeof healthObj?.cache_performance?.hit_rate === 'number',
    'flat.hit_rate': typeof healthObj?.hit_rate === 'number'
  };

  // eslint-disable-next-line no-console
  console.debug(`[HealthDiag] ${label}:`, {
    extractedCacheHitRate: cacheHitRate,
    hasPerformanceSection: hasPerf,
    rawPresence
  });
}

/**
 * Safely extract cache type from health/metrics objects with fallback
 */
export function getCacheType(obj: unknown): string {
  if (!obj || typeof obj !== 'object') {
    return 'Unknown';
  }

  const healthObj = obj as HealthLikeObject & { 
    performance?: { cache_type?: string };
    cache_type?: string;
  };

  // Try performance.cache_type first
  if (typeof healthObj?.performance?.cache_type === 'string') {
    return healthObj.performance.cache_type;
  }

  // Fall back to flat cache_type
  if (typeof healthObj?.cache_type === 'string') {
    return healthObj.cache_type;
  }

  return 'Unknown';
}