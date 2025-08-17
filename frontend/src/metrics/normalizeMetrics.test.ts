/**
 * Tests for normalizeMetrics.ts - Core metrics normalization and safety
 * Ensures proper handling of unsafe cache_hit_rate access patterns
 */

import { 
  normalizeMetrics, 
  normalizeKey, 
  formatCacheHitRate, 
  formatResponseTime,
  mergeMetrics,
  isNormalizedMetrics,
  DEFAULT_METRICS,
  type NormalizedMetrics 
} from './normalizeMetrics';

describe('normalizeMetrics', () => {
  describe('normalizeMetrics function', () => {
    it('should normalize valid health data with cache hit rate', () => {
      const rawData = {
        infrastructure: {
          cache: {
            hit_rate_percent: 85.5
          }
        },
        system_performance: {
          avg_response_time_ms: 150,
          p95_response_time_ms: 250
        }
      };

      const normalized = normalizeMetrics(rawData);

      expect(normalized.cacheHitRate).toBe(85.5);
      expect(normalized.avgResponseTimeMs).toBe(150);
      expect(normalized.p95ResponseTimeMs).toBe(250);
    });

    it('should handle missing cache hit rate gracefully', () => {
      const rawData = {
        infrastructure: {
          performance: {
            memory_usage_mb: 512
          }
        }
      };

      const normalized = normalizeMetrics(rawData);

      expect(normalized.cacheHitRate).toBe(DEFAULT_METRICS.cacheHitRate);
      expect(normalized.memoryUsageMb).toBe(512);
    });

    it('should handle completely empty input', () => {
      const normalized = normalizeMetrics({});
      
      expect(normalized).toEqual(DEFAULT_METRICS);
    });

    it('should handle null/undefined input', () => {
      expect(normalizeMetrics(null)).toEqual(DEFAULT_METRICS);
      expect(normalizeMetrics(undefined)).toEqual(DEFAULT_METRICS);
    });

    it('should handle deeply nested missing properties', () => {
      const rawData = {
        infrastructure: {
          cache: null,
          performance: {
            memory_usage_mb: null
          }
        }
      };

      const normalized = normalizeMetrics(rawData);

      expect(normalized.cacheHitRate).toBe(DEFAULT_METRICS.cacheHitRate);
      expect(normalized.memoryUsageMb).toBe(DEFAULT_METRICS.memoryUsageMb);
    });

    it('should preserve valid metrics and provide defaults for missing ones', () => {
      const rawData = {
        infrastructure: {
          cache: {
            hit_rate_percent: 92.3
          }
        },
        model_performance: {
          ensemble_accuracy: 0.876
        }
      };

      const normalized = normalizeMetrics(rawData);

      expect(normalized.cacheHitRate).toBe(92.3);
      expect(normalized.ensembleAccuracy).toBe(0.876);
      expect(normalized.avgResponseTimeMs).toBe(DEFAULT_METRICS.avgResponseTimeMs);
    });

    it('should handle analytics data format', () => {
      const analyticsData = {
        system_performance: {
          avg_response_time_ms: 125,
          error_rate_percent: 0.5,
          uptime_percent: 99.9
        },
        model_performance: {
          ensemble_accuracy: 0.891,
          predictions_today: 1247
        }
      };

      const normalized = normalizeMetrics(analyticsData);

      expect(normalized.avgResponseTimeMs).toBe(125);
      expect(normalized.errorRatePercent).toBe(0.5);
      expect(normalized.uptimePercent).toBe(99.9);
      expect(normalized.ensembleAccuracy).toBe(0.891);
      expect(normalized.predictionsToday).toBe(1247);
    });

    it('should handle combined health and analytics data', () => {
      const combinedData = {
        infrastructure: {
          cache: { hit_rate_percent: 88.7 },
          performance: {
            memory_usage_mb: 1024,
            cpu_usage_percent: 45.2
          }
        },
        system_performance: {
          avg_response_time_ms: 200,
          uptime_percent: 99.95
        },
        model_performance: {
          ensemble_accuracy: 0.923
        }
      };

      const normalized = normalizeMetrics(combinedData);

      expect(normalized.cacheHitRate).toBe(88.7);
      expect(normalized.memoryUsageMb).toBe(1024);
      expect(normalized.cpuUsagePercent).toBe(45.2);
      expect(normalized.avgResponseTimeMs).toBe(200);
      expect(normalized.uptimePercent).toBe(99.95);
      expect(normalized.ensembleAccuracy).toBe(0.923);
    });
  });

  describe('normalizeKey function', () => {
    it('should convert snake_case to camelCase', () => {
      expect(normalizeKey('cache_hit_rate')).toBe('cacheHitRate');
      expect(normalizeKey('avg_response_time_ms')).toBe('avgResponseTimeMs');
      expect(normalizeKey('ensemble_accuracy')).toBe('ensembleAccuracy');
    });

    it('should handle already camelCase keys', () => {
      expect(normalizeKey('cacheHitRate')).toBe('cacheHitRate');
      expect(normalizeKey('responseTime')).toBe('responseTime');
    });

    it('should handle single word keys', () => {
      expect(normalizeKey('accuracy')).toBe('accuracy');
      expect(normalizeKey('latency')).toBe('latency');
    });

    it('should handle empty or invalid keys', () => {
      expect(normalizeKey('')).toBe('');
      expect(normalizeKey('_')).toBe('');
      expect(normalizeKey('__test__')).toBe('Test');
    });
  });

  describe('formatCacheHitRate function', () => {
    it('should format valid cache hit rates', () => {
      const metrics1: NormalizedMetrics = { ...DEFAULT_METRICS, cacheHitRate: 85.5 };
      const metrics2: NormalizedMetrics = { ...DEFAULT_METRICS, cacheHitRate: 100 };
      const metrics3: NormalizedMetrics = { ...DEFAULT_METRICS, cacheHitRate: 0 };
      
      expect(formatCacheHitRate(metrics1)).toContain('85.5');
      expect(formatCacheHitRate(metrics2)).toContain('100');
      expect(formatCacheHitRate(metrics3)).toContain('0');
    });

    it('should handle invalid cache hit rates gracefully', () => {
      const invalidMetrics: NormalizedMetrics = { ...DEFAULT_METRICS, cacheHitRate: NaN };
      
      expect(() => formatCacheHitRate(invalidMetrics)).not.toThrow();
    });
  });

  describe('formatResponseTime function', () => {
    it('should format response times correctly', () => {
      const metrics: NormalizedMetrics = { ...DEFAULT_METRICS, avgResponseTimeMs: 150 };
      const result = formatResponseTime(metrics);
      
      expect(result).toContain('150');
      expect(result).toContain('ms');
    });
  });

  describe('mergeMetrics function', () => {
    it('should merge multiple metric sources', () => {
      const source1 = { cacheHitRate: 85 };
      const source2 = { avgResponseTimeMs: 120 };
      
      const merged = mergeMetrics(source1, source2);
      
      expect(merged.cacheHitRate).toBe(85);
      expect(merged.avgResponseTimeMs).toBe(120);
    });

    it('should handle empty sources', () => {
      const merged = mergeMetrics({}, null, undefined);
      expect(merged).toEqual(DEFAULT_METRICS);
    });
  });

  describe('isNormalizedMetrics function', () => {
    it('should validate normalized metrics objects', () => {
      const validMetrics = { ...DEFAULT_METRICS };
      expect(isNormalizedMetrics(validMetrics)).toBe(true);
      
      expect(isNormalizedMetrics(null)).toBe(false);
      expect(isNormalizedMetrics({})).toBe(false);
      expect(isNormalizedMetrics("string")).toBe(false);
    });
  });

  describe('DEFAULT_METRICS constant', () => {
    it('should have all required fields with safe defaults', () => {
      expect(DEFAULT_METRICS.cacheHitRate).toBe(0);
      expect(DEFAULT_METRICS.avgResponseTimeMs).toBe(0);
      expect(DEFAULT_METRICS.memoryUsageMb).toBe(0);
      expect(DEFAULT_METRICS.cpuUsagePercent).toBe(0);
      expect(DEFAULT_METRICS.errorRatePercent).toBe(0);
      expect(DEFAULT_METRICS.uptimePercent).toBe(100);
      expect(DEFAULT_METRICS.ensembleAccuracy).toBe(0);
      expect(DEFAULT_METRICS.predictionsToday).toBe(0);
    });

    it('should be immutable', () => {
      const original = { ...DEFAULT_METRICS };
      
      // Attempt to modify
      (DEFAULT_METRICS as any).cacheHitRate = 999;
      
      // Should still be the same (assuming Object.freeze is used)
      expect(DEFAULT_METRICS).toEqual(original);
    });
  });

  describe('Real-world crash scenarios', () => {
    it('should handle the original crash case: health.performance.cache_hit_rate', () => {
      const crashData = {
        performance: {
          // cache_hit_rate is undefined here - this was causing crashes
        }
      };

      const normalized = normalizeMetrics(crashData);
      expect(normalized.cacheHitRate).toBe(DEFAULT_METRICS.cacheHitRate);
      expect(() => formatCacheHitRate(normalized)).not.toThrow();
    });

    it('should handle null nested objects gracefully', () => {
      const crashData = {
        infrastructure: null,
        system_performance: {
          avg_response_time_ms: null
        }
      };

      const normalized = normalizeMetrics(crashData);
      expect(normalized.cacheHitRate).toBe(DEFAULT_METRICS.cacheHitRate);
      expect(normalized.avgResponseTimeMs).toBe(DEFAULT_METRICS.avgResponseTimeMs);
    });

    it('should prevent "Cannot read properties of undefined" errors', () => {
      const testCases = [
        { infrastructure: { cache: {} } },
        { infrastructure: { performance: {} } },
        { system_performance: {} },
        { model_performance: {} },
        {}
      ];

      testCases.forEach((testCase, index) => {
        expect(() => {
          const normalized = normalizeMetrics(testCase);
          // Simulate the unsafe access patterns that were causing crashes
          const cacheRate = normalized.cacheHitRate;
          const formatted = formatCacheHitRate(normalized);
          expect(cacheRate).toBeDefined();
          expect(formatted).toBeDefined();
        }).not.toThrow(`Test case ${index} should not throw`);
      });
    });
  });
});