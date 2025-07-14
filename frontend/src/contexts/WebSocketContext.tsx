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
  send: (msg: any) => void;
  subscribe: (event: string, handler: (data: any) => void) => void;
  unsubscribe: (event: string, handler: (data: any) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

/**
 * WebSocketProvider
 * Wrap your app with this provider to enable WebSocket utilities.
 * @param {ReactNode} children
 */
export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const handlers = useRef<Record<string, ((data: any) => void)[]>>({});

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080'); // Replace with real endpoint
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data);
        if (data.event && handlers.current[data.event]) {
          handlers.current[data.event].forEach(fn => fn(data.payload));
        }
      } catch (e) {
        console.error('WebSocket message error', e);
      }
    };
    return () => {
      ws.close();
    };
  }, []);

  const send = (msg: any) => {
    if (wsRef.current && connected) {
      wsRef.current.send(JSON.stringify(msg));
    }
  };

  const subscribe = (event: string, handler: (data: any) => void) => {
    if (!handlers.current[event]) handlers.current[event] = [];
    handlers.current[event].push(handler);
  };

  const unsubscribe = (event: string, handler: (data: any) => void) => {
    if (handlers.current[event]) {
      handlers.current[event] = handlers.current[event].filter(fn => fn !== handler);
    }
  };

  return (
    <WebSocketContext.Provider value={{ connected, send, subscribe, unsubscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * useWebSocket
 * Access the WebSocket context in any component.
 */
export const useWebSocket = () => {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('useWebSocket must be used within WebSocketProvider');
  return ctx;
};
