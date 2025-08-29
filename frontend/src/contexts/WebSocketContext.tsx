/**
 * WebSocketContext (Production-Grade)
 *
 * Provides robust, production-grade WebSocket connection and lifecycle management for real-time features.
 *
 * Features:
 * - Exponential backoff for reconnections on transient failures
 * - Immediate reconnect on network online events
 * - Cleans up all timers and event listeners on unmount
 * - Exposes connection status (connecting, connected, reconnecting, disconnected) and last error via context
 * - Graceful error handling: non-critical WebSocket errors are logged as warnings
 * - Designed for testability: all connection states and errors are observable in context
 * - Security: Prevents mixed content errors in development
 *
 * Usage:
 *   const { status, lastError, sendMessage } = useWebSocket();
 *
 *   // status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected'
 *   // lastError: string | null
 *
 * Test Coverage:
 *   - Simulates transient connection failures and recovery
 *   - Simulates network offline/online events and immediate reconnect
 *   - Verifies status and error context updates
 *
 * See: WebSocketContext.test.tsx for comprehensive test scenarios.
 */
import React, { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';

/**
 * WebSocket connection status values.
 */
export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface WebSocketContextType {
  status: WebSocketStatus;
  connected: boolean;
  lastError: string | null;
  send: (msg: unknown) => void;
  subscribe: (event: string, handler: (data: unknown) => void) => void;
  unsubscribe: (event: string, handler: (data: unknown) => void) => void;
}

/**
 * React context for WebSocket state and messaging.
 */
const _WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);
export { _WebSocketContext };

/**
 * WebSocketProvider component.
 * Wrap your app with this provider to enable WebSocket utilities.
 * @param {object} props - React children.
 * @returns {JSX.Element} The provider component.
 */
