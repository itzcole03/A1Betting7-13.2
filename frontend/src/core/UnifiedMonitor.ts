import { PerformanceMonitor } from '@/unified/PerformanceMonitor';

/**
 * UnifiedMonitor
 *
 * Singleton monitoring/metrics interface for the A1Betting platform frontend.
 * Wraps PerformanceMonitor and exposes a compatible API for feature flags, adapters, and analytics.
 *
 * Usage:
 *   const monitor = UnifiedMonitor.getInstance();
 *   const trace = monitor.startTrace('my-trace');
 *   monitor.endTrace(trace);
 *   monitor.recordMetric('my_metric', 1, { meta: 'data' });
 */
export class UnifiedMonitor {
  private static instance: UnifiedMonitor;
  private readonly perf: PerformanceMonitor;

  private constructor() {
    this.perf = PerformanceMonitor.getInstance();
  }

  /**
   * Get the singleton instance of UnifiedMonitor.
   */
  public static getInstance(): UnifiedMonitor {
    if (!UnifiedMonitor.instance) {
      UnifiedMonitor.instance = new UnifiedMonitor();
    }
    return UnifiedMonitor.instance;
  }

  /**
   * Start a new trace.
   * @param name The trace name
   * @param category Optional category
   * @param description Optional description
   * @returns The trace ID
   */
  public startTrace(name: string, category?: string, description?: string): string {
    // Optionally use category/description in metadata
    return this.perf.startTrace(name, { category, description });
  }

  /**
   * End a trace.
   * @param traceId The trace ID
   * @param error Optional error
   */
  public endTrace(traceId: string, error?: Error): void {
    this.perf.endTrace(traceId, error);
  }

  /**
   * Record a metric.
   * @param name Metric name
   * @param value Metric value
   * @param metadata Optional metadata
   */
  public recordMetric(name: string, value: number, metadata?: Record<string, unknown>): void {
    this.perf.trackMetric(name, value, metadata);
  }
}

// Optionally provide a default export for legacy usage
export const unifiedMonitor = UnifiedMonitor.getInstance();
