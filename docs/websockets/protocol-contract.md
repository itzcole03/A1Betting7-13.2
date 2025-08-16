# WebSocket Protocol Contract v2.0

## Overview

This document defines the standardized WebSocket protocol contract for A1Betting7-13.2, including message envelope format, backoff strategies, local simulation mode, and state reconciliation procedures.

## Message Envelope Format

All WebSocket messages MUST use the standardized envelope format:

```typescript
interface WSMessageEnvelope<TPayload = unknown> {
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
  meta?: {
    /** Message priority */
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
    /** Source identifier */
    source?: string;
    /** Compression type used */
    compression?: 'none' | 'gzip' | 'deflate';
    /** Retry attempt number */
    retryCount?: number;
    /** Request tracing information */
    trace?: {
      traceId: string;
      spanId: string;
      parentSpanId?: string;
    };
  };
}
```

### Required Fields

- **type**: String identifier for message type (e.g., 'hello', 'ping', 'pong', 'data', 'error')
- **ts**: Unix timestamp in milliseconds when message was created
- **correlationId**: UUID v4 string for correlating requests/responses
- **payload**: The actual message data (type depends on message type)
- **version**: Protocol version string (current: "2.0")

### Optional Fields

- **meta**: Additional metadata for message handling, tracing, and debugging

## Message Types

### System Messages

#### Hello (Server → Client)
Sent immediately after WebSocket connection establishment.

```typescript
interface HelloPayload {
  serverId: string;
  serverTime: string; // ISO 8601
  acceptedVersion: string;
  features: string[];
  heartbeatIntervalMs: number;
  maxMessageSize: number;
  reconnectToken?: string;
}
```

#### Ping/Pong (Bidirectional)
Heartbeat mechanism to maintain connection health.

```typescript
interface HeartbeatPayload {
  sequenceNumber: number;
  timestamp: number;
  clientId?: string; // Only in pong responses
}
```

#### Snapshot Request/Response (Bidirectional)
State reconciliation mechanism.

```typescript
interface SnapshotRequestPayload {
  categories: string[]; // e.g., ['props', 'odds', 'games']
  lastSyncTimestamp?: number;
  checksum?: string;
}

interface SnapshotResponsePayload {
  category: string;
  data: unknown[];
  timestamp: number;
  checksum: string;
  isComplete: boolean;
  sequenceNumber: number;
}
```

#### Error (Bidirectional)
Error reporting with categorization and recovery suggestions.

```typescript
interface ErrorPayload {
  code: string;
  message: string;
  category: 'network' | 'protocol' | 'authentication' | 'rate_limit' | 'server_error' | 'client_error';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recoverable: boolean;
  suggestedAction?: string;
  retryAfterMs?: number;
  details?: Record<string, unknown>;
}
```

### Data Messages

#### Subscription (Client → Server)
Subscribe to real-time data streams.

```typescript
interface SubscriptionPayload {
  action: 'subscribe' | 'unsubscribe';
  channel: string;
  filters?: Record<string, unknown>;
  options?: {
    batchSize?: number;
    throttleMs?: number;
    compression?: boolean;
  };
}
```

#### Update (Server → Client)
Real-time data updates.

```typescript
interface UpdatePayload {
  channel: string;
  operation: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: number;
  sequenceNumber: number;
}
```

## Backoff Strategy with Jitter

### Strategy Configuration

```typescript
interface BackoffConfig {
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
```

### Default Production Strategy

```typescript
const PRODUCTION_BACKOFF: BackoffConfig = {
  baseDelays: [1000, 2000, 4000, 8000, 16000],
  maxDelay: 30000,
  jitterRatio: 0.2,
  maxAttempts: 10,
  multiplier: 1.5
};
```

### Jitter Calculation

```typescript
function calculateDelay(attempt: number, config: BackoffConfig): number {
  const baseIndex = Math.min(attempt, config.baseDelays.length - 1);
  const baseDelay = config.baseDelays[baseIndex];
  
  // Apply exponential multiplier for attempts beyond base delays
  const exponentialDelay = attempt >= config.baseDelays.length 
    ? baseDelay * Math.pow(config.multiplier, attempt - config.baseDelays.length + 1)
    : baseDelay;
  
  // Cap at maximum delay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
  
  // Apply jitter
  const jitterAmount = cappedDelay * config.jitterRatio;
  const jitter = (Math.random() - 0.5) * 2 * jitterAmount;
  
  return Math.max(100, Math.floor(cappedDelay + jitter));
}
```

