import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

// Mock the hook so the dashboard receives controlled data
jest.mock('../../../hooks/usePropFinderData', () => {
  return {
    usePropFinderData: () => ({
      opportunities: [
        {
          id: 'bad-1',
          // player intentionally undefined to simulate malformed payload
          player: undefined,
          market: 'Points',
          pick: 'over',
          line: 10,
          odds: -110,
          isBookmarked: false,
        },
      ],
      stats: {
        total_opportunities: 1,
        avg_confidence: 0,
        max_edge: 0,
        alert_triggered_count: 0,
        sharp_heavy_count: 0,
        sports_count: 0,
        markets_count: 0,
        last_updated: new Date().toISOString(),
      },
      loading: false,
      error: null,
      bookmarkOpportunity: jest.fn(),
      refreshData: jest.fn(),
      isAutoRefreshEnabled: false,
      toggleAutoRefresh: jest.fn(),
      updateFilters: jest.fn(),
      setSearchQuery: jest.fn(),
      filters: {},
      loadMore: jest.fn(),
      hasMore: false,
    }),
  };
});

import PropFinderDashboard from '../PropFinderDashboard';

describe('PropFinder Opportunity Row ErrorBoundary', () => {
  it('renders dashboard even when an opportunity has malformed fields', () => {
    render(<PropFinderDashboard />);

    // The header should render even if the row has broken data
    expect(screen.getByTestId('propfinder-killer-heading')).toBeInTheDocument();

    // The row fallback or Unknown Player should be visible
    expect(
      screen.getByText(
        /No opportunities match your current filters|Unknown Player|Row failed to render/i
      )
    ).toBeTruthy();
  });
});
