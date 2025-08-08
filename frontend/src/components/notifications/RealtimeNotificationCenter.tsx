/**
 * Real-time Notification Center
 * Displays live notifications from the WebSocket service
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bell, X, Filter, Settings, AlertTriangle, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { 
  realtimeNotificationService, 
  NotificationMessage, 
  NotificationType, 
  NotificationPriority,
  SubscriptionFilter
} from '../../services/RealtimeNotificationService';

interface NotificationCenterProps {
  maxNotifications?: number;
  showConnectionStatus?: boolean;
  autoConnect?: boolean;
  authToken?: string;
  defaultFilters?: SubscriptionFilter[];
}

const RealtimeNotificationCenter: React.FC<NotificationCenterProps> = ({
  maxNotifications = 100,
  showConnectionStatus = true,
  autoConnect = true,
  authToken,
  defaultFilters
}) => {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SubscriptionFilter[]>(defaultFilters || []);
  const [unreadCount, setUnreadCount] = useState(0);

  // Connect to notification service on mount
  useEffect(() => {
    if (autoConnect) {
      connectToService();
    }

    return () => {
      realtimeNotificationService.disconnect();
    };
  }, [autoConnect, authToken]);

  const connectToService = useCallback(async () => {
    try {
      await realtimeNotificationService.connect(authToken, filters);
    } catch (error) {
      console.error('Failed to connect to notification service:', error);
    }
  }, [authToken, filters]);

  // Set up event handlers
  useEffect(() => {
    const unsubscribeConnection = realtimeNotificationService.onConnection(setIsConnected);
    
    const unsubscribeNotification = realtimeNotificationService.onAnyNotification((notification) => {
      setNotifications(prev => {
        const updated = [notification, ...prev].slice(0, maxNotifications);
        return updated;
      });
      
      if (!isExpanded) {
        setUnreadCount(prev => prev + 1);
      }
    });

    const unsubscribeError = realtimeNotificationService.onError((error) => {
      console.error('Notification service error:', error);
      // Could show error toast here
    });

    return () => {
      unsubscribeConnection();
      unsubscribeNotification();
      unsubscribeError();
    };
  }, [maxNotifications, isExpanded]);

  // Load existing notifications
  useEffect(() => {
    const existingNotifications = realtimeNotificationService.getRecentNotifications(maxNotifications);
    setNotifications(existingNotifications);
  }, [maxNotifications]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => {
      const newExpanded = !prev;
      if (newExpanded) {
        setUnreadCount(0); // Reset unread count when expanding
      }
      return newExpanded;
    });
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    realtimeNotificationService.clearNotifications();
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ARBITRAGE_OPPORTUNITY:
        return <DollarSign className="w-4 h-4 text-green-500" />;
      case NotificationType.HIGH_VALUE_BET:
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case NotificationType.ODDS_CHANGE:
        return <Activity className="w-4 h-4 text-orange-500" />;
      case NotificationType.SYSTEM_ALERT:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return 'border-red-500 bg-red-50';
      case NotificationPriority.HIGH:
        return 'border-orange-500 bg-orange-50';
      case NotificationPriority.MEDIUM:
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = useMemo(() => {
    if (filters.length === 0) return notifications;
    
    return notifications.filter(notification => 
      filters.some(filter => filter.notification_types.includes(notification.type))
    );
  }, [notifications, filters]);

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Notification Bell Button */}
      <div className="relative">
        <button
          onClick={toggleExpanded}
          className={`p-3 rounded-full shadow-lg transition-all duration-200 ${
            isConnected 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-400 text-gray-200'
          }`}
          title={isConnected ? 'Connected to live notifications' : 'Disconnected'}
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Connection Status Indicator */}
        {showConnectionStatus && (
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
        )}
      </div>

      {/* Notification Panel */}
      {isExpanded && (
        <div className="absolute top-16 right-0 w-96 max-h-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Live Notifications</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-1 hover:bg-gray-200 rounded"
                title="Filter notifications"
              >
                <Filter className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={clearNotifications}
                className="p-1 hover:bg-gray-200 rounded"
                title="Clear all notifications"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <NotificationFilters
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No notifications yet</p>
                <p className="text-sm">You'll see live updates here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRemove={removeNotification}
                    getIcon={getNotificationIcon}
                    getPriorityColor={getPriorityColor}
                    formatTimestamp={formatTimestamp}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
            <p className="text-xs text-gray-500">
              {filteredNotifications.length} of {notifications.length} notifications
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

interface NotificationItemProps {
  notification: NotificationMessage;
  onRemove: (id: string) => void;
  getIcon: (type: NotificationType) => React.ReactNode;
  getPriorityColor: (priority: NotificationPriority) => string;
  formatTimestamp: (timestamp: string) => string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRemove,
  getIcon,
  getPriorityColor,
  formatTimestamp
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} hover:bg-gray-50 transition-colors`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-1">
            {getIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-800 truncate">
                {notification.title}
              </p>
              <span className="text-xs text-gray-500 ml-2">
                {formatTimestamp(notification.timestamp)}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mt-1">
              {notification.message}
            </p>
            
            {notification.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {notification.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {notification.tags.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{notification.tags.length - 3} more
                  </span>
                )}
              </div>
            )}
            
            {Object.keys(notification.data).length > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-blue-600 hover:text-blue-800 mt-2"
              >
                {isExpanded ? 'Show less' : 'Show details'}
              </button>
            )}
            
            {isExpanded && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                <pre className="whitespace-pre-wrap text-gray-700">
                  {JSON.stringify(notification.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={() => onRemove(notification.id)}
          className="flex-shrink-0 ml-2 p-1 hover:bg-gray-200 rounded"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

interface NotificationFiltersProps {
  filters: SubscriptionFilter[];
  onFiltersChange: (filters: SubscriptionFilter[]) => void;
}

const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  filters,
  onFiltersChange
}) => {
  const [selectedTypes, setSelectedTypes] = useState<NotificationType[]>([]);
  const [minPriority, setMinPriority] = useState<NotificationPriority>(NotificationPriority.LOW);

  const notificationTypeLabels = {
    [NotificationType.ARBITRAGE_OPPORTUNITY]: 'Arbitrage Opportunities',
    [NotificationType.HIGH_VALUE_BET]: 'High Value Bets',
    [NotificationType.ODDS_CHANGE]: 'Odds Changes',
    [NotificationType.SYSTEM_ALERT]: 'System Alerts',
    [NotificationType.PORTFOLIO_ALERT]: 'Portfolio Alerts',
    [NotificationType.BANKROLL_ALERT]: 'Bankroll Alerts',
    [NotificationType.PREDICTION_UPDATE]: 'Prediction Updates',
    [NotificationType.GAME_STATUS_UPDATE]: 'Game Status',
    [NotificationType.INJURY_UPDATE]: 'Injury Updates',
    [NotificationType.LINE_MOVEMENT]: 'Line Movement'
  };

  const handleTypeChange = (type: NotificationType, checked: boolean) => {
    const newTypes = checked
      ? [...selectedTypes, type]
      : selectedTypes.filter(t => t !== type);
    
    setSelectedTypes(newTypes);
    
    const newFilter: SubscriptionFilter = {
      notification_types: newTypes,
      min_priority: minPriority
    };
    
    onFiltersChange([newFilter]);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notification Types
        </label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {Object.entries(notificationTypeLabels).map(([type, label]) => (
            <label key={type} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedTypes.includes(type as NotificationType)}
                onChange={(e) => handleTypeChange(type as NotificationType, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Minimum Priority
        </label>
        <select
          value={minPriority}
          onChange={(e) => setMinPriority(Number(e.target.value) as NotificationPriority)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value={NotificationPriority.LOW}>Low</option>
          <option value={NotificationPriority.MEDIUM}>Medium</option>
          <option value={NotificationPriority.HIGH}>High</option>
          <option value={NotificationPriority.CRITICAL}>Critical</option>
        </select>
      </div>
    </div>
  );
};

export default RealtimeNotificationCenter;
