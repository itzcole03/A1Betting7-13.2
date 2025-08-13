/**
 * Enhanced Frontend Data Management Service
 * Optimized data fetching, caching, and real-time updates for the frontend
 */

import axios, { AxiosResponse } from 'axios';
import {
  CacheInvalidationEvent,
  EnhancedRequestMetrics,
  RawSportsData,
  ValidatedSportsProp,
} from '../types/DataValidation';
import { dataValidator } from './EnhancedDataValidator';
import { enhancedLogger } from './EnhancedLogger';

interface FeaturedProp extends ValidatedSportsProp {
  // Backward compatibility - ValidatedSportsProp now provides all the fields
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
  accessCount: number;
  lastAccess: number;
}

interface DataSubscription<T = unknown> {
  key: string;
  callback: (data: T) => void;
  options: {
    realtime?: boolean;
    prefetch?: boolean;
    priority?: 'high' | 'normal' | 'low';
  };
}

interface BatchRequest {
  id: string;
  endpoint: string;
  params?: Record<string, unknown>;
  priority?: 'high' | 'normal' | 'low';
}

interface RequestMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  errors: number;
  avgResponseTime: number;
  lastUpdate: number;
}

class EnhancedDataManager {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private subscriptions: Map<string, DataSubscription<unknown>[]> = new Map();
  private pendingRequests: Map<string, Promise<unknown>> = new Map();
  private batchQueue: BatchRequest[] = [];
  private metrics: RequestMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
    avgResponseTime: 0,
    lastUpdate: Date.now(),
  };

  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private batchTimeout = 100; // 100ms batch window
  private maxCacheSize = 1000;
  private compressionThreshold = 10240; // 10KB

  constructor() {
    this.startBatchProcessor();
    this.startCacheCleanup();
    this.initializeWebSocket();
  }

  /**
   * Get the backend base URL for API requests
   */
  private getBackendUrl(): string {
    // In development, always use the backend port directly
    return 'http://localhost:8000';
  }

  /**
   * Enhanced data fetching with intelligent caching and batching
   */
  async fetchData<T>(
    endpoint: string,
    params?: Record<string, any>,
    options: {
      cache?: boolean;
      ttl?: number;
      priority?: 'high' | 'normal' | 'low';
      compression?: boolean;
      retries?: number;
    } = {}
  ): Promise<T> {
    const {
      cache = true,
      ttl = 300000, // 5 minutes default
      priority = 'normal',
      compression = false,
      retries = 3,
    } = options;

    const cacheKey = this.generateCacheKey(endpoint, params);
    const startTime = Date.now();

    enhancedLogger.debug('DataManager', 'fetchData', `Starting request to ${endpoint}`, {
      endpoint,
      params,
      cacheKey,
      priority,
      cache,
    });

    try {
      // Check cache first
      if (cache) {
        const cached = this.getCachedData<T>(cacheKey);
        if (cached) {
          this.metrics.cacheHits++;
          const duration = Date.now() - startTime;
          this.updateMetrics(duration);

          enhancedLogger.logCacheOperation('hit', cacheKey, { endpoint, duration });
          enhancedLogger.logApiRequest(endpoint, 'GET', params, duration, 'cached', { priority });

          return cached;
        }

        enhancedLogger.logCacheOperation('miss', cacheKey, { endpoint });
      }

      // Check if request is already pending (deduplication)
      if (this.pendingRequests.has(cacheKey)) {
        enhancedLogger.debug(
          'DataManager',
          'deduplication',
          `Deduplicating request for ${cacheKey}`,
          {
            endpoint,
            cacheKey,
          }
        );
        return (await this.pendingRequests.get(cacheKey)!) as T;
      }

      // Create the request promise
      const requestPromise = this.executeRequest<T>(endpoint, params, {
        priority,
        compression,
        retries,
      });

      // Store pending request
      this.pendingRequests.set(cacheKey, requestPromise);

      try {
        const data = await requestPromise;
        const duration = Date.now() - startTime;

        // Cache successful response
        if (cache && data) {
          this.setCachedData(cacheKey, data, ttl);
          enhancedLogger.logCacheOperation('set', cacheKey, { endpoint, ttl, duration });
        }

        this.metrics.cacheMisses++;
        this.updateMetrics(duration);

        enhancedLogger.logApiRequest(endpoint, 'GET', params, duration, 'success', {
          priority,
          cacheKey,
          dataSize: JSON.stringify(data).length,
        });

        return data;
      } finally {
        // Clean up pending request
        this.pendingRequests.delete(cacheKey);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.errors++;
      this.updateMetrics(duration);

      enhancedLogger.logApiRequest(endpoint, 'GET', params, duration, 'error', {
        priority,
        cacheKey,
        errorType: error instanceof Error ? error.name : 'UnknownError',
      });

      // Try to return stale cache data as fallback
      if (cache) {
        const staleData = this.getStaleData<T>(cacheKey);
        if (staleData) {
          enhancedLogger.warn(
            'DataManager',
            'staleDataFallback',
            `Returning stale data for ${cacheKey}`,
            {
              endpoint,
              cacheKey,
              error: error instanceof Error ? error.message : String(error),
            },
            error instanceof Error ? error : new Error(String(error))
          );
          return staleData;
        }
      }

      enhancedLogger.error(
        'DataManager',
        'fetchData',
        `Request failed for ${endpoint}`,
        {
          endpoint,
          params,
          cacheKey,
          duration,
          priority,
          retries,
        },
        error instanceof Error ? error : new Error(String(error))
      );

      throw error;
    }
  }

  /**
   * Batch multiple requests for optimal performance
   */
  async fetchBatch<T>(requests: BatchRequest[]): Promise<Record<string, T>> {
    // Special handling for batch predictions endpoint
    if (requests.length > 0 && requests[0].endpoint.includes('batch-predictions')) {
      return this.fetchBatchPredictions(requests);
    }

    const results: Record<string, T> = {};
    const pendingRequests: Promise<void>[] = [];

    // Group requests by priority
    const groupedRequests = {
      high: requests.filter(r => r.priority === 'high'),
      normal: requests.filter(r => r.priority === 'normal' || !r.priority),
      low: requests.filter(r => r.priority === 'low'),
    };

    // Process high priority requests first
    for (const group of [groupedRequests.high, groupedRequests.normal, groupedRequests.low]) {
      for (const request of group) {
        const promise = this.fetchData<T>(request.endpoint, request.params, {
          priority: request.priority,
        })
          .then(data => {
            results[request.id] = data;
          })
          .catch(error => {
            console.error(`[DataManager] Batch request failed for ${request.id}:`, error);
            results[request.id] = null as any;
          });

        pendingRequests.push(promise);

        // Add small delay between requests to avoid overwhelming the server
        if (group.length > 5) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
    }

    await Promise.all(pendingRequests);
    return results;
  }

  /**
   * Special method for batch predictions - makes a single POST request to backend
   */
  private async fetchBatchPredictions<T>(requests: BatchRequest[]): Promise<Record<string, T>> {
    const results: Record<string, T> = {};

    try {
      // Handle the case where we have a single request with an array of props
      let props: any[];

      if (requests.length === 1 && Array.isArray(requests[0].params)) {
        // Single batch request containing array of props
        props = requests[0].params;
      } else {
        // Multiple individual requests - convert to props array
        props = requests.map(request => request.params);
      }

      // Make single POST request to batch predictions endpoint
      const url = `${this.getBackendUrl()}/api/unified/batch-predictions`;
      console.log(
        `[DataManager] Making batch predictions request to ${url} with ${props.length} props`
      );

      const response = await axios.post(url, props, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 8000, // 8 second timeout for batch operations - faster fallback
      });

      // Handle backend response format
      if (response.data && Array.isArray(response.data.predictions)) {
        // Backend returns { predictions: [...], errors: [...] }
        if (requests.length === 1 && Array.isArray(requests[0].params)) {
          // Single batch request - store entire response under the single request ID
          results[requests[0].id] = response.data;
        } else {
          // Multiple individual requests
          response.data.predictions.forEach((result: any, index: number) => {
            if (index < requests.length) {
              results[requests[index].id] = result;
            }
          });
        }
      } else if (response.data && Array.isArray(response.data.results)) {
        // Backend returns { results: [...] }
        if (requests.length === 1 && Array.isArray(requests[0].params)) {
          results[requests[0].id] = response.data;
        } else {
          response.data.results.forEach((result: any, index: number) => {
            if (index < requests.length) {
              results[requests[index].id] = result;
            }
          });
        }
      } else if (Array.isArray(response.data)) {
        // Backend returns array directly
        if (requests.length === 1 && Array.isArray(requests[0].params)) {
          results[requests[0].id] = { predictions: response.data } as T;
        } else {
          response.data.forEach((result: any, index: number) => {
            if (index < requests.length) {
              results[requests[index].id] = result;
            }
          });
        }
      } else {
        console.warn('[DataManager] Unexpected batch predictions response format:', response.data);
      }

      console.log(
        `[DataManager] Batch predictions completed: ${Object.keys(results).length} results`
      );
    } catch (error: any) {
      console.error('[DataManager] Batch predictions request failed:', error);

      // Mark all requests as failed
      requests.forEach(request => {
        results[request.id] = null as any;
      });
    }

    return results;
  }

  /**
   * Subscribe to real-time data updates
   */
  subscribe(
    key: string,
    callback: (data: any) => void,
    options: {
      realtime?: boolean;
      prefetch?: boolean;
      priority?: 'high' | 'normal' | 'low';
    } = {}
  ): () => void {
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, []);
    }

    const subscription: DataSubscription = {
      key,
      callback,
      options: {
        realtime: true,
        prefetch: false,
        priority: 'normal',
        ...options,
      },
    };

    this.subscriptions.get(key)!.push(subscription);

    // Enable WebSocket if real-time is requested
    if (options.realtime && !this.websocket) {
      this.initializeWebSocket();
    }

    // Prefetch data if requested
    if (options.prefetch) {
      this.prefetchData(key);
    }

    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(key);
      if (subs) {
        const index = subs.indexOf(subscription);
        if (index > -1) {
          subs.splice(index, 1);
        }
        if (subs.length === 0) {
          this.subscriptions.delete(key);
        }
      }
    };
  }

  /**
   * Prefetch data based on predicted user behavior
   */
  async prefetchData(pattern: string): Promise<void> {
    try {
      // Analyze access patterns and prefetch likely needed data
      const predictions = this.getPrefetchPredictions(pattern);

      for (const prediction of predictions) {
        // Use low priority for prefetch requests
        this.fetchData(prediction.endpoint, prediction.params, {
          priority: 'low',
          cache: true,
          ttl: 600000, // 10 minutes for prefetched data
        }).catch(error => {
          console.debug(`[DataManager] Prefetch failed for ${prediction.endpoint}:`, error);
        });
      }
    } catch (error) {
      console.error('[DataManager] Prefetch error:', error);
    }
  }

  /**
   * Optimized data fetching for sports props with smart consolidation
   */
  async fetchSportsProps(
    sport: string,
    propType: string = 'player',
    options: {
      useCache?: boolean;
      realtime?: boolean;
      consolidate?: boolean;
      statTypes?: string[]; // Add stat types filtering
      limit?: number; // Add pagination support
      offset?: number;
    } = {}
  ): Promise<FeaturedProp[]> {
    const {
      useCache = true,
      realtime = false,
      consolidate = true,
      statTypes,
      limit = 50,
      offset = 0,
    } = options;

    try {
      // Fetch raw props data with absolute URLs
      const baseUrl = this.getBackendUrl();
      const endpoint =
        sport === 'MLB' ? `${baseUrl}/mlb/odds-comparison/` : `${baseUrl}/api/props/${sport}`;
      const params = {
        market_type: propType === 'player' ? 'playerprops' : 'regular',
        ...(statTypes && statTypes.length > 0 && { stat_types: statTypes.join(',') }),
        limit,
        offset,
      };

      // Debug cache key generation
      const cacheKey = this.generateCacheKey(endpoint, params);
      console.log(`[EnhancedDataManager] fetchSportsProps cache key: ${cacheKey}`);
      console.log(`[EnhancedDataManager] fetchSportsProps params:`, params);
      console.log(`[EnhancedDataManager] fetchSportsProps statTypes:`, statTypes);

      const rawData = await this.fetchData<any>(endpoint, params, {
        cache: useCache,
        ttl: 180000, // 3 minutes for props data
        priority: 'high',
      });

      let props: any[] = [];
      if (Array.isArray(rawData)) {
        props = rawData;
      } else if (Array.isArray(rawData?.odds)) {
        props = rawData.odds;
      } else if (Array.isArray(rawData?.data)) {
        props = rawData.data;
      }

      // Consolidate props if requested
      if (consolidate && props.length > 0) {
        props = this.consolidateProps(props);
      }

      // Map to FeaturedProp interface, passing sport context
      const featuredProps = this.mapToFeaturedProps(props, sport);

      // Apply position-based filtering for MLB to ensure logical player-stat combinations
      const filteredProps =
        sport === 'MLB' ? this.filterByPlayerPosition(featuredProps) : featuredProps;

      console.log(
        `[EnhancedDataManager] Position filtering: ${featuredProps.length} -> ${filteredProps.length} props`
      );

      // Subscribe to real-time updates if requested
      if (realtime) {
        this.subscribe(
          `sports:${sport}:${propType}`,
          updatedData => {
            // Handle real-time prop updates
            this.handlePropsUpdate(sport, propType, updatedData);
          },
          { realtime: true }
        );
      }

      return filteredProps;
    } catch (error) {
      console.error(`[DataManager] Failed to fetch ${sport} props:`, error);

      // Check if this is a connectivity issue (including axios errors)
      const isConnectivityError =
        error instanceof Error &&
        (error.message.includes('Failed to fetch') ||
          error.message.includes('Network Error') ||
          error.message.includes('timeout') ||
          error.message.includes('signal timed out') ||
          error.name === 'NetworkError' ||
          (error as any).code === 'ERR_NETWORK');

      if (isConnectivityError) {
        console.log(`[DataManager] Backend unavailable for ${sport} - using mock data`);

        // Return mock props when backend is unavailable
        const mockProps = [
          {
            id: 'mock-aaron-judge-hr',
            player: 'Aaron Judge',
            matchup: 'Yankees vs Red Sox',
            stat: 'Home Runs',
            line: 1.5,
            overOdds: 120,
            underOdds: -110,
            confidence: 85,
            sport: sport,
            gameTime: new Date().toISOString(),
            pickType: 'over',
          },
          {
            id: 'mock-mike-trout-hits',
            player: 'Mike Trout',
            matchup: 'Angels vs Astros',
            stat: 'Hits',
            line: 1.5,
            overOdds: -105,
            underOdds: -115,
            confidence: 78,
            sport: sport,
            gameTime: new Date().toISOString(),
            pickType: 'over',
          },
          {
            id: 'mock-mookie-betts-rbis',
            player: 'Mookie Betts',
            matchup: 'Dodgers vs Giants',
            stat: 'RBIs',
            line: 0.5,
            overOdds: 110,
            underOdds: -130,
            confidence: 82,
            sport: sport,
            gameTime: new Date().toISOString(),
            pickType: 'over',
          },
        ];

        // Ensure mockProps match FeaturedProp interface
        return mockProps.map(p => ({
          ...p,
          dataSource: 'mock',
          validatedAt: new Date().toISOString(),
          qualityScore: 50,
          _originalData: p,
        })) as FeaturedProp[];
      }

      throw error;
    }
  }

  /**
   * Enhanced prop analysis fetching with intelligent caching
   */
  async fetchPropAnalysis(
    propId: string,
    player: string,
    stat: string,
    options: {
      useCache?: boolean;
      priority?: 'high' | 'normal' | 'low';
    } = {}
  ): Promise<any> {
    const { useCache = true, priority = 'normal' } = options;

    const endpoint = '/api/prop-analysis/enhanced';
    const params = { propId, player, stat };

    return await this.fetchData(endpoint, params, {
      cache: useCache,
      ttl: 600000, // 10 minutes for analysis
      priority,
      compression: true, // Analysis data can be large
    });
  }

  /**
   * Get comprehensive performance metrics
   */
  getMetrics(): RequestMetrics & {
    cacheSize: number;
    hitRate: number;
    subscriptions: number;
    pendingRequests: number;
    enhancedMetrics: EnhancedRequestMetrics;
  } {
    const totalRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    const hitRate = totalRequests > 0 ? (this.metrics.cacheHits / totalRequests) * 100 : 0;

    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      hitRate,
      subscriptions: Array.from(this.subscriptions.values()).reduce(
        (sum, subs) => sum + subs.length,
        0
      ),
      pendingRequests: this.pendingRequests.size,
      enhancedMetrics: enhancedLogger.getMetrics(),
    };
  }

  /**
   * Invalidate cache based on events
   */
  invalidateCache(event: CacheInvalidationEvent): void {
    const keysToDelete: string[] = [];

    enhancedLogger.info(
      'DataManager',
      'cacheInvalidation',
      `Processing cache invalidation event: ${event.type}`,
      {
        eventType: event.type,
        sport: event.sport,
        gameId: event.gameId,
        propId: event.propId,
        reason: event.reason,
      }
    );

    switch (event.type) {
      case 'sport_update':
        if (event.sport) {
          for (const key of Array.from(this.cache.keys())) {
            if (key.includes(event.sport.toLowerCase())) {
              keysToDelete.push(key);
            }
          }
        }
        break;

      case 'prop_update':
        if (event.propId) {
          for (const key of Array.from(this.cache.keys())) {
            if (key.includes(event.propId)) {
              keysToDelete.push(key);
            }
          }
        }
        break;

      case 'game_update':
        if (event.gameId) {
          for (const key of Array.from(this.cache.keys())) {
            if (key.includes(event.gameId)) {
              keysToDelete.push(key);
            }
          }
        }
        break;

      case 'manual':
        keysToDelete.push(...event.affectedKeys);
        break;

      case 'time_based':
        // Already handled by cache cleanup
        break;
    }

    // Remove invalidated entries
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      enhancedLogger.logCacheOperation('invalidate', key, {
        eventType: event.type,
        reason: event.reason,
      });
    });

    enhancedLogger.info(
      'DataManager',
      'cacheInvalidation',
      `Invalidated ${keysToDelete.length} cache entries`,
      {
        eventType: event.type,
        invalidatedKeys: keysToDelete.length,
        remainingCacheSize: this.cache.size,
      }
    );
  }

  /**
   * Warm cache with predicted data needs
   */
  async warmCache(
    predictions: Array<{ endpoint: string; params?: any; sport?: string }>
  ): Promise<void> {
    enhancedLogger.info(
      'DataManager',
      'cacheWarming',
      `Starting cache warming for ${predictions.length} predictions`,
      {
        predictionsCount: predictions.length,
      }
    );

    const warmingPromises = predictions.map(async (prediction, index) => {
      try {
        await new Promise(resolve => setTimeout(resolve, index * 50)); // Stagger requests
        await this.fetchData(prediction.endpoint, prediction.params, {
          priority: 'low',
          cache: true,
          ttl: 600000, // 10 minutes for warmed data
        });

        enhancedLogger.debug(
          'DataManager',
          'cacheWarming',
          `Successfully warmed cache for ${prediction.endpoint}`,
          {
            endpoint: prediction.endpoint,
            sport: prediction.sport,
          }
        );
      } catch (error) {
        enhancedLogger.warn(
          'DataManager',
          'cacheWarming',
          `Failed to warm cache for ${prediction.endpoint}`,
          {
            endpoint: prediction.endpoint,
            sport: prediction.sport,
          },
          error instanceof Error ? error : new Error(String(error))
        );
      }
    });

    await Promise.allSettled(warmingPromises);

    enhancedLogger.info('DataManager', 'cacheWarming', 'Cache warming completed', {
      predictionsCount: predictions.length,
      cacheSize: this.cache.size,
    });
  }

  /**
   * Clear cache and reset state
   */
  clearCache(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    console.log('[DataManager] Cache cleared');
  }

  /**
   * Graceful shutdown
   */
  destroy(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.clearCache();
    this.subscriptions.clear();
  }

  // Private methods

  private async executeRequest<T>(
    endpoint: string,
    params?: Record<string, any>,
    options: {
      priority?: 'high' | 'normal' | 'low';
      compression?: boolean;
      retries?: number;
    } = {}
  ): Promise<T> {
    const { retries = 0, compression = false } = options; // Disable retries for faster fallback

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const config: any = {
          timeout: this.getTimeoutForPriority(options.priority),
          headers: {},
        };

        if (compression) {
          config.headers['Accept-Encoding'] = 'gzip, deflate, br';
        }

        let response: AxiosResponse<T>;

        if (params && Object.keys(params).length > 0) {
          response = await axios.get(endpoint, { params, ...config });
        } else {
          response = await axios.get(endpoint, config);
        }

        this.metrics.totalRequests++;

        return response.data;
      } catch (error: any) {
        lastError = error;

        // Don't retry on client errors (4xx)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          break;
        }

        // Exponential backoff for retries
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          console.log(
            `[DataManager] Retrying request to ${endpoint} (attempt ${attempt + 2}/${retries + 1})`
          );
        }
      }
    }

    // Check if this is a connectivity issue and normalize the error message
    if (lastError) {
      const isConnectivityError =
        lastError.message.includes('Network Error') ||
        lastError.message.includes('Failed to fetch') ||
        lastError.message.includes('timeout') ||
        (lastError as any).code === 'ERR_NETWORK' ||
        !(lastError as any).response; // No response means network issue

      if (isConnectivityError) {
        // Create a normalized error that fallback logic can detect
        const normalizedError = new Error('Failed to fetch');
        normalizedError.name = 'NetworkError';
        throw normalizedError;
      }
    }

    throw lastError!;
  }

  private generateCacheKey(endpoint: string, params?: Record<string, any>): string {
    const paramsStr = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
    return `${endpoint}${paramsStr}`;
  }

  private getCachedData<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccess = now;

    return entry.data as T;
  }

  private getStaleData<T>(key: string): T | null {
    const entry = this.cache.get(key);
    return entry ? (entry.data as T) : null;
  }

  private setCachedData<T>(key: string, data: T, ttl: number): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key,
      accessCount: 1,
      lastAccess: Date.now(),
    };

    this.cache.set(key, entry);
  }

  private evictLRU(): void {
    let oldestEntry: [string, CacheEntry<any>] | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestEntry = [key, entry];
      }
    }

    if (oldestEntry) {
      this.cache.delete(oldestEntry[0]);
      console.debug(`[DataManager] Evicted LRU cache entry: ${oldestEntry[0]}`);
    }
  }

  private updateMetrics(responseTime: number): void {
    this.metrics.avgResponseTime = this.metrics.avgResponseTime * 0.9 + responseTime * 0.1;
    this.metrics.lastUpdate = Date.now();
  }

  private getTimeoutForPriority(priority?: 'high' | 'normal' | 'low'): number {
    switch (priority) {
      case 'high':
        return 5000; // 5 seconds for high priority - fail fast to use mock data
      case 'low':
        return 8000; // 8 seconds for low priority
      default:
        return 6000; // 6 seconds for normal priority
    }
  }

  private consolidateProps(props: any[]): any[] {
    const consolidatedMap = new Map<string, any>();

    for (const prop of props) {
      const key = `${prop.event_id || prop.id}-${prop.stat_type}-${
        prop.line || prop.line_score || 0
      }`;

      if (prop.stat_type?.toLowerCase() === 'totals') {
        if (consolidatedMap.has(key)) {
          const existing = consolidatedMap.get(key);
          if (prop.odds_type?.toLowerCase().includes('over')) {
            existing.overOdds = prop.value || prop.odds;
          } else if (prop.odds_type?.toLowerCase().includes('under')) {
            existing.underOdds = prop.value || prop.odds;
          }
        } else {
          const consolidated = { ...prop };
          consolidated.player = prop.event_name || prop.matchup || 'Total (Game)';

          if (prop.odds_type?.toLowerCase().includes('over')) {
            consolidated.overOdds = prop.value || prop.odds;
            consolidated.underOdds = null;
          } else if (prop.odds_type?.toLowerCase().includes('under')) {
            consolidated.overOdds = null;
            consolidated.underOdds = prop.value || prop.odds;
          }

          consolidatedMap.set(key, consolidated);
        }
      } else {
        consolidatedMap.set(key, prop);
      }
    }

    return Array.from(consolidatedMap.values());
  }

  private mapToFeaturedProps(props: any[], sport?: string): FeaturedProp[] {
    const startTime = Date.now();
    const validatedProps: FeaturedProp[] = [];
    const errors: string[] = [];

    enhancedLogger.debug(
      'DataManager',
      'mapToFeaturedProps',
      `Starting validation of ${props.length} props`,
      {
        sport,
        propsCount: props.length,
      }
    );

    for (let i = 0; i < props.length; i++) {
      const prop = props[i];

      try {
        // Use the enhanced validator
        const validationResult = dataValidator.validateSportsProp(prop as RawSportsData, sport, {
          source: 'mapToFeaturedProps',
          timestamp: Date.now(),
        });

        if (validationResult.isValid && validationResult.data) {
          validatedProps.push(validationResult.data);
        } else {
          // Log validation failure but continue processing
          const errorMsg = validationResult.errors.map(e => e.message).join(', ');
          errors.push(`Prop ${i}: ${errorMsg}`);

          enhancedLogger.warn(
            'DataManager',
            'propValidation',
            `Prop validation failed: ${errorMsg}`,
            {
              prop: prop,
              sport,
              errors: validationResult.errors,
              warnings: validationResult.warnings,
            }
          );
        }
      } catch (error) {
        // Fallback to legacy mapping for compatibility
        const legacyProp = this.legacyMapProp(prop, sport);
        if (legacyProp) {
          validatedProps.push(legacyProp);
          enhancedLogger.warn(
            'DataManager',
            'fallbackMapping',
            `Used legacy mapping for prop due to validation error`,
            {
              prop: prop,
              sport,
              error: error instanceof Error ? error.message : String(error),
            }
          );
        }
      }
    }

    const duration = Date.now() - startTime;
    const successRate = props.length > 0 ? (validatedProps.length / props.length) * 100 : 0;

    enhancedLogger.logDataValidation(
      'mapToFeaturedProps',
      sport || 'Unknown',
      props.length,
      validatedProps.length,
      errors.length,
      validatedProps.length > 0
        ? validatedProps.reduce((sum, p) => sum + p.qualityScore, 0) / validatedProps.length
        : 0,
      duration,
      { successRate, errorsCount: errors.length }
    );

    return validatedProps;
  }

  /**
   * Legacy prop mapping for fallback compatibility
   */
  private legacyMapProp(prop: any, sport?: string): FeaturedProp | null {
    try {
      const mappedProp = {
        id: prop.id || prop.event_id || `${prop.player_name}-${prop.stat_type}`,
        player: prop.player || prop.player_name || prop.event_name || 'Unknown',
        matchup: prop.matchup || prop.event_name || 'Unknown vs Unknown',
        stat: prop.stat || prop.stat_type || 'Unknown',
        line: parseFloat(prop.line || prop.line_score || 0),
        overOdds: parseFloat(prop.overOdds || prop.over_odds || prop.value || 0),
        underOdds: parseFloat(prop.underOdds || prop.under_odds || prop.value || 0),
        confidence: parseFloat(prop.confidence || 0),
        sport: prop.sport || sport || 'Unknown',
        gameTime: prop.gameTime || prop.start_time || new Date().toISOString(),
        pickType: (prop.pickType || 'prop') as 'prop' | 'spread' | 'total' | 'moneyline',
        espnPlayerId: prop.espnPlayerId || prop.player_id || prop.playerId || undefined,
        dataSource: 'legacy_mapping',
        validatedAt: new Date().toISOString(),
        qualityScore: 50, // Default quality score for legacy mapping
        _originalData: prop,
      };

      // Debug logging for stat mapping
      if (prop.stat_type && prop.stat_type !== mappedProp.stat) {
        console.log(`[DataManager] Stat mapping: ${prop.stat_type} -> ${mappedProp.stat}`, {
          original: prop,
          mapped: mappedProp,
        });
      }

      return mappedProp;
    } catch (error) {
      enhancedLogger.error(
        'DataManager',
        'legacyMapping',
        'Failed to map prop using legacy method',
        { prop, sport },
        error instanceof Error ? error : new Error(String(error))
      );
      return null;
    }
  }

  private getWebSocketUrl(): string {
    // Centralize WS URL, fallback to env or localhost
    const envWsUrl = (window as any).VITE_WS_URL || process.env.VITE_WS_URL;
    if (envWsUrl) return envWsUrl;
    let clientId = '';
    if (window.localStorage.getItem('clientId')) {
      clientId = window.localStorage.getItem('clientId')!;
    } else {
      clientId = `client_${Math.random().toString(36).substr(2, 9)}`;
      window.localStorage.setItem('clientId', clientId);
    }
    return `ws://localhost:8000/ws/${clientId}`;
  }

  private initializeWebSocket(): void {
    try {
      const wsUrl = this.getWebSocketUrl();
      this.websocket = new WebSocket(wsUrl);
      enhancedLogger.info('DataManager', 'WebSocket', `Connecting to ${wsUrl}`);

      this.websocket.onopen = () => {
        enhancedLogger.info('DataManager', 'WebSocket', 'WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.websocket.onmessage = event => {
        try {
          const message = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          const errObj = error instanceof Error ? error : new Error(String(error));
          enhancedLogger.warn('DataManager', 'WebSocket', 'Message parsing error', {}, errObj);
        }
      };

      this.websocket.onclose = event => {
        enhancedLogger.warn('DataManager', 'WebSocket', `Disconnected (code ${event.code})`);
        this.websocket = null;
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          enhancedLogger.info('DataManager', 'WebSocket', `Attempting reconnection in ${delay}ms`);
          setTimeout(() => {
            this.reconnectAttempts++;
            this.initializeWebSocket();
          }, delay);
        } else {
          enhancedLogger.info(
            'DataManager',
            'WebSocket',
            'Reconnection stopped, continuing in local mode'
          );
        }
      };

      this.websocket.onerror = error => {
        const errObj =
          error instanceof Error ? error : new Error(error?.toString?.() || 'WebSocket error');
        enhancedLogger.warn('DataManager', 'WebSocket', 'Connection issue', {}, errObj);
      };
    } catch (error) {
      const errObj = error instanceof Error ? error : new Error(String(error));
      enhancedLogger.warn(
        'DataManager',
        'WebSocket',
        'Initialization failed, continuing in local mode',
        {},
        errObj
      );
    }
  }

  private handleWebSocketMessage(message: any): void {
    if (message.type === 'data_update') {
      // Invalidate relevant cache entries
      const pattern = `*${message.source}*`;
      this.invalidateCachePattern(pattern);

      // Notify subscribers
      for (const [key, subscriptions] of Array.from(this.subscriptions.entries())) {
        if (key.includes(message.source)) {
          subscriptions.forEach(sub => {
            if (sub.options.realtime) {
              sub.callback(message.data);
            }
          });
        }
      }
    }
  }

  private invalidateCachePattern(pattern: string): void {
    const keysToDelete: string[] = [];

    for (const key of Array.from(this.cache.keys())) {
      if (this.matchesPattern(key, pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(
        `[DataManager] Invalidated ${keysToDelete.length} cache entries matching pattern: ${pattern}`
      );
    }
  }

  private matchesPattern(str: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(str);
  }

  private getPrefetchPredictions(
    pattern: string
  ): Array<{ endpoint: string; params?: Record<string, any> }> {
    // Simple prediction logic - in reality this would be more sophisticated
    const predictions: Array<{ endpoint: string; params?: Record<string, any> }> = [];

    if (pattern.includes('MLB')) {
      predictions.push(
        { endpoint: '/mlb/odds-comparison/', params: { market_type: 'playerprops' } },
        { endpoint: '/api/prop-analysis/trends', params: { sport: 'MLB' } }
      );
    }

    return predictions;
  }

  private handlePropsUpdate(sport: string, propType: string, data: any): void {
    // Handle real-time props updates
    console.log(`[DataManager] Real-time update for ${sport} ${propType}:`, data);

    // Invalidate related cache entries
    this.invalidateCachePattern(`*${sport.toLowerCase()}*`);
  }

  private startBatchProcessor(): void {
    setInterval(() => {
      if (this.batchQueue.length > 0) {
        const batch = this.batchQueue.splice(0);
        this.processBatch(batch);
      }
    }, this.batchTimeout);
  }

  private async processBatch(batch: BatchRequest[]): Promise<void> {
    if (batch.length === 0) return;

    try {
      const results = await this.fetchBatch(batch);
      console.log(`[DataManager] Processed batch of ${batch.length} requests`);
    } catch (error) {
      console.error('[DataManager] Batch processing error:', error);
    }
  }

  private startCacheCleanup(): void {
    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      for (const [key, entry] of Array.from(this.cache.entries())) {
        if (now > entry.timestamp + entry.ttl) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => this.cache.delete(key));

      if (keysToDelete.length > 0) {
        console.log(`[DataManager] Cleaned up ${keysToDelete.length} expired cache entries`);
      }
    }, 300000); // 5 minutes
  }

  /**
   * Filter props based on player position and stat type compatibility
   * Ensures pitchers only see pitcher stats and position players only see batter stats
   */
  private filterByPlayerPosition(props: FeaturedProp[]): FeaturedProp[] {
    console.log(`[DataManager] Starting position-based filtering for ${props.length} props`);

    // Define pitcher stat types
    const pitcherStatTypes = [
      'strikeouts',
      'walks_allowed',
      'hits_allowed',
      'earned_runs',
      'innings_pitched',
      'wins',
      'saves',
      'whip',
      'era',
      'pitches_thrown',
      'first_inning_runs_allowed',
      'pitching_outs',
      'pitcher_strikeouts',
      'pitcher_walks',
      'pitcher_hits_allowed',
    ];

    // Define batter stat types
    const batterStatTypes = [
      'hits',
      'home_runs',
      'runs_batted_in',
      'runs_scored',
      'stolen_bases',
      'total_bases',
      'doubles',
      'triples',
      'walks',
      'strikeouts_as_batter',
      'batting_average',
      'on_base_percentage',
      'slugging_percentage',
      'singles',
      'extra_base_hits',
      'bases_on_balls',
    ];

    const filteredProps = props.filter(prop => {
      try {
        // Skip filtering for team totals or game props
        if (
          !prop.player ||
          prop.player.toLowerCase().includes('total') ||
          prop.player.toLowerCase().includes('game') ||
          prop.stat?.toLowerCase() === 'totals'
        ) {
          console.log(`[DataManager] Keeping team/game prop: ${prop.player} - ${prop.stat}`);
          return true;
        }

        const statType = prop.stat?.toLowerCase() || '';

        // Try to get position from original data
        const originalData = prop._originalData;
        const position = originalData?.position || originalData?.pos || '';

        // Check if we have position data
        if (!position) {
          console.log(`[DataManager] No position data for ${prop.player}, keeping prop`);
          return true;
        }

        // Position "1" indicates pitcher in baseball
        const isPitcher = position === '1' || position === 1 || position === 'P';
        const isPitcherStat = pitcherStatTypes.some(type => statType.includes(type.toLowerCase()));
        const isBatterStat = batterStatTypes.some(type => statType.includes(type.toLowerCase()));

        let shouldKeep = true;

        if (isPitcher && isBatterStat) {
          console.log(
            `[DataManager] Filtering out batter stat "${statType}" for pitcher ${prop.player}`
          );
          shouldKeep = false;
        } else if (!isPitcher && isPitcherStat) {
          console.log(
            `[DataManager] Filtering out pitcher stat "${statType}" for position player ${prop.player} (pos: ${position})`
          );
          shouldKeep = false;
        } else {
          console.log(
            `[DataManager] Keeping ${isPitcher ? 'pitcher' : 'position player'} ${
              prop.player
            } with stat "${statType}"`
          );
        }

        return shouldKeep;
      } catch (error) {
        console.error(`[DataManager] Error filtering prop for ${prop.player}:`, error);
        return true; // Keep prop if there's an error
      }
    });

    console.log(
      `[DataManager] Position filtering: ${props.length} → ${
        filteredProps.length
      } props (filtered out ${props.length - filteredProps.length})`
    );
    return filteredProps;
  }
}

// Global instance
export const enhancedDataManager = new EnhancedDataManager();
