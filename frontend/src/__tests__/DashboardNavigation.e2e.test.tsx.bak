import '../../../jest.setup.e2e.js';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useEffect } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import UserFriendlyApp from '../components/user-friendly/UserFriendlyApp';
import { _AppProvider } from '../contexts/AppContext';
import { _AuthProvider } from '../contexts/AuthContext';
import { _ThemeProvider } from '../contexts/ThemeContext';
import { _WebSocketProvider } from '../contexts/WebSocketContext';
import { mockFeaturedProps } from './fixtures/mockFeaturedProps';

jest.mock('../services/unified/FeaturedPropsService', () => ({
  __esModule: true,
  fetchFeaturedProps: jest.fn(async (sport?: string) => {
    if (!sport || sport === 'All') {
      return mockFeaturedProps;
    }
    return mockFeaturedProps.filter(prop => prop.sport === sport);
  }),
  fetchBatchPredictions: jest.fn(async (props: any[]) =>
    props.map(prop => ({
      ...prop,
      value: 1.23,
      overReasoning: 'Over Analysis',
      underReasoning: 'Under Analysis',
    }))
  ),
  mockProps: mockFeaturedProps,
}));

const originalFetch = global.fetch;
const originalWebSocket = global.WebSocket;

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

  if (url.includes('/api/unified/featured-props')) {
    return new Response(JSON.stringify({ props: mockFeaturedProps }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

(global.fetch as unknown as typeof fetch) = mockedFetch as unknown as typeof fetch;

const TestProviders: React.FC<{ onLocationChange: (pathname: string) => void; children: React.ReactNode }> = ({
  onLocationChange,
  children,
}) => (
  <QueryClientProvider client={queryClient}>
    <_AppProvider>
      <_ThemeProvider>
        <_WebSocketProvider>
          <_AuthProvider>
            <MemoryRouter>
              <LocationTracker onChange={onLocationChange} />
              {children}
            </MemoryRouter>
          </_AuthProvider>
        </_WebSocketProvider>
      </_ThemeProvider>
    </_AppProvider>
  </QueryClientProvider>
);

jest.mock('../components/PositiveEVFeed', () => ({
  __esModule: true,
  default: () => (
    <div data-testid='positive-ev-feed'>
      <h1>+EV Feed</h1>
    </div>
  ),
}));

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
    </div>
  ),
}));

jest.mock('../components/features/betting/ArbitrageOpportunities', () => ({
  __esModule: true,
  default: () => (
    <div data-testid='arbitrage-page'>
      <h1>Arbitrage Opportunities</h1>
    </div>
  ),
}));

jest.mock('../components/features/betting/LineShopping', () => ({
  __esModule: true,
  default: () => (
    <div data-testid='line-shopping-page'>
      <h1>Line Shopping</h1>
    </div>
  ),
}));

function LocationTracker({ onChange }: { onChange: (pathname: string) => void }) {
  const location = useLocation();

  useEffect(() => {
    onChange(location.pathname);
  }, [location, onChange]);

  return null;
}

describe('Dashboard Navigation E2E', () => {
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
  });

  afterAll(() => {
    mockedFetch.mockReset();
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

  it('renders dashboard and navigates between main routes', async () => {
    let currentPath = '/';

    const handleLocationChange = (pathname: string) => {
      currentPath = pathname;
    };

    const user = userEvent.setup();

    const openNavigation = async () => {
      const toggleButton = await screen.findByRole('button', { name: /open navigation/i });
      await user.click(toggleButton);
      return screen.findByTestId('primary-nav');
    };

    render(
      <TestProviders onLocationChange={handleLocationChange}>
        <UserFriendlyApp />
      </TestProviders>
    );

    expect(await screen.findByTestId('propfinder-killer-heading')).toBeInTheDocument();

  let navContainer = await openNavigation();
  const propFinderLink = within(navContainer).getByRole('link', { name: /^PropFinder\b/i });
    await user.click(propFinderLink);

    await waitFor(() => {
      expect(currentPath.replace(/\/$/, '')).toContain('/propfinder');
    });
    expect(await screen.findByTestId('propfinder-killer-heading')).toBeInTheDocument();

    navContainer = await openNavigation();
    const toolsTab = within(navContainer).getByRole('button', { name: /^Tools$/i });
    await user.click(toolsTab);
    const smartAlertsLink = within(navContainer).getByRole('link', { name: /^Smart Alerts\b/i });
    await user.click(smartAlertsLink);

    await waitFor(() => {
      expect(currentPath.replace(/\/$/, '')).toContain('/smart-alerts');
    });
    expect(await screen.findByText(/Smart Alerts/i)).toBeInTheDocument();

    navContainer = await openNavigation();
    const mainTab = within(navContainer).getByRole('button', { name: /^Main$/i });
    await user.click(mainTab);
    const evFeedLink = within(navContainer).getByRole('link', { name: /\+EV Feed\b/i });
    await user.click(evFeedLink);

    await waitFor(() => {
      expect(currentPath.replace(/\/$/, '')).toContain('/ev-feed');
    });
    expect(
      await screen.findByRole('heading', {
        name: /\+EV Feed/i,
      })
    ).toBeInTheDocument();

    navContainer = await openNavigation();
    const toolsTabAgain = within(navContainer).getByRole('button', { name: /^Tools$/i });
    await user.click(toolsTabAgain);
    const arbitrageLink = within(navContainer).getByRole('link', { name: /^Arbitrage Hunter\b/i });
    await user.click(arbitrageLink);

    await waitFor(() => {
      expect(currentPath.replace(/\/$/, '')).toContain('/arbitrage');
    });
    expect(await screen.findByText(/Arbitrage Opportunities/i)).toBeInTheDocument();

    navContainer = await openNavigation();
    const lineShoppingLink = within(navContainer).getByRole('link', { name: /^Line Shopping\b/i });
    await user.click(lineShoppingLink);

    await waitFor(() => {
      expect(currentPath.replace(/\/$/, '')).toContain('/line-shopping');
    });
    expect(await screen.findByTestId('line-shopping-page')).toBeInTheDocument();
  });
});
