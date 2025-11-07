import { isTelemetryAllowed } from './TelemetryGate';

type MetricLabels = Record<string, string | number | boolean>;
type CounterMap = Map<string, number>;
type GaugeMap = Map<string, number>;
type HistogramValue = { count: number; sum: number };
type HistogramMap = Map<string, HistogramValue>;

interface CounterHandle {
  inc(value?: number, labels?: MetricLabels): void;
  reset(labels?: MetricLabels): void;
}

interface GaugeHandle {
  set(value: number, labels?: MetricLabels): void;
  inc(delta?: number, labels?: MetricLabels): void;
  reset(labels?: MetricLabels): void;
}

interface HistogramHandle {
  observe(value: number, labels?: MetricLabels): void;
  reset(labels?: MetricLabels): void;
}

type MetricsEventBase = {
  name: string;
  labels: MetricLabels;
};

interface CounterMetricEvent extends MetricsEventBase {
  type: 'counter';
  delta: number;
  total: number;
}

interface GaugeMetricEvent extends MetricsEventBase {
  type: 'gauge';
  value: number;
  previousValue: number;
}

interface HistogramMetricEvent extends MetricsEventBase {
  type: 'histogram';
  value: number;
  count: number;
  sum: number;
}

interface TotalMetricEvent {
  type: 'total';
  name: string;
  delta: number;
  value: number;
}

type MetricsEvent = CounterMetricEvent | GaugeMetricEvent | HistogramMetricEvent | TotalMetricEvent;

interface MetricsExporter {
  onCounter?(event: CounterMetricEvent): void;
  onGauge?(event: GaugeMetricEvent): void;
  onHistogram?(event: HistogramMetricEvent): void;
  onTotal?(event: TotalMetricEvent): void;
  onEvent?(event: MetricsEvent): void;
}

// Minimal runtime implementation for UnifiedMetrics (singleton)
export class UnifiedMetrics {
  private static instance: UnifiedMetrics | null = null;

  private metricTotals: Record<string, number> = {};
  private operations: Record<string, number> = {};
  private tick = 0;

  private counters: Map<string, CounterMap> = new Map();
  private gauges: Map<string, GaugeMap> = new Map();
  private histograms: Map<string, HistogramMap> = new Map();
  private exporters: Set<MetricsExporter> = new Set();

  private constructor() {}

  public static getInstance(): UnifiedMetrics {
    if (!UnifiedMetrics.instance) UnifiedMetrics.instance = new UnifiedMetrics();
    return UnifiedMetrics.instance;
  }

  public static bindPrometheusExporter(
    exporterOrFactory?: MetricsExporter | null | (() => MetricsExporter | null | undefined),
    options: { enabled?: boolean } = {}
  ): () => void {
    return UnifiedMetrics.getInstance().bindPrometheusExporter(exporterOrFactory, options);
  }

  public startOperation(operationName: string): void {
    if (!this.telemetryOn(operationName)) return;
    this.tick += 1;
    this.operations[operationName] = this.tick;
  }

  public endOperation(operationName: string, error?: unknown): void {
    const start = this.operations[operationName];
    if (start === undefined) return;
    delete this.operations[operationName];

    if (!this.telemetryOn(operationName)) return;

    const duration = this.tick - start;
    this.recordMetric(`${operationName}.duration_ticks`, duration);
    if (error) this.recordMetric(`${operationName}.errors`, 1);
  }

  public recordMetric(name: string, value: number): void {
    if (!this.telemetryOn(name)) return;
    const prev = this.metricTotals[name] ?? 0;
    const next = prev + value;
    this.metricTotals[name] = next;
    this.notifyExporters({ type: 'total', name, delta: value, value: next });
  }

  public counter(name: string): CounterHandle {
    if (!this.counters.has(name)) this.counters.set(name, new Map());
    const map = this.counters.get(name)!;

    return {
      inc: (value = 1, labels: MetricLabels = {}) => {
        if (!this.telemetryOn(name)) return;
        const key = this.serializeLabels(labels);
        const current = map.get(key) ?? 0;
        const total = current + value;
        map.set(key, total);
        this.notifyExporters({
          type: 'counter',
          name,
          delta: value,
          total,
          labels: this.cloneLabels(labels),
        });
        this.recordMetric(name, value);
      },
      reset: (labels?: MetricLabels) => {
        if (labels) {
          map.delete(this.serializeLabels(labels));
        } else {
          map.clear();
        }
      },
    };
  }

  public gauge(name: string): GaugeHandle {
    if (!this.gauges.has(name)) this.gauges.set(name, new Map());
    const map = this.gauges.get(name)!;

    return {
      set: (value: number, labels: MetricLabels = {}) => {
        if (!this.telemetryOn(name)) return;
        const key = this.serializeLabels(labels);
        const previousValue = map.get(key) ?? 0;
        map.set(key, value);
        this.metricTotals[name] = value;
        this.notifyExporters({
          type: 'gauge',
          name,
          value,
          previousValue,
          labels: this.cloneLabels(labels),
        });
      },
      inc: (delta = 1, labels: MetricLabels = {}) => {
        if (!this.telemetryOn(name)) return;
        const key = this.serializeLabels(labels);
        const previousValue = map.get(key) ?? 0;
        const newValue = previousValue + delta;
        map.set(key, newValue);
        this.metricTotals[name] = newValue;
        this.notifyExporters({
          type: 'gauge',
          name,
          value: newValue,
          previousValue,
          labels: this.cloneLabels(labels),
        });
      },
      reset: (labels?: MetricLabels) => {
        if (labels) {
          map.delete(this.serializeLabels(labels));
        } else {
          map.clear();
        }
      },
    };
  }

