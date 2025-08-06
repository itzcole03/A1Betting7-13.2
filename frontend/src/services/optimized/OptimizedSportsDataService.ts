/**
 * Optimized Sports Analytics Data Service
 *
 * Centralized data fetching and caching service for sports analytics.
 * Implements intelligent caching, request deduplication, and performance optimizations.
 */

import { useCallback, useRef } from 'react';
import { FeaturedProp, fetchFeaturedProps } from '../../services/unified/FeaturedPropsService';
import { EnhancedBetsResponse } from '../../types/enhancedBetting';
import { EnhancedApiClient } from '../../utils/enhancedApiClient';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}

interface RequestDeduplicationEntry {
  promise: Promise<any>;
  timestamp: number;
}

/**
 * Optimized data fetching service with intelligent caching and request deduplication
 */
export class OptimizedSportsDataService {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, RequestDeduplicationEntry>();
  private apiClient: EnhancedApiClient;

  // Cache configuration
  private readonly CACHE_TTL = {
    PROPS: 5 * 60 * 1000, // 5 minutes for prop data
    GAMES: 10 * 60 * 1000, // 10 minutes for game data
    ANALYSIS: 15 * 60 * 1000, // 15 minutes for analysis data
    STATS: 30 * 60 * 1000, // 30 minutes for stats data
  };

  private readonly REQUEST_TIMEOUT = 10 * 1000; // 10 seconds

  constructor() {
    this.apiClient = new EnhancedApiClient();

    // Clean up expired cache entries periodically
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 60 * 1000); // Every minute

    // Clean up old pending requests
    setInterval(() => {
      this.cleanupExpiredRequests();
    }, 30 * 1000); // Every 30 seconds
  }

  /**
   * Generic cached fetch method with request deduplication
   */
  private async cachedFetch<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    ttl: number = this.CACHE_TTL.PROPS
  ): Promise<T> {
    const now = Date.now();

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && now < cached.expires) {
      console.log(`[OptimizedSportsDataService] Cache hit for ${cacheKey}`);
      return cached.data;
    }

    // Check if request is already pending (deduplication)
    const pending = this.pendingRequests.get(cacheKey);
    if (pending && now - pending.timestamp < this.REQUEST_TIMEOUT) {
      console.log(`[OptimizedSportsDataService] Request deduplication for ${cacheKey}`);
      return pending.promise;
    }

    // Create new request
    const promise = fetcher();
    this.pendingRequests.set(cacheKey, { promise, timestamp: now });

    try {
      const data = await promise;

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: now,
        expires: now + ttl,
      });

      // Remove from pending requests
      this.pendingRequests.delete(cacheKey);

      console.log(`[OptimizedSportsDataService] Cached new data for ${cacheKey}`);
      return data;
    } catch (error) {
      // Remove from pending requests on error
      this.pendingRequests.delete(cacheKey);
      throw error;
    }
  }

  /**
   * Fetch props data with intelligent caching
   */
  async fetchProps(
    sport: string,
    propType: 'team' | 'player' = 'player',
    statType: string = 'Popular'
  ): Promise<FeaturedProp[]> {
    const cacheKey = `props:${sport}:${propType}:${statType}`;

    return this.cachedFetch(
      cacheKey,
      () =>
        fetchFeaturedProps(sport, propType, {
          statTypes: [statType],
          useCache: true,
          priority: 'normal',
        }),
      this.CACHE_TTL.PROPS
    );
  }

  /**
   * Fetch unified betting response with caching
   */
  async fetchUnifiedBets(sport: string): Promise<EnhancedBetsResponse | null> {
    const cacheKey = `unified-bets:${sport}`;

    return this.cachedFetch(
      cacheKey,
      async () => {
        try {
          const response = await this.apiClient.get(`/enhanced-bets/${sport.toLowerCase()}`);
          return response.data;
        } catch (error) {
          console.warn(
            `[OptimizedSportsDataService] Failed to fetch unified bets for ${sport}:`,
            error
          );
          return null;
        }
      },
      this.CACHE_TTL.PROPS
    );
  }

  /**
   * Fetch upcoming games with caching
   */
  async fetchUpcomingGames(sport: string): Promise<any[]> {
    const cacheKey = `games:${sport}`;

    return this.cachedFetch(
      cacheKey,
      async () => {
        try {
          const response = await this.apiClient.get(`/${sport.toLowerCase()}/todays-games`);
          return response.data.games || [];
        } catch (error) {
          console.warn(`[OptimizedSportsDataService] Failed to fetch games for ${sport}:`, error);
          return [];
        }
      },
      this.CACHE_TTL.GAMES
    );
  }

  /**
   * Fetch comprehensive props with optimization
   */
  async fetchComprehensiveProps(gameId: number, optimizePerformance: boolean = true): Promise<any> {
    const cacheKey = `comprehensive-props:${gameId}:${optimizePerformance}`;

    return this.cachedFetch(
      cacheKey,
      async () => {
        try {
          const response = await this.apiClient.get(
            `/mlb/comprehensive-props/${gameId}?optimize_performance=${optimizePerformance}`
          );
          return response.data;
        } catch (error) {
          console.warn(
            `[OptimizedSportsDataService] Failed to fetch comprehensive props for game ${gameId}:`,
            error
          );
          return null;
        }
      },
      this.CACHE_TTL.PROPS
    );
  }

  /**
   * Enhanced Analysis for Props
   */
  async fetchEnhancedAnalysis(prop: any): Promise<any> {
    const cacheKey = `enhanced-analysis-${prop.id}`;

    return this.cachedFetch(
      cacheKey,
      async () => {
        const response = await this.apiClient.post('/api/enhanced-analysis', prop);
        return response.data;
      },
      this.CACHE_TTL.ANALYSIS
    );
  }

  /**
   * Batch fetch multiple data types efficiently
   */
  async batchFetch(
    requests: Array<{
      key: string;
      fetcher: () => Promise<any>;
      ttl?: number;
    }>
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    // Execute all requests in parallel
    const promises = requests.map(async request => {
      try {
        const data = await this.cachedFetch(request.key, request.fetcher, request.ttl);
        results[request.key] = data;
      } catch (error) {
        console.warn(
          `[OptimizedSportsDataService] Batch request failed for ${request.key}:`,
          error
        );
        results[request.key] = null;
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  /**
   * Preload data for better user experience
   */
  async preloadData(sport: string): Promise<void> {
    const preloadRequests = [
      {
        key: `props:${sport}:player:Popular`,
        fetcher: () =>
          fetchFeaturedProps(sport, 'player', {
            statTypes: ['Popular'],
            useCache: true,
            priority: 'normal',
          }),
      },
      {
        key: `games:${sport}`,
        fetcher: () => this.fetchUpcomingGames(sport),
      },
      {
        key: `unified-bets:${sport}`,
        fetcher: () => this.fetchUnifiedBets(sport),
      },
    ];

    // Fire and forget - just populate the cache
    this.batchFetch(preloadRequests).catch(error => {
      console.warn(`[OptimizedSportsDataService] Preload failed for ${sport}:`, error);
    });
  }

  /**
   * Invalidate cache for specific keys or patterns
   */
  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      console.log('[OptimizedSportsDataService] Cleared entire cache');
      return;
    }

    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(
      `[OptimizedSportsDataService] Invalidated ${keysToDelete.length} cache entries matching "${pattern}"`
    );
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    pendingRequests: number;
  } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses for actual calculation
      pendingRequests: this.pendingRequests.size,
    };
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expires) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(
        `[OptimizedSportsDataService] Cleaned up ${keysToDelete.length} expired cache entries`
      );
    }
  }

  /**
   * Clean up expired pending requests
   */
  private cleanupExpiredRequests(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.pendingRequests.entries()) {
      if (now - entry.timestamp > this.REQUEST_TIMEOUT) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.pendingRequests.delete(key));

    if (keysToDelete.length > 0) {
      console.log(
        `[OptimizedSportsDataService] Cleaned up ${keysToDelete.length} expired pending requests`
      );
    }
  }
}

