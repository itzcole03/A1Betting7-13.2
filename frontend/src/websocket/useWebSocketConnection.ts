/**
 * useWebSocketConnection Hook
 * 
 * Provides a React hook interface to the WebSocketManager with state management
 * and automatic cleanup. Manages a singleton WebSocketManager instance per
 * client session.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { WebSocketManager } from './WebSocketManager';
import { WSState, WSMessage } from './ConnectionState';
import { BackoffStrategy } from './BackoffStrategy';
import { buildWebSocketUrl } from './buildWebSocketUrl';

export interface WebSocketConnectionHook {
  // Connection state
  state: WSState;
  isConnected: boolean;
  isConnecting: boolean;
  isFallback: boolean;
  
  // Connection controls
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  forceReconnect: () => void; // Alias for reconnect for consistency with requirements
  
  // Messaging
  send: (message: WSMessage) => boolean;
  ping: () => boolean;
  
  // Statistics and diagnostics
  messageStats: Record<string, number>;
  connectionUptime: number;
  fallbackReason: string | null;
  recentAttempts: number;
  nextRetryEta: Date | null;
  attemptCount: number; // Current attempt count for UI display
  lastError: Error | null; // Last connection error
  
  // Event handling
  onMessage: (callback: (message: WSMessage) => void) => () => void;
  onError: (callback: (error: Error, context: string) => void) => () => void;
}

let managerInstance: WebSocketManager | null = null;

/**
 * Get or create the singleton WebSocketManager instance
 */
function getManager(): WebSocketManager {
  if (!managerInstance) {
    // Generate consistent client ID using buildWebSocketUrl utility
    const wsUrl = buildWebSocketUrl({
      baseUrl: import.meta.env.VITE_WS_URL,
      version: 1,
      role: 'frontend'
    });
    
    // Extract client ID from the built URL for manager initialization
    const urlObj = new URL(wsUrl);
    const clientId = urlObj.searchParams.get('client_id') || 'unknown';
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    
    // Create manager with production-ready configuration
    managerInstance = new WebSocketManager(baseUrl, clientId, {
      connectionTimeoutMs: 10000,      // 10 second connection timeout
      enableHeartbeat: true,           // Enable heartbeat by default
      version: 1,                      // Protocol version
      role: 'frontend',                // Client role
      backoffStrategy: BackoffStrategy.createProductionStrategy()
    });
  }
  
  return managerInstance;
}

/**
 * React hook for WebSocket connection management
 */
export function useWebSocketConnection(): WebSocketConnectionHook {
  const [state, setState] = useState<WSState>(() => getManager().getState());
  const managerRef = useRef<WebSocketManager>(getManager());
  const [, setForceUpdate] = useState(0);
  
  // Force re-render when state changes
  const triggerUpdate = useCallback(() => {
    setForceUpdate(prev => prev + 1);
  }, []);
  
  // Subscribe to state changes
  useEffect(() => {
    const manager = managerRef.current;
    
    const unsubscribe = manager.onStateChange((newState) => {
      setState(newState);
      triggerUpdate();
    });
    
    return unsubscribe;
  }, [triggerUpdate]);
  
  // Auto-connect on mount if not in fallback mode
  useEffect(() => {
    const manager = managerRef.current;
    const currentState = manager.getState();
    
    if (currentState.phase === 'idle' && !currentState.is_fallback_mode) {
      // Auto-connect with a small delay to allow UI to render
      const timer = setTimeout(() => {
        manager.connect().catch(() => {
          // Auto-connect failed, but this is non-critical
          // The user can manually retry via the UI
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Connection control methods
  const connect = useCallback(() => {
    managerRef.current.connect().catch(() => {
      // Manual connect failed, but errors are handled by the manager's
      // error listeners and state transitions
    });
  }, []);
  
  const disconnect = useCallback(() => {
    managerRef.current.disconnect();
  }, []);
  
  const reconnect = useCallback(() => {
    managerRef.current.forceReconnect();
  }, []);
  
  // Messaging methods
  const send = useCallback((message: WSMessage) => {
    return managerRef.current.send(message);
  }, []);
  
  const ping = useCallback(() => {
    return managerRef.current.ping();
  }, []);
  
  // Event subscription methods
  const onMessage = useCallback((callback: (message: WSMessage) => void) => {
    return managerRef.current.onMessage(callback);
  }, []);
  
  const onError = useCallback((callback: (error: Error, context: string) => void) => {
    return managerRef.current.onError(callback);
  }, []);
  
  // Derived state values
  const isConnected = state.phase === 'open';
  const isConnecting = state.phase === 'connecting' || state.phase === 'reconnecting';
  const isFallback = state.is_fallback_mode;
  const messageStats = state.stats.message_counts_by_type;
  const connectionUptime = state.stats.current_uptime_ms;
  const fallbackReason = state.fallback_reason;
  const recentAttempts = state.recent_attempts.length;
  const nextRetryEta = state.current_attempt?.next_retry_eta || null;
  const attemptCount = managerRef.current.getState().stats?.total_attempts || 0;
  const lastError = state.recent_attempts[0] ? new Error(state.recent_attempts[0].close_reason || 'Connection failed') : null;
  
  return {
    // State
    state,
    isConnected,
    isConnecting,
    isFallback,
    
    // Controls
    connect,
    disconnect,
    reconnect,
    forceReconnect: reconnect, // Alias for reconnect
    
    // Messaging
    send,
    ping,
    
    // Statistics
    messageStats,
    connectionUptime,
    fallbackReason,
    recentAttempts,
    nextRetryEta,
    attemptCount,
    lastError,
    
    // Events
    onMessage,
    onError
  };
}

/**
 * Hook for development/debugging - provides raw manager access
 */
export function useWebSocketManager(): WebSocketManager {
  return getManager();
}

/**
 * Cleanup function for tests or app shutdown
 */
export function destroyWebSocketManager(): void {
  if (managerInstance) {
    managerInstance.destroy();
    managerInstance = null;
  }
}