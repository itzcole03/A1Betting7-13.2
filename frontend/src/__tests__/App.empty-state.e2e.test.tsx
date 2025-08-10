// Mock useSimplePropOllamaData to provide all required actions
jest.mock('../components/hooks/useSimplePropOllamaData', () => ({
  __esModule: true,
  useSimplePropOllamaData: ({ state, actions }: any) => ({
    fetchData: jest.fn(),
    // actions object with all required functions
    actions: {
      setIsLoading: jest.fn(),
      setError: jest.fn(),
      setLoadingMessage: jest.fn(),
      setProjections: jest.fn(),
    },
  }),
}));
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
jest.mock('../components/hooks/usePropOllamaState', () => ({
  __esModule: true,
  usePropOllamaState: () => [
    {
      projections: [],
      isLoading: false,
      filters: { searchTerm: '', selectedSport: 'MLB' },
      sorting: { sortBy: 'default' },
      displayOptions: { expandedRowKey: null, useVirtualization: false },
      selectedProps: [],
      entryAmount: 0,
      enhancedAnalysisCache: new Map(),
      loadingAnalysis: new Set(),
      connectionHealth: { isHealthy: true, latency: 0, lastChecked: Date.now() },
      loadingStage: { stage: 'complete' },
      loadingMessage: '',
      upcomingGames: [],
      selectedGame: null,
    },
    {
      updateFilters: jest.fn(),
      updateSorting: jest.fn(),
      setSelectedGame: jest.fn(),
      updateDisplayOptions: jest.fn(),
      removeSelectedProp: jest.fn(),
      setEntryAmount: jest.fn(),
      setSelectedProps: jest.fn(),
      actions: {
        setIsLoading: jest.fn(),
        setError: jest.fn(),
        setLoadingMessage: jest.fn(),
        setProjections: jest.fn(),
      },
    },
  ],
}));

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

    // Mock localStorage.getItem using Object.defineProperty for Jest compatibility
    Object.defineProperty(window.localStorage, 'getItem', {
      configurable: true,
      value: (key: string) => {
        if (key === 'onboardingComplete') return 'true';
        if (key === 'user')
          return JSON.stringify({ id: 'test', email: 'test@example.com', role: 'user' });
        if (key === 'token') return 'test-token';
        return null;
      },
    });
  });

  it('shows empty state if no enhanced bets are returned', async () => {
    jest.useFakeTimers();
    try {
      const App = (await import('../App')).default;
      await (
        await import('react-dom/test-utils')
      ).act(async () => {
        render(<App />);
        jest.runAllTimers();
      });
      const emptyState = await screen.findByText(/No props found/i, {}, { timeout: 5000 });
      expect(emptyState).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  }, 10000);
});
