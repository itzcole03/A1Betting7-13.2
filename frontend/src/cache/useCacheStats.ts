/**
 * Cache Statistics React Hook
 * 
 * Provides comprehensive cache observability with:
 * - Automatic polling (30s dev, 60s prod) with configurable intervals
 * - Exponential backoff retry logic for failed requests
 * - Environment-aware configuration and error handling
 * - TypeScript interfaces for all cache statistics
 * - Loading and error states management
 * 
 * Usage:
 * ```typescript
 * const { data, loading, error, refetch } = useCacheStats({
 *   pollInterval: 30000, // Optional override
 *   maxRetries: 5        // Optional retry limit
 * });
 * ```
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';

// Cache statistics interfaces
export interface CacheStats {
  cache_version: string;
  total_keys: number;
  hit_count: number;
  miss_count: number;
  hit_ratio: number;
  average_get_latency_ms: number;
  total_operations: number;
  rebuild_events: number;
  stampede_preventions: number;
  namespaced_counts: Record<string, number>;
  tier_breakdown: Record<string, Record<string, number>>;
  latency_percentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
  uptime_seconds: number;
  active_locks: number;
  timestamp: string;
}

export interface NamespaceStats {
  namespace: string;
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hit_ratio: number;
  avg_latency_ms: number;
}

export interface CacheHealth {
  healthy: boolean;
  operations: Record<string, boolean>;
  stats_snapshot: Record<string, unknown>;
  error?: string;
}

// Hook configuration interface
export interface UseCacheStatsOptions {
  pollInterval?: number;      // Polling interval in milliseconds
  maxRetries?: number;        // Maximum retry attempts
  enabled?: boolean;          // Whether polling is enabled
  onError?: (error: Error) => void;  // Error callback
}

// Hook return interface
export interface UseCacheStatsResult {
  data: CacheStats | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
  retryCount: number;
}

// Default configuration
const DEFAULT_CONFIG = {
  DEV_POLL_INTERVAL: 30000,    // 30 seconds in development
  PROD_POLL_INTERVAL: 60000,   // 60 seconds in production
  MAX_RETRIES: 5,
  RETRY_BACKOFF_BASE: 1000,    // Base retry delay (1 second)
  RETRY_BACKOFF_MAX: 30000,    // Max retry delay (30 seconds)
};

// Environment detection
const isDevelopment = () => {
  return process.env.NODE_ENV === 'development' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
};

// Exponential backoff calculation
const calculateBackoffDelay = (attempt: number): number => {
  const delay = DEFAULT_CONFIG.RETRY_BACKOFF_BASE * Math.pow(2, attempt);
  const jitter = Math.random() * 0.1 * delay; // ±10% jitter
  return Math.min(delay + jitter, DEFAULT_CONFIG.RETRY_BACKOFF_MAX);
};

/**
 * Custom hook for cache statistics with polling and error handling
 */
