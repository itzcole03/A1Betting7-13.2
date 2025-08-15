/**
 * WebSocket Connection Manager with Auto-reconnection and Room Subscriptions
 * Built with Zustand for state management and user-facing notifications
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

// Types
export interface WebSocketMessage {
  type: string;
  status: 'success' | 'error';
  data?: any;
  error?: string;
  client_id?: string;
  timestamp: string;
}

export interface SubscriptionFilter {
  sport?: string;
  game_id?: string;
  player?: string;
  sportsbook?: string;
  min_profit?: number;
  [key: string]: any;
}

export interface Subscription {
  subscription_type: string;
  filters?: SubscriptionFilter;
  room_id?: string;
  subscribed_at: string;
}

export interface ConnectionStatus {
  connected: boolean;
  authenticated: boolean;
  connecting: boolean;
  reconnecting: boolean;
  client_id?: string;
  user_id?: string;
  last_ping?: string;
  connection_count: number;
}

export interface WebSocketNotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  auto_dismiss?: boolean;
  duration?: number;
}

export interface WebSocketStats {
  messages_sent: number;
  messages_received: number;
  reconnect_attempts: number;
  uptime: number;
  last_message_time?: string;
}

// WebSocket Store State
interface WebSocketState {
  // Connection state
  connection: ConnectionStatus;
  websocket: WebSocket | null;
  
  // Configuration
  config: {
    auto_reconnect: boolean;
    max_reconnect_attempts: number;
    reconnect_interval: number;
    heartbeat_interval: number;
    base_url: string;
    token?: string;
  };
  
  // Subscriptions
  subscriptions: Map<string, Subscription>;
  pending_subscriptions: Set<string>;
  
  // Data received from WebSocket
  latest_odds: any[];
  latest_predictions: any[];
  latest_analytics: any;
  arbitrage_opportunities: any[];
  portfolio_updates: any;
  
  // Notifications and stats
  notifications: WebSocketNotification[];
  stats: WebSocketStats;
  
  // Actions
  connect: (token?: string) => Promise<void>;
  disconnect: () => void;
  subscribe: (subscription_type: string, filters?: SubscriptionFilter) => Promise<void>;
  unsubscribe: (subscription_type: string, filters?: SubscriptionFilter) => Promise<void>;
  sendMessage: (message: any) => void;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;
  setConfig: (config: Partial<WebSocketState['config']>) => void;
}

// WebSocket Connection Manager Class
class WebSocketConnectionManager {
  private store: any;
  private reconnectTimeout?: NodeJS.Timeout;
  private heartbeatInterval?: NodeJS.Timeout;
  private reconnectAttempts = 0;

  constructor(store: any) {
    this.store = store;
  }

  async connect(token?: string): Promise<void> {
    const state = this.store.getState();
    
    if (state.connection.connecting) {
      return;
    }

    this.store.setState((state: WebSocketState) => ({
      connection: { ...state.connection, connecting: true }
    }));

    try {
      await this.createConnection(token);
      this.reconnectAttempts = 0;
      
      this.addNotification({
        type: 'success',
        title: 'Connected',
        message: 'WebSocket connection established',
        auto_dismiss: true,
        duration: 3000
      });
      
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      
      this.addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: 'Failed to connect to real-time updates',
        auto_dismiss: false
      });
      
      this.scheduleReconnect();
    }
  }

  private async createConnection(token?: string): Promise<void> {
    const state = this.store.getState();
    const wsUrl = this.buildWebSocketUrl(token);
    
    const ws = new WebSocket(wsUrl);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      ws.onopen = () => {
        clearTimeout(timeout);
        
        this.store.setState((state: WebSocketState) => ({
          websocket: ws,
          connection: {
            ...state.connection,
            connected: true,
            connecting: false,
            reconnecting: false,
            connection_count: state.connection.connection_count + 1
          },
          config: { ...state.config, token }
        }));

        this.setupEventListeners(ws);
        this.startHeartbeat();
        resolve();
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
    });
  }

  private buildWebSocketUrl(token?: string): string {
    const state = this.store.getState();
    const baseUrl = state.config.base_url.replace('http', 'ws');
    const endpoint = '/ws/v2/connect';
    
    const params = new URLSearchParams();
    if (token) {
      params.append('token', token);
    }
    
    return `${baseUrl}${endpoint}?${params.toString()}`;
  }

  private setupEventListeners(ws: WebSocket): void {
    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
        
        this.store.setState((state: WebSocketState) => ({
          stats: {
            ...state.stats,
            messages_received: state.stats.messages_received + 1,
            last_message_time: new Date().toISOString()
          }
        }));
        
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      this.store.setState((state: WebSocketState) => ({
        websocket: null,
        connection: {
          ...state.connection,
          connected: false,
          connecting: false
        }
      }));

      this.stopHeartbeat();

      // Only show notification if it wasn't a manual disconnect
      if (event.code !== 1000) {
        this.addNotification({
          type: 'warning',
          title: 'Connection Lost',
          message: 'Real-time updates disconnected. Attempting to reconnect...',
          auto_dismiss: false
        });

        this.scheduleReconnect();
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      
      this.addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'WebSocket connection encountered an error',
        auto_dismiss: false
      });
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    const { type, data, status } = message;

    switch (type) {
      case 'welcome':
        this.store.setState((state: WebSocketState) => ({
          connection: {
            ...state.connection,
            client_id: data?.client_id,
            user_id: data?.user_id,
            authenticated: data?.authenticated || false
          }
        }));
        
        // Resubscribe to existing subscriptions
        this.resubscribeAll();
        break;

      case 'pong':
        this.store.setState((state: WebSocketState) => ({
          connection: {
            ...state.connection,
            last_ping: data?.server_time || new Date().toISOString()
          }
        }));
        break;

      case 'subscription_confirmed':
        this.handleSubscriptionConfirmed(data);
        break;

      case 'subscription_removed':
        this.handleSubscriptionRemoved(data);
        break;

      case 'odds_update':
        this.store.setState((state: WebSocketState) => ({
          latest_odds: Array.isArray(data) ? data : [data]
        }));
        break;

      case 'prediction_update':
        this.store.setState((state: WebSocketState) => ({
          latest_predictions: Array.isArray(data) ? data : [data]
        }));
        break;

      case 'analytics_update':
        this.store.setState((state: WebSocketState) => ({
          latest_analytics: data
        }));
        break;

      case 'arbitrage_alert':
        this.store.setState((state: WebSocketState) => ({
          arbitrage_opportunities: [
            ...(state.arbitrage_opportunities || []),
            ...(Array.isArray(data) ? data : [data])
          ].slice(-50) // Keep latest 50 opportunities
        }));
        
        this.addNotification({
          type: 'info',
          title: 'Arbitrage Opportunity',
          message: `New arbitrage opportunity: ${data?.profit_percentage || 'Unknown'}% profit`,
          auto_dismiss: true,
          duration: 10000
        });
        break;

      case 'portfolio_update':
        this.store.setState((state: WebSocketState) => ({
          portfolio_updates: data
        }));
        break;

      case 'system_alert':
        this.addNotification({
          type: data?.priority === 'high' ? 'error' : 'info',
          title: data?.title || 'System Alert',
          message: data?.message || 'System notification',
          auto_dismiss: data?.priority !== 'high',
          duration: data?.priority === 'high' ? undefined : 5000
        });
        break;

      case 'error':
        console.error('WebSocket error message:', message);
        this.addNotification({
          type: 'error',
          title: 'WebSocket Error',
          message: message.error || 'Unknown WebSocket error',
          auto_dismiss: false
        });
        break;

      default:
        console.log('Unhandled WebSocket message type:', type, data);
    }
  }

  private handleSubscriptionConfirmed(data: any): void {
    const subscriptionKey = this.getSubscriptionKey(
      data.subscription_type,
      data.filters
    );
    
    this.store.setState((state: WebSocketState) => {
      const newSubscriptions = new Map(state.subscriptions);
      const newPending = new Set(state.pending_subscriptions);
      
      newSubscriptions.set(subscriptionKey, {
        subscription_type: data.subscription_type,
        filters: data.filters,
        room_id: data.room_id,
        subscribed_at: new Date().toISOString()
      });
      
      newPending.delete(subscriptionKey);
      
      return {
        subscriptions: newSubscriptions,
        pending_subscriptions: newPending
      };
    });

    this.addNotification({
      type: 'success',
      title: 'Subscribed',
      message: `Subscribed to ${data.subscription_type} updates`,
      auto_dismiss: true,
      duration: 2000
    });
  }

  private handleSubscriptionRemoved(data: any): void {
    const subscriptionKey = this.getSubscriptionKey(
      data.subscription_type,
      data.filters
    );
    
    this.store.setState((state: WebSocketState) => {
      const newSubscriptions = new Map(state.subscriptions);
      newSubscriptions.delete(subscriptionKey);
      
      return { subscriptions: newSubscriptions };
    });

    this.addNotification({
      type: 'info',
      title: 'Unsubscribed',
      message: `Unsubscribed from ${data.subscription_type} updates`,
      auto_dismiss: true,
      duration: 2000
    });
  }

  private async resubscribeAll(): Promise<void> {
    const state = this.store.getState();
    
    for (const [key, subscription] of state.subscriptions.entries()) {
      try {
        await this.subscribe(subscription.subscription_type, subscription.filters);
      } catch (error) {
        console.error(`Failed to resubscribe to ${key}:`, error);
      }
    }
  }

  async subscribe(subscription_type: string, filters?: SubscriptionFilter): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey(subscription_type, filters);
    
    this.store.setState((state: WebSocketState) => {
      const newPending = new Set(state.pending_subscriptions);
      newPending.add(subscriptionKey);
      return { pending_subscriptions: newPending };
    });

    const message = {
      type: 'subscribe',
      subscription_type,
      filters: filters || {},
      timestamp: new Date().toISOString()
    };

    this.sendMessage(message);
  }

  async unsubscribe(subscription_type: string, filters?: SubscriptionFilter): Promise<void> {
    const message = {
      type: 'unsubscribe',
      subscription_type,
      filters: filters || {},
      timestamp: new Date().toISOString()
    };

    this.sendMessage(message);
  }

  sendMessage(message: any): void {
    const state = this.store.getState();
    
    if (!state.websocket || state.websocket.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: WebSocket not connected');
      return;
    }

    try {
      state.websocket.send(JSON.stringify(message));
      
      this.store.setState((state: WebSocketState) => ({
        stats: {
          ...state.stats,
          messages_sent: state.stats.messages_sent + 1
        }
      }));
      
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
    }
  }

  disconnect(): void {
    const state = this.store.getState();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    this.stopHeartbeat();

    if (state.websocket) {
      state.websocket.close(1000, 'Manual disconnect');
    }

    this.store.setState((state: WebSocketState) => ({
      websocket: null,
      connection: {
        ...state.connection,
        connected: false,
        connecting: false,
        reconnecting: false
      }
    }));
  }

  private scheduleReconnect(): void {
    const state = this.store.getState();
    
    if (!state.config.auto_reconnect) {
      return;
    }

    if (this.reconnectAttempts >= state.config.max_reconnect_attempts) {
      this.addNotification({
        type: 'error',
        title: 'Reconnection Failed',
        message: 'Unable to reconnect to real-time updates. Please refresh the page.',
        auto_dismiss: false
      });
      return;
    }

    this.reconnectAttempts++;
    
    this.store.setState((state: WebSocketState) => ({
      connection: { ...state.connection, reconnecting: true },
      stats: {
        ...state.stats,
        reconnect_attempts: state.stats.reconnect_attempts + 1
      }
    }));

    const delay = Math.min(
      state.config.reconnect_interval * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect(state.config.token);
    }, delay);
  }

  private startHeartbeat(): void {
    const state = this.store.getState();
    
    this.heartbeatInterval = setInterval(() => {
      this.sendMessage({
        type: 'ping',
        timestamp: new Date().toISOString()
      });
    }, state.config.heartbeat_interval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  private getSubscriptionKey(subscription_type: string, filters?: SubscriptionFilter): string {
    if (!filters || Object.keys(filters).length === 0) {
      return subscription_type;
    }
    
    const filterStr = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key]}`)
      .join('_');
    
    return `${subscription_type}_${filterStr}`;
  }

  private addNotification(notification: Omit<WebSocketNotification, 'id' | 'timestamp'>): void {
    const newNotification: WebSocketNotification = {
      ...notification,
      id: `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    this.store.setState((state: WebSocketState) => ({
      notifications: [...state.notifications, newNotification].slice(-20) // Keep latest 20
    }));

    // Auto-dismiss if specified
    if (notification.auto_dismiss && notification.duration) {
      setTimeout(() => {
        this.store.getState().removeNotification(newNotification.id);
      }, notification.duration);
    }
  }
}

// Create Zustand store
export const useWebSocketStore = create<WebSocketState>()(
  devtools(
    subscribeWithSelector((set, get) => {
      const manager = new WebSocketConnectionManager({ getState: get, setState: set });

      return {
        // Initial state
        connection: {
          connected: false,
          authenticated: false,
          connecting: false,
          reconnecting: false,
          connection_count: 0
        },
        websocket: null,
        
        config: {
          auto_reconnect: true,
          max_reconnect_attempts: 5,
          reconnect_interval: 2000,
          heartbeat_interval: 30000,
          base_url: window.location.protocol === 'https:' 
            ? 'wss://localhost:8000' 
            : 'ws://localhost:8000'
        },
        
        subscriptions: new Map(),
        pending_subscriptions: new Set(),
        
        latest_odds: [],
        latest_predictions: [],
        latest_analytics: null,
        arbitrage_opportunities: [],
        portfolio_updates: null,
        
        notifications: [],
        stats: {
          messages_sent: 0,
          messages_received: 0,
          reconnect_attempts: 0,
          uptime: 0
        },

        // Actions
        connect: manager.connect.bind(manager),
        disconnect: manager.disconnect.bind(manager),
        subscribe: manager.subscribe.bind(manager),
        unsubscribe: manager.unsubscribe.bind(manager),
        sendMessage: manager.sendMessage.bind(manager),
        
        clearNotifications: () => set({ notifications: [] }),
        
        removeNotification: (id: string) => 
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== id)
          })),
          
        setConfig: (config) =>
          set((state) => ({
            config: { ...state.config, ...config }
          }))
      };
    }),
    { name: 'websocket-store' }
  )
);

// Selector hooks for specific data
export const useWebSocketConnection = () => 
  useWebSocketStore((state) => state.connection);

export const useWebSocketData = () => 
  useWebSocketStore((state) => ({
    odds: state.latest_odds,
    predictions: state.latest_predictions,
    analytics: state.latest_analytics,
    arbitrage: state.arbitrage_opportunities,
    portfolio: state.portfolio_updates
  }));

export const useWebSocketNotifications = () =>
  useWebSocketStore((state) => state.notifications);

export const useWebSocketStats = () =>
  useWebSocketStore((state) => state.stats);

export const useWebSocketActions = () =>
  useWebSocketStore((state) => ({
    connect: state.connect,
    disconnect: state.disconnect,
    subscribe: state.subscribe,
    unsubscribe: state.unsubscribe,
    clearNotifications: state.clearNotifications,
    removeNotification: state.removeNotification,
    setConfig: state.setConfig
  }));
