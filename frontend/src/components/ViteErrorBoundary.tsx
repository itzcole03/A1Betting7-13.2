import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ViteErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '20px',
            margin: '20px',
            border: '2px solid #ef4444',
            borderRadius: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          <h2
            style={{
              margin: '0 0 16px 0',
              fontSize: '1.5rem',
              fontWeight: 'bold',
            }}
          >
            Something went wrong
          </h2>
          <p style={{ margin: '0 0 16px 0' }}>
            An error occurred in the application. Please refresh the page to continue.
          </p>
          <details style={{ marginTop: '16px' }}>
            <summary
              style={{
                cursor: 'pointer',
                marginBottom: '8px',
                fontWeight: '600',
              }}
            >
              Error details (click to expand)
            </summary>
            <pre
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '12px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error && this.state.error.toString()}
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ViteErrorBoundary;
