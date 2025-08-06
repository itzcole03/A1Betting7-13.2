import React from 'react';

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  correlationId: string | null;
  copied: boolean;
}

export class GlobalErrorBoundary extends React.Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, correlationId: null, copied: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, correlationId: null, copied: false };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Generate or extract correlation ID (if available)
    const correlationId = (error as any).correlationId || crypto.randomUUID();
    this.setState({ correlationId });
    // Record error in global error store
    if (typeof window !== 'undefined') {
      // Use Zustand store directly (for class component)
      const { addError } = require('../stores/errorStore');
      addError({
        id: correlationId,
        message: error.message,
        category: 'unknown',
        details: info,
        correlationId,
        statusCode: undefined,
      });
    }
    // Auto-report error to backend
    fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Request-ID': correlationId },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        info,
        correlationId,
        userAgent: navigator.userAgent,
        url: window.location.href,
      }),
    }).catch(() => {});
    // eslint-disable-next-line no-console
    console.error('[GlobalErrorBoundary]', error, info, correlationId);
  }

  handleCopy = () => {
    if (this.state.correlationId) {
      navigator.clipboard.writeText(this.state.correlationId);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 1500);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, color: '#b91c1c', background: '#fef2f2', borderRadius: 8 }}>
          <h2>Something went wrong</h2>
          <p>
            {this.state.error?.message ||
              'An unexpected error occurred. Please refresh or contact support.'}
          </p>
          {this.state.correlationId && (
            <div style={{ marginTop: 16 }}>
              <span style={{ fontWeight: 500 }}>Correlation ID:</span>{' '}
              <span style={{ fontFamily: 'monospace' }}>{this.state.correlationId}</span>
              <button
                style={{ marginLeft: 8, fontSize: 12 }}
                onClick={this.handleCopy}
                aria-label='Copy correlation ID'
              >
                {this.state.copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
          <div style={{ marginTop: 24, fontSize: 13, color: '#7f1d1d' }}>
            If this problem persists, please contact support and provide the correlation ID above.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
