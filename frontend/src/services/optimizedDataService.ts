/**
 * Optimized Data Service - Phase 4 Frontend Performance Enhancement
 * Leverages React 19 concurrent features, caching, and performance optimization
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface FetchOptions {
  useCache?: boolean;
  timeout?: number;
  retries?: number;
  cacheDuration?: number;
}

interface RequestMetrics {
  url: string;
  method: string;
  duration: number;
  cached: boolean;
  success: boolean;
  timestamp: number;
}

class OptimizedDataService {
  private cache = new Map<string, CacheEntry<any>>();
  private requestQueue = new Map<string, Promise<any>>();
  private metrics: RequestMetrics[] = [];
  private readonly defaultTimeout = 10000; // 10 seconds
  private readonly defaultCacheDuration = 5 * 60 * 1000; // 5 minutes
  private readonly maxCacheSize = 100;
  private readonly maxMetrics = 1000;

  // Optimized fetch with caching and deduplication
  async fetch<T>(
    url: string, 
    options: RequestInit & FetchOptions = {}
  ): Promise<T> {
    const {
      useCache = true,
      timeout = this.defaultTimeout,
      retries = 3,
      cacheDuration = this.defaultCacheDuration,
      ...fetchOptions
    } = options;

    const cacheKey = this.getCacheKey(url, fetchOptions);
    const startTime = performance.now();

    try {
      // Check cache first
      if (useCache && this.cache.has(cacheKey)) {
        const entry = this.cache.get(cacheKey)!;
        if (Date.now() < entry.expiresAt) {
          this.recordMetrics({
            url,
            method: fetchOptions.method || 'GET',
            duration: performance.now() - startTime,
            cached: true,
            success: true,
            timestamp: Date.now()
          });
          return entry.data;
        } else {
          // Remove expired entry
          this.cache.delete(cacheKey);
        }
      }

      // Check if request is already in flight (deduplication)
      if (this.requestQueue.has(cacheKey)) {
        return await this.requestQueue.get(cacheKey)!;
      }

      // Create new request with timeout and retries
      const requestPromise = this.executeWithRetries(
        () => this.fetchWithTimeout(url, fetchOptions, timeout),
        retries
      );

      // Add to queue for deduplication
      this.requestQueue.set(cacheKey, requestPromise);

      try {
        const data = await requestPromise;

        // Cache successful response
        if (useCache) {
          this.setCache(cacheKey, data, cacheDuration);
        }

        this.recordMetrics({
          url,
          method: fetchOptions.method || 'GET',
          duration: performance.now() - startTime,
          cached: false,
          success: true,
          timestamp: Date.now()
        });

        return data;

      } finally {
        // Remove from queue
        this.requestQueue.delete(cacheKey);
      }

    } catch (error) {
      this.recordMetrics({
        url,
        method: fetchOptions.method || 'GET',
        duration: performance.now() - startTime,
        cached: false,
        success: false,
        timestamp: Date.now()
      });
      throw error;
    }
  }

  // Fetch with timeout support
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();

    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Execute with retry logic and exponential backoff
  private async executeWithRetries<T>(
    fn: () => Promise<T>,
    retries: number
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === retries) break;

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // Generate cache key
  private getCacheKey(url: string, options: RequestInit): string {
    const keyData = {
      url,
      method: options.method || 'GET',
      body: options.body,
      headers: options.headers
    };
    return btoa(JSON.stringify(keyData));
  }

  // Set cache with size management
  private setCache<T>(key: string, data: T, duration: number): void {
    // Clean up expired entries and manage size
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanupCache();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration
    });
  }

  // Cleanup expired cache entries
  private cleanupCache(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAt) {
        entriesToDelete.push(key);
      }
    }

    // If still too many entries, remove oldest
    if (this.cache.size - entriesToDelete.length >= this.maxCacheSize) {
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const toRemove = entries.slice(0, Math.ceil(this.maxCacheSize * 0.2));
      toRemove.forEach(([key]) => entriesToDelete.push(key));
    }

    entriesToDelete.forEach(key => this.cache.delete(key));
  }

  // Record performance metrics
  private recordMetrics(metric: RequestMetrics): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  // Public API methods
  async get<T>(url: string, options?: FetchOptions): Promise<T> {
    return this.fetch<T>(url, { ...options, method: 'GET' });
  }

  async post<T>(url: string, data?: any, options?: FetchOptions): Promise<T> {
    return this.fetch<T>(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T>(url: string, data?: any, options?: FetchOptions): Promise<T> {
    return this.fetch<T>(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(url: string, options?: FetchOptions): Promise<T> {
    return this.fetch<T>(url, { ...options, method: 'DELETE' });
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
  }

  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.clearCache();
      return;
    }

    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      try {
        const decoded = JSON.parse(atob(key));
        if (decoded.url.includes(pattern)) {
          keysToDelete.push(key);
        }
      } catch {
        // Invalid key format, skip
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Get performance statistics
  getStats() {
    const recentMetrics = this.metrics.filter(
      m => Date.now() - m.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );

    const totalRequests = recentMetrics.length;
    const successfulRequests = recentMetrics.filter(m => m.success).length;
    const cachedRequests = recentMetrics.filter(m => m.cached).length;
    
    const avgDuration = totalRequests > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests 
      : 0;

    return {
      totalRequests,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      cacheHitRate: totalRequests > 0 ? (cachedRequests / totalRequests) * 100 : 0,
      averageDuration: Math.round(avgDuration * 100) / 100,
      cacheSize: this.cache.size,
      queueSize: this.requestQueue.size
    };
  }

  // Prefetch for performance optimization
  async prefetch(urls: string[], options?: FetchOptions): Promise<void> {
    const promises = urls.map(url => 
      this.get(url, { ...options, useCache: true }).catch(() => {
        // Silently fail prefetch requests
      })
    );

    await Promise.allSettled(promises);
  }

  // Batch requests for efficiency
  async batch<T>(requests: Array<{ url: string; options?: FetchOptions }>): Promise<T[]> {
    const promises = requests.map(({ url, options }) => 
      this.get<T>(url, options)
    );

    const results = await Promise.allSettled(promises);
    
    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      throw result.reason;
    });
  }
}

// Create singleton instance
export const optimizedDataService = new OptimizedDataService();

// Enhanced API service with optimizations
export class OptimizedAPIService {
  private baseURL: string;
  private dataService: OptimizedDataService;

  constructor(baseURL = '') {
    this.baseURL = baseURL;
    this.dataService = optimizedDataService;
  }

  // MLB Games with optimization
  async getMLBGames(useCache = true) {
    return this.dataService.get(`${this.baseURL}/mlb/todays-games`, {
      useCache,
      cacheDuration: 5 * 60 * 1000 // 5 minutes
    });
  }

  // Game props with optimization
  async getGameProps(gameId: string, useCache = true) {
    return this.dataService.get(`${this.baseURL}/mlb/comprehensive-props/${gameId}`, {
      useCache,
      cacheDuration: 3 * 60 * 1000 // 3 minutes
    });
  }

  // ML predictions with optimization
  async getMLPrediction(player: string, propType: string, line: number, useCache = true) {
    const params = new URLSearchParams({
      player,
      prop_type: propType,
      line: line.toString(),
      use_cache: useCache.toString()
    });

    return this.dataService.get(`${this.baseURL}/ml/predict?${params}`, {
      useCache,
      cacheDuration: 10 * 60 * 1000 // 10 minutes
    });
  }

  // Performance stats
  async getPerformanceStats() {
    return this.dataService.get(`${this.baseURL}/performance/stats`, {
      useCache: false // Always fresh for monitoring
    });
  }

  // Health check
  async getHealth() {
    return this.dataService.get(`${this.baseURL}/health`, {
      useCache: false,
      timeout: 5000 // 5 second timeout for health checks
    });
  }

  // Get service statistics
  getStats() {
    return this.dataService.getStats();
  }

  // Cache management
  clearCache() {
    this.dataService.clearCache();
  }

  invalidateCache(pattern?: string) {
    this.dataService.invalidateCache(pattern);
  }
}

// Export default instance
export const apiService = new OptimizedAPIService();

export default optimizedDataService;
