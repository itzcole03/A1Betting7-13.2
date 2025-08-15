/**
 * Enhanced Global Error Boundary with Toast Notifications
 * Provides comprehensive error handling with user-friendly notifications
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import toast, { Toaster, ToastPosition } from 'react-hot-toast';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableToast?: boolean;
  toastPosition?: ToastPosition;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  correlationId: string | null;
  retryCount: number;
}

interface ErrorReport {
  id: string;
  timestamp: string;
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  errorInfo: {
    componentStack: string;
  };
  correlationId: string;
  userAgent: string;
  url: string;
  retryCount: number;
  sessionId: string;
}

export class EnhancedGlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private maxRetries = 3;
  private sessionId = crypto.randomUUID();

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      correlationId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const correlationId = crypto.randomUUID();
    return {
      hasError: true,
      error,
      correlationId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const correlationId = this.state.correlationId || crypto.randomUUID();
    
    this.setState({
      error,
      errorInfo,
      correlationId,
    });

    // Show toast notification
    if (this.props.enableToast !== false) {
      this.showErrorToast(error);
    }

    // Log error details
    this.logError(error, errorInfo, correlationId);

    // Report to backend
    this.reportError(error, errorInfo, correlationId);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Add to global error store if available
    this.addToErrorStore(error, errorInfo, correlationId);
  }

  private showErrorToast = (error: Error) => {
    const errorMessage = this.getErrorMessage(error);
    
    toast.error(errorMessage, {
      duration: 5000,
      position: this.props.toastPosition || 'top-right',
      style: {
        background: 'rgba(239, 68, 68, 0.95)',
        color: 'white',
        fontSize: '14px',
        maxWidth: '500px',
      },
      icon: '⚠️',
    });

    // Show retry option for recoverable errors
    if (this.isRecoverableError(error) && this.state.retryCount < this.maxRetries) {
      toast(
        (t) => (
          <div className="flex items-center gap-3">
            <span>Try reloading the component?</span>
            <button
              className="bg-white text-red-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100"
              onClick={() => {
                toast.dismiss(t.id);
                this.handleRetry();
              }}
            >
              Retry
            </button>
            <button
              className="text-white/80 hover:text-white"
              onClick={() => toast.dismiss(t.id)}
            >
              ✕
            </button>
          </div>
        ),
        {
          duration: 8000,
          position: this.props.toastPosition || 'top-right',
          style: {
            background: 'rgba(59, 130, 246, 0.95)',
            color: 'white',
          },
        }
      );
    }
  };

  private getErrorMessage = (error: Error): string => {
    // User-friendly error messages based on error type
    if (error.message?.includes('ChunkLoadError') || error.message?.includes('Loading chunk')) {
      return 'Unable to load application resources. Please refresh the page.';
    }
    
    if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
      return 'Network connection error. Please check your internet connection.';
    }
    
    if (error.message?.includes('Permission denied') || error.message?.includes('Unauthorized')) {
      return 'Access denied. Please check your permissions or re-login.';
    }
    
    if (error.name === 'ValidationError') {
      return 'Invalid data detected. Please check your input and try again.';
    }

    // Generic fallback
    return 'An unexpected error occurred. Our team has been notified.';
  };

  private isRecoverableError = (error: Error): boolean => {
    const recoverableErrors = [
      'ChunkLoadError',
      'NetworkError',
      'TimeoutError',
      'AbortError',
      'Failed to fetch',
    ];

    return recoverableErrors.some(errorType => 
      error.message?.includes(errorType) || error.name === errorType
    );
  };

  private logError = (error: Error, errorInfo: ErrorInfo, correlationId: string) => {
    const errorReport: ErrorReport = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack || '',
      },
      correlationId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount,
      sessionId: this.sessionId,
    };

    // Development only logging
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('[EnhancedGlobalErrorBoundary] Error Report:', errorReport);
    }

    // Store in localStorage for debugging
    try {
      const errorHistory = JSON.parse(localStorage.getItem('error_history') || '[]');
      errorHistory.unshift(errorReport);
      // Keep only last 10 errors
      errorHistory.splice(10);
      localStorage.setItem('error_history', JSON.stringify(errorHistory));
    } catch (storageError) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('Failed to store error in localStorage:', storageError);
      }
    }
  };

  private reportError = async (error: Error, errorInfo: ErrorInfo, correlationId: string) => {
    try {
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId,
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          name: error.name,
          componentStack: errorInfo.componentStack,
          correlationId,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          retryCount: this.state.retryCount,
          sessionId: this.sessionId,
        }),
      });
    } catch (reportError) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console  
        console.warn('Failed to report error to backend:', reportError);
      }
    }
  };

  private addToErrorStore = async (error: Error, errorInfo: ErrorInfo, correlationId: string) => {
    try {
      // Dynamic import to avoid circular dependencies
      const { useErrorStore } = await import('../../stores/errorStore');
      const { addError } = useErrorStore.getState();
      addError({
        id: correlationId,
        message: error.message,
        category: 'unknown',
        details: {
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        },
        correlationId,
        statusCode: undefined,
      });
    } catch (storeError) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('Failed to add error to store:', storeError);
      }
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        correlationId: null,
        retryCount: prevState.retryCount + 1,
      }));

      toast.success('Retrying...', {
        duration: 2000,
        position: this.props.toastPosition || 'top-right',
      });
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      correlationId: null,
      retryCount: 0,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <>
            <FallbackComponent error={this.state.error!} retry={this.handleRetry} />
            <Toaster position={this.props.toastPosition || 'top-right'} />
          </>
        );
      }

      // Default fallback UI
      return (
        <>
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-slate-800 rounded-lg border border-red-500/20 p-6">
              <div className="text-center mb-6">
                <div className="text-red-400 text-4xl mb-4">⚠️</div>
                <h1 className="text-xl font-bold text-white mb-2">
                  Something went wrong
                </h1>
                <p className="text-slate-400 text-sm mb-4">
                  {this.getErrorMessage(this.state.error!)}
                </p>
              </div>

              {this.state.correlationId && (
                <div className="mb-6 p-3 bg-slate-700 rounded">
                  <div className="text-xs text-slate-400 mb-1">Error ID:</div>
                  <div className="font-mono text-xs text-slate-300 break-all">
                    {this.state.correlationId}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {this.state.retryCount < this.maxRetries && (
                  <button
                    onClick={this.handleRetry}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-medium transition-colors"
                  >
                    Try Again ({this.maxRetries - this.state.retryCount} left)
                  </button>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded font-medium transition-colors"
                >
                  Reload Page
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-xs">
                  <summary className="cursor-pointer text-slate-400 hover:text-slate-300">
                    Developer Info
                  </summary>
                  <pre className="mt-2 text-red-400 bg-slate-900 p-2 rounded overflow-auto max-h-32">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
          <Toaster position={this.props.toastPosition || 'top-right'} />
        </>
      );
    }

    return (
      <>
        {this.props.children}
        <Toaster position={this.props.toastPosition || 'top-right'} />
      </>
    );
  }
}

export default EnhancedGlobalErrorBoundary;
