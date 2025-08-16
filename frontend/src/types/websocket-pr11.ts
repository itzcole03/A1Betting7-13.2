/**
 * WebSocket Envelope Types for PR11 Implementation
 * 
 * Provides TypeScript interfaces for standardized WebSocket message envelopes,
 * enabling request correlation, trace propagation, and structured messaging
 * between frontend and backend WebSocket connections.
 */

/**
 * WebSocket Message Envelope Structure (Version 1)
 * 
 * All WebSocket messages follow this standardized envelope format for
 * consistency, correlation tracking, and observability.
 */
export interface WSEnvelope<T = unknown> {
  /** Envelope format version (currently always 1) */
  envelope_version: 1;
  
  /** Message type identifier (e.g., "hello", "ping", "drift.status") */
  type: string;
  
  /** ISO timestamp when message was created */
  timestamp: string;
  
  /** Request ID for correlation tracking across HTTP/WS boundaries */
  request_id?: string;
  
  /** Distributed tracing metadata */
  trace?: {
    /** Current span ID */
    span?: string;
    /** Parent span ID */
    parent_span?: string;
  };
  
  /** Message payload (type-safe generic) */
  payload: T;
  
  /** Optional metadata for debugging/monitoring */
  meta?: {
    /** Whether this is a debug/development message */
    debug?: boolean;
    /** Legacy compatibility flag */
    legacy_compatibility?: boolean;
    /** Additional arbitrary metadata */
    [key: string]: unknown;
  };
}

/**
 * Hello Message Payload
 * 
 * Sent by server immediately after WebSocket connection establishment
 */
export interface HelloPayload {
  /** Server timestamp when connection was established */
  server_time: string;
  
  /** Client ID that connected */
  client_id: string;
  
  /** Features supported by this WebSocket connection */
  features: string[];
  
  /** Protocol version */
  version: number;
  
  /** Unique connection identifier */
  connection_id: string;
}

/**
 * Ping/Pong Message Payload
 * 
 * Used for heartbeat and connection health monitoring
 */
export interface PingPayload {
  /** Heartbeat sequence number */
  heartbeat_count?: number;
  
  /** Optional ping data for round-trip testing */
  data?: unknown;
}

export interface PongPayload {
  /** Original timestamp from ping message */
  original_timestamp?: string;
  
  /** Server response timestamp */
  response_timestamp: string;
  
  /** Optional echo data from ping */
  data?: unknown;
}

/**
 * Error Message Payload
 * 
 * Standardized error format for WebSocket error responses
 */
export interface ErrorPayload {
  /** Human-readable error message */
  error_message: string;
  
  /** Machine-readable error code */
  error_code: string;
  
  /** Optional error details */
  details?: {
    /** Request that caused the error */
    original_request?: unknown;
    /** Additional context */
    context?: Record<string, unknown>;
    /** Error timestamp */
    timestamp?: string;
  };
}

/**
 * Drift Status Payload
 * 
 * Real-time drift monitoring status updates
 */
export interface DriftStatusPayload {
  /** Overall drift status */
  status: "healthy" | "warning" | "critical";
  
  /** Drift score/percentage */
  drift_score: number;
  
  /** Timestamp of drift calculation */
  calculated_at: string;
  
  /** Affected models/features */
  affected_components: string[];
  
  /** Optional detailed metrics */
  metrics?: {
    [key: string]: number;
  };
}

/**
 * Status Message Payload
 * 
 * Connection status information response
 */
export interface StatusPayload {
  /** Connection uptime in seconds */
  connection_uptime_seconds: number;
  
  /** Heartbeat count */
  heartbeat_count: number;
  
  /** Last heartbeat timestamp */
  last_heartbeat: string;
  
  /** Client ID */
  client_id: string;
  
  /** Connection ID */
  connection_id?: string;
  
  /** Whether this was a legacy request */
  legacy_request?: boolean;
}

/**
 * Legacy Echo Payload
 * 
 * Response format for legacy (non-enveloped) messages
 */
export interface LegacyEchoPayload {
  /** Flag indicating this is a legacy compatibility response */
  legacy_request: true;
  
  /** Original message data from legacy client */
  original_data: unknown;
  
  /** Timestamp when message was wrapped */
  wrapped_at: string;
  
  /** Notice encouraging envelope adoption */
  notice: string;
}

/**
 * Union type for common WebSocket message payloads
 */
export type WSPayload = 
  | HelloPayload
  | PingPayload 
  | PongPayload
  | ErrorPayload
  | DriftStatusPayload
  | StatusPayload
  | LegacyEchoPayload;

/**
 * Typed envelope for common message types
 */
export type HelloMessage = WSEnvelope<HelloPayload>;
export type PingMessage = WSEnvelope<PingPayload>;
export type PongMessage = WSEnvelope<PongPayload>;
export type ErrorMessage = WSEnvelope<ErrorPayload>;
export type DriftStatusMessage = WSEnvelope<DriftStatusPayload>;
export type StatusMessage = WSEnvelope<StatusPayload>;

/**
 * WebSocket Connection State
 */
export type WSConnectionState = "connecting" | "connected" | "disconnected" | "error" | "reconnecting";

/**
 * WebSocket Event Types
 */
