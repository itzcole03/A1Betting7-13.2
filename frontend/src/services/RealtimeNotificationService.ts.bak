/**
 * Frontend Real-time Notification Service
 * Manages WebSocket connections for live betting notifications
 */

import { ConsolidatedCacheManager } from './ConsolidatedCacheManager';

export enum NotificationType {
  ODDS_CHANGE = 'odds_change',
  ARBITRAGE_OPPORTUNITY = 'arbitrage_opportunity',
  PREDICTION_UPDATE = 'prediction_update',
  GAME_STATUS_UPDATE = 'game_status_update',
  INJURY_UPDATE = 'injury_update',
  LINE_MOVEMENT = 'line_movement',
  SYSTEM_ALERT = 'system_alert',
  PORTFOLIO_ALERT = 'portfolio_alert',
  BANKROLL_ALERT = 'bankroll_alert',
  HIGH_VALUE_BET = 'high_value_bet'
}

export enum NotificationPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

export interface NotificationMessage {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data: Record<string, any>;
  user_id?: string;
  timestamp: string;
  expires_at?: string;
  tags: string[];
}

export interface SubscriptionFilter {
  notification_types: NotificationType[];
  min_priority: NotificationPriority;
  tags?: string[];
  sports?: string[];
  players?: string[];
}

export interface ConnectionStats {
  connected_at: string;
  message_count: number;
  user_id?: string;
  filter_count: number;
}

export interface ServiceStats {
  total_notifications: number;
  total_connections: number;
  notifications_sent: number;
  failed_sends: number;
  active_connections: number;
  queue_size: number;
  connection_details: Record<string, ConnectionStats>;
}

export type NotificationHandler = (notification: NotificationMessage) => void;
export type ConnectionHandler = (connected: boolean) => void;
export type ErrorHandler = (error: Error) => void;

export class RealtimeNotificationService {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: NodeJS.Timeout | null = null;
  private baseUrl: string;
  private authToken?: string;
  
  // Event handlers
  private notificationHandlers: Map<NotificationType, NotificationHandler[]> = new Map();
  private globalNotificationHandlers: NotificationHandler[] = [];
  private connectionHandlers: ConnectionHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  
  // Subscription management
  private subscriptionFilters: SubscriptionFilter[] = [];
  private pendingSubscriptions: SubscriptionFilter[] = [];
  
  // Statistics and caching
  private messageCount = 0;
  private lastConnectionTime?: Date;
  private cache: ConsolidatedCacheManager;
  
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || this.getWebSocketUrl();
    this.cache = new ConsolidatedCacheManager();
    
