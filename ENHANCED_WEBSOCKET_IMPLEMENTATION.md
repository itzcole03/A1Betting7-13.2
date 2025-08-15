# Enhanced WebSocket System Implementation

This document describes the implementation of the enhanced WebSocket system with subscription rooms, authentication, heartbeat functionality, and user-facing notifications.

## Architecture Overview

The enhanced WebSocket system consists of:

### Backend Components

1. **Enhanced WebSocket Service** (`backend/services/enhanced_websocket_service.py`)
   - Room-based subscription management
   - Pre-connect authentication with JWT tokens
   - Heartbeat/ping-pong keep-alive messages
   - Automatic connection cleanup
   - Redis integration for scalability

2. **Enhanced WebSocket Routes** (`backend/routes/enhanced_websocket_routes.py`)
   - Multiple WebSocket endpoints for different use cases
   - HTTP management endpoints for testing and monitoring
   - Comprehensive error handling

### Frontend Components

1. **WebSocket Manager** (`frontend/src/services/WebSocketManager.ts`)
   - Zustand-based state management
   - Auto-reconnection with exponential backoff
   - Subscription management with filters
   - User-facing notifications

2. **React Hooks** (`frontend/src/hooks/useWebSocketHooks.ts`)
   - Easy-to-use hooks for WebSocket functionality
   - Automatic subscription management
   - Component lifecycle integration

3. **Notification Components** (`frontend/src/components/WebSocketNotifications.tsx`)
   - User-facing connection status indicators
   - Toast notifications for connection events
   - Subscription management UI

4. **Example Dashboard** (`frontend/src/components/LiveWebSocketDashboard.tsx`)
   - Complete integration example
   - Real-time data display
   - Connection management interface

## Key Features

### 🏠 Subscription Rooms

WebSocket clients can subscribe to specific rooms to receive only relevant updates:

```typescript
// Subscribe to MLB odds updates
await webSocketManager.subscribe('odds_updates', { sport: 'MLB' });

// Subscribe to specific game updates
await webSocketManager.subscribe('mlb', { game_id: '12345' });

// Subscribe to player-specific updates
await webSocketManager.subscribe('predictions', { 
  sport: 'MLB', 
  player: 'Aaron Judge' 
});
```

### 🔐 Pre-Connect Authentication

Authentication happens during the WebSocket handshake, not per-message:

```typescript
// Connect with JWT token
const connection = useWebSocketConnection(jwtToken, true);

// Anonymous connection
const connection = useWebSocketConnection(undefined, true);
```

### 💓 Heartbeat Monitoring

Automatic ping-pong messages keep connections alive:

- Server sends ping every 30 seconds
- Client automatically responds with pong
- Connections timeout after 60 seconds of inactivity
- Dead connections are automatically cleaned up

### 🔄 Auto-Reconnection

Robust reconnection with exponential backoff:

- Automatic reconnection on connection loss
- Exponential backoff (2s, 4s, 8s, 16s, 30s max)
- Automatic resubscription to previous rooms
- Maximum 5 reconnection attempts

### 📢 User-Facing Notifications

Connection status and events are shown to users:

- Connection status indicators
- Toast notifications for connection events
- Error messages with resolution suggestions
- No more silent failures or console-only errors

## WebSocket Endpoints

### Main Connection Endpoint

```
WS /ws/v2/connect?token=<jwt_token>
```

Universal WebSocket endpoint supporting all subscription types.

### Specialized Endpoints

```
WS /ws/v2/odds?sport=MLB&sportsbook=DraftKings
WS /ws/v2/arbitrage?min_profit=2.0&sport=NBA  
WS /ws/v2/sport/MLB?game_id=12345&player=Aaron+Judge
WS /ws/v2/portfolio (requires authentication)
```

### Management Endpoints

```
GET /ws/v2/status - WebSocket service status
GET /ws/v2/rooms - Active subscription rooms
GET /ws/v2/connections - Active connections
POST /ws/v2/broadcast/test - Test message broadcast
```

## Message Protocol

### Client to Server Messages

```javascript
{
  "type": "subscribe|unsubscribe|ping|status",
  "subscription_type": "odds_updates|predictions|analytics|arbitrage|mlb|nba|nfl|nhl",
  "filters": {
    "sport": "MLB",
    "game_id": "12345",
    "player": "Aaron Judge",
    "sportsbook": "DraftKings",
    "min_profit": 2.0
  },
  "timestamp": "2025-08-14T12:00:00Z"
}
```

### Server to Client Messages

```javascript
{
  "type": "welcome|subscription_confirmed|odds_update|prediction_update|arbitrage_alert|pong|error",
  "status": "success|error",
  "data": { /* relevant data */ },
  "client_id": "uuid",
  "timestamp": "2025-08-14T12:00:00Z",
  "error": "error message if status is error"
}
```

## Usage Examples

### Basic Connection and Subscription

```typescript
import { useWebSocketConnectionHook, useWebSocketOdds } from '../hooks/useWebSocketHooks';

function MyComponent() {
  // Connect with auto-reconnection
  const connection = useWebSocketConnectionHook(token, true);
  
  // Subscribe to MLB odds updates
  const { odds, isSubscribed } = useWebSocketOdds({ sport: 'MLB' });
  
  return (
    <div>
      <p>Status: {connection.connected ? 'Connected' : 'Disconnected'}</p>
      <p>Odds: {isSubscribed ? `${odds.length} odds available` : 'Not subscribed'}</p>
    </div>
  );
}
```

