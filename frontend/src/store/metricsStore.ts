/**
 * Resilient Metrics Store
 * 
 * Provides safe defaults for all metrics to prevent TypeError crashes
 * when accessing properties before real-time data is available.
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

export interface MetricsData {
  // Cache metrics
  cache_hit_rate: number;
  cache_size: number;
  cache_evictions: number;
  
  // Performance metrics
  response_time_avg: number;
  response_time_p95: number;
  response_time_p99: number;
  
  // Request metrics
  requests_per_second: number;
  successful_requests: number;
  failed_requests: number;
  error_rate: number;
  
  // WebSocket metrics
  websocket_connected: boolean;
  websocket_reconnects: number;
  websocket_message_rate: number;
  websocket_uptime_seconds: number;
  
  // Application metrics
  active_users: number;
  active_sessions: number;
  cpu_usage_percent: number;
  memory_usage_mb: number;
  
  // Business metrics
  predictions_generated: number;
  predictions_accuracy: number;
  bets_placed: number;
  total_revenue: number;
  
  // Timestamp for data freshness
  last_updated: string;
  is_real_time: boolean;
}

export interface MetricsState {
  // Current metrics data
  metrics: MetricsData;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Connection status
  connected: boolean;
  fallback_mode: boolean;
  
  // Actions
  updateMetrics: (partial: Partial<MetricsData>) => void;
  setFullMetrics: (metrics: MetricsData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setConnectionStatus: (connected: boolean) => void;
  setFallbackMode: (fallback: boolean) => void;
  resetMetrics: () => void;
}

// Safe default values to prevent undefined access errors
const defaultMetrics: MetricsData = {
  // Cache metrics - safe defaults
  cache_hit_rate: 0,
  cache_size: 0,
  cache_evictions: 0,
  
  // Performance metrics
  response_time_avg: 0,
  response_time_p95: 0,
  response_time_p99: 0,
  
  // Request metrics
  requests_per_second: 0,
  successful_requests: 0,
  failed_requests: 0,
  error_rate: 0,
  
  // WebSocket metrics
  websocket_connected: false,
  websocket_reconnects: 0,
  websocket_message_rate: 0,
  websocket_uptime_seconds: 0,
  
  // Application metrics
  active_users: 0,
  active_sessions: 0,
  cpu_usage_percent: 0,
  memory_usage_mb: 0,
  
  // Business metrics
  predictions_generated: 0,
  predictions_accuracy: 0,
  bets_placed: 0,
  total_revenue: 0,
  
  // Metadata
  last_updated: new Date().toISOString(),
  is_real_time: false
};

export const useMetricsStore = create<MetricsState>()(
  devtools(
    subscribeWithSelector(
      (set, get) => ({
        // Initial state with safe defaults
        metrics: defaultMetrics,
        loading: false,
        error: null,
        connected: false,
        fallback_mode: false,

        // Update metrics with partial data (merge semantics)
        updateMetrics: (partial: Partial<MetricsData>) => {
          const currentMetrics = get().metrics;
          const updatedMetrics = {
            ...currentMetrics,
            ...partial,
            last_updated: new Date().toISOString(),
            is_real_time: get().connected && !get().fallback_mode
          };

          set(
            { 
              metrics: updatedMetrics,
              error: null // Clear error on successful update
            },
            false,
            'updateMetrics'
          );
        },

        // Replace all metrics (full replacement)
        setFullMetrics: (metrics: MetricsData) => {
          set(
            { 
              metrics: {
                ...metrics,
                last_updated: new Date().toISOString(),
                is_real_time: get().connected && !get().fallback_mode
              },
              error: null
            },
            false,
            'setFullMetrics'
          );
        },

        // Loading state management
        setLoading: (loading: boolean) => {
          set({ loading }, false, 'setLoading');
        },

        // Error state management
        setError: (error: string | null) => {
          set({ error, loading: false }, false, 'setError');
        },

        // Connection status
        setConnectionStatus: (connected: boolean) => {
          set(
            { 
              connected,
              metrics: {
                ...get().metrics,
                websocket_connected: connected,
                is_real_time: connected && !get().fallback_mode
              }
            },
            false,
            'setConnectionStatus'
          );
        },

        // Fallback mode
        setFallbackMode: (fallback: boolean) => {
          set(
            { 
              fallback_mode: fallback,
              metrics: {
                ...get().metrics,
                is_real_time: get().connected && !fallback
              }
            },
            false,
            'setFallbackMode'
          );
        },

        // Reset to defaults
        resetMetrics: () => {
          set(
            {
              metrics: defaultMetrics,
              loading: false,
              error: null,
              connected: false,
              fallback_mode: false
            },
            false,
            'resetMetrics'
          );
        }
      })
    ),
    {
      name: 'MetricsStore'
    }
  )
);

// Selector helpers for optimized component access
export const metricsSelectors = {
  // Safe metrics access (always returns valid numbers)
  cacheHitRate: (state: MetricsState) => state.metrics.cache_hit_rate ?? 0,
  responseTime: (state: MetricsState) => state.metrics.response_time_avg ?? 0,
  errorRate: (state: MetricsState) => state.metrics.error_rate ?? 0,
  
  // Connection status
  isConnected: (state: MetricsState) => state.connected,
  isRealTime: (state: MetricsState) => state.metrics.is_real_time,
  isFallback: (state: MetricsState) => state.fallback_mode,
  
  // Data freshness
  lastUpdated: (state: MetricsState) => state.metrics.last_updated,
  isStale: (state: MetricsState) => {
    const lastUpdate = new Date(state.metrics.last_updated);
    const now = new Date();
    const ageMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    return ageMinutes > 5; // Consider stale after 5 minutes
  },
  
  // Computed metrics
  totalRequests: (state: MetricsState) => 
    (state.metrics.successful_requests ?? 0) + (state.metrics.failed_requests ?? 0),
  
  successRate: (state: MetricsState) => {
    const total = (state.metrics.successful_requests ?? 0) + (state.metrics.failed_requests ?? 0);
    return total > 0 ? ((state.metrics.successful_requests ?? 0) / total) * 100 : 100;
  },
  
  // Health indicators
  isHealthy: (state: MetricsState) => {
    const errorRate = state.metrics.error_rate ?? 0;
    const responseTime = state.metrics.response_time_avg ?? 0;
    return errorRate < 5 && responseTime < 1000; // < 5% error rate, < 1s response time
  }
};

// Helper function for components to safely access metrics
export function safeMetricsAccess<K extends keyof MetricsData>(
  metrics: MetricsData,
  key: K,
  fallback: MetricsData[K]
): MetricsData[K] {
  return metrics[key] ?? fallback;
}

// Hook for easy metrics access with built-in safety
export function useMetrics() {
  const store = useMetricsStore();
  
  return {
    // Safe data access
    metrics: store.metrics,
    loading: store.loading,
    error: store.error,
    
    // Connection status
    connected: store.connected,
    isRealTime: store.metrics.is_real_time,
    isFallback: store.fallback_mode,
    
    // Actions
    updateMetrics: store.updateMetrics,
    setConnectionStatus: store.setConnectionStatus,
    setFallbackMode: store.setFallbackMode,
    setError: store.setError,
    
    // Computed values with safe defaults
    cacheHitRate: store.metrics.cache_hit_rate ?? 0,
    responseTime: store.metrics.response_time_avg ?? 0,
    errorRate: store.metrics.error_rate ?? 0,
    successRate: metricsSelectors.successRate(store),
    isHealthy: metricsSelectors.isHealthy(store),
    isStale: metricsSelectors.isStale(store)
  };
}

export default useMetricsStore;