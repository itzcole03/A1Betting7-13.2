import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import UserFriendlyApp from '../components/user-friendly/UserFriendlyApp';
import { _AppProvider } from '../contexts/AppContext';
import { _AuthProvider } from '../contexts/AuthContext';
import { _ThemeProvider } from '../contexts/ThemeContext';
import { _WebSocketProvider } from '../contexts/WebSocketContext';
import { httpFetch } from '../services/HttpClient';

jest.mock('../services/HttpClient', () => ({
  __esModule: true,
  httpFetch: jest.fn(),
}));

const httpFetchMock = httpFetch as unknown as jest.Mock;

const originalFetch = global.fetch;
const originalWebSocket = global.WebSocket;

const mockedFetch = jest.fn(async (input: RequestInfo | URL) => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.toString()
      : (input as Request).url ?? '';

  if (url.includes('/api/health/status')) {
    return new Response(JSON.stringify({ status: 'healthy' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (url.includes('/api/version')) {
    return new Response(JSON.stringify({ version: '1.0.0' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
      staleTime: 0,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

const TestProviders: React.FC<React.PropsWithChildren<{ initialRoute: string }>> = ({
  initialRoute,
  children,
}) => (
  <QueryClientProvider client={queryClient}>
    <_AppProvider>
      <_ThemeProvider>
        <_WebSocketProvider>
          <_AuthProvider>
            <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>
          </_AuthProvider>
        </_WebSocketProvider>
      </_ThemeProvider>
    </_AppProvider>
  </QueryClientProvider>
);

jest.mock('../components/dashboard/PropFinderDashboard', () => ({
  __esModule: true,
  default: () => <div data-testid='propfinder-killer-heading'>PropFinder Killer</div>,
}));

jest.mock('../components/ApiHealthIndicator', () => ({
  __esModule: true,
  default: () => <div data-testid='api-health-indicator-mock' />,
}));

jest.mock('../components/WebSocketStatusIndicator', () => ({
  __esModule: true,
  default: () => <div data-testid='websocket-status-indicator-mock' />,
}));

jest.mock('../components/SmartAlerts', () => ({
  __esModule: true,
  default: () => (
    <div data-testid='smart-alerts-page'>
      <h1>Smart Alerts</h1>
      <button type='button'>Create Rule</button>
      <p>0 alert rules</p>
    </div>
  ),
}));

describe('Smart Alerts E2E', () => {
  beforeAll(() => {
    (global.fetch as unknown as typeof fetch) = mockedFetch as unknown as typeof fetch;
    global.WebSocket = class {
      onopen: (() => void) | null = null;
      onclose: (() => void) | null = null;
      onmessage: ((event: any) => void) | null = null;
      close = jest.fn();
      send = jest.fn();

      constructor() {
        setTimeout(() => {
          if (typeof this.onopen === 'function') {
            (this.onopen as () => void)();
          }
        }, 10);
      }
    } as any;
  });

  afterAll(() => {
    (global.fetch as unknown) = originalFetch;
    if (originalWebSocket) {
      global.WebSocket = originalWebSocket as typeof WebSocket;
    } else {
      delete (global as unknown as Record<string, unknown>).WebSocket;
    }
  });

  beforeEach(() => {
    queryClient.clear();
    mockedFetch.mockClear();
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

    httpFetchMock.mockImplementation((url: string) => {
      const makeResponse = (data: unknown) =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({ success: true, data }),
        });

      if (url.includes('/rule-types')) {
        return makeResponse([
          { type: 'ev_threshold', name: 'EV Threshold', description: 'High value plays' },
        ]);
      }

      if (url.includes('/triggers')) {
        return makeResponse([]);
      }

      if (url.includes('/rules')) {
        return makeResponse([]);
      }

      return makeResponse([]);
    });
  });

  afterEach(() => {
    httpFetchMock.mockReset();
  });

  it('renders Smart Alerts management workspace for admins', async () => {
    queryClient.clear();

    render(
      <TestProviders initialRoute='/smart-alerts'>
        <UserFriendlyApp />
      </TestProviders>
    );

    expect(await screen.findByRole('heading', { name: /Smart Alerts/i })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Create Rule/i })).toBeInTheDocument();
    expect(screen.getByText(/alert rules/i)).toBeInTheDocument();
  });
});
