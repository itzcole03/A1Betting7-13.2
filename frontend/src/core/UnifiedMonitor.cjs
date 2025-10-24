// Minimal CommonJS UnifiedMonitor shim with aggregated metrics + Prometheus exporter
let perfHooksPerformance;
try {
  ({ performance: perfHooksPerformance } = require('perf_hooks'));
} catch (error) {
  perfHooksPerformance = undefined;
}

const performanceAPI =
  (typeof globalThis !== 'undefined' && globalThis.performance) || perfHooksPerformance;

function now() {
  return Date.now();
}

function sanitizeName(name, fallback) {
  const raw = (name == null ? '' : String(name)).trim();
  if (!raw) return fallback;
  let sanitized = raw.replace(/[^a-zA-Z0-9_]/g, '_');
  sanitized = sanitized.replace(/_{2,}/g, '_');
  sanitized = sanitized.replace(/^[^a-zA-Z_]+/, '');
  return sanitized || fallback;
}

function sanitizeLabels(labels) {
  if (!labels || typeof labels !== 'object') return {};
  const sanitized = {};
  for (const [key, value] of Object.entries(labels)) {
    const name = sanitizeName(key, 'label');
    if (!name) continue;
    sanitized[name] = sanitizeLabelValue(value);
  }
  return sanitized;
}

function sanitizeLabelValue(value) {
  if (value === undefined || value === null) return 'unknown';
  return String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
}

function buildLabelKey(labels) {
  const entries = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([key, value]) => `${key}=${value}`).join('|');
}

function formatLabels(labels) {
  const entries = Object.entries(labels);
  if (entries.length === 0) return '';
  const rendered = entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}="${value}"`)
    .join(',');
  return `{${rendered}}`;
}

class UnifiedMonitor {
  constructor() {
    this._metrics = new Map();
  }

  static getInstance() {
    if (!UnifiedMonitor._instance) {
      UnifiedMonitor._instance = new UnifiedMonitor();
    }
    return UnifiedMonitor._instance;
  }

  startTrace(name, category, description) {
    const metricName = sanitizeName(name, 'metric');
    const mark = `${metricName}-start-${now()}`;
    if (performanceAPI && typeof performanceAPI.mark === 'function') {
      performanceAPI.mark(mark, { detail: { category, description } });
    }
    return mark;
  }

  endTrace(traceId, error) {
    if (!performanceAPI || typeof performanceAPI.mark !== 'function') return;
    const endMark = `${traceId}-end-${now()}`;
    try {
      performanceAPI.mark(endMark);
      if (typeof performanceAPI.measure === 'function') {
        performanceAPI.measure(traceId, traceId, endMark);
      }
    } catch (err) {
      if (error) {
        // swallow error but keep reference for debugging
        error.__monitorError = err; // eslint-disable-line no-underscore-dangle
      }
    }
  }

  recordMetric(name, value, metadata) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;

    const metricName = sanitizeName(name, 'metric');
    const labels = sanitizeLabels(metadata && metadata.labels);
    const labelKey = buildLabelKey(labels);

    let mapForName = this._metrics.get(metricName);
    if (!mapForName) {
      mapForName = new Map();
      this._metrics.set(metricName, mapForName);
    }

    let summary = mapForName.get(labelKey);
    if (!summary) {
      summary = {
        name: metricName,
        originalName: name,
        labels,
        count: 0,
        sum: 0,
        min: Number.POSITIVE_INFINITY,
        max: Number.NEGATIVE_INFINITY,
        lastValue: 0,
        lastUpdated: 0,
        type: metadata && metadata.type === 'counter' ? 'counter' : 'gauge',
        help: metadata && metadata.help ? String(metadata.help).trim() || undefined : undefined,
      };
      mapForName.set(labelKey, summary);
    } else {
      if (metadata && metadata.type) {
        summary.type = metadata.type === 'counter' ? 'counter' : 'gauge';
      }
      if (metadata && metadata.help && !summary.help) {
        const help = String(metadata.help).trim();
        if (help) summary.help = help;
      }
    }

    summary.count += 1;
    summary.sum += numeric;
    summary.lastValue = numeric;
    summary.lastUpdated = now();
    if (summary.count === 1) {
      summary.min = numeric;
      summary.max = numeric;
    } else {
      summary.min = Math.min(summary.min, numeric);
      summary.max = Math.max(summary.max, numeric);
    }
  }

  getMetricSummary(name, labels) {
    const metricName = sanitizeName(name, 'metric');
    const store = this._metrics.get(metricName);
    if (!store) return undefined;

    if (labels) {
      const labelKey = buildLabelKey(sanitizeLabels(labels));
      const summary = store.get(labelKey);
      return summary ? cloneSummary(summary) : undefined;
    }

    const iterator = store.values().next();
    return iterator.done ? undefined : cloneSummary(iterator.value);
  }

  getMetricsSnapshot() {
    const snapshots = [];
    for (const [, entries] of this._metrics) {
      for (const summary of entries.values()) {
        snapshots.push(cloneSummary(summary));
      }
    }
    return snapshots.sort((a, b) => {
      if (a.name !== b.name) return a.name.localeCompare(b.name);
      const aLabels = Object.keys(a.labels).join(',');
      const bLabels = Object.keys(b.labels).join(',');
      return aLabels.localeCompare(bLabels);
    });
  }

  clearMetrics(name, labels) {
    if (!name) {
      this._metrics.clear();
      return;
    }
    const metricName = sanitizeName(name, 'metric');
    const store = this._metrics.get(metricName);
    if (!store) return;
    if (!labels) {
      this._metrics.delete(metricName);
      return;
    }
    const labelKey = buildLabelKey(sanitizeLabels(labels));
    store.delete(labelKey);
    if (store.size === 0) this._metrics.delete(metricName);
  }

  exportPrometheus(options) {
    const entries = this.getMetricsSnapshot();
    if (entries.length === 0) return '';
    const includeTimestamps = options && options.includeTimestamps;
    const defaultHelp = (options && options.defaultHelp) || 'Unified monitor metric';
    const prefix =
      options && options.metricNamePrefix
        ? `${sanitizeName(options.metricNamePrefix, 'metric')}_`
        : '';

    const lines = [];
    let lastName = '';
    for (const summary of entries) {
      const metricName = `${prefix}${summary.name}`;
      if (metricName !== lastName) {
        lines.push(`# HELP ${metricName} ${summary.help || defaultHelp}`);
        lines.push(`# TYPE ${metricName} ${summary.type}`);
        lastName = metricName;
      }
      const value = summary.type === 'counter' ? summary.sum : summary.lastValue;
      const timestamp = includeTimestamps ? ` ${Math.round(summary.lastUpdated)}` : '';
      lines.push(`${metricName}${formatLabels(summary.labels)} ${value}${timestamp}`);
    }

    return lines.join('\n');
  }
}

function cloneSummary(summary) {
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

module.exports = {
  UnifiedMonitor,
  _unifiedMonitor: UnifiedMonitor.getInstance(),
  default: UnifiedMonitor,
  getInstance: () => UnifiedMonitor.getInstance(),
};
