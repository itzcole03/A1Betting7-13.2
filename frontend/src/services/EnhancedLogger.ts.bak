/**
 * Enhanced Structured Logging Service
 * Provides comprehensive logging with context, categorization, and actionable insights
 */

import { EnhancedRequestMetrics, StructuredLogEntry } from '../types/DataValidation';

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enableStorage: boolean;
  maxStoredEntries: number;
  enableMetrics: boolean;
  enablePerformanceTracking: boolean;
}

export interface LogQueryOptions {
  level?: 'debug' | 'info' | 'warn' | 'error';
  component?: string;
  operation?: string;
  sport?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export class EnhancedLogger {
  private config: LoggingConfig;
  private logEntries: StructuredLogEntry[] = [];
  private metrics: EnhancedRequestMetrics;

  constructor(config: Partial<LoggingConfig> = {}) {
    this.config = {
      level: 'info',
      enableConsole: true,
      enableStorage: true,
      maxStoredEntries: 1000,
      enableMetrics: true,
      enablePerformanceTracking: true,
      ...config,
    };

    this.metrics = this.initializeMetrics();
  }

  /**
   * Log a structured entry with full context
   */
  log(entry: Omit<StructuredLogEntry, 'timestamp'>): void {
    const fullEntry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      ...entry,
    };

    // Check log level
    if (!this.shouldLog(entry.level)) {
      return;
    }

    // Store entry if enabled
    if (this.config.enableStorage) {
      this.storeLogEntry(fullEntry);
    }

    // Console output if enabled
    if (this.config.enableConsole) {
      this.outputToConsole(fullEntry);
    }

    // Update metrics if enabled
    if (this.config.enableMetrics) {
      this.updateMetrics(fullEntry);
    }
  }

  /**
   * Convenience methods for different log levels
   */
  debug(component: string, operation: string, message: string, metadata: any = {}): void {
    this.log({
      level: 'debug',
      component,
      operation,
      message,
      metadata,
    });
  }

  info(component: string, operation: string, message: string, metadata: any = {}): void {
    this.log({
      level: 'info',
      component,
      operation,
      message,
      metadata,
    });
  }

  warn(
    component: string,
    operation: string,
    message: string,
    metadata: any = {},
    error?: Error
  ): void {
    this.log({
      level: 'warn',
      component,
      operation,
      message,
      metadata,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    });
  }

