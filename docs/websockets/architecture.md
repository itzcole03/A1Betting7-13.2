# WebSocket Architecture & Resilience

## Overview

This document describes the resilient WebSocket architecture implemented in A1Betting7-13.2, providing reliable real-time connectivity with graceful fallback and minimal console noise.

## Goals

- **Reliability**: Robust connection management with adaptive reconnection
- **Observability**: Comprehensive diagnostics and state introspection  
- **Testability**: Fully tested state machine and backoff strategies
- **Performance**: Minimal overhead and efficient message handling
- **Developer Experience**: Clear error messages and debugging tools

## Architecture Components

### Backend Endpoints

#### Canonical Endpoint: `/ws/client`

The primary WebSocket endpoint with structured handshake and protocol negotiation.

**URL Pattern:**
```
ws://localhost:8000/ws/client?client_id=<uuid>&version=1&role=frontend
```

**Query Parameters:**
- `client_id` (required): Unique client identifier (UUID recommended)
- `version` (optional, default=1): Protocol version for negotiation
- `role` (optional, default="frontend"): Client role (`frontend`, `admin`, `test`)

**Handshake Flow:**
1. Client connects with query parameters
2. Server validates version and parameters
3. Server sends hello message with capabilities
4. Heartbeat ping/pong cycle begins (25s interval)

**Hello Message Format:**
```json
{
  "type": "hello",
  "server_time": "2025-08-15T10:00:00Z",
  "accepted_version": 1,
  "features": ["heartbeat", "structured_messages", "error_codes", "graceful_reconnect"],
  "request_id": "uuid-here",
  "client_id": "client-uuid",
  "heartbeat_interval_ms": 25000
}
```

#### Legacy Endpoint: `/ws/{client_id}`

Maintained for backward compatibility. Simple echo server without structured handshake.

#### Enhanced Endpoint: `/ws/v2/connect`

Advanced endpoint with room-based subscriptions and authentication (separate from this implementation).

### Frontend Components

#### Connection State Machine

The WebSocket connection follows a well-defined state machine:

```
idle → connecting → open → [degraded] → reconnecting → failed → fallback
  ↑                   ↓         ↓           ↑           ↓
  └─── disconnect ────┘         └──── reconnect cycle ──┘
```

**States:**
- `idle`: No connection, no attempts made
- `connecting`: Initial connection attempt in progress
- `open`: Successfully connected and operational
- `degraded`: Connected but with reduced functionality (reserved for future use)
- `reconnecting`: Attempting to reconnect after connection loss
- `failed`: Connection failed, will retry after backoff delay
- `fallback`: Gave up reconnecting, using local mode

#### Adaptive Backoff Strategy

Implements jittered exponential backoff with configurable parameters:

**Default Production Strategy:**
- Base delays: `[1000, 2000, 4000, 8000, 12000]` ms
- Cap delay: `12000` ms (12 seconds)
- Jitter ratio: `±20%`
- Max attempts: `8`

**Jitter Formula:**
```
final_delay = base_delay + random(-jitter_amount, +jitter_amount)
jitter_amount = base_delay * jitter_ratio
minimum_delay = max(100ms, final_delay)
```

**Other Strategies Available:**
- `BackoffStrategy.createImmediateStrategy()`: For testing (100ms delays)
- `BackoffStrategy.createAggressiveStrategy()`: Faster reconnection (4s cap, 10 attempts)

#### Message Handling

**System Messages:**
- `hello`: Server handshake response
- `ping`/`pong`: Heartbeat keepalive
- `status`: Connection status request/response  
- `error`: Server error responses

**Custom Messages:**
- All non-system messages are forwarded to registered message listeners
- Message type statistics are tracked automatically

#### Error Classification

Connection failures are automatically classified for better diagnostics:

- `network`: DNS, connection refused, network issues
- `handshake`: 4xx responses, version mismatch, invalid parameters
- `server_error`: 5xx responses, server-side errors
- `abnormal`: 1006 close code, unexpected connection loss
- `timeout`: Connection or heartbeat timeout
- `unknown`: Unclassified errors

## Usage

### Basic Usage

