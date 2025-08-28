/**
 * Clean, single implementation of ensureHealthShape.
 * Normalizes health responses and avoids direct property access on unknown.
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

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;

const mapStatus = (s: unknown) => {
  if (s === 'ok' || s === 'healthy') return 'healthy';
  if (s === 'degraded') return 'degraded';
  if (s === 'down' || s === 'unhealthy' || s === 'error') return 'unhealthy';
  return 'unknown';
};

const toSafeNumber = (v: unknown): number => {
  if (typeof v === 'boolean') return v ? 1 : 0;
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return n;
};

export function ensureHealthShape(raw: unknown, options?: { usedMock?: boolean }): SystemHealth {
  oneTimeLog('ensureHealthShape-deprecated', () => console.info('[DEPRECATED] ensureHealthShape is deprecated.'));

  try {
    const validated = validateHealthResponse(raw);
    const vRec: Record<string, unknown> = isRecord(validated) ? validated as Record<string, unknown> : {};

    const perf = isRecord(vRec.performance) ? (vRec.performance as Record<string, unknown>) : undefined;
    const cache = isRecord(vRec.cache) ? (vRec.cache as Record<string, unknown>) : undefined;
    const infra = isRecord(vRec.infrastructure) ? (vRec.infrastructure as Record<string, unknown>) : undefined;

    const perfHitMain = perf ? perf.cache_hit_rate : undefined;
    const perfHitLegacy = perf ? perf.hit_rate : undefined;
    const cacheHitAlt = cache ? cache.hit_rate : undefined;
    const infraHit = infra && isRecord(infra.cache) ? ((infra.cache as Record<string, unknown>).hit_rate_percent) : undefined;

    const computedRaw = (
      perfHitMain ?? perfHitLegacy ?? cacheHitAlt ?? infraHit ?? 0
    );

    const computedHitRate = toSafeNumber(computedRaw);

    // mappedHitRate heuristics using original raw when possible
    let rawMappedHitRate = false;
    try {
      if (isRecord(raw)) {
        const rawRec = raw as Record<string, unknown>;
        const rPerf = isRecord(rawRec.performance) ? rawRec.performance as Record<string, unknown> : undefined;
        const rCache = isRecord(rawRec.cache) ? rawRec.cache as Record<string, unknown> : undefined;
        const rInfraCache = isRecord(rawRec.infrastructure) && isRecord((rawRec.infrastructure as Record<string, unknown>).cache)
          ? ((rawRec.infrastructure as Record<string, unknown>).cache as Record<string, unknown>)
          : undefined;

        const hasPerfCache = !!(rPerf && rPerf.cache_hit_rate !== undefined);
        const hasPerfHit = !!(rPerf && rPerf.hit_rate !== undefined);
        const hasCacheHit = !!(rCache && rCache.hit_rate !== undefined);
        const hasInfraHit = !!(rInfraCache && rInfraCache.hit_rate_percent !== undefined);

        rawMappedHitRate = !hasPerfCache && (hasPerfHit || hasCacheHit || hasInfraHit);
      }
    } catch {
      // ignore
    }

    const overallStatus = vRec.overall_status as unknown;
    const servicesList = vRec.services as unknown;
    const findServiceStatus = (name: string): unknown => {
      if (Array.isArray(servicesList)) {
        const arr = servicesList as Array<Record<string, unknown>>;
        const found = arr.find((s) => s && typeof s === 'object' && 'name' in s && (s as Record<string, unknown>).name === name);
        return found ? (found as Record<string, unknown>).status : undefined;
      }
      return undefined;
    };

    return {
      status: mapStatus(overallStatus),
      services: {
        api: mapStatus(findServiceStatus('api')) || 'unknown',
        cache: mapStatus(infra && isRecord(infra.cache) ? (infra.cache as Record<string, unknown>).status : undefined) || 'unknown',
        database: mapStatus(infra && isRecord(infra.database) ? (infra.database as Record<string, unknown>).status : undefined) || 'unknown',
      },
      performance: {
        cache_hit_rate: computedHitRate,
        cache_type: isRecord(vRec.cache) ? 'unified' : 'unknown',
      },
      uptime_seconds: toSafeNumber(vRec.uptime_seconds),
      originFlags: {
        hadCacheHitRate: !!(perfHitMain !== undefined && perfHitMain !== null) || !!(perfHitLegacy !== undefined && perfHitLegacy !== null) || !!(cacheHitAlt !== undefined && cacheHitAlt !== null) || !!(infraHit !== undefined && infraHit !== null),
        mappedHitRate: rawMappedHitRate,
        usedMock: options?.usedMock || false,
      },
    };
  } catch (error) {
    // Fallback: tolerant parsing for legacy shapes
    oneTimeLog('ensureHealthShape-fallback', () => console.warn('[ensureHealthShape] Validation failed, using fallback data:', error));

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
      const servicesRaw: unknown = rawObj.services ?? {};
      const servicesRec: Record<string, unknown> = isRecord(servicesRaw) ? servicesRaw as Record<string, unknown> : {} as Record<string, unknown>;
      const servicesOut = {
        api: servicesRec['api'] !== undefined ? mapLegacyStatus(servicesRec['api']) : 'unknown',
        cache: servicesRec['cache'] !== undefined ? mapLegacyStatus(servicesRec['cache']) : 'unknown',
        database: servicesRec['database'] !== undefined ? mapLegacyStatus(servicesRec['database']) : 'unknown',
      };

      const perfRec = isRecord(rawObj.performance) ? (rawObj.performance as Record<string, unknown>) : undefined;
      const infraRec = isRecord(rawObj.infrastructure) ? (rawObj.infrastructure as Record<string, unknown>) : undefined;
      const infraCacheRec = infraRec && isRecord(infraRec.cache) ? (infraRec.cache as Record<string, unknown>) : undefined;

      let hitRate: unknown = undefined;
      if (perfRec && perfRec.cache_hit_rate !== undefined) hitRate = perfRec.cache_hit_rate;
      else if (perfRec && perfRec.hit_rate !== undefined) hitRate = perfRec.hit_rate;
      else if (infraCacheRec && infraCacheRec.hit_rate_percent !== undefined) hitRate = infraCacheRec.hit_rate_percent;

      const cacheHit = ((): number => {
        if (typeof hitRate === 'boolean') return hitRate ? 1 : 0;
        const n = Number(hitRate);
        if (!Number.isFinite(n)) return 0;
        return n;
      })();

      return {
        status,
        services: servicesOut,
        performance: {
          cache_hit_rate: cacheHit,
          cache_type: rawObj.cache ? 'unified' : 'unknown',
        },
        uptime_seconds: ((): number => { const n = Number((rawObj.uptime_seconds as unknown) || 0); return Number.isFinite(n) ? n : 0; })(),
        originFlags: {
          hadCacheHitRate: !!hitRate,
          mappedHitRate: !!(perfRec && perfRec.hit_rate !== undefined) || (!!(infraCacheRec && infraCacheRec.hit_rate_percent !== undefined) && !(perfRec && perfRec.cache_hit_rate !== undefined)),
          usedMock: options?.usedMock || true,
        },
      };
    }

    return {
      status: 'unknown',
      services: { api: 'unknown', cache: 'unknown', database: 'unknown' },
      performance: { cache_hit_rate: 0, cache_type: 'unknown' },
      uptime_seconds: 0,
      originFlags: { hadCacheHitRate: false, mappedHitRate: false, usedMock: options?.usedMock || true },
    };
  }
}
// Trimmed: keep only the single clean implementation above.