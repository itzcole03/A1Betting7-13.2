/**
 * WebVitals Pipeline Frontend Client
 * 
 * Provides comprehensive web vitals and metrics collection for frontend:
 * - Core Web Vitals tracking (LCP, FID, CLS, TTFB)
 * - Custom metrics collection
 * - Performance API integration
 * - Offline queue with retry logic
 * - Automatic flush on visibilitychange and periodic intervals
 * - Integration with backend /api/metrics/v1 endpoint
 */

// Types for metrics
export interface WebVitalsMetric {
  name: string;
  value: number;
  id: string;
  delta?: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  timestamp?: number;
}

export interface CustomMetric {
  name: string;
  value: number;
  type: 'counter' | 'gauge' | 'histogram' | 'timing';
  tags?: Record<string, string>;
  timestamp?: number;
}

export interface MetricsBatch {
  session_id: string;
  page_url: string;
  user_agent: string;
  web_vitals: WebVitalsMetric[];
  custom_metrics: CustomMetric[];
  performance_entries: PerformanceEntry[];
  timestamp: number;
}

export interface WebVitalsConfig {
  endpoint?: string;
  flushInterval?: number;
  maxBufferSize?: number;
  enableRetry?: boolean;
  maxRetries?: number;
  enableWebVitals?: boolean;
  enablePerformanceAPI?: boolean;
  debug?: boolean;
}

class WebVitalsCollector {
  private sessionId: string;
  private config: WebVitalsConfig;
  private buffer: MetricsBatch;
  private flushTimer?: number;
  private retryQueue: MetricsBatch[] = [];
  private isOnline: boolean = navigator.onLine;
  private flushInProgress: boolean = false;

  constructor(config: WebVitalsConfig = {}) {
    this.sessionId = this.generateSessionId();
    this.config = {
      endpoint: '/api/metrics/v1',
      flushInterval: 30000, // 30 seconds
      maxBufferSize: 100,
      enableRetry: true,
      maxRetries: 3,
      enableWebVitals: true,
      enablePerformanceAPI: true,
      debug: false,
      ...config
    };

    this.buffer = this.createEmptyBatch();
    this.setupEventListeners();
    this.startPeriodicFlush();

    if (this.config.enableWebVitals) {
      this.initWebVitals();
    }

    if (this.config.enablePerformanceAPI) {
      this.initPerformanceAPI();
    }

    this.debug('Collector initialized with session:', this.sessionId);
  }

  private debug(...args: unknown[]): void {
    if (this.config.debug && process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[WebVitals]', ...args);
    }
  }

