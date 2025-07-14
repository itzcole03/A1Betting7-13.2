import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

export interface EnhancedErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  variant?: 'default' | 'cyber' | 'minimal' | 'detailed';
  className?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  showErrorDetails?: boolean;
  enableReporting?: boolean;
  reportEndpoint?: string;
}

export class EnhancedErrorBoundary extends Component<
  EnhancedErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: EnhancedErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Report error if enabled
    if (this.props.enableReporting) {
      this.reportError(error, errorInfo);
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Enhanced Error Boundary caught an error:', error, errorInfo);
    }
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    if (!this.props.reportEndpoint) return;

    try {
      await fetch(this.props.reportEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorId: this.state.errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;

    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private copyErrorDetails = () => {
    const { error, errorInfo, errorId } = this.state;
    const errorDetails = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
    };

    navigator.clipboard
      .writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        // Could show a toast notification here
        console.log('Error details copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy error details:', err);
      });
  };

  render() {
    const {
      children,
      fallback,
      variant = 'default',
      className = '',
      enableRetry = true,
      maxRetries = 3,
      showErrorDetails = false,
    } = this.props;

    if (this.state.hasError) {
      if (fallback) {
        return fallback;
      }

      const baseClasses = `
        flex flex-col items-center justify-center p-8 min-h-[400px] rounded-lg border
        ${
          variant === 'cyber'
            ? 'bg-black border-red-500 text-red-400 shadow-lg shadow-red-500/20'
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
        }
        ${className}
      `;

      const canRetry = enableRetry && this.state.retryCount < maxRetries;

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={baseClasses}
        >
          {/* Cyber grid overlay */}
          {variant === 'cyber' && (
            <div className='absolute inset-0 opacity-10 pointer-events-none'>
              <div className='grid grid-cols-8 grid-rows-6 h-full w-full'>
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className='border border-red-500/30' />
                ))}
              </div>
            </div>
          )}

          <div className='relative z-10 text-center max-w-md'>
            {/* Error Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className='mb-6'
            >
              {variant === 'cyber' ? (
                <div className='w-16 h-16 mx-auto border-2 border-red-500 rounded-lg flex items-center justify-center'>
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
              ) : (
                <div
                  className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                    variant === 'cyber' ? 'bg-red-500/20' : 'bg-red-100 dark:bg-red-900/30'
                  }`}
                >
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
              )}
            </motion.div>

            {/* Error Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className='mb-6'
            >
              <h2
                className={`text-xl font-bold mb-2 ${
                  variant === 'cyber' ? 'text-red-400' : 'text-red-800 dark:text-red-400'
                }`}
              >
                {variant === 'cyber' ? 'SYSTEM ERROR DETECTED' : 'Something went wrong'}
              </h2>

              <p
                className={`text-sm ${
                  variant === 'cyber' ? 'text-red-300/70' : 'text-red-600 dark:text-red-300'
                }`}
              >
                {variant === 'cyber'
                  ? 'A critical error has been encountered in the application matrix.'
                  : 'An unexpected error occurred. Please try again or contact support if the problem persists.'}
              </p>

              {showErrorDetails && this.state.error && (
                <details className='mt-4 text-left'>
                  <summary
                    className={`cursor-pointer text-xs font-medium ${
                      variant === 'cyber' ? 'text-red-400' : 'text-red-700 dark:text-red-400'
                    }`}
                  >
                    Technical Details
                  </summary>
                  <div
                    className={`mt-2 p-3 rounded text-xs font-mono whitespace-pre-wrap ${
                      variant === 'cyber'
                        ? 'bg-red-900/20 border border-red-500/30 text-red-300'
                        : 'bg-red-100 border border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300'
                    }`}
                  >
                    <div className='mb-2'>
                      <strong>Error ID:</strong> {this.state.errorId}
                    </div>
                    <div className='mb-2'>
                      <strong>Message:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <div className='mt-1 text-xs'>{this.state.error.stack}</div>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className='flex flex-col sm:flex-row gap-3 justify-center'
            >
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    variant === 'cyber'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                      : 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                  }`}
                >
                  {variant === 'cyber' ? 'RETRY OPERATION' : 'Try Again'}
                  {this.state.retryCount > 0 && (
                    <span className='ml-2 text-xs opacity-70'>
                      ({this.state.retryCount}/{maxRetries})
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={this.handleReload}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  variant === 'cyber'
                    ? 'bg-red-400/10 text-red-400 border border-red-400/30 hover:bg-red-400/20'
                    : 'bg-white text-red-700 border border-red-300 hover:bg-red-50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700'
                }`}
              >
                {variant === 'cyber' ? 'RELOAD SYSTEM' : 'Reload Page'}
              </button>

              {showErrorDetails && (
                <button
                  onClick={this.copyErrorDetails}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    variant === 'cyber'
                      ? 'bg-red-400/10 text-red-400 border border-red-400/30 hover:bg-red-400/20'
                      : 'bg-white text-red-700 border border-red-300 hover:bg-red-50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700'
                  }`}
                >
                  Copy Details
                </button>
              )}
            </motion.div>

            {/* Retry exhausted message */}
            {enableRetry && this.state.retryCount >= maxRetries && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`mt-4 text-xs ${
                  variant === 'cyber' ? 'text-red-300/50' : 'text-red-500'
                }`}
              >
                {variant === 'cyber'
                  ? 'Maximum retry attempts exceeded. Manual intervention required.'
                  : 'Maximum retry attempts reached. Please reload the page or contact support.'}
              </motion.p>
            )}
          </div>
        </motion.div>
      );
    }

    return children;
  }
}
