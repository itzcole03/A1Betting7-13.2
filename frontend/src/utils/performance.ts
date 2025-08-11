/**
 * Performance Monitoring for A1Betting Frontend
 *
 * Tracks loading times, component render performance, and provides
 * insights for optimization.
 */

import * as React from 'react';
import { logger } from './logger';

interface PerformanceMetrics {
  componentName: string;
  loadTime: number;
  renderTime?: number;
  timestamp: number;
  userAgent: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private loadStartTimes = new Map<string, number>();

  /**
   * Start tracking component load time
   */
  startLoading(componentName: string): void {
    this.loadStartTimes.set(componentName, performance.now());
    logger.debug(`⏱️ Started loading ${componentName}`, {}, 'Performance');
  }

  /**
   * End tracking component load time
   */
  endLoading(componentName: string): void {
    const startTime = this.loadStartTimes.get(componentName);
    if (startTime) {
      const loadTime = performance.now() - startTime;
      this.recordMetric({
        componentName,
        loadTime,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      });

      this.loadStartTimes.delete(componentName);

      logger.info(
        `✅ ${componentName} loaded in ${loadTime.toFixed(2)}ms`,
        {
          componentName,
          loadTime,
        },
        'Performance'
      );
    }
  }

  /**
   * Track component render performance
   */
  trackRender<T>(componentName: string, renderFn: () => T): T {
    const startTime = performance.now();
    const result = renderFn();
    const renderTime = performance.now() - startTime;

    logger.debug(
      `🔄 ${componentName} rendered in ${renderTime.toFixed(2)}ms`,
      {
        componentName,
        renderTime,
      },
      'Performance'
    );

    return result;
  }

  /**
   * Record performance metric
   */
  private recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Log warnings for slow components
    if (metric.loadTime > 2000) {
      logger.warn(
        `🐌 Slow component load: ${metric.componentName} took ${metric.loadTime.toFixed(2)}ms`,
        {
          metric,
        },
        'Performance'
      );
    }
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalComponents: number;
    averageLoadTime: number;
    slowestComponent: PerformanceMetrics | null;
    fastestComponent: PerformanceMetrics | null;
  } {
    if (this.metrics.length === 0) {
      return {
        totalComponents: 0,
        averageLoadTime: 0,
        slowestComponent: null,
        fastestComponent: null,
      };
    }

    const totalLoadTime = this.metrics.reduce((sum, metric) => sum + metric.loadTime, 0);
    const averageLoadTime = totalLoadTime / this.metrics.length;

    const slowestComponent = this.metrics.reduce((slowest, current) =>
      current.loadTime > slowest.loadTime ? current : slowest
    );

    const fastestComponent = this.metrics.reduce((fastest, current) =>
      current.loadTime < fastest.loadTime ? current : fastest
    );

    return {
      totalComponents: this.metrics.length,
      averageLoadTime,
      slowestComponent,
      fastestComponent,
    };
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.loadStartTimes.clear();
  }

  /**
   * Track Core Web Vitals
   */
  trackWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          logger.info(
            `📊 LCP: ${lastEntry.startTime.toFixed(2)}ms`,
            {
              metric: 'LCP',
              value: lastEntry.startTime,
            },
            'WebVitals'
          );
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            const fidEntry = entry as any; // FID entries have processingStart
            if (fidEntry.processingStart) {
              logger.info(
                `📊 FID: ${fidEntry.processingStart - entry.startTime}ms`,
                {
                  metric: 'FID',
                  value: fidEntry.processingStart - entry.startTime,
                },
                'WebVitals'
              );
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        logger.warn('Failed to set up web vitals tracking', error, 'Performance');
      }
    }

    // Track navigation timing
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const navigationStart = timing.navigationStart;

      window.addEventListener('load', () => {
        const loadComplete = timing.loadEventEnd;
        const domInteractive = timing.domInteractive;
        const domComplete = timing.domComplete;

        logger.info(
          '📊 Navigation Timing',
          {
            totalLoadTime: loadComplete - navigationStart,
            domInteractive: domInteractive - navigationStart,
            domComplete: domComplete - navigationStart,
          },
          'WebVitals'
        );
      });
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * HOC for tracking component performance
 */
export const withPerformanceTracking = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) => {
  const ComponentWithPerformanceTracking: React.FC<P> = props => {
    const name =
      componentName || WrappedComponent.displayName || WrappedComponent.name || 'UnknownComponent';

    React.useEffect(() => {
      performanceMonitor.startLoading(name);
      return () => {
        performanceMonitor.endLoading(name);
      };
    }, [name]);

    return React.createElement(WrappedComponent, props);
  };

  ComponentWithPerformanceTracking.displayName = `withPerformanceTracking(${
    componentName || WrappedComponent.displayName || WrappedComponent.name
  })`;

  return ComponentWithPerformanceTracking;
};

/**
 * Hook for tracking component performance
 */
export const usePerformanceTracking = (componentName: string) => {
  React.useEffect(() => {
    performanceMonitor.startLoading(componentName);
    return () => {
      performanceMonitor.endLoading(componentName);
    };
  }, [componentName]);

  const trackOperation = React.useCallback(
    <T>(operationName: string, operation: () => T): T => {
      return performanceMonitor.trackRender(`${componentName}.${operationName}`, operation);
    },
    [componentName]
  );

  return { trackOperation };
};

// Initialize web vitals tracking
if (typeof window !== 'undefined') {
  performanceMonitor.trackWebVitals();
}
