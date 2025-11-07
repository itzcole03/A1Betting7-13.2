/**
 * Efficient and consistent cache key generation
 * - Ensures stable keys regardless of parameter order
 * - Handles nested objects and arrays
 * - Provides debugging support
 */

interface CacheKeyOptions {
  includeTimestamp?: boolean;
  debug?: boolean;
}

/**
 * Generate a stable cache key from endpoint and parameters
 * Parameters are sorted recursively to ensure consistent keys
 */
export function generateCacheKey(
  endpoint: string,
  params?: Record<string, any>,
  options: CacheKeyOptions = {}
): string {
  const { includeTimestamp = false, debug = false } = options;

  // Normalize endpoint
  const normalizedEndpoint = endpoint.toLowerCase().trim();

  // Sort and stringify parameters consistently
  const paramsStr = params ? stringifyParams(params) : '';

  const key = `${normalizedEndpoint}:${paramsStr}`;

  if (debug) {
    // eslint-disable-next-line no-console
    console.debug(`[cacheKeyGenerator] Generated key: ${key}`, { endpoint, params });
  }

  return key;
}

/**
 * Create a cache key for ETag-based validation
 * Includes a hash of the parameters for efficient lookup
 */
export function generateETagCacheKey(
  endpoint: string,
  params?: Record<string, any>,
  etag?: string
): string {
  const baseKey = generateCacheKey(endpoint, params);
  if (!etag) return baseKey;
  return `${baseKey}@${etag}`;
}

/**
 * Recursively stringify and sort parameters for consistent keys
 */
function stringifyParams(params: Record<string, any>): string {
  const sorted = sortObjectKeys(params);
  return JSON.stringify(sorted);
}

/**
 * Recursively sort object keys for consistent JSON serialization
 */
function sortObjectKeys(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sortObjectKeys(item));
  }

  if (typeof obj !== 'object' || obj instanceof Date) {
    return obj;
  }

  const sorted: Record<string, any> = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    sorted[key] = sortObjectKeys(obj[key]);
  }

  return sorted;
}

/**
 * Create a request signature for deduplication
 * Useful for identifying identical concurrent requests
 */
export function getRequestSignature(
  endpoint: string,
  params?: Record<string, any>
): string {
  return generateCacheKey(endpoint, params);
}

/**
 * Extract parameters from a URL string
 */
export function extractParamsFromUrl(url: string): Record<string, any> {
  const urlObj = new URL(url, 'http://localhost');
  const params: Record<string, any> = {};

  urlObj.searchParams.forEach((value, key) => {
    // Try to parse as JSON first (for arrays/objects)
    try {
      params[key] = JSON.parse(value);
    } catch {
      // Fall back to string
      params[key] = value;
    }
  });

  return params;
}

/**
 * Create a normalized URL for cache key purposes
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url, 'http://localhost');
    // Ensure consistent parameter order
    const params = new URLSearchParams();
    const entries = Array.from(urlObj.searchParams.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    entries.forEach(([key, value]) => params.set(key, value));

    return `${urlObj.pathname}?${params.toString()}`;
  } catch {
    // If URL parsing fails, return the original (likely a relative path)
    return url;
  }
}
