import React from 'react';

/**
 * ErrorBoundary - Catches React rendering errors and displays a fallback UI.
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // You can log error details to a service here
    // e.g., UnifiedErrorService.getInstance().reportError(error, info, 'render', 'HIGH');
    // For now, just log to console
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className='p-4 bg-red-100 text-red-800 rounded shadow'>
            <h2 className='font-bold'>Something went wrong.</h2>
            <pre>{this.state.error?.message}</pre>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
