import React from 'react';
import { getRecent } from '../debug/runtimeEventBuffer';

interface ErrorBoundaryVersionProps {
  children: React.ReactNode;
}

interface ErrorBoundaryVersionState {
  hasError: boolean;
  error: Error | null;
  correlationId: number;
}

// Global correlation ID counter
let errorCorrelationCounter = 0;

/**
 * Enhanced Error boundary for API version-related failures and runtime errors.
 * Displays a user-friendly message and logs the error with correlation to diagnostic events.
 */
export class ErrorBoundaryVersion extends React.Component<
  ErrorBoundaryVersionProps,
  ErrorBoundaryVersionState
> {
  constructor(props: ErrorBoundaryVersionProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      correlationId: 0 
    };
  }

  static getDerivedStateFromError(error: Error) {
    errorCorrelationCounter++;
    return { 
      hasError: true, 
      error,
      correlationId: errorCorrelationCounter
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const { correlationId } = this.state;
    const firstStackLine = error.stack?.split('\n')[1]?.trim() || 'No stack';
    
    const errorTrace = {
      id: correlationId,
      message: error.message,
      name: error.name,
      firstStackLine,
      componentStackPresent: !!info.componentStack,
      timeISO: new Date().toISOString()
    };

    // eslint-disable-next-line no-console
    console.error(`[RuntimeErrorTrace] ${JSON.stringify(errorTrace)}`);

    // Check for the specific "Cannot convert undefined or null to object" error
    if (error.message.includes('Cannot convert undefined or null to object')) {
      const nullAccessEvents = getRecent('NullObjectAccess', 5);
      if (nullAccessEvents.length > 0) {
        // eslint-disable-next-line no-console
        console.error('[NullObjectCorrelation] Recent null access events:', nullAccessEvents);
      }
    }

    // eslint-disable-next-line no-console
    console.error('[ErrorBoundaryVersion] Version-related error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, color: '#b91c1c', background: '#fef2f2', borderRadius: 8 }}>
          <h2>Runtime Error Detected (ID: {this.state.correlationId})</h2>
          <p>
            {this.state.error?.message ||
              'A runtime error occurred. Please refresh or contact support.'}
          </p>
          <details style={{ marginTop: 16, fontSize: '0.9em', opacity: 0.8 }}>
            <summary>Technical Details</summary>
            <pre style={{ marginTop: 8, fontSize: '0.8em', overflow: 'auto' }}>
              {this.state.error?.stack || 'No stack trace available'}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