### Reason Codes

Backoff strategies include reason codes for different failure types:

```typescript
enum BackoffReason {
  NETWORK_ERROR = 'network_error',
  SERVER_ERROR = 'server_error', 
  RATE_LIMITED = 'rate_limited',
  AUTHENTICATION_FAILED = 'auth_failed',
  PROTOCOL_ERROR = 'protocol_error',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

interface BackoffState {
  attempt: number;
  nextDelay: number;
  reason: BackoffReason;
  lastAttemptTime: number;
  totalBackoffTime: number;
}
```

## Local Simulation Mode

When the backend is unavailable, the WebSocket manager enters local simulation mode to provide a consistent experience with synthetic data.

### Activation Conditions

- Backend connection fails after max retry attempts
- Network connectivity issues detected
- Server returns permanent failure codes (4xx range)
- Explicit activation via configuration

### Simulation Features

```typescript
interface SimulationConfig {
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
```

### Synthetic Data Generation

```typescript
interface SyntheticDataGenerator {
  /** Generate realistic prop betting data */
  generateProps(): PropUpdate[];
  /** Generate odds changes */
  generateOdds(): OddsUpdate[];
  /** Generate game events */
  generateGameEvents(): GameEvent[];
  /** Generate user notifications */
  generateNotifications(): Notification[];
}
```

### Visual Indicators

All synthetic data is clearly labeled to avoid confusion:

- Message envelope includes `meta.source = 'simulation'`
- UI displays simulation badges/indicators
- Console warnings about simulation mode
- Different styling for simulated data

### Example Synthetic Message

```typescript
const syntheticMessage: WSMessageEnvelope<PropUpdate> = {
  type: 'prop_update',
  ts: Date.now(),
  correlationId: 'sim-' + uuid(),
  payload: {
    gameId: 'sim-game-123',
    propType: 'player_hits',
    playerId: 'sim-player-456',
    odds: -110 + Math.random() * 20 - 10, // Realistic variation
    line: 2.5,
    updated: new Date().toISOString()
  },
  version: '2.0',
  meta: {
    source: 'simulation',
    priority: 'NORMAL',
    compression: 'none'
  }
};
```

## State Reconciliation

State reconciliation ensures client and server state consistency, especially after connection interruptions.

### Reconciliation Process

1. **Connection Establishment**: Client connects and receives hello message
2. **Snapshot Request**: Client requests current state snapshot
3. **Snapshot Delivery**: Server sends complete state in chunks
4. **State Validation**: Client validates received state
5. **Delta Sync**: Server sends only changes after snapshot timestamp
6. **Periodic Sync**: Regular state checksum verification

### Snapshot Request Flow

```typescript
// Client requests snapshot on connection
const snapshotRequest: WSMessageEnvelope<SnapshotRequestPayload> = {
  type: 'snapshot_request',
  ts: Date.now(),
  correlationId: uuid(),
  payload: {
    categories: ['props', 'odds', 'games'],
    lastSyncTimestamp: lastKnownTimestamp,
    checksum: currentStateChecksum
  },
  version: '2.0'
};

// Server responds with snapshot data
const snapshotResponse: WSMessageEnvelope<SnapshotResponsePayload> = {
  type: 'snapshot_response',
  ts: Date.now(),
  correlationId: request.correlationId,
  payload: {
    category: 'props',
    data: [...propsData],
    timestamp: Date.now(),
    checksum: 'sha256-hash',
    isComplete: true,
    sequenceNumber: 1
  },
  version: '2.0'
};
```

### Conflict Resolution

When state conflicts are detected:

1. **Server Authority**: Server state takes precedence by default
2. **Timestamp Comparison**: Most recent timestamp wins
3. **User Preference**: User-modified data preserved when possible
4. **Conflict Notification**: User notified of significant conflicts

### State Validation

```typescript
interface StateValidator {
  /** Validate state integrity */
  validateState(state: unknown): ValidationResult;
  /** Generate state checksum */
  generateChecksum(state: unknown): string;
  /** Compare state checksums */
  compareChecksums(local: string, remote: string): boolean;
  /** Identify state differences */
  diff(localState: unknown, remoteState: unknown): StateDiff[];
}

interface StateDiff {
  path: string;
  operation: 'add' | 'remove' | 'change';
  oldValue?: unknown;
  newValue?: unknown;
  timestamp: number;
}
```

