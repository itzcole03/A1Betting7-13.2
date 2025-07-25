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

  useEffect(() => {
    // Use process.env for VITE_WS_URL with a fallback for test compatibility
    const _wsUrl = process.env.VITE_WS_URL || process.env.WS_URL || 'ws://localhost:8000/ws';
    const _ws = new WebSocket(_wsUrl);
    _wsRef.current = _ws;
    _ws.onopen = () => setConnected(true);
    _ws.onclose = () => setConnected(false);
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
    return () => {
      _ws.close();
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
