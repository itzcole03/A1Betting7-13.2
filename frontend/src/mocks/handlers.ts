import { rest } from 'msw';

// Minimal deterministic payloads used by tests
const mockCacheStats = {
  cache_version: 'v1',
  hit_count: 850,
  miss_count: 150,
  hit_ratio: 0.85,
  average_get_latency_ms: 2.3,
  latency_percentiles: { p50: 1.8, p90: 4.2, p95: 6.1, p99: 12.5 },
  namespaced_counts: { 'api:responses': 370, 'game:data': 680, 'user:profile': 450 },
  rebuild_events: 12,
  stampede_preventions: 3,
  tier_breakdown: { analytics: { active: 600, total: 750 }, raw_provider: { active: 450, total: 500 }, temp: { active: 150, total: 250 } },
  total_keys: 1500,
  total_operations: 1000,
  active_locks: 2,
  uptime_seconds: 86400,
  timestamp: new Date().toISOString(),
};

const mockPerformanceMetricsLegacy = {
  cache_performance: {
    total_requests: 379,
    hits: 312,
    misses: 67,
  },
};

const mockPerformanceMetricsCanonical = {
  cache_performance: {
    total_requests: 500,
    hits: 450,
    misses: 50,
  },
};

const handlers = [
  // Cache stats endpoints used by useCacheStats
  rest.get('http://localhost/api/v2/meta/cache-stats', (req: any, res: any, ctx: any) => {
    return res(ctx.status(200), ctx.json(mockCacheStats));
  }),

  rest.get('http://localhost/api/v2/meta/cache-health', (req: any, res: any, ctx: any) => {
    const mockCacheHealth = {
      healthy: true,
      operations: { get: true, set: true, delete: true },
      stats_snapshot: { total_operations: 1000, hit_ratio: 0.85 },
    };
    return res(ctx.status(200), ctx.json(mockCacheHealth));
  }),

  // Performance stats endpoint used by robustApi.fetchPerformanceStats
  rest.get('http://localhost/performance/stats', (req: any, res: any, ctx: any) => {
    // Return the canonical shape expected by tests under `data` key
    const payload = {
      data: {
        api_performance: {
          '/health': { avg_time_ms: 45.2, total_calls: 247, errors: 2 },
        },
        cache_performance: {
          cache_type: 'memory',
          hits: 312,
          misses: 67,
          errors: 3,
          hit_rate: 82.3,
          total_requests: 379,
        },
      },
    };
    return res(ctx.status(200), ctx.json(payload));
  }),

  // Bookmark sync POST (propfinder) - tests check for POSTs to bookmark endpoints
  rest.post('http://localhost/api/propfinder/opportunities', async (req: any, res: any, ctx: any) => {
    // Some tests post to /api/propfinder/opportunities for create; echo back
    const body = await req.json().catch(() => ({}));
    return res(ctx.status(200), ctx.json({ success: true, data: body }));
  }),

  // Common propfinder bookmark POST endpoints (some tests look for '/api/propfinder/bookmark')
  rest.post('http://localhost/api/propfinder/bookmark', async (req: any, res: any, ctx: any) => {
    const body = await req.json().catch(() => ({}));
    return res(ctx.status(200), ctx.json({ success: true, received: body }));
  }),

  // Also support the previously added sync endpoint
  rest.post('http://localhost/api/propfinder/bookmarks/sync', async (req: any, res: any, ctx: any) => {
    const body = await req.json().catch(() => ({}));
    return res(ctx.status(200), ctx.json({ received: body }));
  }),

  // AI/ensemble models (used by AdvancedAI) - minimal shape
  rest.get('http://localhost/api/ai/ensemble/models', (req: any, res: any, ctx: any) => {
    return res(ctx.status(200), ctx.json({ models: [] }));
  }),

  // Fallback catch-all to avoid network errors for other /api/* during tests
  rest.all('http://localhost/:rest*', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({}));
  }),
];

export { handlers };
