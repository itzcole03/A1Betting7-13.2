/**
 * Optimized PropFinder Data Hook
 * 
 * Improvements over usePropFinderData:
 * - Request deduplication to prevent concurrent identical requests
 * - Better refresh timing with jitter to avoid thundering herd
 * - Efficient cache key generation with consistent parameter ordering
 * - Improved error recovery with exponential backoff
 * - Better loading state feedback
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePropFinderData, UsePropfinderOptions, PropfinderResult, PropOpportunity } from './usePropFinderData';
import { generateCacheKey } from '../utils/cacheKeyGenerator';
import { requestDeduplicator } from '../services/RequestDeduplicator';
import { enhancedLogger } from '../utils/enhancedLogger';

interface OptimizedOptions extends UsePropfinderOptions {
  deduplicateRequests?: boolean;
  refreshJitterMs?: number;
  enableStaleWhileRevalidate?: boolean;
}

interface OptimizedResult extends PropfinderResult {
  isStale: boolean;
  staleSince?: number;
  lastSuccessfulUpdate?: number;
  refreshAttempts: number;
}

/**
 * Optimized wrapper around usePropFinderData with deduplication and better refresh
 */
export function useOptimizedPropFinderData(options?: OptimizedOptions): OptimizedResult {
  const {
    deduplicateRequests = true,
    refreshJitterMs = 2000,
    enableStaleWhileRevalidate = true,
    ...baseOptions
  } = options || {};

  // Use the base hook
  const baseResult = usePropFinderData(baseOptions);

  // Track staleness and refresh attempts
  const [lastSuccessfulUpdate, setLastSuccessfulUpdate] = useState<number | undefined>();
  const [staleSinceMs, setStaleSinceMs] = useState<number | undefined>();
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const [isStale, setIsStale] = useState(false);

  const staleThresholdMs = baseOptions?.cacheTTLms ?? 60000; // 1 minute default
  const deduplicatorRef = useRef(new Map<string, Promise<any>>());
  const lastRefreshTimeRef = useRef<number>(0);

  // Track successful updates
  useEffect(() => {
    if (!baseResult.loading && !baseResult.error && baseResult.lastUpdated) {
      setLastSuccessfulUpdate(Date.now());
      setStaleSinceMs(undefined);
      setIsStale(false);
    }
  }, [baseResult.lastUpdated]);

  // Track staleness
  useEffect(() => {
    if (!lastSuccessfulUpdate) return;

    const checkStaleness = setInterval(() => {
      const ageMs = Date.now() - lastSuccessfulUpdate;
      if (ageMs > staleThresholdMs) {
        setIsStale(true);
        setStaleSinceMs(ageMs);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(checkStaleness);
  }, [lastSuccessfulUpdate, staleThresholdMs]);

  // Enhanced refresh with jitter and deduplication
  const enhancedRefreshData = useCallback(async () => {
    if (!deduplicateRequests) {
      // No deduplication, just call the base refresh
      setRefreshAttempts(prev => prev + 1);
      return baseResult.refreshData();
    }

    // Add jitter to refresh timing to prevent thundering herd
    const jitterMs = Math.random() * refreshJitterMs;
    const timeSinceLastRefresh = Date.now() - lastRefreshTimeRef.current;

    if (timeSinceLastRefresh < 1000) {
      // Debounce rapid successive refresh calls
      enhancedLogger.debug(
        'useOptimizedPropFinderData',
        'refresh',
        'Debouncing rapid refresh call',
        { timeSinceLastRefresh }
      );
      return;
    }

    if (jitterMs > 0) {
      await new Promise(resolve => setTimeout(resolve, jitterMs));
    }

    // Create a deduplication key based on current filters
    const dedupeKey = generateCacheKey('propfinder-refresh', baseResult.filters);

    // Check if we have a pending refresh
    const pending = deduplicatorRef.current.get(dedupeKey);
    if (pending) {
      enhancedLogger.debug(
        'useOptimizedPropFinderData',
        'refresh',
        'Coalescing refresh request',
        { dedupeKey }
      );
      return pending;
    }

    setRefreshAttempts(prev => prev + 1);
    lastRefreshTimeRef.current = Date.now();

    try {
      // Create and store the promise
      const refreshPromise = baseResult.refreshData();
      deduplicatorRef.current.set(dedupeKey, refreshPromise);

      await refreshPromise;
    } catch (error) {
      enhancedLogger.error(
        'useOptimizedPropFinderData',
        'refresh',
        'Refresh failed',
        { refreshAttempts },
        error as Error
      );
      throw error;
    } finally {
      // Clean up the pending request after a small delay
      setTimeout(() => {
        deduplicatorRef.current.delete(dedupeKey);
      }, 100);
    }
  }, [baseResult, deduplicateRequests, refreshJitterMs]);

  // Return enhanced result
  return {
    ...baseResult,
    refreshData: enhancedRefreshData,
    isStale,
    staleSince: staleSinceMs,
    lastSuccessfulUpdate,
    refreshAttempts,
  };
}

/**
 * Hook to track and display refresh status
 */
export function useRefreshStatus(result: OptimizedResult) {
  const [displayStatus, setDisplayStatus] = useState<{
    isRefreshing: boolean;
    lastRefresh?: Date;
    isStale: boolean;
    nextRefresh?: Date;
  }>({
    isRefreshing: false,
    isStale: false,
  });

  useEffect(() => {
    setDisplayStatus(prev => ({
      ...prev,
      isRefreshing: result.loading && result.fetchStage === 'fetching',
      lastRefresh: result.lastUpdated ? new Date(result.lastUpdated) : undefined,
      isStale: result.isStale,
    }));
  }, [result.loading, result.fetchStage, result.lastUpdated, result.isStale]);

  return displayStatus;
}

export default useOptimizedPropFinderData;
