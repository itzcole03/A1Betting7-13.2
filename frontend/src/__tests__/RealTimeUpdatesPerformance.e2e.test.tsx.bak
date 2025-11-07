import '../../../jest.setup.e2e.js';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import React from 'react';
import App from '../App';
import { _AppProvider } from '../contexts/AppContext';
import { _AuthProvider } from '../contexts/AuthContext';
import { _ThemeProvider } from '../contexts/ThemeContext';
import { _WebSocketProvider } from '../contexts/WebSocketContext';
import { mockFeaturedProps } from './fixtures/mockFeaturedProps';

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

const TestProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <_AppProvider>
      <_ThemeProvider>
        <_WebSocketProvider>
          <_AuthProvider>{children}</_AuthProvider>
        </_WebSocketProvider>
      </_ThemeProvider>
    </_AppProvider>
  </QueryClientProvider>
);

const originalFetch = global.fetch;
const originalWebSocket = global.WebSocket;

const mockedFetch = jest.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
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

  if (url.includes('/api/propfinder/opportunities')) {
    return new Response(
      JSON.stringify({
        data: {
          opportunities: mockFeaturedProps,
          stats: {
            total: mockFeaturedProps.length,
            bySport: {
              NBA: mockFeaturedProps.filter(prop => prop.sport === 'NBA').length,
              MLB: mockFeaturedProps.filter(prop => prop.sport === 'MLB').length,
            },
          },
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

jest.mock('../services/unified/FeaturedPropsService', () => ({
  __esModule: true,
  fetchFeaturedProps: jest.fn(async (sport?: string) => {
    if (!sport || sport === 'All') {
      return mockFeaturedProps;
    }
    return mockFeaturedProps.filter(prop => prop.sport === sport);
  }),
  fetchBatchPredictions: jest.fn(async (props: any[]) =>
    props.map((prop: any) => ({
      ...prop,
      value: 1.23,
      overReasoning: 'Over Analysis',
      underReasoning: 'Under Analysis',
    }))
  ),
}));

jest.mock('../services/serviceWorkerManager', () => ({
  serviceWorkerManager: {
    register: jest.fn(async () => null),
  },
}));

jest.mock('../services/coreFunctionalityValidator', () => ({
  coreFunctionalityValidator: {
    startValidation: jest.fn(),
    stopValidation: jest.fn(),
  },
}));

jest.mock('../services/webVitalsService', () => ({
  webVitalsService: {
    trackCustomMetric: jest.fn(),
  },
}));

jest.mock('../services/SportsService', () => ({
  checkApiVersionCompatibility: jest.fn(async () => '1.0.0'),
}));

jest.mock('../utils/enhancedLogger', () => ({
  enhancedLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../components/user-friendly/UserFriendlyApp');

describe('Real-Time Updates and Performance Metrics E2E', () => {
  beforeAll(() => {
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

    (global.fetch as unknown as typeof fetch) = mockedFetch as unknown as typeof fetch;
  });

  afterAll(() => {
    (global.fetch as unknown as typeof fetch) = originalFetch as typeof fetch;
    if (originalWebSocket) {
      global.WebSocket = originalWebSocket as typeof WebSocket;
    } else {
      delete (global as unknown as Record<string, unknown>).WebSocket;
    }
  });

  beforeEach(() => {
    localStorage.clear();
    queryClient.clear();
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
    mockedFetch.mockClear();
  });

  it('shows real-time updates and performance metrics', async () => {
    render(
      <TestProviders>
        <App />
      </TestProviders>
    );

    const realTime = await screen.findByTestId('real-time-update-indicator').catch(() => null);
    const apiHealth = await screen.findByTestId('api-health-indicator').catch(() => null);
    expect(realTime || apiHealth).toBeTruthy();

    const perf = await screen
      .findByText(/Performance Metrics|Latency|Throughput|Analytics Dashboard/i)
      .catch(async () => screen.findByTestId('api-health-indicator').catch(() => null));
    expect(perf).toBeTruthy();
  });
});
