import { ErrorHandler } from '../../unified/ErrorHandler';
import { BaseService } from './BaseService';

export enum WebSocketConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

/**
 * Enum for WebSocket connection states.
 */
interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  id?: string;
}

/**
 * Interface for WebSocket messages.
 */
interface SubscriptionHandler {
  id: string;
  type: string;
  callback: (data: any) => void;
}

/**
 * Interface for subscription handlers.
 */
export class UnifiedWebSocketService extends BaseService {
  private static instance: UnifiedWebSocketService;
  private ws: WebSocket | null = null;
  private connectionState: WebSocketConnectionState = WebSocketConnectionState.DISCONNECTED;
  private subscriptions: Map<string, SubscriptionHandler> = new Map();

  /**
   * Singleton WebSocket service for unified real-time communication.
   * Handles connection, reconnection, subscriptions, and message queueing.
   */
  private messageQueue: WebSocketMessage[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private subscriptionCounter = 0;

  protected constructor() {
    // Pass a dummy object for serviceRegistry since it's not used
    super('UnifiedWebSocketService', {} as any);
  }

  static getInstance(): UnifiedWebSocketService {
    if (!UnifiedWebSocketService.instance) {
      UnifiedWebSocketService.instance = new UnifiedWebSocketService();
    }
    return UnifiedWebSocketService.instance;
  }

  async connect(url?: string): Promise<void> {
    const _wsUrl = url || this.getWebSocketUrl();

    if (this.connectionState === WebSocketConnectionState.CONNECTED) {
      this.logger.info('WebSocket already connected');
      return;
    }

    // Don't create new connection if one already exists and is connecting/open
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)
    ) {
      this.logger.info('WebSocket connection already in progress or connected');
      return;
    }

    this.setConnectionState(WebSocketConnectionState.CONNECTING);

