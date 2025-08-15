/**
 * WebSocket React Hooks
 * Easy-to-use hooks for WebSocket functionality in React components
 */

import { useEffect, useRef, useCallback } from 'react';
import { 
  useWebSocketStore, 
  useWebSocketConnection, 
  useWebSocketData,
  SubscriptionFilter 
} from '../services/WebSocketManager';

/**
 * Hook to automatically connect to WebSocket on component mount
 * @param token - Optional JWT token for authentication
 * @param autoConnect - Whether to connect automatically (default: true)
 */
export const useWebSocketConnectionHook = (token?: string, autoConnect = true) => {
  const { connect, disconnect, setConfig } = useWebSocketStore();
  const connection = useWebSocketConnection();
  const hasConnected = useRef(false);

  // Update token in config
  useEffect(() => {
    if (token) {
      setConfig({ token });
    }
  }, [token, setConfig]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && !connection.connected && !connection.connecting && !hasConnected.current) {
      hasConnected.current = true;
      connect(token);
    }
  }, [autoConnect, connection.connected, connection.connecting, connect, token]);

  // Disconnect on unmount
  useEffect(() => {
    return () => {
      if (connection.connected) {
        disconnect();
      }
    };
  }, [disconnect, connection.connected]);

  return {
    ...connection,
    connect: useCallback(() => connect(token), [connect, token]),
    disconnect
  };
};

/**
 * Hook to subscribe to WebSocket updates with automatic cleanup
 * @param subscriptionType - Type of subscription
 * @param filters - Optional filters for the subscription
 * @param enabled - Whether subscription is enabled (default: true)
 */
export const useWebSocketSubscription = (
  subscriptionType: string,
  filters?: SubscriptionFilter,
  enabled = true
) => {
  const { subscribe, unsubscribe, subscriptions, pending_subscriptions } = useWebSocketStore();
  const connection = useWebSocketConnection();

  const subscriptionKey = useRef<string>();

  // Generate subscription key
  const generateKey = useCallback(() => {
    if (!filters || Object.keys(filters).length === 0) {
      return subscriptionType;
    }
    
    const filterStr = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key]}`)
      .join('_');
    
    return `${subscriptionType}_${filterStr}`;
  }, [subscriptionType, filters]);

  subscriptionKey.current = generateKey();

  // Subscribe when enabled and connected
  useEffect(() => {
    if (enabled && connection.connected && subscriptionKey.current) {
      const key = subscriptionKey.current;
      
      // Only subscribe if not already subscribed
      if (!subscriptions.has(key) && !pending_subscriptions.has(key)) {
        subscribe(subscriptionType, filters);
      }
    }
  }, [enabled, connection.connected, subscriptionType, filters, subscribe, subscriptions, pending_subscriptions]);

  // Unsubscribe on unmount or when disabled
  useEffect(() => {
    return () => {
      if (subscriptionKey.current && subscriptions.has(subscriptionKey.current)) {
        unsubscribe(subscriptionType, filters);
      }
    };
  }, [subscriptionType, filters, unsubscribe, subscriptions]);

  const isSubscribed = subscriptionKey.current ? subscriptions.has(subscriptionKey.current) : false;
  const isPending = subscriptionKey.current ? pending_subscriptions.has(subscriptionKey.current) : false;

  return {
    isSubscribed,
    isPending,
    subscription: subscriptionKey.current ? subscriptions.get(subscriptionKey.current) : null
  };
};

/**
 * Hook to get live odds updates
 * @param filters - Optional filters for odds
 */
export const useWebSocketOdds = (filters?: SubscriptionFilter) => {
  const { odds } = useWebSocketData();
  const subscription = useWebSocketSubscription('odds_updates', filters);

  return {
    odds,
    ...subscription
  };
};

/**
 * Hook to get live predictions
 * @param filters - Optional filters for predictions
 */
export const useWebSocketPredictions = (filters?: SubscriptionFilter) => {
  const { predictions } = useWebSocketData();
  const subscription = useWebSocketSubscription('predictions', filters);

  return {
    predictions,
    ...subscription
  };
};

/**
 * Hook to get arbitrage opportunities
 * @param filters - Optional filters for arbitrage
 */
export const useWebSocketArbitrage = (filters?: SubscriptionFilter) => {
  const { arbitrage } = useWebSocketData();
  const subscription = useWebSocketSubscription('arbitrage', filters);

  return {
    opportunities: arbitrage,
    ...subscription
  };
};

/**
 * Hook to get sport-specific updates
 * @param sport - Sport name (MLB, NBA, NFL, NHL)
 * @param filters - Optional additional filters
 */
export const useWebSocketSport = (sport: string, filters?: SubscriptionFilter) => {
  const data = useWebSocketData();
  const subscription = useWebSocketSubscription(sport.toLowerCase(), filters);

  return {
    data,
    ...subscription
  };
};

/**
 * Hook to get portfolio updates (requires authentication)
 * @param token - JWT token for authentication
 */
export const useWebSocketPortfolio = (token?: string) => {
  const { portfolio } = useWebSocketData();
  const subscription = useWebSocketSubscription('portfolio', undefined, !!token);

  return {
    portfolio,
    ...subscription
  };
};

/**
 * Hook to listen for specific WebSocket events
 * @param eventType - Type of event to listen for
 * @param callback - Callback function when event occurs
 * @param deps - Dependencies array for callback
 */
export const useWebSocketEvent = (
  eventType: string,
  callback: (data: unknown) => void,
  deps: React.DependencyList = []
) => {
  const callbackRef = useRef(callback);
  
  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  useEffect(() => {
    // Subscribe to store changes to detect events
    const unsubscribe = useWebSocketStore.subscribe(
      (state) => state.latest_odds, // This will change on any data update
      () => {
        // Check for specific event type in recent messages
        // This is a simplified implementation - in a real app you might
        // want to maintain a separate event stream
        if (callbackRef.current) {
          // CallbackRef.current(eventData);
        }
      }
    );

    return unsubscribe;
  }, [eventType]);
};

/**
 * Hook to send WebSocket messages
 */
export const useWebSocketSender = () => {
  const { sendMessage } = useWebSocketStore();
  const connection = useWebSocketConnection();

  const send = useCallback((message: Record<string, unknown>) => {
    if (!connection.connected) {
      throw new Error('WebSocket not connected');
    }
    sendMessage(message);
  }, [sendMessage, connection.connected]);

  return { send, canSend: connection.connected };
};

/**
 * Hook for WebSocket analytics and debugging
 */
export const useWebSocketAnalytics = () => {
  const { stats, subscriptions, connection } = useWebSocketStore();

  return {
    stats,
    connectionInfo: {
      isConnected: connection.connected,
      isAuthenticated: connection.authenticated,
      clientId: connection.client_id,
      userId: connection.user_id,
      connectionCount: connection.connection_count
    },
    subscriptionInfo: {
      totalSubscriptions: subscriptions.size,
      subscriptionTypes: Array.from(subscriptions.values()).map(s => s.subscription_type),
      subscriptionDetails: Array.from(subscriptions.entries())
    }
  };
};

export default {
  useWebSocketConnectionHook,
  useWebSocketSubscription,
  useWebSocketOdds,
  useWebSocketPredictions,
  useWebSocketArbitrage,
  useWebSocketSport,
  useWebSocketPortfolio,
  useWebSocketEvent,
  useWebSocketSender,
  useWebSocketAnalytics
};
