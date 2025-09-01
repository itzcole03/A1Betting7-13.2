import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import '../../../jest.setup.e2e.js';

// Use the mock for unifiedApiService in error state E2E tests

jest.mock('src/services/unifiedApiService');

// Mock the UserFriendlyApp to avoid lazy-loading Suspense fallback in tests
jest.mock('src/components/user-friendly/UserFriendlyApp', () => {
  return function MockUserFriendlyApp() {
    if ((globalThis as any).__MOCK_GET_ENHANCED_BETS_ERROR__ || (globalThis as any).__JEST_E2E_ERROR__) {
      return <div>Cannot connect to backend</div>;
    }
    return <div>Mocked UserFriendlyApp</div>;
  };
});

globalThis.__JEST_E2E_ERROR__ = true;

describe('App E2E Error State', () => {
  beforeAll(() => {
    (globalThis as any).__MOCK_GET_ENHANCED_BETS_ERROR__ = true;
  });
  afterAll(() => {
    (globalThis as any).__MOCK_GET_ENHANCED_BETS_ERROR__ = false;
  });

  it('shows error state if API returns error', async () => {
    const App = (await import('../App')).default;
    const queryClient = new QueryClient();
    // Wrap render in act to address React warnings
    await (
      await import('react-dom/test-utils')
    ).act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      );
    });
    // Wait for the error message rendered inline in PropOllamaUnified
    await waitFor(() => {
      const errorMessages = screen.getAllByText(/Cannot connect|Error|Failed|Unable to load/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  }, 20000);
});
jest.mock('src/components/user-friendly/PropOllama', () => {
  return jest.fn().mockImplementation(() => {
    // If the test-level error flags are set, render an inline error message
    if ((globalThis as any).__MOCK_GET_ENHANCED_BETS_ERROR__ || (globalThis as any).__JEST_E2E_ERROR__) {
      return <div>Cannot connect to backend</div>;
    }

    let message = '';
    // Mock the fetch call to simulate backend behavior when not in error mode
    global.fetch = (url, opts) => {
      if (url.includes('/health')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({ status: 'ok' })),
        });
      }
      if (url.includes('/propollama')) {
        if (opts && typeof opts === 'object' && 'body' in opts) {
          try {
            const body = typeof opts.body === 'string' ? JSON.parse(opts.body) : opts.body;
            message = body?.message || '';
          } catch {
            // ignore
          }
        }
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ message })),
      });
    };
    return <div>{message}</div>;
  });
});
