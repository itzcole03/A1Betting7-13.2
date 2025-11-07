/**
 * Enhanced WebSocket React Hook
 * 
 * Provides a React hook interface for the enhanced WebSocket manager
 * with automatic lifecycle management, state synchronization, and
 * TypeScript safety.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { 
  EnhancedWebSocketManager, 
  EnhancedWSConfig 
} from './EnhancedWebSocketManager';
import { 
  WSMessageEnvelope, 
  WSConnectionState,
  WSConnectionHealth 
} from './protocol-types';

export interface UseEnhancedWebSocketReturn {
  // Connection state
  state: WSConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  isSimulating: boolean;
  health: WSConnectionHealth;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: <TRequest, TResponse>(
    message: Omit<WSMessageEnvelope<TRequest>, 'ts' | 'correlationId' | 'version'>
  ) => Promise<WSMessageEnvelope<TResponse> | null>;
  forceReconciliation: () => Promise<void>;
  setSimulationMode: (enabled: boolean) => void;
  
  // Statistics
  stats: ReturnType<EnhancedWebSocketManager['getStats']>;
  
  // Message handling
  onMessage: (listener: (message: WSMessageEnvelope) => void) => () => void;
  
  // Error handling
  lastError: Error | null;
}

export interface UseEnhancedWebSocketConfig extends Partial<EnhancedWSConfig> {
  /** Automatically connect on mount */
  autoConnect?: boolean;
  /** Automatically reconnect after connection loss */
  autoReconnect?: boolean;
  /** Enable React state updates */
  enableStateUpdates?: boolean;
}

const DEFAULT_HOOK_CONFIG: Required<Pick<UseEnhancedWebSocketConfig, 'autoConnect' | 'autoReconnect' | 'enableStateUpdates'>> = {
  autoConnect: true,
  autoReconnect: true,
  enableStateUpdates: true
};

/**
 * Enhanced WebSocket React Hook
 * 
 * @param config Configuration options for the WebSocket connection
 * @returns WebSocket manager interface with React integration
 */
