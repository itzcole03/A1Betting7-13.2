/**
 * Enhanced Error Boundary with WebSocket-aware fallback UI
 * 
 * Distinguishes between transport/data initialization errors and provides
 * appropriate recovery actions including manual reconnection.
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { useWebSocketConnection } from '../websocket/useWebSocketConnection';
import { useMetrics } from '../store/metricsStore';

declare global {
  interface Window {
    gtag?: (command: string, action: string, params: Record<string, unknown>) => void;
  }
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorType: 'render' | 'websocket' | 'metrics' | 'unknown';
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (props: {
    error: Error;
    errorInfo: ErrorInfo;
    retry: () => void;
    retryCount: number;
  }) => ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Classify error type based on error message and stack
    const errorMessage = error.message.toLowerCase();
    const errorStack = error.stack?.toLowerCase() || '';
    
    let errorType: ErrorBoundaryState['errorType'] = 'unknown';
    
    if (
      errorMessage.includes('websocket') ||
      errorMessage.includes('connection') ||
      errorStack.includes('websocket')
    ) {
      errorType = 'websocket';
    } else if (
      errorMessage.includes('cache_hit_rate') ||
      errorMessage.includes('metrics') ||
      errorMessage.includes('undefined') && errorStack.includes('metrics')
    ) {
      errorType = 'metrics';
    } else if (
      errorMessage.includes('render') ||
      errorStack.includes('render')
    ) {
      errorType = 'render';
    }

    return {
      hasError: true,
      error,
      errorType
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error for debugging (in development)
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.group('🚨 Error Boundary Caught Error');
      // eslint-disable-next-line no-console
      console.error('Error:', error);
      // eslint-disable-next-line no-console
      console.error('Error Info:', errorInfo);
      // eslint-disable-next-line no-console
      console.error('Error Type:', this.state.errorType);
      // eslint-disable-next-line no-console
      console.groupEnd();
    }

    // Report error to monitoring (if available)
    this.reportError(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In a real app, you'd send this to your error reporting service
    const gtag = window.gtag;
    if (gtag) {
      gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: {
          error_type: this.state.errorType,
          component_stack: errorInfo.componentStack
        }
      });
    }
  };

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  private handleRetryWithDelay = (delayMs: number = 1000) => {
    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delayMs);
  };

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          retry: this.handleRetry,
          retryCount: this.state.retryCount
        });
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorType={this.state.errorType}
          retryCount={this.state.retryCount}
          onRetry={this.handleRetry}
          onRetryWithDelay={this.handleRetryWithDelay}
        />
      );
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  errorType: ErrorBoundaryState['errorType'];
  retryCount: number;
  onRetry: () => void;
  onRetryWithDelay: (delay: number) => void;
}

function DefaultErrorFallback({
  error,
  errorType,
  retryCount,
  onRetry,
  onRetryWithDelay
}: DefaultErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
            <p className="text-sm text-gray-400">
              {getErrorTypeDescription(errorType)}
            </p>
          </div>
        </div>

        <div className="mb-6 p-3 bg-gray-700 rounded text-sm">
          <div className="font-mono text-red-300 mb-2">
            {error.message}
          </div>
          {retryCount > 0 && (
            <div className="text-xs text-gray-400">
              Retry attempt: {retryCount}
            </div>
          )}
        </div>

        <ErrorRecoveryActions
          errorType={errorType}
          onRetry={onRetry}
          onRetryWithDelay={onRetryWithDelay}
          retryCount={retryCount}
        />

        {import.meta.env.DEV && (
          <details className="mt-4">
            <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
              Technical Details
            </summary>
            <pre className="mt-2 text-xs text-gray-500 bg-gray-700 p-2 rounded overflow-auto max-h-40">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

interface ErrorRecoveryActionsProps {
  errorType: ErrorBoundaryState['errorType'];
  onRetry: () => void;
  onRetryWithDelay: (delay: number) => void;
  retryCount: number;
}

function ErrorRecoveryActions({
  errorType,
  onRetry,
  onRetryWithDelay,
  retryCount
}: ErrorRecoveryActionsProps) {
  return (
    <div className="space-y-3">
      {errorType === 'websocket' && <WebSocketRecoveryActions />}
      {errorType === 'metrics' && <MetricsRecoveryActions />}
      
      {/* General recovery actions */}
      <div className="flex space-x-3">
        <button
          onClick={onRetry}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors"
        >
          Try Again
        </button>
        
        {retryCount > 0 && retryCount < 3 && (
          <button
            onClick={() => onRetryWithDelay(2000)}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors"
          >
            Retry in 2s
          </button>
        )}
      </div>
      
      <button
        onClick={() => window.location.reload()}
        className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors"
      >
        Reload Page
      </button>
    </div>
  );
}

function WebSocketRecoveryActions() {
  const { forceReconnect, isConnected, isFallback } = useWebSocketConnection();
  
  return (
    <div className="bg-blue-900/20 border border-blue-600/30 rounded p-3 mb-3">
      <div className="text-sm text-blue-300 mb-2">WebSocket Recovery</div>
      
      <div className="flex space-x-2">
        <button
          onClick={forceReconnect}
          className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-xs font-medium transition-colors"
        >
          Force Reconnect
        </button>
        
        <div className="text-xs text-gray-400 flex items-center">
          {isConnected ? (
            <span className="text-green-400">Connected</span>
          ) : isFallback ? (
            <span className="text-yellow-400">Fallback Mode</span>
          ) : (
            <span className="text-red-400">Disconnected</span>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricsRecoveryActions() {
  const { setError, connected } = useMetrics();
  
  return (
    <div className="bg-yellow-900/20 border border-yellow-600/30 rounded p-3 mb-3">
      <div className="text-sm text-yellow-300 mb-2">Metrics Recovery</div>
      <div className="text-xs text-gray-400 mb-2">
        The error was likely caused by missing metrics data.
      </div>
      
      <button
        onClick={() => setError(null)}
        className="bg-yellow-600 hover:bg-yellow-700 text-white py-1 px-3 rounded text-xs font-medium transition-colors"
      >
        Reset Metrics
      </button>
      
      <div className="text-xs text-gray-400 mt-2">
        Metrics Status: {connected ? 'Connected' : 'Disconnected'}
      </div>
    </div>
  );
}

function getErrorTypeDescription(errorType: ErrorBoundaryState['errorType']): string {
  switch (errorType) {
    case 'websocket':
      return 'WebSocket connection issue detected';
    case 'metrics':
      return 'Metrics data unavailable';
    case 'render':
      return 'Component rendering error';
    default:
      return 'An unexpected error occurred';
  }
}

// Helper component for wrapping potentially problematic components
interface SafeWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorMessage?: string;
}

export function SafeWrapper({ 
  children, 
  fallback = <div className="text-gray-500 text-sm">Content unavailable</div>,
  errorMessage = 'Component error'
}: SafeWrapperProps) {
  return (
    <ErrorBoundary
      fallback={({ error, retry }) => (
        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded p-3">
          <div className="text-sm text-yellow-300 mb-2">{errorMessage}</div>
          <div className="text-xs text-gray-400 mb-3">{error.message}</div>
          <div className="flex space-x-2">
            <button
              onClick={retry}
              className="bg-yellow-600 hover:bg-yellow-700 text-white py-1 px-2 rounded text-xs transition-colors"
            >
              Retry
            </button>
            <div className="text-xs text-gray-500 flex items-center">
              or using fallback content
            </div>
          </div>
          <div className="mt-3 border-t border-yellow-600/30 pt-3">
            {fallback}
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;