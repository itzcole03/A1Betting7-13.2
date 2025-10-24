import { PerformanceMonitor } from '../unified/PerformanceMonitor';

export type MetricType = 'counter' | 'gauge';

export interface RecordMetricOptions extends Record<string, unknown> {
  help?: string;
  type?: MetricType;
  labels?: Record<string, string | number | boolean | null | undefined>;
}

export interface MetricSummary {
  name: string;
  originalName: string;
  labels: Record<string, string>;
  count: number;
  sum: number;
  min: number;
  max: number;
  lastValue: number;
  lastUpdated: number;
  type: MetricType;
  help?: string;
}

export interface PrometheusExportOptions {
  includeTimestamps?: boolean;
  defaultHelp?: string;
  metricNamePrefix?: string;
}

type MutableMetricSummary = MetricSummary & {
  min: number;
  max: number;
};

/**
 * UnifiedMonitor
 *
 * Singleton monitoring/metrics interface for the A1Betting platform frontend.
 * Wraps PerformanceMonitor and exposes aggregated metric helpers plus a Prometheus text exporter.
 */
export class UnifiedMonitor {
  private static instance: UnifiedMonitor;
  private readonly perf: PerformanceMonitor;
  private readonly metricStore: Map<string, Map<string, MutableMetricSummary>>;

  private constructor() {
    this.perf = PerformanceMonitor.getInstance();
    this.metricStore = new Map();
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
   * Record a metric and update aggregated statistics.
   * @param name Metric name
   * @param value Metric value
   * @param metadata Optional metadata (supports `type`, `help`, `labels`)
   */
  public recordMetric(name: string, value: number, metadata?: RecordMetricOptions): void {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return;
    }

    this.perf.trackMetric(name, numericValue, metadata);

    const summary = this.touchMetricSummary(name, metadata);

    summary.count += 1;
    summary.sum += numericValue;
    summary.lastValue = numericValue;
    summary.lastUpdated = Date.now();

    if (summary.count === 1) {
      summary.min = numericValue;
      summary.max = numericValue;
    } else {
      summary.min = Math.min(summary.min, numericValue);
      summary.max = Math.max(summary.max, numericValue);
    }
  }

  /**
   * Retrieve a single metric summary.
   */
  public getMetricSummary(
    name: string,
    labels?: Record<string, string | number | boolean | null | undefined>
  ): MetricSummary | undefined {
    const sanitizedName = this.sanitizeMetricName(name);
    const store = this.metricStore.get(sanitizedName);
    if (!store) return undefined;

    if (labels) {
      const labelKey = this.buildLabelKey(this.sanitizeLabels(labels));
      const summary = store.get(labelKey);
      return summary ? this.cloneSummary(summary) : undefined;
    }

    const first = store.values().next();
    return first.done ? undefined : this.cloneSummary(first.value);
  }

  /**
   * Return a snapshot of all recorded metrics.
   */
  public getMetricsSnapshot(): MetricSummary[] {
    const snapshots: MetricSummary[] = [];
    for (const [, entries] of this.metricStore) {
      for (const summary of entries.values()) {
        snapshots.push(this.cloneSummary(summary));
      }
    }
    return snapshots.sort((a, b) => {
      if (a.name !== b.name) return a.name.localeCompare(b.name);
      const aLabels = Object.keys(a.labels).join(',');
      const bLabels = Object.keys(b.labels).join(',');
      return aLabels.localeCompare(bLabels);
    });
  }

  /**
   * Clear stored metrics. Provide a name (and optional labels) to remove a subset.
   */
  public clearMetrics(
    name?: string,
    labels?: Record<string, string | number | boolean | null | undefined>
  ): void {
    if (!name) {
      this.metricStore.clear();
      return;
    }

    const sanitizedName = this.sanitizeMetricName(name);
    const store = this.metricStore.get(sanitizedName);
    if (!store) return;

    if (!labels) {
      this.metricStore.delete(sanitizedName);
      return;
    }

    const labelKey = this.buildLabelKey(this.sanitizeLabels(labels));
    store.delete(labelKey);
    if (store.size === 0) {
      this.metricStore.delete(sanitizedName);
    }
  }

