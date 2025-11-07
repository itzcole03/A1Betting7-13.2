export type MetricLabels = Record<string, string | number | boolean>;

export interface CounterHandle {
  inc(value?: number, labels?: MetricLabels): void;
  reset(labels?: MetricLabels): void;
}

export interface GaugeHandle {
  set(value: number, labels?: MetricLabels): void;
  inc(delta?: number, labels?: MetricLabels): void;
  reset(labels?: MetricLabels): void;
}

export interface HistogramHandle {
  observe(value: number, labels?: MetricLabels): void;
  reset(labels?: MetricLabels): void;
}

export interface HistogramValue {
  count: number;
  sum: number;
}

interface MetricsEventBase {
  name: string;
  labels: MetricLabels;
}

export interface CounterMetricEvent extends MetricsEventBase {
  type: 'counter';
  delta: number;
  total: number;
}

export interface GaugeMetricEvent extends MetricsEventBase {
  type: 'gauge';
  value: number;
  previousValue: number;
}

export interface HistogramMetricEvent extends MetricsEventBase {
  type: 'histogram';
  value: number;
  count: number;
  sum: number;
}

export interface TotalMetricEvent {
  type: 'total';
  name: string;
  delta: number;
  value: number;
}

export type MetricsEvent =
  | CounterMetricEvent
  | GaugeMetricEvent
  | HistogramMetricEvent
  | TotalMetricEvent;

export interface MetricsExporter {
  onCounter?(event: CounterMetricEvent): void;
  onGauge?(event: GaugeMetricEvent): void;
  onHistogram?(event: HistogramMetricEvent): void;
  onTotal?(event: TotalMetricEvent): void;
  onEvent?(event: MetricsEvent): void;
}

export declare class UnifiedMetrics {
  private static instance;
  private constructor();
  static getInstance(): UnifiedMetrics;
  static bindPrometheusExporter(
    exporterOrFactory?: MetricsExporter | null | (() => MetricsExporter | null | undefined),
    options?: {
      enabled?: boolean;
    }
  ): () => void;
  startOperation(operationName: string): void;
  endOperation(operationName: string, error?: unknown): void;
  recordMetric(name: string, value: number): void;
  counter(name: string): CounterHandle;
  gauge(name: string): GaugeHandle;
  histogram(name: string): HistogramHandle;
  getMetrics(): Record<string, number>;
  getCountersSnapshot(): Record<string, Record<string, number>>;
  getGaugesSnapshot(): Record<string, Record<string, number>>;
  getHistogramsSnapshot(): Record<string, Record<string, HistogramValue>>;
  resetMetrics(): void;
  bindExporter(exporter?: MetricsExporter | null): () => void;
  bindPrometheusExporter(
    exporterOrFactory?: MetricsExporter | null | (() => MetricsExporter | null | undefined),
    options?: {
      enabled?: boolean;
    }
  ): () => void;
}

export default UnifiedMetrics;
