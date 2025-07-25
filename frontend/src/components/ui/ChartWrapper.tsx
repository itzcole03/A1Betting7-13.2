// @ts-expect-error TS(2305): Module '"react"' has no exported member 'ErrorBoun... Remove this comment to see the full error message
import React, { useState, useEffect, useRef, Suspense, ErrorBoundary } from 'react';
// @ts-expect-error TS(2307): Cannot find module '@/lib/utils' or its correspond... Remove this comment to see the full error message
import { cn } from '@/lib/utils';

// Types for chart wrapper
interface ChartConfig {
  responsive: boolean;
  maintainAspectRatio: boolean;
  aspectRatio?: number;
  animation: boolean;
  interaction: boolean;
  plugins: {
    legend: boolean;
    tooltip: boolean;
    zoom: boolean;
    export: boolean;
  };
}

interface ChartData {
  datasets: unknown[];
  labels?: string[];
  metadata?: Record<string, unknown>;
}

interface ChartError {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: Date;
}

interface ChartWrapperProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'cyber' | 'card' | 'minimal' | 'dashboard';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'auto';
  loading?: boolean;
  error?: string | Error | null;
  data?: ChartData | null;
  config?: Partial<ChartConfig>;
  showHeader?: boolean;
  showFooter?: boolean;
  showControls?: boolean;
  showExportButton?: boolean;
  showFullscreenButton?: boolean;
  showRefreshButton?: boolean;
  enableErrorBoundary?: boolean;
  enableLazyLoading?: boolean;
  enableVirtualization?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
  refreshInterval?: number;
  className?: string;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  onRetry?: () => void;
  onRefresh?: () => void;
  onExport?: (format: 'png' | 'svg' | 'pdf' | 'csv') => void;
  onFullscreen?: () => void;
  onConfigChange?: (config: ChartConfig) => void;
  onError?: (error: ChartError) => void;
}

interface ChartWrapperState {
  isFullscreen: boolean;
  isLoading: boolean;
  error: ChartError | null;
  retryCount: number;
  dimensions: { width: number; height: number };
  isVisible: boolean;
}

const _defaultConfig: ChartConfig = {
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: 2,
  animation: true,
  interaction: true,
  plugins: {
    legend: true,
    tooltip: true,
    zoom: false,
    export: true,
  },
};

const _getSizeClasses = (size: string) => {
  const _sizes = {
    sm: 'w-64 h-32',
    md: 'w-96 h-48',
    lg: 'w-[32rem] h-64',
    xl: 'w-[48rem] h-96',
    auto: 'w-full h-auto',
  };
  return sizes[size as keyof typeof sizes] || sizes.md;
};

const _formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const _k = 1024;
  const _sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const _i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Error Boundary Component
class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: ChartError) => void; fallback: React.ReactNode },
  { hasError: boolean; error: ChartError | null }
> {
  constructor(props: unknown) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: ChartError } {
    return {
      hasError: true,
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date(),
      },
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const _chartError: ChartError = {
      message: error.message,
      stack: error.stack,
      // @ts-expect-error TS(2322): Type 'string | null | undefined' is not assignable... Remove this comment to see the full error message
      componentStack: errorInfo.componentStack,
      timestamp: new Date(),
    };

    this.props.onError(chartError);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Intersection Observer Hook for Lazy Loading
const _useIntersectionObserver = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const _ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const _observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold]);

  return [ref, isVisible] as const;
};

// Resize Observer Hook
const _useResizeObserver = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const _ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const _observer = new ResizeObserver(entries => {
      const _entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, dimensions] as const;
};

