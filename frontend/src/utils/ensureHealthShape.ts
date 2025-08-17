/**
 * Guards against runtime errors when accessing health.performance.cache_hit_rate
 * and other critical health metrics by normalizing API responses to a safe shape.
 * 
 * @module ensureHealthShape
 */

// Guard to prevent multiple logging
let hasLoggedMissingFields = false;

export interface SystemHealth {
  status: string;
  services: {
    api: string;
    cache: string;
    database: string;
  };
  performance: {
    cache_hit_rate: number;
    cache_type: string;
  };
  uptime_seconds: number;
  originFlags?: {
    hadCacheHitRate?: boolean;
    mappedHitRate?: boolean;
    usedMock?: boolean;
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
 * Normalize service status to lowercase string
 */
const normalizeStatus = (status: unknown): string => {
  if (typeof status === 'string') {
    return status.toLowerCase();
  }
  if (typeof status === 'boolean') {
    return status ? 'healthy' : 'unhealthy';
  }
  if (typeof status === 'number') {
    return status > 0 ? 'healthy' : 'unhealthy';
  }
  return 'unknown';
};

/**
 * Ensures health data conforms to SystemHealth shape with safe defaults
 * 
 * Features:
 * - Normalizes missing nested objects
 * - Maps performance.hit_rate to performance.cache_hit_rate if missing
 * - Maps infrastructure.cache.hit_rate_percent to performance.cache_hit_rate
 * - Coerces numeric fields to numbers
 * - Normalizes service statuses to lowercase
 * - Adds development metadata in originFlags
 * - One-time logging for missing fields
 */
export function ensureHealthShape(raw: unknown, options?: { usedMock?: boolean }): SystemHealth {
  const originFlags: SystemHealth['originFlags'] = {};
  
  if (options?.usedMock) {
    originFlags.usedMock = true;
  }

  // Type guard for raw data
  const rawObj = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};

  // Check if we have the expected cache_hit_rate field
  const performanceObj = rawObj.performance && typeof rawObj.performance === 'object' 
    ? rawObj.performance as Record<string, unknown> 
    : {};

  // Check for infrastructure structure (Phase 3)
  const infrastructureObj = rawObj.infrastructure && typeof rawObj.infrastructure === 'object' 
    ? rawObj.infrastructure as Record<string, unknown> 
    : {};
  const infrastructureCacheObj = infrastructureObj.cache && typeof infrastructureObj.cache === 'object'
    ? infrastructureObj.cache as Record<string, unknown>
    : {};
  
  const hadCacheHitRate = performanceObj.cache_hit_rate !== undefined;
  const hasHitRate = performanceObj.hit_rate !== undefined;
  const hasInfrastructureHitRate = infrastructureCacheObj.hit_rate_percent !== undefined;
  
  originFlags.hadCacheHitRate = hadCacheHitRate;
  
  // Determine cache hit rate value
  let cacheHitRateValue = 0;
  if (hadCacheHitRate) {
    cacheHitRateValue = coerceToNumber(performanceObj.cache_hit_rate, 0);
  } else if (hasHitRate) {
    cacheHitRateValue = coerceToNumber(performanceObj.hit_rate, 0);
    originFlags.mappedHitRate = true;
    
    // Log mapping in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[ensureHealthShape] Mapped hit_rate (${performanceObj.hit_rate}) to cache_hit_rate`);
    }
  } else if (hasInfrastructureHitRate) {
    // Map infrastructure.cache.hit_rate_percent to performance.cache_hit_rate
    cacheHitRateValue = coerceToNumber(infrastructureCacheObj.hit_rate_percent, 0);
    originFlags.mappedHitRate = true;
    
    // Log mapping in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[ensureHealthShape] Mapped infrastructure.cache.hit_rate_percent (${infrastructureCacheObj.hit_rate_percent}) to cache_hit_rate`);
    }
  }

  // One-time logging for missing critical fields
  const missingFields: string[] = [];
  if (!raw) missingFields.push('entire health object');
  if (!rawObj.status) missingFields.push('status');
  if (!rawObj.services) missingFields.push('services');
  if (!rawObj.performance && !hasInfrastructureHitRate) missingFields.push('performance');
  if (!hadCacheHitRate && !hasHitRate && !hasInfrastructureHitRate) missingFields.push('performance.cache_hit_rate, hit_rate, or infrastructure.cache.hit_rate_percent');
  
  if (missingFields.length > 0 && !hasLoggedMissingFields) {
    hasLoggedMissingFields = true;
    // eslint-disable-next-line no-console
    console.warn(
      '[HealthGuard] Missing health fields detected:',
      missingFields.join(', '),
      '\nRaw data:',
      safeStringify(raw)
    );
  }

  // Type guard for services
  const servicesObj = rawObj.services && typeof rawObj.services === 'object' 
    ? rawObj.services as Record<string, unknown> 
    : {};

  // Build normalized health object
  const normalized: SystemHealth = {
    status: normalizeStatus(rawObj.status) || 'unknown',
    services: {
      api: normalizeStatus(servicesObj.api) || 'unknown',
      cache: normalizeStatus(servicesObj.cache) || 'unknown',
      database: normalizeStatus(servicesObj.database) || 'unknown',
    },
    performance: {
      cache_hit_rate: cacheHitRateValue,
      cache_type: performanceObj.cache_type 
        ? String(performanceObj.cache_type) 
        : 'unknown',
    },
    uptime_seconds: coerceToNumber(rawObj.uptime_seconds, 0),
    originFlags,
  };

  return normalized;
}