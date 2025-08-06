/**
 * ErrorBoundary - OWASP Compliant Error Handling
 * Provides secure error boundary with proper error logging and user-friendly messages
 */

import React from 'react';
import { getSecurityConfig } from '../../utils/security';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const securityConfig = getSecurityConfig();

    this.setState({
      error,
      errorInfo,
    });

    // Log error securely (remove sensitive information)
    const sanitizedError = {
      message: error.message,
      stack: securityConfig.isDevelopment ? error.stack : 'Stack trace hidden in production',
      componentStack: securityConfig.isDevelopment
        ? errorInfo.componentStack
        : 'Component stack hidden in production',
      timestamp: new Date().toISOString(),
    };

    if (securityConfig.logSecurityEvents) {
      console.error('Error Boundary caught an error:', sanitizedError);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, send error to monitoring service
    if (!securityConfig.isDevelopment) {
      this.reportError(sanitizedError);
    }
  }

  private reportError = (errorDetails: any) => {
    // Send to error monitoring service (e.g., Sentry, LogRocket, etc.)
    try {
      // Example: Send to backend error reporting endpoint
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorDetails),
      }).catch(() => {
        // Silently fail if error reporting fails
      });
    } catch {
      // Silently fail if error reporting fails
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.handleRetry} />;
      }

      // Default error UI
      return (
        <div className='error-boundary-container' style={styles.container}>
          <div style={styles.card}>
            <h2 style={styles.title}>⚠️ Something went wrong</h2>
            <p style={styles.message}>
              We apologize for the inconvenience. The application encountered an unexpected error.
            </p>

            {getSecurityConfig().isDevelopment && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details (Development Mode)</summary>
                <pre style={styles.errorText}>
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div style={styles.actions}>
              <button onClick={this.handleRetry} style={styles.retryButton}>
                Try Again
              </button>
              <button onClick={() => window.location.reload()} style={styles.reloadButton}>
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Styles for the error boundary
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px',
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '600px',
    width: '100%',
    textAlign: 'center' as const,
  },
  title: {
    color: '#e53e3e',
    marginBottom: '16px',
    fontSize: '24px',
  },
  message: {
    color: '#4a5568',
    marginBottom: '24px',
    lineHeight: '1.5',
  },
  details: {
    textAlign: 'left' as const,
    marginBottom: '24px',
    backgroundColor: '#f7fafc',
    padding: '16px',
    borderRadius: '4px',
    border: '1px solid #e2e8f0',
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    marginBottom: '8px',
  },
  errorText: {
    fontSize: '12px',
    color: '#2d3748',
    overflow: 'auto',
    maxHeight: '200px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  retryButton: {
    backgroundColor: '#3182ce',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold' as const,
  },
  reloadButton: {
    backgroundColor: '#718096',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold' as const,
  },
};

// Hook for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    const securityConfig = getSecurityConfig();

    if (securityConfig.logSecurityEvents) {
      console.error('Error caught by useErrorHandler:', error);
      if (errorInfo) {
        console.error('Error info:', errorInfo);
      }
    }
  };
}

export default ErrorBoundary;
