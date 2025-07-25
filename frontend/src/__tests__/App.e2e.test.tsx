// Use the mock for unifiedApiService in normal state E2E tests
jest.mock('../services/unifiedApiService', () => {
  // Use the actual mock factory from __mocks__
  const createUnifiedApiServiceMock = jest.requireActual(
    '../services/__mocks__/unifiedApiService'
  ).default;
  return {
    __esModule: true,
    createUnifiedApiService: () => createUnifiedApiServiceMock(),
  };
});
// Set error flag for error state test before any imports
(globalThis as any).__MOCK_GET_ENHANCED_BETS_ERROR__ = process.env.JEST_E2E_ERROR_STATE === 'true';
jest.mock('../services/unifiedApiService', () => {
  // Use the actual mock factory from __mocks__
  const createUnifiedApiServiceMock = jest.requireActual(
    '../services/__mocks__/unifiedApiService'
  ).default;
  return {
    __esModule: true,
    createUnifiedApiService: () => createUnifiedApiServiceMock(),
  };
});
// Force AuthContext mock to always return isAuthenticated: true
jest.doMock('../contexts/AuthContext', () => ({
  useAuth: () => {
    // eslint-disable-next-line no-console
    console.log('[MOCK] useAuth called');
    return {
      user: { id: 'test-user', email: 'test@example.com' },
      loading: false,
      error: null,
      isAdmin: true,
      isAuthenticated: true,
      requiresPasswordChange: false,
      login: jest.fn(),
      logout: jest.fn(),
      changePassword: jest.fn(),
      clearError: jest.fn(),
      register: jest.fn(),
    };
  },
  _AuthProvider: ({ children }) => children,
}));
jest.mock('./contexts/AuthContext');

import '../../../jest.setup.e2e.js';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
// Remove top-level import of App. Will import dynamically in each test.
import * as backendDiscoveryModule from '../services/backendDiscovery';
import * as getBackendUrlModule from '../utils/getBackendUrl';

describe('App E2E', () => {
  beforeAll(() => {
    // Ensure onboarding is skipped by setting the flag in localStorage
    localStorage.setItem('onboardingComplete', 'true');
  });
  let getBackendUrlSpy: jest.SpyInstance;
  let discoverBackendSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock getBackendUrl to return a consistent URL
    getBackendUrlSpy = jest
      .spyOn(getBackendUrlModule, 'getBackendUrl')
      .mockReturnValue('http://localhost:8000');
    // Mock discoverBackend to resolve to null by default (no discovery needed if backend is healthy)
    if (!Object.getOwnPropertyDescriptor(backendDiscoveryModule, 'discoverBackend')?.get) {
      discoverBackendSpy = jest
        .spyOn(backendDiscoveryModule, 'discoverBackend')
        .mockResolvedValue(null);
    }

    // Mock localStorage for onboarding
  });

  afterEach(() => {
    getBackendUrlSpy && getBackendUrlSpy.mockRestore();
    discoverBackendSpy && discoverBackendSpy.mockRestore();
  });

  it('renders PropGPT with mock analytics and AI insights', async () => {
    const App = (await import('../App')).default;
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
    // Replace with canonical PropGPT/AI/analytics/chat assertions
    await waitFor(() =>
      expect(screen.getByText(/PropOllama|Analytics|Quantum AI|Predictions/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/AI/i)).toBeInTheDocument();
  });

  it('displays best bets and AI insights panel', async () => {
    const App = (await import('../App')).default;
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
    await waitFor(() => expect(screen.getAllByText('LeBron James').length).toBeGreaterThan(0));
    expect(screen.getAllByText('LeBron James')[0]).toBeInTheDocument();
    expect(screen.getByText(/AI Insights/i)).toBeInTheDocument();
  });

  it('shows recommended value and confidence for a bet', async () => {
    const App = (await import('../App')).default;
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
    await waitFor(() => expect(screen.getAllByText('LeBron James').length).toBeGreaterThan(0));
    expect(screen.getAllByText('OVER')[0]).toBeInTheDocument();
    expect(screen.getAllByText(/92(.|\s)*%/).length).toBeGreaterThan(0);
  });

  it('shows error state if API returns error', async () => {
    (globalThis as any).__MOCK_GET_ENHANCED_BETS_ERROR__ = true;
    const App = (await import('../App')).default;
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
    await waitFor(() =>
      expect(
        screen.getByText(/Error loading data. Please check your backend connection and try again./i)
      ).toBeInTheDocument()
    );
    (globalThis as any).__MOCK_GET_ENHANCED_BETS_ERROR__ = false;
  });
});