  public histogram(name: string): HistogramHandle {
    if (!this.histograms.has(name)) this.histograms.set(name, new Map());
    const map = this.histograms.get(name)!;

    return {
      observe: (value: number, labels: MetricLabels = {}) => {
        if (!this.telemetryOn(name)) return;
        const key = this.serializeLabels(labels);
        const entry = map.get(key) ?? { count: 0, sum: 0 };
        entry.count += 1;
        entry.sum += value;
        map.set(key, entry);
        this.notifyExporters({
          type: 'histogram',
          name,
          value,
          count: entry.count,
          sum: entry.sum,
          labels: this.cloneLabels(labels),
        });
        this.recordMetric(`${name}.count`, 1);
        this.recordMetric(`${name}.sum`, value);
      },
      reset: (labels?: MetricLabels) => {
        if (labels) {
          map.delete(this.serializeLabels(labels));
        } else {
          map.clear();
        }
      },
    };
  }

  public getMetrics(): { [key: string]: number } {
    return { ...this.metricTotals };
  }

  public getCountersSnapshot(): Record<string, Record<string, number>> {
    return this.snapshotMap(this.counters);
  }

  public getGaugesSnapshot(): Record<string, Record<string, number>> {
    return this.snapshotMap(this.gauges);
  }

  public getHistogramsSnapshot(): Record<string, Record<string, HistogramValue>> {
    const output: Record<string, Record<string, HistogramValue>> = {};
    for (const [name, map] of this.histograms.entries()) {
      output[name] = {};
      for (const [key, value] of map.entries()) {
        output[name][key] = { ...value };
      }
    }
    return output;
  }

  public resetMetrics(): void {
    this.metricTotals = {};
    this.operations = {};
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  public bindExporter(exporter?: MetricsExporter | null): () => void {
    if (!exporter) return () => {};
    this.exporters.add(exporter);
    return () => {
      this.exporters.delete(exporter);
    };
  }

  public bindPrometheusExporter(
    exporterOrFactory?: MetricsExporter | null | (() => MetricsExporter | null | undefined),
    options: { enabled?: boolean } = {}
  ): () => void {
    if (!this.resolvePrometheusEnabled(options.enabled)) {
      return () => {};
    }

    const exporter =
      typeof exporterOrFactory === 'function'
        ? exporterOrFactory() ?? undefined
        : exporterOrFactory ?? undefined;

    if (!exporter) return () => {};

    return this.bindExporter(exporter);
  }

  private telemetryOn(feature: string): boolean {
    return isTelemetryAllowed({ channel: 'metrics', feature });
  }

  private serializeLabels(labels: MetricLabels): string {
    const entries = Object.entries(labels)
      .map(([key, value]) => `${key}=${String(value)}`)
      .sort();
    return entries.join('|') || '__no_labels__';
  }

  private cloneLabels(labels?: MetricLabels): MetricLabels {
    return labels ? { ...labels } : {};
  }

  private snapshotMap(
    map: Map<string, Map<string, number>>
  ): Record<string, Record<string, number>> {
    const output: Record<string, Record<string, number>> = {};
    for (const [name, inner] of map.entries()) {
      output[name] = {};
      for (const [key, value] of inner.entries()) {
        output[name][key] = value;
      }
    }
    return output;
  }

  private notifyExporters(event: MetricsEvent): void {
    if (this.exporters.size === 0) return;
    for (const exporter of this.exporters) {
      try {
        switch (event.type) {
          case 'counter':
            exporter.onCounter?.(event);
            break;
          case 'gauge':
            exporter.onGauge?.(event);
            break;
          case 'histogram':
            exporter.onHistogram?.(event);
            break;
          case 'total':
            exporter.onTotal?.(event);
            break;
          default:
            break;
        }
        exporter.onEvent?.(event);
      } catch (error) {
        this.warnInDev('metrics exporter handler threw', error);
      }
    }
  }

  private warnInDev(message: string, error: unknown): void {
    if (typeof console === 'undefined') return;
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
      return;
    }
    console.warn(`[UnifiedMetrics] ${message}`, error);
  }

  private resolvePrometheusEnabled(explicit?: boolean): boolean {
    if (typeof explicit === 'boolean') return explicit;

    const env =
      typeof process !== 'undefined' && process.env
        ? (process.env as Record<string, string | undefined>)
        : undefined;

    if (!env) return false;

    const candidates = [
      env.PROMETHEUS_ENABLED,
      env.VITE_PROMETHEUS_ENABLED,
      env.PROMETHEUS_EXPORTER_ENABLED,
    ];

    for (const candidate of candidates) {
      const parsed = UnifiedMetrics.parseBooleanFlag(candidate);
      if (typeof parsed === 'boolean') return parsed;
    }

    return false;
  }

  private static parseBooleanFlag(value: unknown): boolean | undefined {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on', 'enabled'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off', 'disabled'].includes(normalized)) return false;
    return undefined;
  }
}

export type {
  CounterHandle,
  CounterMetricEvent,
  GaugeHandle,
  GaugeMetricEvent,
  HistogramHandle,
  HistogramMetricEvent,
  HistogramValue,
  MetricLabels,
  MetricsEvent,
  MetricsExporter,
  TotalMetricEvent,
};

export default UnifiedMetrics;