  /**
   * Render collected metrics in Prometheus text exposition format.
   */
  public exportPrometheus(options?: PrometheusExportOptions): string {
    const entries = this.getMetricsSnapshot();
    if (entries.length === 0) return '';

    const includeTimestamps = options?.includeTimestamps ?? false;
    const defaultHelp = options?.defaultHelp ?? 'Unified monitor metric';
    const prefix = options?.metricNamePrefix
      ? `${this.sanitizeMetricName(options.metricNamePrefix)}_`
      : '';

    const lines: string[] = [];
    let lastMetricName = '';

    for (const summary of entries) {
      const metricName = `${prefix}${summary.name}`;
      if (metricName !== lastMetricName) {
        const help = summary.help ?? defaultHelp;
        lines.push(`# HELP ${metricName} ${help}`);
        lines.push(`# TYPE ${metricName} ${summary.type}`);
        lastMetricName = metricName;
      }

      const labels = this.formatLabels(summary.labels);
      const value = summary.type === 'counter' ? summary.sum : summary.lastValue;
      const timestamp = includeTimestamps ? ` ${Math.round(summary.lastUpdated)}` : '';
      lines.push(`${metricName}${labels} ${value}${timestamp}`);
    }

    return lines.join('\n');
  }

  private touchMetricSummary(name: string, metadata?: RecordMetricOptions): MutableMetricSummary {
    const sanitizedName = this.sanitizeMetricName(name);
    const labels = this.sanitizeLabels(metadata?.labels);
    const labelKey = this.buildLabelKey(labels);

    let byLabel = this.metricStore.get(sanitizedName);
    if (!byLabel) {
      byLabel = new Map();
      this.metricStore.set(sanitizedName, byLabel);
    }

    let summary = byLabel.get(labelKey);
    if (!summary) {
      summary = {
        name: sanitizedName,
        originalName: name,
        labels,
        count: 0,
        sum: 0,
        min: Number.POSITIVE_INFINITY,
        max: Number.NEGATIVE_INFINITY,
        lastValue: 0,
        lastUpdated: 0,
        type: this.normalizeMetricType(metadata?.type),
        help: this.normalizeHelp(metadata?.help),
      };
      byLabel.set(labelKey, summary);
    } else {
      if (metadata?.help && !summary.help) {
        summary.help = this.normalizeHelp(metadata.help);
      }
      if (metadata?.type) {
        summary.type = this.normalizeMetricType(metadata.type);
      }
    }

    return summary;
  }

  private sanitizeMetricName(name: string): string {
    const raw = String(name ?? '').trim();
    if (raw === '') return 'metric';
    let sanitized = raw.replace(/[^a-zA-Z0-9_]/g, '_');
    sanitized = sanitized.replace(/_{2,}/g, '_');
    sanitized = sanitized.replace(/^[^a-zA-Z_]+/, '');
    return sanitized === '' ? 'metric' : sanitized;
  }

  private sanitizeLabels(
    labels?: Record<string, string | number | boolean | null | undefined>
  ): Record<string, string> {
    if (!labels) return {};
    const sanitized: Record<string, string> = {};
    for (const [key, value] of Object.entries(labels)) {
      const sanitizedKey = this.sanitizeLabelName(key);
      if (!sanitizedKey) continue;
      const sanitizedValue = this.sanitizeLabelValue(value);
      sanitized[sanitizedKey] = sanitizedValue;
    }
    return sanitized;
  }

  private sanitizeLabelName(name: string): string {
    const raw = String(name ?? '').trim();
    if (raw === '') return '';
    let sanitized = raw.replace(/[^a-zA-Z0-9_]/g, '_');
    sanitized = sanitized.replace(/_{2,}/g, '_');
    sanitized = sanitized.replace(/^[^a-zA-Z_]+/, '');
    return sanitized;
  }

  private sanitizeLabelValue(value: unknown): string {
    if (value === undefined || value === null) {
      return 'unknown';
    }
    const str = String(value);
    return str.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
  }

  private buildLabelKey(labels: Record<string, string>): string {
    const entries = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([key, value]) => `${key}=${value}`).join('|');
  }

  private formatLabels(labels: Record<string, string>): string {
    const entries = Object.entries(labels);
    if (entries.length === 0) return '';
    const sorted = entries.sort(([a], [b]) => a.localeCompare(b));
    const rendered = sorted.map(([key, value]) => `${key}="${value}"`).join(',');
    return `{${rendered}}`;
  }

  private normalizeMetricType(type?: unknown): MetricType {
    return type === 'counter' ? 'counter' : 'gauge';
  }

  private normalizeHelp(help?: unknown): string | undefined {
    if (help === undefined) return undefined;
    const normalized = String(help).trim();
    return normalized === '' ? undefined : normalized;
  }

  private cloneSummary(summary: MutableMetricSummary): MetricSummary {
    return {
      name: summary.name,
      originalName: summary.originalName,
      labels: { ...summary.labels },
      count: summary.count,
      sum: summary.sum,
      min: summary.min,
      max: summary.max,
      lastValue: summary.lastValue,
      lastUpdated: summary.lastUpdated,
      type: summary.type,
      help: summary.help,
    };
  }
}

export const _unifiedMonitor = UnifiedMonitor.getInstance();