  private warn(...args: unknown[]): void {
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.warn('[WebVitals]', ...args);
    }
  }

  private error(...args: unknown[]): void {
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.error('[WebVitals]', ...args);
    }
  }

  private generateSessionId(): string {
    return `wv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createEmptyBatch(): MetricsBatch {
    return {
      session_id: this.sessionId,
      page_url: window.location.href,
      user_agent: navigator.userAgent,
      web_vitals: [],
      custom_metrics: [],
      performance_entries: [],
      timestamp: Date.now()
    };
  }

  private setupEventListeners(): void {
    // Flush on page visibility change (tab switch, minimize, close)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });

    // Flush before page unload
    window.addEventListener('beforeunload', () => {
      this.flushSync();
    });

    // Handle online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processRetryQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private startPeriodicFlush(): void {
    if (this.config.flushInterval! > 0) {
      this.flushTimer = window.setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }

  private async initWebVitals(): Promise<void> {
    try {
      const { onCLS, onFID, onLCP, onTTFB } = await import('web-vitals');

      // Largest Contentful Paint
      onLCP((metric) => {
        this.recordWebVital({
          name: 'LCP',
          value: metric.value,
          id: metric.id,
          delta: metric.delta,
          rating: metric.rating
        });
      });

      // First Input Delay
      onFID((metric) => {
        this.recordWebVital({
          name: 'FID',
          value: metric.value,
          id: metric.id,
          delta: metric.delta,
          rating: metric.rating
        });
      });

      // Cumulative Layout Shift
      onCLS((metric) => {
        this.recordWebVital({
          name: 'CLS',
          value: metric.value,
          id: metric.id,
          delta: metric.delta,
          rating: metric.rating
        });
      });

      // Time to First Byte
      onTTFB((metric) => {
        this.recordWebVital({
          name: 'TTFB',
          value: metric.value,
          id: metric.id,
          delta: metric.delta,
          rating: metric.rating
        });
      });

      this.debug('Core Web Vitals tracking initialized');
    } catch (err) {
      this.warn('Failed to initialize web-vitals library:', err);
      this.recordCustomMetric({
        name: 'webvitals_init_error',
        value: 1,
        type: 'counter',
        tags: { error: String(err) }
      });
    }
  }

  private initPerformanceAPI(): void {
    if (typeof PerformanceObserver === 'undefined') {
      this.warn('PerformanceObserver not available');
      return;
    }

    try {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.buffer.performance_entries.push(entry.toJSON());
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });

      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.buffer.performance_entries.push(entry.toJSON());
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });

      // Observe user timing
      const userObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.buffer.performance_entries.push(entry.toJSON());
        }
      });
      userObserver.observe({ entryTypes: ['measure'] });

      this.debug('Performance API observers initialized');
    } catch (err) {
      this.warn('Failed to initialize Performance API:', err);
    }
  }

  /**
   * Record a Web Vitals metric
   */
  public recordWebVital(metric: WebVitalsMetric): void {
    metric.timestamp = metric.timestamp || Date.now();
    this.buffer.web_vitals.push(metric);

    this.debug(`Recorded ${metric.name}: ${metric.value} (${metric.rating})`);

    this.checkBufferSize();
  }

  /**
   * Record a custom metric
   */
  public recordCustomMetric(metric: CustomMetric): void {
    metric.timestamp = metric.timestamp || Date.now();
    this.buffer.custom_metrics.push(metric);

    this.debug(`Recorded custom metric ${metric.name}: ${metric.value}`);

    this.checkBufferSize();
  }

  /**
   * Record a fallback occurrence
   */
  public recordFallback(
    fallbackType: string,
    reason: string,
    service: string = 'unknown',
    severity: string = 'info'
  ): void {
    this.recordCustomMetric({
      name: 'fallback_occurrence',
      value: 1,
      type: 'counter',
      tags: {
        fallback_type: fallbackType,
        reason: reason,
        service: service,
        severity: severity
      }
    });
  }

  /**
   * Record a validation failure
   */
  public recordValidationFailure(
    category: 'navigation' | 'connectivity' | 'data_freshness' | 'validation',
    failureType: string,
    details: string = '',
    field?: string
  ): void {
    this.recordCustomMetric({
      name: 'validation_failure',
      value: 1,
      type: 'counter',
      tags: {
        validation_category: category,
        failure_type: failureType,
        details: details.substring(0, 100), // Truncate details
        field: field || 'unknown'
      }
    });
  }

  /**
   * Record navigation failure
   */
  public recordNavigationFailure(
    route: string,
    errorType: string,
    errorMessage: string = '',
    component?: string
  ): void {
    this.recordValidationFailure(
      'navigation',
      errorType,
      `Route: ${route}, Component: ${component}, Error: ${errorMessage}`,
      'route'
    );
  }

  /**
   * Record connectivity failure
   */
  public recordConnectivityFailure(
    service: string,
    endpoint: string,
    errorType: string,
    statusCode?: number,
    timeoutMs?: number
  ): void {
    const details = [
      `Service: ${service}`,
      `Endpoint: ${endpoint}`,
      statusCode ? `Status: ${statusCode}` : '',
      timeoutMs ? `Timeout: ${timeoutMs}ms` : ''
    ].filter(Boolean).join(', ');

    this.recordValidationFailure('connectivity', errorType, details, 'endpoint');
  }

  /**
   * Record data freshness failure
   */
  public recordDataFreshnessFailure(
    dataType: string,
    ageSeconds: number,
    thresholdSeconds: number,
    source: string = 'unknown'
  ): void {
    this.recordValidationFailure(
      'data_freshness',
      'stale_data',
      `Data age: ${ageSeconds}s exceeds threshold: ${thresholdSeconds}s`,
      'data_type'
    );

    // Also record as timing metric
    this.recordCustomMetric({
      name: 'data_age_seconds',
      value: ageSeconds,
      type: 'histogram',
      tags: {
        data_type: dataType,
        source: source,
        is_stale: String(ageSeconds > thresholdSeconds)
      }
    });
  }

  /**
   * Record performance timing
   */
  public recordPerformanceTiming(
    name: string,
    durationMs: number,
    tags: Record<string, string> = {}
  ): void {
    this.recordCustomMetric({
      name: name,
      value: durationMs,
      type: 'timing',
      tags: { unit: 'ms', ...tags }
    });
  }

  private checkBufferSize(): void {
    const totalMetrics = this.buffer.web_vitals.length + 
                        this.buffer.custom_metrics.length + 
                        this.buffer.performance_entries.length;

    if (totalMetrics >= this.config.maxBufferSize!) {
      this.flush();
    }
  }

  /**
   * Manually flush all buffered metrics
   */
  public async flush(): Promise<void> {
    if (this.flushInProgress || this.isBufferEmpty()) {
      return;
    }

    this.flushInProgress = true;

    try {
      const batch = { ...this.buffer };
      this.buffer = this.createEmptyBatch();

      if (this.isOnline) {
        await this.sendBatch(batch);
      } else {
        this.addToRetryQueue(batch);
      }
    } catch (err) {
      this.error('Error during flush:', err);
    } finally {
      this.flushInProgress = false;
    }
  }

  /**
   * Synchronous flush for page unload
   */
  public flushSync(): void {
    if (this.isBufferEmpty()) {
      return;
    }

    const batch = { ...this.buffer };
    this.buffer = this.createEmptyBatch();

    // Use sendBeacon for reliable delivery during page unload
    try {
      const data = JSON.stringify(batch);
      const success = navigator.sendBeacon(this.config.endpoint!, data);
      
      if (!success) {
        this.warn('sendBeacon failed, metrics may be lost');
      }
    } catch (err) {
      this.error('Error in sync flush:', err);
    }
  }

  private isBufferEmpty(): boolean {
    return this.buffer.web_vitals.length === 0 && 
           this.buffer.custom_metrics.length === 0 && 
           this.buffer.performance_entries.length === 0;
  }

  private async sendBatch(batch: MetricsBatch): Promise<void> {
    try {
      const response = await fetch(this.config.endpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.debug(`Batch sent successfully: ${result.metrics_count} metrics`);
    } catch (err) {
      this.error('Failed to send batch:', err);
      
      if (this.config.enableRetry) {
        this.addToRetryQueue(batch);
      }
      
      // Record the failure as a metric
      this.recordConnectivityFailure(
        'webvitals_pipeline',
        this.config.endpoint!,
        'send_failure',
        undefined,
        undefined
      );
      
      throw err;
    }
  }

  private addToRetryQueue(batch: MetricsBatch): void {
    this.retryQueue.push(batch);
    
    // Limit retry queue size
    if (this.retryQueue.length > 10) {
      this.retryQueue.shift();
      this.warn('Retry queue full, dropping oldest batch');
    }
  }

  private async processRetryQueue(): Promise<void> {
    while (this.retryQueue.length > 0 && this.isOnline) {
      const batch = this.retryQueue.shift()!;
      
      try {
        await this.sendBatch(batch);
      } catch {
        // Put back at beginning of queue for retry
        this.retryQueue.unshift(batch);
        break;
      }
    }
  }

  /**
   * Get collector statistics
   */
  public getStats(): {
    session_id: string;
    buffer_size: number;
    retry_queue_size: number;
    is_online: boolean;
    flush_in_progress: boolean;
    config: WebVitalsConfig;
  } {
    return {
      session_id: this.sessionId,
      buffer_size: this.buffer.web_vitals.length + 
                   this.buffer.custom_metrics.length + 
                   this.buffer.performance_entries.length,
      retry_queue_size: this.retryQueue.length,
      is_online: this.isOnline,
      flush_in_progress: this.flushInProgress,
      config: this.config
    };
  }

  /**
   * Destroy the collector and clean up resources
   */
  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // Final flush
    this.flushSync();
    
    this.debug('Collector destroyed');
  }
}

// Global instance
let globalCollector: WebVitalsCollector | null = null;

/**
 * Initialize the global WebVitals collector
 */
export function initWebVitals(config: WebVitalsConfig = {}): WebVitalsCollector {
  if (globalCollector) {
    globalCollector.destroy();
  }
  
  globalCollector = new WebVitalsCollector(config);
  return globalCollector;
}

/**
 * Get the global WebVitals collector
 */
export function getWebVitals(): WebVitalsCollector | null {
  return globalCollector;
}

/**
 * Convenience functions for common operations
 */
export const webvitals = {
  recordFallback: (fallbackType: string, reason: string, service?: string, severity?: string) => {
    globalCollector?.recordFallback(fallbackType, reason, service, severity);
  },
  
  recordValidationFailure: (
    category: 'navigation' | 'connectivity' | 'data_freshness' | 'validation', 
    failureType: string, 
    details?: string, 
    field?: string
  ) => {
    globalCollector?.recordValidationFailure(category, failureType, details, field);
  },
  
  recordNavigationFailure: (route: string, errorType: string, errorMessage?: string, component?: string) => {
    globalCollector?.recordNavigationFailure(route, errorType, errorMessage, component);
  },
  
  recordConnectivityFailure: (service: string, endpoint: string, errorType: string, statusCode?: number) => {
    globalCollector?.recordConnectivityFailure(service, endpoint, errorType, statusCode);
  },
  
  recordDataFreshnessFailure: (dataType: string, ageSeconds: number, thresholdSeconds: number, source?: string) => {
    globalCollector?.recordDataFreshnessFailure(dataType, ageSeconds, thresholdSeconds, source);
  },
  
  recordPerformanceTiming: (name: string, durationMs: number, tags?: Record<string, string>) => {
    globalCollector?.recordPerformanceTiming(name, durationMs, tags);
  },
  
  recordCustomMetric: (metric: CustomMetric) => {
    globalCollector?.recordCustomMetric(metric);
  },
  
  flush: () => {
    return globalCollector?.flush();
  },
  
  getStats: () => {
    return globalCollector?.getStats();
  }
};

export default WebVitalsCollector;