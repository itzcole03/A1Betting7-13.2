import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import ComprehensiveAdminDashboard from '../ComprehensiveAdminDashboard';

// Mock the custom hooks to control data, loading, and error states
jest.mock('../../../hooks/useEnhancedBets', () => ({
  useEnhancedBets: () => ({
    data: {
      enhanced_bets: [
        {
          id: '1',
          player_name: 'John Doe',
          team: 'A',
          stat_type: 'PTS',
          line: 25.5,
          confidence: 92.1,
          recommendation: 'Over',
        },
        {
          id: '2',
          player_name: 'Jane Smith',
          team: 'B',
          stat_type: 'REB',
          line: 10.5,
          confidence: 85.3,
          recommendation: 'Under',
        },
      ],
    },
    isLoading: false,
    isError: false,
  }),
}));
jest.mock('../../../hooks/usePortfolioOptimization', () => ({
  usePortfolioOptimization: () => ({
    data: { portfolio_metrics: { roi: 12.5, risk: 0.8 } },
    isLoading: false,
    isError: false,
  }),
}));
jest.mock('../../../hooks/useAIInsights', () => ({
  useAIInsights: () => ({
    data: {
      ai_insights: [
        { id: 'insight-1', text: 'AI sees strong upside for John Doe.' },
        { id: 'insight-2', text: 'Jane Smith likely to underperform rebounds.' },
      ],
    },
    isLoading: false,
    isError: false,
  }),
}));

// Provide a QueryClient for React Query context
const queryClient = new QueryClient();

describe('ComprehensiveAdminDashboard', () => {
  it('renders dashboard data and panels when loaded', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ComprehensiveAdminDashboard />
      </QueryClientProvider>
    );

    // Wait for dashboard to render
    await waitFor(() => {
      expect(screen.getByText('Enhanced Bets')).toBeInTheDocument();
    });

    // Check for table data
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('PTS')).toBeInTheDocument();
    expect(screen.getByText('REB')).toBeInTheDocument();
    expect(screen.getByText('92.1%')).toBeInTheDocument();
    expect(screen.getByText('85.3%')).toBeInTheDocument();
    expect(screen.getByText('Over')).toBeInTheDocument();
    expect(screen.getByText('Under')).toBeInTheDocument();

    // Check for AI Insights
    expect(screen.getByText('AI sees strong upside for John Doe.')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith likely to underperform rebounds.')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    jest.resetModules();
    jest.doMock('../../../hooks/useEnhancedBets', () => ({
      useEnhancedBets: () => ({ isLoading: true, isError: false }),
    }));
    jest.doMock('../../../hooks/usePortfolioOptimization', () => ({
      usePortfolioOptimization: () => ({ isLoading: true, isError: false }),
    }));
    jest.doMock('../../../hooks/useAIInsights', () => ({
      useAIInsights: () => ({ isLoading: true, isError: false }),
    }));
    const { default: Dashboard } = require('../ComprehensiveAdminDashboard');
    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );
    expect(screen.getByText(/Loading AI-powered betting intelligence/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    jest.resetModules();
    jest.doMock('../../../hooks/useEnhancedBets', () => ({
      useEnhancedBets: () => ({ isLoading: false, isError: true }),
    }));
    jest.doMock('../../../hooks/usePortfolioOptimization', () => ({
      usePortfolioOptimization: () => ({ isLoading: false, isError: true }),
    }));
    jest.doMock('../../../hooks/useAIInsights', () => ({
      useAIInsights: () => ({ isLoading: false, isError: true }),
    }));
    const { default: Dashboard } = require('../ComprehensiveAdminDashboard');
    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );
    expect(screen.getByText(/Error loading data/i)).toBeInTheDocument();
  });
});
