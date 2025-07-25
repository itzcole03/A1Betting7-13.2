globalThis.__JEST_E2E_ERROR__ = true;

// Set error flag before any imports
globalThis.__JEST_E2E_ERROR__ = true;

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import '../../../jest.setup.e2e.js';

describe('App E2E Error State', () => {
  afterAll(() => {
    (globalThis as any).__MOCK_GET_ENHANCED_BETS_ERROR__ = false;
  });

  it('shows error state if API returns error', async () => {
    const App = (await import('../App')).default;
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
    // Wait a tick and log the DOM and error/loading state
    await new Promise(res => setTimeout(res, 500));
    // Print the DOM and innerText for debugging
    // eslint-disable-next-line no-console
    console.log('[TEST] DOM:', document.body.innerHTML);
    // Log the value and type of innerText
    // eslint-disable-next-line no-console
    console.log(
      '[TEST] typeof document.body.innerText:',
      typeof document.body.innerText,
      'value:',
      document.body.innerText
    );
    // Try to find the error or loading text, fallback to empty string if undefined
    const errorText = (document.body.innerText || '').includes('Error loading data');
    const loadingText = (document.body.innerText || '').includes('Loading PropGPT analytics');
    // eslint-disable-next-line no-console
    console.log('[TEST] errorText:', errorText, 'loadingText:', loadingText);
    // Wait for the error state to appear
    await waitFor(() =>
      expect(
        screen.getByText(/Error loading data. Please check your backend connection and try again./i)
      ).toBeInTheDocument()
    );
  });
});