```typescript
import { useWebSocketConnection } from '@/websocket/useWebSocketConnection';

function MyComponent() {
  const {
    isConnected,
    isConnecting, 
    isFallback,
    connect,
    disconnect,
    send,
    onMessage
  } = useWebSocketConnection();

  useEffect(() => {
    const unsubscribe = onMessage((message) => {
      console.log('Received:', message);
    });
    return unsubscribe;
  }, [onMessage]);

  const sendTestMessage = () => {
    send({
      type: 'test_message',
      timestamp: new Date().toISOString(),
      payload: { test: 'data' }
    });
  };

  return (
    <div>
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <button onClick={connect} disabled={isConnected}>Connect</button>
      <button onClick={disconnect} disabled={!isConnected}>Disconnect</button>
      <button onClick={sendTestMessage} disabled={!isConnected}>Send Message</button>
    </div>
  );
}
```

### Advanced Configuration

```typescript
import { WebSocketManager } from '@/websocket/WebSocketManager';
import { BackoffStrategy } from '@/websocket/BackoffStrategy';

// Custom backoff strategy
const customStrategy = new BackoffStrategy({
  baseDelaysMs: [500, 1000, 2000],
  capDelayMs: 5000,
  jitterRatio: 0.1,
  maxAttempts: 5
});

// Custom manager configuration
const manager = new WebSocketManager('ws://custom-host:8000', 'my-client-id', {
  connectionTimeoutMs: 15000,
  enableHeartbeat: true,
  version: 1,
  role: 'admin',
  backoffStrategy: customStrategy
});
```

### Diagnostics Panel

Enable the diagnostics panel for development and debugging:

**Activation Methods:**
1. URL parameter: `?wsDebug=1`
2. Global flag: `window.__A1_WS_DEBUG = true`
3. Keyboard shortcut: `Ctrl+Shift+W` (development only)

**Features:**
- Real-time connection state
- Connection statistics and uptime
- Recent connection attempts with error classification
- Manual connection controls (connect, disconnect, reconnect, ping)
- Message type counts
- Server feature capabilities
- Fallback reason display

```typescript
import { WebSocketDiagnosticsWrapper } from '@/diagnostics/WebSocketDiagnosticsPanel';

function App() {
  return (
    <div>
      {/* Your app content */}
      <WebSocketDiagnosticsWrapper />
    </div>
  );
}
```

## Protocol Specification

### Connection Flow

1. **Client Initiation:**
   ```
   GET /ws/client?client_id=abc-123&version=1&role=frontend HTTP/1.1
   Upgrade: websocket
   Connection: Upgrade
   ```

2. **Server Validation:**
   - Validate `version` (currently only `1` supported)
   - Validate `role` (must be `frontend`, `admin`, or `test`)
   - Validate `client_id` format

3. **Handshake Response:**
   ```json
   {
     "type": "hello",
     "server_time": "2025-08-15T10:00:00Z", 
     "accepted_version": 1,
     "features": ["heartbeat", "structured_messages", "error_codes", "graceful_reconnect"],
     "request_id": "req-uuid",
     "client_id": "abc-123",
     "heartbeat_interval_ms": 25000
   }
   ```

4. **Heartbeat Cycle:**
   - Server sends `ping` every 25 seconds
   - Client should respond with `pong`
   - Client can send `ping` at any time

### Error Codes

Custom WebSocket close codes for specific error conditions:

- `4400`: Unsupported protocol version
- `4401`: Invalid client role
- `4500`: Server handshake error

Standard codes:
- `1000`: Normal closure
- `1001`: Going away
- `1006`: Abnormal closure (connection lost)
- `1011`: Server error

### Message Format

All messages follow structured JSON format:

```json
{
  "type": "message_type",
  "timestamp": "2025-08-15T10:00:00Z",
  // Additional fields based on message type
}
```

**Required Fields:**
- `type`: String identifying message type
- `timestamp`: ISO 8601 timestamp

## Implementation Details

### Connection State Management

The `WebSocketManager` class maintains comprehensive connection state:

```typescript
interface WSState {
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
```

### Statistics Tracking

Comprehensive statistics are maintained for monitoring and diagnostics:

```typescript
interface WSConnectionStats {
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
```

### Logging Strategy

Structured logging with duplicate suppression:

- **State Transitions:** `[WS] transition from connecting to open`
- **Connection Attempts:** `[WS] Attempting WebSocket connection`
- **Errors:** `[WS] Connection failed: network timeout`
- **Statistics:** Message counts, heartbeat status, uptime

Duplicate consecutive log entries are suppressed to reduce noise.

## Testing

### Unit Tests

- **BackoffStrategy:** Deterministic jitter, sequence validation, reset behavior
- **WebSocketManager:** State machine transitions, message handling, error classification
- **ConnectionState:** Error classification, failure descriptions

