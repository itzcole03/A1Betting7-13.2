import { useState, useEffect, useCallback, useMemo, useDeferredValue, useTransition } from 'react';

interface PerformanceConfig {
  enableVirtualization?: boolean;
  enableCaching?: boolean;
  enableDeferredUpdates?: boolean;
  debounceMs?: number;
  maxRetries?: number;
}

interface PerformanceMetrics {
  renderTime: number;
  dataFetchTime: number;
  cacheHitRate: number;
  errorRate: number;
  totalRequests: number;
}

interface OptimizedState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  cached: boolean;
  lastUpdated: Date | null;
}

export function useOptimizedPerformance<T>(
  fetchFn: () => Promise<T>,
  config: PerformanceConfig = {}
) {
  const {
    enableCaching = true,
    enableDeferredUpdates = true,
    debounceMs = 300,
    maxRetries = 3
  } = config;

  // React 19 concurrent features
  const [isPending, startTransitionHook] = useTransition();
  
  // State management
  const [state, setState] = useState<OptimizedState<T>>({
    data: null,
    loading: false,
    error: null,
    cached: false,
    lastUpdated: null
  });

  // Performance metrics
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    dataFetchTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
    totalRequests: 0
  });

  // Memory cache for performance
  const cache = useMemo(() => new Map<string, { data: T; timestamp: number }>(), []);

  // Deferred value for React 19 optimization
  const deferredData = useDeferredValue(state.data);

  // Optimized fetch function with caching and error handling
  const optimizedFetch = useCallback(async (useCache = enableCaching) => {
    const startTime = performance.now();
    const cacheKey = 'fetch-data'; // Stable cache key

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Check cache first if enabled
      if (useCache && cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)!;
        const isStale = Date.now() - cached.timestamp > 5 * 60 * 1000; // 5 minutes

        if (!isStale) {
          const fetchTime = performance.now() - startTime;
          
          if (enableDeferredUpdates) {
            startTransitionHook(() => {
              setState({
                data: cached.data,
                loading: false,
                error: null,
                cached: true,
                lastUpdated: new Date(cached.timestamp)
              });
            });
          } else {
            setState({
              data: cached.data,
              loading: false,
              error: null,
              cached: true,
              lastUpdated: new Date(cached.timestamp)
            });
          }

          // Update metrics
          setMetrics(prev => ({
            ...prev,
            dataFetchTime: fetchTime,
            cacheHitRate: (prev.cacheHitRate * prev.totalRequests + 100) / (prev.totalRequests + 1),
            totalRequests: prev.totalRequests + 1
          }));

          return cached.data;
        }
      }

      // Fetch fresh data
      const data = await fetchFn();
      const fetchTime = performance.now() - startTime;

      // Cache the result
      if (enableCaching) {
        cache.set(cacheKey, { data, timestamp: Date.now() });
      }

      // Update state with transition for React 19 optimization
      if (enableDeferredUpdates) {
        startTransitionHook(() => {
          setState({
            data,
            loading: false,
            error: null,
            cached: false,
            lastUpdated: new Date()
          });
        });
      } else {
        setState({
          data,
          loading: false,
          error: null,
          cached: false,
          lastUpdated: new Date()
        });
      }

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        dataFetchTime: fetchTime,
        cacheHitRate: useCache && cache.has(cacheKey) 
          ? prev.cacheHitRate 
          : (prev.cacheHitRate * prev.totalRequests) / (prev.totalRequests + 1),
        totalRequests: prev.totalRequests + 1
      }));

      return data;

    } catch (error) {
      const fetchTime = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        cached: false
      }));

      // Update error metrics
      setMetrics(prev => ({
        ...prev,
        dataFetchTime: fetchTime,
        errorRate: (prev.errorRate * prev.totalRequests + 100) / (prev.totalRequests + 1),
        totalRequests: prev.totalRequests + 1
      }));

      throw error;
    }
  }, [enableCaching, enableDeferredUpdates, cache, fetchFn]);

  // Debounced refetch for performance
  const debouncedRefetch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return (useCache = enableCaching) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        optimizedFetch(useCache);
      }, debounceMs);
    };
  }, [optimizedFetch, debounceMs, enableCaching]);

  // Retry mechanism with exponential backoff
  const retryFetch = useCallback(async (retryCount = 0) => {
    try {
      return await optimizedFetch(false); // Don't use cache on retry
    } catch (error) {
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryFetch(retryCount + 1);
      }
      throw error;
    }
  }, [optimizedFetch, maxRetries]);

  // Clear cache function
  const clearCache = useCallback(() => {
    cache.clear();
  }, [cache]);

  // Prefetch function for performance optimization
  const prefetch = useCallback(() => {
    // Don't set loading state for prefetch
    optimizedFetch(enableCaching).catch(() => {
      // Silently fail prefetch
    });
  }, [optimizedFetch, enableCaching]);

  // Initial fetch - use a flag to prevent multiple calls
  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
      optimizedFetch().catch(() => {
        // Handle error silently for initial fetch
      });
    }
  }, [hasInitialized, optimizedFetch]);

  return {
    // State
    data: enableDeferredUpdates ? deferredData : state.data,
    loading: state.loading || isPending,
    error: state.error,
    cached: state.cached,
    lastUpdated: state.lastUpdated,
    
    // Actions
    refetch: optimizedFetch,
    debouncedRefetch,
    retryFetch,
    clearCache,
    prefetch,
    
    // Performance
    metrics,
    
    // React 19 features
    isPending,
    startTransition: startTransitionHook
  };
}

