/**
 * Tests for ErrorBoundary component
 * 
 * Comprehensive test coverage for WebSocket-aware error boundary
 * with recovery actions and proper error classification.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useWebSocketConnection } from '../hooks/useWebSocketConnection';
import { useMetricsStore } from '../store/metricsStore';

// Mock hooks
jest.mock('../hooks/useWebSocketConnection');
jest.mock('../store/metricsStore');

const mockUseWebSocketConnection = useWebSocketConnection as jest.MockedFunction<typeof useWebSocketConnection>;
const mockUseMetricsStore = useMetricsStore as jest.MockedFunction<typeof useMetricsStore>;

// Test component that can throw errors
const ThrowingComponent: React.FC<{ shouldThrow?: boolean; errorMessage?: string }> = ({ 
  shouldThrow = false, 
  errorMessage = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div data-testid="working-component">Working Component</div>;
};

describe('ErrorBoundary', () => {
  let mockGtag: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock gtag
    mockGtag = jest.fn();
    (global as any).gtag = mockGtag;
    
    // Mock console.error to prevent test noise
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Default WebSocket mock
    mockUseWebSocketConnection.mockReturnValue({
      connected: false,
      connecting: false,
      error: null,
      connectionAttempts: 0,
      lastConnected: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn()
    });

    // Default metrics store mock
    mockUseMetricsStore.mockReturnValue({
      metrics: {
        cache_hit_rate: 0,
        response_time_avg: 0,
        error_rate: 0,
        websocket_connected: false
      },
      loading: false,
      error: null,
      connected: false,
      fallback_mode: false,
      updateMetrics: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      setConnectionStatus: jest.fn(),
      setFallbackMode: jest.fn(),
      resetMetrics: jest.fn()
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('working-component')).toBeInTheDocument();
      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });

    it('should not interfere with normal component lifecycle', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      // Component should render normally
      expect(screen.getByTestId('working-component')).toBeInTheDocument();

      // Re-render with different props
      rerender(
        <ErrorBoundary>
          <div data-testid="updated-component">Updated Component</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('updated-component')).toBeInTheDocument();
    });
  });

  describe('Error Catching', () => {
    it('should catch and display errors', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.queryByTestId('working-component')).not.toBeInTheDocument();
    });

    it('should display error message', () => {
      const errorMessage = 'Custom test error message';
      
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage={errorMessage} />
        </ErrorBoundary>
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should handle different error types', () => {
      const errorTypes = [
        'TypeError: Cannot read property',
        'ReferenceError: variable not defined',
        'SyntaxError: Unexpected token',
        'NetworkError: Failed to fetch'
      ];

      errorTypes.forEach(errorType => {
        const { unmount } = render(
          <ErrorBoundary>
            <ThrowingComponent shouldThrow={true} errorMessage={errorType} />
          </ErrorBoundary>
        );

        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
        expect(screen.getByText(errorType)).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Error Classification', () => {
    it('should identify WebSocket errors', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="WebSocket connection failed" />
        </ErrorBoundary>
      );

      expect(screen.getByText(/websocket/i)).toBeInTheDocument();
    });

    it('should identify network errors', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Network request failed" />
        </ErrorBoundary>
      );

      expect(screen.getByText(/network/i)).toBeInTheDocument();
    });

    it('should identify metrics errors', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Cannot read property 'cache_hit_rate'" />
        </ErrorBoundary>
      );

      expect(screen.getByText(/metrics/i)).toBeInTheDocument();
    });
  });

  describe('Recovery Actions', () => {
    it('should show WebSocket recovery actions for WebSocket errors', () => {
      mockUseWebSocketConnection.mockReturnValue({
        connected: false,
        connecting: false,
        error: 'Connection failed',
        connectionAttempts: 3,
        lastConnected: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        send: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn()
      });

      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="WebSocket connection lost" />
        </ErrorBoundary>
      );

      expect(screen.getByText(/reconnect websocket/i)).toBeInTheDocument();
    });

    it('should show metrics recovery actions for metrics errors', () => {
      mockUseMetricsStore.mockReturnValue({
        metrics: {
          cache_hit_rate: 0,
          response_time_avg: 0,
          error_rate: 0,
          websocket_connected: false
        },
        loading: false,
        error: 'Failed to load metrics',
        connected: false,
        fallback_mode: true,
        updateMetrics: jest.fn(),
        setLoading: jest.fn(),
        setError: jest.fn(),
        setConnectionStatus: jest.fn(),
        setFallbackMode: jest.fn(),
        resetMetrics: jest.fn()
      });

      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Cannot access metrics.cache_hit_rate" />
        </ErrorBoundary>
      );

      expect(screen.getByText(/reset metrics/i)).toBeInTheDocument();
    });

    it('should handle WebSocket reconnection', async () => {
      const mockConnect = jest.fn();
      
      mockUseWebSocketConnection.mockReturnValue({
        connected: false,
        connecting: false,
        error: 'Connection failed',
        connectionAttempts: 1,
        lastConnected: null,
        connect: mockConnect,
        disconnect: jest.fn(),
        send: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn()
      });

      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="WebSocket error" />
        </ErrorBoundary>
      );

      const reconnectButton = screen.getByText(/reconnect websocket/i);
      fireEvent.click(reconnectButton);

      expect(mockConnect).toHaveBeenCalled();
    });

    it('should handle metrics reset', async () => {
      const mockResetMetrics = jest.fn();
      
      mockUseMetricsStore.mockReturnValue({
        metrics: {
          cache_hit_rate: 0,
          response_time_avg: 0,
          error_rate: 0,
          websocket_connected: false
        },
        loading: false,
        error: 'Metrics error',
        connected: false,
        fallback_mode: true,
        updateMetrics: jest.fn(),
        setLoading: jest.fn(),
        setError: jest.fn(),
        setConnectionStatus: jest.fn(),
        setFallbackMode: jest.fn(),
        resetMetrics: mockResetMetrics
      });

      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="metrics.cache_hit_rate undefined" />
        </ErrorBoundary>
      );

      const resetButton = screen.getByText(/reset metrics/i);
      fireEvent.click(resetButton);

      expect(mockResetMetrics).toHaveBeenCalled();
    });
  });

  describe('Recovery and Retry', () => {
    it('should provide retry functionality', async () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      const retryButton = screen.getByText(/try again/i);
      fireEvent.click(retryButton);

      // Re-render with working component
      rerender(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByTestId('working-component')).toBeInTheDocument();
      });
    });

    it('should clear error state on successful retry', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Component fixes itself
      rerender(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('working-component')).toBeInTheDocument();
      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });
  });

  describe('Analytics and Logging', () => {
    it('should log errors to analytics', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Test error" />
        </ErrorBoundary>
      );

      expect(mockGtag).toHaveBeenCalledWith('event', 'exception', {
        description: 'Test error',
        fatal: false
      });
    });

    it('should log error details', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should include error info in analytics', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Detailed error message" />
        </ErrorBoundary>
      );

      expect(mockGtag).toHaveBeenCalledWith('event', 'exception', {
        description: 'Detailed error message',
        fatal: false
      });
    });
  });

  describe('Development Mode', () => {
    it('should show error details in development', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Dev mode error" />
        </ErrorBoundary>
      );

      expect(screen.getByText(/dev mode error/i)).toBeInTheDocument();
      
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should hide sensitive details in production', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Production error with sensitive info" />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      
      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('Edge Cases', () => {
    it('should handle null error gracefully', () => {
      const NullErrorComponent = () => {
        throw null;
      };

      render(
        <ErrorBoundary>
          <NullErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should handle non-Error objects', () => {
      const StringErrorComponent = () => {
        throw 'String error';
      };

      render(
        <ErrorBoundary>
          <StringErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should handle missing hook dependencies', () => {
      mockUseWebSocketConnection.mockImplementation(() => {
        throw new Error('Hook not available');
      });

      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should still render error boundary
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should handle missing gtag gracefully', () => {
      (global as any).gtag = undefined;

      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Component State Management', () => {
    it('should maintain error state across re-renders', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Re-render with same error
      rerender(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should handle multiple error boundaries', () => {
      render(
        <ErrorBoundary>
          <div>
            <ErrorBoundary>
              <ThrowingComponent shouldThrow={true} errorMessage="Inner error" />
            </ErrorBoundary>
            <div>Outer content</div>
          </div>
        </ErrorBoundary>
      );

      // Inner boundary should catch the error
      expect(screen.getByText('Inner error')).toBeInTheDocument();
      expect(screen.getByText('Outer content')).toBeInTheDocument();
    });

    it('should isolate errors to specific boundaries', () => {
      render(
        <div>
          <ErrorBoundary>
            <ThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
          <ErrorBoundary>
            <div data-testid="working-section">Working Section</div>
          </ErrorBoundary>
        </div>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByTestId('working-section')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should provide accessible error messages', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorHeading = screen.getByRole('heading');
      expect(errorHeading).toBeInTheDocument();
      expect(errorHeading).toHaveTextContent(/something went wrong/i);
    });

    it('should provide keyboard navigation for recovery actions', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      const retryButton = screen.getByText(/try again/i);
      expect(retryButton).toBeInTheDocument();
      expect(retryButton.tagName).toBe('BUTTON');
    });
  });
});