### Manual Subscription Management

```typescript
import { useWebSocketStore } from '../services/WebSocketManager';

function AdvancedComponent() {
  const { subscribe, unsubscribe, subscriptions } = useWebSocketStore();
  
  const handleSubscribe = async () => {
    await subscribe('arbitrage', { sport: 'NBA', min_profit: 3.0 });
  };
  
  const handleUnsubscribe = async () => {
    await unsubscribe('arbitrage', { sport: 'NBA', min_profit: 3.0 });
  };
  
  return (
    <div>
      <button onClick={handleSubscribe}>Subscribe to NBA Arbitrage</button>
      <button onClick={handleUnsubscribe}>Unsubscribe</button>
      <p>Active subscriptions: {subscriptions.size}</p>
    </div>
  );
}
```

### Connection Status and Notifications

```typescript
import { WebSocketNotificationCenter, WebSocketConnectionStatus } from './WebSocketNotifications';

function AppLayout() {
  return (
    <div>
      {/* Show connection status */}
      <WebSocketConnectionStatus showDetails={true} />
      
      {/* Show notifications */}
      <WebSocketNotificationCenter />
      
      {/* Your app content */}
      <main>...</main>
    </div>
  );
}
```

## Configuration

### Backend Configuration

Set these environment variables:

```bash
# Redis URL for scaling (optional)
REDIS_URL=redis://localhost:6379/0

# JWT Secret for authentication (optional)
JWT_SECRET=your-secret-key

# WebSocket settings
WEBSOCKET_HEARTBEAT_INTERVAL=30
WEBSOCKET_CONNECTION_TIMEOUT=60
WEBSOCKET_MAX_CONNECTIONS=1000
```

### Frontend Configuration

Configure the WebSocket manager:

```typescript
import { useWebSocketStore } from './services/WebSocketManager';

// Configure connection settings
const { setConfig } = useWebSocketStore();

setConfig({
  auto_reconnect: true,
  max_reconnect_attempts: 5,
  reconnect_interval: 2000,
  heartbeat_interval: 30000,
  base_url: 'ws://localhost:8000'
});
```

## Deployment Considerations

### Scaling

The system supports horizontal scaling through Redis:

- Connection state stored in Redis
- Room subscriptions managed across instances
- Message broadcasting across all servers

### Load Balancing

WebSocket connections are sticky, but the system handles:

- Server restarts gracefully
- Automatic failover to healthy instances
- Connection migration during deployments

### Monitoring

Monitor these metrics:

- Active WebSocket connections
- Subscription room count
- Message throughput
- Reconnection rate
- Error rate by type

### Security

Security features implemented:

- JWT token validation
- Connection rate limiting
- Message size limits
- Input validation
- CORS protection

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if backend server is running
   - Verify WebSocket endpoint URLs
   - Check firewall/proxy settings

2. **Authentication Failures**
   - Verify JWT token format and expiration
   - Check JWT secret configuration
   - Ensure token is passed correctly

3. **Subscription Not Working**
   - Check connection status first
   - Verify subscription type and filters
   - Check server logs for room creation

4. **Frequent Disconnections**
   - Check network stability
   - Verify heartbeat settings
   - Review server resource usage

### Debug Information

Access debug information:

```typescript
import { useWebSocketAnalytics } from '../hooks/useWebSocketHooks';

function DebugPanel() {
  const { stats, connectionInfo, subscriptionInfo } = useWebSocketAnalytics();
  
  return (
    <div>
      <h3>Connection Stats</h3>
      <pre>{JSON.stringify(stats, null, 2)}</pre>
      
      <h3>Connection Info</h3>
      <pre>{JSON.stringify(connectionInfo, null, 2)}</pre>
      
      <h3>Subscriptions</h3>
      <pre>{JSON.stringify(subscriptionInfo, null, 2)}</pre>
    </div>
  );
}
```

## Testing

### Backend Tests

```bash
# Test WebSocket service
python -m pytest backend/tests/test_enhanced_websocket.py

# Test WebSocket routes
python -m pytest backend/tests/test_enhanced_websocket_routes.py
```

### Frontend Tests

```bash
# Test WebSocket manager
npm test WebSocketManager.test.ts

# Test React hooks  
npm test useWebSocketHooks.test.ts

# E2E tests
npm run test:e2e websocket.spec.ts
```

### Manual Testing

Use the provided endpoints:

```bash
# Check service status
curl http://localhost:8000/ws/v2/status

# Send test broadcast
curl -X POST http://localhost:8000/ws/v2/broadcast/test \
  -H "Content-Type: application/json" \
  -d '{"subscription_type": "system_alerts", "message": "Test message"}'

# Check active rooms
curl http://localhost:8000/ws/v2/rooms

# Check connections
curl http://localhost:8000/ws/v2/connections
```

## Next Steps

Future enhancements could include:

1. **Message Persistence** - Store messages for offline clients
2. **Message Ordering** - Ensure ordered delivery within rooms  
3. **Batch Updates** - Combine multiple updates into single messages
4. **Compression** - Compress large message payloads
5. **Analytics** - Detailed usage analytics and metrics
6. **Federation** - Multi-region WebSocket deployment

This enhanced WebSocket system provides a robust, scalable foundation for real-time sports betting data with excellent user experience and developer ergonomics.
