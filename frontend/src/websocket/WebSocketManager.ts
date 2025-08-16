/**
 * WebSocket Manager with State Machine and Adaptive Reconnection
 * 
 * Provides resilient WebSocket connection management with:
 * - State machine with explicit phases
 * - Adaptive backoff with jitter 
 * - Message type tracking and statistics
 * - Graceful degradation and fallback mode
 * - Comprehensive error classification
 * - Structured logging with duplicate suppression
 */

import { BackoffStrategy } from './BackoffStrategy';
import { buildWebSocketUrl } from './buildWebSocketUrl';
import { 
  WSState, 
  WSConnectionPhase, 
  WSConnectionAttempt, 
  WSConnectionStats,
  WSMessage,
  WSHelloMessage,
  classifyFailure,
  getFailureDescription,
  type WSCloseCode
} from './ConnectionState';

type StateChangeListener = (state: WSState) => void;
type MessageListener = (message: WSMessage) => void;
type ErrorListener = (error: Error, context: string) => void;

interface Logger {
  log: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
  debug: (message: string, data?: Record<string, unknown>) => void;
}

// Simple logger implementation
const createLogger = (): Logger => ({
  log: (message: string, data?: Record<string, unknown>) => {
    if (data && Object.keys(data).length > 0) {
      // eslint-disable-next-line no-console
      console.log(message, data);
    } else {
      // eslint-disable-next-line no-console
      console.log(message);
    }
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    if (data && Object.keys(data).length > 0) {
      // eslint-disable-next-line no-console
      console.warn(message, data);
    } else {
      // eslint-disable-next-line no-console
      console.warn(message);
    }
  },
  error: (message: string, data?: Record<string, unknown>) => {
    if (data && Object.keys(data).length > 0) {
      // eslint-disable-next-line no-console
      console.error(message, data);
    } else {
      // eslint-disable-next-line no-console
      console.error(message);
    }
  },
  debug: (message: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      if (data && Object.keys(data).length > 0) {
        // eslint-disable-next-line no-console
        console.debug(message, data);
      } else {
        // eslint-disable-next-line no-console
        console.debug(message);
      }
    }
  }
});

export class WebSocketManager {
  private state: WSState;
  private ws: WebSocket | null = null;
  private backoffStrategy: BackoffStrategy;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private logger: Logger;
  
  // Heartbeat configuration
  private readonly heartbeatIntervalMs = 30000; // 30s per acceptance criteria
  private readonly heartbeatTimeoutMs = 10000; // 10s timeout for heartbeat response
  private lastPingTime = 0;
  private consecutiveFailures = 0;
  private isInLocalSimulation = false;
  
  // Event listeners
  private stateChangeListeners: StateChangeListener[] = [];
  private messageListeners: MessageListener[] = [];
  private errorListeners: ErrorListener[] = [];
  
  // Local simulation event listeners
  private localSimulationListeners: ((active: boolean) => void)[] = [];
  
  // Logging with duplicate suppression
  private lastLoggedTransition: string | null = null;
  private lastLoggedError: string | null = null;
  
  constructor(
    private readonly baseUrl: string = 'ws://localhost:8000',
    private readonly clientId: string = `client_${Math.random().toString(36).substr(2, 9)}`,
    private readonly options: {
      connectionTimeoutMs?: number;
      heartbeatTimeoutMs?: number;
      enableHeartbeat?: boolean;
      version?: number;
      role?: string;
      backoffStrategy?: BackoffStrategy;
    } = {}
  ) {
    this.backoffStrategy = options.backoffStrategy || BackoffStrategy.createProductionStrategy();
    this.logger = createLogger();
    
    // Initialize state
    const url = this.buildWebSocketUrl();
    this.state = {
      phase: 'idle',
      client_id: this.clientId,
      url,
      stats: this.initializeStats(),
      current_attempt: null,
      recent_attempts: [],
      fallback_reason: null,
      last_hello_message: null,
      connection_features: [],
      is_fallback_mode: false
    };
  }

  /**
   * Connect to WebSocket server
   */
  public async connect(): Promise<void> {
    if (this.state.phase === 'open') {
      this.logInfo('Already connected, ignoring connect request');
      return;
    }

    if (this.state.phase === 'connecting' || this.state.phase === 'reconnecting') {
      this.logInfo('Connection already in progress');
      return;
    }

    await this.attemptConnection();
  }

