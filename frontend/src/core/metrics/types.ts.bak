import type { PrometheusExportOptions as ExporterPrometheusOptions } from './prometheus_exporter';

export type MetricTags = Record<string, string | number | boolean>;

export interface HistogramSnapshotEntry {
  count: number;
  sum: number;
}

export interface MetricsSnapshot {
  totals: Record<string, number>;
  counters: Record<string, Record<string, number>>;
  gauges: Record<string, Record<string, number>>;
  histograms: Record<string, Record<string, HistogramSnapshotEntry>>;
}

export type PrometheusExportOptions = ExporterPrometheusOptions;

export interface UnifiedMetrics {
  track: (name: string, value?: number, tags?: MetricTags) => void;
  increment: (name: string, value?: number, tags?: MetricTags) => void;
  gauge: (name: string, value: number, tags?: MetricTags) => void;
  timing: (name: string, value: number, tags?: MetricTags) => void;
  histogram: (name: string, value: number, tags?: MetricTags) => void;
  time: <T>(name: string, fn: () => T | Promise<T>, tags?: MetricTags) => T | Promise<T>;
  getSnapshot: () => MetricsSnapshot;
  reset: () => void;
  exportPrometheus?: (options?: PrometheusExportOptions) => string;
}
