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
    const correlationId = (error as Error & { correlationId?: string }).correlationId || crypto.randomUUID();
    this.setState({ correlationId });

    // ENHANCED LOGGING: Full error details with [RuntimeErrorTrace] tag (development only)
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.group('[RuntimeErrorTrace] Full Error Details');
      // eslint-disable-next-line no-console
      console.log('[RuntimeErrorTrace] Raw error object:', error);
      // eslint-disable-next-line no-console
      console.log('[RuntimeErrorTrace] Error message:', error.message);
      // eslint-disable-next-line no-console
      console.log('[RuntimeErrorTrace] Error stack:', error.stack);
      // eslint-disable-next-line no-console
      console.log('[RuntimeErrorTrace] Component stack:', info.componentStack);
      // eslint-disable-next-line no-console
      console.log('[RuntimeErrorTrace] Error digest:', info.digest);
      // eslint-disable-next-line no-console
      console.log('[RuntimeErrorTrace] Correlation ID:', correlationId);
      // eslint-disable-next-line no-console
      console.log('[RuntimeErrorTrace] Timestamp:', new Date().toISOString());
      // eslint-disable-next-line no-console
      console.log('[RuntimeErrorTrace] URL:', window.location.href);
      // eslint-disable-next-line no-console
      console.log('[RuntimeErrorTrace] User Agent:', navigator.userAgent);
      
      // Log error constructor and prototype information
      // eslint-disable-next-line no-console
      console.log('[RuntimeErrorTrace] Error constructor:', error.constructor.name);
      // eslint-disable-next-line no-console
      console.log('[RuntimeErrorTrace] Error prototype:', Object.getPrototypeOf(error));
      
      // Log any additional error properties
      const errorProps = Object.getOwnPropertyNames(error);
      if (errorProps.length > 0) {
        // eslint-disable-next-line no-console
        console.log('[RuntimeErrorTrace] Error properties:', errorProps);
        errorProps.forEach(prop => {
          if (prop !== 'stack' && prop !== 'message' && prop !== 'name') {
            // eslint-disable-next-line no-console
            console.log(`[RuntimeErrorTrace] ${prop}:`, (error as unknown as Record<string, unknown>)[prop]);
          }
        });
      }
      // eslint-disable-next-line no-console
      console.groupEnd();
    }

    // Record error in global error store
    if (typeof window !== 'undefined') {
      // Use dynamic import for Zustand store (for class component)
      import('../stores/errorStore').then((store) => {
        if ('addError' in store && typeof store.addError === 'function') {
          store.addError({
            id: correlationId,
            message: error.message,
            category: 'unknown',
            details: info,
            correlationId,
            statusCode: undefined,
          });
        }
      }).catch((importError) => {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn('Failed to import error store:', importError);
        }
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
