/**
 * WebSocketManager Tests
 * 
 * Tests for WebSocket connection management including:
 * - State machine transitions
 * - Connection lifecycle  
 * - Message handling
 * - Error classification
 * - Fallback behavior
 * - Event listeners
 * 
 * Uses mock WebSocket implementation for controlled testing.
 */

import { WebSocketManager } from '../WebSocketManager';
import { BackoffStrategy } from '../BackoffStrategy';
import { WSConnectionPhase, WSMessage } from '../ConnectionState';

// Mock WebSocket implementation
class MockWebSocket implements WebSocket {
  static instances: MockWebSocket[] = [];
  
  readonly CONNECTING = WebSocket.CONNECTING;
  readonly OPEN = WebSocket.OPEN;
  readonly CLOSING = WebSocket.CLOSING;
  readonly CLOSED = WebSocket.CLOSED;
  
  readyState: number = WebSocket.CONNECTING;
  url: string;
  protocol: string = '';
  extensions: string = '';
  bufferedAmount: number = 0;
  binaryType: BinaryType = 'blob';
  
  onopen: ((this: WebSocket, ev: Event) => void) | null = null;
  onclose: ((this: WebSocket, ev: CloseEvent) => void) | null = null;
  onmessage: ((this: WebSocket, ev: MessageEvent) => void) | null = null;
  onerror: ((this: WebSocket, ev: Event) => void) | null = null;
  
  sentMessages: string[] = [];
  
  constructor(url: string | URL) {
    this.url = url.toString();
    MockWebSocket.instances.push(this);
    
    // Simulate async connection
    setTimeout(() => {
      if (this.readyState === WebSocket.CONNECTING) {
        this.readyState = WebSocket.OPEN;
        this.onopen?.(new Event('open'));
      }
    }, 10);
  }
  
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.sentMessages.push(data.toString());
  }
  
  close(code?: number, reason?: string): void {
    if (this.readyState === WebSocket.CLOSED) return;
    
    this.readyState = WebSocket.CLOSED;
    
    const event = {
      code: code || 1000,
      reason: reason || '',
      wasClean: true,
      type: 'close'
    } as CloseEvent;
    
    this.onclose?.(event);
  }
  
  // Test helper methods
  simulateMessage(data: WSMessage): void {
    if (this.readyState !== WebSocket.OPEN) return;
    
    const event = {
      data: JSON.stringify(data),
      type: 'message'
    } as MessageEvent;
    
    this.onmessage?.(event);
  }
  
  simulateError(): void {
    const event = new Event('error');
    this.onerror?.(event);
  }
  
  simulateClose(code: number = 1006, reason: string = ''): void {
    this.readyState = WebSocket.CLOSED;
    
    const event = {
      code,
      reason,
      wasClean: code === 1000,
      type: 'close'
    } as CloseEvent;
    
    this.onclose?.(event);
  }
  
  // Required methods for WebSocket interface
  addEventListener(): void { /* mock */ }
  removeEventListener(): void { /* mock */ }
  dispatchEvent(): boolean { return true; }
  
  static reset(): void {
    MockWebSocket.instances = [];
  }
  
  static getLastInstance(): MockWebSocket | null {
    return MockWebSocket.instances[MockWebSocket.instances.length - 1] || null;
  }
}

// Mock global WebSocket
const originalWebSocket = global.WebSocket;
beforeEach(() => {
  global.WebSocket = MockWebSocket as never;
  MockWebSocket.reset();
  jest.clearAllTimers();
  jest.useFakeTimers();
});

afterEach(() => {
  global.WebSocket = originalWebSocket;
  jest.useRealTimers();
});

