import { act, render, screen } from '@testing-library/react';
import { _WebSocketProvider, _useWebSocket } from '../WebSocketContext';

function TestComponent() {
  const ctx = _useWebSocket();
  return <div data-testid='ws-context'>{ctx ? 'context-present' : 'context-absent'}</div>;
}

describe('WebSocketContext', () => {
  let originalWebSocket: any;
  beforeAll(() => {
    originalWebSocket = global.WebSocket;
  });
  afterAll(() => {
    global.WebSocket = originalWebSocket;
  });

  function setupMockWebSocket() {
    let wsInstance: any = null;
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
    render(
      <_WebSocketProvider>
        <TestComponent />
      </_WebSocketProvider>
    );
    expect(screen.getByTestId('ws-context')).toHaveTextContent('context-present');
  });

  it('handles transient connection failures and recovery', async () => {
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
    // Simulate close event (transient failure)
    await act(async () => {
      wsInstance._onclose && wsInstance._onclose({ code: 1006, reason: 'test', wasClean: false });
    });
    // Should enter reconnecting state
    expect(screen.getByTestId('ws-status').textContent).toMatch(/reconnecting|disconnected/);
    // Simulate open event (recovery)
    await act(async () => {
      wsInstance.onopen && wsInstance.onopen();
    });
    expect(screen.getByTestId('ws-status').textContent).toBe('connected');
  });

  it('reconnects immediately on network online event', async () => {
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
    // Simulate offline event
    await act(async () => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByTestId('ws-status').textContent).toBe('disconnected');
    // Simulate online event
    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });
    // Should enter reconnecting or connected state
    expect(['reconnecting', 'connected', 'connecting']).toContain(
      screen.getByTestId('ws-status').textContent
    );
  });

  it('exposes lastError in context on error', async () => {
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
      wsInstance._onerror && wsInstance._onerror(new Event('error'));
    });
    expect(screen.getByTestId('ws-error').textContent).not.toBe('none');
  });
});
