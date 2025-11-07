/**
 * WebSocket Connection States
 * 
 * Defines the connection state machine and related types for WebSocket management.
 */

export type WSConnectionPhase =
  | 'idle'           // Not connected, no attempts made
  | 'connecting'     // Initial connection attempt
  | 'open'           // Successfully connected and operational
  | 'degraded'       // Connected but with reduced functionality
  | 'reconnecting'   // Attempting to reconnect after failure
  | 'failed'         // Connection failed, still retrying
  | 'fallback';      // Gave up reconnecting, using local mode

export type WSCloseCode = 
  | 1000  // Normal closure
  | 1001  // Going away
  | 1002  // Protocol error
  | 1003  // Unsupported data
  | 1006  // Abnormal closure (no close frame)
  | 1011  // Server error
  | 4400  // Custom: Unsupported version
  | 4401  // Custom: Invalid role
  | 4500; // Custom: Server handshake error

export type WSFailureClassification =
  | 'network'       // DNS, connection refused, network issues
  | 'handshake'     // 4xx responses, version mismatch
  | 'server_error'  // 5xx responses, server-side issues  
  | 'abnormal'      // 1006, unexpected closure
  | 'timeout'       // Connection or ping timeout
  | 'unknown';      // Unclassified error

export interface WSConnectionAttempt {
  attempt: number;
  timestamp: Date;
  duration_ms?: number;
  close_code?: WSCloseCode;
  close_reason?: string;
  classification: WSFailureClassification;
  next_retry_eta?: Date;
}

export interface WSConnectionStats {
  total_attempts: number;
  successful_connections: number;
  current_uptime_ms: number;
  messages_received: number;
  messages_sent: number;
  heartbeats_received: number;
  heartbeats_sent: number;
  last_activity: Date | null;
  connection_start: Date | null;
  message_counts_by_type: Record<string, number>;
}

export interface WSHelloMessage extends WSMessage {
  type: 'hello';
  server_time: string;
  accepted_version: number;
  features: string[];
  request_id: string;
  client_id: string;
  heartbeat_interval_ms: number;
}

export interface WSState {
  phase: WSConnectionPhase;
  client_id: string;
  url: string;
  stats: WSConnectionStats;
  current_attempt: WSConnectionAttempt | null;
  recent_attempts: WSConnectionAttempt[];
  fallback_reason: string | null;
  last_hello_message: WSHelloMessage | null;
  connection_features: string[];
  is_fallback_mode: boolean;
}

export interface WSMessage {
  type: string;
  timestamp: string;
  [key: string]: unknown;
}

export const classifyFailure = (
  closeCode?: WSCloseCode, 
  error?: Error | Event
): WSFailureClassification => {
  // Classify based on close code first
  if (closeCode) {
    switch (closeCode) {
      case 4400:
      case 4401:
        return 'handshake';
      case 4500:
      case 1011:
        return 'server_error';
      case 1006:
        return 'abnormal';
      case 1000:
      case 1001:
        return 'network'; // Normal closures during connection issues
      default:
        return 'unknown';
    }
  }
  
  // Classify based on error message
  if (error) {
    const message = error instanceof Error 
      ? error.message.toLowerCase()
      : error.toString().toLowerCase();
    
    if (message.includes('network') || 
        message.includes('connection refused') ||
        message.includes('dns') ||
        message.includes('host not found')) {
      return 'network';
    }
    
    if (message.includes('timeout')) {
      return 'timeout';
    }
    
    if (message.includes('handshake') || 
        message.includes('upgrade') ||
        message.includes('version')) {
      return 'handshake';
    }
    
    if (message.includes('server error') || 
        message.includes('internal error')) {
      return 'server_error';
    }
  }
  
  return 'unknown';
};

export const getFailureDescription = (classification: WSFailureClassification): string => {
  switch (classification) {
    case 'network':
      return 'Network connectivity issue (DNS, connection refused, etc.)';
    case 'handshake':
      return 'WebSocket handshake rejected (version mismatch, invalid params)';
    case 'server_error':
      return 'Server internal error during connection';
    case 'abnormal':
      return 'Connection closed unexpectedly (no close frame received)';
    case 'timeout':
      return 'Connection or heartbeat timeout';
    case 'unknown':
    default:
      return 'Unknown connection failure';
  }
};