### Integration Tests

- **Backend Handshake:** Protocol validation, error codes, message format
- **Connection Lifecycle:** Connect, disconnect, reconnection cycles
- **Message Exchange:** Ping/pong, custom messages, error handling

### E2E Tests

- **Full Flow:** Frontend + backend integration
- **Diagnostics:** Panel functionality, state display
- **Fallback:** Max attempts, fallback mode activation

## Configuration

### Environment Variables

**Frontend:**
```bash
VITE_WS_URL=ws://localhost:8000          # WebSocket base URL
VITE_WEBSOCKET_ENABLED=true              # Enable/disable WebSocket
```

**Backend:**
```bash
WS_HEARTBEAT_INTERVAL_MS=25000           # Heartbeat interval
WS_CONNECTION_TIMEOUT_MS=30000           # Connection timeout
```

### Runtime Configuration

WebSocket behavior can be configured at runtime:

```typescript
// Enable debug mode
window.__A1_WS_DEBUG = true;

// Custom client ID persistence
localStorage.setItem('ws_client_id', 'my-custom-id');
```

## Migration Guide

### From Legacy WebSocketContext

Replace the old WebSocketContext usage with the new hook:

**Before:**
```typescript
import { _useWebSocket } from '@/contexts/WebSocketContext';

const { status, connected, send } = _useWebSocket();
```

**After:**
```typescript
import { useWebSocketConnection } from '@/websocket/useWebSocketConnection';

const { isConnected, send, state } = useWebSocketConnection();
```

### URL Path Changes

**Old Path (incorrect):**
```
ws://localhost:8000/client_/ws/client_abc-123
```

**New Path (correct):**
```
ws://localhost:8000/ws/client?client_id=abc-123&version=1&role=frontend
```

## Performance Considerations

### Connection Overhead

- Single persistent connection per client
- Automatic reconnection with exponential backoff
- Heartbeat every 25 seconds (minimal overhead)

### Memory Usage

- State history limited to 10 recent attempts
- Message type statistics use Map for O(1) access
- Automatic cleanup of expired data

### Network Efficiency

- JSON message format for structured data
- Compression supported via WebSocket extensions
- Minimal heartbeat payload

## Security Considerations

### Authentication

Currently supports role-based validation:
- `frontend`: Standard user interface
- `admin`: Administrative interface  
- `test`: Testing and development

Future authentication improvements planned:
- JWT token validation
- Session management
- Rate limiting

### Data Validation

- All incoming messages validated as JSON
- Message type validation
- Client ID format validation
- Protocol version negotiation

## Troubleshooting

### Common Issues

**1006 Connection Errors:**
- Usually indicates path mismatch or server unavailable
- Check WebSocket URL construction
- Verify server is running on correct port

**Repeated Reconnection:**
- Check network connectivity
- Verify server endpoint is accessible
- Enable diagnostics panel for detailed state

**Fallback Mode Activation:**
- Indicates max reconnection attempts reached
- Check server logs for connection issues
- Verify query parameters are valid

### Debug Steps

1. **Enable Diagnostics:** Add `?wsDebug=1` to URL
2. **Check Network:** Verify WebSocket endpoint in browser dev tools
3. **Review Logs:** Check both client and server logs
4. **Test Connectivity:** Try manual WebSocket connection
5. **Verify Configuration:** Check environment variables and settings

### Log Analysis

Look for specific log patterns:

```
[WS] transition from connecting to open    # Successful connection
[WS] Connection failed: network timeout    # Network issue
[WS] Entering fallback mode                # Max attempts reached
[WS] Received hello message from server    # Successful handshake
```

## Future Enhancements

### Planned Features

1. **Authentication Integration**
   - JWT token rotation
   - Session validation
   - User-specific channels

2. **Advanced Subscriptions**
   - Topic-based messaging
   - Room management
   - Selective message filtering

3. **Performance Optimizations**
   - Message batching
   - Compression optimization
   - Connection pooling

4. **Monitoring Integration**
   - Metrics export
   - Health checks
   - Performance tracking

### API Evolution

The WebSocket protocol is versioned to allow future enhancements:

**Version 1 (Current):**
- Basic handshake
- Heartbeat support
- Error codes
- Structured messages

**Version 2 (Planned):**
- Authentication tokens
- Channel subscriptions
- Message acknowledgments
- Compression negotiation