    return new Promise((resolve, reject) => {
      try {
        // Clean up any existing connection first
        if (this.ws) {
          try {
            this.ws.close();
          } catch (e) {
            // Ignore close errors
          }
        }

        this.ws = new WebSocket(_wsUrl);

        this.ws.onopen = () => {
          this.setConnectionState(WebSocketConnectionState.CONNECTED);
          this.reconnectAttempts = 0;
          this.processMessageQueue();
          this.logger.info('WebSocket connected', { url: _wsUrl });
          resolve();
        };

        this.ws.onmessage = event => {
          this.handleMessage(event);
        };

        this.ws.onclose = event => {
          this.setConnectionState(WebSocketConnectionState.DISCONNECTED);
          this.logger.warn('WebSocket disconnected', {
            code: event.code,
            reason: event.reason,
          });

          if (event.code !== 1000) {
            // Not a normal closure
            this.attemptReconnect();
          }
        };

        this.ws.onerror = error => {
          this.setConnectionState(WebSocketConnectionState.ERROR);
          this.logger.error('WebSocket error', error);

          // Use enhanced error handling for WebSocket errors
          try {
            const _errorHandler = ErrorHandler.getInstance();
            _errorHandler.handleWebSocketError(
              new Error('WebSocket connection failed'),
              'connection'
            );
          } catch (e) {
            // Fallback if ErrorHandler is not available
            console.warn('WebSocket connection failed:', error);
          }

          reject(new Error('WebSocket connection failed'));
        };

        // Timeout for connection
        setTimeout(() => {
          if (this.connectionState === WebSocketConnectionState.CONNECTING) {
            try {
              if (
                this.ws &&
                (this.ws.readyState === WebSocket.CONNECTING ||
                  this.ws.readyState === WebSocket.OPEN)
              ) {
                this.ws.close();
              }
            } catch (closeError) {
              // Ignore errors when closing on timeout
              this.logger.warn('Error closing WebSocket on timeout:', closeError);
            }

            // Use enhanced error handling for timeout
            try {
              const _errorHandler = ErrorHandler.getInstance();
              _errorHandler.handleWebSocketError(
                new Error('WebSocket connection timeout'),
                'timeout'
              );
            } catch (e) {
              // Fallback if ErrorHandler is not available
              console.warn('WebSocket connection timeout');
            }

            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);
      } catch (error) {
        this.setConnectionState(WebSocketConnectionState.ERROR);
        this.logger.error('Failed to create WebSocket connection', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      // Check WebSocket state before closing
      const _readyState = this.ws.readyState;

      if (_readyState === WebSocket.OPEN || _readyState === WebSocket.CONNECTING) {
        try {
          this.ws.close(1000, 'Client disconnect');
        } catch (error) {
          // Ignore errors when closing WebSocket - it might already be closed
          this.logger.warn('WebSocket close warning:', error);
        }
      }

      this.ws = null;
    }
    this.setConnectionState(WebSocketConnectionState.DISCONNECTED);
    this.subscriptions.clear();
    this.messageQueue = [];
    this.logger.info('WebSocket disconnected by client');
  }

  subscribe(messageType: string, callback: (data: any) => void): string {
    const _subscriptionId = `sub_${++this.subscriptionCounter}_${Date.now()}`;

    this.subscriptions.set(_subscriptionId, {
      id: _subscriptionId,
      type: messageType,
      callback,
    });

    // Send subscription message if connected
    if (this.connectionState === WebSocketConnectionState.CONNECTED) {
      this.sendMessage({
        type: 'subscribe',
        data: { messageType },
        timestamp: Date.now(),
        id: _subscriptionId,
      });
    }

    this.logger.debug('WebSocket subscription added', {
      subscriptionId: _subscriptionId,
      messageType,
    });

    return _subscriptionId;
  }

  unsubscribe(subscriptionId: string): void {
    const _subscription = this.subscriptions.get(subscriptionId);
    if (!_subscription) {
      this.logger.warn('Attempted to unsubscribe from non-existent subscription', {
        subscriptionId,
      });
      return;
    }

    this.subscriptions.delete(subscriptionId);

    // Send unsubscribe message if connected
    if (this.connectionState === WebSocketConnectionState.CONNECTED && _subscription) {
      this.sendMessage({
        type: 'unsubscribe',
        data: { messageType: _subscription.type },
        timestamp: Date.now(),
        id: subscriptionId,
      });
    }

    this.logger.debug('WebSocket subscription removed', {
      subscriptionId,
      messageType: _subscription ? _subscription.type : undefined,
    });
  }

  sendMessage(message: WebSocketMessage): void {
    if (this.connectionState === WebSocketConnectionState.CONNECTED && this.ws) {
      try {
        this.ws.send(JSON.stringify(message));
        this.logger.debug('WebSocket message sent', { type: message.type });
      } catch (error) {
        this.logger.error('Failed to send WebSocket message', error);
        this.messageQueue.push(message);
      }
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message);
      this.logger.debug('WebSocket message queued', { type: message.type });
    }
  }

  getConnectionState(): WebSocketConnectionState {
    return this.connectionState;
  }

  isConnected(): boolean {
    return this.connectionState === WebSocketConnectionState.CONNECTED;
  }

  private setConnectionState(state: WebSocketConnectionState): void {
    const _oldState = this.connectionState;
    this.connectionState = state;

    if (oldState !== state) {
      this.emit('connectionStateChanged', { oldState, newState: state });
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const _message: WebSocketMessage = JSON.parse(event.data);

      this.logger.debug('WebSocket message received', { type: message.type });

      // Notify specific subscribers
      for (const _subscription of this.subscriptions.values()) {
        if (subscription.type === message.type || subscription.type === '*') {
          try {
            subscription.callback(message.data);
          } catch (error) {
            this.logger.error('WebSocket subscription callback error', {
              subscriptionId: subscription.id,
              error,
            });
          }
        }
      }

      // Emit generic event
      this.emit(message.type, message.data);
      this.emit('message', message);
    } catch (error) {
      this.logger.error('Failed to parse WebSocket message', error);
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const _message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Max reconnection attempts reached');
      this.setConnectionState(WebSocketConnectionState.ERROR);
      return;
    }

    this.setConnectionState(WebSocketConnectionState.RECONNECTING);
    this.reconnectAttempts++;

    const _delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    this.logger.info('Attempting WebSocket reconnection', {
      attempt: this.reconnectAttempts,
      delay,
    });

    setTimeout(() => {
      this.connect().catch(error => {
        this.logger.error('Reconnection attempt failed', error);
        this.attemptReconnect();
      });
    }, delay);
  }

  private getWebSocketUrl(): string {
    // Always use backend port, never frontend's own port
    // Build WebSocket URL from environment variables for best practice
    const _host = import.meta.env.VITE_API_HOST || 'localhost';
    const _port = import.meta.env.VITE_API_PORT || '8000';
    return import.meta.env.VITE_WS_URL || `ws://${host}:${port}/ws`;
  }

  // Utility methods for common message types
  subscribeToOddsUpdates(callback: (data: any) => void): string {
    return this.subscribe('odds_update', callback);
  }

  subscribeToBettingOpportunities(callback: (data: any) => void): string {
    return this.subscribe('betting_opportunities', callback);
  }

  subscribeToGameUpdates(callback: (data: any) => void): string {
    return this.subscribe('game_update', callback);
  }

  subscribeToPlayerUpdates(callback: (data: any) => void): string {
    return this.subscribe('player_update', callback);
  }
}

export default UnifiedWebSocketService;
