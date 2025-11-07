/**
 * Enhanced WebSocket Manager v2.0
 * 
 * Integrates message envelope protocol, enhanced backoff strategies,
 * local simulation mode, and state reconciliation for robust
 * WebSocket connectivity with comprehensive error handling.
 */

import { 
  WSMessageEnvelope,
  WSConnectionState,
  WSConnectionHealth,
  WSBackoffReason,
  WS_MESSAGE_TYPES,
  WS_PROTOCOL_VERSION,
  WSHelloPayload,
  WSHeartbeatPayload,
  WSSnapshotResponsePayload,
  WSSimulationConfig,
  DEFAULT_SIMULATION_CONFIG
} from './protocol-types';

import { EnhancedBackoffStrategy } from './EnhancedBackoffStrategy';
import { WSLocalSimulator } from './LocalSimulator';
import { StateReconciliationManager } from './StateReconciliation';

export interface EnhancedWSConfig {
  /** WebSocket server URL */
  url: string;
  /** Unique client identifier */
  clientId: string;
  /** Connection timeout in milliseconds */
  connectionTimeoutMs: number;
  /** Enable automatic reconnection */
  autoReconnect: boolean;
  /** Enable heartbeat monitoring */
  enableHeartbeat: boolean;
  /** Client role */
  role: string;
  /** Protocol version */
  version: string;
  /** Simulation configuration */
  simulation: WSSimulationConfig;
  /** Enable state reconciliation */
  enableStateReconciliation: boolean;
  /** Debug mode */
  debug: boolean;
}

const DEFAULT_CONFIG: EnhancedWSConfig = {
  url: 'ws://localhost:8000',
  clientId: `client_${Math.random().toString(36).substr(2, 9)}`,
  connectionTimeoutMs: 30000,
  autoReconnect: true,
  enableHeartbeat: true,
  role: 'frontend',
  version: '2',
  simulation: DEFAULT_SIMULATION_CONFIG,
  enableStateReconciliation: true,
  debug: false
};

export class EnhancedWebSocketManager {
  private config: EnhancedWSConfig;
  private ws: WebSocket | null = null;
  private state: WSConnectionState = WSConnectionState.IDLE;
  private backoffStrategy: EnhancedBackoffStrategy;
  private simulator: WSLocalSimulator;
  private reconciliation: StateReconciliationManager;
  private connectionTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastHeartbeatTime: number = 0;
  private heartbeatSequence: number = 0;
  private connectionHealth: WSConnectionHealth;
  
  // Event listeners
  private messageListeners: Set<(message: WSMessageEnvelope) => void> = new Set();
  private stateChangeListeners: Set<(state: WSConnectionState) => void> = new Set();
  private errorListeners: Set<(error: Error, context: string) => void> = new Set();

  // Message correlation tracking
  private pendingRequests: Map<string, {
    timestamp: number;
    type: string;
    resolve: (response: WSMessageEnvelope) => void;
    reject: (error: Error) => void;
  }> = new Map();

  constructor(config: Partial<EnhancedWSConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.backoffStrategy = EnhancedBackoffStrategy.createProductionStrategy();
    this.simulator = new WSLocalSimulator(this.config.simulation);
    this.reconciliation = new StateReconciliationManager(
      {},
      (message) => this.sendMessage(message),
      (category, data) => this.handleStateUpdate(category, data)
    );
    this.connectionHealth = this.createInitialHealth();

    // Set up simulation message listener
    this.simulator.addMessageListener((message) => {
      this.notifyMessageListeners(message);
    });
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.state === WSConnectionState.CONNECTING || this.state === WSConnectionState.READY) {
      return;
    }