export interface WSEvents {
  /** Connection state changed */
  "connection:state": WSConnectionState;
  /** Message received (raw) */
  "message:raw": string;
  /** Envelope message received */
  "message:envelope": WSEnvelope;
  /** Hello message received */
  "message:hello": HelloMessage;
  /** Ping received */
  "message:ping": PingMessage;
  /** Pong received */
  "message:pong": PongMessage;
  /** Error received */
  "message:error": ErrorMessage;
  /** Drift status update */
  "message:drift": DriftStatusMessage;
  /** Connection error */
  "error": Error;
}

/**
 * WebSocket Manager Configuration
 */
export interface WSManagerConfig {
  /** WebSocket endpoint URL */
  url: string;
  
  /** Client ID for connection identification */
  clientId: string;
  
  /** Protocol version */
  version?: number;
  
  /** Client role */
  role?: string;
  
  /** Automatic reconnection */
  autoReconnect?: boolean;
  
  /** Reconnection interval in milliseconds */
  reconnectInterval?: number;
  
  /** Maximum reconnection attempts */
  maxReconnectAttempts?: number;
  
  /** Heartbeat interval in milliseconds */
  heartbeatInterval?: number;
  
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Message Buffer Entry
 * 
 * For storing messages while disconnected
 */
export interface MessageBufferEntry {
  /** Message to send */
  message: WSEnvelope;
  
  /** Timestamp when queued */
  queued_at: string;
  
  /** Number of send attempts */
  attempts: number;
  
  /** Whether this is a priority message */
  priority?: boolean;
}

// Type guards for envelope validation
export function isWSEnvelope(data: unknown): data is WSEnvelope {
  if (!data || typeof data !== 'object' || data === null) {
    return false;
  }

  const envelope = data as Record<string, unknown>;

  return (
    typeof envelope.envelope_version === 'number' &&
    envelope.envelope_version === 1 &&
    typeof envelope.type === 'string' &&
    typeof envelope.timestamp === 'string' &&
    envelope.payload !== undefined
  );
}

export function isValidWebSocketMessage(data: unknown): data is WSEnvelope {
  if (!isWSEnvelope(data)) {
    return false;
  }

  // Additional validation for timestamp format
  try {
    const timestamp = new Date(data.timestamp);
    return !isNaN(timestamp.getTime());
  } catch {
    return false;
  }
}

// Specific message type guards
export function isHelloMessage(envelope: WSEnvelope): envelope is HelloMessage {
  return envelope.type === 'hello' && 
         envelope.payload !== null &&
         typeof envelope.payload === 'object' &&
         envelope.payload !== undefined &&
         'client_id' in envelope.payload &&
         'server_time' in envelope.payload;
}

export function isPingMessage(envelope: WSEnvelope): envelope is PingMessage {
  return envelope.type === 'ping';
}

export function isPongMessage(envelope: WSEnvelope): envelope is PongMessage {
  return envelope.type === 'pong' &&
         envelope.payload !== null &&
         typeof envelope.payload === 'object' &&
         envelope.payload !== undefined &&
         'response_timestamp' in envelope.payload;
}

export function isErrorMessage(envelope: WSEnvelope): envelope is ErrorMessage {
  return envelope.type === 'error' &&
         envelope.payload !== null &&
         typeof envelope.payload === 'object' &&
         envelope.payload !== undefined &&
         'error_message' in envelope.payload &&
         'error_code' in envelope.payload;
}

export function isDriftStatusMessage(envelope: WSEnvelope): envelope is DriftStatusMessage {
  return envelope.type === 'drift.status' &&
         envelope.payload !== null &&
         typeof envelope.payload === 'object' &&
         envelope.payload !== undefined &&
         'status' in envelope.payload &&
         'drift_score' in envelope.payload;
}

export function isStatusMessage(envelope: WSEnvelope): envelope is StatusMessage {
  return envelope.type === 'status' &&
         envelope.payload !== null &&
         typeof envelope.payload === 'object' &&
         envelope.payload !== undefined &&
         'connection_uptime_seconds' in envelope.payload;
}

/**
 * WebSocket Message Parser
 * 
 * Utility class for parsing and validating WebSocket messages
 */
export class WSMessageParser {
  /**
   * Parse raw WebSocket message into typed envelope
   */
  static parseMessage(rawMessage: string): WSEnvelope | null {
    try {
      const parsed = JSON.parse(rawMessage);
      
      if (isWSEnvelope(parsed)) {
        return parsed;
      }
      
      return null;
    } catch {
      // Silent error handling - caller should handle null return
      return null;
    }
  }

  /**
   * Create envelope from payload
   */
  static createEnvelope<T>(
    type: string,
    payload: T,
    options: {
      request_id?: string;
      span?: string;
      parent_span?: string;
      debug?: boolean;
    } = {}
  ): WSEnvelope<T> {
    return {
      envelope_version: 1,
      type,
      timestamp: new Date().toISOString(),
      payload,
      request_id: options.request_id,
      trace: options.span ? {
        span: options.span,
        parent_span: options.parent_span
      } : undefined,
      meta: options.debug ? { debug: true } : undefined
    };
  }

  /**
   * Type-safe message extraction
   */
  static extractTypedPayload<T>(
    envelope: WSEnvelope,
    typeGuard: (env: WSEnvelope) => env is WSEnvelope<T>
  ): T | null {
    if (typeGuard(envelope)) {
      return envelope.payload;
    }
    return null;
  }
}