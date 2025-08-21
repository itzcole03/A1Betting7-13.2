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

export interface EnhancedRequestMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  errors: number;
  avgResponseTime: number;
  dataQualityScore: number;
  validationErrors: number;
  fallbacksUsed: number;
  transformationErrors: number;
  slowQueries: any[];
  errorsByType: Record<string, number>;
  errorsByEndpoint: Record<string, number>;
  lastUpdate: number;
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
  debug(component: string, operation: string, message: string, data?: Record<string, unknown>, err?: Error) {
    const meta = { ...(data || {}), ...(err ? { error: { name: err.name, message: err.message, stack: err.stack } } : {}) } as Record<string, unknown>;
    logger.debug(`[${component}:${operation}] ${message}`, meta);
  }

  info(component: string, operation: string, message: string, data?: Record<string, unknown>, err?: Error) {
    const meta = { ...(data || {}), ...(err ? { error: { name: err.name, message: err.message } } : {}) } as Record<string, unknown>;
    logger.info(`[${component}:${operation}] ${message}`, meta);
  }

  warn(component: string, operation: string, message: string, data?: Record<string, unknown>, err?: Error) {
    const meta = { ...(data || {}), ...(err ? { error: { name: err.name, message: err.message } } : {}) } as Record<string, unknown>;
    logger.warn(`[${component}:${operation}] ${message}`, meta);
  }

  error(component: string, operation: string, message: string, data?: Record<string, unknown>, err?: Error) {
    const meta = { ...(data || {}), ...(err ? { error: { name: err.name, message: err.message, stack: err.stack } } : {}) } as Record<string, unknown>;
    logger.error(`[${component}:${operation}] ${message}`, meta);
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
    // Build EnhancedMetrics
    const memoryUsage = (() => {
      try {
        const perf = typeof performance !== 'undefined' ? (performance as unknown as { memory?: { usedJSHeapSize?: number }}) : undefined;
        return perf?.memory?.usedJSHeapSize;
      } catch {
        return undefined;
      }
    })();

    const enhanced: EnhancedMetrics = {
      cache: { ...this.cacheMetrics },
      api: { ...this.apiMetrics },
      uptime: Date.now() - this.startTime,
      memoryUsage: memoryUsage,
    };

    return enhanced;
  }

  /**
   * Compatibility: return metrics shaped like EnhancedRequestMetrics for services expecting that shape
   */
  getRequestMetrics(): EnhancedRequestMetrics {
  const now = Date.now();
  const requestMetrics: EnhancedRequestMetrics = {
      totalRequests: this.apiMetrics.totalRequests,
      cacheHits: this.cacheMetrics.hits,
      cacheMisses: this.cacheMetrics.misses,
      errors: this.apiMetrics.errorRequests || 0,
      avgResponseTime: this.apiMetrics.averageResponseTime,
      dataQualityScore: 0,
      validationErrors: 0,
      fallbacksUsed: 0,
      transformationErrors: 0,
      slowQueries: [],
      errorsByType: {},
      errorsByEndpoint: {},
      lastUpdate: now,
    };

    return requestMetrics;
  }

  /**
   * Log data validation metrics and context
   */
  logDataValidation(
    operation: string,
    sport: string,
    total: number,
    validated: number,
    errorsCount: number,
    averageQuality: number,
    duration: number,
    metadata?: Record<string, unknown>,
    err?: Error
  ) {
    this.info('DataValidator', operation, `Validation summary for ${sport}: ${validated}/${total} valid`, {
      sport,
      total,
      validated,
      errorsCount,
      averageQuality,
      duration,
      ...metadata,
    }, err);
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