describe('WebSocketManager', () => {
  describe('Connection lifecycle', () => {
    it('starts in idle state', () => {
      const manager = new WebSocketManager('ws://test:8000', 'test-client');
      const state = manager.getState();
      
      expect(state.phase).toBe('idle');
      expect(state.client_id).toBe('test-client');
      expect(state.url).toContain('ws://test:8000/ws/client');
      expect(state.url).toContain('client_id=test-client');
      expect(state.url).toContain('version=1');
      expect(state.url).toContain('role=frontend');
    });

    it('transitions through connecting to open state', async () => {
      const manager = new WebSocketManager('ws://test:8000', 'test-client');
      const stateChanges: WSConnectionPhase[] = [];
      
      manager.onStateChange((state) => {
        stateChanges.push(state.phase);
      });
      
      await manager.connect();
      expect(manager.getState().phase).toBe('connecting');
      
      // Wait for mock connection to open
      jest.advanceTimersByTime(20);
      
      expect(stateChanges).toEqual(['connecting', 'open']);
      expect(manager.getState().phase).toBe('open');
    });

    it('handles hello message from server', async () => {
      const manager = new WebSocketManager('ws://test:8000', 'test-client');
      
      await manager.connect();
      jest.advanceTimersByTime(20); // Open connection
      
      const mockWs = MockWebSocket.getLastInstance()!;
      mockWs.simulateMessage({
        type: 'hello',
        timestamp: new Date().toISOString(),
        server_time: '2025-08-15T10:00:00Z',
        accepted_version: 1,
        features: ['heartbeat', 'structured_messages'],
        request_id: 'test-request',
        client_id: 'test-client',
        heartbeat_interval_ms: 25000
      });
      
      const state = manager.getState();
      expect(state.last_hello_message).toBeTruthy();
      expect(state.connection_features).toEqual(['heartbeat', 'structured_messages']);
    });

    it('disconnects cleanly', async () => {
      const manager = new WebSocketManager('ws://test:8000', 'test-client');
      
      await manager.connect();
      jest.advanceTimersByTime(20);
      
      expect(manager.getState().phase).toBe('open');
      
      manager.disconnect();
      expect(manager.getState().phase).toBe('idle');
    });
  });

  describe('Messaging', () => {
    it('sends messages when connected', async () => {
      const manager = new WebSocketManager('ws://test:8000', 'test-client');
      
      await manager.connect();
      jest.advanceTimersByTime(20);
      
      const message: WSMessage = {
        type: 'test',
        timestamp: new Date().toISOString(),
        data: 'hello'
      };
      
      const sent = manager.send(message);
      expect(sent).toBe(true);
      
      const mockWs = MockWebSocket.getLastInstance()!;
      expect(mockWs.sentMessages).toHaveLength(1);
      expect(JSON.parse(mockWs.sentMessages[0])).toEqual(message);
      
      // Check stats updated
      const state = manager.getState();
      expect(state.stats.messages_sent).toBe(1);
    });

    it('fails to send when not connected', () => {
      const manager = new WebSocketManager('ws://test:8000', 'test-client');
      
      const message: WSMessage = {
        type: 'test',
        timestamp: new Date().toISOString()
      };
      
      const sent = manager.send(message);
      expect(sent).toBe(false);
    });

    it('handles ping/pong messages', async () => {
      const manager = new WebSocketManager('ws://test:8000', 'test-client');
      
      await manager.connect();
      jest.advanceTimersByTime(20);
      
      // Send ping
      const pingSent = manager.ping();
      expect(pingSent).toBe(true);
      
      const mockWs = MockWebSocket.getLastInstance()!;
      const sentMessage = JSON.parse(mockWs.sentMessages[0]);
      expect(sentMessage.type).toBe('ping');
      
      // Receive pong
      mockWs.simulateMessage({
        type: 'pong',
        timestamp: new Date().toISOString(),
        client_id: 'test-client'
      });
      
      const state = manager.getState();
      expect(state.stats.heartbeats_sent).toBe(1);
      expect(state.stats.heartbeats_received).toBe(1);
    });

    it('forwards non-system messages to listeners', async () => {
      const manager = new WebSocketManager('ws://test:8000', 'test-client');
      const messages: WSMessage[] = [];
      
      manager.onMessage((msg) => messages.push(msg));
      
      await manager.connect();
      jest.advanceTimersByTime(20);
      
      const testMessage: WSMessage = {
        type: 'custom_data',
        timestamp: new Date().toISOString(),
        payload: { test: 'data' }
      };
      
      const mockWs = MockWebSocket.getLastInstance()!;
      mockWs.simulateMessage(testMessage);
      
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual(testMessage);
    });
  });

  describe('Reconnection and backoff', () => {
    it('attempts reconnection on abnormal close', async () => {
      const immediateStrategy = BackoffStrategy.createImmediateStrategy();
      const manager = new WebSocketManager('ws://test:8000', 'test-client', {
        backoffStrategy: immediateStrategy
      });
      
      await manager.connect();
      jest.advanceTimersByTime(20);
      
      expect(manager.getState().phase).toBe('open');
      
      // Simulate abnormal close
      const mockWs = MockWebSocket.getLastInstance()!;
      mockWs.simulateClose(1006, 'Connection lost');
      
      expect(manager.getState().phase).toBe('failed');
      
      // Advance timer for immediate reconnection
      jest.advanceTimersByTime(150);
      
      expect(manager.getState().phase).toBe('reconnecting');
      
      // Let new connection open
      jest.advanceTimersByTime(20);
      
      expect(manager.getState().phase).toBe('open');
    });

    it('enters fallback mode after max attempts', async () => {
      const quickFailStrategy = new BackoffStrategy({
        baseDelaysMs: [50],
        maxAttempts: 2,
        jitterRatio: 0
      });
      
      const manager = new WebSocketManager('ws://test:8000', 'test-client', {
        backoffStrategy: quickFailStrategy
      });
      
      // Mock WebSocket to always fail
      global.WebSocket = class extends MockWebSocket {
        constructor(url: string | URL) {
          super(url);
          setTimeout(() => {
            this.simulateClose(1006, 'Connection failed');
          }, 5);
        }
      } as never;
      
      await manager.connect();
      
      // First attempt fails
      jest.advanceTimersByTime(10);
      expect(manager.getState().phase).toBe('failed');
      
      // Second attempt after backoff  
      jest.advanceTimersByTime(60);
      expect(manager.getState().phase).toBe('reconnecting');
      
      // Second attempt fails
      jest.advanceTimersByTime(10);
      expect(manager.getState().phase).toBe('failed');
      
      // Should enter fallback after max attempts
      jest.advanceTimersByTime(60);
      
      const state = manager.getState();
      expect(state.phase).toBe('fallback');
      expect(state.is_fallback_mode).toBe(true);
      expect(state.fallback_reason).toContain('maximum attempts');
    });

    it('resets backoff strategy on successful connection', async () => {
      const strategy = new BackoffStrategy({
        baseDelaysMs: [100, 200],
        maxAttempts: 5,
        jitterRatio: 0
      });
      
      const manager = new WebSocketManager('ws://test:8000', 'test-client', {
        backoffStrategy: strategy
      });
      
      // First connection fails
      global.WebSocket = class extends MockWebSocket {
        constructor(url: string | URL) {
          super(url);
          setTimeout(() => {
            this.simulateClose(1006);
          }, 5);
        }
      } as never;
      
      await manager.connect();
      jest.advanceTimersByTime(10);
      
      // Now allow connections to succeed
      global.WebSocket = MockWebSocket as never;
      
      jest.advanceTimersByTime(110); // Wait for backoff
      jest.advanceTimersByTime(20);  // Connection succeeds
      
      expect(manager.getState().phase).toBe('open');
      
      // Disconnect and reconnect - should start from first delay again
      manager.disconnect();
      
      // Mock a quick failure again
      global.WebSocket = class extends MockWebSocket {
        constructor(url: string | URL) {
          super(url);
          setTimeout(() => {
            this.simulateClose(1006);
          }, 5);
        }
      } as never;
      
      await manager.connect();
      jest.advanceTimersByTime(10);
      
      // Should start with first delay (100ms), not second (200ms)
      const state = manager.getState();
      expect(state.current_attempt?.next_retry_eta).toBeTruthy();
    });
  });

  describe('Error handling', () => {
    it('classifies connection errors correctly', async () => {
      const manager = new WebSocketManager('ws://test:8000', 'test-client');
      const errors: Array<{ error: Error; context: string }> = [];
      
      manager.onError((error, context) => {
        errors.push({ error, context });
      });
      
      await manager.connect();
      
      const mockWs = MockWebSocket.getLastInstance()!;
      mockWs.simulateError();
      
      expect(errors).toHaveLength(1);
      expect(errors[0].context).toBe('websocket_error');
    });

    it('tracks recent connection attempts with classifications', async () => {
      const manager = new WebSocketManager('ws://test:8000', 'test-client');
      
      await manager.connect();
      jest.advanceTimersByTime(20);
      
      const mockWs = MockWebSocket.getLastInstance()!;
      mockWs.simulateClose(4400, 'Unsupported version');
      
      const state = manager.getState();
      expect(state.recent_attempts).toHaveLength(1);
      
      const attempt = state.recent_attempts[0];
      expect(attempt.close_code).toBe(4400);
      expect(attempt.close_reason).toBe('Unsupported version');
      expect(attempt.classification).toBe('handshake');
    });
  });

  describe('Event listeners', () => {
    it('notifies state change listeners', async () => {
      const manager = new WebSocketManager('ws://test:8000', 'test-client');
      const stateChanges: WSConnectionPhase[] = [];
      
      const unsubscribe = manager.onStateChange((state) => {
        stateChanges.push(state.phase);
      });
      
      await manager.connect();
      jest.advanceTimersByTime(20);
      
      expect(stateChanges).toEqual(['connecting', 'open']);
      
      unsubscribe();
      
      manager.disconnect();
      
      // Should not receive more updates after unsubscribe
      expect(stateChanges).toEqual(['connecting', 'open']);
    });

    it('handles listener errors gracefully', async () => {
      const manager = new WebSocketManager('ws://test:8000', 'test-client');
      
      // Add a listener that throws an error
      manager.onStateChange(() => {
        throw new Error('Listener error');
      });
      
      // Should not throw when state changes
      expect(() => {
        manager.connect();
      }).not.toThrow();
    });
  });

  describe('Statistics tracking', () => {
    it('tracks message counts by type', async () => {
      const manager = new WebSocketManager('ws://test:8000', 'test-client');
      
      await manager.connect();
      jest.advanceTimersByTime(20);
      
      const mockWs = MockWebSocket.getLastInstance()!;
      
      // Send different message types
      mockWs.simulateMessage({ type: 'data', timestamp: new Date().toISOString() });
      mockWs.simulateMessage({ type: 'data', timestamp: new Date().toISOString() });
      mockWs.simulateMessage({ type: 'alert', timestamp: new Date().toISOString() });
      
      const state = manager.getState();
      expect(state.stats.message_counts_by_type.data).toBe(2);
      expect(state.stats.message_counts_by_type.alert).toBe(1);
      expect(state.stats.messages_received).toBe(3);
    });

    it('tracks connection uptime', async () => {
      const manager = new WebSocketManager('ws://test:8000', 'test-client');
      
      await manager.connect();
      jest.advanceTimersByTime(20);
      
      // Simulate some time passing
      jest.advanceTimersByTime(5000);
      
      const state = manager.getState();
      expect(state.stats.current_uptime_ms).toBeGreaterThan(0);
    });
  });

  describe('Resource cleanup', () => {
    it('cleans up resources on destroy', async () => {
      const manager = new WebSocketManager('ws://test:8000', 'test-client');
      
      await manager.connect();
      jest.advanceTimersByTime(20);
      
      expect(manager.getState().phase).toBe('open');
      
      manager.destroy();
      
      expect(manager.getState().phase).toBe('idle');
      expect(MockWebSocket.getLastInstance()?.readyState).toBe(WebSocket.CLOSED);
    });
  });
});