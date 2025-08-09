import { useCallback, useRef, useEffect, useState } from 'react';

// Performance monitoring interfaces
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  threshold?: number;
  type: 'duration' | 'count' | 'size' | 'percentage';
}

interface ComponentPerformance {
  componentName: string;
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  lastRenderTime: number;
  memoryUsage?: number;
}

// Performance optimizer class
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private componentMetrics: Map<string, ComponentPerformance> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();
  private thresholds: Map<string, number> = new Map();

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  constructor() {
    this.initializeThresholds();
    this.startMonitoring();
  }

  private initializeThresholds(): void {
    this.thresholds.set('renderTime', 16.67); // 60fps target
    this.thresholds.set('bundleSize', 244); // 244KB for initial JS bundle
    this.thresholds.set('apiResponseTime', 200); // 200ms API response
    this.thresholds.set('memoryUsage', 50); // 50MB memory usage
    this.thresholds.set('cacheHitRate', 90); // 90% cache hit rate
  }

  private startMonitoring(): void {
    // Monitor Long Tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric('longTask', {
              name: 'Long Task',
              value: entry.duration,
              timestamp: Date.now(),
              threshold: 50,
              type: 'duration'
            });
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (error) {
        console.warn('Long task monitoring not supported:', error);
      }

      // Monitor Layout Shifts
      try {
        const clsObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            this.recordMetric('cls', {
              name: 'Cumulative Layout Shift',
              value: entry.value,
              timestamp: Date.now(),
              threshold: 0.1,
              type: 'percentage'
            });
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('layout-shift', clsObserver);
      } catch (error) {
        console.warn('Layout shift monitoring not supported:', error);
      }
    }
  }

  recordMetric(category: string, metric: PerformanceMetric): void {
    if (!this.metrics.has(category)) {
      this.metrics.set(category, []);
    }
    
    const categoryMetrics = this.metrics.get(category)!;
    categoryMetrics.push(metric);
    
    // Keep only last 100 metrics per category
    if (categoryMetrics.length > 100) {
      categoryMetrics.shift();
    }

    // Check threshold violations
    if (metric.threshold && metric.value > metric.threshold) {
      this.handlePerformanceAlert(metric);
    }
  }

  private handlePerformanceAlert(metric: PerformanceMetric): void {
    console.warn(`Performance Alert: ${metric.name} exceeded threshold`, {
      value: metric.value,
      threshold: metric.threshold,
      timestamp: new Date(metric.timestamp)
    });
  }

  getMetrics(category?: string): Map<string, PerformanceMetric[]> | PerformanceMetric[] {
    if (category) {
      return this.metrics.get(category) || [];
    }
    return this.metrics;
  }

  // Component performance tracking
  trackComponentRender(componentName: string, renderTime: number): void {
    const existing = this.componentMetrics.get(componentName) || {
      componentName,
      renderCount: 0,
      totalRenderTime: 0,
      averageRenderTime: 0,
      lastRenderTime: 0
    };

    existing.renderCount += 1;
    existing.totalRenderTime += renderTime;
    existing.averageRenderTime = existing.totalRenderTime / existing.renderCount;
    existing.lastRenderTime = renderTime;

    this.componentMetrics.set(componentName, existing);

    // Alert for slow renders
    if (renderTime > 16.67) { // 60fps threshold
      console.warn(`Slow render detected: ${componentName} took ${renderTime}ms`);
    }
  }

  getComponentMetrics(): ComponentPerformance[] {
    return Array.from(this.componentMetrics.values());
  }

  // Memory monitoring
  checkMemoryUsage(): { used: number; total: number; percentage: number } | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const used = memory.usedJSHeapSize / 1024 / 1024; // MB
      const total = memory.totalJSHeapSize / 1024 / 1024; // MB
      const percentage = (used / total) * 100;

      this.recordMetric('memory', {
        name: 'Memory Usage',
        value: used,
        timestamp: Date.now(),
        threshold: this.thresholds.get('memoryUsage'),
        type: 'size'
      });

      return { used, total, percentage };
    }
    return null;
  }

  // Cleanup
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.metrics.clear();
    this.componentMetrics.clear();
  }
}

// React hooks for performance monitoring
export const usePerformanceMonitoring = (componentName: string) => {
  const optimizer = PerformanceOptimizer.getInstance();
  const renderStartTime = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    
    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      optimizer.trackComponentRender(componentName, renderTime);
    };
  });

  const trackCustomMetric = useCallback((name: string, value: number, type: PerformanceMetric['type'] = 'duration') => {
    optimizer.recordMetric('custom', {
      name,
      value,
      timestamp: Date.now(),
      type
    });
  }, [optimizer]);

  return { trackCustomMetric };
};

// Debounce hook for performance
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook for performance
export const useThrottle = <T>(value: T, limit: number): T => {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};

// Virtual scrolling for large lists
export const useVirtualScrolling = (
  items: any[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }
  };
};

export default PerformanceOptimizer;
