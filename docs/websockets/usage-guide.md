# Enhanced WebSocket System - Usage Guide

## Overview

The Enhanced WebSocket system provides a comprehensive, production-ready WebSocket implementation with advanced features including message envelopes, exponential backoff with jitter, local simulation mode, and state reconciliation.

## Quick Start

### 1. Basic Setup

```tsx
import React from 'react';
import { useEnhancedWebSocket } from './websocket/useEnhancedWebSocket';

function MyComponent() {
  const ws = useEnhancedWebSocket({
    url: 'ws://localhost:8000',
    autoConnect: true,
    autoReconnect: true
  });

  return (
    <div>
      Status: {ws.state}
      {ws.isSimulating && <span>🔄 Simulation Active</span>}
    </div>
  );
}
```

### 2. Message Subscription

```tsx
import { useWebSocketMessage } from './websocket/useEnhancedWebSocket';

function PropUpdates() {
  useWebSocketMessage(ws, 'prop_update', (payload) => {
    // Handle prop updates
    setProp(payload.prop);
  });

  useWebSocketMessage(ws, 'odds_change', (payload) => {
    // Handle odds changes  
    setOdds(payload.odds);
  });

  return <div>Receiving live updates...</div>;
}
```

### 3. Request-Response Pattern

```tsx
import { useWebSocketRequest } from './websocket/useEnhancedWebSocket';

function DataFetcher() {
  const { sendRequest, isLoading, error } = useWebSocketRequest(ws);

  const fetchData = async () => {
    try {
      const response = await sendRequest('get_props', {
        sport: 'MLB',
        game_id: '12345'
      });
      setData(response.props);
    } catch (err) {
      console.error('Request failed:', err);
    }
  };

  return (
    <button onClick={fetchData} disabled={isLoading}>
      {isLoading ? 'Loading...' : 'Fetch Props'}
    </button>
  );
}
```

## Configuration Options

### WebSocket Manager Configuration

```tsx
const wsConfig = {
  // Connection settings
  url: 'ws://localhost:8000',
  protocols: ['v2'], // Protocol version
  autoConnect: true,
  autoReconnect: true,
  
  // Backoff strategy
  backoff: {
    strategy: BackoffStrategy.EXPONENTIAL_JITTER,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    multiplier: 2.0,
    jitterPercent: 0.1,
    maxAttempts: 10,
    resetAfterMs: 300000
  },
  
  // Simulation mode
  simulation: {
    enabled: false, // Enable for offline development
    updateIntervalMs: 3000,
    channels: ['props', 'odds', 'games'],
    showIndicators: true,
    generators: {
      // Custom data generators
      props: () => ({ ... }),
      odds: () => ({ ... })
    }
  },
  
  // State reconciliation
  reconciliation: {
    enabled: true,
    snapshotOnConnect: true,
    conflictResolution: 'server_wins',
    batchSize: 100
  },
  
  // Health monitoring
  health: {
    pingIntervalMs: 30000,
    timeoutMs: 5000,
    enableMetrics: true
  },
  
  // Debug options
  debug: false,
  enableCorrelationIds: true,
  messageTimeout: 30000
};

const ws = useEnhancedWebSocket(wsConfig);
```

### Simulation Generators

```tsx
const simulationConfig = {
  enabled: true,
  updateIntervalMs: 2000,
  channels: ['props', 'odds'],
  generators: {
    props: () => ({
      id: Math.random().toString(36),
      player: 'Mike Trout',
      type: 'over_hits',
      line: 1.5 + Math.random(),
      odds: -110 + Math.random() * 40,
      confidence: 0.7 + Math.random() * 0.3
    }),
    
    odds: () => ({
      prop_id: 'existing_prop_id',
      new_odds: -110 + Math.random() * 40,
      movement: Math.random() > 0.5 ? 'up' : 'down',
      timestamp: Date.now()
    })
  },
  showIndicators: true
};
```

## Message Envelope Format

All messages follow the v2.0 protocol envelope:

```typescript
interface WSMessageEnvelope {
  type: string;           // Message type identifier
  ts: number;             // Unix timestamp
  correlationId: string;  // Unique correlation ID
  version: string;        // Protocol version (e.g., "2.0")
  payload: unknown;       // Message payload
  meta?: {                // Optional metadata
    source?: 'server' | 'simulation';
    priority?: 'low' | 'normal' | 'high';
    ttl?: number;
    retryCount?: number;
  };
}
```

