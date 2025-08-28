/**
 * @jest-environment jsdom
 */

import { ensureMetricsShape } from '../ensureMetricsShape';

describe('ensureMetricsShape', () => {
  beforeEach(() => {
    // Reset console warn spy before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up console spy
    jest.restoreAllMocks();
  });

  it('should return fully populated numeric fields with empty object input', () => {
    const result = ensureMetricsShape({});
    
    expect(result).toEqual({
      api: {
        total_requests: 0,
        success_requests: 0,
        error_requests: 0,
        avg_latency_ms: 0,
      },
      cache: {
        hits: 0,
        misses: 0,
        total_requests: 0,
        hit_rate: 0,
        errors: 0,
      },
      system_info: {
        optimization_level: 'Basic',
        caching_strategy: 'Memory',
        monitoring: 'Standard',
      },
      timestamps: {
        updated_at: expect.any(String),
      },
      originFlags: {},
    });
  });

  it('should handle legacy cache_performance shape only', () => {
    const legacyData = {
      cache_performance: {
        hits: 312,
        misses: 67,
        total_requests: 379,
        hit_rate: 82.3,
        errors: 3,
      },
    };

    const result = ensureMetricsShape(legacyData);

    expect(result.cache).toEqual({
      hits: 312,
      misses: 67,
      total_requests: 379,
      hit_rate: 82.3,
      errors: 3,
    });
    expect(result.originFlags?.mappedLegacy).toBe(true);
  });

  it('should handle mixed canonical and legacy with canonical winning', () => {
    const mixedData = {
      cache: {
        hits: 500, // canonical wins
        total_requests: 600,
      },
      cache_performance: {
        hits: 300, // legacy fallback
        misses: 50,
        errors: 2,
      },
    };

    const result = ensureMetricsShape(mixedData);

    expect(result.cache).toEqual({
      hits: 500, // canonical value used
      misses: 50, // legacy fallback used
      total_requests: 600, // canonical value used  
      hit_rate: 0, // default since not provided
      errors: 2, // legacy fallback used
    });
    expect(result.originFlags?.mappedLegacy).toBe(true);
  });

  it('should coerce string numbers correctly', () => {
    const stringData = {
      cache_performance: {
        hits: '150',
        total_requests: '200',
        hit_rate: '75.5',
      },
    };

    const result = ensureMetricsShape(stringData);

    expect(result.cache.hits).toBe(150);
    expect(result.cache.total_requests).toBe(200);
    expect(result.cache.hit_rate).toBe(75.5);
  });

  it('should handle partial data with missing fields defaulting to zero', () => {
    const partialData = {
      cache_performance: {
        hits: 100,
        // missing: misses, total_requests, hit_rate, errors
      },
      api_performance: {
        '/health': {
          total_calls: 50,
          errors: 2,
          avg_time_ms: 45.2,
        },
      },
    };

    const result = ensureMetricsShape(partialData);

    expect(result.cache).toEqual({
      hits: 100,
      misses: 0, // default
      total_requests: 0, // default
      hit_rate: 0, // default
      errors: 0, // default
    });
    expect(result.api).toEqual({
      total_requests: 50, // aggregated from api_performance
      success_requests: 48, // total - errors
      error_requests: 2, // aggregated errors
      avg_latency_ms: 45.2, // averaged
    });
  });

  it('should detect and flag legacy mapping', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.NODE_ENV = 'development';

    const legacyData = {
      api_performance: {
        '/health': { total_calls: 10, errors: 1 },
        '/mlb/games': { total_calls: 20, errors: 0 },
      },
    };

    const result = ensureMetricsShape(legacyData);

    expect(result.originFlags?.mappedLegacy).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      '[MetricsGuard] Using legacy metrics structure (cache_performance/api_performance)',
      'Consider migrating to canonical structure (cache/api)'
    );

    consoleSpy.mockRestore();
    delete process.env.NODE_ENV;
  });

  it('should aggregate API performance stats correctly', () => {
    const apiData = {
      api_performance: {
        '/health': {
          total_calls: 100,
          errors: 2,
          avg_time_ms: 45.2,
        },
        '/mlb/games': {
          total_calls: 50,
          errors: 1,
          avg_time_ms: 120.5,
        },
        '/ml/predict': {
          total_calls: 25,
          errors: 0,
          avg_time_ms: 200.0,
        },
      },
    };

    const result = ensureMetricsShape(apiData);

    expect(result.api).toEqual({
      total_requests: 175, // 100 + 50 + 25
      success_requests: 172, // 175 - 3 errors
      error_requests: 3, // 2 + 1 + 0
      avg_latency_ms: 121.9, // (45.2 + 120.5 + 200.0) / 3
    });
  });

  it('should handle null input gracefully', () => {
    const result = ensureMetricsShape(null);

    expect(result.api.total_requests).toBe(0);
    expect(result.cache.total_requests).toBe(0);
    expect(result.timestamps?.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('should handle Infinity and NaN in numeric fields', () => {
    const badData = {
      cache_performance: {
        hits: Infinity,
        misses: NaN,
        hit_rate: -Infinity,
      },
    };

    const result = ensureMetricsShape(badData);

    expect(result.cache.hits).toBe(0); // Infinity -> 0
    expect(result.cache.misses).toBe(0); // NaN -> 0
    expect(result.cache.hit_rate).toBe(0); // -Infinity -> 0
  });
});