// Hook for optimized list rendering with virtualization
export function useOptimizedList<T>(
  items: T[],
  config: { itemHeight?: number; overscan?: number; enableVirtualization?: boolean } = {}
) {
  const { itemHeight = 50, overscan = 5, enableVirtualization = true } = config;
  
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);

  // Deferred value for smooth scrolling
  const deferredScrollTop = useDeferredValue(scrollTop);
  
  // Calculate visible range for virtualization
  const visibleRange = useMemo(() => {
    if (!enableVirtualization) {
      return { start: 0, end: items.length };
    }

    const start = Math.max(0, Math.floor(deferredScrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);
    
    return { start, end };
  }, [deferredScrollTop, containerHeight, itemHeight, overscan, items.length, enableVirtualization]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: index + visibleRange.start,
      style: enableVirtualization ? {
        position: 'absolute' as const,
        top: (index + visibleRange.start) * itemHeight,
        height: itemHeight,
        width: '100%'
      } : undefined
    }));
  }, [items, visibleRange, itemHeight, enableVirtualization]);

  // Container props for virtualization
  const containerProps = useMemo(() => ({
    style: enableVirtualization ? {
      height: containerHeight,
      overflow: 'auto' as const,
      position: 'relative' as const
    } : undefined,
    onScroll: enableVirtualization ? (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    } : undefined
  }), [containerHeight, enableVirtualization]);

  // Inner container props for total height
  const innerProps = useMemo(() => ({
    style: enableVirtualization ? {
      height: items.length * itemHeight,
      position: 'relative' as const
    } : undefined
  }), [items.length, itemHeight, enableVirtualization]);

  return {
    visibleItems,
    containerProps,
    innerProps,
    setContainerHeight,
    totalItems: items.length,
    visibleCount: visibleRange.end - visibleRange.start
  };
}

// Hook for optimized data synchronization
export function useOptimizedSync<T>(
  key: string,
  fetchFn: () => Promise<T>,
  interval = 30000 // 30 seconds default
) {
  const {
    data,
    loading,
    error,
    refetch,
    metrics,
    cached
  } = useOptimizedPerformance(fetchFn, {
    enableCaching: true,
    enableDeferredUpdates: true
  });

  // Auto-sync with interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetch(false); // Force fresh fetch
    }, interval);

    return () => clearInterval(intervalId);
  }, [refetch, interval]);

  // Sync on page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetch]);

  return {
    data,
    loading,
    error,
    refetch,
    metrics,
    cached,
    lastSync: data ? new Date() : null
  };
}