  error(
    component: string,
    operation: string,
    message: string,
    metadata: any = {},
    error?: Error
  ): void {
    this.log({
      level: 'error',
      component,
      operation,
      message,
      metadata,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: (error as any).code,
          }
        : undefined,
    });
  }

  /**
   * Log API request with performance tracking
   */
  logApiRequest(
    endpoint: string,
    method: string,
    params: any,
    duration: number,
    status: 'success' | 'error' | 'cached',
    metadata: any = {}
  ): void {
    this.log({
      level: status === 'error' ? 'error' : 'info',
      component: 'ApiClient',
      operation: 'request',
      message: `${method} ${endpoint} - ${status} (${duration}ms)`,
      metadata: {
        endpoint,
        method,
        params,
        duration,
        status,
        ...metadata,
      },
    });

    // Track slow queries
    if (this.config.enablePerformanceTracking && duration > 2000) {
      this.metrics.slowQueries.push({
        endpoint,
        duration,
        timestamp: Date.now(),
      });

      // Keep only last 50 slow queries
      if (this.metrics.slowQueries.length > 50) {
        this.metrics.slowQueries = this.metrics.slowQueries.slice(-50);
      }
    }
  }

  /**
   * Log data validation with quality metrics
   */
  logDataValidation(
    operation: string,
    sport: string,
    recordCount: number,
    validRecords: number,
    errors: number,
    qualityScore: number,
    duration: number,
    metadata: any = {}
  ): void {
    const level = errors > 0 ? 'warn' : 'info';

    this.log({
      level,
      component: 'DataValidator',
      operation,
      message: `Validated ${validRecords}/${recordCount} ${sport} records (quality: ${qualityScore}%, errors: ${errors})`,
      metadata: {
        sport,
        recordCount,
        validRecords,
        errors,
        qualityScore,
        duration,
        successRate: recordCount > 0 ? (validRecords / recordCount) * 100 : 0,
        ...metadata,
      },
    });
  }

  /**
   * Log cache operations
   */
  logCacheOperation(
    operation: 'hit' | 'miss' | 'set' | 'invalidate' | 'clear',
    cacheKey: string,
    metadata: any = {}
  ): void {
    this.debug('CacheManager', 'cache', `Cache ${operation}: ${cacheKey}`, {
      cacheKey,
      operation,
      ...metadata,
    });
  }

  /**
   * Query stored log entries
   */
  queryLogs(options: LogQueryOptions = {}): StructuredLogEntry[] {
    let filtered = [...this.logEntries];

    if (options.level) {
      const levelPriority = { debug: 0, info: 1, warn: 2, error: 3 };
      const minPriority = levelPriority[options.level];
      filtered = filtered.filter(entry => levelPriority[entry.level] >= minPriority);
    }

    if (options.component) {
      filtered = filtered.filter(entry => entry.component === options.component);
    }

    if (options.operation) {
      filtered = filtered.filter(entry => entry.operation === options.operation);
    }

    if (options.sport) {
      filtered = filtered.filter(entry => entry.metadata.sport === options.sport);
    }

    if (options.startTime) {
      filtered = filtered.filter(
        entry => new Date(entry.timestamp).getTime() >= options.startTime!
      );
    }

    if (options.endTime) {
      filtered = filtered.filter(entry => new Date(entry.timestamp).getTime() <= options.endTime!);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  /**
   * Get current metrics
   */
  getMetrics(): EnhancedRequestMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent errors with context
   */
  getRecentErrors(limit: number = 10): StructuredLogEntry[] {
    return this.queryLogs({ level: 'error', limit });
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    avgResponseTime: number;
    slowQueriesCount: number;
    errorRate: number;
    cacheHitRate: number;
  } {
    const totalRequests = this.metrics.totalRequests;
    const errorRate = totalRequests > 0 ? (this.metrics.errors / totalRequests) * 100 : 0;
    const cacheHitRate = totalRequests > 0 ? (this.metrics.cacheHits / totalRequests) * 100 : 0;

    return {
      avgResponseTime: this.metrics.avgResponseTime,
      slowQueriesCount: this.metrics.slowQueries.length,
      errorRate,
      cacheHitRate,
    };
  }

  /**
   * Clear old logs to prevent memory issues
   */
  clearOldLogs(olderThanMs: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - olderThanMs;
    this.logEntries = this.logEntries.filter(
      entry => new Date(entry.timestamp).getTime() > cutoffTime
    );
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }

  // Private methods

  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levelPriority = { debug: 0, info: 1, warn: 2, error: 3 };
    return levelPriority[level] >= levelPriority[this.config.level];
  }

  private storeLogEntry(entry: StructuredLogEntry): void {
    this.logEntries.push(entry);

    // Maintain max entries limit
    if (this.logEntries.length > this.config.maxStoredEntries) {
      this.logEntries = this.logEntries.slice(-this.config.maxStoredEntries);
    }
  }

  private outputToConsole(entry: StructuredLogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.component}:${
      entry.operation
    }]`;

    const logMethod =
      entry.level === 'error'
        ? console.error
        : entry.level === 'warn'
        ? console.warn
        : entry.level === 'debug'
        ? console.debug
        : console.log;

    if (entry.error) {
      logMethod(`${prefix} ${entry.message}`, {
        metadata: entry.metadata,
        error: entry.error,
      });
    } else {
      logMethod(`${prefix} ${entry.message}`, entry.metadata);
    }
  }

  private updateMetrics(entry: StructuredLogEntry): void {
    // Update basic metrics
    if (entry.metadata.duration) {
      this.metrics.totalRequests++;

      // Update average response time
      this.metrics.avgResponseTime =
        (this.metrics.avgResponseTime * (this.metrics.totalRequests - 1) +
          entry.metadata.duration) /
        this.metrics.totalRequests;
    }

    // Update cache metrics
    if (entry.operation === 'cache') {
      if (entry.message.includes('hit')) {
        this.metrics.cacheHits++;
      } else if (entry.message.includes('miss')) {
        this.metrics.cacheMisses++;
      }
    }

    // Update error metrics
    if (entry.level === 'error') {
      this.metrics.errors++;

      // Categorize by error type
      if (entry.error?.name) {
        this.metrics.errorsByType[entry.error.name] =
          (this.metrics.errorsByType[entry.error.name] || 0) + 1;
      }

      // Categorize by endpoint
      if (entry.metadata.endpoint) {
        this.metrics.errorsByEndpoint[entry.metadata.endpoint] =
          (this.metrics.errorsByEndpoint[entry.metadata.endpoint] || 0) + 1;
      }
    }

    // Update validation metrics
    if (entry.component === 'DataValidator') {
      if (entry.metadata.dataQuality !== undefined) {
        // Update average data quality score
        const currentCount = this.metrics.dataQualityScore === 0 ? 0 : 1;
        this.metrics.dataQualityScore =
          (this.metrics.dataQualityScore * currentCount + entry.metadata.dataQuality) /
          (currentCount + 1);
      }

      if (entry.metadata.errorsCount) {
        this.metrics.validationErrors += entry.metadata.errorsCount;
      }

      if (entry.metadata.fallbacksUsed && Array.isArray(entry.metadata.fallbacksUsed)) {
        this.metrics.fallbacksUsed += entry.metadata.fallbacksUsed.length;
      }
    }

    this.metrics.lastUpdate = Date.now();
  }

  private initializeMetrics(): EnhancedRequestMetrics {
    return {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      avgResponseTime: 0,
      dataQualityScore: 0,
      validationErrors: 0,
      fallbacksUsed: 0,
      transformationErrors: 0,
      slowQueries: [],
      errorsByType: {},
      errorsByEndpoint: {},
      lastUpdate: Date.now(),
    };
  }
}

// Export singleton instance
export const enhancedLogger = new EnhancedLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  enableConsole: true,
  enableStorage: true,
  maxStoredEntries: 1000,
  enableMetrics: true,
  enablePerformanceTracking: true,
});
