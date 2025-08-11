import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UserFriendlyApp from '../components/user-friendly/UserFriendlyApp';

describe('WebSocket Connection E2E', () => {
  beforeEach(() => {
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
  beforeAll(() => {
    // Mock WebSocket
    global.WebSocket = class {
      onopen: (() => void) | null = null;
      onclose: ((event?: any) => void) | null = null;
      onmessage: ((event?: any) => void) | null = null;
      close = jest.fn();
      send = jest.fn();
      constructor() {
        setTimeout(() => {
          if (typeof this.onopen === 'function') this.onopen();
        }, 10);
      }
    } as any;
  });

  it('shows WebSocket connection status and handles errors gracefully', async () => {
    render(
      <MemoryRouter>
        <UserFriendlyApp />
      </MemoryRouter>
    );
    // Wait for WebSocket status indicator
    expect(await screen.findByTestId('websocket-status-indicator')).toBeInTheDocument();
    // Simulate error
    act(() => {
      const ws = (global as any).WebSocket;
      if (ws && ws.onclose) ws.onclose({ code: 1006, reason: 'Connection lost' });
    });
    await waitFor(() => {
      expect(screen.getByText(/WebSocket Disconnected|Connection lost/i)).toBeInTheDocument();
    });
  });
});
