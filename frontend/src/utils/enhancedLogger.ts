/**
 * Enhanced logger with specific methods for cache operations, API requests, and metrics
 * Used by EnhancedDataManager and other services
 */

import { logger } from './logger';

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  invalidations: number;
  hitRate: number;
}

export interface ApiMetrics {
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  averageResponseTime: number;
}

export interface EnhancedMetrics {
  cache: CacheMetrics;
  api: ApiMetrics;
  uptime: number;
  memoryUsage?: number;
}

class EnhancedLogger {
  private cacheMetrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    invalidations: 0,
    hitRate: 0
  };

  private apiMetrics: ApiMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    errorRequests: 0,
    averageResponseTime: 0
  };

  private responseTimes: number[] = [];
  private startTime = Date.now();

  /**
   * Standard logging methods with enhanced context
   */
  debug(component: string, operation: string, message: string, data?: unknown) {
    logger.debug(`[${component}:${operation}] ${message}`, data);
  }

  info(component: string, operation: string, message: string, data?: unknown) {
    logger.info(`[${component}:${operation}] ${message}`, data);
  }

  warn(component: string, operation: string, message: string, data?: unknown) {
    logger.warn(`[${component}:${operation}] ${message}`, data);
  }

  error(component: string, operation: string, message: string, data?: unknown) {
    logger.error(`[${component}:${operation}] ${message}`, data);
  }

  /**
   * Cache operation logging
   */
  logCacheOperation(operation: 'hit' | 'miss' | 'set' | 'invalidate', key: string, metadata?: Record<string, unknown>) {
    switch (operation) {
      case 'hit':
        this.cacheMetrics.hits++;
        break;
      case 'miss':
        this.cacheMetrics.misses++;
        break;
      case 'set':
        this.cacheMetrics.sets++;
        break;
      case 'invalidate':
        this.cacheMetrics.invalidations++;
        break;
    }

    // Update hit rate
    const total = this.cacheMetrics.hits + this.cacheMetrics.misses;
    this.cacheMetrics.hitRate = total > 0 ? this.cacheMetrics.hits / total : 0;

    this.debug('Cache', operation, `Cache ${operation} for key: ${key}`, {
      key,
      operation,
      ...metadata,
      currentHitRate: this.cacheMetrics.hitRate.toFixed(2)
    });
  }

  /**
   * API request logging with metrics tracking
   */
  logApiRequest(
    endpoint: string, 
    method: string, 
    params: Record<string, unknown>, 
    duration: number, 
    status: 'success' | 'error' | 'cached', 
    metadata?: Record<string, unknown>
  ) {
    if (status !== 'cached') {
      this.apiMetrics.totalRequests++;
      
      if (status === 'success') {
        this.apiMetrics.successfulRequests++;
        this.responseTimes.push(duration);
        
        // Keep only last 100 response times for average calculation
        if (this.responseTimes.length > 100) {
          this.responseTimes = this.responseTimes.slice(-100);
        }
        
        // Update average response time
        this.apiMetrics.averageResponseTime = 
          this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
      } else if (status === 'error') {
        this.apiMetrics.errorRequests++;
      }
    }

    const logLevel = status === 'error' ? 'warn' : 'debug';
    this[logLevel]('API', 'request', `${method} ${endpoint} - ${status}`, {
      endpoint,
      method,
      params,
      duration: `${duration}ms`,
      status,
      ...metadata
    });
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics(): EnhancedMetrics {
    return {
      cache: { ...this.cacheMetrics },
      api: { ...this.apiMetrics },
      uptime: Date.now() - this.startTime,
      memoryUsage: typeof performance !== 'undefined' && performance.memory ? 
        performance.memory.usedJSHeapSize : undefined
    };
  }

  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics() {
    this.cacheMetrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      invalidations: 0,
      hitRate: 0
    };

    this.apiMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      errorRequests: 0,
      averageResponseTime: 0
    };

    this.responseTimes = [];
    this.startTime = Date.now();
  }
}

export const enhancedLogger = new EnhancedLogger();