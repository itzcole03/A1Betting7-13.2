import React, { useCallback, useMemo, useRef, useEffect } from 'react';

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

interface BundleAnalysis {
  totalSize: number;
  chunks: Array<{
    name: string;
    size: number;
    percentage: number;
  }>;
  unusedCode: number;
  duplicateModules: string[];
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

      // Monitor First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric('fid', {
              name: 'First Input Delay',
              value: entry.duration,
              timestamp: Date.now(),
              threshold: 100,
              type: 'duration'
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('first-input', fidObserver);
      } catch (error) {
        console.warn('First input delay monitoring not supported:', error);
      }
    }

    // Monitor Web Vitals
    this.monitorWebVitals();
  }

  private monitorWebVitals(): void {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('lcp', {
            name: 'Largest Contentful Paint',
            value: lastEntry.startTime,
            timestamp: Date.now(),
            threshold: 2500,
            type: 'duration'
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (error) {
        console.warn('LCP monitoring not supported:', error);
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

    // In production, you might want to send this to an analytics service
    // analytics.track('performance_alert', metric);
  }

  getMetrics(category?: string): Map<string, PerformanceMetric[]> | PerformanceMetric[] {
    if (category) {
      return this.metrics.get(category) || [];
    }
    return this.metrics;
  }

  getAverageMetric(category: string, metricName: string): number {
    const categoryMetrics = this.metrics.get(category) || [];
    const filteredMetrics = categoryMetrics.filter(m => m.name === metricName);
    
    if (filteredMetrics.length === 0) return 0;
    
    const sum = filteredMetrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / filteredMetrics.length;
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

  // Bundle analysis
  analyzeBundleSize(): BundleAnalysis | null {
    if ('getEntriesByType' in performance) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(r => r.name.includes('.js'));
      
      const chunks = jsResources.map(resource => ({
        name: resource.name.split('/').pop() || 'unknown',
        size: resource.transferSize || 0,
        percentage: 0
      }));

      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
      
      chunks.forEach(chunk => {
        chunk.percentage = totalSize > 0 ? (chunk.size / totalSize) * 100 : 0;
      });

      return {
        totalSize,
        chunks: chunks.sort((a, b) => b.size - a.size),
        unusedCode: 0, // Would need additional tooling to calculate
        duplicateModules: []
      };
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

// HOC for performance monitoring
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> => {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const PerformanceMonitoredComponent: React.FC<P> = (props) => {
    const renderStartTime = useRef<number>(0);
    const optimizer = PerformanceOptimizer.getInstance();

    useEffect(() => {
      renderStartTime.current = performance.now();
      
      return () => {
        const renderTime = performance.now() - renderStartTime.current;
        optimizer.trackComponentRender(displayName, renderTime);
      };
    });

    return <WrappedComponent {...props} />;
  };

  PerformanceMonitoredComponent.displayName = `withPerformanceMonitoring(${displayName})`;
  
  return PerformanceMonitoredComponent;
};

// Utility functions for optimization
export const optimizeImages = {
  // Lazy loading with Intersection Observer
  useLazyLoading: (threshold = 0.1) => {
    const [isIntersecting, setIsIntersecting] = React.useState(false);
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            observer.disconnect();
          }
        },
        { threshold }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => observer.disconnect();
    }, [threshold]);

    return [ref, isIntersecting] as const;
  },

  // Progressive image loading
  useProgressiveImage: (lowQualitySrc: string, highQualitySrc: string) => {
    const [src, setSrc] = React.useState(lowQualitySrc);
    const [isLoaded, setIsLoaded] = React.useState(false);

    useEffect(() => {
      const img = new Image();
      img.onload = () => {
        setSrc(highQualitySrc);
        setIsLoaded(true);
      };
      img.src = highQualitySrc;
    }, [highQualitySrc]);

    return { src, isLoaded };
  }
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

// Memoization utilities
export const createMemoizedSelector = <T, R>(
  selector: (state: T) => R,
  equalityFn?: (a: R, b: R) => boolean
) => {
  let lastArgs: T | undefined;
  let lastResult: R;
  
  return (state: T): R => {
    if (lastArgs === undefined || !equalityFn?.(selector(state), lastResult)) {
      lastArgs = state;
      lastResult = selector(state);
    }
    return lastResult;
  };
};

export default PerformanceOptimizer;