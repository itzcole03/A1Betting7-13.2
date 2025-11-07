/*
 * Normalized performance metrics utilities (PR1 Performance Metrics Correction)
 * Provides:
 *  - Stable navigation timing (PerformanceNavigationTiming preferred)
 *  - Legacy fallback (performance.timing) with clamped non-negative values
 *  - Single initialization guard for Web Vitals collection
 *  - Consistent totalLoadTime calculation (duration) avoiding mixed time origins
 *  - Safe numeric coercion & validation helpers
 */

import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

export interface NavigationTimingMetrics {
  startTime: number;          // navigationStart
  domContentLoaded: number;   // DOMContentLoadedEventEnd - navigationStart
  firstPaint?: number;        // First Paint if available
  firstContentfulPaint?: number; // FCP if available (captured separately too)
  totalLoadTime: number;      // duration or loadEventEnd - navigationStart
  type: string;               // navigation type (reload, navigate, etc.)
  timestamp: number;          // epoch ms captured time
  source: 'navigation-timing' | 'legacy-timing';
}

export interface WebVitalMetricRecord {
  name: string;
  value: number;
  rating?: string;
  delta?: number;
  id?: string;
  navigationType?: string;
  timestamp: number;
}

// Internal guard flags
let webVitalsInitialized = false;
let lcpRecorded = false; // ensure only first LCP forwarded

// Clamp helper ensuring non-negative finite numbers
function clampNonNegative(value: number | undefined | null): number | undefined {
  if (value == null) return undefined;
  if (!Number.isFinite(value)) return undefined;
  return value < 0 ? 0 : value;
}

export function getNavigationTiming(): NavigationTimingMetrics | null {
  try {
    // Prefer modern PerformanceNavigationTiming entries
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navEntries && navEntries.length > 0) {
      const nav = navEntries[0];
      const totalLoadTime = clampNonNegative(nav.duration) ?? 0;
      const metrics: NavigationTimingMetrics = {
        startTime: nav.startTime, // should be 0 for navigation entries
        domContentLoaded: clampNonNegative(nav.domContentLoadedEventEnd - nav.startTime) ?? 0,
        firstPaint: undefined, // can be populated if paint entries queried outside
        firstContentfulPaint: undefined,
        totalLoadTime,
        type: nav.type,
        timestamp: Date.now(),
        source: 'navigation-timing'
      };
      return metrics;
    }

    // Legacy fallback using performance.timing (deprecated but still in some browsers)
  // Use indexed access to avoid any cast while acknowledging legacy API
  const perfObj: Performance & { timing?: PerformanceTiming } = performance as Performance & { timing?: PerformanceTiming };
  const t = perfObj.timing;
    if (t) {
      const navigationStart = t.navigationStart || 0;
      const domContentLoaded = clampNonNegative(t.domContentLoadedEventEnd - navigationStart) ?? 0;
      const loadEventEnd = clampNonNegative(t.loadEventEnd - navigationStart) ?? 0;
      const metrics: NavigationTimingMetrics = {
        startTime: 0,
        domContentLoaded,
        firstPaint: undefined,
        firstContentfulPaint: undefined,
        totalLoadTime: loadEventEnd,
        type: 'navigate',
        timestamp: Date.now(),
        source: 'legacy-timing'
      };
      return metrics;
    }

    return null;
  } catch {
    return null;
  }
}

export interface InitWebVitalsOptions {
  onMetric?: (metric: WebVitalMetricRecord) => void;
  includeNavigationMetrics?: boolean;
  // Optionally force re-init (for tests) but default is false in prod
  force?: boolean;
}

// Initialize web vitals a single time; returns true on first init, false otherwise
export function initWebVitals(options: InitWebVitalsOptions = {}): boolean {
  if (webVitalsInitialized && !options.force) return false;
  webVitalsInitialized = true;
  if (options.force) {
    // allow tests to reset recording state
    lcpRecorded = false;
  }

  interface CoreWebVitalMetric {
    name: string;
    value: number;
    rating?: string;
    delta?: number;
    id?: string;
  }
  const emit = (metric: CoreWebVitalMetric) => {
    if (!options.onMetric) return;
    // Safely read navigation entries: mocked getEntriesByType may return undefined
    let navigationType: string | undefined = undefined;
    try {
      const entries = (typeof performance.getEntriesByType === 'function' && performance.getEntriesByType('navigation')) || [];
      if (Array.isArray(entries) && entries.length > 0 && entries[0] && (entries[0] as any).type) {
        navigationType = (entries[0] as any).type;
      }
    } catch (e) {
      // ignore and leave navigationType undefined
    }

    const record: WebVitalMetricRecord = {
      name: metric.name,
      value: clampNonNegative(metric.value) ?? 0,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType,
      timestamp: Date.now()
    };

    if (record.name === 'LCP') {
      if (lcpRecorded) return; // swallow duplicates
      lcpRecorded = true;
    }

    options.onMetric(record);
  };

  // Register web-vitals listeners
  onCLS(emit);
  onINP(emit);
  onLCP(emit);
  onFCP(emit);
  onTTFB(emit);

  // Optional navigation metrics emission
  if (options.includeNavigationMetrics) {
    const nav = getNavigationTiming();
    if (nav && options.onMetric) {
      options.onMetric({
        name: 'navigation-total-load-time',
        value: nav.totalLoadTime,
        timestamp: nav.timestamp
      });
      options.onMetric({
        name: 'navigation-dom-content-loaded',
        value: nav.domContentLoaded,
        timestamp: nav.timestamp
      });
    }
  }

  return true;
}

// Exposed for tests to reset state safely
export function __resetPerformanceGuardsForTests(): void {
  webVitalsInitialized = false;
  lcpRecorded = false;
}
