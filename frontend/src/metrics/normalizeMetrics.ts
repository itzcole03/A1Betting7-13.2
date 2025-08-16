/**
 * Metrics Normalization Layer
 * 
 * Converts raw backend metrics (snake_case) to normalized frontend format (camelCase)
 * with safe defaults and type guards to prevent runtime crashes.
 */

export interface NormalizedMetrics {
  cacheHitRate: number;
  errorRate?: number;
  avgResponseTimeMs?: number;
  queueSize?: number;
  throughput?: number;
  accuracy?: number;
  latency?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  [key: string]: unknown;
}

export const DEFAULT_METRICS: NormalizedMetrics = {
  cacheHitRate: 0,
  errorRate: 0,
  avgResponseTimeMs: 0,
  queueSize: 0,
  throughput: 0,
  accuracy: 0,
  latency: 0,
  memoryUsage: 0,
  cpuUsage: 0,
};

/**
 * Converts snake_case key to camelCase
 */
export function normalizeKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Safely extracts numeric value with fallback to 0
 */
function safeNumber(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

/**
 * Safely extracts nested property with dot notation
 */
function getNestedProperty(obj: unknown, path: string): unknown {
  try {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' && current !== null ? (current as Record<string, unknown>)[key] : undefined;
    }, obj);
  } catch {
    return undefined;
  }
}

/**
 * Main normalization function that converts raw backend metrics to safe frontend format
 */
export function normalizeMetrics(raw: unknown): NormalizedMetrics {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_METRICS };
  }

  const rawObj = raw as Record<string, unknown>;
  const normalized: NormalizedMetrics = { ...DEFAULT_METRICS };

  try {
    // Direct properties
    if ('cache_hit_rate' in rawObj) {
      normalized.cacheHitRate = safeNumber(rawObj.cache_hit_rate);
    }
    if ('error_rate' in rawObj) {
      normalized.errorRate = safeNumber(rawObj.error_rate);
    }
    if ('avg_response_time' in rawObj || 'avg_response_time_ms' in rawObj) {
      normalized.avgResponseTimeMs = safeNumber(rawObj.avg_response_time_ms || rawObj.avg_response_time);
    }
    if ('queue_size' in rawObj) {
      normalized.queueSize = safeNumber(rawObj.queue_size);
    }
    if ('throughput' in rawObj) {
      normalized.throughput = safeNumber(rawObj.throughput);
    }
    if ('accuracy' in rawObj) {
      normalized.accuracy = safeNumber(rawObj.accuracy);
    }
    if ('latency' in rawObj) {
      normalized.latency = safeNumber(rawObj.latency);
    }
    if ('memory_usage' in rawObj) {
      normalized.memoryUsage = safeNumber(rawObj.memory_usage);
    }
    if ('cpu_usage' in rawObj) {
      normalized.cpuUsage = safeNumber(rawObj.cpu_usage);
    }

    // Nested properties - handle common patterns
    const performanceMetrics = getNestedProperty(rawObj, 'performance');
    if (performanceMetrics && typeof performanceMetrics === 'object') {
      const perfObj = performanceMetrics as Record<string, unknown>;
      normalized.cacheHitRate = safeNumber(
        perfObj.cache_hit_rate, 
        normalized.cacheHitRate
      );
      normalized.avgResponseTimeMs = safeNumber(
        perfObj.avg_response_time_ms || perfObj.avg_response_time,
        normalized.avgResponseTimeMs
      );
      normalized.errorRate = safeNumber(
        perfObj.error_rate,
        normalized.errorRate
      );
    }

    // Infrastructure cache metrics
    const cacheMetrics = getNestedProperty(rawObj, 'infrastructure.cache');
    if (cacheMetrics && typeof cacheMetrics === 'object') {
      const cacheObj = cacheMetrics as Record<string, unknown>;
      normalized.cacheHitRate = safeNumber(
        cacheObj.hit_rate_percent,
        normalized.cacheHitRate
      );
    }

    // Convert any remaining snake_case properties to camelCase
    Object.keys(rawObj).forEach(key => {
      if (typeof key === 'string' && key.includes('_')) {
        const camelKey = normalizeKey(key);
        const value = rawObj[key];
        
        if (typeof value === 'number' || typeof value === 'string') {
          normalized[camelKey] = safeNumber(value);
        } else if (typeof value === 'boolean') {
          normalized[camelKey] = value;
        }
      }
    });

    // Development mode logging for missing fields
    if (import.meta.env?.DEV) {
      const missingFields = Object.keys(DEFAULT_METRICS).filter(
        key => normalized[key] === DEFAULT_METRICS[key as keyof NormalizedMetrics]
      );
      if (missingFields.length > 0) {
        // Development logging allowed
        /* eslint-disable-next-line no-console */
        console.debug('[normalizeMetrics] Using defaults for:', missingFields);
      }
    }

  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.warn('[normalizeMetrics] Error during normalization:', error);
    return { ...DEFAULT_METRICS };
  }

  return normalized;
}

/**
 * Merges multiple metric sources with priority (later sources override earlier ones)
 */
export function mergeMetrics(...sources: unknown[]): NormalizedMetrics {
  let result = { ...DEFAULT_METRICS };
  
  sources.forEach(source => {
    const normalized = normalizeMetrics(source);
    result = { ...result, ...normalized };
  });
  
  return result;
}

/**
 * Type guard to check if an object has normalized metrics structure
 */
export function isNormalizedMetrics(obj: unknown): obj is NormalizedMetrics {
  return Boolean(obj && 
         typeof obj === 'object' && 
         typeof (obj as NormalizedMetrics).cacheHitRate === 'number');
}

/**
 * Formats cache hit rate as percentage string
 */
export function formatCacheHitRate(metrics: NormalizedMetrics): string {
  const rate = metrics.cacheHitRate ?? 0;
  // Handle both decimal (0.85) and percentage (85) formats
  const percentage = rate <= 1 ? rate * 100 : rate;
  return `${percentage.toFixed(1)}%`;
}

/**
 * Formats response time with appropriate units
 */
export function formatResponseTime(metrics: NormalizedMetrics): string {
  const time = metrics.avgResponseTimeMs ?? 0;
  if (time < 1000) {
    return `${time.toFixed(0)}ms`;
  }
  return `${(time / 1000).toFixed(2)}s`;
}