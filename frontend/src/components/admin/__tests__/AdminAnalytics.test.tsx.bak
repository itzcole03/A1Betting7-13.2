import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import AdminAnalytics from '../AdminAnalytics';

// Mock the AuthContext
const mockAuthContext = {
  user: { role: 'admin', permissions: ['admin'] },
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  loading: false,
  error: null,
  requiresPasswordChange: false,
  changePassword: vi.fn(),
};

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AdminAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/analytics/summary')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            totalBets: 1247,
            totalStake: 45680,
            averageEV: 3.7,
            totalArbitrages: 23,
            providerCount: 5,
            lastUpdated: new Date().toISOString(),
          }),
        });
      }
      
      if (url.includes('/api/analytics/daily-ev-stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            trends: Array.from({ length: 30 }, (_, i) => ({
              date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              ev: 2.5 + Math.random() * 3,
              count: Math.floor(50 + Math.random() * 100),
            })),
          }),
        });
      }
      
      if (url.includes('/api/analytics/daily-arb-stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            current24h: 23,
            previous24h: 18,
            percentageChange: 27.8,
            averageProfit: 2.4,
          }),
        });
      }
      
      if (url.includes('/api/odds/providers/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            providers: [
              { name: 'DraftKings', status: 'healthy', confidence: 98.5, lastSync: '2 min ago', responseTime: 145, errorRate: 0.1 },
              { name: 'FanDuel', status: 'healthy', confidence: 97.2, lastSync: '1 min ago', responseTime: 167, errorRate: 0.2 },
              { name: 'BetMGM', status: 'degraded', confidence: 85.3, lastSync: '5 min ago', responseTime: 342, errorRate: 1.2 },
            ],
          }),
        });
      }
      
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders analytics dashboard for admin users', async () => {
    render(<AdminAnalytics />);
    
    // Check header
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText('EV & Arbitrage insights for administrators')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('3.70%')).toBeInTheDocument(); // Average EV
      expect(screen.getByText('23')).toBeInTheDocument(); // Arbitrage count
    });
  });

  it('shows access denied for non-admin users', async () => {
    // Mock non-admin user by re-mocking the module
    vi.doMock('../../../contexts/AuthContext', () => ({
      useAuth: () => ({
        ...mockAuthContext,
        user: { role: 'user', permissions: [] },
      }),
    }));
    
    // Re-import the component with new mock
    const { default: AdminAnalyticsNonAdmin } = await import('../AdminAnalytics');
    
    render(<AdminAnalyticsNonAdmin />);
    
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText('Administrator privileges required to access analytics dashboard.')).toBeInTheDocument();
  });

  it('displays key metrics correctly', async () => {
    render(<AdminAnalytics />);
    
    await waitFor(() => {
      // Check all key metrics are displayed
      expect(screen.getByText('Average EV')).toBeInTheDocument();
      expect(screen.getByText('Arbitrage Count (24h)')).toBeInTheDocument();
      expect(screen.getByText('Active Providers')).toBeInTheDocument();
      expect(screen.getByText('Total Opportunities')).toBeInTheDocument();
      
      // Check specific values
      expect(screen.getByText('3.70%')).toBeInTheDocument();
      expect(screen.getByText('23')).toBeInTheDocument();
      expect(screen.getByText('3/3')).toBeInTheDocument(); // 3 healthy out of 3 providers
      expect(screen.getByText('1,247')).toBeInTheDocument();
    });
  });

  it('displays provider confidence table', async () => {
    render(<AdminAnalytics />);
    
    await waitFor(() => {
      // Check table headers
      expect(screen.getByText('Provider Confidence & Status')).toBeInTheDocument();
      expect(screen.getByText('Provider')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Confidence')).toBeInTheDocument();
      
      // Check provider data
      expect(screen.getByText('DraftKings')).toBeInTheDocument();
      expect(screen.getByText('FanDuel')).toBeInTheDocument();
      expect(screen.getByText('BetMGM')).toBeInTheDocument();
    });
  });

  it('handles auto-refresh toggle', async () => {
    render(<AdminAnalytics />);
    
    await waitFor(() => {
      const autoRefreshButton = screen.getByText('Auto-refresh');
      expect(autoRefreshButton).toBeInTheDocument();
      
      // Should start enabled
      expect(autoRefreshButton.closest('button')).toHaveClass('bg-green-500/20');
      
      // Click to disable
      fireEvent.click(autoRefreshButton.closest('button')!);
      expect(autoRefreshButton.closest('button')).toHaveClass('bg-slate-700');
    });
  });

  it('handles manual refresh', async () => {
    render(<AdminAnalytics />);
    
    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeInTheDocument();
      
      // Clear previous fetch calls
      mockFetch.mockClear();
      
      // Click refresh
      fireEvent.click(refreshButton);
      
      // Should trigger new API calls
      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/summary');
      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/daily-ev-stats');
      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/daily-arb-stats');
      expect(mockFetch).toHaveBeenCalledWith('/api/odds/providers/status');
    });
  });

  it('toggles between chart modes', async () => {
    render(<AdminAnalytics />);
    
    await waitFor(() => {
      const chartModeButton = screen.getByText('ASCII Mode');
      expect(chartModeButton).toBeInTheDocument();
      
      // Click to switch to ASCII mode
      fireEvent.click(chartModeButton);
      expect(screen.getByText('Chart Mode')).toBeInTheDocument();
      
      // Should show ASCII chart elements
      expect(screen.getByText('Expected Value Trend')).toBeInTheDocument();
    });
  });

  it('displays EV trend chart', async () => {
    render(<AdminAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText('EV Trend (30 Days)')).toBeInTheDocument();
      
      // Should render SVG chart by default
      const svgElement = screen.getByRole('img', { hidden: true }); // SVG has implicit img role
      expect(svgElement).toBeInTheDocument();
    });
  });

  it('displays high EV distribution', async () => {
    render(<AdminAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText('High EV Distribution')).toBeInTheDocument();
      
      // Check distribution tiers
      expect(screen.getByText('Ultra High')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Low')).toBeInTheDocument();
      
      // Check ranges
      expect(screen.getByText('10%+')).toBeInTheDocument();
      expect(screen.getByText('5-10%')).toBeInTheDocument();
      expect(screen.getByText('2-5%')).toBeInTheDocument();
      expect(screen.getByText('0-2%')).toBeInTheDocument();
    });
  });

  it('handles API failures gracefully', async () => {
    // Mock API failures
    mockFetch.mockRejectedValue(new Error('API Error'));
    
    render(<AdminAnalytics />);
    
    await waitFor(() => {
      // Should still render with fallback data
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      
      // Should show fallback metrics
      expect(screen.getByText('3.70%')).toBeInTheDocument(); // Fallback average EV
    });
  });

  it('displays loading state initially', () => {
    render(<AdminAnalytics />);
    
    // Should show loading initially
    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('shows error message when API fails', async () => {
    // Mock API to fail after initial success
    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      if (callCount <= 4) {
        // First few calls succeed to get past loading state
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ totalBets: 0 }),
        });
      }
      // Later calls fail
      return Promise.reject(new Error('Network error'));
    });
    
    render(<AdminAnalytics />);
    
    // Wait for initial load, then trigger refresh to cause error
    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Analytics Error:/)).toBeInTheDocument();
    });
  });

  it('calculates average response time correctly', async () => {
    render(<AdminAnalytics />);
    
    await waitFor(() => {
      // Average of 145, 167, 342 should be 218
      expect(screen.getByText('Avg 218ms response')).toBeInTheDocument();
    });
  });

  it('displays arbitrage percentage change with correct styling', async () => {
    render(<AdminAnalytics />);
    
    await waitFor(() => {
      const changeElement = screen.getByText('+27.8% vs prev 24h');
      expect(changeElement).toBeInTheDocument();
      expect(changeElement).toHaveClass('text-green-400'); // Positive change should be green
    });
  });

  it('shows provider status badges with correct colors', async () => {
    render(<AdminAnalytics />);
    
    await waitFor(() => {
      // Should show status badges
      const healthyBadges = screen.getAllByText('healthy');
      expect(healthyBadges).toHaveLength(2); // DraftKings and FanDuel
      
      const degradedBadge = screen.getByText('degraded');
      expect(degradedBadge).toBeInTheDocument(); // BetMGM
    });
  });
});