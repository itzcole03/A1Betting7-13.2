import { useCallback, useEffect, useRef, useState } from 'react';

// Custom debounce implementation since lodash might not be available
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;

  const debouncedFunction = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T & { cancel: () => void };

  debouncedFunction.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debouncedFunction;
}

interface DataFetchingOptions {
  debounceDelay?: number;
  cacheTime?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  maxRetries?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}

/**
 * Optimized data fetching hook with debouncing, caching, and proper cleanup
 * to prevent unnecessary re-renders and improve performance.
 */
export function useOptimizedDataFetching<T>(
  fetchFunction: () => Promise<T>,
  dependencies: readonly unknown[],
  options: DataFetchingOptions = {}
) {
  const {
    debounceDelay = 300,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    maxRetries = 3,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // Create cache key from dependencies
  const cacheKey = JSON.stringify(dependencies);

  // Check cache for existing data
  const getCachedData = useCallback(() => {
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return cached.data;
    }
    return null;
  }, [cacheKey]);

  // Store data in cache
  const setCachedData = useCallback((newData: T) => {
    cacheRef.current.set(cacheKey, {
      data: newData,
      timestamp: Date.now(),
      expires: Date.now() + cacheTime,
    });
  }, [cacheKey, cacheTime]);

  // Fetch data with proper error handling and retries
  const fetchData = useCallback(async (isRetry = false) => {
    // Check cache first
    const cachedData = getCachedData();
    if (cachedData && !isRetry) {
      setData(cachedData);
      setError(null);
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction();
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setData(result);
      setCachedData(result);
      retryCountRef.current = 0;
    } catch (err) {
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Retry logic
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.warn(`Data fetch failed, retrying (${retryCountRef.current}/${maxRetries}):`, errorMessage);
        setTimeout(() => fetchData(true), 1000 * retryCountRef.current);
        return;
      }

      setError(errorMessage);
      console.error('Data fetch failed after all retries:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, getCachedData, setCachedData, maxRetries]);

  // Debounced fetch function
  const debouncedFetch = useCallback(
    debounce(() => fetchData(), debounceDelay),
    [fetchData, debounceDelay]
  );

  // Effect to trigger data fetching when dependencies change
  useEffect(() => {
    debouncedFetch();

    // Cleanup debounced function on dependency change
    return () => {
      debouncedFetch.cancel();
    };
  }, [debouncedFetch, ...dependencies]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    intervalRef.current = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      debouncedFetch.cancel();
    };
  }, []);

  // Manual refresh function
  const refresh = useCallback(() => {
    // Clear cache for this key
    cacheRef.current.delete(cacheKey);
    fetchData();
  }, [cacheKey, fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    isStale: data ? Date.now() - (cacheRef.current.get(cacheKey)?.timestamp || 0) > cacheTime : false,
  };
}
