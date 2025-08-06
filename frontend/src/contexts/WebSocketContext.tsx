/**
 * WebSocket context and provider for managing WebSocket connection state and messaging utilities.
 *
 * @module contexts/WebSocketContext
 */
import React, { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';

/**
 * WebSocketContextType
 * Provides WebSocket connection state and messaging utilities.
 * @property {boolean} connected - WebSocket connection state
 * @property {(msg: any) => void} send - Send a message
 * @property {(event: string, handler: (data: any) => void) => void} subscribe - Subscribe to an event
 * @property {(event: string, handler: (data: any) => void) => void} unsubscribe - Unsubscribe from an event
 */
export interface WebSocketContextType {
  connected: boolean;
  send: (msg: unknown) => void;
  subscribe: (event: string, handler: (data: unknown) => void) => void;
  unsubscribe: (event: string, handler: (data: unknown) => void) => void;
}

/**
 * React context for WebSocket state and messaging.
 */
const _WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

/**
 * WebSocketProvider component.
 * Wrap your app with this provider to enable WebSocket utilities.
 * @param {object} props - React children.
 * @returns {JSX.Element} The provider component.
 */
export const _WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const _wsRef = useRef<WebSocket | null>(null);
  const _handlers = useRef<Record<string, ((data: unknown) => void)[]>>({});
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isUnmounted = false;
    const getWebSocketUrl = () => {
      if (process.env.NODE_ENV === 'development') {
        return 'ws://localhost:8000/ws';
      } else {
        return process.env.VITE_WS_URL || process.env.WS_URL || 'ws://localhost:8000/ws';
      }
    };

    const connectWebSocket = () => {
      const _wsUrl = getWebSocketUrl();
      console.log(`[WebSocket] Connecting to: ${_wsUrl}`);
      const _ws = new WebSocket(_wsUrl);
      _wsRef.current = _ws;

      _ws.onopen = () => {
        console.log(`[WebSocket] Connected successfully to: ${_wsUrl}`);
        setConnected(true);
        reconnectAttempts.current = 0;

        // Send a ping to verify connection is working
        if (_ws.readyState === WebSocket.OPEN) {
          _ws.send(JSON.stringify({ event: 'ping', timestamp: Date.now() }));
        }
      };

      _ws.onclose = event => {
        console.log(`[WebSocket] Connection closed:`, event.code, event.reason, event.wasClean);
        setConnected(false);

        // Only attempt reconnect for non-normal closures and if component is still mounted
        if (!isUnmounted && event.code !== 1000) {
          // Exponential backoff for reconnection with maximum attempts
          if (reconnectAttempts.current < 10) {
            const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000);
            reconnectAttempts.current += 1;
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = setTimeout(() => {
              console.log(`[WebSocket] Reconnecting... (attempt ${reconnectAttempts.current})`);
              connectWebSocket();
            }, delay);
            console.warn(
              `[WebSocket] Attempting to reconnect in ${delay / 1000}s (attempt ${
                reconnectAttempts.current
              })`
            );
          } else {
            console.error('[WebSocket] Maximum reconnection attempts reached. Giving up.');
          }
        }
      };

      _ws.onerror = error => {
        console.warn(`[WebSocket] Connection error (non-critical, app will continue):`, error);
        // WebSocket errors are non-critical - the app should work without real-time features
        // Reset connection state but don't throw errors
        setConnected(false);
      };

      _ws.onmessage = event => {
        try {
          const _data = JSON.parse(event.data);
          if (_data.event && _handlers.current[_data.event]) {
            _handlers.current[_data.event].forEach(fn => fn(_data.payload));
          }
        } catch (e) {
          console.error('WebSocket message error', e);
        }
      };
    };

    connectWebSocket();

    return () => {
      isUnmounted = true;
      if (_wsRef.current) _wsRef.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
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
    // Removed unused @ts-expect-error: JSX is supported in this environment
    <_WebSocketContext.Provider
      value={{ connected, send: _send, subscribe: _subscribe, unsubscribe: _unsubscribe }}
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
