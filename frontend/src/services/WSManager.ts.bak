/**
 * WebSocket Manager for PR11 Implementation
 * 
 * Provides a TypeScript WebSocket manager that handles the new envelope format,
 * connection management, message buffering, and observability integration.
 * Supports automatic reconnection, heartbeat monitoring, and type-safe messaging.
 */

import type {
  WSEnvelope, WSEvents, WSConnectionState, WSManagerConfig,
  MessageBufferEntry, HelloMessage, PingMessage, PongMessage,
  ErrorMessage, DriftStatusMessage, StatusMessage
} from '../types/websocket-pr11';

import {
  isValidWebSocketMessage, isHelloMessage,
  isPingMessage, isPongMessage, isErrorMessage, isDriftStatusMessage,
  isStatusMessage, WSMessageParser
} from '../types/websocket-pr11';

/**
 * Event-driven WebSocket Manager with PR11 Envelope Support
 * 
 * Features:
 * - Standardized envelope format for all messages
 * - Automatic connection management and reconnection
 * - Message buffering during disconnection
 * - Type-safe message handling with TypeScript
 * - Request correlation and trace propagation
 * - Heartbeat monitoring and connection health
 * - Observability event emission
 */
export class WSManager {
  private ws: WebSocket | null = null;
  private config: Required<WSManagerConfig>;
  private connectionState: WSConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageBuffer: MessageBufferEntry[] = [];
  private eventListeners = new Map<string, Set<(data: unknown) => void>>();
  private lastHeartbeat: Date | null = null;
  private connectionId: string | null = null;

  constructor(config: WSManagerConfig) {
    this.config = {
      version: 1,
      role: 'frontend',
      autoReconnect: true,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      debug: false,
      ...config
    };

    // Initialize event listener map
    const eventTypes = [
      'connection:state', 'message:raw', 'message:envelope', 'message:hello',
      'message:ping', 'message:pong', 'message:error', 'message:drift', 'error'
    ];

    eventTypes.forEach(eventType => {
      this.eventListeners.set(eventType, new Set());
    });
  }

  /**
   * Connect to WebSocket server
   */
  public async connect(): Promise<void> {
    if (this.connectionState === 'connecting' || this.connectionState === 'connected') {
      this.log('Connection already in progress or established');
      return;
    }

    this.setState('connecting');

    try {
      // Build WebSocket URL with query parameters
      const url = new URL(this.config.url);
      url.searchParams.set('client_id', this.config.clientId);
      url.searchParams.set('version', this.config.version.toString());
      url.searchParams.set('role', this.config.role);

      this.log(`Connecting to WebSocket: ${url.toString()}`);

      // Create WebSocket connection
      this.ws = new WebSocket(url.toString());
      
      // Set up event handlers
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

    } catch (error) {
      this.log(`Connection failed: ${error}`);
      this.setState('error');
      this.emit('error', error as Error);
      
      if (this.config.autoReconnect) {
        this.scheduleReconnection();
      }
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    this.config.autoReconnect = false; // Prevent automatic reconnection
    
    this.clearTimers();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.setState('disconnected');
    this.connectionId = null;
  }

  /**
   * Send enveloped message to server
   */
  public sendMessage<T>(
    type: string,
    payload: T,
    options: {
      request_id?: string;
      span?: string;
      parent_span?: string;
      debug?: boolean;
      priority?: boolean;
    } = {}
  ): boolean {
    const envelope = WSMessageParser.createEnvelope(type, payload, {
      request_id: options.request_id,
      span: options.span,
      parent_span: options.parent_span,
      debug: options.debug
    });

    return this.sendEnvelope(envelope, options.priority);
  }

  /**
   * Send envelope directly
   */
  public sendEnvelope(envelope: WSEnvelope, priority: boolean = false): boolean {
    if (this.connectionState === 'connected' && this.ws) {
      try {
        const message = JSON.stringify(envelope);
        this.ws.send(message);
        
        this.log(`Sent message: ${envelope.type}`, envelope);
        return true;
      } catch (error) {
        this.log(`Failed to send message: ${error}`);
        this.bufferMessage(envelope, priority);
        return false;
      }
    } else {
      // Buffer message for later sending
      this.bufferMessage(envelope, priority);
      return false;
    }
  }

  /**
   * Send ping to server
   */
  public ping(data?: unknown): void {
    this.sendMessage('ping', {
      heartbeat_count: this.getHeartbeatCount(),
      data
    });
  }

  /**
   * Request connection status from server
   */
  public requestStatus(): void {
    this.sendMessage('status', {});
  }

  /**
   * Add event listener
   */
  public on<K extends keyof WSEvents>(
    event: K,
    listener: (data: WSEvents[K]) => void
  ): void {
    const listeners = this.eventListeners.get(event as string);
    if (listeners) {
      listeners.add(listener as (data: unknown) => void);
    }
  }

  /**
   * Remove event listener
   */
  public off<K extends keyof WSEvents>(
    event: K,
    listener: (data: WSEvents[K]) => void
  ): void {
    const listeners = this.eventListeners.get(event as string);
    if (listeners) {
      listeners.delete(listener as (data: unknown) => void);
    }
  }

  /**
   * Get current connection state
   */
  public getConnectionState(): WSConnectionState {
    return this.connectionState;
  }

  /**
   * Get connection statistics
   */
  public getStats() {
    return {
      connectionState: this.connectionState,
      connectionId: this.connectionId,
      reconnectAttempts: this.reconnectAttempts,
      bufferedMessages: this.messageBuffer.length,
      lastHeartbeat: this.lastHeartbeat,
      uptime: this.lastHeartbeat ? Date.now() - this.lastHeartbeat.getTime() : 0
    };
  }

  // Private methods

  private handleOpen(): void {
    this.log('WebSocket connection opened');
    this.setState('connected');
    this.reconnectAttempts = 0;
    
    // Process buffered messages
    this.flushMessageBuffer();
    
    // Start heartbeat
    this.startHeartbeat();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const rawMessage = event.data;
      this.emit('message:raw', rawMessage);
      
      // Parse envelope
      const envelope = WSMessageParser.parseMessage(rawMessage);
      if (!envelope || !isValidWebSocketMessage(envelope)) {
        this.log(`Invalid message format: ${rawMessage.substring(0, 100)}`);
        return;
      }
      
      this.emit('message:envelope', envelope);
      this.handleTypedMessage(envelope);
      
    } catch (error) {
      this.log(`Message handling error: ${error}`);
    }
  }

