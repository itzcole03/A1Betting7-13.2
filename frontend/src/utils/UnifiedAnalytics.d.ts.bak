type AnalyticsData = Record<string, unknown>;
export interface AnalyticsEvent {
  id: string;
  type: string;
  timestamp: number;
  data: AnalyticsData;
  metadata?: AnalyticsData;
}
interface AnalyticsMetrics {
  totalEvents: number;
  eventsByType: Map<string, number>;
  averageLatency: number;
  errorRate: number;
  lastProcessed: number;
}
interface AnalyticsConfig {
  enabled: boolean;
  sampleRate: number;
  retentionPeriod: number;
  batchSize: number;
  flushInterval: number;
}
export declare class UnifiedAnalytics {
  private static instance: UnifiedAnalytics;
  private readonly eventBus;
  private readonly monitor;
  private readonly eventQueue;
  private readonly metrics;
  private config;
  private flushTimer;
  private constructor();
  static getInstance(): UnifiedAnalytics;
  private setupEventListeners;
  private startFlushTimer;
  trackEvent(type: string, data: AnalyticsData, metadata?: AnalyticsData): void;
  private updateMetrics;
  private flushEvents;
  /**
   * Process and send analytics events to the backend analytics service.
   * Formats events, sends them via fetch, and updates metrics.
   * Falls back to local logging if the service is unavailable.
   */
  private processEvents;
  getMetrics(): AnalyticsMetrics;
  updateConfig(updates: Partial<AnalyticsConfig>): void;
  cleanup(): Promise<void>;
}
