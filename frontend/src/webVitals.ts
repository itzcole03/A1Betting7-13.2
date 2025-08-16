// webVitals.ts
// Reports Core Web Vitals metrics to the console and optionally to a monitoring endpoint
import { onCLS, onINP, onLCP, onTTFB, Metric } from 'web-vitals';

// Global set to track emitted metrics across hot reloads
declare global {
  interface Window {
    __A1_METRICS_EMITTED?: Set<string>;
  }
}

// Initialize or retrieve the persistent metric set
function getEmittedMetricsSet(): Set<string> {
  if (!window.__A1_METRICS_EMITTED) {
    window.__A1_METRICS_EMITTED = new Set<string>();
  }
  return window.__A1_METRICS_EMITTED;
}

function reportWebVitals(metric: Metric) {
  const emittedSet = getEmittedMetricsSet();
  
  // Create unique key for this metric
  const metricKey = `${metric.name}_${metric.id}_${metric.value}`;
  
  // Check if this exact metric has already been emitted
  if (emittedSet.has(metricKey)) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[WebVitals] Skipping duplicate metric: ${metric.name}`, metric);
    }
    return;
  }
  
  // Mark this metric as emitted
  emittedSet.add(metricKey);
  
  // Log to console
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`[WebVitals] ${metric.name}:`, metric.value, metric);
  }
  
  // Optionally send to monitoring endpoint (Sentry, Datadog, etc.)
  // fetch('/api/metrics', { method: 'POST', body: JSON.stringify(metric) });
  
  // Clean up old entries periodically to prevent memory leaks
  if (emittedSet.size > 500) { // Limit to 500 unique metrics
    const entries = Array.from(emittedSet);
    // Remove oldest 100 entries
    for (let i = 0; i < 100; i++) {
      emittedSet.delete(entries[i]);
    }
  }
}

export function initWebVitals() {
  onCLS(reportWebVitals);
  if (onINP) {
    onINP(reportWebVitals); // INP is experimental
  }
  onLCP(reportWebVitals);
  onTTFB(reportWebVitals);
}

// Export function to check if metric was already emitted (for testing)
export function wasMetricEmitted(metricName: string, metricId: string, metricValue: number): boolean {
  const emittedSet = getEmittedMetricsSet();
  const metricKey = `${metricName}_${metricId}_${metricValue}`;
  return emittedSet.has(metricKey);
}

// Export function to clear metrics (for testing or manual cleanup)
export function clearEmittedMetrics(): void {
  if (window.__A1_METRICS_EMITTED) {
    window.__A1_METRICS_EMITTED.clear();
  }
}
