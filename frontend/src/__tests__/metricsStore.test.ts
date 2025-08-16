/**
 * Tests for metricsStore
 * 
 * Comprehensive test coverage for metrics store defaults,
 * safe access patterns, and error handling.
 */

import { act, renderHook } from '@testing-library/react';
import { useMetricsStore } from '../store/metricsStore';

describe('metricsStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useMetricsStore.getState().resetMetrics();
  });

  describe('Default State', () => {
    it('should have safe default metrics values', () => {
      const { result } = renderHook(() => useMetricsStore());
      const { metrics } = result.current;
      
      expect(metrics.cache_hit_rate).toBe(0);
      expect(metrics.response_time_avg).toBe(0);
      expect(metrics.error_rate).toBe(0);
      expect(metrics.requests_per_second).toBe(0);
      expect(metrics.websocket_connected).toBe(false);
      expect(metrics.predictions_accuracy).toBe(0);
      expect(metrics.cpu_usage_percent).toBe(0);
      expect(metrics.memory_usage_mb).toBe(0);
    });

    it('should initialize store with correct state', () => {
      const { result } = renderHook(() => useMetricsStore());
      
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.connected).toBe(false);
      expect(result.current.fallback_mode).toBe(false);
    });

    it('should provide safe access to all metric properties without throwing', () => {
      const { result } = renderHook(() => useMetricsStore());
      const { metrics } = result.current;
      
      expect(() => {
        // Test cache metrics
        const cacheHitRate = metrics.cache_hit_rate;
        const cacheSize = metrics.cache_size;
        
        // Test performance metrics
        const responseTime = metrics.response_time_avg;
        const responseTimeP95 = metrics.response_time_p95;
        
        // Test request metrics
        const requestsPerSecond = metrics.requests_per_second;
        const errorRate = metrics.error_rate;
        
        // Test WebSocket metrics
        const wsConnected = metrics.websocket_connected;
        const wsReconnects = metrics.websocket_reconnects;
        
        // Test application metrics
        const cpuUsage = metrics.cpu_usage_percent;
        const memoryUsage = metrics.memory_usage_mb;
        
        // Test business metrics
        const predictionsAccuracy = metrics.predictions_accuracy;
        const betsPlaced = metrics.bets_placed;
        
        // Should not throw
        return [
          cacheHitRate,
          cacheSize,
          responseTime,
          responseTimeP95,
          requestsPerSecond,
          errorRate,
          wsConnected,
          wsReconnects,
          cpuUsage,
          memoryUsage,
          predictionsAccuracy,
          betsPlaced
        ];
      }).not.toThrow();
    });
  });

  describe('Store Updates', () => {
    it('should update individual metrics using updateMetrics', () => {
      const { result } = renderHook(() => useMetricsStore());
      
      act(() => {
        useMetricsStore.getState().updateMetrics({
          cache_hit_rate: 85,
          response_time_avg: 120
        });
      });
      
      expect(result.current.metrics.cache_hit_rate).toBe(85);
      expect(result.current.metrics.response_time_avg).toBe(120);
      // Other metrics should remain at defaults
      expect(result.current.metrics.error_rate).toBe(0);
    });

    it('should handle partial updates gracefully', () => {
      const { result } = renderHook(() => useMetricsStore());
      
      // Set initial state
      act(() => {
        useMetricsStore.getState().updateMetrics({
          cache_hit_rate: 50,
          response_time_avg: 100
        });
      });
      
      // Partial update
      act(() => {
        useMetricsStore.getState().updateMetrics({
          cache_hit_rate: 75
        });
      });
      
      expect(result.current.metrics.cache_hit_rate).toBe(75);
      expect(result.current.metrics.response_time_avg).toBe(100); // Should remain unchanged
    });

    it('should update loading state', () => {
      const { result } = renderHook(() => useMetricsStore());
      
      act(() => {
        useMetricsStore.getState().setLoading(true);
      });
      
      expect(result.current.loading).toBe(true);
      
      act(() => {
        useMetricsStore.getState().setLoading(false);
      });
      
      expect(result.current.loading).toBe(false);
    });

    it('should update error state', () => {
      const { result } = renderHook(() => useMetricsStore());
      
      const errorMessage = 'Failed to fetch metrics';
      
      act(() => {
        useMetricsStore.getState().setError(errorMessage);
      });
      
      expect(result.current.error).toBe(errorMessage);
      
      act(() => {
        useMetricsStore.getState().setError(null);
      });
      
      expect(result.current.error).toBe(null);
    });

    it('should update connection status', () => {
      const { result } = renderHook(() => useMetricsStore());
      
      act(() => {
        useMetricsStore.getState().setConnectionStatus(true);
      });
      
      expect(result.current.connected).toBe(true);
      
      act(() => {
        useMetricsStore.getState().setConnectionStatus(false);
      });
      
      expect(result.current.connected).toBe(false);
    });

    it('should handle fallback mode', () => {
      const { result } = renderHook(() => useMetricsStore());
      
      act(() => {
        useMetricsStore.getState().setFallbackMode(true);
      });
      
      expect(result.current.fallback_mode).toBe(true);
      
      act(() => {
        useMetricsStore.getState().setFallbackMode(false);
      });
      
      expect(result.current.fallback_mode).toBe(false);
    });
  });

  describe('Error Prevention', () => {
    it('should prevent TypeError on cache_hit_rate access', () => {
      const { result } = renderHook(() => useMetricsStore());
      
      // This should not throw even during initial state
      expect(() => {
        const rate = result.current.metrics.cache_hit_rate;
        const percentage = `${rate}%`;
        return percentage;
      }).not.toThrow();
      
      // Result should be valid
      const rate = result.current.metrics.cache_hit_rate;
      expect(typeof rate).toBe('number');
      expect(`${rate}%`).toBe('0%');
    });

    it('should handle undefined/null values in updates', () => {
      const { result } = renderHook(() => useMetricsStore());
      
      act(() => {
        useMetricsStore.getState().updateMetrics({
          cache_hit_rate: undefined as any,
          response_time_avg: null as any,
          error_rate: 5
        });
      });
      
      // Should not crash and should handle undefined/null gracefully
      expect(result.current.metrics.error_rate).toBe(5);
      expect(typeof result.current.metrics.cache_hit_rate).toBe('number');
      expect(typeof result.current.metrics.response_time_avg).toBe('number');
    });

    it('should handle edge case metric values', () => {
      const { result } = renderHook(() => useMetricsStore());
      
      act(() => {
        useMetricsStore.getState().updateMetrics({
          cache_hit_rate: -1,
          response_time_avg: Infinity,
          error_rate: NaN,
          requests_per_second: -100,
          cpu_usage_percent: 150,
          memory_usage_mb: -50
        });
      });
      
      // Should not crash when accessing these values
      expect(() => {
        const metrics = result.current.metrics;
        Object.values(metrics).forEach(value => {
          const stringValue = String(value);
          return stringValue;
        });
      }).not.toThrow();
    });
  });

  describe('State Persistence and Updates', () => {
    it('should maintain state consistency across multiple updates', () => {
      const { result } = renderHook(() => useMetricsStore());
      
      const updates = [
        { cache_hit_rate: 10 },
        { response_time_avg: 50 },
        { error_rate: 1 },
        { cache_hit_rate: 20, response_time_avg: 75 }
      ];
      
      updates.forEach(update => {
        act(() => {
          useMetricsStore.getState().updateMetrics(update);
        });
      });
      
      // Final state should reflect all updates
      expect(result.current.metrics.cache_hit_rate).toBe(20);
      expect(result.current.metrics.response_time_avg).toBe(75);
      expect(result.current.metrics.error_rate).toBe(1);
    });

    it('should update timestamp on metrics updates', () => {
      const { result } = renderHook(() => useMetricsStore());
      
      const initialTimestamp = result.current.metrics.last_updated;
      
      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        act(() => {
          useMetricsStore.getState().updateMetrics({
            cache_hit_rate: 50
          });
        });
        
        expect(result.current.metrics.last_updated).not.toBe(initialTimestamp);
      }, 10);
    });

    it('should set is_real_time based on connection status', () => {
      const { result } = renderHook(() => useMetricsStore());
      
      // Connected mode should set is_real_time to true
      act(() => {
        useMetricsStore.getState().setConnectionStatus(true);
        useMetricsStore.getState().setFallbackMode(false);
        useMetricsStore.getState().updateMetrics({
          cache_hit_rate: 85
        });
      });
      
      expect(result.current.metrics.is_real_time).toBe(true);
      
      // Fallback mode should set is_real_time to false
      act(() => {
        useMetricsStore.getState().setFallbackMode(true);
        useMetricsStore.getState().updateMetrics({
          cache_hit_rate: 90
        });
      });
      
      expect(result.current.metrics.is_real_time).toBe(false);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset metrics to defaults', () => {
      const { result } = renderHook(() => useMetricsStore());
      
      // Set some non-default values
      act(() => {
        useMetricsStore.getState().updateMetrics({
          cache_hit_rate: 85,
          response_time_avg: 150,
          error_rate: 5
        });
        useMetricsStore.getState().setLoading(true);
        useMetricsStore.getState().setError('Test error');
      });
      
      // Verify values are set
      expect(result.current.metrics.cache_hit_rate).toBe(85);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe('Test error');
      
      // Reset
      act(() => {
        useMetricsStore.getState().resetMetrics();
      });
      
      // Verify reset to defaults
      expect(result.current.metrics.cache_hit_rate).toBe(0);
      expect(result.current.metrics.response_time_avg).toBe(0);
      expect(result.current.metrics.error_rate).toBe(0);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.connected).toBe(false);
      expect(result.current.fallback_mode).toBe(false);
    });
  });

  describe('Component Integration', () => {
    it('should trigger re-renders when metrics change', () => {
      let renderCount = 0;
      
      const TestComponent = () => {
        const { metrics } = useMetricsStore();
        renderCount++;
        return metrics.cache_hit_rate;
      };
      
      const { result } = renderHook(() => TestComponent());
      const initialRenderCount = renderCount;
      
      act(() => {
        useMetricsStore.getState().updateMetrics({ cache_hit_rate: 42 });
      });
      
      expect(renderCount).toBe(initialRenderCount + 1);
      expect(result.current).toBe(42);
    });

    it('should allow selective subscriptions to avoid unnecessary re-renders', () => {
      const { result } = renderHook(() => 
        useMetricsStore(state => state.metrics.cache_hit_rate)
      );
      
      expect(result.current).toBe(0);
      
      act(() => {
        useMetricsStore.getState().updateMetrics({ cache_hit_rate: 75 });
      });
      
      expect(result.current).toBe(75);
    });
  });
});