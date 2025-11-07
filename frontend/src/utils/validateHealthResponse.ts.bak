/**
 * Health response validation utility
 * Replaces ensureHealthShape.ts with tolerant validation aligned with new schema
 */

import { ValidatedHealthPayload, HealthData, DiagnosticsError } from '../types/diagnostics';
import { oneTimeLog } from './oneTimeLog';

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
  if (typeof value === 'number' && isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

/**
 * Normalize status to expected values
 */
const normalizeStatus = (status: unknown): 'ok' | 'degraded' | 'down' => {
  if (typeof status === 'string') {
    const normalized = status.toLowerCase();
    if (normalized === 'ok' || normalized === 'healthy') return 'ok';
    if (normalized === 'degraded' || normalized === 'warning') return 'degraded';
    if (normalized === 'down' || normalized === 'error' || normalized === 'unhealthy') return 'down';
  }
  return 'down'; // Default to down for unknown states
};

/**
 * Validates and normalizes health response data
 * Performs shallow structural checks and provides safe defaults
 * 
 * @param raw - Raw response data from backend
 * @returns Validated health payload
 * @throws DiagnosticsError if critical structure is missing
 */
export function validateHealthResponse(raw: unknown): ValidatedHealthPayload {
  // Type guard for raw data
  if (!raw || typeof raw !== 'object') {
    const error: DiagnosticsError = new Error('Health response is not an object') as DiagnosticsError;
    error.code = 'HEALTH_SHAPE_MISMATCH';
    error.context = { raw };
    throw error;
  }

  const rawObj = raw as Record<string, unknown>;

  // Check for mandatory top-level keys
  const mandatoryKeys = ['services', 'performance', 'cache', 'infrastructure'];
  const missingKeys = mandatoryKeys.filter(key => !(key in rawObj));

  if (missingKeys.length > 0) {
    oneTimeLog(
      'health-validation-missing-keys',
      () => {
        // eslint-disable-next-line no-console
        console.warn(
          '[Health Validator] Missing mandatory fields:',
          missingKeys.join(', '),
          '\nRaw data:',
          safeStringify(raw)
        );
      },
      missingKeys.join(',')
    );

    const error: DiagnosticsError = new Error(`Missing mandatory health fields: ${missingKeys.join(', ')}`) as DiagnosticsError;
    error.code = 'HEALTH_SHAPE_MISMATCH';
    error.context = { missingKeys, raw };
    throw error;
  }

  // Extract and validate services array
  const servicesRaw = rawObj.services;
  let services: HealthData['services'] = [];
  
  if (Array.isArray(servicesRaw)) {
    services = servicesRaw.map((service, index) => {
      if (!service || typeof service !== 'object') {
        oneTimeLog(
          'health-validation-invalid-service',
          // eslint-disable-next-line no-console
          () => console.warn(`[Health Validator] Invalid service at index ${index}:`, service),
          `index-${index}`
        );
        return { name: `unknown-${index}`, status: 'down' as const };
      }
      
      const serviceObj = service as Record<string, unknown>;
      return {
        name: typeof serviceObj.name === 'string' ? serviceObj.name : `service-${index}`,
        status: normalizeStatus(serviceObj.status),
        latency_ms: coerceToNumber(serviceObj.latency_ms),
        details: serviceObj.details && typeof serviceObj.details === 'object' 
          ? serviceObj.details as Record<string, unknown> 
          : undefined,
      };
    });
  } else {
    oneTimeLog(
      'health-validation-services-not-array',
      // eslint-disable-next-line no-console
      () => console.warn('[Health Validator] Services field is not an array:', servicesRaw)
    );
  }

  // Extract and validate performance metrics
  const performanceRaw = rawObj.performance;
  let performance: HealthData['performance'] = {};
  
  if (performanceRaw && typeof performanceRaw === 'object') {
    const perfObj = performanceRaw as Record<string, unknown>;
    performance = {
      cpu_percent: coerceToNumber(perfObj.cpu_percent),
      memory_usage_mb: coerceToNumber(perfObj.memory_usage_mb),
      p95_latency_ms: coerceToNumber(perfObj.p95_latency_ms),
      cache_hit_rate: coerceToNumber(perfObj.cache_hit_rate),
      active_connections: coerceToNumber(perfObj.active_connections),
      requests_per_minute: coerceToNumber(perfObj.requests_per_minute),
    };
  }

  // Extract and validate cache metrics
  const cacheRaw = rawObj.cache;
  let cache: HealthData['cache'] = {};
  
  if (cacheRaw && typeof cacheRaw === 'object') {
    const cacheObj = cacheRaw as Record<string, unknown>;
    cache = {
      hit_rate: coerceToNumber(cacheObj.hit_rate),
      miss_rate: coerceToNumber(cacheObj.miss_rate),
      evictions: coerceToNumber(cacheObj.evictions),
      total_keys: coerceToNumber(cacheObj.total_keys),
      memory_usage: coerceToNumber(cacheObj.memory_usage),
    };
  }

  // Extract and validate infrastructure
  const infrastructureRaw = rawObj.infrastructure;
  let infrastructure: HealthData['infrastructure'] = {};
  
  if (infrastructureRaw && typeof infrastructureRaw === 'object') {
    const infraObj = infrastructureRaw as Record<string, unknown>;
    infrastructure = {
      database: infraObj.database && typeof infraObj.database === 'object'
        ? {
            name: 'database',
            status: normalizeStatus((infraObj.database as Record<string, unknown>).status),
            latency_ms: coerceToNumber((infraObj.database as Record<string, unknown>).latency_ms),
          }
        : undefined,
      cache: infraObj.cache && typeof infraObj.cache === 'object'
        ? {
            name: 'cache',
            status: normalizeStatus((infraObj.cache as Record<string, unknown>).status),
            latency_ms: coerceToNumber((infraObj.cache as Record<string, unknown>).latency_ms),
            hit_rate_percent: coerceToNumber((infraObj.cache as Record<string, unknown>).hit_rate_percent),
          }
        : undefined,
      external_apis: Array.isArray(infraObj.external_apis)
        ? (infraObj.external_apis as Array<unknown>).map((api, index) => {
            if (!api || typeof api !== 'object') {
              return { name: `external-api-${index}`, status: 'down' as const };
            }
            const apiObj = api as Record<string, unknown>;
            return {
              name: typeof apiObj.name === 'string' ? apiObj.name : `external-api-${index}`,
              status: normalizeStatus(apiObj.status),
              latency_ms: coerceToNumber(apiObj.latency_ms),
            };
          })
        : undefined,
      active_edges: coerceToNumber(infraObj.active_edges),
    };
  }

  // Build validated health object
  const validated: ValidatedHealthPayload = {
    overall_status: normalizeStatus(rawObj.overall_status || rawObj.status),
    services,
    performance,
    cache,
    infrastructure,
    timestamp: typeof rawObj.timestamp === 'string' ? rawObj.timestamp : new Date().toISOString(),
    uptime_seconds: coerceToNumber(rawObj.uptime_seconds),
    version: typeof rawObj.version === 'string' ? rawObj.version : undefined,
    __validated: true,
    // Preserve other fields for extensibility
    ...Object.fromEntries(
      Object.entries(rawObj).filter(([key]) => 
        !['overall_status', 'status', 'services', 'performance', 'cache', 'infrastructure', 'timestamp', 'uptime_seconds', 'version'].includes(key)
      )
    ),
  };

  return validated;
}