export const _ChartWrapper: React.FC<ChartWrapperProps> = ({
  children,
  title,
  subtitle,
  variant = 'default',
  size = 'md',
  loading = false,
  error = null,
  data = null,
  config: userConfig,
  showHeader = true,
  showFooter = false,
  showControls = true,
  showExportButton = true,
  showFullscreenButton = true,
  showRefreshButton = false,
  enableErrorBoundary = true,
  enableLazyLoading = false,
  enableVirtualization = false,
  retryOnError = true,
  maxRetries = 3,
  refreshInterval,
  className,
  loadingComponent,
  errorComponent,
  emptyComponent,
  onRetry,
  onRefresh,
  onExport,
  onFullscreen,
  onConfigChange,
  onError,
}) => {
  const [state, setState] = useState<ChartWrapperState>({
    isFullscreen: false,
    isLoading: loading,
    error: null,
    retryCount: 0,
    dimensions: { width: 0, height: 0 },
    isVisible: false,
  });

  const [config, setConfig] = useState<ChartConfig>({
    ...defaultConfig,
    ...userConfig,
  });

  const [containerRef, containerSize] = useResizeObserver();
  const [intersectionRef, isInViewport] = useIntersectionObserver();
  const _wrapperRef = useRef<HTMLDivElement>(null);

  // Combine refs
  const _combinedRef = (node: HTMLDivElement) => {
    if (containerRef.current !== node) {
      (containerRef as unknown).current = node;
    }
    if (intersectionRef.current !== node) {
      (intersectionRef as unknown).current = node;
    }
    // @ts-expect-error TS(2540): Cannot assign to 'current' because it is a read-on... Remove this comment to see the full error message
    wrapperRef.current = node;
  };

  // Handle error prop changes
  useEffect(() => {
    if (error) {
      const _chartError: ChartError = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date(),
      };

      setState(prev => ({ ...prev, error: chartError, isLoading: false }));
      onError?.(chartError);
    } else {
      setState(prev => ({ ...prev, error: null }));
    }
  }, [error, onError]);

  // Handle loading state
  useEffect(() => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, [loading]);

  // Auto refresh
  useEffect(() => {
    if (!refreshInterval || !onRefresh) return;

    const _interval = setInterval(() => {
      onRefresh();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval, onRefresh]);

  // Fullscreen handling
  useEffect(() => {
    const _handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.isFullscreen) {
        exitFullscreen();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [state.isFullscreen]);

  const _handleRetry = () => {
    if (state.retryCount >= maxRetries) return;

    setState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      error: null,
      isLoading: true,
    }));

    onRetry?.();
  };

  const _enterFullscreen = () => {
    if (wrapperRef.current?.requestFullscreen) {
      wrapperRef.current.requestFullscreen();
      setState(prev => ({ ...prev, isFullscreen: true }));
      onFullscreen?.();
    }
  };

  const _exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      setState(prev => ({ ...prev, isFullscreen: false }));
    }
  };

  const _handleExport = (format: 'png' | 'svg' | 'pdf' | 'csv') => {
    onExport?.(format);
  };

  const _handleConfigChange = (newConfig: Partial<ChartConfig>) => {
    const _updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    onConfigChange?.(updatedConfig);
  };

  const _variantClasses = {
    default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    cyber:
      'bg-slate-900/95 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 backdrop-blur-md',
    card: 'bg-white border border-gray-300 rounded-xl shadow-lg',
    minimal: 'bg-transparent',
    dashboard: 'bg-white border border-gray-200 rounded-lg shadow-md',
  };

  // Render loading state
  const _renderLoading = () => (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='flex items-center justify-center h-full min-h-32'>
      {loadingComponent || (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex flex-col items-center space-y-3'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn(
              'animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full',
              variant === 'cyber' ? 'text-cyan-400' : 'text-blue-500'
            )}
          />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className={cn('text-sm', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-600')}>
            Loading chart...
          </div>
        </div>
      )}
    </div>
  );

  // Render error state
  const _renderError = () => (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='flex flex-col items-center justify-center h-full min-h-32 p-6'>
      {errorComponent || (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-4xl mb-3'>📊</div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn(
              'text-lg font-medium mb-2',
              variant === 'cyber' ? 'text-red-300' : 'text-red-600'
            )}
          >
            Chart Error
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn(
              'text-sm text-center mb-4 max-w-md',
              variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600'
            )}
          >
            {state.error?.message || 'An error occurred while rendering the chart'}
          </div>
          {retryOnError && state.retryCount < maxRetries && onRetry && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <button
              onClick={handleRetry}
              className={cn(
                'px-4 py-2 text-sm rounded transition-colors',
                variant === 'cyber'
                  ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              )}
            >
              Retry ({maxRetries - state.retryCount} attempts left)
            </button>
          )}
        </>
      )}
    </div>
  );

  // Render empty state
  const _renderEmpty = () => (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='flex flex-col items-center justify-center h-full min-h-32'>
      {emptyComponent || (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-4xl mb-3'>📈</div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn(
              'text-lg font-medium mb-2',
              variant === 'cyber' ? 'text-cyan-300' : 'text-gray-700'
            )}
          >
            No Data Available
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn(
              'text-sm text-center',
              variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500'
            )}
          >
            There's no data to display in this chart
          </div>
        </>
      )}
    </div>
  );

  // Check if we should render (lazy loading)
  const _shouldRender = !enableLazyLoading || isInViewport;

  // Chart content
  const _chartContent = () => {
    if (state.isLoading) return renderLoading();
    if (state.error) return renderError();
    if (!data || (data.datasets && data.datasets.length === 0)) return renderEmpty();
    if (!shouldRender) return renderLoading();

    return children;
  };

  const _ChartContent = () => {
    if (enableErrorBoundary) {
      return (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ChartErrorBoundary
          onError={error => {
            setState(prev => ({ ...prev, error }));
            onError?.(error);
          }}
          fallback={renderError()}
        >
          {chartContent()}
        </ChartErrorBoundary>
      );
    }

    return chartContent();
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div
      ref={combinedRef}
      className={cn(
        'relative flex flex-col',
        size !== 'auto' && getSizeClasses(size),
        variantClasses[variant],
        state.isFullscreen && 'fixed inset-0 z-50 w-screen h-screen rounded-none',
        className
      )}
    >
      {/* Header */}
      {showHeader && (title || showControls) && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'flex items-center justify-between p-4 border-b',
            variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
          )}
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex-1'>
            {title && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h3
                className={cn(
                  'text-lg font-semibold',
                  variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                )}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <p
                className={cn(
                  'text-sm mt-1',
                  variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600'
                )}
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* Controls */}
          {showControls && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-2'>
              {showRefreshButton && onRefresh && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <button
                  onClick={onRefresh}
                  className={cn(
                    'p-2 rounded transition-colors',
                    variant === 'cyber'
                      ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  )}
                  title='Refresh'
                >
                  🔄
                </button>
              )}

              {showExportButton && onExport && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='relative group'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <button
                    className={cn(
                      'p-2 rounded transition-colors',
                      variant === 'cyber'
                        ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    )}
                    title='Export'
                  >
                    📤
                  </button>

                  {/* Export Dropdown */}
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div
                    className={cn(
                      'absolute right-0 top-full mt-1 w-32 rounded shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity z-10',
                      variant === 'cyber'
                        ? 'bg-slate-800 border-cyan-500/30'
                        : 'bg-white border-gray-200'
                    )}
                  >
                    {['png', 'svg', 'pdf', 'csv'].map(format => (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <button
                        key={format}
                        onClick={() => handleExport(format as unknown)}
                        className={cn(
                          'w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t last:rounded-b',
                          variant === 'cyber' && 'hover:bg-cyan-500/10 text-cyan-300'
                        )}
                      >
                        Export as {format.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showFullscreenButton && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <button
                  onClick={state.isFullscreen ? exitFullscreen : enterFullscreen}
                  className={cn(
                    'p-2 rounded transition-colors',
                    variant === 'cyber'
                      ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  )}
                  title={state.isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {state.isFullscreen ? '⊡' : '⊞'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Chart Content */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex-1 relative overflow-hidden'>
        {enableLazyLoading ? (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Suspense fallback={renderLoading()}>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <ChartContent />
          </Suspense>
        ) : (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <ChartContent />
        )}
      </div>

      {/* Footer */}
      {showFooter && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'p-3 border-t text-xs',
            variant === 'cyber'
              ? 'border-cyan-500/30 text-cyan-400/50'
              : 'border-gray-200 text-gray-500'
          )}
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-between'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-4'>
              {data && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span>
                  {data.datasets?.length || 0} dataset{data.datasets?.length !== 1 ? 's' : ''}
                </span>
              )}
              {containerSize.width > 0 && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span>
                  {Math.round(containerSize.width)} × {Math.round(containerSize.height)}
                </span>
              )}
            </div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              {state.error && <span className='text-red-500'>⚠️ Error</span>}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              {config.responsive && <span>📱 Responsive</span>}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              {config.animation && <span>✨ Animated</span>}
            </div>
          </div>
        </div>
      )}

      {/* Cyber Effects */}
      {variant === 'cyber' && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-lg pointer-events-none' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='absolute inset-0 bg-grid-white/[0.02] rounded-lg pointer-events-none' />
        </>
      )}
    </div>
  );
};
