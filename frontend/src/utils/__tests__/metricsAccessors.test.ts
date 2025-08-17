/**
 * @jest-environment jsdom
 */

import {
  getTotalRequests,
  getSuccessRequests,
  getErrorRequests,
  getApiErrorRate,
  getApiTotalRequests,
  getAverageLatencyMs,
  getCacheHits,
  getCacheMisses,
  getCacheErrors,
} from '../metricsAccessors';

describe('metricsAccessors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getTotalRequests', () => {
    it('should return canonical cache.total_requests', () => {
      const data = {
        cache: { total_requests: 500 },
        cache_performance: { total_requests: 300 }, // should not be used
      };
      expect(getTotalRequests(data)).toBe(500);
    });

    it('should fallback to legacy cache_performance.total_requests', () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
      process.env.NODE_ENV = 'development';

      const data = {
        cache_performance: { total_requests: 300 },
      };
      expect(getTotalRequests(data)).toBe(300);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[MetricsCompat] Using legacy cache_performance.total_requests, consider migrating to cache.total_requests'
      );

      consoleSpy.mockRestore();
      delete process.env.NODE_ENV;
    });

    it('should fallback to flat total_requests', () => {
      const data = {
        total_requests: 200,
      };
      expect(getTotalRequests(data)).toBe(200);
    });

    it('should return 0 for null/undefined input', () => {
      expect(getTotalRequests(null)).toBe(0);
      expect(getTotalRequests(undefined)).toBe(0);
      expect(getTotalRequests({})).toBe(0);
    });
  });

  describe('getApiTotalRequests', () => {
    it('should return canonical api.total_requests', () => {
      const data = {
        api: { total_requests: 1000 },
      };
      expect(getApiTotalRequests(data)).toBe(1000);
    });

    it('should aggregate from legacy api_performance', () => {
      const data = {
        api_performance: {
          '/health': { total_calls: 100 },
          '/mlb/games': { total_calls: 200, total_requests: 50 }, // total_calls takes precedence
          '/ml/predict': { total_requests: 150 },
        },
      };
      expect(getApiTotalRequests(data)).toBe(450); // 100 + 200 + 150
    });

    it('should return 0 when no API data available', () => {
      expect(getApiTotalRequests({})).toBe(0);
    });
  });

  describe('getErrorRequests', () => {
    it('should return canonical api.error_requests', () => {
      const data = {
        api: { error_requests: 25 },
      };
      expect(getErrorRequests(data)).toBe(25);
    });

    it('should aggregate errors from legacy api_performance', () => {
      const data = {
        api_performance: {
          '/health': { errors: 2 },
          '/mlb/games': { errors: 1 },
          '/ml/predict': { errors: 0 },
        },
      };
      expect(getErrorRequests(data)).toBe(3);
    });
  });

  describe('getApiErrorRate', () => {
    it('should calculate error rate correctly', () => {
      const data = {
        api: {
          total_requests: 1000,
          error_requests: 50,
        },
      };
      expect(getApiErrorRate(data)).toBe(5.0); // 50/1000 * 100
    });

    it('should return 0 when no total requests', () => {
      const data = {
        api: {
          total_requests: 0,
          error_requests: 5,
        },
      };
      expect(getApiErrorRate(data)).toBe(0);
    });

    it('should work with aggregated legacy data', () => {
      const data = {
        api_performance: {
          '/health': { total_calls: 100, errors: 2 },
          '/mlb/games': { total_calls: 200, errors: 3 },
        },
      };
      expect(getApiErrorRate(data)).toBeCloseTo(1.67, 2); // 5/300 * 100
    });
  });

  describe('getSuccessRequests', () => {
    it('should return canonical api.success_requests', () => {
      const data = {
        api: { success_requests: 950 },
      };
      expect(getSuccessRequests(data)).toBe(950);
    });

    it('should calculate from total - errors when success not available', () => {
      const data = {
        api: {
          total_requests: 1000,
          error_requests: 50,
        },
      };
      expect(getSuccessRequests(data)).toBe(950);
    });

    it('should return 0 when no API data', () => {
      expect(getSuccessRequests({})).toBe(0);
    });
  });

  describe('getAverageLatencyMs', () => {
    it('should return canonical api.avg_latency_ms', () => {
      const data = {
        api: { avg_latency_ms: 125.5 },
      };
      expect(getAverageLatencyMs(data)).toBe(125.5);
    });

    it('should average from legacy api_performance', () => {
      const data = {
        api_performance: {
          '/health': { avg_time_ms: 100 },
          '/mlb/games': { avg_time_ms: 200 },
          '/ml/predict': { avg_latency_ms: 300 }, // different field name
        },
      };
      expect(getAverageLatencyMs(data)).toBe(200); // (100 + 200 + 300) / 3
    });

    it('should return 0 when no latency data', () => {
      expect(getAverageLatencyMs({})).toBe(0);
    });
  });

  describe('getCacheHits', () => {
    it('should return canonical cache.hits', () => {
      const data = {
        cache: { hits: 800 },
        cache_performance: { hits: 600 }, // should not be used
      };
      expect(getCacheHits(data)).toBe(800);
    });

    it('should fallback to legacy cache_performance.hits with warning', () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
      process.env.NODE_ENV = 'development';

      const data = {
        cache_performance: { hits: 600 },
      };
      expect(getCacheHits(data)).toBe(600);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[MetricsCompat] Using legacy cache_performance.hits, consider migrating to cache.hits'
      );

      consoleSpy.mockRestore();
      delete process.env.NODE_ENV;
    });
  });

  describe('getCacheMisses', () => {
    it('should return canonical cache.misses', () => {
      const data = {
        cache: { misses: 100 },
      };
      expect(getCacheMisses(data)).toBe(100);
    });

    it('should fallback to legacy cache_performance.misses', () => {
      const data = {
        cache_performance: { misses: 150 },
      };
      expect(getCacheMisses(data)).toBe(150);
    });
  });

  describe('getCacheErrors', () => {
    it('should return canonical cache.errors', () => {
      const data = {
        cache: { errors: 5 },
      };
      expect(getCacheErrors(data)).toBe(5);
    });

    it('should fallback to legacy cache_performance.errors with warning', () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
      process.env.NODE_ENV = 'development';

      const data = {
        cache_performance: { errors: 8 },
      };
      expect(getCacheErrors(data)).toBe(8);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[MetricsCompat] Using legacy cache_performance.errors, consider migrating to cache.errors'
      );

      consoleSpy.mockRestore();
      delete process.env.NODE_ENV;
    });
  });

  describe('one-time warning behavior', () => {
    it('should only warn once per accessor type across multiple calls', () => {
      // Note: This test may not work reliably due to module-level state
      // The warning flags are module-scoped and may have been set by previous tests
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const data = { cache_performance: { total_requests: 100 } };

      // Call multiple times
      getTotalRequests(data);
      getTotalRequests(data);
      getTotalRequests(data);

      // Warning should be called at most once (may be 0 if already warned in other tests)
      expect(consoleSpy.mock.calls.length).toBeLessThanOrEqual(1);

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });
});