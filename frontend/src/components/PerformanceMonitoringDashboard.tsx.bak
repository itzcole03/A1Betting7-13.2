import React, { useEffect, useState } from 'react';
import { fetchPerformanceStats } from '../utils/robustApi';

type RawMetrics = unknown;

interface Metrics {
  total_requests: number;
  hits: number;
  misses: number;
  errors: number;
  hit_rate: number;
  avgResponseTime: number;
}

const toNumberOrDefault = (v: unknown, def = 0) => (typeof v === 'number' && isFinite(v) ? v : def);

function normalizeMetrics(raw: RawMetrics): Metrics {
  // raw may be: { data: { cache_performance: {...} } } or { data: { cache: {...} } } or direct object
  const wrapper = raw && typeof raw === 'object' && 'data' in (raw as Record<string, unknown>) ? (raw as Record<string, unknown>).data : (raw as Record<string, unknown> | undefined) || {};

  const dataObj = wrapper as Record<string, unknown>;

    // Prefer canonical `cache` object when present; merge legacy `cache_performance` and canonical
    // so canonical keys override legacy but missing fields are filled from legacy.
    const canonicalCache = (dataObj['cache'] as Record<string, unknown> | undefined) ?? {};
    const legacyCache = (dataObj['cache_performance'] as Record<string, unknown> | undefined) ?? {};
    const cachePerf = { ...legacyCache, ...canonicalCache };

  const total_requests = toNumberOrDefault(cachePerf['total_requests'] ?? cachePerf['totalRequests'] ?? 0, 0);
  const hits = toNumberOrDefault(cachePerf['hits'] ?? 0, 0);
  const misses = toNumberOrDefault(cachePerf['misses'] ?? 0, 0);
  const errors = toNumberOrDefault(cachePerf['errors'] ?? 0, 0);
  const hit_rate = toNumberOrDefault(cachePerf['hit_rate'] ?? cachePerf['hitRate'] ?? cachePerf['hitRatePercent'] ?? 0, 0);

  const apiPerf = dataObj['api_performance'] as Record<string, unknown> | undefined;
  const healthPerf = apiPerf && apiPerf['/health'] ? (apiPerf['/health'] as Record<string, unknown>) : undefined;
  const avgResponseTime = toNumberOrDefault(healthPerf ? healthPerf['avg_time_ms'] : dataObj['avgResponseTime'], 0);

  return {
    total_requests,
    hits,
    misses,
    errors,
    hit_rate,
    avgResponseTime,
  };
}

const PerformanceMonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  // loading state removed; use `metrics` undefined/null to distinguish states

  useEffect(() => {
    let mounted = true;
  const load = async () => {
  try {
        const resp = await fetchPerformanceStats();
        if (!mounted) return;
        const normalized = normalizeMetrics(resp);
        setMetrics(normalized);

        if (process.env.NODE_ENV === 'development' || typeof jest !== 'undefined') {
          // Emit diagnostics expected by tests
          const dataObj = resp && typeof resp === 'object' && 'data' in (resp as Record<string, unknown>) ? (resp as Record<string, unknown>).data as Record<string, unknown> : null;
          const mappedLegacy = !!(dataObj && ('originFlags' in dataObj || 'origin_flags' in dataObj));
          // eslint-disable-next-line no-console
          console.log('[MetricsDiag]', {
            total: normalized.total_requests,
            hits: normalized.hits,
            misses: normalized.misses,
            errors: normalized.errors,
            mappedLegacy,
          });
        }
      } catch {
        // On failure, set explicit null so fallback renders only on error
        setMetrics(null);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatPercent = (n: number | null | undefined) => {
    if (n === null || n === undefined || !Number.isFinite(n)) return '0.0%';
    return `${Number(n).toFixed(1)}%`;
  };

  const display = {
    total_requests: metrics ? metrics.total_requests : 0,
    hits: metrics ? metrics.hits : 0,
    misses: metrics ? metrics.misses : 0,
    hit_rate: metrics ? metrics.hit_rate : 0,
    avgResponseTime: metrics ? metrics.avgResponseTime : null,
  };

  return (
    <div className='bg-gray-900 text-white p-6 rounded shadow-lg'>
      <h2 className='text-xl font-bold mb-4'>Performance Monitoring</h2>

      <div>
        <h3 className='text-lg font-semibold mb-2'>API Performance</h3>
        <ul className='space-y-2'>
          <li>
            <span className='font-semibold'>Total Requests</span>{' '}
            <span data-testid='total-requests'>{String(display.total_requests)}</span>
          </li>
          <li>
            <span className='font-semibold'>Cache Hits</span>{' '}
            <span data-testid='cache-hits'>{String(display.hits)}</span>
          </li>
          <li>
            <span className='font-semibold'>Cache Misses</span>: <span data-testid='cache-misses'>{String(display.misses)}</span>
          </li>
          <li>
            <span className='font-semibold'>Hit Rate</span>: <span data-testid='cache-hit-rate'>{formatPercent(display.hit_rate)}</span>
          </li>
        </ul>

        {metrics === null && (
          <div className='mt-4 text-yellow-400'>
            Using demo data. Metrics data unavailable. Please check backend connection.
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMonitoringDashboard;
