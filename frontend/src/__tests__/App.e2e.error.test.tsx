import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import '../../../jest.setup.e2e.js';

// Use the mock for unifiedApiService in error state E2E tests

jest.mock('src/services/unifiedApiService');

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
    let message = '';
    // Mock the fetch call to simulate backend behavior
    global.fetch = (url, opts) => {
      if (url.includes('/health')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({ status: 'ok' })),
        });
      }
      if (url.includes('/propollama')) {
        if (opts && opts.body) {
          if (typeof opts.body === 'object') {
            message = opts.body.message || '';
          } else if (typeof opts.body === 'string') {
            try {
              message = JSON.parse(opts.body).message;
            } catch {}
          }
        } else if (opts && typeof opts === 'string') {
          message = opts;
        } else if (opts && opts.body && typeof opts.body === 'string') {
          // Handle string body
          message = opts.body;
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
