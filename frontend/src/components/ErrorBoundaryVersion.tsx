import React from 'react';

interface ErrorBoundaryVersionProps {
  children: React.ReactNode;
}

interface ErrorBoundaryVersionState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for API version-related failures.
 * Displays a user-friendly message and logs the error.
 */
export class ErrorBoundaryVersion extends React.Component<
  ErrorBoundaryVersionProps,
  ErrorBoundaryVersionState
> {
  constructor(props: ErrorBoundaryVersionProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundaryVersion] Version-related error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, color: '#b91c1c', background: '#fef2f2', borderRadius: 8 }}>
          <h2>API Version Compatibility Error</h2>
          <p>
            {this.state.error?.message ||
              'A version compatibility issue occurred. Please refresh or contact support.'}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
