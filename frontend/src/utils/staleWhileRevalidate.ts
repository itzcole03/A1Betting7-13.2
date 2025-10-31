/**
 * Stale-While-Revalidate Pattern Utility
 * 
 * Implements HTTP caching best practice where:
 * 1. Stale cached data is returned immediately
 * 2. Request is made in background to update cache
 * 3. Callback notified when fresh data arrives
 * 
 * Provides excellent UX: fast perceived performance + fresh data in background
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  fresh: boolean;
  etag?: string;
}

interface StaleWhileRevalidateOptions<T> {
  staleTime?: number; // How long data is considered "fresh" (ms)
  revalidateTime?: number; // How old before we must revalidate (ms)
  onUpdate?: (data: T) => void; // Called when fresh data arrives
  onError?: (error: Error) => void; // Called if revalidation fails
  debug?: boolean;
}

export class StaleWhileRevalidateCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private pendingRequests: Map<string, Promise<T>> = new Map();
  private options: Required<StaleWhileRevalidateOptions<T>>;

  constructor(options: StaleWhileRevalidateOptions<T> = {}) {
    this.options = {
      staleTime: options.staleTime ?? 60000, // 1 minute default
      revalidateTime: options.revalidateTime ?? 300000, // 5 minutes
      onUpdate: options.onUpdate ?? (() => {}),
      onError: options.onError ?? (() => {}),
      debug: options.debug ?? false,
    };
  }

  /**
   * Get data with stale-while-revalidate semantics
   */
  async get<R extends T>(
    key: string,
    fetcher: () => Promise<R>
  ): Promise<{ data: R | T; isStale: boolean; isFresh: boolean }> {
    const cached = this.cache.get(key);
    const now = Date.now();

    // Return stale cache immediately if available
    if (cached) {
      const age = now - cached.timestamp;
      const isStale = age > this.options.staleTime;
      const isFresh = age < this.options.staleTime;

      if (this.options.debug) {
        // eslint-disable-next-line no-console
        console.debug(
          `[SWR] Cache hit for ${key} (age: ${age}ms, stale: ${isStale}, fresh: ${isFresh})`
        );
      }

      // If fresh, return it and skip revalidation
      if (isFresh) {
        return { data: cached.data, isStale: false, isFresh: true };
      }

      // If stale but not too old, return stale data and revalidate in background
      const revalidateThreshold = cached.timestamp + this.options.revalidateTime;
      if (now < revalidateThreshold) {
        // Return stale data immediately
        if (this.options.debug) {
          // eslint-disable-next-line no-console
          console.debug(`[SWR] Returning stale cache for ${key}, revalidating in background`);
        }

        // Trigger revalidation in background
        this.revalidate(key, fetcher);

        return { data: cached.data, isStale: true, isFresh: false };
      }
    }

    // No cache or too stale - fetch fresh data
    return this.fetchAndCache(key, fetcher);
  }

  /**
   * Set cache entry explicitly
   */
  set(key: string, data: T, options: { etag?: string } = {}): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      fresh: true,
      etag: options.etag,
    });

    if (this.options.debug) {
      // eslint-disable-next-line no-console
      console.debug(`[SWR] Cache set for ${key}`);
    }
  }

  /**
   * Get ETag for conditional requests
   */
  getETag(key: string): string | undefined {
    return this.cache.get(key)?.etag;
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    if (this.options.debug) {
      // eslint-disable-next-line no-console
      console.debug(`[SWR] Cache invalidated for ${key}`);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    if (this.options.debug) {
      // eslint-disable-next-line no-console
      console.debug(`[SWR] Cache cleared`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.cache.size;
    const staleCount = Array.from(this.cache.values()).filter(
      entry => Date.now() - entry.timestamp > this.options.staleTime
    ).length;
    const freshCount = total - staleCount;

    return { total, fresh: freshCount, stale: staleCount };
  }

  // Private methods

  private async fetchAndCache<R extends T>(
    key: string,
    fetcher: () => Promise<R>
  ): Promise<{ data: R | T; isStale: boolean; isFresh: boolean }> {
    // Check if fetch is already pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      if (this.options.debug) {
        // eslint-disable-next-line no-console
        console.debug(`[SWR] Request already pending for ${key}`);
      }
      const result = await pending;
      return { data: result, isStale: false, isFresh: true };
    }

    try {
      const promise = fetcher();
      this.pendingRequests.set(key, promise);

      if (this.options.debug) {
        // eslint-disable-next-line no-console
        console.debug(`[SWR] Fetching fresh data for ${key}`);
      }

      const data = await promise;
      this.set(key, data);
      return { data, isStale: false, isFresh: true };
    } catch (error) {
      // If fetch fails and we have stale cache, return it
      const cached = this.cache.get(key);
      if (cached) {
        if (this.options.debug) {
          // eslint-disable-next-line no-console
          console.warn(
            `[SWR] Fetch failed for ${key}, returning stale cache`,
            error instanceof Error ? error.message : String(error)
          );
        }
        this.options.onError?.(error instanceof Error ? error : new Error(String(error)));
        return { data: cached.data, isStale: true, isFresh: false };
      }

      // No cache fallback, throw error
      if (this.options.debug) {
        // eslint-disable-next-line no-console
        console.error(`[SWR] Fetch failed for ${key} with no fallback`, error);
      }
      throw error;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  private async revalidate<R extends T>(key: string, fetcher: () => Promise<R>): Promise<void> {
    // Check if already pending
    if (this.pendingRequests.has(key)) {
      if (this.options.debug) {
        // eslint-disable-next-line no-console
        console.debug(`[SWR] Revalidation already pending for ${key}`);
      }
      return;
    }

    try {
      const promise = fetcher();
      this.pendingRequests.set(key, promise);

      if (this.options.debug) {
        // eslint-disable-next-line no-console
        console.debug(`[SWR] Revalidating data for ${key}`);
      }

      const data = await promise;
      this.set(key, data);

      // Notify about update
      if (this.options.onUpdate) {
        this.options.onUpdate(data);
      }

      if (this.options.debug) {
        // eslint-disable-next-line no-console
        console.debug(`[SWR] Revalidation complete for ${key}`);
      }
    } catch (error) {
      if (this.options.debug) {
        // eslint-disable-next-line no-console
        console.warn(`[SWR] Revalidation failed for ${key}`, error);
      }
      this.options.onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.pendingRequests.delete(key);
    }
  }
}

/**
 * Create a stale-while-revalidate cache for a specific data type
 */
export function createStaleWhileRevalidateCache<T>(
  options?: StaleWhileRevalidateOptions<T>
): StaleWhileRevalidateCache<T> {
  return new StaleWhileRevalidateCache(options);
}

/**
 * Hook-friendly version for React
 */
export function useStaleWhileRevalidate<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: StaleWhileRevalidateOptions<T>
) {
  const [data, setData] = React.useState<T | null>(null);
  const [isStale, setIsStale] = React.useState(false);
  const [isFresh, setIsFresh] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const cache = React.useRef(createStaleWhileRevalidateCache(options));

  React.useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const result = await cache.current.get(key, fetcher);
        if (mounted) {
          setData(result.data);
          setIsStale(result.isStale);
          setIsFresh(result.isFresh);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [key, fetcher, options]);

  return { data, isStale, isFresh, loading, error };
}

// Add React import for useStaleWhileRevalidate
import React from 'react';
