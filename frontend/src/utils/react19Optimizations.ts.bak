import React, {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';

/**
 * React 19 Performance Optimizations
 * Implementation of concurrent features for A1Betting roadmap Phase 1.2
 */

// Enhanced memoization hook with React 19 optimizations
export function useEnhancedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  options?: {
    priority?: 'high' | 'low';
    experimental_deferredValue?: boolean;
  }
): T {
  const { priority = 'high', experimental_deferredValue = false } = options || {};

  const result = useMemo(factory, deps);
  // Always call useDeferredValue unconditionally
  const deferredResult = useDeferredValue(result);

  // Return deferredResult for low priority, otherwise result
  return priority === 'low' ? deferredResult : result;
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
  const [isPending, startTransitionLocal] = useTransition();
  const { priority = 'high' } = options || {};

  const deferredDeps = useDeferredValue(deps);

  const fetchData = useCallback(
    () => {
      if (priority === 'low') {
        startTransitionLocal(() => {
          fetchFn(); // Do not return the promise inside startTransition
        });
        // Return the promise outside the transition
        return fetchFn();
      } else {
        return fetchFn();
      }
    },
    priority === 'low' ? deferredDeps : deps
  );

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
  const PerformanceTrackedComponent: React.FC<P> = (props: P) => {
    const monitor = React19PerformanceMonitor.getInstance();

    // Measure render time
    const renderStart = performance.now();

    useEffect(() => {
      const renderEnd = performance.now();
      monitor.measureRender(componentName, renderEnd - renderStart);
    });

    return React.createElement(Component, props);
  };

  PerformanceTrackedComponent.displayName = `withPerformanceTracking(${componentName})`;
  return PerformanceTrackedComponent;
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
  const { itemHeight = 50, containerHeight = 400, overscan = 5, priority = 'high' } = options || {};

  const [startIndex, setStartIndex] = useState(0);

  // Always call useDeferredValue unconditionally
  const deferredItems = useDeferredValue(items);

  const visibleItems = useMemo(() => {
    const sourceItems = priority === 'low' ? deferredItems : items;
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const start = Math.max(0, startIndex - overscan);
    const end = Math.min(sourceItems.length - 1, startIndex + visibleCount + overscan);

    return sourceItems.slice(start, end + 1).map((item, index) => ({
      item,
      index: start + index,
      style: {
        position: 'absolute' as const,
        top: (start + index) * itemHeight,
        height: itemHeight,
        width: '100%',
      },
    }));
  }, [deferredItems, items, priority, startIndex, itemHeight, containerHeight, overscan]);

  const handleScroll = useOptimizedCallback(
    (scrollTop: number) => {
      const newStartIndex = Math.floor(scrollTop / itemHeight);
      setStartIndex(newStartIndex);
    },
    [itemHeight],
    { priority }
  );

  return {
    visibleItems,
    totalHeight: deferredItems.length * itemHeight,
    handleScroll,
    isDeferred: priority === 'low',
  };
}

// React 19 error boundary with enhanced error reporting
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

export class React19ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Enhanced error reporting with React 19 features
    console.error('React 19 Error Boundary caught an error:', error, errorInfo);

    // Report to performance monitoring
    const monitor = React19PerformanceMonitor.getInstance();
    monitor.measureRender('ErrorBoundary', performance.now());
  }

  override render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback;
      if (Fallback) {
        return React.createElement(Fallback, { error: this.state.error });
      }

      return React.createElement(
        'div',
        {
          className: 'error-boundary p-6 bg-red-50 border border-red-200 rounded-lg',
        },
        [
          React.createElement(
            'h2',
            {
              key: 'title',
              className: 'text-lg font-semibold text-red-800 mb-2',
            },
            'Something went wrong'
          ),
          React.createElement(
            'p',
            {
              key: 'message',
              className: 'text-red-600 text-sm',
            },
            this.state.error.message
          ),
          React.createElement(
            'button',
            {
              key: 'retry',
              onClick: () => this.setState({ hasError: false, error: null }),
              className: 'mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700',
            },
            'Try again'
          ),
        ]
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

  // Defer a value for better performance (custom hook)
  useDeferredValueUtil: <T>(value: T): T => {
    // This is a custom hook, so must be used in a React component or another hook
    return useDeferredValue(value);
  },

  // Check if updates are pending
  useTransitionState: () => {
    const [isPending, startTransitionLocal] = useTransition();
    return { isPending, startTransition: startTransitionLocal };
  },
};

// Performance profiler component
interface PerformanceProfilerProps {
  children: React.ReactNode;
  id: string;
  onRender?: (
    id: string,
    phase: 'mount' | 'update' | 'nested-update',
    actualDuration: number
  ) => void;
}

export function PerformanceProfiler({ children, id, onRender }: PerformanceProfilerProps) {
  return React.createElement(
    React.Profiler,
    {
      id,
      onRender: (
        profileId: string,
        phase: 'mount' | 'update' | 'nested-update',
        actualDuration: number
      ) => {
        const monitor = React19PerformanceMonitor.getInstance();
        monitor.measureRender(profileId, actualDuration);
        onRender?.(profileId, phase, actualDuration);
      },
    },
    children
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
