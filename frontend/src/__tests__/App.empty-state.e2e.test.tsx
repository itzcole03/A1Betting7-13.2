jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { status: 'ok' } })),
  },
}));

jest.mock('../hooks/usePropFinderData', () => ({
  __esModule: true,
  usePropFinderData: jest.fn(),
}));

import { render, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import UserFriendlyApp from '../components/user-friendly/UserFriendlyApp';
import { usePropFinderData } from '../hooks/usePropFinderData';

const usePropFinderDataMock = usePropFinderData as jest.Mock;

describe('App E2E - Empty State', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (axios.get as jest.Mock).mockResolvedValue({ data: { status: 'ok' } });

    usePropFinderDataMock.mockReturnValue({
      opportunities: [],
      stats: {
        total_opportunities: 0,
        avg_confidence: 0,
        max_edge: 0,
      },
      loading: false,
      error: null,
      bookmarkOpportunity: jest.fn(),
      refreshData: jest.fn(),
      isAutoRefreshEnabled: false,
      toggleAutoRefresh: jest.fn(),
      updateFilters: jest.fn(),
      filters: {},
      searchQuery: '',
      setSearchQuery: jest.fn(),
      lastUpdated: null,
    });

    window.localStorage.setItem('onboardingComplete', 'true');
    window.localStorage.setItem(
      'user',
      JSON.stringify({ id: 'test-user', email: 'test@example.com', role: 'user', permissions: [] })
    );
    window.localStorage.setItem('token', 'test-token');
  });

  it('shows empty state on PropFinder dashboard when no opportunities are returned', async () => {
    render(
      <MemoryRouter initialEntries={['/propfinder']}>
        <UserFriendlyApp />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/No opportunities match your current filters/i)
    ).toBeInTheDocument();
  });
});
