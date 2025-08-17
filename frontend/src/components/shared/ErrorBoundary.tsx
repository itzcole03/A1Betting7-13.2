import React from 'react';
import { useMetricsStore } from '../../metrics/metricsStore';

/**
 * Enhanced ErrorBoundary - Catches React rendering errors and displays a fallback UI.
 * Now includes special handling for metric initialization errors with retry functionality.
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  enableMetricRetry?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
  isMetricError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private maxRetries = 3;
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0,
      isMetricError: false
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Check if this is a metric-related error
    const isMetricError = error.message.includes('cache_hit_rate') || 
                          error.message.includes('metrics') || 
                          error.message.includes('Cannot read properties of undefined') ||
                          error.stack?.includes('normalizeMetrics') ||
                          error.stack?.includes('metricsStore');
    
    return { 
      hasError: true, 
      error,
      retryCount: 0,
      isMetricError: Boolean(isMetricError)
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error details to console for debugging
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    
    // For metric errors, attempt automatic retry after a delay
    if (this.state.isMetricError && this.state.retryCount < this.maxRetries) {
      this.scheduleRetry();
    }
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  scheduleRetry = () => {
    const retryDelay = Math.pow(2, this.state.retryCount) * 1000; // Exponential backoff
    
    const timeout = setTimeout(() => {
      console.log(`[ErrorBoundary] Attempting retry ${this.state.retryCount + 1}/${this.maxRetries}`);
      this.handleRetry();
    }, retryDelay);
    
    this.retryTimeouts.push(timeout);
  };

  handleRetry = () => {
    // Reset metrics store to clean state
    try {
      const metricsStore = useMetricsStore.getState();
      metricsStore.reset();
      metricsStore.clearError();
    } catch (err) {
      console.warn('[ErrorBoundary] Failed to reset metrics store:', err);
    }
    
    // Increment retry count and clear error state
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1,
      isMetricError: false
    }));
  };

  handleManualRetry = () => {
    // Reset retry count for manual retries
    this.setState({ retryCount: 0 });
    this.handleRetry();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback for metric errors
      if (this.state.isMetricError && this.props.enableMetricRetry !== false) {
        return (
          <div className='p-6 bg-amber-50 border border-amber-200 rounded-lg shadow-sm'>
            <div className='flex items-start'>
              <div className='flex-shrink-0'>
                <svg className='h-5 w-5 text-amber-400' viewBox='0 0 20 20' fill='currentColor'>
                  <path fillRule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
                </svg>
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-amber-800'>
                  Metrics Loading Issue
                </h3>
                <p className='mt-1 text-sm text-amber-700'>
                  There was an issue loading performance metrics. This is typically temporary and resolves automatically.
                </p>
                {this.state.retryCount < this.maxRetries && (
                  <p className='mt-1 text-xs text-amber-600'>
                    Auto-retry {this.state.retryCount}/{this.maxRetries} in progress...
                  </p>
                )}
                <div className='mt-4 flex gap-2'>
                  <button
                    onClick={this.handleManualRetry}
                    className='bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded text-sm transition-colors'
                  >
                    Retry Now
                  </button>
                  {this.state.error && (
                    <details className='text-xs text-amber-600'>
                      <summary className='cursor-pointer hover:text-amber-800'>Technical Details</summary>
                      <pre className='mt-1 whitespace-pre-wrap font-mono bg-amber-100 p-2 rounded'>
                        {this.state.error.message}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Default fallback for non-metric errors
      return (
        this.props.fallback || (
          <div className='p-6 bg-red-50 border border-red-200 rounded-lg shadow-sm'>
            <div className='flex items-start'>
              <div className='flex-shrink-0'>
                <svg className='h-5 w-5 text-red-400' viewBox='0 0 20 20' fill='currentColor'>
                  <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' clipRule='evenodd' />
                </svg>
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-red-800'>
                  Something went wrong
                </h3>
                <p className='mt-1 text-sm text-red-700'>
                  An unexpected error occurred. Please refresh the page to continue.
                </p>
                {this.state.error && (
                  <details className='mt-2 text-xs text-red-600'>
                    <summary className='cursor-pointer hover:text-red-800'>Technical Details</summary>
                    <pre className='mt-1 whitespace-pre-wrap font-mono bg-red-100 p-2 rounded'>
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className='mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm transition-colors'
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        )
      );
    }
    
    return this.props.children;
  }
}

export default ErrorBoundary;