  /**
   * Disconnect and stop all reconnection attempts
   */
  public disconnect(): void {
    this.logInfo('Disconnecting WebSocket');
    
    this.clearTimeouts();
    this.backoffStrategy.reset();
    
    if (this.ws) {
      // Send close frame with normal closure code
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Client disconnect');
      } else {
        this.ws.close();
      }
      this.ws = null;
    }

    this.transitionToState('idle');
  }

  /**
   * Send message if connected
   */
  public send(message: WSMessage): boolean {
    if (this.state.phase !== 'open' || !this.ws) {
      this.logWarn('Cannot send message: not connected', { messageType: message.type });
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      this.state.stats.messages_sent++;
      this.state.stats.last_activity = new Date();
      this.notifyStateChange();
      return true;
    } catch (error) {
      this.handleError(error as Error, 'send_message');
      return false;
    }
  }

  /**
   * Send ping message
   */
  public ping(): boolean {
    return this.send({
      type: 'ping',
      timestamp: new Date().toISOString(),
      client_id: this.clientId
    });
  }

  /**
   * Force reconnection (reset backoff)
   */
  public forceReconnect(): void {
    this.logInfo('Forcing reconnection');
    
    this.backoffStrategy.reset();
    this.clearTimeouts();
    
    if (this.ws) {
      this.ws.close(1000, 'Force reconnect');
      this.ws = null;
    }
    
    this.attemptConnection();
  }

  /**
   * Get current state (immutable copy)
   */
  public getState(): WSState {
    return {
      ...this.state,
      stats: { ...this.state.stats },
      recent_attempts: [...this.state.recent_attempts],
      connection_features: [...this.state.connection_features]
    };
  }

  /**
   * Add state change listener
   */
  public onStateChange(listener: StateChangeListener): () => void {
    this.stateChangeListeners.push(listener);
    return () => {
      const index = this.stateChangeListeners.indexOf(listener);
      if (index >= 0) {
        this.stateChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Add message listener
   */
  public onMessage(listener: MessageListener): () => void {
    this.messageListeners.push(listener);
    return () => {
      const index = this.messageListeners.indexOf(listener);
      if (index >= 0) {
        this.messageListeners.splice(index, 1);
      }
    };
  }

  /**
   * Add error listener  
   */
  public onError(listener: ErrorListener): () => void {
    this.errorListeners.push(listener);
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index >= 0) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  /**
   * Cleanup all resources
   */
  public destroy(): void {
    this.disconnect();
    this.stateChangeListeners.length = 0;
    this.messageListeners.length = 0;
    this.errorListeners.length = 0;
  }

  // Private implementation methods

  private isHelloMessage(message: WSMessage): message is WSHelloMessage {
    return message.type === 'hello' &&
           typeof (message as unknown as WSHelloMessage).server_time === 'string' &&
           typeof (message as unknown as WSHelloMessage).accepted_version === 'number' &&
           Array.isArray((message as unknown as WSHelloMessage).features);
  }

  private buildWebSocketUrl(): string {
    return buildWebSocketUrl({
      baseUrl: this.baseUrl,
      clientId: this.clientId,
      version: this.options.version || 1,
      role: this.options.role || 'frontend'
    });
  }

  private initializeStats(): WSConnectionStats {
    return {
      total_attempts: 0,
      successful_connections: 0,
      current_uptime_ms: 0,
      messages_received: 0,
      messages_sent: 0,
      heartbeats_received: 0,
      heartbeats_sent: 0,
      last_activity: null,
      connection_start: null,
      message_counts_by_type: {}
    };
  }

  private async attemptConnection(): Promise<void> {
    // Check if we've exceeded max attempts
    if (this.backoffStrategy.hasExceededMaxAttempts()) {
      const fallbackReason = `Exceeded maximum reconnection attempts (${this.backoffStrategy.getConfig().maxAttempts})`;
      this.transitionToFallback(fallbackReason);
      return;
    }

    const attempt: WSConnectionAttempt = {
      attempt: this.backoffStrategy.getCurrentAttempt() + 1,
      timestamp: new Date(),
      classification: 'unknown'
    };

    this.state.stats.total_attempts++;
    this.state.current_attempt = attempt;
    
    this.transitionToState(this.state.stats.successful_connections > 0 ? 'reconnecting' : 'connecting');

    try {
      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        this.handleConnectionTimeout();
      }, this.options.connectionTimeoutMs || 10000);

      const url = this.buildWebSocketUrl();
      this.logInfo('Attempting WebSocket connection', { 
        url, 
        attempt: attempt.attempt,
        backoffConfig: this.backoffStrategy.getConfig()
      });

      this.ws = new WebSocket(url);
      
      this.ws.onopen = (event) => this.handleOpen(event);
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onclose = (event) => this.handleClose(event);
      this.ws.onerror = (event) => this.handleError(event as unknown as Error, 'websocket_error');
      
    } catch (error) {
      this.handleConnectionError(error as Error, attempt);
    }
  }

  private handleOpen(_event: Event): void {
    this.clearTimeouts();
    
    this.logInfo('WebSocket connection opened');
    
    // Update stats
    this.state.stats.successful_connections++;
    this.state.stats.connection_start = new Date();
    this.state.stats.current_uptime_ms = 0;
    
    // Complete current attempt
    if (this.state.current_attempt) {
      this.state.current_attempt.duration_ms = 
        new Date().getTime() - this.state.current_attempt.timestamp.getTime();
    }
    
    // Reset backoff strategy
    this.backoffStrategy.reset();
    
    this.transitionToState('open');
    
    // Start heartbeat if enabled
    if (this.options.enableHeartbeat !== false) {
      this.startHeartbeat();
    }
  }

  private handleMessage(event: MessageEvent): void {
    this.state.stats.messages_received++;
    this.state.stats.last_activity = new Date();
    
    try {
      const message: WSMessage = JSON.parse(event.data);
      
      // Track message type
      this.state.stats.message_counts_by_type[message.type] = 
        (this.state.stats.message_counts_by_type[message.type] || 0) + 1;
      
      // Handle special message types
      switch (message.type) {
        case 'hello':
          // Type guard for hello message
          if (this.isHelloMessage(message)) {
            this.handleHelloMessage(message);
          }
          break;
          
        case 'ping':
          // Respond to server ping
          this.send({
            type: 'pong',
            timestamp: new Date().toISOString(),
            client_id: this.clientId
          });
          this.state.stats.heartbeats_received++;
          break;
          
        case 'pong':
          this.state.stats.heartbeats_received++;
          this.logDebug('Received pong from server');
          break;
          
        default:
          // Forward to message listeners
          this.messageListeners.forEach(listener => {
            try {
              listener(message);
            } catch (error) {
              this.logError('Message listener error', error as Error);
            }
          });
      }
      
      this.notifyStateChange();
      
    } catch (error) {
      this.logWarn('Failed to parse WebSocket message', { rawMessage: event.data, error });
    }
  }

  private handleClose(event: CloseEvent): void {
    this.clearTimeouts();
    this.ws = null;
    
    // Update current attempt
    if (this.state.current_attempt) {
      this.state.current_attempt.close_code = event.code as WSCloseCode;
      this.state.current_attempt.close_reason = event.reason;
      this.state.current_attempt.classification = classifyFailure(
        event.code as WSCloseCode,
        undefined
      );
      
      // Add to recent attempts
      this.state.recent_attempts.unshift(this.state.current_attempt);
      if (this.state.recent_attempts.length > 10) {
        this.state.recent_attempts = this.state.recent_attempts.slice(0, 10);
      }
    }
    
    this.logInfo('WebSocket connection closed', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
      classification: this.state.current_attempt?.classification
    });
    
    // Handle reconnection based on close code
    if (event.code === 1000) {
      // Normal closure, don't reconnect
      this.transitionToState('idle');
    } else {
      this.scheduleReconnection();
    }
  }

  private handleError(error: Error | Event, context: string): void {
    const errorMessage = error instanceof Error ? error.message : 'WebSocket error';
    const errorKey = `${context}:${errorMessage}`;
    
    // Suppress duplicate consecutive error logs
    if (this.lastLoggedError !== errorKey) {
      this.logError(`WebSocket error in ${context}`, error instanceof Error ? error : new Error(errorMessage));
      this.lastLoggedError = errorKey;
    }
    
    // Notify error listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(error instanceof Error ? error : new Error(errorMessage), context);
      } catch (listenerError) {
        // Use logger instead of direct console
        this.logger.error('Error listener failed', { error: listenerError });
      }
    });
  }

  private handleConnectionError(error: Error, attempt: WSConnectionAttempt): void {
    attempt.classification = classifyFailure(undefined, error);
    this.handleError(error, 'connection_attempt');
    this.scheduleReconnection();
  }

  private handleConnectionTimeout(): void {
    this.logWarn('WebSocket connection timeout');
    
    if (this.state.current_attempt) {
      this.state.current_attempt.classification = 'timeout';
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.scheduleReconnection();
  }

  private handleHelloMessage(hello: WSHelloMessage): void {
    this.state.last_hello_message = hello;
    this.state.connection_features = hello.features || [];
    
    this.logInfo('Received hello message from server', {
      version: hello.accepted_version,
      features: hello.features,
      serverTime: hello.server_time,
      heartbeatInterval: hello.heartbeat_interval_ms
    });
  }

  private scheduleReconnection(): void {
    const delay = this.backoffStrategy.nextDelay();
    
    if (delay === null) {
      // Max attempts exceeded
      const classification = this.state.current_attempt?.classification || 'unknown';
      const fallbackReason = `Connection failed after maximum attempts. Last failure: ${getFailureDescription(classification)}`;
      this.transitionToFallback(fallbackReason);
      return;
    }
    
    const nextRetryEta = new Date(Date.now() + delay);
    
    if (this.state.current_attempt) {
      this.state.current_attempt.next_retry_eta = nextRetryEta;
    }
    
    this.transitionToState('failed');
    
    this.logInfo('Scheduling reconnection', {
      delayMs: delay,
      nextRetryEta: nextRetryEta.toISOString(),
      attempt: this.backoffStrategy.getCurrentAttempt()
    });
    
    this.reconnectTimeout = setTimeout(() => {
      this.attemptConnection();
    }, delay);
  }

  private transitionToState(newPhase: WSConnectionPhase): void {
    const oldPhase = this.state.phase;
    
    if (oldPhase === newPhase) {
      return; // No transition
    }
    
    this.state.phase = newPhase;
    
    // Update stats based on transition
    if (newPhase === 'open') {
      this.state.stats.connection_start = new Date();
    }
    
    // Log transition (with duplicate suppression)
    const transitionKey = `${oldPhase}->${newPhase}`;
    if (this.lastLoggedTransition !== transitionKey) {
      this.logInfo('WebSocket state transition', {
        from: oldPhase,
        to: newPhase,
        attempt: this.backoffStrategy.getCurrentAttempt(),
        nextRetryEta: this.state.current_attempt?.next_retry_eta?.toISOString()
      });
      this.lastLoggedTransition = transitionKey;
    }
    
    this.notifyStateChange();
  }

  private transitionToFallback(reason: string): void {
    this.state.fallback_reason = reason;
    this.state.is_fallback_mode = true;
    this.transitionToState('fallback');
    
    this.logWarn('Entering fallback mode', { reason });
  }

  private startHeartbeat(): void {
    const intervalMs = this.state.last_hello_message?.heartbeat_interval_ms || 25000;
    
    const sendPing = () => {
      if (this.state.phase === 'open' && this.ping()) {
        this.state.stats.heartbeats_sent++;
        this.heartbeatTimeout = setTimeout(sendPing, intervalMs);
      }
    };
    
    this.heartbeatTimeout = setTimeout(sendPing, intervalMs);
  }

  private clearTimeouts(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  private notifyStateChange(): void {
    const state = this.getState();
    
    // Update uptime if connected
    if (state.phase === 'open' && state.stats.connection_start) {
      state.stats.current_uptime_ms = 
        new Date().getTime() - state.stats.connection_start.getTime();
    }
    
    this.stateChangeListeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        this.logger.error('State change listener failed', { error });
      }
    });
  }

  // Logging methods (structured)
  private logInfo(message: string, extra: Record<string, unknown> = {}): void {
    this.logger.log(`[WS] ${message}`, {
      client_id: this.clientId,
      phase: this.state.phase,
      ...extra
    });
  }

  private logWarn(message: string, extra: Record<string, unknown> = {}): void {
    this.logger.warn(`[WS] ${message}`, {
      client_id: this.clientId,
      phase: this.state.phase,
      ...extra
    });
  }

  private logError(message: string, error: Error, extra: Record<string, unknown> = {}): void {
    this.logger.error(`[WS] ${message}`, {
      client_id: this.clientId,
      phase: this.state.phase,
      error: error.message,
      stack: error.stack,
      ...extra
    });
  }

  private logDebug(message: string, extra: Record<string, unknown> = {}): void {
    this.logger.debug(`[WS] ${message}`, {
      client_id: this.clientId,
      phase: this.state.phase,
      ...extra
    });
  }
}