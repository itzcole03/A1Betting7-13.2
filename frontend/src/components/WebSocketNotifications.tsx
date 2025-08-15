/**
 * WebSocket Notification Component
 * Displays user-facing notifications for WebSocket connection status and updates
 */

import React, { useEffect, useState } from 'react';
import { X, Wifi, WifiOff, AlertTriangle, CheckCircle, Info, Zap } from 'lucide-react';
import { useWebSocketStore, useWebSocketNotifications, useWebSocketConnection } from '../services/WebSocketManager';

interface NotificationProps {
  notification: {
    id: string;
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    timestamp: string;
    auto_dismiss?: boolean;
  };
  onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationProps> = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(notification.id), 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-500';
      case 'warning':
        return 'border-yellow-500';
      case 'error':
        return 'border-red-500';
      case 'info':
        return 'border-blue-500';
      default:
        return 'border-gray-500';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        bg-gray-800 border-l-4 ${getBorderColor()} rounded-lg shadow-lg p-4 mb-2
        max-w-sm w-full
      `}
    >
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">
            {notification.title}
          </p>
          <p className="text-sm text-gray-300 mt-1">
            {notification.message}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={handleRemove}
          className="text-gray-400 hover:text-gray-200 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const WebSocketNotificationCenter: React.FC = () => {
  const notifications = useWebSocketNotifications();
  const { removeNotification } = useWebSocketStore();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
};

interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
}

export const WebSocketConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const connection = useWebSocketConnection();
  const { connect, disconnect } = useWebSocketStore();

  const getStatusIcon = () => {
    if (connection.connecting || connection.reconnecting) {
      return <Zap className="w-4 h-4 animate-pulse text-yellow-500" />;
    } else if (connection.connected) {
      return <Wifi className="w-4 h-4 text-green-500" />;
    } else {
      return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    if (connection.connecting) return 'Connecting...';
    if (connection.reconnecting) return 'Reconnecting...';
    if (connection.connected) return 'Connected';
    return 'Disconnected';
  };

  const getStatusColor = () => {
    if (connection.connecting || connection.reconnecting) return 'text-yellow-500';
    if (connection.connected) return 'text-green-500';
    return 'text-red-500';
  };

  const handleToggleConnection = () => {
    if (connection.connected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {getStatusIcon()}
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      
      {showDetails && (
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          {connection.authenticated && (
            <span className="bg-green-600 text-green-100 px-2 py-1 rounded-full">
              Authenticated
            </span>
          )}
          {connection.client_id && (
            <span title={`Client ID: ${connection.client_id}`}>
              ID: {connection.client_id.slice(0, 8)}...
            </span>
          )}
        </div>
      )}
      
      <button
        onClick={handleToggleConnection}
        disabled={connection.connecting || connection.reconnecting}
        className="text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 
                   px-2 py-1 rounded transition-colors"
      >
        {connection.connected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  );
};

interface SubscriptionManagerProps {
  className?: string;
}

export const WebSocketSubscriptionManager: React.FC<SubscriptionManagerProps> = ({ 
  className = '' 
}) => {
  const { subscriptions, pending_subscriptions } = useWebSocketStore();
  const { subscribe, unsubscribe } = useWebSocketStore();
  const [selectedType, setSelectedType] = useState('odds_updates');

  const subscriptionTypes = [
    { value: 'odds_updates', label: 'Odds Updates', description: 'Real-time odds changes' },
    { value: 'predictions', label: 'Predictions', description: 'ML prediction updates' },
    { value: 'analytics', label: 'Analytics', description: 'Performance analytics' },
    { value: 'arbitrage', label: 'Arbitrage', description: 'Arbitrage opportunities' },
    { value: 'mlb', label: 'MLB', description: 'Baseball-specific updates' },
    { value: 'nba', label: 'NBA', description: 'Basketball-specific updates' },
    { value: 'nfl', label: 'NFL', description: 'Football-specific updates' },
  ];

  const handleSubscribe = async () => {
    try {
      await subscribe(selectedType);
    } catch (error) {
      console.error('Failed to subscribe:', error);
    }
  };

  const handleUnsubscribe = async (subscriptionKey: string) => {
    const subscription = subscriptions.get(subscriptionKey);
    if (subscription) {
      try {
        await unsubscribe(subscription.subscription_type, subscription.filters);
      } catch (error) {
        console.error('Failed to unsubscribe:', error);
      }
    }
  };

  const isPending = (type: string) => {
    return pending_subscriptions.has(type);
  };

  const isSubscribed = (type: string) => {
    return Array.from(subscriptions.keys()).some(key => key.startsWith(type));
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-medium text-white mb-4">
        WebSocket Subscriptions
      </h3>
      
      {/* Subscription Controls */}
      <div className="space-y-3 mb-6">
        <div className="flex space-x-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="flex-1 bg-gray-700 text-white border border-gray-600 
                       rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            {subscriptionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label} - {type.description}
              </option>
            ))}
          </select>
          <button
            onClick={handleSubscribe}
            disabled={isPending(selectedType) || isSubscribed(selectedType)}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 
                       text-white px-4 py-2 rounded text-sm transition-colors"
          >
            {isPending(selectedType) ? 'Subscribing...' : 'Subscribe'}
          </button>
        </div>
      </div>
      
      {/* Active Subscriptions */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-300 mb-2">
          Active Subscriptions ({subscriptions.size})
        </h4>
        
        {subscriptions.size === 0 ? (
          <p className="text-sm text-gray-400">No active subscriptions</p>
        ) : (
          <div className="space-y-2">
            {Array.from(subscriptions.entries()).map(([key, subscription]) => (
              <div
                key={key}
                className="flex items-center justify-between bg-gray-700 rounded px-3 py-2"
              >
                <div className="flex-1">
                  <span className="text-sm font-medium text-white">
                    {subscription.subscription_type}
                  </span>
                  {subscription.filters && Object.keys(subscription.filters).length > 0 && (
                    <div className="text-xs text-gray-300 mt-1">
                      Filters: {JSON.stringify(subscription.filters)}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    Since: {new Date(subscription.subscribed_at).toLocaleTimeString()}
                  </div>
                </div>
                <button
                  onClick={() => handleUnsubscribe(key)}
                  className="text-red-400 hover:text-red-300 text-sm transition-colors"
                >
                  Unsubscribe
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebSocketNotificationCenter;
