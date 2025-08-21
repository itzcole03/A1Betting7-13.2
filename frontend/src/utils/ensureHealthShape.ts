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

    // Helper to coerce values to safe numbers (NaN/Infinity -> 0), booleans handled
    const toSafeNumber = (v: unknown): number => {
      if (typeof v === 'boolean') return v ? 1 : 0;
      const n = Number(v);
      if (!Number.isFinite(n)) return 0;
      return n;
    };

    // Determine cache_hit_rate with support for multiple legacy fields
    const perfHitMain = validated.performance?.cache_hit_rate;
    const perfHitLegacy = validated.performance?.hit_rate;
    const cacheHitAlt = (validated.cache as any)?.hit_rate;
    const infraHit = validated.infrastructure?.cache?.hit_rate_percent;

    // Which source did we use? prefer performance.cache_hit_rate, then performance.hit_rate, then cache.*, then infra
    const computedRaw = (
      perfHitMain !== undefined && perfHitMain !== null ? perfHitMain :
      perfHitLegacy !== undefined && perfHitLegacy !== null ? perfHitLegacy :
      cacheHitAlt !== undefined && cacheHitAlt !== null ? cacheHitAlt :
      infraHit !== undefined && infraHit !== null ? infraHit : 0
    );

    // Consider legacy source used only when performance.cache_hit_rate is missing
    // and a legacy performance.hit_rate or cache.hit_rate is present. Ignore infraHit for mappedHitRate.
    const usedLegacySource = !(perfHitMain !== undefined && perfHitMain !== null) && (
      perfHitLegacy !== undefined || cacheHitAlt !== undefined
    );

    const computedHitRate = toSafeNumber(computedRaw);

    // If mapping from legacy `hit_rate` (performance.hit_rate or cache.hit_rate), log when in development for diagnostics
    if (process.env.NODE_ENV === 'development' && perfHitLegacy !== undefined && (perfHitMain === undefined || perfHitMain === null)) {
      // eslint-disable-next-line no-console
      console.log('[ensureHealthShape] Mapped hit_rate (' + perfHitLegacy + ') to cache_hit_rate');
    }

    // Determine mappedHitRate and emit development log based on original raw input (legacy fields)
    let rawMappedHitRate = false;
    try {
      const rawAny = raw as any;
      if (rawAny && typeof rawAny === 'object') {
        const hasPerfCache = rawAny.performance && rawAny.performance.cache_hit_rate !== undefined;
        const hasPerfHit = rawAny.performance && rawAny.performance.hit_rate !== undefined;
        const hasCacheHit = rawAny.cache && rawAny.cache.hit_rate !== undefined;
        const hasInfraHit = rawAny.infrastructure && rawAny.infrastructure.cache && rawAny.infrastructure.cache.hit_rate_percent !== undefined;

        rawMappedHitRate = !hasPerfCache && (hasPerfHit || hasCacheHit || hasInfraHit);

        if (process.env.NODE_ENV === 'development' && hasPerfHit && !hasPerfCache) {
          // eslint-disable-next-line no-console
          console.log('[ensureHealthShape] Mapped hit_rate (' + rawAny.performance.hit_rate + ') to cache_hit_rate');
        }
      }
    } catch (_err) {
      // ignore
    }

    return {
      status: mapStatus(validated.overall_status),
      services: {
        api: mapStatus(validated.services?.find(s => s.name === 'api')?.status) || 'unknown',
        cache: mapStatus(validated.infrastructure?.cache?.status) || 'unknown',
        database: mapStatus(validated.infrastructure?.database?.status) || 'unknown',
      },
      performance: {
        cache_hit_rate: computedHitRate,
        cache_type: typeof validated.cache === 'object' ? 'unified' : 'unknown',
      },
  uptime_seconds: toSafeNumber(validated.uptime_seconds),
      originFlags: {
        hadCacheHitRate: !!(perfHitMain !== undefined && perfHitMain !== null) || !!(perfHitLegacy !== undefined && perfHitLegacy !== null) || !!(cacheHitAlt !== undefined && cacheHitAlt !== null) || !!(infraHit !== undefined && infraHit !== null),
        mappedHitRate: rawMappedHitRate || !!usedLegacySource,
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
  const rawObj = raw as Record<string, unknown>;

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

      let hitRate: unknown = undefined;
      if (rawObj.performance && (rawObj.performance as any).cache_hit_rate !== undefined) {
        hitRate = (rawObj.performance as any).cache_hit_rate;
      } else if (rawObj.performance && (rawObj.performance as any).hit_rate !== undefined) {
        hitRate = (rawObj.performance as any).hit_rate;
      } else if (
        rawObj.infrastructure &&
        (rawObj.infrastructure as any).cache &&
        (rawObj.infrastructure as any).cache.hit_rate_percent !== undefined
      ) {
        hitRate = (rawObj.infrastructure as any).cache.hit_rate_percent;
      }

      const cacheHit = ((): number => {
        if (typeof hitRate === 'boolean') return hitRate ? 1 : 0;
        const n = Number(hitRate);
        if (!Number.isFinite(n)) return 0;
        return n;
      })();

      // Emit development log when mapping legacy performance.hit_rate in fallback
      try {
        const rawAnyLog = rawObj as any;
        if (process.env.NODE_ENV === 'development' && rawAnyLog.performance && rawAnyLog.performance.hit_rate !== undefined && rawAnyLog.performance.cache_hit_rate === undefined) {
          // eslint-disable-next-line no-console
          console.log('[ensureHealthShape] Mapped hit_rate (' + rawAnyLog.performance.hit_rate + ') to cache_hit_rate');
        }
      } catch (_e) {
        // ignore
      }

      return {
        status,
        services: servicesOut,
        performance: {
          cache_hit_rate: cacheHit,
          cache_type: rawObj.cache ? 'unified' : 'unknown',
        },
        uptime_seconds: ((): number => {
          const n = Number((rawObj.uptime_seconds as unknown) || 0);
          if (!Number.isFinite(n)) return 0;
          return n;
        })(),
        originFlags: {
          hadCacheHitRate: !!hitRate,
          mappedHitRate: !!(
            rawObj.performance && (rawObj.performance as any).hit_rate !== undefined
          ) || (!!(
            rawObj.infrastructure && (rawObj.infrastructure as any).cache && (rawObj.infrastructure as any).cache.hit_rate_percent !== undefined
          ) && !(rawObj.performance && (rawObj.performance as any).cache_hit_rate !== undefined)),
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