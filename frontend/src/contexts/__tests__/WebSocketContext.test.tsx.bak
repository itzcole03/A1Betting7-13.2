import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { _WebSocketProvider, _useWebSocket } from '../WebSocketContext';

function TestComponent() {
  const ctx = _useWebSocket();
  return <div data-testid='ws-context'>{ctx ? 'context-present' : 'context-absent'}</div>;
}

describe('WebSocketContext', () => {
  let originalWebSocket: any;
  let originalEnv: any;
  beforeAll(() => {
    originalWebSocket = global.WebSocket;
    originalEnv = process.env;
  });
  afterAll(() => {
    global.WebSocket = originalWebSocket;
    process.env = originalEnv;
  });

  function setupMockWebSocket() {
    let wsInstance: any = null;
    const wsMock = jest.fn().mockImplementation(() => {
      wsInstance = {
        readyState: 1,
        send: jest.fn(),
        close: jest.fn(),
        // Initialize hooks as functions to prevent undefined errors
        _onclose: () => {},
        _onerror: () => {},
        _onmessage: () => {},
        set onopen(fn: ((this: WebSocket, ev: Event) => any) | null) {
          setTimeout(() => fn && fn.call(wsInstance, new Event('open')), 10);
        },
        set onclose(fn: ((this: WebSocket, ev: CloseEvent) => any) | null) {
          (this as any)._onclose = fn;
        },
        set onerror(fn: ((this: WebSocket, ev: Event) => any) | null) {
          (this as any)._onerror = fn;
        },
        set onmessage(fn: ((this: WebSocket, ev: MessageEvent) => any) | null) {
          (this as any)._onmessage = fn;
        },
      };
      return wsInstance;
    });
    // Add static properties to mock
    (wsMock as any).CONNECTING = 0;
    (wsMock as any).OPEN = 1;
    (wsMock as any).CLOSING = 2;
    (wsMock as any).CLOSED = 3;
    global.WebSocket = wsMock as any;
    return wsInstance;
  }

  it('provides default values', () => {
    // Enable WebSocket for this test
    process.env.VITE_WEBSOCKET_ENABLED = 'true';
    // Also set on window for compatibility
    (global.window as any).__VITE_ENV__ = { VITE_WEBSOCKET_ENABLED: 'true' };
    
    render(
      <_WebSocketProvider>
        <TestComponent />
      </_WebSocketProvider>
    );
    expect(screen.getByTestId('ws-context')).toHaveTextContent('context-present');
  });

  it('handles transient connection failures and recovery', async () => {
    // Enable WebSocket for this test
    process.env.VITE_WEBSOCKET_ENABLED = 'true';
    // Also set on window for compatibility
    (global.window as any).__VITE_ENV__ = { VITE_WEBSOCKET_ENABLED: 'true' };
    
    let wsInstance: any;
    let onopenHandler: ((this: WebSocket, ev: Event) => any) | null = null;
    const wsMock = jest.fn().mockImplementation(() => {
      wsInstance = {
        readyState: 1,
        send: jest.fn(),
        close: jest.fn(),
        // Initialize hooks as functions to prevent undefined errors
        _onclose: () => {},
        _onerror: () => {},
        _onmessage: () => {},
        set onopen(fn: ((this: WebSocket, ev: Event) => any) | null) {
          onopenHandler = fn;
          // Simulate immediate connection for test
          setTimeout(() => {
            if (fn) {
              fn.call(wsInstance, new Event('open'));
            }
          }, 10);
        },
        set onclose(fn: ((this: WebSocket, ev: CloseEvent) => any) | null) {
          (this as any)._onclose = fn;
        },
        set onerror(fn: ((this: WebSocket, ev: Event) => any) | null) {
          (this as any)._onerror = fn;
        },
        set onmessage(fn: ((this: WebSocket, ev: MessageEvent) => any) | null) {
          (this as any)._onmessage = fn;
        },
        // Method to manually trigger onopen for testing
        triggerOpen: () => {
          if (onopenHandler) {
            onopenHandler.call(wsInstance, new Event('open'));
          }
        }
      };
      return wsInstance;
    });
    (wsMock as any).CONNECTING = 0;
    (wsMock as any).OPEN = 1;
    (wsMock as any).CLOSING = 2;
    (wsMock as any).CLOSED = 3;
    global.WebSocket = wsMock as any;

    function StatusComponent() {
      const ctx = _useWebSocket();
      return <div data-testid='ws-status'>{ctx.status}</div>;
    }

    render(
      <_WebSocketProvider>
        <StatusComponent />
      </_WebSocketProvider>
    );

    // Wait for initial connection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // Should be connected initially
    expect(screen.getByTestId('ws-status').textContent).toBe('connected');

    // Simulate close event (transient failure)
    await act(async () => {
      if (wsInstance && wsInstance._onclose) {
        wsInstance._onclose({ code: 1006, reason: 'test', wasClean: false });
      }
    });

    // Should enter disconnected state after close
    expect(screen.getByTestId('ws-status').textContent).toBe('disconnected');

    // Simulate recovery by triggering onopen
    await act(async () => {
      if (wsInstance && wsInstance.triggerOpen) {
        wsInstance.triggerOpen();
      }
    });

    // Should be connected after recovery
    expect(screen.getByTestId('ws-status').textContent).toBe('connected');
  });

  it('reconnects immediately on network online event', async () => {
    // Enable WebSocket for this test
    process.env.VITE_WEBSOCKET_ENABLED = 'true';
    // Also set on window for compatibility
    (global.window as any).__VITE_ENV__ = { VITE_WEBSOCKET_ENABLED: 'true' };
    
    let wsInstance: any;
    const wsMock = jest.fn().mockImplementation(() => {
      wsInstance = {
        readyState: 1,
        send: jest.fn(),
        close: jest.fn(),
        set onopen(fn: ((this: WebSocket, ev: Event) => any) | null) {
          setTimeout(() => fn && fn.call(wsInstance, new Event('open')), 10);
        },
        set onclose(fn: ((this: WebSocket, ev: CloseEvent) => any) | null) {
          (this as any)._onclose = fn;
        },
        set onerror(fn: ((this: WebSocket, ev: Event) => any) | null) {
          (this as any)._onerror = fn;
        },
        set onmessage(fn: ((this: WebSocket, ev: MessageEvent) => any) | null) {
          (this as any)._onmessage = fn;
        },
        // Initialize hooks as functions to prevent undefined errors
        _onclose: () => {},
        _onerror: () => {},
        _onmessage: () => {},
      };
      return wsInstance;
    });
    (wsMock as any).CONNECTING = 0;
    (wsMock as any).OPEN = 1;
    (wsMock as any).CLOSING = 2;
    (wsMock as any).CLOSED = 3;
    global.WebSocket = wsMock as any;
    
    function StatusComponent() {
      const ctx = _useWebSocket();
      return <div data-testid='ws-status'>{ctx.status}</div>;
    }
    
    render(
      <_WebSocketProvider>
        <StatusComponent />
      </_WebSocketProvider>
    );
    
    // Wait for initial connection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });
    
    // Simulate offline event
    await act(async () => {
      window.dispatchEvent(new Event('offline'));
    });
    
    expect(screen.getByTestId('ws-status').textContent).toBe('disconnected');
    
    // Simulate online event - this should trigger reconnection
    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });
    
    // Should enter reconnecting state immediately
    expect(screen.getByTestId('ws-status').textContent).toBe('reconnecting');
  });

  it('exposes lastError in context on error', async () => {
    // Enable WebSocket for this test
    process.env.VITE_WEBSOCKET_ENABLED = 'true';
    // Also set on window for compatibility
    (global.window as any).__VITE_ENV__ = { VITE_WEBSOCKET_ENABLED: 'true' };
    
    let wsInstance: any;
    const wsMock = jest.fn().mockImplementation(() => {
      wsInstance = {
        readyState: 1,
        send: jest.fn(),
        close: jest.fn(),
        set onopen(fn: ((this: WebSocket, ev: Event) => any) | null) {
          setTimeout(() => fn && fn.call(wsInstance, new Event('open')), 10);
        },
        set onclose(fn: ((this: WebSocket, ev: CloseEvent) => any) | null) {
          (this as any)._onclose = fn;
        },
        set onerror(fn: ((this: WebSocket, ev: Event) => any) | null) {
          (this as any)._onerror = fn;
        },
        set onmessage(fn: ((this: WebSocket, ev: MessageEvent) => any) | null) {
          (this as any)._onmessage = fn;
        },
        // Initialize hooks as functions to prevent undefined errors
        _onclose: () => {},
        _onerror: () => {},
        _onmessage: () => {},
      };
      return wsInstance;
    });
    (wsMock as any).CONNECTING = 0;
    (wsMock as any).OPEN = 1;
    (wsMock as any).CLOSING = 2;
    (wsMock as any).CLOSED = 3;
    global.WebSocket = wsMock as any;
    
    function ErrorComponent() {
      const ctx = _useWebSocket();
      return <div data-testid='ws-error'>{ctx.lastError || 'none'}</div>;
    }
    
    render(
      <_WebSocketProvider>
        <ErrorComponent />
      </_WebSocketProvider>
    );
    
    // Simulate error event
    await act(async () => {
      if (wsInstance._onerror) {
        wsInstance._onerror(new Event('error'));
      }
    });
    
    expect(screen.getByTestId('ws-error').textContent).not.toBe('none');
  });
});
