/**
 * Tests for resilient metrics store
 */

import { act, renderHook } from '@testing-library/react';
import { useMetricsStore, useMetrics, metricsSelectors, safeMetricsAccess } from '../metricsStore';

describe('MetricsStore', () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      useMetricsStore.getState().resetMetrics();
    });
  });

  describe('initialization', () => {
    it('should initialize with safe default values', () => {
      const { result } = renderHook(() => useMetrics());
      
      expect(result.current.cacheHitRate).toBe(0);
      expect(result.current.responseTime).toBe(0);
      expect(result.current.errorRate).toBe(0);
      expect(result.current.connected).toBe(false);
      expect(result.current.isFallback).toBe(false);
      expect(result.current.metrics.cache_hit_rate).toBe(0);
    });

    it('should not crash when accessing any metric property', () => {
      const { result } = renderHook(() => useMetrics());
      const { metrics } = result.current;
      
      // Should not throw for any property access
      expect(() => {
        const _ = metrics.cache_hit_rate;
        const __ = metrics.response_time_avg;
        const ___ = metrics.websocket_connected;
        const ____ = metrics.predictions_accuracy;
      }).not.toThrow();
    });
  });

  describe('updateMetrics', () => {
    it('should merge partial metrics updates', () => {
      const { result } = renderHook(() => useMetrics());
      
      act(() => {
        result.current.updateMetrics({
          cache_hit_rate: 85.5,
          response_time_avg: 250
        });
      });
      
      expect(result.current.cacheHitRate).toBe(85.5);
      expect(result.current.responseTime).toBe(250);
      expect(result.current.metrics.error_rate).toBe(0); // Should keep default
    });

    it('should update timestamp on metrics update', () => {
      const { result } = renderHook(() => useMetrics());
      const originalTimestamp = result.current.metrics.last_updated;
      
      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        act(() => {
          result.current.updateMetrics({ cache_hit_rate: 90 });
        });
        
        expect(result.current.metrics.last_updated).not.toBe(originalTimestamp);
      }, 10);
    });

    it('should clear error on successful update', () => {
      const { result } = renderHook(() => useMetrics());
      
      act(() => {
        result.current.setError('Test error');
      });
      expect(result.current.error).toBe('Test error');
      
      act(() => {
        result.current.updateMetrics({ cache_hit_rate: 75 });
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('connection status', () => {
    it('should update WebSocket connection status', () => {
      const { result } = renderHook(() => useMetrics());
      
      act(() => {
        result.current.setConnectionStatus(true);
      });
      
      expect(result.current.connected).toBe(true);
      expect(result.current.metrics.websocket_connected).toBe(true);
    });

    it('should update real-time status based on connection and fallback', () => {
      const { result } = renderHook(() => useMetrics());
      
      // Connected but not in fallback
      act(() => {
        result.current.setConnectionStatus(true);
        result.current.setFallbackMode(false);
      });
      expect(result.current.isRealTime).toBe(true);
      
      // Connected but in fallback
      act(() => {
        result.current.setFallbackMode(true);
      });
      expect(result.current.isRealTime).toBe(false);
      
      // Not connected
      act(() => {
        result.current.setConnectionStatus(false);
        result.current.setFallbackMode(false);
      });
      expect(result.current.isRealTime).toBe(false);
    });
  });

  describe('selectors', () => {
    it('should provide safe metric access', () => {
      const state = useMetricsStore.getState();
      
      expect(metricsSelectors.cacheHitRate(state)).toBe(0);
      expect(metricsSelectors.responseTime(state)).toBe(0);
      expect(metricsSelectors.errorRate(state)).toBe(0);
      expect(metricsSelectors.isConnected(state)).toBe(false);
    });

    it('should calculate success rate correctly', () => {
      const { result } = renderHook(() => useMetrics());
      
      // No requests - should default to 100%
      expect(result.current.successRate).toBe(100);
      
      act(() => {
        result.current.updateMetrics({
          successful_requests: 80,
          failed_requests: 20
        });
      });
      
      expect(result.current.successRate).toBe(80);
    });

    it('should determine health status', () => {
      const { result } = renderHook(() => useMetrics());
      
      // Default should be healthy
      expect(result.current.isHealthy).toBe(true);
      
      // High error rate should be unhealthy
      act(() => {
        result.current.updateMetrics({ error_rate: 10 });
      });
      expect(result.current.isHealthy).toBe(false);
      
      // High response time should be unhealthy
      act(() => {
        result.current.updateMetrics({ 
          error_rate: 2,
          response_time_avg: 2000 
        });
      });
      expect(result.current.isHealthy).toBe(false);
    });

    it('should detect stale data', () => {
      const { result } = renderHook(() => useMetrics());
      
      // Fresh data should not be stale
      expect(result.current.isStale).toBe(false);
      
      // Old timestamp should be stale
      act(() => {
        useMetricsStore.setState({
          metrics: {
            ...useMetricsStore.getState().metrics,
            last_updated: new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 minutes ago
          }
        });
      });
      
      expect(result.current.isStale).toBe(true);
    });
  });

  describe('safeMetricsAccess utility', () => {
    it('should return actual value when available', () => {
      const metrics = { cache_hit_rate: 85.5 } as any;
      const result = safeMetricsAccess(metrics, 'cache_hit_rate', 0);
      expect(result).toBe(85.5);
    });

    it('should return fallback when value is undefined', () => {
      const metrics = {} as any;
      const result = safeMetricsAccess(metrics, 'cache_hit_rate', 0);
      expect(result).toBe(0);
    });

    it('should return fallback when value is null', () => {
      const metrics = { cache_hit_rate: null } as any;
      const result = safeMetricsAccess(metrics, 'cache_hit_rate', 0);
      expect(result).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle error state properly', () => {
      const { result } = renderHook(() => useMetrics());
      
      act(() => {
        result.current.setError('Connection failed');
      });
      
      expect(result.current.error).toBe('Connection failed');
      expect(result.current.loading).toBe(false);
    });

    it('should reset to defaults', () => {
      const { result } = renderHook(() => useMetrics());
      
      // Set some state
      act(() => {
        result.current.updateMetrics({ cache_hit_rate: 90 });
        result.current.setConnectionStatus(true);
        result.current.setError('Test error');
      });
      
      // Reset
      act(() => {
        useMetricsStore.getState().resetMetrics();
      });
      
      expect(result.current.cacheHitRate).toBe(0);
      expect(result.current.connected).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('real-world scenarios', () => {
    it('should handle missing server data gracefully', () => {
      // Simulate component trying to access metrics before any data arrives
      const { result } = renderHook(() => {
        const metrics = useMetrics();
        
        // These should not crash even with no server data
        const displayValue = `Cache: ${metrics.cacheHitRate.toFixed(1)}%`;
        const healthStatus = metrics.isHealthy ? 'Healthy' : 'Degraded';
        
        return { displayValue, healthStatus, metrics };
      });
      
      expect(result.current.displayValue).toBe('Cache: 0.0%');
      expect(result.current.healthStatus).toBe('Healthy');
      expect(() => {
        const _ = result.current.metrics.cacheHitRate.toFixed(2);
      }).not.toThrow();
    });

    it('should handle partial server updates', () => {
      const { result } = renderHook(() => useMetrics());
      
      // Simulate server sending only some metrics
      act(() => {
        result.current.updateMetrics({
          cache_hit_rate: 92.3
          // Other metrics not provided
        });
      });
      
      expect(result.current.cacheHitRate).toBe(92.3);
      expect(result.current.responseTime).toBe(0); // Should keep default
      expect(result.current.errorRate).toBe(0); // Should keep default
    });
  });
});