/**
 * Enhanced Error Boundary with Modern Error Handling
 * Implements comprehensive error tracking, recovery strategies, and user-friendly fallbacks
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  isRecovering: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  enableRecovery?: boolean;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  resetError: () => void;
  retry: () => void;
  retryCount: number;
  errorId: string;
}

interface ErrorReport {
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId: string;
  errorId: string;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  componentStack: string;
  additionalContext: Record<string, any>;
}

class EnhancedErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private sessionId = this.generateSessionId();

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      isRecovering: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: EnhancedErrorBoundary.generateErrorId(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('[EnhancedErrorBoundary] Error caught:', error);
    console.error('[EnhancedErrorBoundary] Error info:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Report error
    this.reportError(error, errorInfo);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Attempt automatic recovery for certain error types
    if (this.props.enableRecovery && this.shouldAttemptRecovery(error)) {
      this.scheduleRecovery();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state if props change (useful for route changes)
    if (hasError && resetOnPropsChange && this.propsHaveChanged(prevProps, resetKeys)) {
      this.resetError();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private propsHaveChanged(
    prevProps: ErrorBoundaryProps,
    resetKeys?: Array<string | number>
  ): boolean {
    if (!resetKeys) {
      return JSON.stringify(prevProps) !== JSON.stringify(this.props);
    }

    return resetKeys.some(key => (prevProps as any)[key] !== (this.props as any)[key]);
  }

  private shouldAttemptRecovery(error: Error): boolean {
    // Define which errors should trigger automatic recovery
    const recoverableErrors = [
      'ChunkLoadError',
      'Loading chunk',
      'Loading CSS chunk',
      'ResizeObserver loop limit exceeded',
    ];

    return recoverableErrors.some(
      pattern => error.message.includes(pattern) || error.name.includes(pattern)
    );
  }

  private scheduleRecovery(): void {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState({ isRecovering: true });

      // Exponential backoff for retry attempts
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);

      this.retryTimeoutId = setTimeout(() => {
        this.retry();
      }, delay);
    }
  }

  private retry = (): void => {
    const { retryCount } = this.state;

    console.log(`[EnhancedErrorBoundary] Attempting recovery (${retryCount + 1})`);

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      isRecovering: false,
    }));
  };

  private resetError = (): void => {
    console.log('[EnhancedErrorBoundary] Resetting error state');

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false,
      errorId: '',
    });
  };

  private reportError(error: Error, errorInfo: ErrorInfo): void {
    const errorReport: ErrorReport = {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
      errorId: this.state.errorId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      componentStack: errorInfo.componentStack || '',
      additionalContext: {
        props: this.props,
        retryCount: this.state.retryCount,
      },
    };

    // Store error report locally
    this.storeErrorReport(errorReport);

    // Send to error reporting service (if configured)
    this.sendErrorReport(errorReport);
  }

  private storeErrorReport(report: ErrorReport): void {
    try {
      const key = `error_${report.errorId}_${report.timestamp}`;
      localStorage.setItem(key, JSON.stringify(report));

      // Clean up old error reports (keep only last 10)
      this.cleanupErrorReports();
    } catch (e) {
      console.warn('[EnhancedErrorBoundary] Failed to store error report:', e);
    }
  }

  private cleanupErrorReports(): void {
    try {
      const errorKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('error_'))
        .sort()
        .reverse();

      // Remove old reports, keep only the most recent 10
      errorKeys.slice(10).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (e) {
      console.warn('[EnhancedErrorBoundary] Failed to cleanup error reports:', e);
    }
  }

  private async sendErrorReport(report: ErrorReport): Promise<void> {
    try {
      // Only send in production or if explicitly enabled
      if (process.env.NODE_ENV !== 'production') {
        console.log('[EnhancedErrorBoundary] Error report (dev mode):', report);
        return;
      }

      // Send to error reporting endpoint
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
    } catch (e) {
      console.warn('[EnhancedErrorBoundary] Failed to send error report:', e);
    }
  }

  private static generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  render() {
    const { hasError, error, errorInfo, errorId, retryCount, isRecovering } = this.state;
    const { children, fallback: FallbackComponent } = this.props;

    if (hasError && error && errorInfo) {
      // Show recovery loading state
      if (isRecovering) {
        return (
          <div className='flex items-center justify-center min-h-[200px] bg-slate-900 rounded-lg border border-slate-700'>
            <div className='text-center p-6'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4'></div>
              <p className='text-white text-lg font-medium'>Recovering...</p>
              <p className='text-slate-400 text-sm mt-2'>Attempting to restore functionality</p>
            </div>
          </div>
        );
      }

      // Use custom fallback component if provided
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={error}
            errorInfo={errorInfo}
            resetError={this.resetError}
            retry={this.retry}
            retryCount={retryCount}
            errorId={errorId}
          />
        );
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback
          error={error}
          errorInfo={errorInfo}
          resetError={this.resetError}
          retry={this.retry}
          retryCount={retryCount}
          errorId={errorId}
        />
      );
    }

    return children;
  }
}

/**
 * Default Error Fallback Component
 */
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  retry,
  retryCount,
  errorId,
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className='min-h-[400px] bg-slate-900 rounded-lg border border-red-500/20 p-6'>
      <div className='text-center mb-6'>
        <div className='w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4'>
          <svg
            className='w-8 h-8 text-red-500'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
            />
          </svg>
        </div>
        <h2 className='text-xl font-bold text-white mb-2'>Something went wrong</h2>
        <p className='text-slate-400 mb-4'>
          We encountered an unexpected error. Our team has been notified.
        </p>
        <p className='text-xs text-slate-500 mb-6'>Error ID: {errorId}</p>
      </div>

      <div className='flex gap-3 justify-center mb-6'>
        <button
          onClick={retry}
          disabled={retryCount >= 3}
          className='px-4 py-2 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        >
          {retryCount >= 3
            ? 'Max Retries Reached'
            : `Retry${retryCount > 0 ? ` (${retryCount})` : ''}`}
        </button>
        <button
          onClick={resetError}
          className='px-4 py-2 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-600 transition-colors'
        >
          Reset
        </button>
      </div>

      <div className='text-center'>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className='text-slate-400 hover:text-white text-sm transition-colors'
        >
          {showDetails ? 'Hide' : 'Show'} Error Details
        </button>
      </div>

      {showDetails && (
        <div className='mt-4 p-4 bg-slate-800 rounded-lg'>
          <h3 className='text-white font-medium mb-2'>Error Details:</h3>
          <p className='text-red-400 text-sm mb-2'>
            {error.name}: {error.message}
          </p>
          {error.stack && (
            <details className='text-xs text-slate-400'>
              <summary className='cursor-pointer hover:text-white'>Stack Trace</summary>
              <pre className='mt-2 whitespace-pre-wrap overflow-x-auto'>{error.stack}</pre>
            </details>
          )}
          {errorInfo.componentStack && (
            <details className='text-xs text-slate-400 mt-2'>
              <summary className='cursor-pointer hover:text-white'>Component Stack</summary>
              <pre className='mt-2 whitespace-pre-wrap overflow-x-auto'>
                {errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

export {
  DefaultErrorFallback,
  EnhancedErrorBoundary,
  type ErrorBoundaryProps,
  type ErrorFallbackProps,
};
export default EnhancedErrorBoundary;
