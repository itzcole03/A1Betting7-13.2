import '../../../jest.setup.e2e.js';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import React from 'react';
import App from '../App';
import { _AppProvider } from '../contexts/AppContext';
import { _AuthProvider } from '../contexts/AuthContext';
import { _ThemeProvider } from '../contexts/ThemeContext';
import { _WebSocketProvider } from '../contexts/WebSocketContext';
import { mockFeaturedProps } from './fixtures/mockFeaturedProps';

jest.mock('axios');

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

describe('User Context Switching E2E', () => {
  beforeAll(() => {
    (global.fetch as unknown as typeof fetch) = mockedFetch as unknown as typeof fetch;
  });

  afterAll(() => {
    (global.fetch as unknown as typeof fetch) = originalFetch as typeof fetch;
  });

  beforeEach(() => {
    localStorage.clear();
    queryClient.clear();
    mockedFetch.mockClear();
    (axios as any).get?.mockReset?.();
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

  it('switches user context and updates permissions', async () => {
    (axios as any).get?.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/api/v2/health')) {
        return Promise.resolve({ data: { status: 'ok' }, status: 200 });
      }
      return Promise.resolve({ data: {} });
    });

    const { rerender } = render(
      <TestProviders>
        <App />
      </TestProviders>
    );

    const adminButton = await screen.findByRole('button', { name: /Admin/i });
    expect(adminButton).toBeInTheDocument();

    const switchUserButton = await screen.findByRole('button', {
      name: /Switch to User/i,
    });

    act(() => {
      switchUserButton.click();
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 'regular-user',
          email: 'user@example.com',
          role: 'user',
          permissions: [],
        })
      );
    });

    rerender(
      <TestProviders>
        <App />
      </TestProviders>
    );

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Admin/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Switch to User/i })).not.toBeInTheDocument();
    });

    expect(await screen.findByLabelText(/PropFinder Link/i)).toBeInTheDocument();
    expect(screen.getByText(/MLB AI Props/i)).toBeInTheDocument();
  });
});
