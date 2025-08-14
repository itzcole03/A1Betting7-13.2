/**
 * Typed WebSocket Hook
 * 
 * Type-safe WebSocket client with envelope pattern validation
 * and comprehensive error handling
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { 
  WebSocketEnvelope, 
  WebSocketMessageValidator, 
  TypedWebSocketConfig,
  DEFAULT_WEBSOCKET_CONFIG,
  isConnectionMessage,
  isPredictionUpdateMessage,
  isOddsUpdateMessage,
  isArbitrageAlertMessage,
  isPortfolioUpdateMessage,
  isNotificationMessage,
  isErrorMessage,
  WebSocketEventType
} from '../types/webSocket';

export interface TypedWebSocketState {
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';
  lastError: string | null;
  lastMessage: WebSocketEnvelope | null;
  messageCount: number;
}

export interface TypedWebSocketActions {
  connect: () => void;
  disconnect: () => void;
  sendMessage: (type: WebSocketEventType, data?: unknown) => boolean;
  subscribe: (eventType: WebSocketEventType, handler: (envelope: WebSocketEnvelope) => void) => void;
  unsubscribe: (eventType: WebSocketEventType, handler: (envelope: WebSocketEnvelope) => void) => void;
}

export interface UseTypedWebSocketReturn extends TypedWebSocketState, TypedWebSocketActions {}

export function useTypedWebSocket(
  config: Partial<TypedWebSocketConfig> = {}
): UseTypedWebSocketReturn {
  const finalConfig = { ...DEFAULT_WEBSOCKET_CONFIG, ...config };
  
  const [state, setState] = useState<TypedWebSocketState>({
    isConnected: false,
    connectionState: 'disconnected',
    lastError: null,
    lastMessage: null,
    messageCount: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const eventHandlers = useRef<Map<WebSocketEventType, Set<(envelope: WebSocketEnvelope) => void>>>(
    new Map()
  );

  // Heartbeat functionality
  const startHeartbeat = useCallback(() => {
    if (!finalConfig.enableHeartbeat) return;

    heartbeatRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const pingMessage: WebSocketEnvelope = {
          type: 'ping',
          status: 'info',
          timestamp: new Date().toISOString(),
          data: { timestamp: Date.now() }
        };
        wsRef.current.send(JSON.stringify(pingMessage));
      }
    }, finalConfig.heartbeatInterval);
  }, [finalConfig.enableHeartbeat, finalConfig.heartbeatInterval]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // Message handling with type validation
  const handleMessage = useCallback((event: MessageEvent) => {
    const envelope = WebSocketMessageValidator.parseMessage(event.data);
    
    if (!envelope) {
      setState(prev => ({
        ...prev,
        lastError: 'Invalid message format received',
      }));
      return;
    }

    // Sanitize the message
    const sanitizedEnvelope = WebSocketMessageValidator.sanitizeMessage(envelope);

    // Update state with new message
    setState(prev => ({
      ...prev,
      lastMessage: sanitizedEnvelope,
      messageCount: prev.messageCount + 1,
      lastError: sanitizedEnvelope.status === 'error' ? sanitizedEnvelope.error || 'Unknown error' : null,
    }));

    // Trigger specific event handlers
    const handlers = eventHandlers.current.get(sanitizedEnvelope.type as WebSocketEventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(sanitizedEnvelope);
        } catch {
          // Handler error - continue processing
        }
      });
    }

    // Handle specific message types with type guards
    if (isConnectionMessage(sanitizedEnvelope)) {
      // Connection message received
    } else if (isPredictionUpdateMessage(sanitizedEnvelope)) {
      // Prediction update received
    } else if (isOddsUpdateMessage(sanitizedEnvelope)) {
      // Odds update received
    } else if (isArbitrageAlertMessage(sanitizedEnvelope)) {
      // Arbitrage alert received
    } else if (isPortfolioUpdateMessage(sanitizedEnvelope)) {
      // Portfolio update received
    } else if (isNotificationMessage(sanitizedEnvelope)) {
      // Notification received
    } else if (isErrorMessage(sanitizedEnvelope)) {
      // Error message received
    }
  }, []);

  // Connection management
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.CONNECTING || 
        wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState(prev => ({ ...prev, connectionState: 'connecting', lastError: null }));

    try {
      wsRef.current = new WebSocket(finalConfig.url);

      wsRef.current.onopen = () => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          connectionState: 'connected',
          lastError: null,
        }));
        reconnectAttempts.current = 0;
        startHeartbeat();
      };

      wsRef.current.onmessage = handleMessage;

      wsRef.current.onclose = (event) => {
        setState(prev => ({
          ...prev,
          isConnected: false,
          connectionState: 'disconnected',
        }));
        stopHeartbeat();

        // Auto-reconnect logic
        if (event.code !== 1000 && reconnectAttempts.current < finalConfig.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          
          setState(prev => ({
            ...prev,
            connectionState: 'reconnecting',
            lastError: `Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts.current})`,
          }));

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= finalConfig.maxRetries) {
          setState(prev => ({
            ...prev,
            connectionState: 'error',
            lastError: 'Max reconnection attempts reached',
          }));
        }
      };

      wsRef.current.onerror = () => {
        setState(prev => ({
          ...prev,
          connectionState: 'error',
          lastError: 'WebSocket connection error',
        }));
      };

    } catch {
      setState(prev => ({
        ...prev,
        connectionState: 'error',
        lastError: 'Failed to create WebSocket connection',
      }));
    }
  }, [finalConfig.url, finalConfig.maxRetries, handleMessage, startHeartbeat, stopHeartbeat]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    stopHeartbeat();
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      connectionState: 'disconnected',
      lastError: null,
    }));
  }, [stopHeartbeat]);

  const sendMessage = useCallback((type: WebSocketEventType, data?: unknown): boolean => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const envelope: WebSocketEnvelope = {
        type,
        status: 'info',
        timestamp: new Date().toISOString(),
        data,
      };

      wsRef.current.send(JSON.stringify(envelope));
      return true;
    } catch {
      setState(prev => ({
        ...prev,
        lastError: 'Failed to send message',
      }));
      return false;
    }
  }, []);

  const subscribe = useCallback((
    eventType: WebSocketEventType, 
    handler: (envelope: WebSocketEnvelope) => void
  ) => {
    if (!eventHandlers.current.has(eventType)) {
      eventHandlers.current.set(eventType, new Set());
    }
    eventHandlers.current.get(eventType)!.add(handler);
  }, []);

  const unsubscribe = useCallback((
    eventType: WebSocketEventType, 
    handler: (envelope: WebSocketEnvelope) => void
  ) => {
    const handlers = eventHandlers.current.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        eventHandlers.current.delete(eventType);
      }
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (!state.isConnected) {
        connect();
      }
    };

    const handleOffline = () => {
      disconnect();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.isConnected, connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
    subscribe,
    unsubscribe,
  };
}