    await this.attemptConnection();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.setState(WSConnectionState.DISCONNECTED);
    this.cleanup();
  }

  /**
   * Send message with correlation tracking
   */
  async sendMessage<TRequest, TResponse>(
    message: Omit<WSMessageEnvelope<TRequest>, 'ts' | 'correlationId' | 'version'>
  ): Promise<WSMessageEnvelope<TResponse> | null> {
    const envelope: WSMessageEnvelope<TRequest> = {
      ...message,
      ts: Date.now(),
      correlationId: this.generateCorrelationId(),
      version: WS_PROTOCOL_VERSION
    };

    if (this.state === WSConnectionState.SIMULATION_MODE) {
      // In simulation mode, don't send actual message
      this.debug('Message queued for simulation mode:', envelope.type);
      return null;
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    // Send message
    this.ws.send(JSON.stringify(envelope));
    this.connectionHealth.lastActivity = Date.now();

    // Track for correlation if expecting response
    if (this.isRequestMessage(envelope.type)) {
      return new Promise<WSMessageEnvelope<TResponse>>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.pendingRequests.delete(envelope.correlationId);
          reject(new Error(`Request timeout: ${envelope.type}`));
        }, 30000);

        this.pendingRequests.set(envelope.correlationId, {
          timestamp: Date.now(),
          type: envelope.type,
          resolve: (response) => {
            clearTimeout(timeout);
            resolve(response as WSMessageEnvelope<TResponse>);
          },
          reject: (error) => {
            clearTimeout(timeout);
            reject(error);
          }
        });
      });
    }

    return null;
  }

  /**
   * Subscribe to real-time messages
   */
  onMessage(listener: (message: WSMessageEnvelope) => void): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(listener: (state: WSConnectionState) => void): () => void {
    this.stateChangeListeners.add(listener);
    return () => this.stateChangeListeners.delete(listener);
  }

  /**
   * Subscribe to errors
   */
  onError(listener: (error: Error, context: string) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  /**
   * Get current connection state
   */
  getState(): WSConnectionState {
    return this.state;
  }

  /**
   * Get connection health metrics
   */
  getHealth(): WSConnectionHealth {
    return {
      ...this.connectionHealth,
      stateTime: Date.now() - this.connectionHealth.lastActivity
    };
  }

  /**
   * Get comprehensive statistics
   */
  getStats(): {
    connection: WSConnectionHealth;
    backoff: string;
    simulation: ReturnType<WSLocalSimulator['getStats']>;
    reconciliation: ReturnType<StateReconciliationManager['getStats']>;
  } {
    return {
      connection: this.getHealth(),
      backoff: this.backoffStrategy.getDescription(),
      simulation: this.simulator.getStats(),
      reconciliation: this.reconciliation.getStats()
    };
  }

  /**
   * Force state reconciliation
   */
  async forceReconciliation(): Promise<void> {
    if (this.state === WSConnectionState.READY && this.config.enableStateReconciliation) {
      await this.reconciliation.forceReconciliation();
    }
  }

  /**
   * Enable/disable simulation mode
   */
  setSimulationMode(enabled: boolean): void {
    if (enabled && !this.simulator.isSimulationActive()) {
      this.simulator.start();
      if (this.state !== WSConnectionState.READY) {
        this.setState(WSConnectionState.SIMULATION_MODE);
      }
    } else if (!enabled && this.simulator.isSimulationActive()) {
      this.simulator.stop();
      if (this.state === WSConnectionState.SIMULATION_MODE) {
        this.setState(WSConnectionState.IDLE);
      }
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.disconnect();
    this.simulator.stop();
    this.reconciliation.destroy();
    this.clearAllListeners();
  }

  /**
   * Attempt WebSocket connection
   */
  private async attemptConnection(): Promise<void> {
    this.setState(WSConnectionState.CONNECTING);

    try {
      const url = this.buildWebSocketUrl();
      this.debug('Connecting to:', url);

      this.ws = new WebSocket(url);
      this.setupWebSocketEventHandlers();

      // Set connection timeout
      this.connectionTimer = setTimeout(() => {
        this.handleConnectionTimeout();
      }, this.config.connectionTimeoutMs);

    } catch (error) {
      this.handleConnectionError(error as Error, WSBackoffReason.NETWORK_ERROR);
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => this.handleOpen();
    this.ws.onmessage = (event) => this.handleMessage(event);
    this.ws.onclose = (event) => this.handleClose(event);
    this.ws.onerror = (event) => this.handleError(event);
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    this.debug('WebSocket connected');
    this.clearConnectionTimer();
    this.setState(WSConnectionState.HELLO);
    this.backoffStrategy.reset();
    
    // Wait for server hello message
    setTimeout(() => {
      if (this.state === WSConnectionState.HELLO) {
        this.handleConnectionError(new Error('Hello timeout'), WSBackoffReason.PROTOCOL_ERROR);
      }
    }, 5000);
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const envelope: WSMessageEnvelope = JSON.parse(event.data);
      this.validateMessageEnvelope(envelope);
      
      this.connectionHealth.lastActivity = Date.now();
      this.updateConnectionHealth(envelope);

      // Handle system messages
      if (this.handleSystemMessage(envelope)) {
        return;
      }

      // Handle pending request responses
      if (this.handlePendingResponse(envelope)) {
        return;
      }

      // Handle state reconciliation messages
      if (envelope.type === WS_MESSAGE_TYPES.SNAPSHOT_RESPONSE) {
        this.reconciliation.handleSnapshotResponse(envelope as WSMessageEnvelope<WSSnapshotResponsePayload>);
        return;
      }

      // Notify message listeners
      this.notifyMessageListeners(envelope);

    } catch (error) {
      this.debug('Failed to handle message:', error);
      this.notifyErrorListeners(error as Error, 'message_handling');
    }
  }

  /**
   * Handle system messages
   */
  private handleSystemMessage(envelope: WSMessageEnvelope): boolean {
    switch (envelope.type) {
      case WS_MESSAGE_TYPES.HELLO:
        this.handleHelloMessage(envelope.payload as WSHelloPayload);
        return true;

      case WS_MESSAGE_TYPES.PING:
        this.handlePingMessage(envelope.payload as WSHeartbeatPayload);
        return true;

      case WS_MESSAGE_TYPES.PONG:
        this.handlePongMessage(envelope.payload as WSHeartbeatPayload);
        return true;

      case WS_MESSAGE_TYPES.ERROR:
        this.handleServerError(envelope.payload);
        return true;

      default:
        return false;
    }
  }

  /**
   * Handle hello message from server
   */
  private handleHelloMessage(payload: WSHelloPayload): void {
    this.debug('Received hello message:', payload);
    this.setState(WSConnectionState.READY);
    
    // Start heartbeat if enabled
    if (this.config.enableHeartbeat && payload.heartbeatIntervalMs) {
      this.startHeartbeat(payload.heartbeatIntervalMs);
    }

    // Start state reconciliation if enabled
    if (this.config.enableStateReconciliation) {
      this.reconciliation.startReconciliation().catch((error) => {
        this.debug('Reconciliation failed:', error);
      });
    }

    // Stop simulation mode if active
    if (this.simulator.isSimulationActive()) {
      this.simulator.stop();
    }
  }

  /**
   * Handle ping message and send pong response
   */
  private handlePingMessage(payload: WSHeartbeatPayload): void {
    this.sendMessage({
      type: WS_MESSAGE_TYPES.PONG,
      payload: {
        sequenceNumber: payload.sequenceNumber,
        timestamp: Date.now(),
        clientId: this.config.clientId
      }
    }).catch((error) => {
      this.debug('Failed to send pong:', error);
    });
  }

  /**
   * Handle pong response
   */
  private handlePongMessage(payload: WSHeartbeatPayload): void {
    const roundTripTime = Date.now() - payload.timestamp;
    this.connectionHealth.latencyMs = roundTripTime;
    this.debug('Received pong, RTT:', roundTripTime + 'ms');
  }

  /**
   * Handle server error message
   */
  private handleServerError(payload: unknown): void {
    const error = new Error(`Server error: ${JSON.stringify(payload)}`);
    this.notifyErrorListeners(error, 'server_error');
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this.debug('WebSocket closed:', event.code, event.reason);
    this.cleanup();

    if (this.config.autoReconnect && this.state !== WSConnectionState.DISCONNECTED) {
      this.scheduleReconnection(this.classifyCloseReason(event));
    } else {
      this.setState(WSConnectionState.DISCONNECTED);
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    const error = new Error(`WebSocket error: ${event.type}`);
    this.handleConnectionError(error, WSBackoffReason.NETWORK_ERROR);
  }

  /**
   * Schedule reconnection with backoff
   */
  private scheduleReconnection(reason: WSBackoffReason): void {
    const delay = this.backoffStrategy.getNextDelay(reason);
    
    if (delay < 0) {
      // Max attempts reached, enter simulation mode
      this.debug('Max reconnection attempts reached, entering simulation mode');
      this.setState(WSConnectionState.SIMULATION_MODE);
      this.setSimulationMode(true);
      return;
    }

    this.debug(`Reconnecting in ${delay}ms due to ${reason}`);
    this.setState(WSConnectionState.RECONNECTING);

    setTimeout(() => {
      if (this.state === WSConnectionState.RECONNECTING) {
        this.attemptConnection();
      }
    }, delay);
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(error: Error, reason: WSBackoffReason): void {
    this.debug('Connection error:', error.message, reason);
    this.notifyErrorListeners(error, 'connection');
    
    this.setState(WSConnectionState.FAILED);
    this.cleanup();

    if (this.config.autoReconnect) {
      this.scheduleReconnection(reason);
    }
  }

  /**
   * Handle connection timeout
   */
  private handleConnectionTimeout(): void {
    this.debug('Connection timeout');
    this.handleConnectionError(new Error('Connection timeout'), WSBackoffReason.TIMEOUT);
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(intervalMs: number): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, intervalMs);
  }

  /**
   * Stop heartbeat mechanism
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Send heartbeat ping
   */
  private sendHeartbeat(): void {
    this.sendMessage({
      type: WS_MESSAGE_TYPES.PING,
      payload: {
        sequenceNumber: ++this.heartbeatSequence,
        timestamp: Date.now()
      }
    }).catch((error) => {
      this.debug('Failed to send heartbeat:', error);
    });
  }

  /**
   * Set connection state and notify listeners
   */
  private setState(newState: WSConnectionState): void {
    if (this.state !== newState) {
      this.debug('State change:', this.state, '->', newState);
      this.state = newState;
      this.connectionHealth.state = newState;
      this.notifyStateChangeListeners(newState);
    }
  }

  /**
   * Cleanup connection resources
   */
  private cleanup(): void {
    this.clearConnectionTimer();
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      
      this.ws = null;
    }
  }

  /**
   * Clear connection timer
   */
  private clearConnectionTimer(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  /**
   * Clear all event listeners
   */
  private clearAllListeners(): void {
    this.messageListeners.clear();
    this.stateChangeListeners.clear();
    this.errorListeners.clear();
  }

  /**
   * Build WebSocket URL with query parameters
   */
  private buildWebSocketUrl(): string {
    const url = new URL('/ws/client', this.config.url);
    url.searchParams.set('client_id', this.config.clientId);
    url.searchParams.set('version', this.config.version);
    url.searchParams.set('role', this.config.role);
    return url.toString();
  }

  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `${this.config.clientId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate message envelope
   */
  private validateMessageEnvelope(envelope: WSMessageEnvelope): void {
    if (!envelope.type || !envelope.ts || !envelope.correlationId || !envelope.version) {
      throw new Error('Invalid message envelope format');
    }
  }

  /**
   * Check if message type expects a response
   */
  private isRequestMessage(type: string): boolean {
    const requestTypes: string[] = [
      WS_MESSAGE_TYPES.SNAPSHOT_REQUEST,
      WS_MESSAGE_TYPES.PING
    ];
    return requestTypes.includes(type);
  }

  /**
   * Handle pending response
   */
  private handlePendingResponse(envelope: WSMessageEnvelope): boolean {
    const pending = this.pendingRequests.get(envelope.correlationId);
    if (pending) {
      this.pendingRequests.delete(envelope.correlationId);
      pending.resolve(envelope);
      return true;
    }
    return false;
  }

  /**
   * Classify close reason for backoff strategy
   */
  private classifyCloseReason(event: CloseEvent): WSBackoffReason {
    switch (event.code) {
      case 1000: // Normal closure
        return WSBackoffReason.UNKNOWN;
      case 1001: // Going away
      case 1006: // Abnormal closure
        return WSBackoffReason.NETWORK_ERROR;
      case 4400: // Unsupported version
      case 4401: // Invalid role
        return WSBackoffReason.PROTOCOL_ERROR;
      case 4500: // Server handshake error
        return WSBackoffReason.SERVER_ERROR;
      default:
        return WSBackoffReason.UNKNOWN;
    }
  }

  /**
   * Update connection health metrics
   */
  private updateConnectionHealth(_envelope: WSMessageEnvelope): void {
    // Update success rate (simple moving average)
    this.connectionHealth.successRate = this.connectionHealth.successRate * 0.95 + 0.05;
    
    // Track reconnection attempts
    if (this.state === WSConnectionState.RECONNECTING) {
      this.connectionHealth.reconnectAttempts++;
    }
  }

  /**
   * Handle state update from reconciliation
   */
  private handleStateUpdate(category: string, data: unknown[]): void {
    this.debug(`State updated for ${category}:`, data.length, 'items');
    
    // Notify listeners about state update
    this.notifyMessageListeners({
      type: 'state_update',
      ts: Date.now(),
      correlationId: this.generateCorrelationId(),
      payload: { category, data },
      version: WS_PROTOCOL_VERSION
    });
  }

  /**
   * Create initial connection health
   */
  private createInitialHealth(): WSConnectionHealth {
    return {
      state: WSConnectionState.IDLE,
      lastActivity: Date.now(),
      latencyMs: 0,
      successRate: 1.0,
      reconnectAttempts: 0,
      stateTime: 0
    };
  }

  /**
   * Notify message listeners
   */
  private notifyMessageListeners(message: WSMessageEnvelope): void {
    this.messageListeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        this.debug('Message listener error:', error);
      }
    });
  }

  /**
   * Notify state change listeners
   */
  private notifyStateChangeListeners(state: WSConnectionState): void {
    this.stateChangeListeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        this.debug('State change listener error:', error);
      }
    });
  }

  /**
   * Notify error listeners
   */
  private notifyErrorListeners(error: Error, context: string): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error, context);
      } catch (listenerError) {
        this.debug('Error listener error:', listenerError);
      }
    });
  }

  /**
   * Debug logging
   */
  private debug(...args: unknown[]): void {
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.log('[EnhancedWS]', ...args);
    }
  }
}