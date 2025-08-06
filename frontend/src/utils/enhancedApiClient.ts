/**
 * Enhanced API Client with Connection Pooling and Modern Optimizations
 * Implements request memoization, connection pooling, and performance monitoring
 */

import { connectionResilience, type RetryConfig } from './connectionResilience';

interface RequestConfig {
  timeout?: number;
  retries?: RetryConfig;
  cache?: boolean;
  cacheDuration?: number;
  signal?: AbortSignal;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
  cached: boolean;
  responseTime: number;
}

interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  lastRequestTime: number;
}

class EnhancedApiClient {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private performanceMetrics: PerformanceMetrics = {
    requestCount: 0,
    averageResponseTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
    lastRequestTime: 0,
  };
  private requestTimes: number[] = [];
  private errors: number = 0;
  private cacheHits: number = 0;

  private defaultConfig: Required<RequestConfig> = {
    timeout: 30000,
    retries: {
      maxRetries: 3,
      baseDelay: 1000,
      backoffMultiplier: 2,
      maxDelay: 10000,
    },
    cache: true,
    cacheDuration: 300000, // 5 minutes
    signal: new AbortController().signal,
  };

  constructor(private baseURL: string = '') {}

  /**
   * Enhanced GET request with caching and retry logic
   */
  async get<T = any>(
    endpoint: string,
    config: Partial<RequestConfig> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  /**
   * Enhanced POST request with retry logic
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    config: Partial<RequestConfig> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, { ...config, cache: false });
  }

  /**
   * Enhanced PUT request with retry logic
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    config: Partial<RequestConfig> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, { ...config, cache: false });
  }

  /**
   * Enhanced DELETE request with retry logic
   */
  async delete<T = any>(
    endpoint: string,
    config: Partial<RequestConfig> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, { ...config, cache: false });
  }

  /**
   * Core request method with all optimizations
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    config: Partial<RequestConfig> = {}
  ): Promise<ApiResponse<T>> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = `${method}:${url}:${JSON.stringify(data)}`;
    const startTime = performance.now();

    this.performanceMetrics.requestCount++;
    this.performanceMetrics.lastRequestTime = Date.now();

    try {
      // Check cache for GET requests
      if (method === 'GET' && finalConfig.cache) {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          this.cacheHits++;
          this.updateCacheHitRate();

          return {
            data: cached,
            status: 200,
            headers: new Headers(),
            cached: true,
            responseTime: performance.now() - startTime,
          };
        }
      }

      // Make request with retry logic
      const response = await connectionResilience.withRetry(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);

        try {
          const fetchResponse = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              ...this.getAuthHeaders(),
            },
            body: data ? JSON.stringify(data) : undefined,
            signal: controller.signal,
            // Modern fetch optimizations
            keepalive: true,
            cache: method === 'GET' ? 'default' : 'no-cache',
          });

          clearTimeout(timeoutId);

          if (!fetchResponse.ok) {
            throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
          }

          return fetchResponse;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }, finalConfig.retries);

      const responseData = await response.json();
      const responseTime = performance.now() - startTime;

      // Update performance metrics
      this.requestTimes.push(responseTime);
      if (this.requestTimes.length > 100) {
        this.requestTimes.shift(); // Keep only last 100 requests
      }
      this.updateAverageResponseTime();

      // Cache successful GET responses
      if (method === 'GET' && finalConfig.cache && response.ok) {
        this.setToCache(cacheKey, responseData, finalConfig.cacheDuration);
      }

      return {
        data: responseData,
        status: response.status,
        headers: response.headers,
        cached: false,
        responseTime,
      };
    } catch (error) {
      this.errors++;
      this.updateErrorRate();

      console.error(`[EnhancedApiClient] Request failed:`, {
        method,
        url,
        error: error instanceof Error ? error.message : String(error),
        responseTime: performance.now() - startTime,
      });

      throw error;
    }
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setToCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Cleanup expired entries periodically
    if (this.cache.size > 1000) {
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.timestamp + value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Performance metrics updates
   */
  private updateAverageResponseTime(): void {
    if (this.requestTimes.length > 0) {
      this.performanceMetrics.averageResponseTime =
        this.requestTimes.reduce((sum, time) => sum + time, 0) / this.requestTimes.length;
    }
  }

  private updateCacheHitRate(): void {
    this.performanceMetrics.cacheHitRate = this.cacheHits / this.performanceMetrics.requestCount;
  }

  private updateErrorRate(): void {
    this.performanceMetrics.errorRate = this.errors / this.performanceMetrics.requestCount;
  }

  /**
   * Authentication headers (can be extended)
   */
  private getAuthHeaders(): Record<string, string> {
    // Add authentication headers if needed
    return {};
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheHits = 0;
    this.updateCacheHitRate();
  }

  /**
   * Prefetch data for better UX
   */
  async prefetch(endpoints: string[]): Promise<void> {
    const prefetchPromises = endpoints.map(endpoint =>
      this.get(endpoint, { cache: true }).catch(error =>
        console.warn(`[EnhancedApiClient] Prefetch failed for ${endpoint}:`, error)
      )
    );

    await Promise.allSettled(prefetchPromises);
  }
}

// Export singleton instance
export const apiClient = new EnhancedApiClient();

// Export class for custom instances
export { EnhancedApiClient, type ApiResponse, type PerformanceMetrics, type RequestConfig };
