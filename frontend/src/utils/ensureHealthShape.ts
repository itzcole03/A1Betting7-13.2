/**
 * @deprecated This module is deprecated. Use validateHealthResponse from './validateHealthResponse' instead.
 * Guards against runtime errors when accessing health.performance.cache_hit_rate
 * and other critical health metrics by normalizing API responses to a safe shape.
 * 
 * @module ensureHealthShape
 */

import { validateHealthResponse } from './validateHealthResponse';
import { oneTimeLog } from './oneTimeLog';

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
 * @deprecated Use validateHealthResponse from './validateHealthResponse' instead.
 * Ensures health data conforms to SystemHealth shape with safe defaults
 * 
 * This function now acts as a compatibility shim that converts new health format
 * to the legacy SystemHealth format for backward compatibility.
 */
export function ensureHealthShape(raw: unknown, options?: { usedMock?: boolean }): SystemHealth {
  // Log deprecation notice once per session
  oneTimeLog(
    'ensureHealthShape-deprecated',
    // eslint-disable-next-line no-console
    () => console.info('[DEPRECATED] ensureHealthShape is deprecated. Use validateHealthResponse instead.')
  );

  try {
    // Try the new validator first
    const validated = validateHealthResponse(raw);

    // Map normalized statuses from validator to legacy strings
    const mapStatus = (s: unknown) => {
      if (s === 'ok' || s === 'healthy') return 'healthy';
      if (s === 'degraded') return 'degraded';
      if (s === 'down' || s === 'unhealthy' || s === 'error') return 'unhealthy';
      return 'unknown';
    };

    // Determine cache_hit_rate with support for multiple legacy fields
    const perfHit = validated.performance?.cache_hit_rate;
    const cacheHitAlt = (validated.cache as any)?.hit_rate;
    const infraHit = validated.infrastructure?.cache?.hit_rate_percent;

    const computedHitRate = (
      perfHit !== undefined && perfHit !== null ? perfHit :
      cacheHitAlt !== undefined && cacheHitAlt !== null ? cacheHitAlt :
      infraHit !== undefined && infraHit !== null ? infraHit : 0
    );

    return {
      status: mapStatus(validated.overall_status),
      services: {
        api: mapStatus(validated.services?.find(s => s.name === 'api')?.status) || 'unknown',
        cache: mapStatus(validated.infrastructure?.cache?.status) || 'unknown',
        database: mapStatus(validated.infrastructure?.database?.status) || 'unknown',
      },
      performance: {
        cache_hit_rate: typeof computedHitRate === 'boolean' ? (computedHitRate ? 1 : 0) : Number(computedHitRate || 0),
        cache_type: typeof validated.cache === 'object' ? 'unified' : 'unknown',
      },
      uptime_seconds: Number(validated.uptime_seconds || 0),
      originFlags: {
        hadCacheHitRate: !!(perfHit || cacheHitAlt || infraHit),
        mappedHitRate: !!infraHit || !!cacheHitAlt,
        usedMock: options?.usedMock || false,
      },
    };
  } catch (error) {
    // If validation fails, try to tolerant-parse the raw object to satisfy legacy expectations
    oneTimeLog(
      'ensureHealthShape-fallback',
      // eslint-disable-next-line no-console
      () => console.warn('[ensureHealthShape] Validation failed, using fallback data:', error)
    );

    // If raw is an object, attempt to extract fields manually
    if (raw && typeof raw === 'object') {
      const rawObj = raw as Record<string, any>;

      const mapLegacyStatus = (val: unknown) => {
        if (val === true || val === 1 || String(val).toLowerCase() === '1' || String(val).toLowerCase() === 'true') return 'healthy';
        if (val === false || val === 0 || String(val).toLowerCase() === '0' || String(val).toLowerCase() === 'false') return 'unhealthy';
        if (typeof val === 'string') {
          const s = val.toLowerCase();
          if (s === 'healthy' || s === 'ok') return 'healthy';
          if (s === 'unhealthy' || s === 'down' || s === 'error') return 'unhealthy';
          if (s === 'degraded' || s === 'warning') return 'degraded';
          return s;
        }
        return 'unknown';
      };

      const status = rawObj.status !== undefined ? mapLegacyStatus(rawObj.status) : 'unknown';

      const services = rawObj.services || {};
      const servicesOut = {
        api: services.api !== undefined ? mapLegacyStatus(services.api) : 'unknown',
        cache: services.cache !== undefined ? mapLegacyStatus(services.cache) : 'unknown',
        database: services.database !== undefined ? mapLegacyStatus(services.database) : 'unknown',
      };

      let hitRate: number | boolean | undefined;
      if (rawObj.performance && rawObj.performance.cache_hit_rate !== undefined) {
        hitRate = rawObj.performance.cache_hit_rate;
      } else if (rawObj.performance && rawObj.performance.hit_rate !== undefined) {
        hitRate = rawObj.performance.hit_rate;
      } else if (rawObj.infrastructure && rawObj.infrastructure.cache && rawObj.infrastructure.cache.hit_rate_percent !== undefined) {
        hitRate = rawObj.infrastructure.cache.hit_rate_percent;
      }

      const cacheHit = typeof hitRate === 'boolean' ? (hitRate ? 1 : 0) : Number(hitRate || 0);

      return {
        status,
        services: servicesOut,
        performance: {
          cache_hit_rate: cacheHit,
          cache_type: rawObj.cache ? 'unified' : 'unknown',
        },
        uptime_seconds: Number(rawObj.uptime_seconds || 0),
        originFlags: {
          hadCacheHitRate: !!hitRate,
          mappedHitRate: !!(rawObj.infrastructure && rawObj.infrastructure.cache && rawObj.infrastructure.cache.hit_rate_percent),
          usedMock: options?.usedMock || true,
        },
      };
    }

    // Final fallback
    return {
      status: 'unknown',
      services: {
        api: 'unknown',
        cache: 'unknown',
        database: 'unknown',
      },
      performance: {
        cache_hit_rate: 0,
        cache_type: 'unknown',
      },
      uptime_seconds: 0,
      originFlags: {
        hadCacheHitRate: false,
        mappedHitRate: false,
        usedMock: options?.usedMock || true,
      },
    };
  }
}