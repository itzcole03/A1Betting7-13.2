// webVitals.ts
// Reports Core Web Vitals metrics to the console and optionally to a monitoring endpoint
import { onCLS, onINP, onLCP, onTTFB } from 'web-vitals';

function reportWebVitals(metric: any) {
  // Log to console
  // console.log(`[Web Vitals] ${metric.name}:`, metric.value, metric);
  // Optionally send to monitoring endpoint (Sentry, Datadog, etc.)
  // fetch('/api/metrics', { method: 'POST', body: JSON.stringify(metric) });
}

export function initWebVitals() {
  onCLS(reportWebVitals);
  onINP && onINP(reportWebVitals); // INP is experimental
  onLCP(reportWebVitals);
  onTTFB(reportWebVitals);
}
