import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import WebSocketStatusIndicator from '../components/WebSocketStatusIndicator';
import { _WebSocketProvider } from '../contexts/WebSocketContext';

describe('WebSocket Connection E2E', () => {
  const originalWebSocket = global.WebSocket;
  const originalEnv = process.env.VITE_WEBSOCKET_ENABLED;

  beforeAll(() => {
    process.env.VITE_WEBSOCKET_ENABLED = 'true';

    class MockWebSocket {
      public onopen: (() => void) | null = null;
      public onclose: ((event?: any) => void) | null = null;
      public onmessage: ((event?: any) => void) | null = null;
      public close = jest.fn();
      public send = jest.fn();

      constructor(_url: string) {
        (global as unknown as { __ACTIVE_WS__?: MockWebSocket }).__ACTIVE_WS__ = this;
        setTimeout(() => {
          this.onopen?.();
        }, 0);
      }
    }

    global.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  });

  afterAll(() => {
    process.env.VITE_WEBSOCKET_ENABLED = originalEnv;
    if (originalWebSocket) {
      global.WebSocket = originalWebSocket;
    } else {
      delete (global as unknown as Record<string, unknown>).WebSocket;
    }
  });

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('onboardingComplete', 'true');
    localStorage.setItem('token', 'test-token');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'test-user',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['admin'],
      })
    );
  });

  it('shows WebSocket connection status and handles errors gracefully', async () => {
    render(
      <_WebSocketProvider>
        <WebSocketStatusIndicator />
      </_WebSocketProvider>
    );

    expect(await screen.findByTestId('websocket-status-indicator')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('websocket-status-connected')).toBeInTheDocument();
    });

    act(() => {
      const active = (global as unknown as { __ACTIVE_WS__?: { onclose?: (event?: any) => void } })
        .__ACTIVE_WS__;
      active?.onclose?.({ code: 1006, reason: 'Connection lost' });
    });

    await waitFor(() => {
      expect(screen.getByTestId('websocket-status-disconnected')).toBeInTheDocument();
    });
  });
});
