import '../../../jest.setup.e2e.js';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
// Remove top-level import of App. Will import dynamically in each test.
import * as backendDiscoveryModule from '../services/backendDiscovery';
import * as getBackendUrlModule from '../utils/getBackendUrl';

describe('App E2E - Empty State', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock getBackendUrl to return a consistent URL
    jest.spyOn(getBackendUrlModule, 'getBackendUrl').mockReturnValue('http://localhost:8000');
    // Mock discoverBackend to resolve to null by default
    if (!Object.getOwnPropertyDescriptor(backendDiscoveryModule, 'discoverBackend')?.get) {
      jest.spyOn(backendDiscoveryModule, 'discoverBackend').mockResolvedValue(null);
    }

    // Mock localStorage for onboarding
    localStorage.getItem = jest.fn(() => 'onboardingComplete');
  });

  it('shows empty state if no enhanced bets are returned', async () => {
    const App = (await import('../App')).default;
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
    const emptyState = await screen.findByText(/No AI Insights Available/i);
    expect(emptyState).toBeInTheDocument();
  });
});
