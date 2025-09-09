/**
 * WebSocket Service for +EV Feed Real-time Updates
 * 
 * Provides real-time WebSocket communication with polling fallback
 * for the positive expected value feed system.
 */

import { 
  EVOpportunity, 
  EVFeedStats, 
  EVWebSocketEvent, 
  EVWebSocketMessage 
} from '../types/ev-types';

export interface EVWebSocketConfig {
  /** WebSocket endpoint URL */
  url?: string;
  /** Reconnection attempts */
  maxReconnectAttempts?: number;
  /** Reconnection delay in ms */
  reconnectDelay?: number;
  /** Heartbeat interval in ms */
  heartbeatInterval?: number;
  /** Enable polling fallback */
  enablePollingFallback?: boolean;
  /** Polling interval in ms */
  pollingInterval?: number;
}

export interface EVUpdateHandler {
  onOpportunitiesUpdate?: (opportunities: EVOpportunity[]) => void;
  onStatsUpdate?: (stats: EVFeedStats) => void;
  onNewOpportunity?: (opportunity: EVOpportunity) => void;
  onOpportunityRemoved?: (opportunityId: string) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: Error) => void;
}

export class EVWebSocketService {
  private ws: WebSocket | null = null;
  private config: Required<EVWebSocketConfig>;
  private handlers: EVUpdateHandler = {};
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private pollingTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private isPollingMode = false;

  constructor(config: EVWebSocketConfig = {}) {
    this.config = {
      url: config.url || this.getWebSocketUrl(),
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
      reconnectDelay: config.reconnectDelay || 5000,
      heartbeatInterval: config.heartbeatInterval || 30000,
      enablePollingFallback: config.enablePollingFallback ?? true,
      pollingInterval: config.pollingInterval || 30000
    };
  }

  /**
   * Get WebSocket URL based on current location
   */
  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/ev-feed`;
  }

  /**
   * Connect to WebSocket or start polling fallback
   */
  public connect(handlers: EVUpdateHandler = {}): void {
    this.handlers = handlers;

    if (this.isWebSocketSupported()) {
      this.connectWebSocket();
    } else {
      this.startPolling();
    }
  }

  /**
   * Disconnect WebSocket and stop polling
   */
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.stopHeartbeat();
    this.stopPolling();
    this.isConnected = false;
    this.isPollingMode = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Check if WebSocket is supported
   */
  private isWebSocketSupported(): boolean {
    return typeof WebSocket !== 'undefined';
  }

  /**
   * Connect to WebSocket
   */
  private connectWebSocket(): void {
    try {
      this.ws = new WebSocket(this.config.url);
      
      this.ws.onopen = this.handleWebSocketOpen.bind(this);
      this.ws.onmessage = this.handleWebSocketMessage.bind(this);
      this.ws.onclose = this.handleWebSocketClose.bind(this);
      this.ws.onerror = this.handleWebSocketError.bind(this);

    } catch (error) {
      this.handleConnectionError(error as Error);
    }
  }

  /**
   * Handle WebSocket connection open
   */
  private handleWebSocketOpen(): void {
    this.isConnected = true;
    this.isPollingMode = false;
    this.reconnectAttempts = 0;
    
    this.startHeartbeat();
    this.stopPolling();
    
    this.handlers.onConnectionChange?.(true);
  }

  /**
   * Handle WebSocket message
   */
  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const message: EVWebSocketMessage = JSON.parse(event.data);
      this.processMessage(message);
    } catch (error) {
      this.handlers.onError?.(new Error(`Failed to parse WebSocket message: ${error}`));
    }
  }

  /**
   * Handle WebSocket connection close
   */
  private handleWebSocketClose(event: CloseEvent): void {
    this.isConnected = false;
    this.stopHeartbeat();
    
    this.handlers.onConnectionChange?.(false);

    // Attempt reconnection if not intentional close
    if (event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.attemptReconnection();
    } else if (this.config.enablePollingFallback) {
      this.startPolling();
    }
  }

  /**
   * Handle WebSocket error
   */
  private handleWebSocketError(event: Event): void {
    const error = new Error(`WebSocket error: ${event.type}`);
    this.handleConnectionError(error);
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(error: Error): void {
    this.handlers.onError?.(error);
    
    if (this.config.enablePollingFallback && !this.isPollingMode) {
      this.startPolling();
    }
  }

  /**
   * Attempt WebSocket reconnection
   */
  private attemptReconnection(): void {
    this.reconnectAttempts++;
    
    setTimeout(() => {
      if (this.reconnectAttempts <= this.config.maxReconnectAttempts) {
        this.connectWebSocket();
      } else if (this.config.enablePollingFallback) {
        this.startPolling();
      }
    }, this.config.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Start polling fallback
   */
  private startPolling(): void {
    if (this.isPollingMode) return;
    
    this.isPollingMode = true;
    this.handlers.onConnectionChange?.(false); // Indicate we're in fallback mode
    
    this.pollingTimer = setInterval(() => {
      this.pollForUpdates();
    }, this.config.pollingInterval);

    // Immediate poll
    this.pollForUpdates();
  }

  /**
   * Stop polling
   */
  private stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.isPollingMode = false;
  }

  /**
   * Poll for updates via HTTP API
   */
  private async pollForUpdates(): Promise<void> {
    try {
      // Poll opportunities
      const opportunitiesResponse = await fetch('/api/ev/feed?limit=200');
      if (opportunitiesResponse.ok) {
        const data = await opportunitiesResponse.json();
        this.handlers.onOpportunitiesUpdate?.(data.opportunities);
      }

      // Poll stats
      const statsResponse = await fetch('/api/ev/feed/stats');
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        this.handlers.onStatsUpdate?.(stats);
      }

    } catch (error) {
      this.handlers.onError?.(error as Error);
    }
  }

  /**
   * Process WebSocket message
   */
  private processMessage(message: EVWebSocketMessage): void {
    switch (message.event) {
      case EVWebSocketEvent.FEED_UPDATE:
        if (Array.isArray(message.data)) {
          this.handlers.onOpportunitiesUpdate?.(message.data as EVOpportunity[]);
        }
        break;

      case EVWebSocketEvent.NEW_OPPORTUNITY:
        this.handlers.onNewOpportunity?.(message.data as EVOpportunity);
        break;

      case EVWebSocketEvent.OPPORTUNITY_REMOVED:
        if (typeof message.data === 'string') {
          this.handlers.onOpportunityRemoved?.(message.data);
        }
        break;

      case EVWebSocketEvent.STATS_UPDATE:
        this.handlers.onStatsUpdate?.(message.data as EVFeedStats);
        break;

      default:
        // Handle unknown message types gracefully
        break;
    }
  }

  /**
   * Send message via WebSocket
   */
  public sendMessage(event: EVWebSocketEvent, data: EVOpportunity | EVOpportunity[] | EVFeedStats | Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: EVWebSocketMessage = {
        event,
        data,
        timestamp: new Date().toISOString()
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): {
    connected: boolean;
    pollingMode: boolean;
    reconnectAttempts: number;
  } {
    return {
      connected: this.isConnected,
      pollingMode: this.isPollingMode,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Force refresh of data
   */
  public forceRefresh(): void {
    if (this.isPollingMode) {
      this.pollForUpdates();
    } else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendMessage(EVWebSocketEvent.FEED_UPDATE, { force: true });
    }
  }
}

// Singleton instance for global use
export const evWebSocketService = new EVWebSocketService();