## Connection Lifecycle

### State Machine

```
idle → connecting → authenticating → hello → ready → [degraded] → reconnecting
  ↑                                                      ↓               ↓
  └── disconnected ← failed ← max_attempts_reached ──────┘               ↓
                        ↑                                                 ↓
                        └── simulation_mode ← fallback ←─────────────────┘
```

### State Transitions

- **idle**: No connection attempted
- **connecting**: TCP handshake in progress
- **authenticating**: Authentication in progress (future)
- **hello**: Waiting for server hello message
- **ready**: Fully operational with state synchronized
- **degraded**: Connected but with limited functionality
- **reconnecting**: Attempting to reconnect after failure
- **failed**: Connection failed, will retry
- **simulation_mode**: Local simulation active
- **disconnected**: Intentionally disconnected

### Health Monitoring

```typescript
interface ConnectionHealth {
  /** Current connection state */
  state: ConnectionState;
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
```

## Error Handling

### Error Categories

1. **Network Errors**: Connection timeouts, DNS failures, network unreachable
2. **Protocol Errors**: Invalid messages, version mismatches, malformed data
3. **Authentication Errors**: Invalid tokens, expired sessions, insufficient permissions
4. **Rate Limiting**: Too many requests, quota exceeded, throttling active
5. **Server Errors**: Internal server errors, service unavailable, database errors
6. **Client Errors**: Invalid requests, malformed payloads, logic errors

### Error Recovery

```typescript
interface ErrorRecoveryStrategy {
  /** Determine if error is recoverable */
  isRecoverable(error: ErrorPayload): boolean;
  /** Calculate retry delay */
  getRetryDelay(error: ErrorPayload, attempt: number): number;
  /** Apply recovery action */
  recover(error: ErrorPayload): Promise<void>;
  /** Escalate unrecoverable errors */
  escalate(error: ErrorPayload): void;
}
```

## Security Considerations

### Message Validation

- All incoming messages validated against schema
- Payload size limits enforced
- Rate limiting per client
- Content sanitization for user data

### Authentication (Future)

- JWT token validation during handshake
- Token refresh mechanism
- Role-based access control
- Session management

### Data Protection

- No sensitive data in debug logs
- Correlation IDs for audit trails
- Message encryption for sensitive data
- CORS restrictions enforced

## Performance Considerations

### Message Optimization

- Binary encoding for large payloads
- Compression for repetitive data
- Message batching for high-frequency updates
- Delta updates instead of full snapshots

### Connection Management

- Connection pooling for multiple instances
- Load balancing across server instances
- Graceful shutdown procedures
- Resource cleanup on disconnect

### Memory Management

- Message history limits
- Automatic cleanup of old correlation IDs
- State pruning for inactive channels
- Garbage collection of unused resources

## Monitoring and Observability

### Metrics Collection

```typescript
interface WSMetrics {
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
```

### Health Checks

- Connection status monitoring
- Message flow validation
- State consistency checks
- Performance threshold alerting

## Testing Strategy

### Unit Tests

- Message envelope validation
- Backoff calculation correctness
- State machine transitions
- Error handling paths

### Integration Tests

- Full connection lifecycle
- State reconciliation flows
- Simulation mode activation
- Error recovery scenarios

### Load Tests

- High-frequency message handling
- Concurrent connection limits
- Memory usage under load
- Connection storm resilience

## Migration Path

### Version Compatibility

- Backward compatibility with v1.0 protocol
- Graceful degradation for unsupported features
- Version negotiation during handshake
- Migration utilities for existing data

### Rollout Strategy

- Feature flags for new protocol features
- A/B testing for performance validation
- Gradual rollout with monitoring
- Rollback procedures if issues detected

## Future Enhancements

### Planned Features

- **Authentication Integration**: JWT tokens, RBAC, session management
- **Advanced Subscriptions**: Topic filters, data transformations, aggregations
- **Federation**: Multi-region WebSocket deployment
- **Analytics**: Usage metrics, performance insights, business intelligence
- **Machine Learning**: Predictive reconnection, anomaly detection, optimization

### API Evolution

The protocol is designed for evolution:
- Versioned message formats
- Feature negotiation
- Backward compatibility guarantees
- Extension points for custom features