  private handleTypedMessage(envelope: WSEnvelope): void {
    // Handle specific message types
    if (isHelloMessage(envelope)) {
      this.handleHello(envelope);
    } else if (isPingMessage(envelope)) {
      this.handlePing(envelope);
    } else if (isPongMessage(envelope)) {
      this.handlePong(envelope);
    } else if (isErrorMessage(envelope)) {
      this.handleErrorMessage(envelope);
    } else if (isDriftStatusMessage(envelope)) {
      this.handleDriftStatus(envelope);
    } else if (isStatusMessage(envelope)) {
      this.handleStatus(envelope);
    } else {
      this.log(`Unknown message type: ${envelope.type}`, envelope);
    }
  }

  private handleHello(envelope: HelloMessage): void {
    this.connectionId = envelope.payload.connection_id;
    this.log(`Hello received: ${envelope.payload.client_id}`, envelope.payload);
    this.emit('message:hello', envelope);
  }

  private handlePing(envelope: PingMessage): void {
    // Respond with pong
    this.sendMessage('pong', {
      original_timestamp: envelope.timestamp,
      response_timestamp: new Date().toISOString(),
      data: envelope.payload.data
    }, {
      request_id: envelope.request_id,
      span: envelope.trace?.span,
      parent_span: envelope.trace?.parent_span
    });
    
    this.emit('message:ping', envelope);
  }

  private handlePong(envelope: PongMessage): void {
    this.lastHeartbeat = new Date();
    this.log('Pong received', envelope.payload);
    this.emit('message:pong', envelope);
  }

  private handleErrorMessage(envelope: ErrorMessage): void {
    this.log(`Server error: ${envelope.payload.error_message} (${envelope.payload.error_code})`);
    this.emit('message:error', envelope);
  }

  private handleDriftStatus(envelope: DriftStatusMessage): void {
    this.log(`Drift status: ${envelope.payload.status} (${envelope.payload.drift_score})`);
    this.emit('message:drift', envelope);
  }

  private handleStatus(envelope: StatusMessage): void {
    this.log(`Status: uptime ${envelope.payload.connection_uptime_seconds}s, heartbeats ${envelope.payload.heartbeat_count}`);
  }

  private handleClose(event: CloseEvent): void {
    this.log(`WebSocket closed: ${event.code} - ${event.reason}`);
    this.setState('disconnected');
    this.clearTimers();
    this.ws = null;
    this.connectionId = null;
    
    if (this.config.autoReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnection();
    }
  }

  private handleError(event: Event): void {
    this.log('WebSocket error', event);
    this.setState('error');
    this.emit('error', new Error('WebSocket connection error'));
  }

  private setState(state: WSConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.emit('connection:state', state);
      this.log(`State changed: ${state}`);
    }
  }

  private scheduleReconnection(): void {
    this.setState('reconnecting');
    this.reconnectAttempts++;
    
    this.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${this.config.reconnectInterval}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.config.reconnectInterval);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.connectionState === 'connected') {
        this.ping();
      }
    }, this.config.heartbeatInterval);
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private bufferMessage(envelope: WSEnvelope, priority: boolean = false): void {
    const entry: MessageBufferEntry = {
      message: envelope,
      queued_at: new Date().toISOString(),
      attempts: 0,
      priority
    };

    if (priority) {
      this.messageBuffer.unshift(entry);
    } else {
      this.messageBuffer.push(entry);
    }

    // Limit buffer size
    if (this.messageBuffer.length > 100) {
      this.messageBuffer.splice(50, this.messageBuffer.length - 50);
    }
  }

  private flushMessageBuffer(): void {
    const buffer = [...this.messageBuffer];
    this.messageBuffer = [];

    for (const entry of buffer) {
      if (!this.sendEnvelope(entry.message)) {
        // Re-buffer if send fails
        this.bufferMessage(entry.message, entry.priority);
      }
    }
  }

  private getHeartbeatCount(): number {
    return Math.floor(Date.now() / this.config.heartbeatInterval);
  }

  private emit<K extends keyof WSEvents>(event: K, data: WSEvents[K]): void {
    const listeners = this.eventListeners.get(event as string);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          this.log(`Event listener error for ${String(event)}: ${error}`);
        }
      });
    }
  }

  private log(message: string, data?: unknown): void {
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.log(`[WSManager] ${message}`, data || '');
    }
  }
}