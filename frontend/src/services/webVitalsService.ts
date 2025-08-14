/**
 * Web Vitals Service - 2025 Best Practices
 *
 * Comprehensive Core Web Vitals tracking with modern features:
 * - LCP (Largest Contentful Paint)
 * - CLS (Cumulative Layout Shift)
 * - INP (Interaction to Next Paint) - replaced FID in 2024
 * - TTFB (Time to First Byte)
 * - FCP (First Contentful Paint)
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

interface WebVitalsMetrics {
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  ttfb: number | null;
  fcp: number | null;
}

interface PerformanceEntry {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userAgent: string;
}

class WebVitalsService {
  private metrics: WebVitalsMetrics = {
    lcp: null,
    cls: null,
    inp: null,
    ttfb: null,
    fcp: null,
  };

  private entries: PerformanceEntry[] = [];
  private lcpLogged: boolean = false;

  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      lcp: { good: 2500, poor: 4000 },
      cls: { good: 0.1, poor: 0.25 },
      inp: { good: 200, poor: 500 },
      ttfb: { good: 800, poor: 1800 },
      fcp: { good: 1800, poor: 3000 },
    };

    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private logMetric(metric: Metric): void {
    // Skip LCP logging if already logged once
    if (metric.name === 'LCP' && this.lcpLogged) {
      return;
    }

    const entry: PerformanceEntry = {
      name: metric.name,
      value: metric.value,
      rating: this.getRating(metric.name, metric.value),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.entries.push(entry);
    this.metrics[metric.name as keyof WebVitalsMetrics] = metric.value;

    // Mark LCP as logged
    if (metric.name === 'LCP') {
      this.lcpLogged = true;
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[WebVitals] ${metric.name}:`, {
        value: metric.value,
        rating: entry.rating,
        threshold: this.getThresholdInfo(metric.name),
      });
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(entry);
    }
  }

  private getThresholdInfo(name: string) {
    const thresholds = {
      lcp: { good: '≤2.5s', poor: '>4s', unit: 'ms' },
      cls: { good: '≤0.1', poor: '>0.25', unit: '' },
      inp: { good: '≤200ms', poor: '>500ms', unit: 'ms' },
      ttfb: { good: '≤800ms', poor: '>1.8s', unit: 'ms' },
      fcp: { good: '≤1.8s', poor: '>3s', unit: 'ms' },
    };
    return thresholds[name as keyof typeof thresholds];
  }

  private async sendToAnalytics(entry: PerformanceEntry): Promise<void> {
    try {
      // Send to your analytics service
      const response = await fetch('/api/analytics/vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        console.warn('Failed to send Web Vitals data to analytics');
      }
    } catch (error) {
      console.warn('Error sending Web Vitals data:', error);
    }
  }

  public init(): void {
    if (typeof window === 'undefined') return;

    // Track all Core Web Vitals
    onLCP((metric) => this.logMetric(metric));
    onCLS(this.logMetric.bind(this));
    onINP(this.logMetric.bind(this)); // New in 2024, replaces FID
    onTTFB(this.logMetric.bind(this));
    onFCP(this.logMetric.bind(this));

    // Track additional performance metrics
    this.trackCustomMetrics();
  }

  private trackCustomMetrics(): void {
    // Track total load time using modern Navigation Timing API
    if ('performance' in window && 'getEntriesByType' in window.performance) {
      window.addEventListener('load', () => {
        try {
          const start = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
          const totalLoadTime = Math.round(start.duration);
          
          if (totalLoadTime > 0) {
            // eslint-disable-next-line no-console
            console.log('[Performance] Total Load Time:', `${totalLoadTime}ms`);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn('[Performance] Could not calculate total load time:', error);
        }

        // Track JavaScript bundle size
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const jsResources = resources.filter(
          resource => resource.name.includes('.js') && !resource.name.includes('node_modules')
        );

        const totalJSSize = jsResources.reduce((total, resource) => {
          return total + (resource.transferSize || 0);
        }, 0);

        // eslint-disable-next-line no-console
        console.log('[Performance] Total JS Bundle Size:', `${(totalJSSize / 1024).toFixed(2)} KB`);
      });
    }

    // Track memory usage if available
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      // eslint-disable-next-line no-console
      console.log('[Performance] Memory Usage:', {
        used: `${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
      });
    }
  }

  public getMetrics(): WebVitalsMetrics {
    return { ...this.metrics };
  }

  /**
   * Track custom metrics for additional insights
   */
  public trackCustomMetric(name: string, value: number, attributes?: Record<string, string>): void {
    console.log(`[WebVitals] Custom metric ${name}:`, value, attributes);

    // Store custom metric for later reporting
    if (attributes) {
      console.log(`[WebVitals] Custom metric attributes:`, attributes);
    }
  }

  public getEntries(): PerformanceEntry[] {
    return [...this.entries];
  }

  public getPerformanceScore(): number {
    const validMetrics = Object.values(this.metrics).filter(value => value !== null);
    if (validMetrics.length === 0) return 0;

    const scores = this.entries.map(entry => {
      switch (entry.rating) {
        case 'good':
          return 100;
        case 'needs-improvement':
          return 50;
        case 'poor':
          return 0;
        default:
          return 0;
      }
    });

    return scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
  }

  public exportReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: this.metrics,
      entries: this.entries,
      score: this.getPerformanceScore(),
    };

    return JSON.stringify(report, null, 2);
  }
}

// Singleton instance
export const webVitalsService = new WebVitalsService();

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  webVitalsService.init();
}

export default webVitalsService;
