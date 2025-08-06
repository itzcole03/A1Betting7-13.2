/**
 * React 19 Compatible Error Boundary
 * Handles errors from React 19 hooks including use() API
 */

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

export class React19ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.error('[React19ErrorBoundary] Error caught:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} reset={this.handleReset} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error?: Error; reset: () => void }> = ({ error, reset }) => (
  <div className='p-6 bg-red-50 border border-red-200 rounded-lg'>
    <h3 className='text-lg font-semibold text-red-800 mb-2'>Something went wrong</h3>
    <p className='text-red-600 mb-4'>{error?.message || 'An unexpected error occurred'}</p>
    <button
      onClick={reset}
      className='bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors'
    >
      Try Again
    </button>
    {process.env.NODE_ENV === 'development' && error && (
      <details className='mt-4'>
        <summary className='cursor-pointer text-sm text-red-700'>Error Details</summary>
        <pre className='mt-2 text-xs text-red-600 overflow-auto bg-red-100 p-2 rounded'>
          {error.stack}
        </pre>
      </details>
    )}
  </div>
);

export default React19ErrorBoundary;