    // Initialize cache for notifications
    this.cache.initializeCache('notifications', {
      maxSize: 1000,
      ttl: 3600000 // 1 hour
    });
  }
  
  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/api/ws`;
  }
  
  // Connection management
  async connect(authToken?: string, filters?: SubscriptionFilter[]): Promise<void> {
    if (this.isConnected) {
      console.warn('Already connected to notification service');
      return;
    }
    
    this.authToken = authToken;
    if (filters) {
      this.subscriptionFilters = filters;
    }
    
    return new Promise((resolve, reject) => {
      try {
        const url = this.buildWebSocketUrl();
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
          console.log('Connected to real-time notifications');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.lastConnectionTime = new Date();
          
          // Start ping interval
          this.startPingInterval();
          
          // Send pending subscription updates
          this.sendPendingSubscriptions();
          
          // Notify connection handlers
          this.connectionHandlers.forEach(handler => handler(true));
          
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
        
        this.ws.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason);
          this.handleDisconnection();
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          const err = new Error('WebSocket connection error');
          this.errorHandlers.forEach(handler => handler(err));
          reject(err);
        };
        
      } catch (error) {
        const err = error as Error;
        this.errorHandlers.forEach(handler => handler(err));
        reject(err);
      }
    });
  }
  
  private buildWebSocketUrl(): string {
    const params = new URLSearchParams();
    
    if (this.authToken) {
      params.append('token', this.authToken);
    }
    
    if (this.subscriptionFilters.length > 0) {
      // Combine all notification types from filters
      const allTypes = new Set<string>();
      let minPriority = NotificationPriority.LOW;
      const allSports = new Set<string>();
      const allPlayers = new Set<string>();
      
      this.subscriptionFilters.forEach(filter => {
        filter.notification_types.forEach(type => allTypes.add(type));
        if (filter.min_priority > minPriority) {
          minPriority = filter.min_priority;
        }
        filter.sports?.forEach(sport => allSports.add(sport));
        filter.players?.forEach(player => allPlayers.add(player));
      });
      
      if (allTypes.size > 0) {
        params.append('notification_types', Array.from(allTypes).join(','));
      }
      
      params.append('min_priority', minPriority.toString());
      
      if (allSports.size > 0) {
        params.append('sports', Array.from(allSports).join(','));
      }
      
      if (allPlayers.size > 0) {
        params.append('players', Array.from(allPlayers).join(','));
      }
    }
    
    const queryString = params.toString();
    return `${this.baseUrl}/notifications${queryString ? `?${queryString}` : ''}`;
  }
  
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
    this.cleanup();
  }
  
  private cleanup(): void {
    this.isConnected = false;
    this.ws = null;
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    // Notify connection handlers
    this.connectionHandlers.forEach(handler => handler(false));
  }
  
  private handleDisconnection(): void {
    this.cleanup();
    
    // Attempt reconnection with exponential backoff
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect(this.authToken, this.subscriptionFilters).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      const error = new Error('Failed to reconnect to notification service');
      this.errorHandlers.forEach(handler => handler(error));
    }
  }
  
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.ws) {
        this.send({
          type: 'ping',
          timestamp: new Date().toISOString()
        });
      }
    }, 30000); // Ping every 30 seconds
  }
  
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      this.messageCount++;
      
      // Handle different message types
      switch (message.type) {
        case 'ping':
          // Respond to server ping
          this.send({
            type: 'pong',
            timestamp: message.timestamp
          });
          break;
          
        case 'pong':
          // Server responded to our ping
          break;
          
        case 'error':
          console.error('Server error:', message.message);
          const error = new Error(message.message);
          this.errorHandlers.forEach(handler => handler(error));
          break;
          
        case 'subscription_updated':
          console.log('Subscription updated:', message.message);
          break;
          
        case 'stats':
          console.log('Service stats:', message);
          break;
          
        default:
          // Handle notification message
          if (this.isNotificationMessage(message)) {
            this.handleNotification(message);
          }
          break;
      }
      
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }
  
  private isNotificationMessage(message: any): message is NotificationMessage {
    return message.id && message.type && message.title && message.message;
  }
  
  private handleNotification(notification: NotificationMessage): void {
    // Cache notification
    this.cache.set('notifications', notification.id, notification);
    
    // Call type-specific handlers
    const typeHandlers = this.notificationHandlers.get(notification.type) || [];
    typeHandlers.forEach(handler => {
      try {
        handler(notification);
      } catch (error) {
        console.error('Error in notification handler:', error);
      }
    });
    
    // Call global handlers
    this.globalNotificationHandlers.forEach(handler => {
      try {
        handler(notification);
      } catch (error) {
        console.error('Error in global notification handler:', error);
      }
    });
  }
  
  private send(message: any): void {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: not connected');
    }
  }
  
  private sendPendingSubscriptions(): void {
    this.pendingSubscriptions.forEach(filter => {
      this.send({
        type: 'subscribe',
        filters: filter
      });
    });
    this.pendingSubscriptions = [];
  }
  
  // Subscription management
  subscribe(filter: SubscriptionFilter): void {
    this.subscriptionFilters.push(filter);
    
    if (this.isConnected) {
      this.send({
        type: 'subscribe',
        filters: filter
      });
    } else {
      this.pendingSubscriptions.push(filter);
    }
  }
  
  unsubscribe(notificationTypes: NotificationType[]): void {
    // Remove from local filters
    this.subscriptionFilters = this.subscriptionFilters.filter(filter =>
      !filter.notification_types.some(type => notificationTypes.includes(type))
    );
    
    if (this.isConnected) {
      this.send({
        type: 'unsubscribe',
        filter_types: notificationTypes
      });
    }
  }
  
  // Event handlers
  onNotification(type: NotificationType, handler: NotificationHandler): () => void {
    if (!this.notificationHandlers.has(type)) {
      this.notificationHandlers.set(type, []);
    }
    this.notificationHandlers.get(type)!.push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.notificationHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }
  
  onAnyNotification(handler: NotificationHandler): () => void {
    this.globalNotificationHandlers.push(handler);
    
    return () => {
      const index = this.globalNotificationHandlers.indexOf(handler);
      if (index > -1) {
        this.globalNotificationHandlers.splice(index, 1);
      }
    };
  }
  
  onConnection(handler: ConnectionHandler): () => void {
    this.connectionHandlers.push(handler);
    
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }
  
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.push(handler);
    
    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) {
        this.errorHandlers.splice(index, 1);
      }
    };
  }
  
  // Utility methods
  getConnectionStats(): ConnectionStats | null {
    if (!this.lastConnectionTime) return null;
    
    return {
      connected_at: this.lastConnectionTime.toISOString(),
      message_count: this.messageCount,
      user_id: undefined, // Set by server
      filter_count: this.subscriptionFilters.length
    };
  }
  
  isConnectedStatus(): boolean {
    return this.isConnected;
  }
  
  getRecentNotifications(limit = 50): NotificationMessage[] {
    const notifications = this.cache.getAll('notifications');
    return Object.values(notifications)
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
  
  clearNotifications(): void {
    this.cache.clear('notifications');
  }
  
  // Request service stats from server
  requestStats(): void {
    this.send({ type: 'get_stats' });
  }
}

// Specialized services for different notification types
export class OddsNotificationService {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private baseUrl: string;
  
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || this.getWebSocketUrl();
  }
  
  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/api/ws`;
  }
  
  async connect(sport?: string, sportsbook?: string, player?: string): Promise<void> {
    const params = new URLSearchParams();
    if (sport) params.append('sport', sport);
    if (sportsbook) params.append('sportsbook', sportsbook);
    if (player) params.append('player', player);
    
    const url = `${this.baseUrl}/odds${params.toString() ? `?${params.toString()}` : ''}`;
    
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        this.isConnected = true;
        resolve();
      };
      
      this.ws.onerror = reject;
    });
  }
  
  onOddsUpdate(handler: (data: any) => void): void {
    if (this.ws) {
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type !== 'odds_subscription_confirmed') {
            handler(data);
          }
        } catch (error) {
          console.error('Failed to parse odds update:', error);
        }
      };
    }
  }
  
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }
}

export class ArbitrageNotificationService {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private baseUrl: string;
  
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || this.getWebSocketUrl();
  }
  
  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/api/ws`;
  }
  
  async connect(minProfit = 2.0, sport?: string): Promise<void> {
    const params = new URLSearchParams();
    params.append('min_profit', minProfit.toString());
    if (sport) params.append('sport', sport);
    
    const url = `${this.baseUrl}/arbitrage?${params.toString()}`;
    
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        this.isConnected = true;
        resolve();
      };
      
      this.ws.onerror = reject;
    });
  }
  
  onArbitrageOpportunity(handler: (data: any) => void): void {
    if (this.ws) {
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'arbitrage_opportunity') {
            handler(data);
          }
        } catch (error) {
          console.error('Failed to parse arbitrage opportunity:', error);
        }
      };
    }
  }
  
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }
}

// Global service instance
export const realtimeNotificationService = new RealtimeNotificationService();