export const useCacheStats = (options: UseCacheStatsOptions = {}): UseCacheStatsResult => {
  // Configuration with useMemo to prevent dependency changes
  const config = useMemo(() => ({
    pollInterval: options.pollInterval || (
      isDevelopment() ? DEFAULT_CONFIG.DEV_POLL_INTERVAL : DEFAULT_CONFIG.PROD_POLL_INTERVAL
    ),
    maxRetries: options.maxRetries || DEFAULT_CONFIG.MAX_RETRIES,
    enabled: options.enabled !== false,
    onError: options.onError,
  }), [options.pollInterval, options.maxRetries, options.enabled, options.onError]);

  // State management
  const [data, setData] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Refs for cleanup and polling control
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Fetch function with retry logic
  const fetchCacheStats = useCallback(async (isRetry = false): Promise<void> => {
    if (!mountedRef.current) return;

    try {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      if (!isRetry) {
        setLoading(true);
        setError(null);
      }

      // eslint-disable-next-line no-console
      console.debug('[useCacheStats] Fetching cache statistics...');

      const response = await fetch('/api/v2/meta/cache-stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Cache stats request failed: ${response.status} ${response.statusText}`);
      }

      const cacheStats: CacheStats = await response.json();

      if (!mountedRef.current) return;

      // Update state with successful response
      setData(cacheStats);
      setError(null);
      setRetryCount(0); // Reset retry count on success
      setLastUpdated(new Date());
      
      // eslint-disable-next-line no-console
      console.debug('[useCacheStats] Cache statistics updated:', {
        hit_ratio: cacheStats.hit_ratio,
        total_operations: cacheStats.total_operations,
        total_keys: cacheStats.total_keys
      });

    } catch (err) {
      if (!mountedRef.current) return;

      // Handle different error types
      const error = err as Error;
      
      // Don't treat abort as an error
      if (error.name === 'AbortError') {
        // eslint-disable-next-line no-console
        console.debug('[useCacheStats] Request aborted');
        return;
      }

      // eslint-disable-next-line no-console
      console.warn('[useCacheStats] Failed to fetch cache statistics:', error.message);
      
      setError(error);
      
      // Call error callback if provided
      if (config.onError) {
        config.onError(error);
      }

      // Implement retry logic
      if (retryCount < config.maxRetries) {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        
        const retryDelay = calculateBackoffDelay(newRetryCount);
        
        // eslint-disable-next-line no-console
        console.debug(`[useCacheStats] Retrying in ${retryDelay}ms (attempt ${newRetryCount}/${config.maxRetries})`);
        
        retryTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            fetchCacheStats(true);
          }
        }, retryDelay);
      } else {
        // eslint-disable-next-line no-console
        console.error(`[useCacheStats] Max retries (${config.maxRetries}) exceeded`);
      }
    } finally {
      if (mountedRef.current && !isRetry) {
        setLoading(false);
      }
    }
  }, [config, retryCount]);

  // Manual refetch function
  const refetch = useCallback(async (): Promise<void> => {
    setRetryCount(0); // Reset retry count for manual refetch
    await fetchCacheStats(false);
  }, [fetchCacheStats]);

  // Setup polling effect
  useEffect(() => {
    if (!config.enabled) {
      return;
    }

    // Initial fetch
    fetchCacheStats(false);

    // Setup polling
    const scheduleNextPoll = () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }

      pollTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current && config.enabled) {
          fetchCacheStats(false);
          scheduleNextPoll(); // Schedule next poll
        }
      }, config.pollInterval);
    };

    scheduleNextPoll();

    // Cleanup function
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [config.enabled, config.pollInterval, fetchCacheStats]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    lastUpdated,
    retryCount,
  };
};

/**
 * Hook for namespace-specific cache statistics
 */
export const useNamespaceCacheStats = (
  namespace: string, 
  options: UseCacheStatsOptions = {}
): UseCacheStatsResult & { namespaceData: NamespaceStats | null } => {
  const [namespaceData, setNamespaceData] = useState<NamespaceStats | null>(null);
  
  const fetchNamespaceStats = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`/api/v2/meta/cache-stats/namespace/${encodeURIComponent(namespace)}`);
      
      if (!response.ok) {
        throw new Error(`Namespace stats request failed: ${response.status}`);
      }
      
      const stats: NamespaceStats = await response.json();
      setNamespaceData(stats);
      
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[useNamespaceCacheStats] Failed to fetch stats for namespace ${namespace}:`, err);
      setNamespaceData(null);
    }
  }, [namespace]);

  // Use main cache stats hook
  const mainResult = useCacheStats({
    ...options,
    onError: (error) => {
      options.onError?.(error);
      // Also try to fetch namespace stats on error
      fetchNamespaceStats();
    },
  });

  // Fetch namespace stats when main data changes
  useEffect(() => {
    if (mainResult.data && namespace) {
      fetchNamespaceStats();
    }
  }, [mainResult.data, namespace, fetchNamespaceStats]);

  return {
    ...mainResult,
    namespaceData,
  };
};

/**
 * Hook for cache health monitoring
 */
export const useCacheHealth = (_options: UseCacheStatsOptions = {}) => {
  const [healthData, setHealthData] = useState<CacheHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCacheHealth = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/v2/meta/cache-health');
      
      if (!response.ok) {
        throw new Error(`Cache health request failed: ${response.status}`);
      }
      
      const health: CacheHealth = await response.json();
      setHealthData(health);
      setError(null);
      
    } catch (err) {
      const error = err as Error;
      setError(error);
      // eslint-disable-next-line no-console
      console.warn('[useCacheHealth] Failed to fetch cache health:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCacheHealth();
    
    // Poll health less frequently (every 2 minutes)
    const interval = setInterval(fetchCacheHealth, 120000);
    
    return () => clearInterval(interval);
  }, [fetchCacheHealth]);

  return {
    data: healthData,
    loading,
    error,
    refetch: fetchCacheHealth,
  };
};

// Export utility functions
export const formatCacheStats = {
  /**
   * Format hit ratio as percentage
   */
  hitRatio: (ratio: number): string => {
    return `${(ratio * 100).toFixed(1)}%`;
  },

  /**
   * Format latency with appropriate units
   */
  latency: (ms: number): string => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  },

  /**
   * Format uptime duration
   */
  uptime: (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  },

  /**
   * Format large numbers with appropriate units
   */
  count: (num: number): string => {
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  },
};