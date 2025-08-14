/**
 * WebSocket Type Guards and Message Validation
 * 
 * Provides comprehensive type safety for WebSocket envelope patterns
 * matching the backend envelope structure: {type, status, data, timestamp, error}
 */

// Base WebSocket Envelope Pattern (matches backend implementation)
export interface WebSocketEnvelope<T = unknown> {
  type: string;
  status: 'success' | 'error' | 'info';
  timestamp: string;
  data?: T;
  error?: string;
}

// Specific message types
export interface ConnectionMessage {
  status: 'connected' | 'disconnected' | 'reconnecting';
}

export interface PredictionUpdateMessage {
  payload: Record<string, unknown>;
}

export interface OddsUpdateMessage {
  filters: {
    sport?: string;
    sportsbook?: string;
    player?: string;
  };
  message: string;
}

export interface ArbitrageAlertMessage {
  filters: {
    sport?: string;
    min_profit?: number;
  };
  status: string;
}

export interface PortfolioUpdateMessage {
  user_id: string;
  status: string;
}

export interface NotificationMessage {
  connection_stats?: {
    connected_at: string;
    message_count: number;
    user_id: string;
    filter_count: number;
  };
  service_stats?: Record<string, unknown>;
}

export interface ErrorMessage {
  message: string;
  code?: string;
}

// Union of all possible message data types
export type WebSocketMessageData = 
  | ConnectionMessage
  | PredictionUpdateMessage
  | OddsUpdateMessage
  | ArbitrageAlertMessage
  | PortfolioUpdateMessage
  | NotificationMessage
  | ErrorMessage;

// Type guards for envelope validation
export function isWebSocketEnvelope(data: unknown): data is WebSocketEnvelope {
  if (!data || typeof data !== 'object' || data === null) {
    return false;
  }

  const envelope = data as Record<string, unknown>;

  return (
    typeof envelope.type === 'string' &&
    typeof envelope.status === 'string' &&
    ['success', 'error', 'info'].includes(envelope.status as string) &&
    typeof envelope.timestamp === 'string'
  );
}

export function isValidWebSocketMessage(data: unknown): data is WebSocketEnvelope {
  if (!isWebSocketEnvelope(data)) {
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

// Type guards for specific message types
export function isConnectionMessage(envelope: WebSocketEnvelope): envelope is WebSocketEnvelope<ConnectionMessage> {
  return envelope.type === 'connection_established' && 
         envelope.data && 
         typeof envelope.data === 'object' &&
         'status' in envelope.data;
}

export function isPredictionUpdateMessage(envelope: WebSocketEnvelope): envelope is WebSocketEnvelope<PredictionUpdateMessage> {
  return envelope.type === 'PREDICTION_UPDATE' &&
         envelope.data &&
         typeof envelope.data === 'object' &&
         'payload' in envelope.data;
}

export function isOddsUpdateMessage(envelope: WebSocketEnvelope): envelope is WebSocketEnvelope<OddsUpdateMessage> {
  return envelope.type === 'odds_subscription_confirmed' &&
         envelope.data &&
         typeof envelope.data === 'object';
}

export function isArbitrageAlertMessage(envelope: WebSocketEnvelope): envelope is WebSocketEnvelope<ArbitrageAlertMessage> {
  return envelope.type === 'arbitrage_subscription_confirmed' &&
         envelope.data &&
         typeof envelope.data === 'object';
}

export function isPortfolioUpdateMessage(envelope: WebSocketEnvelope): envelope is WebSocketEnvelope<PortfolioUpdateMessage> {
  return envelope.type === 'portfolio_subscription_confirmed' &&
         envelope.data &&
         typeof envelope.data === 'object';
}

export function isNotificationMessage(envelope: WebSocketEnvelope): envelope is WebSocketEnvelope<NotificationMessage> {
  return (envelope.type === 'stats' || envelope.type === 'pong') &&
         envelope.data &&
         typeof envelope.data === 'object';
}

export function isErrorMessage(envelope: WebSocketEnvelope): envelope is WebSocketEnvelope<ErrorMessage> {
  return envelope.status === 'error' &&
         envelope.error &&
         typeof envelope.error === 'string';
}

// Message validation and parsing utilities
export class WebSocketMessageValidator {
  /**
   * Parse and validate a WebSocket message from JSON string
   */
  static parseMessage(rawMessage: string): WebSocketEnvelope | null {
    try {
      const parsed = JSON.parse(rawMessage);
      
      if (!isValidWebSocketMessage(parsed)) {
        console.warn('[WebSocket] Invalid message format:', parsed);
        return null;
      }

      return parsed;
    } catch (error) {
      console.warn('[WebSocket] Failed to parse message:', error, rawMessage);
      return null;
    }
  }

  /**
   * Validate message type and extract typed data
   */
  static extractTypedData<T extends WebSocketMessageData>(
    envelope: WebSocketEnvelope,
    typeGuard: (env: WebSocketEnvelope) => env is WebSocketEnvelope<T>
  ): T | null {
    if (typeGuard(envelope)) {
      return envelope.data || null;
    }
    return null;
  }

  /**
   * Create a standardized error response for invalid messages
   */
  static createErrorResponse(message: string, originalType?: string): WebSocketEnvelope<ErrorMessage> {
    return {
      type: originalType || 'validation_error',
      status: 'error',
      timestamp: new Date().toISOString(),
      error: message,
      data: { message, code: 'VALIDATION_ERROR' }
    };
  }

  /**
   * Sanitize and validate incoming message data
   */
  static sanitizeMessage(envelope: WebSocketEnvelope): WebSocketEnvelope {
    // Ensure timestamp is valid ISO string
    const timestamp = envelope.timestamp || new Date().toISOString();
    
    // Validate timestamp format
    try {
      new Date(timestamp);
    } catch {
      envelope.timestamp = new Date().toISOString();
    }

    // Ensure status is valid
    if (!['success', 'error', 'info'].includes(envelope.status)) {
      envelope.status = 'info';
    }

    // Ensure type is a non-empty string
    if (!envelope.type || typeof envelope.type !== 'string') {
      envelope.type = 'unknown';
    }

    return envelope;
  }
}

// WebSocket event types for type-safe event handling
export type WebSocketEventType = 
  | 'connection_established'
  | 'PREDICTION_UPDATE'
  | 'odds_subscription_confirmed'
  | 'arbitrage_subscription_confirmed'
  | 'portfolio_subscription_confirmed'
  | 'stats'
  | 'pong'
  | 'ping'
  | 'error'
  | 'subscription_updated';

// Configuration for WebSocket connections
export interface TypedWebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxRetries: number;
  enableHeartbeat: boolean;
  heartbeatInterval: number;
  validateMessages: boolean;
  logInvalidMessages: boolean;
}

export const DEFAULT_WEBSOCKET_CONFIG: TypedWebSocketConfig = {
  url: 'ws://localhost:8000/ws',
  reconnectInterval: 5000,
  maxRetries: 5,
  enableHeartbeat: true,
  heartbeatInterval: 30000,
  validateMessages: true,
  logInvalidMessages: true,
};