export function useEnhancedWebSocket(
  config: UseEnhancedWebSocketConfig = {}
): UseEnhancedWebSocketReturn {
  const hookConfig = { ...DEFAULT_HOOK_CONFIG, ...config };
  const managerRef = useRef<EnhancedWebSocketManager | null>(null);
  
  // React state
  const [state, setState] = useState<WSConnectionState>(WSConnectionState.IDLE);
  const [health, setHealth] = useState<WSConnectionHealth>({
    state: WSConnectionState.IDLE,
    lastActivity: Date.now(),
    latencyMs: 0,
    successRate: 1.0,
    reconnectAttempts: 0,
    stateTime: 0
  });
  const [lastError, setLastError] = useState<Error | null>(null);
  const [stats, setStats] = useState<ReturnType<EnhancedWebSocketManager['getStats']>>({
    connection: health,
    backoff: 'No reconnection attempts yet',
    simulation: {
      isActive: false,
      uptimeMs: 0,
      messagesSent: 0,
      activeChannels: [],
      generatorsRegistered: 0
    },
    reconciliation: {
      lastReconciliation: 0,
      reconciliationInProgress: false,
      pendingSnapshots: 0,
      categoriesRegistered: 0,
      totalItems: 0
    }
  });

  // Initialize WebSocket manager
  useEffect(() => {
    const wsConfig: EnhancedWSConfig = {
      url: 'ws://localhost:8000',
      clientId: `client_${Math.random().toString(36).substr(2, 9)}`,
      connectionTimeoutMs: 30000,
      autoReconnect: hookConfig.autoReconnect,
      enableHeartbeat: true,
      role: 'frontend',
      version: '2',
      simulation: {
        enabled: false,
        updateIntervalMs: 5000,
        channels: ['props', 'odds', 'games'],
        generators: {},
        showIndicators: true
      },
      enableStateReconciliation: true,
      debug: process.env.NODE_ENV === 'development',
      ...config
    };

    const manager = new EnhancedWebSocketManager(wsConfig);
    managerRef.current = manager;

    // Set up event listeners
    const unsubscribeState = manager.onStateChange((newState) => {
      if (hookConfig.enableStateUpdates) {
        setState(newState);
        setHealth(manager.getHealth());
        setStats(manager.getStats());
      }
    });

    const unsubscribeError = manager.onError((error, _context) => {
      if (hookConfig.enableStateUpdates) {
        setLastError(error);
      }
      
      // Log errors in development
      if (process.env.NODE_ENV === 'development') {
        // Development error logging
      }
    });

    // Auto-connect if enabled
    if (hookConfig.autoConnect) {
      manager.connect().catch(() => {
        // Auto-connect failed - will be handled by error listener
      });
    }

    // Cleanup on unmount
    return () => {
      unsubscribeState();
      unsubscribeError();
      manager.destroy();
    };
  }, [config, hookConfig.autoConnect, hookConfig.autoReconnect, hookConfig.enableStateUpdates]);

  // Update stats periodically
  useEffect(() => {
    if (!hookConfig.enableStateUpdates) return;

    const interval = setInterval(() => {
      if (managerRef.current) {
        setHealth(managerRef.current.getHealth());
        setStats(managerRef.current.getStats());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hookConfig.enableStateUpdates]);

  // Memoized connection actions
  const connect = useCallback(async () => {
    if (managerRef.current) {
      setLastError(null);
      await managerRef.current.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.disconnect();
    }
  }, []);

  const sendMessage = useCallback(async <TRequest, TResponse>(
    message: Omit<WSMessageEnvelope<TRequest>, 'ts' | 'correlationId' | 'version'>
  ): Promise<WSMessageEnvelope<TResponse> | null> => {
    if (managerRef.current) {
      try {
        return await managerRef.current.sendMessage<TRequest, TResponse>(message);
      } catch (error) {
        setLastError(error as Error);
        throw error;
      }
    }
    throw new Error('WebSocket manager not initialized');
  }, []);

  const forceReconciliation = useCallback(async () => {
    if (managerRef.current) {
      await managerRef.current.forceReconciliation();
    }
  }, []);

  const setSimulationMode = useCallback((enabled: boolean) => {
    if (managerRef.current) {
      managerRef.current.setSimulationMode(enabled);
    }
  }, []);

  const onMessage = useCallback((listener: (message: WSMessageEnvelope) => void) => {
    if (managerRef.current) {
      return managerRef.current.onMessage(listener);
    }
    return () => {}; // No-op cleanup function
  }, []);

  // Memoized derived state
  const isConnected = useMemo(() => state === WSConnectionState.READY, [state]);
  const isConnecting = useMemo(() => state === WSConnectionState.CONNECTING, [state]);
  const isReconnecting = useMemo(() => state === WSConnectionState.RECONNECTING, [state]);
  const isSimulating = useMemo(() => state === WSConnectionState.SIMULATION_MODE, [state]);

  return {
    // Connection state
    state,
    isConnected,
    isConnecting,
    isReconnecting,
    isSimulating,
    health,
    
    // Actions
    connect,
    disconnect,
    sendMessage,
    forceReconciliation,
    setSimulationMode,
    
    // Statistics
    stats,
    
    // Message handling
    onMessage,
    
    // Error handling
    lastError
  };
}

/**
 * Hook for WebSocket message subscription with automatic cleanup
 */
export function useWebSocketMessage<T = unknown>(
  wsHook: UseEnhancedWebSocketReturn,
  messageType: string,
  handler: (payload: T) => void,
  _dependencies: React.DependencyList = []
): void {
  useEffect(() => {
    if (!wsHook.isConnected) return;

    const unsubscribe = wsHook.onMessage((message: WSMessageEnvelope) => {
      if (message.type === messageType) {
        handler(message.payload as T);
      }
    });

    return unsubscribe;
  }, [wsHook, messageType, handler]);
}

/**
 * Hook for WebSocket request-response pattern
 */
export function useWebSocketRequest<TRequest = unknown, TResponse = unknown>(
  wsHook: UseEnhancedWebSocketReturn
): {
  sendRequest: (type: string, payload: TRequest) => Promise<TResponse | null>;
  isLoading: boolean;
  error: Error | null;
} {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendRequest = useCallback(async (type: string, payload: TRequest): Promise<TResponse | null> => {
    if (!wsHook.isConnected) {
      throw new Error('WebSocket not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await wsHook.sendMessage<TRequest, TResponse>({
        type,
        payload
      });

      return response?.payload || null;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [wsHook]);

  return {
    sendRequest,
    isLoading,
    error
  };
}

/**
 * Hook for WebSocket connection health monitoring
 */
export function useWebSocketHealth(wsHook: UseEnhancedWebSocketReturn): {
  isHealthy: boolean;
  healthScore: number;
  issues: string[];
  recommendations: string[];
} {
  return useMemo(() => {
    const { health } = wsHook;
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check connection state
    if (!wsHook.isConnected) {
      issues.push('Not connected to server');
      if (wsHook.isSimulating) {
        recommendations.push('Using local simulation - check server availability');
      } else {
        recommendations.push('Check network connectivity and server status');
      }
    }

    // Check latency
    if (health.latencyMs > 1000) {
      issues.push('High latency detected');
      recommendations.push('Check network connection quality');
    }

    // Check success rate
    if (health.successRate < 0.95) {
      issues.push('Low message success rate');
      recommendations.push('Check for network instability');
    }

    // Check reconnection attempts
    if (health.reconnectAttempts > 3) {
      issues.push('Frequent reconnections');
      recommendations.push('Check server stability');
    }

    // Calculate health score (0-1)
    let healthScore = 1.0;
    if (!wsHook.isConnected) healthScore -= 0.5;
    if (health.latencyMs > 500) healthScore -= 0.2;
    if (health.successRate < 0.95) healthScore -= 0.2;
    if (health.reconnectAttempts > 0) healthScore -= 0.1;
    
    healthScore = Math.max(0, healthScore);

    return {
      isHealthy: healthScore > 0.8 && wsHook.isConnected,
      healthScore,
      issues,
      recommendations
    };
  }, [wsHook]);
}