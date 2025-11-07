import type { MetricsExporter } from '../UnifiedMetrics';
import { HistogramValue, UnifiedMetrics } from '../UnifiedMetrics';

export interface PrometheusExportOptions {
  /**
   * When true (default), include the aggregated metric totals recorded via `recordMetric`.
   * These totals are emitted as `counter` samples with no labels.
   */
  includeTotals?: boolean;
  /** Optional epoch timestamp (milliseconds) appended to each sample. */
  timestampMs?: number;
}

type LabelRecord = Record<string, string | number | boolean>;

const NO_LABELS_KEY = '__no_labels__';

/**
 * Render the current UnifiedMetrics snapshot into Prometheus text exposition format.
 */
export function getPrometheusText(options: PrometheusExportOptions = {}): string {
  const { includeTotals = true, timestampMs } = options;
  const metrics = UnifiedMetrics.getInstance();
  const lines: string[] = [];
  const tsFragment = typeof timestampMs === 'number' ? ` ${Math.floor(timestampMs)}` : '';

  // Counters
  appendCounterMetrics(lines, metrics.getCountersSnapshot(), tsFragment);

  // Gauges
  appendGaugeMetrics(lines, metrics.getGaugesSnapshot(), tsFragment);

  // Histograms (bucket-less: expose _sum and _count per label set)
  appendHistogramMetrics(lines, metrics.getHistogramsSnapshot(), tsFragment);

  if (includeTotals) {
    appendTotals(lines, metrics.getMetrics(), tsFragment);
  }

  return lines.join('\n');
}

function appendCounterMetrics(
  lines: string[],
  snapshot: Record<string, Record<string, number>>,
  tsFragment: string
) {
  for (const [name, labelMap] of Object.entries(snapshot)) {
    lines.push(`# TYPE ${name} counter`);
    for (const [labelKey, value] of Object.entries(labelMap)) {
      const labels = parseLabelKey(labelKey);
      lines.push(`${formatSample(name, labels)} ${value}${tsFragment}`);
    }
  }
}

function appendGaugeMetrics(
  lines: string[],
  snapshot: Record<string, Record<string, number>>,
  tsFragment: string
) {
  for (const [name, labelMap] of Object.entries(snapshot)) {
    lines.push(`# TYPE ${name} gauge`);
    for (const [labelKey, value] of Object.entries(labelMap)) {
      const labels = parseLabelKey(labelKey);
      lines.push(`${formatSample(name, labels)} ${value}${tsFragment}`);
    }
  }
}

function appendHistogramMetrics(
  lines: string[],
  snapshot: Record<string, Record<string, HistogramValue>>,
  tsFragment: string
) {
  for (const [name, labelMap] of Object.entries(snapshot)) {
    const countName = `${name}_count`;
    const sumName = `${name}_sum`;
    lines.push(`# TYPE ${name} histogram`);
    for (const [labelKey, value] of Object.entries(labelMap)) {
      const labels = parseLabelKey(labelKey);
      lines.push(`${formatSample(countName, labels)} ${value.count}${tsFragment}`);
      lines.push(`${formatSample(sumName, labels)} ${value.sum}${tsFragment}`);
    }
  }
}

function appendTotals(lines: string[], totals: Record<string, number>, tsFragment: string) {
  for (const [name, value] of Object.entries(totals)) {
    lines.push(`# TYPE ${name} counter`);
    lines.push(`${name} ${value}${tsFragment}`);
  }
}

function formatSample(metricName: string, labels: LabelRecord | null): string {
  if (!labels || Object.keys(labels).length === 0) {
    return metricName;
  }

  const fragments = Object.entries(labels)
    .map(([key, value]) => `${sanitizeLabelKey(key)}="${String(value).replace(/"/g, '\\"')}"`)
    .join(',');
  return `${metricName}{${fragments}}`;
}

function parseLabelKey(serialized: string): LabelRecord | null {
  if (!serialized || serialized === NO_LABELS_KEY) return null;
  const parts = serialized.split('|');
  const record: LabelRecord = {};
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key) record[key] = value ?? '';
  }
  return record;
}

function sanitizeLabelKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9_]/g, '_');
}

export interface PrometheusBindingOptions {
  enabled?: boolean;
}

export function bindPrometheusExporter(
  exporter?: MetricsExporter | null | (() => MetricsExporter | null | undefined),
  options: PrometheusBindingOptions = {}
): () => void {
  return UnifiedMetrics.bindPrometheusExporter(exporter, options);
}

export default getPrometheusText;