export const _WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [connected, setConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const verboseLogging = process.env.NODE_ENV === 'development';
  const _wsRef = useRef<WebSocket | null>(null);
  const _handlers = useRef<Record<string, ((data: unknown) => void)[]>>({});
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const onlineListener = useRef<(() => void) | null>(null);
  const offlineListener = useRef<(() => void) | null>(null);
  const isUnmounted = useRef(false);

  // Helper to get the WebSocket URL with security considerations
  const getWebSocketUrl = () => {
    // Check if WebSocket is explicitly disabled
    const wsEnabled = (() => {
      if (typeof process !== 'undefined' && process.env?.VITE_WEBSOCKET_ENABLED) {
        return process.env.VITE_WEBSOCKET_ENABLED === 'true';
      }
      if (typeof window !== 'undefined' && (window as any).__VITE_ENV__?.VITE_WEBSOCKET_ENABLED) {
        return (window as any).__VITE_ENV__.VITE_WEBSOCKET_ENABLED === 'true';
      }
      return false;
    })();
    if (!wsEnabled) {
      return null; // Signal that WebSocket should not be used
    }

    if (process.env.NODE_ENV === 'development') {
      // In development, connect to backend port 8000
      return 'ws://localhost:8000/ws/client';
    } else {
      // In production, use secure WebSocket
      const baseUrl = (() => {
        if (typeof process !== 'undefined' && process.env?.VITE_WS_URL) {
          return process.env.VITE_WS_URL;
        }
        if (typeof window !== 'undefined' && (window as any).__VITE_ENV__?.VITE_WS_URL) {
          return (window as any).__VITE_ENV__.VITE_WS_URL;
        }
        return undefined;
      })();
      if (baseUrl) {
        // Ensure we use wss:// for secure connections in production
        return baseUrl.replace(/^ws:/, 'wss:');
      }
      // Fallback to current protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}/ws`;
    }
  };

  // Robust connect logic with exponential backoff and error tracking
  const connectWebSocket = React.useCallback((isReconnection = false) => {
    const _wsUrl = getWebSocketUrl();

    // If WebSocket URL is null, it means WebSocket is disabled
    if (!_wsUrl) {
      setStatus('disconnected');
      setConnected(false);
      setLastError('WebSocket disabled in configuration');
      if (verboseLogging) console.log('[WebSocket] Connection disabled via configuration');
      return;
    }

    setStatus(reconnectAttempts.current > 0 || isReconnection ? 'reconnecting' : 'connecting');
    setLastError(null);

    if (verboseLogging) console.debug(`[WebSocket] Connecting to: ${_wsUrl}`);

    try {
      const _ws = new WebSocket(_wsUrl);
      _wsRef.current = _ws;

      _ws.onopen = () => {
        if (verboseLogging) console.debug(`[WebSocket] Connected successfully to: ${_wsUrl}`);
        setConnected(true);
        setStatus('connected');
        setLastError(null);
        reconnectAttempts.current = 0;
        // Send a ping to verify connection is working
        if (_ws.readyState === WebSocket.OPEN) {
          _ws.send(JSON.stringify({ event: 'ping', timestamp: Date.now() }));
        }
      };

      _ws.onclose = event => {
        if (verboseLogging)
          console.debug(`[WebSocket] Connection closed:`, event.code, event.reason, event.wasClean);
        setConnected(false);
        setStatus('disconnected');
        if (!isUnmounted.current && event.code !== 1000) {
          // Exponential backoff for reconnection with maximum attempts
          if (reconnectAttempts.current < 10) {
            const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000);
            reconnectAttempts.current += 1;
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = setTimeout(() => {
              setStatus('reconnecting');
              console.log(`[WebSocket] Reconnecting... (attempt ${reconnectAttempts.current})`);
              connectWebSocket(true);
            }, delay);
            setLastError(
              `Disconnected. Attempting to reconnect in ${delay / 1000}s (attempt ${
                reconnectAttempts.current
              })`
            );
          } else {
            setLastError('Maximum reconnection attempts reached. Giving up.');
            console.error('[WebSocket] Maximum reconnection attempts reached. Giving up.');
          }
        }
      };

      _ws.onerror = error => {
        setConnected(false);
        setStatus('disconnected');
        setLastError('WebSocket connection error');
        if (verboseLogging)
          console.warn(`[WebSocket] Connection error (non-critical, app will continue):`, error);

        // Handle WebSocket errors gracefully to prevent unhandled promise rejections
        try {
          if (_ws.readyState === WebSocket.CONNECTING) {
            // Close the connection if it's still trying to connect
            _ws.close();
          }
        } catch (closeError) {
          console.warn('[WebSocket] Error during cleanup:', closeError);
        }
      };

      _ws.onmessage = event => {
        try {
          // Only parse if message looks like JSON
          if (event.data && typeof event.data === 'string' && event.data.trim().startsWith('{')) {
            const _data = JSON.parse(event.data);
            // Support both 'event' and 'type' fields for compatibility
            const eventType = _data.event || _data.type;
            if (eventType && _handlers.current[eventType]) {
              _handlers.current[eventType].forEach(fn => fn(_data.payload));
            } else {
              // Valid JSON but no handler for event/type
              if (verboseLogging) console.warn('WebSocket received unhandled JSON message:', _data);
            }
          } else {
            // Non-JSON message, log as warning and skip
            if (verboseLogging) console.warn('WebSocket received non-JSON message:', event.data);
          }
        } catch (e) {
          setLastError('WebSocket message error');
          if (verboseLogging)
            console.warn('WebSocket message parse error (non-critical):', e, event.data);
        }
      };
    } catch (connectionError) {
      // Handle WebSocket creation errors (e.g., mixed content issues)
      setConnected(false);
      setStatus('disconnected');
      setLastError('WebSocket connection blocked - mixed content or security issue');
      if (verboseLogging) {
        console.warn('[WebSocket] Connection creation failed (non-critical):', connectionError);
      }
      return;
    }
  }, [verboseLogging]);

  // Setup and cleanup effect
  useEffect(() => {
    isUnmounted.current = false;

    // Only connect if WebSocket server is explicitly enabled
    const wsEnabled = (() => {
      if (typeof process !== 'undefined' && process.env?.VITE_WEBSOCKET_ENABLED) {
        return process.env.VITE_WEBSOCKET_ENABLED === 'true';
      }
      if (typeof window !== 'undefined' && (window as any).__VITE_ENV__?.VITE_WEBSOCKET_ENABLED) {
        return (window as any).__VITE_ENV__.VITE_WEBSOCKET_ENABLED === 'true';
      }
      return false;
    })();
    if (wsEnabled) {
      connectWebSocket();
    } else {
      // Set to disconnected state without attempting connection
      setStatus('disconnected');
      setConnected(false);
      setLastError('WebSocket disabled in configuration');
      if (verboseLogging) console.log('[WebSocket] Connection disabled via configuration');
    }

    // Immediate reconnect on network changes
    const handleOnline = () => {
      const wsEnabled = (() => {
        if (typeof process !== 'undefined' && process.env?.VITE_WEBSOCKET_ENABLED) {
          return process.env.VITE_WEBSOCKET_ENABLED === 'true';
        }
        if (typeof window !== 'undefined' && (window as any).__VITE_ENV__?.VITE_WEBSOCKET_ENABLED) {
          return (window as any).__VITE_ENV__.VITE_WEBSOCKET_ENABLED === 'true';
        }
        return false;
      })();
      if (!connected && wsEnabled) {
        setStatus('reconnecting');
        setLastError(null);
        reconnectAttempts.current = 0;
        if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        connectWebSocket(true);
      }
    };
    const handleOffline = () => {
      setStatus('disconnected');
      setLastError('Network offline');
      if (_wsRef.current) _wsRef.current.close();
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    onlineListener.current = handleOnline;
    offlineListener.current = handleOffline;

    return () => {
      isUnmounted.current = true;
      if (_wsRef.current) _wsRef.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (onlineListener.current) window.removeEventListener('online', onlineListener.current);
      if (offlineListener.current) window.removeEventListener('offline', offlineListener.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const _send = (msg: unknown) => {
    if (_wsRef.current && connected) {
      _wsRef.current.send(JSON.stringify(msg));
    }
  };

  const _subscribe = (event: string, handler: (data: unknown) => void) => {
    if (!_handlers.current[event]) _handlers.current[event] = [];
    _handlers.current[event].push(handler);
  };

  const _unsubscribe = (event: string, handler: (data: unknown) => void) => {
    if (_handlers.current[event]) {
      _handlers.current[event] = _handlers.current[event].filter(fn => fn !== handler);
    }
  };

  return (
    <_WebSocketContext.Provider
      value={{
        status,
        connected,
        lastError,
        send: _send,
        subscribe: _subscribe,
        unsubscribe: _unsubscribe,
      }}
    >
      {children}
    </_WebSocketContext.Provider>
  );
};

/**
 * useWebSocket
 * Access the WebSocket context in any component.
 */
export const _useWebSocket = () => {
  const _ctx = useContext(_WebSocketContext);
  if (!_ctx) throw new Error('useWebSocket must be used within WebSocketProvider');
  return _ctx;
};