### Standard Message Types

```typescript
const WS_MESSAGE_TYPES = {
  // Connection lifecycle
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  PING: 'ping',
  PONG: 'pong',
  
  // Subscription management
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  SUBSCRIPTION_CONFIRMED: 'subscription_confirmed',
  SUBSCRIPTION_ERROR: 'subscription_error',
  
  // Data updates
  PROP_UPDATE: 'prop_update',
  ODDS_CHANGE: 'odds_change',
  GAME_UPDATE: 'game_update',
  NOTIFICATION: 'notification',
  
  // State management
  SNAPSHOT_REQUEST: 'snapshot_request',
  SNAPSHOT_RESPONSE: 'snapshot_response',
  STATE_SYNC: 'state_sync',
  
  // Error handling
  ERROR: 'error',
  RECONNECT_REQUIRED: 'reconnect_required',
  
  // Health monitoring
  HEALTH_CHECK: 'health_check',
  PERFORMANCE_METRICS: 'performance_metrics'
} as const;
```

## Advanced Features

### 1. State Reconciliation

The system automatically reconciles client and server state:

```tsx
// Automatic reconciliation on connect
const ws = useEnhancedWebSocket({
  reconciliation: {
    enabled: true,
    snapshotOnConnect: true,
    categories: ['props', 'odds', 'games'],
    conflictResolution: 'server_wins'
  }
});

// Manual reconciliation
ws.forceReconciliation(['props', 'odds']);

// Register state categories
ws.registerStateCategory('props', {
  getChecksum: (items) => md5(JSON.stringify(items)),
  applySnapshot: (snapshot) => setProps(snapshot),
  applyUpdate: (update) => updateProp(update)
});
```

### 2. Health Monitoring

```tsx
import { useWebSocketHealth } from './websocket/useEnhancedWebSocket';

function HealthIndicator() {
  const health = useWebSocketHealth(ws);
  
  return (
    <div className={health.isHealthy ? 'text-green-500' : 'text-red-500'}>
      Health: {Math.round(health.healthScore * 100)}%
      <div>Latency: {ws.health.latencyMs}ms</div>
      <div>Success Rate: {Math.round(ws.health.successRate * 100)}%</div>
      
      {health.issues.length > 0 && (
        <div>
          Issues: {health.issues.join(', ')}
          <br />
          Recommendations: {health.recommendations.join(', ')}
        </div>
      )}
    </div>
  );
}
```

### 3. Custom Backoff Strategies

```tsx
const customBackoff = {
  strategy: BackoffStrategy.CUSTOM,
  customFunction: (attempt: number, error: Error) => {
    // Custom backoff logic based on error type
    if (error.message.includes('rate_limit')) {
      return Math.min(60000, 5000 * attempt); // Longer delays for rate limits
    }
    return Math.min(30000, 1000 * Math.pow(2, attempt));
  },
  maxAttempts: 15,
  resetAfterMs: 600000
};
```

### 4. Message Filtering and Batching

```tsx
// Subscribe with filters
ws.sendMessage({
  type: 'subscribe',
  payload: {
    channel: 'props',
    filters: {
      sport: 'MLB',
      player_ids: ['123', '456'],
      prop_types: ['over_hits', 'over_runs']
    },
    options: {
      batchSize: 10,        // Batch updates
      throttleMs: 1000,     // Throttle frequency
      deduplicate: true     // Remove duplicates
    }
  }
});
```

## Error Handling

The system provides comprehensive error handling:

```tsx
function ErrorHandler() {
  const ws = useEnhancedWebSocket({
    onError: (error, context) => {
      // Global error handler
      if (error.code === 'WEBSOCKET_CLOSED') {
        // Handle connection loss
        showNotification('Connection lost, attempting to reconnect...');
      } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
        // Handle rate limiting
        showNotification('Rate limit exceeded, backing off...');
      }
    }
  });

  return (
    <div>
      {ws.lastError && (
        <div className="error-banner">
          Error: {ws.lastError.message}
          {ws.lastError.recoverable && (
            <button onClick={ws.clearError}>Retry</button>
          )}
        </div>
      )}
    </div>
  );
}
```

## Performance Considerations

### 1. Message Throttling
- Use `throttleMs` in subscription options to limit message frequency
- Batch related updates using `batchSize` parameter

### 2. Memory Management
- Connection automatically cleans up old messages and correlation IDs
- Simulation mode limits message history to prevent memory leaks

