// Mock FeaturedPropsService to return empty array for all fetches
jest.mock('../services/unified/FeaturedPropsService', () => ({
  __esModule: true,
  fetchFeaturedProps: jest.fn(async () => []),
  fetchBatchPredictions: jest.fn(async () => []),
  mockProps: [],
}));

import { render, screen } from '@testing-library/react';
import '../../../jest.setup.e2e.js';
import * as backendDiscoveryModule from '../services/backendDiscovery';
import * as getBackendUrlModule from '../utils/getBackendUrl';
import { setupBackendMocks } from './mocks/backend';

describe('App E2E - Empty State', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup backend mocks
    setupBackendMocks();

    // Mock getBackendUrl to return a consistent URL
    jest.spyOn(getBackendUrlModule, 'getBackendUrl').mockReturnValue('http://localhost:8000');
    // Mock discoverBackend to resolve to null by default
    if (!Object.getOwnPropertyDescriptor(backendDiscoveryModule, 'discoverBackend')?.get) {
      jest.spyOn(backendDiscoveryModule, 'discoverBackend').mockResolvedValue(null);
    }

    // Mock localStorage for onboarding and user
    jest.spyOn(localStorage, 'getItem').mockImplementation((key: string) => {
      if (key === 'onboardingComplete') return 'true';
      if (key === 'user')
        return JSON.stringify({ id: 'test', email: 'test@example.com', role: 'user' });
      if (key === 'token') return 'test-token';
      return null;
    });
  });

  it('shows empty state if no enhanced bets are returned', async () => {
    const App = (await import('../App')).default;
    render(<App />);
    const emptyState = await screen.findByText(
      /No props available|No props found|No props selected/i
    );
    expect(emptyState).toBeInTheDocument();
  });
});
