import { http, HttpResponse } from 'msw';

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

const _mockPerformanceMetricsLegacy = {
  cache_performance: {
    total_requests: 379,
    hits: 312,
    misses: 67,
  },
};

const _mockPerformanceMetricsCanonical = {
  cache_performance: {
    total_requests: 500,
    hits: 450,
    misses: 50,
  },
};

const handlers = [
  // Cache stats endpoints used by useCacheStats
  http.get('http://localhost/api/v2/meta/cache-stats', () =>
    HttpResponse.json(mockCacheStats)
  ),

  http.get('http://localhost/api/v2/meta/cache-health', () => {
    const mockCacheHealth = {
      healthy: true,
      operations: { get: true, set: true, delete: true },
      stats_snapshot: { total_operations: 1000, hit_ratio: 0.85 },
    };
    return HttpResponse.json(mockCacheHealth);
  }),

  // Performance stats endpoint used by robustApi.fetchPerformanceStats
  http.get('http://localhost/performance/stats', () => {
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
    return HttpResponse.json(payload);
  }),

  // Bookmark sync POST (propfinder) - tests check for POSTs to bookmark endpoints
  http.post('http://localhost/api/propfinder/opportunities', async ({ request }) => {
    // Some tests post to /api/propfinder/opportunities for create; echo back
    const body = await request.json().catch(() => ({}));
    return HttpResponse.json({ success: true, data: body });
  }),

  // Common propfinder bookmark POST endpoints (some tests look for '/api/propfinder/bookmark')
  http.post('http://localhost/api/propfinder/bookmark', async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    return HttpResponse.json({ success: true, received: body });
  }),

  // Also support the previously added sync endpoint
  http.post('http://localhost/api/propfinder/bookmarks/sync', async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    return HttpResponse.json({ received: body });
  }),

  // AI/ensemble models (used by AdvancedAI) - minimal shape
  http.get('http://localhost/api/ai/ensemble/models', () =>
    HttpResponse.json({ models: [] })
  ),

  // Fallback catch-all to avoid network errors for other /api/* during tests
  http.all('http://localhost/:rest*', () => HttpResponse.json({})),
];

export { handlers };