### 3. Health Monitoring
- Automatic latency measurement and success rate tracking
- Configurable ping intervals and timeout detection

### 4. Efficient Subscriptions
- Unsubscribe from unused channels
- Use specific filters to reduce unnecessary messages

## Testing

### Unit Testing

```typescript
// Mock WebSocket for testing
import { EnhancedWebSocketManager } from './EnhancedWebSocketManager';

describe('WebSocket Manager', () => {
  it('should handle connection lifecycle', async () => {
    const manager = new EnhancedWebSocketManager({
      url: 'ws://test',
      simulation: { enabled: true }
    });
    
    await manager.connect();
    expect(manager.state).toBe('READY');
    
    manager.disconnect();
    expect(manager.state).toBe('CLOSED');
  });
  
  it('should simulate data when offline', async () => {
    const manager = new EnhancedWebSocketManager({
      simulation: { 
        enabled: true,
        channels: ['test'],
        generators: {
          test: () => ({ id: 1, data: 'test' })
        }
      }
    });
    
    const messages = [];
    manager.on('test', (msg) => messages.push(msg));
    
    manager.setSimulationMode(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].meta.source).toBe('simulation');
  });
});
```

### Integration Testing

```typescript
// Test with real WebSocket server
describe('WebSocket Integration', () => {
  let server: WebSocketServer;
  let manager: EnhancedWebSocketManager;
  
  beforeAll(() => {
    server = new WebSocketServer({ port: 8080 });
  });
  
  afterAll(() => {
    server.close();
  });
  
  it('should connect to real server', async () => {
    manager = new EnhancedWebSocketManager({
      url: 'ws://localhost:8080'
    });
    
    await manager.connect();
    expect(manager.isConnected).toBe(true);
  });
});
```

## Backend Integration

### Server Implementation Example

```python
# FastAPI WebSocket endpoint supporting v2.0 protocol
from fastapi import WebSocket, WebSocketDisconnect
import json
import asyncio
from datetime import datetime

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            # Receive message envelope
            data = await websocket.receive_text()
            envelope = json.loads(data)
            
            # Validate envelope format
            if not all(k in envelope for k in ['type', 'ts', 'correlationId', 'version', 'payload']):
                await send_error(websocket, "Invalid message envelope")
                continue
            
            # Handle message by type
            if envelope['type'] == 'subscribe':
                await handle_subscription(websocket, envelope)
            elif envelope['type'] == 'snapshot_request':
                await handle_snapshot_request(websocket, envelope)
            elif envelope['type'] == 'ping':
                await send_pong(websocket, envelope['correlationId'])
                
    except WebSocketDisconnect:
        print("Client disconnected")

async def send_message(websocket: WebSocket, message_type: str, payload: dict, correlation_id: str = None):
    envelope = {
        'type': message_type,
        'ts': int(datetime.now().timestamp() * 1000),
        'correlationId': correlation_id or generate_correlation_id(),
        'version': '2.0',
        'payload': payload,
        'meta': {
            'source': 'server'
        }
    }
    
    await websocket.send_text(json.dumps(envelope))
```

## Troubleshooting

### Common Issues

1. **Connection Fails Immediately**
   - Check WebSocket URL and port
   - Verify server is running and accepting connections
   - Check browser console for CORS or security errors

2. **Messages Not Received**
   - Verify subscription was successful
   - Check message type filtering
   - Ensure server is sending messages in correct envelope format

3. **Simulation Mode Not Working**
   - Verify `simulation.enabled` is true
   - Check that generators are properly configured
   - Ensure channels array includes expected message types

4. **High Memory Usage**
   - Check for memory leaks in message handlers
   - Verify old messages are being cleaned up
   - Monitor correlation ID cleanup

5. **Poor Performance**
   - Reduce message frequency with throttling
   - Use batching for bulk updates
   - Optimize message handlers for efficiency

### Debug Mode

Enable debug logging to troubleshoot issues:

```tsx
const ws = useEnhancedWebSocket({
  debug: true, // Enables detailed logging
  health: {
    enableMetrics: true // Tracks performance metrics
  }
});

// Access debug information
console.log('Connection stats:', ws.stats);
console.log('Health metrics:', ws.health);
console.log('Backoff status:', ws.backoffStrategy.getStatus());
```

This completes the Enhanced WebSocket System implementation with comprehensive documentation and examples for production use.