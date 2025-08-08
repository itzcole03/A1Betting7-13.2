import { useMemo, useCallback, useTransition, useDeferredValue, startTransition } from 'react';

/**
 * React 19 Performance Optimizations
 * Implementation of concurrent features for A1Betting roadmap Phase 1.2
 */

// Enhanced memoization hook with React 19 optimizations
export function useEnhancedMemo<T>(factory: () => T, deps: React.DependencyList, options?: {
  priority?: 'high' | 'low';
  experimental_deferredValue?: boolean;
}): T {
  const { priority = 'high', experimental_deferredValue = false } = options || {};
  
  const result = useMemo(factory, deps);
  
  // Use deferred value for low-priority computations
  if (experimental_deferredValue && priority === 'low') {
    return useDeferredValue(result);
  }
  
  return result;
}

// Optimized callback hook with automatic batching
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  options?: {
    priority?: 'high' | 'low';
    batchUpdates?: boolean;
  }
): T {
  const { priority = 'high', batchUpdates = true } = options || {};
  
  return useCallback((...args: Parameters<T>) => {
    if (batchUpdates && priority === 'low') {
      startTransition(() => {
        callback(...args);
      });
    } else {
      return callback(...args);
    }
  }, deps) as T;
}

// Enhanced data fetching with React 19 suspense boundaries
export function useOptimizedDataFetch<T>(
  fetchFn: () => Promise<T>,
  deps: React.DependencyList,
  options?: {
    suspense?: boolean;
    errorBoundary?: boolean;
    priority?: 'high' | 'low';
  }
) {
  const [isPending, startTransition] = useTransition();
  const { priority = 'high' } = options || {};
  
  const deferredDeps = useDeferredValue(deps);
  
  const fetchData = useCallback(() => {
    if (priority === 'low') {
      startTransition(() => {
        return fetchFn();
      });
    } else {
      return fetchFn();
    }
  }, priority === 'low' ? deferredDeps : deps);
  
  return {
    fetchData,
    isPending,
    isDeferred: priority === 'low',
  };
}

// Performance monitoring utilities for React 19
export class React19PerformanceMonitor {
  private static instance: React19PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  
  static getInstance(): React19PerformanceMonitor {
    if (!React19PerformanceMonitor.instance) {
      React19PerformanceMonitor.instance = new React19PerformanceMonitor();
    }
    return React19PerformanceMonitor.instance;
  }
  
  measureRender(componentName: string, renderTime: number) {
    if (!this.metrics.has(componentName)) {
      this.metrics.set(componentName, []);
    }
    this.metrics.get(componentName)!.push(renderTime);
    
    // Keep only last 100 measurements
    const measurements = this.metrics.get(componentName)!;
    if (measurements.length > 100) {
      measurements.shift();
    }
  }
  
  getAverageRenderTime(componentName: string): number {
    const measurements = this.metrics.get(componentName);
    if (!measurements || measurements.length === 0) return 0;
    
    const sum = measurements.reduce((a, b) => a + b, 0);
    return sum / measurements.length;
  }
  
  getPerformanceReport(): Record<string, { average: number; count: number; latest: number }> {
    const report: Record<string, { average: number; count: number; latest: number }> = {};
    
    for (const [componentName, measurements] of this.metrics.entries()) {
      if (measurements.length > 0) {
        report[componentName] = {
          average: this.getAverageRenderTime(componentName),
          count: measurements.length,
          latest: measurements[measurements.length - 1],
        };
      }
    }
    
    return report;
  }
}

// Component performance measurement HOC
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return function PerformanceTrackedComponent(props: P) {
    const monitor = React19PerformanceMonitor.getInstance();
    
    // Measure render time
    const renderStart = performance.now();
    
    React.useEffect(() => {
      const renderEnd = performance.now();
      monitor.measureRender(componentName, renderEnd - renderStart);
    });
    
    return <Component {...props} />;
  };
}

// Optimized list rendering with React 19 features
export function useVirtualizedList<T>(
  items: T[],
  options?: {
    itemHeight?: number;
    containerHeight?: number;
    overscan?: number;
    priority?: 'high' | 'low';
  }
) {
  const {
    itemHeight = 50,
    containerHeight = 400,
    overscan = 5,
    priority = 'high'
  } = options || {};
  
  const [startIndex, setStartIndex] = React.useState(0);
  const [endIndex, setEndIndex] = React.useState(0);
  
  // Use deferred value for low-priority lists
  const deferredItems = priority === 'low' ? useDeferredValue(items) : items;
  
  const visibleItems = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const start = Math.max(0, startIndex - overscan);
    const end = Math.min(deferredItems.length - 1, startIndex + visibleCount + overscan);
    
    return deferredItems.slice(start, end + 1).map((item, index) => ({
      item,
      index: start + index,
      style: {
        position: 'absolute' as const,
        top: (start + index) * itemHeight,
        height: itemHeight,
        width: '100%',
      },
    }));
  }, [deferredItems, startIndex, itemHeight, containerHeight, overscan]);
  
  const handleScroll = useOptimizedCallback((scrollTop: number) => {
    const newStartIndex = Math.floor(scrollTop / itemHeight);
    setStartIndex(newStartIndex);
  }, [itemHeight], { priority });
  
  return {
    visibleItems,
    totalHeight: deferredItems.length * itemHeight,
    handleScroll,
    isDeferred: priority === 'low',
  };
}

// React 19 error boundary with enhanced error reporting
export class React19ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Enhanced error reporting with React 19 features
    console.error('React 19 Error Boundary caught an error:', error, errorInfo);
    
    // Report to performance monitoring
    const monitor = React19PerformanceMonitor.getInstance();
    monitor.measureRender('ErrorBoundary', performance.now());
  }
  
  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback;
      if (Fallback) {
        return <Fallback error={this.state.error} />;
      }
      
      return (
        <div className="error-boundary p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
          <p className="text-red-600 text-sm">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Concurrent rendering utilities
export const ConcurrentUtils = {
  // Start a low-priority update
  startLowPriorityUpdate: (callback: () => void) => {
    startTransition(callback);
  },
  
  // Defer a value for better performance
  deferValue: <T>(value: T): T => {
    return useDeferredValue(value);
  },
  
  // Check if updates are pending
  useTransitionState: () => {
    const [isPending, startTransition] = useTransition();
    return { isPending, startTransition };
  },
};

// Performance profiler component
export function PerformanceProfiler({ 
  children, 
  id, 
  onRender 
}: { 
  children: React.ReactNode; 
  id: string; 
  onRender?: (id: string, phase: 'mount' | 'update', actualDuration: number) => void;
}) {
  return (
    <React.Profiler
      id={id}
      onRender={(id, phase, actualDuration) => {
        const monitor = React19PerformanceMonitor.getInstance();
        monitor.measureRender(id, actualDuration);
        onRender?.(id, phase, actualDuration);
      }}
    >
      {children}
    </React.Profiler>
  );
}

export default {
  useEnhancedMemo,
  useOptimizedCallback,
  useOptimizedDataFetch,
  useVirtualizedList,
  withPerformanceTracking,
  React19ErrorBoundary,
  PerformanceProfiler,
  ConcurrentUtils,
  React19PerformanceMonitor,
};