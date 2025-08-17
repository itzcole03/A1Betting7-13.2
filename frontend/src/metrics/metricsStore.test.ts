/**
 * Tests for metricsStore.ts - Zustand store for centralized metrics management
 * Ensures safe access to metrics with guaranteed defaults
 */

import { renderHook, act } from '@testing-library/react';
import { useMetricsStore, useMetrics, useMetricsActions, useCacheHitRate } from './metricsStore';
import { DEFAULT_METRICS } from './normalizeMetrics';

describe('metricsStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useMetricsStore.getState();
    store.reset();
  });

  describe('useMetricsStore', () => {
    it('should initialize with default values', () => {
      const store = useMetricsStore.getState();
      
      expect(store.current).toEqual(DEFAULT_METRICS);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.lastUpdated).toBeNull();
      expect(store.lastSource).toBe('default');
    });

    it('should update from raw data correctly', () => {
      const rawData = {
        infrastructure: {
          cache: { hit_rate_percent: 92.5 }
        }
      };

      const store = useMetricsStore.getState();
      act(() => {
        store.updateFromRaw(rawData);
      });

      const updatedStore = useMetricsStore.getState();
      expect(updatedStore.current.cacheHitRate).toBe(92.5);
      expect(updatedStore.lastSource).toBe('raw_data');
      expect(updatedStore.lastUpdated).toBeInstanceOf(Date);
    });

    it('should handle multiple sources correctly', () => {
      const healthData = {
        infrastructure: {
          cache: { hit_rate_percent: 85 },
          performance: { memory_usage_mb: 512 }
        }
      };

      const analyticsData = {
        system_performance: {
          avg_response_time_ms: 150
        }
      };

      const store = useMetricsStore.getState();
      act(() => {
        store.updateFromMultipleSources([
          { data: healthData, source: 'health_check' },
          { data: analyticsData, source: 'analytics' }
        ]);
      });

      const updatedStore = useMetricsStore.getState();
      expect(updatedStore.current.cacheHitRate).toBe(85);
      expect(updatedStore.current.memoryUsageMb).toBe(512);
      expect(updatedStore.current.avgResponseTimeMs).toBe(150);
      expect(updatedStore.lastSource).toBe('multiple_sources');
    });

    it('should handle loading state correctly', () => {
      const store = useMetricsStore.getState();
      
      act(() => {
        store.setLoading(true);
      });

      expect(useMetricsStore.getState().isLoading).toBe(true);

      act(() => {
        store.setLoading(false);
      });

      expect(useMetricsStore.getState().isLoading).toBe(false);
    });

    it('should handle errors correctly', () => {
      const errorMessage = 'Test error';
      const store = useMetricsStore.getState();

      act(() => {
        store.setError(errorMessage);
      });

      expect(useMetricsStore.getState().error).toBe(errorMessage);

      act(() => {
        store.clearError();
      });

      expect(useMetricsStore.getState().error).toBeNull();
    });

    it('should reset to initial state', () => {
      const store = useMetricsStore.getState();
      
      // Modify state
      act(() => {
        store.updateFromRaw({ cacheHitRate: 95 });
        store.setError('Some error');
        store.setLoading(true);
      });

      // Reset
      act(() => {
        store.reset();
      });

      const resetStore = useMetricsStore.getState();
      expect(resetStore.current).toEqual(DEFAULT_METRICS);
      expect(resetStore.error).toBeNull();
      expect(resetStore.isLoading).toBe(false);
      expect(resetStore.lastSource).toBe('default');
    });
  });

  describe('useMetrics hook', () => {
    it('should return current metrics and state', () => {
      const { result } = renderHook(() => useMetrics());

      expect(result.current.current).toEqual(DEFAULT_METRICS);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.lastUpdated).toBe('object'); // Date or null
      expect(result.current.lastSource).toBe('default');
    });

    it('should update when store changes', () => {
      const { result } = renderHook(() => useMetrics());
      
      const rawData = { cacheHitRate: 78.5 };

      act(() => {
        const store = useMetricsStore.getState();
        store.updateFromRaw(rawData);
      });

      expect(result.current.current.cacheHitRate).toBe(78.5);
      expect(result.current.lastSource).toBe('raw_data');
    });
  });

  describe('useMetricsActions hook', () => {
    it('should provide all action functions', () => {
      const { result } = renderHook(() => useMetricsActions());

      expect(typeof result.current.updateFromRaw).toBe('function');
      expect(typeof result.current.updateFromMultipleSources).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.reset).toBe('function');
      expect(typeof result.current.setLoading).toBe('function');
    });

    it('should execute actions correctly', () => {
      const { result: actionsResult } = renderHook(() => useMetricsActions());
      const { result: metricsResult } = renderHook(() => useMetrics());

      const testData = { cacheHitRate: 88.2 };

      act(() => {
        actionsResult.current.updateFromRaw(testData);
      });

      expect(metricsResult.current.current.cacheHitRate).toBe(88.2);

      act(() => {
        actionsResult.current.setLoading(true);
      });

      expect(metricsResult.current.isLoading).toBe(true);

      act(() => {
        actionsResult.current.reset();
      });

      expect(metricsResult.current.current).toEqual(DEFAULT_METRICS);
      expect(metricsResult.current.isLoading).toBe(false);
    });
  });

  describe('useCacheHitRate hook', () => {
    it('should provide safe cache hit rate access', () => {
      const { result } = renderHook(() => useCacheHitRate());

      expect(typeof result.current.raw).toBe('number');
      expect(typeof result.current.percentage).toBe('number');
      expect(typeof result.current.formatted).toBe('string');
      expect(typeof result.current.isHealthy).toBe('boolean');
      expect(typeof result.current.status).toBe('string');
    });

    it('should return default values initially', () => {
      const { result } = renderHook(() => useCacheHitRate());

      expect(result.current.raw).toBe(DEFAULT_METRICS.cacheHitRate);
      expect(result.current.percentage).toBe(DEFAULT_METRICS.cacheHitRate);
      expect(result.current.formatted).toContain('0'); // Should format 0 as "0%"
      expect(result.current.isHealthy).toBe(false); // 0% is not healthy
      expect(['poor', 'fair', 'good', 'excellent']).toContain(result.current.status);
    });

    it('should update when cache hit rate changes', () => {
      const { result } = renderHook(() => useCacheHitRate());

      const rawData = { cacheHitRate: 95.5 };

      act(() => {
        const store = useMetricsStore.getState();
        store.updateFromRaw(rawData);
      });

      expect(result.current.raw).toBe(95.5);
      expect(result.current.percentage).toBe(95.5);
      expect(result.current.formatted).toContain('95.5');
      expect(result.current.isHealthy).toBe(true); // 95.5% is healthy
      expect(result.current.status).toBe('excellent');
    });

    it('should categorize cache hit rates correctly', () => {
      const testCases = [
        { rate: 30, expectedStatus: 'poor', expectedHealthy: false },
        { rate: 60, expectedStatus: 'fair', expectedHealthy: false },
        { rate: 80, expectedStatus: 'good', expectedHealthy: true },
        { rate: 95, expectedStatus: 'excellent', expectedHealthy: true }
      ];

      testCases.forEach(({ rate, expectedStatus, expectedHealthy }) => {
        const { result } = renderHook(() => useCacheHitRate());

        act(() => {
          const store = useMetricsStore.getState();
          store.updateFromRaw({ cacheHitRate: rate });
        });

        expect(result.current.status).toBe(expectedStatus);
        expect(result.current.isHealthy).toBe(expectedHealthy);
      });
    });
  });

  describe('Crash Prevention', () => {
    it('should never return null or undefined for metrics', () => {
      const { result } = renderHook(() => useMetrics());

      expect(result.current.current).not.toBeNull();
      expect(result.current.current).not.toBeUndefined();
      expect(result.current.current.cacheHitRate).not.toBeNull();
      expect(result.current.current.cacheHitRate).not.toBeUndefined();
    });

    it('should handle invalid raw data gracefully', () => {
      const invalidDataCases = [
        null,
        undefined,
        {},
        { invalid: 'data' },
        { infrastructure: null },
        { infrastructure: { cache: null } }
      ];

      invalidDataCases.forEach((invalidData, index) => {
        const { result } = renderHook(() => useMetrics());

        act(() => {
          const store = useMetricsStore.getState();
          store.updateFromRaw(invalidData);
        });

        expect(result.current.current).toBeDefined();
        expect(typeof result.current.current.cacheHitRate).toBe('number');
        expect(() => {
          const cacheHitRate = useCacheHitRate();
          expect(cacheHitRate).toBeDefined();
        }).not.toThrow(`Invalid data case ${index} should not crash`);
      });
    });

    it('should prevent the original cache_hit_rate crash scenario', () => {
      // Simulate the original crash scenario: health.performance.cache_hit_rate
      const crashScenario = {
        performance: {
          // cache_hit_rate is missing - this was causing crashes
          memory_usage: 50
        }
      };

      expect(() => {
        const { result } = renderHook(() => {
          const metrics = useMetrics();
          const cacheHitRate = useCacheHitRate();
          return { metrics, cacheHitRate };
        });

        act(() => {
          const store = useMetricsStore.getState();
          store.updateFromRaw(crashScenario);
        });

        // These accesses were causing the original crashes
        const currentCacheRate = result.current.metrics.current.cacheHitRate;
        const formattedRate = result.current.cacheHitRate.formatted;
        
        expect(typeof currentCacheRate).toBe('number');
        expect(typeof formattedRate).toBe('string');
        
      }).not.toThrow('Should handle missing cache_hit_rate gracefully');
    });
  });

  describe('Integration with normalizeMetrics', () => {
    it('should properly normalize and store complex nested data', () => {
      const complexData = {
        infrastructure: {
          cache: {
            hit_rate_percent: 87.3,
            total_requests: 12450,
            hits: 10869,
            misses: 1581
          },
          performance: {
            memory_usage_mb: 1024,
            cpu_usage_percent: 42.7
          }
        },
        system_performance: {
          avg_response_time_ms: 185,
          p95_response_time_ms: 350,
          error_rate_percent: 0.8,
          uptime_percent: 99.97
        },
        model_performance: {
          ensemble_accuracy: 0.912,
          predictions_today: 3847
        }
      };

      const { result } = renderHook(() => useMetrics());

      act(() => {
        const store = useMetricsStore.getState();
        store.updateFromRaw(complexData);
      });

      const normalized = result.current.current;
      
      // Verify snake_case to camelCase conversion
      expect(normalized.cacheHitRate).toBe(87.3);
      expect(normalized.memoryUsageMb).toBe(1024);
      expect(normalized.cpuUsagePercent).toBe(42.7);
      expect(normalized.avgResponseTimeMs).toBe(185);
      expect(normalized.errorRatePercent).toBe(0.8);
      expect(normalized.uptimePercent).toBe(99.97);
      expect(normalized.ensembleAccuracy).toBe(0.912);
      expect(normalized.predictionsToday).toBe(3847);
    });
  });
});