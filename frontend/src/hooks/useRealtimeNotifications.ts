/**
 * React Hook for Real-time Notifications
 * Provides easy integration with the WebSocket notification service
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  realtimeNotificationService, 
  NotificationMessage, 
  NotificationType, 
  NotificationPriority,
  SubscriptionFilter,
  NotificationHandler,
  ConnectionHandler,
  ErrorHandler
} from '../services/RealtimeNotificationService';

export interface UseRealtimeNotificationsOptions {
  autoConnect?: boolean;
  authToken?: string;
  filters?: SubscriptionFilter[];
  maxNotifications?: number;
  onConnection?: ConnectionHandler;
  onError?: ErrorHandler;
}

export interface UseRealtimeNotificationsReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  
  // Notifications
  notifications: NotificationMessage[];
  unreadCount: number;
  
  // Actions
  connect: (token?: string, filters?: SubscriptionFilter[]) => Promise<void>;
  disconnect: () => void;
  subscribe: (filter: SubscriptionFilter) => void;
  unsubscribe: (types: NotificationType[]) => void;
  clearNotifications: () => void;
  markAsRead: () => void;
  
  // Event handlers
  onNotification: (type: NotificationType, handler: NotificationHandler) => () => void;
  onAnyNotification: (handler: NotificationHandler) => () => void;
  
  // Statistics
  connectionStats: any;
  requestStats: () => void;
}

export const useRealtimeNotifications = (
  options: UseRealtimeNotificationsOptions = {}
): UseRealtimeNotificationsReturn => {
  const {
    autoConnect = true,
    authToken,
    filters = [],
    maxNotifications = 100,
    onConnection,
    onError
  } = options;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionStats, setConnectionStats] = useState<any>(null);

  // Refs to track handlers and prevent re-registrations
  const handlersRef = useRef<{
    connection?: () => void;
    error?: () => void;
    notifications: Map<string, () => void>;
  }>({ notifications: new Map() });

  // Connect function
  const connect = useCallback(async (token?: string, customFilters?: SubscriptionFilter[]) => {
    if (isConnected || isConnecting) return;

    setIsConnecting(true);
    try {
      await realtimeNotificationService.connect(
        token || authToken, 
        customFilters || filters
      );
    } catch (error) {
      console.error('Failed to connect to notification service:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnected, isConnecting, authToken, filters]);

  // Disconnect function
  const disconnect = useCallback(() => {
    realtimeNotificationService.disconnect();
  }, []);

  // Subscribe function
  const subscribe = useCallback((filter: SubscriptionFilter) => {
    realtimeNotificationService.subscribe(filter);
  }, []);

  // Unsubscribe function
  const unsubscribe = useCallback((types: NotificationType[]) => {
    realtimeNotificationService.unsubscribe(types);
  }, []);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    realtimeNotificationService.clearNotifications();
  }, []);

  // Mark as read
  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Event handler wrappers
  const onNotification = useCallback((type: NotificationType, handler: NotificationHandler) => {
    return realtimeNotificationService.onNotification(type, handler);
  }, []);

  const onAnyNotification = useCallback((handler: NotificationHandler) => {
    return realtimeNotificationService.onAnyNotification(handler);
  }, []);

  // Request stats
  const requestStats = useCallback(() => {
    realtimeNotificationService.requestStats();
  }, []);

  // Set up event handlers on mount
  useEffect(() => {
    // Connection handler
    const unsubscribeConnection = realtimeNotificationService.onConnection((connected) => {
      setIsConnected(connected);
      if (onConnection) {
        onConnection(connected);
      }
      
      if (connected) {
        // Update connection stats
        const stats = realtimeNotificationService.getConnectionStats();
        setConnectionStats(stats);
      }
    });

    // Error handler
    const unsubscribeError = realtimeNotificationService.onError((error) => {
      console.error('Notification service error:', error);
      if (onError) {
        onError(error);
      }
    });

    // Global notification handler
    const unsubscribeNotifications = realtimeNotificationService.onAnyNotification((notification) => {
      setNotifications(prev => {
        const updated = [notification, ...prev].slice(0, maxNotifications);
        return updated;
      });
      
      // Increment unread count
      setUnreadCount(prev => prev + 1);
    });

    // Store unsubscribe functions
    handlersRef.current.connection = unsubscribeConnection;
    handlersRef.current.error = unsubscribeError;
    handlersRef.current.notifications.set('global', unsubscribeNotifications);

    return () => {
      unsubscribeConnection();
      unsubscribeError();
      unsubscribeNotifications();
    };
  }, [maxNotifications, onConnection, onError]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && !isConnected && !isConnecting) {
      connect().catch(console.error);
    }
  }, [autoConnect, isConnected, isConnecting, connect]);

  // Load existing notifications on mount
  useEffect(() => {
    const existingNotifications = realtimeNotificationService.getRecentNotifications(maxNotifications);
    setNotifications(existingNotifications);
    setUnreadCount(existingNotifications.length);
  }, [maxNotifications]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up all handlers
      Object.values(handlersRef.current.notifications).forEach(unsubscribe => unsubscribe());
      handlersRef.current.notifications.clear();
      
      if (handlersRef.current.connection) {
        handlersRef.current.connection();
      }
      if (handlersRef.current.error) {
        handlersRef.current.error();
      }
    };
  }, []);

  return {
    // Connection state
    isConnected,
    isConnecting,
    
    // Notifications
    notifications,
    unreadCount,
    
    // Actions
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    clearNotifications,
    markAsRead,
    
    // Event handlers
    onNotification,
    onAnyNotification,
    
    // Statistics
    connectionStats,
    requestStats
  };
};

// Specialized hooks for specific notification types
export const useArbitrageNotifications = () => {
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<NotificationMessage[]>([]);
  
  const { onNotification, ...rest } = useRealtimeNotifications({
    filters: [{
      notification_types: [NotificationType.ARBITRAGE_OPPORTUNITY],
      min_priority: NotificationPriority.MEDIUM
    }]
  });

  useEffect(() => {
    const unsubscribe = onNotification(NotificationType.ARBITRAGE_OPPORTUNITY, (notification) => {
      setArbitrageOpportunities(prev => [notification, ...prev].slice(0, 20));
    });

    return unsubscribe;
  }, [onNotification]);

  return {
    ...rest,
    arbitrageOpportunities
  };
};

export const useHighValueBetNotifications = () => {
  const [highValueBets, setHighValueBets] = useState<NotificationMessage[]>([]);
  
  const { onNotification, ...rest } = useRealtimeNotifications({
    filters: [{
      notification_types: [NotificationType.HIGH_VALUE_BET],
      min_priority: NotificationPriority.MEDIUM
    }]
  });

  useEffect(() => {
    const unsubscribe = onNotification(NotificationType.HIGH_VALUE_BET, (notification) => {
      setHighValueBets(prev => [notification, ...prev].slice(0, 20));
    });

    return unsubscribe;
  }, [onNotification]);

  return {
    ...rest,
    highValueBets
  };
};

export const useOddsChangeNotifications = (sport?: string, sportsbook?: string) => {
  const [oddsChanges, setOddsChanges] = useState<NotificationMessage[]>([]);
  
  const filters = useMemo(() => [{
    notification_types: [NotificationType.ODDS_CHANGE, NotificationType.LINE_MOVEMENT],
    min_priority: NotificationPriority.LOW,
    sports: sport ? [sport] : undefined,
    tags: sportsbook ? [sportsbook] : undefined
  }], [sport, sportsbook]);
  
  const { onNotification, ...rest } = useRealtimeNotifications({ filters });

  useEffect(() => {
    const unsubscribeOdds = onNotification(NotificationType.ODDS_CHANGE, (notification) => {
      setOddsChanges(prev => [notification, ...prev].slice(0, 50));
    });

    const unsubscribeLines = onNotification(NotificationType.LINE_MOVEMENT, (notification) => {
      setOddsChanges(prev => [notification, ...prev].slice(0, 50));
    });

    return () => {
      unsubscribeOdds();
      unsubscribeLines();
    };
  }, [onNotification]);

  return {
    ...rest,
    oddsChanges
  };
};

export const usePortfolioNotifications = (authToken?: string) => {
  const [portfolioAlerts, setPortfolioAlerts] = useState<NotificationMessage[]>([]);
  const [bankrollAlerts, setBankrollAlerts] = useState<NotificationMessage[]>([]);
  
  const { onNotification, ...rest } = useRealtimeNotifications({
    authToken,
    filters: [{
      notification_types: [
        NotificationType.PORTFOLIO_ALERT,
        NotificationType.BANKROLL_ALERT
      ],
      min_priority: NotificationPriority.LOW
    }]
  });

  useEffect(() => {
    const unsubscribePortfolio = onNotification(NotificationType.PORTFOLIO_ALERT, (notification) => {
      setPortfolioAlerts(prev => [notification, ...prev].slice(0, 20));
    });

    const unsubscribeBankroll = onNotification(NotificationType.BANKROLL_ALERT, (notification) => {
      setBankrollAlerts(prev => [notification, ...prev].slice(0, 20));
    });

    return () => {
      unsubscribePortfolio();
      unsubscribeBankroll();
    };
  }, [onNotification]);

  return {
    ...rest,
    portfolioAlerts,
    bankrollAlerts
  };
};
