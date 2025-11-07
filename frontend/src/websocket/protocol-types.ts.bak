/**
 * WebSocket Protocol Types v2.0
 * 
 * Type definitions for the enhanced WebSocket protocol with message envelopes,
 * backoff strategies, local simulation, and state reconciliation.
 */

// Message Envelope Format
export interface WSMessageEnvelope<TPayload = unknown> {
  /** Message type identifier */
  type: string;
  /** Unix timestamp in milliseconds */
  ts: number;
  /** Correlation ID for request-response tracking */
  correlationId: string;
  /** Message payload data */
  payload: TPayload;
  /** Protocol version */
  version: string;
  /** Optional metadata */
  meta?: WSMessageMetadata;
}

export interface WSMessageMetadata {
  /** Message priority */
  priority?: WSMessagePriority;
  /** Source identifier */
  source?: string;
  /** Compression type used */
  compression?: WSCompressionType;
  /** Retry attempt number */
  retryCount?: number;
  /** Request tracing information */
  trace?: WSTraceInfo;
}

export enum WSMessagePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum WSCompressionType {
  NONE = 'none',
  GZIP = 'gzip',
  DEFLATE = 'deflate'
}

export interface WSTraceInfo {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}

// System Message Payloads
export interface WSHelloPayload {
  serverId: string;
  serverTime: string; // ISO 8601
  acceptedVersion: string;
  features: string[];
  heartbeatIntervalMs: number;
  maxMessageSize: number;
  reconnectToken?: string;
}

export interface WSHeartbeatPayload {
  sequenceNumber: number;
  timestamp: number;
  clientId?: string; // Only in pong responses
}

export interface WSSnapshotRequestPayload {
  categories: string[]; // e.g., ['props', 'odds', 'games']
  lastSyncTimestamp?: number;
  checksum?: string;
}

export interface WSSnapshotResponsePayload {
  category: string;
  data: unknown[];
  timestamp: number;
  checksum: string;
  isComplete: boolean;
  sequenceNumber: number;
}

export interface WSErrorPayload {
  code: string;
  message: string;
  category: WSErrorCategory;
  severity: WSErrorSeverity;
  recoverable: boolean;
  suggestedAction?: string;
  retryAfterMs?: number;
  details?: Record<string, unknown>;
}

export enum WSErrorCategory {
  NETWORK = 'network',
  PROTOCOL = 'protocol',
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  SERVER_ERROR = 'server_error',
  CLIENT_ERROR = 'client_error'
}

export enum WSErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Data Message Payloads
export interface WSSubscriptionPayload {
  action: 'subscribe' | 'unsubscribe';
  channel: string;
  filters?: Record<string, unknown>;
  options?: {
    batchSize?: number;
    throttleMs?: number;
    compression?: boolean;
  };
}

export interface WSUpdatePayload {
  channel: string;
  operation: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: number;
  sequenceNumber: number;
}

// Backoff Strategy Configuration
export interface WSBackoffConfig {
  /** Base delay intervals in milliseconds */
  baseDelays: number[];
  /** Maximum delay ceiling in milliseconds */
  maxDelay: number;
  /** Jitter ratio (0-1) for randomization */
  jitterRatio: number;
  /** Maximum number of attempts */
  maxAttempts: number;
  /** Multiplier for exponential backoff */
  multiplier: number;
}