// Singleton instance
const optimizedSportsDataService = new OptimizedSportsDataService();

/**
 * React hook for optimized sports data fetching
 */
export function useOptimizedSportsData() {
  const serviceRef = useRef(optimizedSportsDataService);

  // Memoized methods to prevent unnecessary re-renders
  const fetchProps = useCallback(
    (sport: string, propType: 'team' | 'player' = 'player', statType: string = 'Popular') =>
      serviceRef.current.fetchProps(sport, propType, statType),
    []
  );

  const fetchUnifiedBets = useCallback(
    (sport: string) => serviceRef.current.fetchUnifiedBets(sport),
    []
  );

  const fetchUpcomingGames = useCallback(
    (sport: string) => serviceRef.current.fetchUpcomingGames(sport),
    []
  );

  const fetchComprehensiveProps = useCallback(
    (gameId: number, optimizePerformance: boolean = true) =>
      serviceRef.current.fetchComprehensiveProps(gameId, optimizePerformance),
    []
  );

  const batchFetch = useCallback(
    (requests: Array<{ key: string; fetcher: () => Promise<any>; ttl?: number }>) =>
      serviceRef.current.batchFetch(requests),
    []
  );

  const preloadData = useCallback((sport: string) => serviceRef.current.preloadData(sport), []);

  const invalidateCache = useCallback(
    (pattern?: string) => serviceRef.current.invalidateCache(pattern),
    []
  );

  const getCacheStats = useCallback(() => serviceRef.current.getCacheStats(), []);

  return {
    fetchProps,
    fetchUnifiedBets,
    fetchUpcomingGames,
    fetchComprehensiveProps,
    batchFetch,
    preloadData,
    invalidateCache,
    getCacheStats,
  };
}

export { optimizedSportsDataService };
export default optimizedSportsDataService;
