import React, { useState, useEffect, useRef, Suspense, ErrorBoundary } from 'react';
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
  datasets: any[];
  labels?: string[];
  metadata?: Record<string, any>;
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

const defaultConfig: ChartConfig = {
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

const getSizeClasses = (size: string) => {
  const sizes = {
    sm: 'w-64 h-32',
    md: 'w-96 h-48',
    lg: 'w-[32rem] h-64',
    xl: 'w-[48rem] h-96',
    auto: 'w-full h-auto',
  };
  return sizes[size as keyof typeof sizes] || sizes.md;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Error Boundary Component
class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: ChartError) => void; fallback: React.ReactNode },
  { hasError: boolean; error: ChartError | null }
> {
  constructor(props: any) {
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
    const chartError: ChartError = {
      message: error.message,
      stack: error.stack,
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
const useIntersectionObserver = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
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
const useResizeObserver = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
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

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
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
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Combine refs
  const combinedRef = (node: HTMLDivElement) => {
    if (containerRef.current !== node) {
      (containerRef as any).current = node;
    }
    if (intersectionRef.current !== node) {
      (intersectionRef as any).current = node;
    }
    wrapperRef.current = node;
  };

  // Handle error prop changes
  useEffect(() => {
    if (error) {
      const chartError: ChartError = {
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

    const interval = setInterval(() => {
      onRefresh();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval, onRefresh]);

  // Fullscreen handling
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.isFullscreen) {
        exitFullscreen();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [state.isFullscreen]);

  const handleRetry = () => {
    if (state.retryCount >= maxRetries) return;

    setState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      error: null,
      isLoading: true,
    }));

    onRetry?.();
  };

  const enterFullscreen = () => {
    if (wrapperRef.current?.requestFullscreen) {
      wrapperRef.current.requestFullscreen();
      setState(prev => ({ ...prev, isFullscreen: true }));
      onFullscreen?.();
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      setState(prev => ({ ...prev, isFullscreen: false }));
    }
  };

  const handleExport = (format: 'png' | 'svg' | 'pdf' | 'csv') => {
    onExport?.(format);
  };

  const handleConfigChange = (newConfig: Partial<ChartConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    onConfigChange?.(updatedConfig);
  };

  const variantClasses = {
    default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    cyber:
      'bg-slate-900/95 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 backdrop-blur-md',
    card: 'bg-white border border-gray-300 rounded-xl shadow-lg',
    minimal: 'bg-transparent',
    dashboard: 'bg-white border border-gray-200 rounded-lg shadow-md',
  };

  // Render loading state
  const renderLoading = () => (
    <div className='flex items-center justify-center h-full min-h-32'>
      {loadingComponent || (
        <div className='flex flex-col items-center space-y-3'>
          <div
            className={cn(
              'animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full',
              variant === 'cyber' ? 'text-cyan-400' : 'text-blue-500'
            )}
          />
          <div className={cn('text-sm', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-600')}>
            Loading chart...
          </div>
        </div>
      )}
    </div>
  );

  // Render error state
  const renderError = () => (
    <div className='flex flex-col items-center justify-center h-full min-h-32 p-6'>
      {errorComponent || (
        <>
          <div className='text-4xl mb-3'>📊</div>
          <div
            className={cn(
              'text-lg font-medium mb-2',
              variant === 'cyber' ? 'text-red-300' : 'text-red-600'
            )}
          >
            Chart Error
          </div>
          <div
            className={cn(
              'text-sm text-center mb-4 max-w-md',
              variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600'
            )}
          >
            {state.error?.message || 'An error occurred while rendering the chart'}
          </div>
          {retryOnError && state.retryCount < maxRetries && onRetry && (
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
  const renderEmpty = () => (
    <div className='flex flex-col items-center justify-center h-full min-h-32'>
      {emptyComponent || (
        <>
          <div className='text-4xl mb-3'>📈</div>
          <div
            className={cn(
              'text-lg font-medium mb-2',
              variant === 'cyber' ? 'text-cyan-300' : 'text-gray-700'
            )}
          >
            No Data Available
          </div>
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
  const shouldRender = !enableLazyLoading || isInViewport;

  // Chart content
  const chartContent = () => {
    if (state.isLoading) return renderLoading();
    if (state.error) return renderError();
    if (!data || (data.datasets && data.datasets.length === 0)) return renderEmpty();
    if (!shouldRender) return renderLoading();

    return children;
  };

  const ChartContent = () => {
    if (enableErrorBoundary) {
      return (
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
        <div
          className={cn(
            'flex items-center justify-between p-4 border-b',
            variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
          )}
        >
          <div className='flex-1'>
            {title && (
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
            <div className='flex items-center space-x-2'>
              {showRefreshButton && onRefresh && (
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
                <div className='relative group'>
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
                  <div
                    className={cn(
                      'absolute right-0 top-full mt-1 w-32 rounded shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity z-10',
                      variant === 'cyber'
                        ? 'bg-slate-800 border-cyan-500/30'
                        : 'bg-white border-gray-200'
                    )}
                  >
                    {['png', 'svg', 'pdf', 'csv'].map(format => (
                      <button
                        key={format}
                        onClick={() => handleExport(format as any)}
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
      <div className='flex-1 relative overflow-hidden'>
        {enableLazyLoading ? (
          <Suspense fallback={renderLoading()}>
            <ChartContent />
          </Suspense>
        ) : (
          <ChartContent />
        )}
      </div>

      {/* Footer */}
      {showFooter && (
        <div
          className={cn(
            'p-3 border-t text-xs',
            variant === 'cyber'
              ? 'border-cyan-500/30 text-cyan-400/50'
              : 'border-gray-200 text-gray-500'
          )}
        >
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              {data && (
                <span>
                  {data.datasets?.length || 0} dataset{data.datasets?.length !== 1 ? 's' : ''}
                </span>
              )}
              {containerSize.width > 0 && (
                <span>
                  {Math.round(containerSize.width)} × {Math.round(containerSize.height)}
                </span>
              )}
            </div>

            <div className='flex items-center space-x-2'>
              {state.error && <span className='text-red-500'>⚠️ Error</span>}
              {config.responsive && <span>📱 Responsive</span>}
              {config.animation && <span>✨ Animated</span>}
            </div>
          </div>
        </div>
      )}

      {/* Cyber Effects */}
      {variant === 'cyber' && (
        <>
          <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-lg pointer-events-none' />
          <div className='absolute inset-0 bg-grid-white/[0.02] rounded-lg pointer-events-none' />
        </>
      )}
    </div>
  );
};