export enum WSBackoffReason {
  NETWORK_ERROR = 'network_error',
  SERVER_ERROR = 'server_error',
  RATE_LIMITED = 'rate_limited',
  AUTHENTICATION_FAILED = 'auth_failed',
  PROTOCOL_ERROR = 'protocol_error',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

export interface WSBackoffState {
  attempt: number;
  nextDelay: number;
  reason: WSBackoffReason;
  lastAttemptTime: number;
  totalBackoffTime: number;
}

// Local Simulation Configuration
export interface WSSimulationConfig {
  /** Enable local simulation mode */
  enabled: boolean;
  /** Synthetic data generation interval */
  updateIntervalMs: number;
  /** Channels to simulate */
  channels: string[];
  /** Data generators for each channel */
  generators: Record<string, () => unknown>;
  /** Show simulation indicators */
  showIndicators: boolean;
}

// Connection State Management
export enum WSConnectionState {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  AUTHENTICATING = 'authenticating',
  HELLO = 'hello',
  READY = 'ready',
  DEGRADED = 'degraded',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed',
  SIMULATION_MODE = 'simulation_mode',
  DISCONNECTED = 'disconnected'
}

export interface WSConnectionHealth {
  /** Current connection state */
  state: WSConnectionState;
  /** Last successful message timestamp */
  lastActivity: number;
  /** Round-trip time for heartbeats */
  latencyMs: number;
  /** Message success rate (0-1) */
  successRate: number;
  /** Reconnection attempts */
  reconnectAttempts: number;
  /** Time in current state */
  stateTime: number;
}

// State Reconciliation
export interface WSStateValidator {
  /** Validate state integrity */
  validateState(state: unknown): WSValidationResult;
  /** Generate state checksum */
  generateChecksum(state: unknown): string;
  /** Compare state checksums */
  compareChecksums(local: string, remote: string): boolean;
  /** Identify state differences */
  diff(localState: unknown, remoteState: unknown): WSStateDiff[];
}

export interface WSValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface WSStateDiff {
  path: string;
  operation: 'add' | 'remove' | 'change';
  oldValue?: unknown;
  newValue?: unknown;
  timestamp: number;
}

// Metrics and Monitoring
export interface WSMetrics {
  /** Connection statistics */
  connections: {
    active: number;
    total: number;
    failed: number;
    reconnects: number;
  };
  /** Message statistics */
  messages: {
    sent: number;
    received: number;
    errors: number;
    retries: number;
  };
  /** Performance metrics */
  performance: {
    avgLatency: number;
    p95Latency: number;
    throughput: number;
    errorRate: number;
  };
}

// Message Type Constants
export const WS_MESSAGE_TYPES = {
  // System messages
  HELLO: 'hello',
  PING: 'ping',
  PONG: 'pong',
  ERROR: 'error',
  
  // State reconciliation
  SNAPSHOT_REQUEST: 'snapshot_request',
  SNAPSHOT_RESPONSE: 'snapshot_response',
  
  // Subscription management
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  SUBSCRIPTION_CONFIRMED: 'subscription_confirmed',
  
  // Data updates
  UPDATE: 'update',
  BATCH_UPDATE: 'batch_update',
  
  // Authentication (future)
  AUTH_REQUEST: 'auth_request',
  AUTH_RESPONSE: 'auth_response',
  TOKEN_REFRESH: 'token_refresh'
} as const;

export type WSMessageType = typeof WS_MESSAGE_TYPES[keyof typeof WS_MESSAGE_TYPES];

// Configuration Constants
export const WS_PROTOCOL_VERSION = '2.0';

export const DEFAULT_BACKOFF_CONFIG: WSBackoffConfig = {
  baseDelays: [1000, 2000, 4000, 8000, 16000],
  maxDelay: 30000,
  jitterRatio: 0.2,
  maxAttempts: 10,
  multiplier: 1.5
};

export const AGGRESSIVE_BACKOFF_CONFIG: WSBackoffConfig = {
  baseDelays: [500, 1000, 2000, 4000],
  maxDelay: 10000,
  jitterRatio: 0.15,
  maxAttempts: 15,
  multiplier: 1.3
};

export const CONSERVATIVE_BACKOFF_CONFIG: WSBackoffConfig = {
  baseDelays: [2000, 4000, 8000, 16000, 32000],
  maxDelay: 60000,
  jitterRatio: 0.25,
  maxAttempts: 5,
  multiplier: 2.0
};

export const DEFAULT_SIMULATION_CONFIG: WSSimulationConfig = {
  enabled: false,
  updateIntervalMs: 5000,
  channels: ['props', 'odds', 'games'],
  generators: {},
  showIndicators: true
};