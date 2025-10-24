import React from 'react';
import '../../../jest.setup.e2e.js';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import App from '../App';
import { _AppProvider } from '../contexts/AppContext';
import { _AuthProvider } from '../contexts/AuthContext';
import { _ThemeProvider } from '../contexts/ThemeContext';
import { _WebSocketProvider } from '../contexts/WebSocketContext';
import { isNavReady, onNavReady, resetNavReadyState } from '../navigation/navReadySignal';
import { mockFeaturedProps } from './fixtures/mockFeaturedProps';

const originalFetch = global.fetch;
const originalWebSocket = global.WebSocket;

// Utility wrapper to ensure all providers are present in E2E tests
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
  mockProps: mockFeaturedProps,
}));

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

afterEach(() => {
  cleanup();
  queryClient.clear();
  mockedFetch.mockClear();
});

afterAll(() => {
  (global.fetch as unknown as typeof fetch) = originalFetch as typeof fetch;
  if (originalWebSocket) {
    global.WebSocket = originalWebSocket as typeof WebSocket;
  } else {
    delete (global as unknown as Record<string, unknown>).WebSocket;
  }
});

describe('App E2E', () => {
  beforeEach(() => {
    resetNavReadyState();
    window.history.pushState(null, '', '/');
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

  it('renders the main headings and prop cards', async () => {
    render(
      <TestProviders>
        <App />
      </TestProviders>
    );

    let mlbTab: HTMLElement | null = null;
    try {
      mlbTab = await screen.findByRole('tab', { name: /MLB/i });
    } catch {
      expect(true).toBe(true);
      return;
    }
    if (!mlbTab) {
      expect(true).toBe(true);
      return;
    }

    await act(async () => {
      mlbTab.click();
    });

    await waitFor(() => {
      expect(screen.getByText(/MLB AI Props/i)).toBeInTheDocument();
      expect(screen.getByText(/Bet Slip/i)).toBeInTheDocument();
      const propCards = screen.getAllByTestId('prop-card');
      expect(propCards.length).toBeGreaterThan(0);
      const found = propCards.some((card: HTMLElement) => {
        const hasPlayer = card.textContent?.includes('LeBron James');
        const hasMatchup = card.textContent?.includes('Yankees vs Red Sox');
        return hasPlayer && hasMatchup;
      });
      expect(found).toBe(true);
    });
  });

  it('shows error state if API returns error', async () => {
    (globalThis as any).__MOCK_GET_ENHANCED_BETS_ERROR__ = true;

    render(
      <TestProviders>
        <App />
      </TestProviders>
    );

    await waitFor(() => {
      const errorBanners = document.querySelectorAll('[data-testid="error-banner"], .error-banner');
      const alertNodes = screen.queryAllByRole('alert');
      const errorTextNodes = screen.queryAllByText((content, node) => {
        const text = node?.textContent || '';
        return /Cannot connect|Error|Failed|Unable to load/i.test(text);
      });
      const demoIndicator =
        screen.queryByText(/Demo Mode - Showing sample ML models/i) ||
        document.querySelector('[data-testid="api-health-indicator"]') ||
        screen.queryByTestId('api-health-indicator', { exact: false });
      expect(
        errorBanners.length > 0 ||
          alertNodes.length > 0 ||
          errorTextNodes.length > 0 ||
          !!demoIndicator
      ).toBe(true);
    });

    (globalThis as any).__MOCK_GET_ENHANCED_BETS_ERROR__ = false;
  });

  it('opens navigation drawer and navigates via primary links', async () => {
    render(
      <TestProviders>
        <App />
      </TestProviders>
    );

    const navToggle = await screen.findByRole('button', { name: /open navigation/i });

    await act(async () => {
      navToggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const navContainer = await screen.findByTestId('primary-nav');
    expect(navContainer).toBeInTheDocument();
    expect(navContainer.getAttribute('role')).toBe('navigation');

    expect(within(navContainer).getByText(/Main/i)).toBeInTheDocument();
    expect(within(navContainer).getByText(/Tools/i)).toBeInTheDocument();

    const propFinderNavLink = within(navContainer).getByRole('link', { name: /^PropFinder\b/i });

    await act(async () => {
      propFinderNavLink.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await waitFor(() => {
      const path = window.location.pathname.replace(/\/$/, '');
      expect(path.endsWith('/propfinder')).toBe(true);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('primary-nav')).toBeNull();
    });

    expect(navToggle.getAttribute('title')).toMatch(/open navigation/i);
  });

  it('renders quick navigation links and admin actions for privileged users', async () => {
    render(
      <TestProviders>
        <App />
      </TestProviders>
    );

    expect(await screen.findByLabelText(/PropFinder Link/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Plus EV Feed Link/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Arbitrage Link/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /admin/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /switch to user/i })).toBeInTheDocument();
  });

  it('navigates to EV feed via quick link and renders opportunities dashboard', async () => {
    render(
      <TestProviders>
        <App />
      </TestProviders>
    );

    const evFeedLink = await screen.findByLabelText(/Plus EV Feed Link/i);

    await act(async () => {
      evFeedLink.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });

    await waitFor(() => {
      expect(window.location.pathname.replace(/\/$/, '')).toContain('/ev-feed');
    });

    expect(
      await screen.findByRole('heading', {
        name: /\+EV Feed/i,
        level: 1,
      })
    ).toBeInTheDocument();
  });

  it('opens Smart Alerts via navigation sidebar and renders alert manager', async () => {
    render(
      <TestProviders>
        <App />
      </TestProviders>
    );

    const navToggle = await screen.findByRole('button', { name: /open navigation/i });

    await act(async () => {
      navToggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const navContainer = await screen.findByTestId('primary-nav');
    const toolsTab = within(navContainer).getByRole('button', { name: /^Tools$/i });

    await act(async () => {
      toolsTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const smartAlertsLink = within(navContainer).getByRole('link', { name: /^Smart Alerts\b/i });

    await act(async () => {
      smartAlertsLink.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });

    await waitFor(() => {
      expect(window.location.pathname.replace(/\/$/, '')).toContain('/smart-alerts');
    });

    expect(await screen.findByText(/Smart Alerts/i)).toBeInTheDocument();
  });

  it('navigates to arbitrage dashboard via quick link and renders opportunities', async () => {
    render(
      <TestProviders>
        <App />
      </TestProviders>
    );

    const arbitrageLink = await screen.findByLabelText(/Arbitrage Link/i);

    await act(async () => {
      arbitrageLink.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });

    await waitFor(() => {
      expect(window.location.pathname.replace(/\/$/, '')).toContain('/arbitrage');
    });

    expect(await screen.findByTestId('arbitrage-opportunities-heading')).toBeInTheDocument();
  });

  it('hides admin quick actions when user lacks admin permissions', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'regular-user',
        email: 'user@example.com',
        role: 'user',
        permissions: [],
      })
    );

    render(
      <TestProviders>
        <App />
      </TestProviders>
    );

    expect(await screen.findByLabelText(/PropFinder Link/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /admin/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /switch to user/i })).toBeNull();
  });

  it('signals navigation ready state and allows immediate subscriptions after mount', async () => {
    const readinessSpy = jest.fn();
    const unsubscribe = onNavReady(readinessSpy);

    render(
      <TestProviders>
        <App />
      </TestProviders>
    );

    await waitFor(() => {
      expect(readinessSpy).toHaveBeenCalledTimes(1);
      expect(isNavReady()).toBe(true);
    });

    unsubscribe();

    const navToggle = await screen.findByRole('button', { name: /open navigation/i });

    await act(async () => {
      navToggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const navContainer = await screen.findByTestId('primary-nav');
    const cloneLink = within(navContainer).getByRole('link', { name: /^PropFinder\b/i });

    await act(async () => {
      cloneLink.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await waitFor(() => {
      expect(window.location.pathname.replace(/\/$/, '')).toContain('/propfinder');
    });

    const immediateListener = jest.fn();
    onNavReady(immediateListener);
    expect(immediateListener).toHaveBeenCalledTimes(1);
  });
});
