import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAIInsights } from '../../../hooks/useAIInsights';
import { useEnhancedBets } from '../../../hooks/useEnhancedBets';
import { usePortfolioOptimization } from '../../../hooks/usePortfolioOptimization';
import ComprehensiveAdminDashboard from '../ComprehensiveAdminDashboard';

// Mock the custom hooks to control data, loading, and error states
jest.mock('../../../hooks/useEnhancedBets', () => ({
  __esModule: true,
  useEnhancedBets: jest.fn(),
}));
jest.mock('../../../hooks/usePortfolioOptimization', () => ({
  __esModule: true,
  usePortfolioOptimization: jest.fn(),
}));
jest.mock('../../../hooks/useAIInsights', () => ({
  __esModule: true,
  useAIInsights: jest.fn(),
}));

// Mock window.scrollTo to prevent jsdom errors
beforeAll(() => {
  window.scrollTo = jest.fn();
});

// Reset and set up default mocks before each test
beforeEach(() => {
  (useEnhancedBets as jest.Mock).mockReset();
  (usePortfolioOptimization as jest.Mock).mockReset();
  (useAIInsights as jest.Mock).mockReset();
  (useEnhancedBets as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isError: false,
    data: {
      enhanced_bets: [
        {
          bet_id: '1',
          player_name: 'John Doe',
          sport: 'NBA',
          stat_type: 'PTS',
          line: 25.5,
          confidence: 92.1,
          recommendation: 'Over',
        },
        {
          bet_id: '2',
          player_name: 'Jane Smith',
          sport: 'NBA',
          stat_type: 'REB',
          line: 10.5,
          confidence: 85.3,
          recommendation: 'Under',
        },
      ],
    },
    error: null,
    refetch: jest.fn(),
  }));
  (usePortfolioOptimization as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isError: false,
    data: {},
    error: null,
    refetch: jest.fn(),
  }));
  (useAIInsights as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isError: false,
    data: { ai_insights: [] },
    error: null,
    refetch: jest.fn(),
  }));
});

const _queryClient = new QueryClient();

describe('ComprehensiveAdminDashboard', () => {
  // For debugging: log the DOM after clicking the bet
  // eslint-disable-next-line no-console
  // @ts-ignore
  // eslint-disable-next-line
  // console.log(document.body.innerHTML);
  it('renders dashboard data and panels when loaded', async () => {
    (useEnhancedBets as jest.Mock).mockImplementation(() => ({
      isLoading: false,
      isError: false,
      data: {
        enhanced_bets: [
          {
            bet_id: '1',
            player_name: 'John Doe',
            sport: 'NBA',
            stat_type: 'PTS',
            line: 25.5,
            confidence: 92.1,
            recommendation: 'Over',
          },
          {
            bet_id: '2',
            player_name: 'Jane Smith',
            sport: 'NBA',
            stat_type: 'REB',
            line: 10.5,
            confidence: 85.3,
            recommendation: 'Under',
          },
        ],
      },
      error: null,
      refetch: jest.fn(),
    }));
    (usePortfolioOptimization as jest.Mock).mockImplementation(() => ({
      isLoading: false,
      isError: false,
      data: {},
      error: null,
      refetch: jest.fn(),
    }));
    (useAIInsights as jest.Mock).mockImplementation(() => ({
      isLoading: false,
      isError: false,
      data: {
        ai_insights: [
          {
            bet_id: '1',
            player_name: 'John Doe',
            quantum_analysis: 'AI sees strong upside for John Doe.',
          },
          {
            bet_id: '2',
            player_name: 'Jane Smith',
            quantum_analysis: 'Jane Smith likely to underperform rebounds.',
          },
        ],
      },
      error: null,
      refetch: jest.fn(),
    }));
    const Wrapper = () => (
      <QueryClientProvider client={_queryClient}>
        <ComprehensiveAdminDashboard />
      </QueryClientProvider>
    );

    render(<Wrapper />);

    await waitFor(() => {
      expect(screen.getByText('Enhanced Bets')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/John Doe/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Jane Smith/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/PTS/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/REB/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/92\.1/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/85\.3/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Over/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Under/i).length).toBeGreaterThan(0);

    // Use within to target the bet selector container
    const betSelector = screen.getByText('Select Bet for Analysis').closest('div');
    expect(betSelector).toBeDefined();
    const johnDoeBet = within(betSelector!).getAllByText(/John Doe/i)[0];

    await userEvent.click(johnDoeBet);
    // Debug: log the DOM after clicking the bet
    // eslint-disable-next-line no-console
    console.log(document.body.innerHTML);

    // Wait for the AI insight text to appear
    const johnDoeInsights = await screen.findAllByText(
      (_, node) => node?.textContent?.includes('AI sees strong upside for John Doe.') ?? false
    );
    expect(johnDoeInsights.length).toBeGreaterThan(0);

    // Optionally, select the second bet and check its insight
    const janeSmithBet = within(betSelector!).getAllByText(/Jane Smith/i)[0];
    await userEvent.click(janeSmithBet);
    const janeSmithInsights = await screen.findAllByText(
      (_, node) =>
        node?.textContent?.includes('Jane Smith likely to underperform rebounds.') ?? false
    );
    expect(janeSmithInsights.length).toBeGreaterThan(0);
  });

  it('shows loading state', async () => {
    (useEnhancedBets as jest.Mock).mockImplementation(() => ({ isLoading: true, isError: false }));
    (usePortfolioOptimization as jest.Mock).mockImplementation(() => ({
      isLoading: true,
      isError: false,
    }));
    (useAIInsights as jest.Mock).mockImplementation(() => ({ isLoading: true, isError: false }));
    render(
      <QueryClientProvider client={_queryClient}>
        <ComprehensiveAdminDashboard />
      </QueryClientProvider>
    );
    await waitFor(() => {
      expect(screen.getByText(/Loading AI-powered betting intelligence/i)).toBeInTheDocument();
    });
  });

  it('shows error state', async () => {
    // imports moved to top level
    (useEnhancedBets as jest.Mock).mockImplementation(() => ({ isLoading: false, isError: true }));
    (usePortfolioOptimization as jest.Mock).mockImplementation(() => ({
      isLoading: false,
      isError: true,
    }));
    (useAIInsights as jest.Mock).mockImplementation(() => ({ isLoading: false, isError: true }));
    render(
      <QueryClientProvider client={_queryClient}>
        <ComprehensiveAdminDashboard />
      </QueryClientProvider>
    );
    await waitFor(() => {
      expect(screen.getByText(/Error loading data/i)).toBeInTheDocument();
    });
  });
});
