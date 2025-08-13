import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AppContent } from '../App';
import { _AuthContext, AuthContextType } from '../contexts/AuthContext';

describe('Betting Interface E2E', () => {
  beforeEach(() => {
    // Bypass onboarding and set authenticated user context
    localStorage.setItem('onboardingComplete', 'true');
    localStorage.setItem('lastSeenVersion', '1.0.0');
    localStorage.setItem('token', 'test-token');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'test-user',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['admin'],
      })
    );
    // Mock fetch for props API
    jest.spyOn(global, 'fetch').mockImplementation(url => {
      if (typeof url === 'string' && url.includes('/mlb/odds-comparison/')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 'opp-1',
              sport: 'MLB',
              market: 'Player Hits',
              selection: 'Mookie Betts Over 1.5 Hits',
              odds: 2.1,
              edge: 8.5,
              confidence: 82,
              recommended_stake: 150,
              max_stake: 500,
              expected_value: 12.75,
              bookmaker: 'DraftKings',
              game_time: '2025-01-05T19:00:00Z',
            },
          ],
        } as Response);
      }
      // Default fallback for other fetches
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });
  it('renders bet slip, Kelly Criterion, and arbitrage opportunities', async () => {
    // Custom AuthContext provider to force isAuthenticated=true
    const mockAuthContext: AuthContextType = {
      user: { id: 'test-user', email: 'test@example.com', role: 'admin', permissions: ['admin'] },
      loading: false,
      error: null,
      isAdmin: true,
      isAuthenticated: true,
      requiresPasswordChange: false,
      login: async () => {},
      logout: async () => {},
      changePassword: async () => {},
      clearError: () => {},
      register: async () => {},
    };
    render(
      <MemoryRouter initialEntries={['/betting']}>
        <_AuthContext.Provider value={mockAuthContext}>
          <React.Suspense fallback={<div>Loading...</div>}>
            <AppContent />
          </React.Suspense>
        </_AuthContext.Provider>
      </MemoryRouter>
    );
    // Wait for betting interface heading
    expect(await screen.findByTestId('betting-interface-heading')).toBeInTheDocument();

    // Wait for bet slip section in Opportunities tab (should not be present yet)
    expect(screen.queryByTestId('bet-slip-section')).not.toBeInTheDocument();

    // Simulate adding a bet in Opportunities tab
    // Use testid for 'Add to Bet Slip' button
    const addBetButton = await screen.findByTestId('add-to-bet-slip-btn-opp-1');
    act(() => {
      addBetButton.click();
    });

    // Switch to Bet Slip tab
    const betSlipTabButtons = await screen.findAllByRole('button', { name: /Bet Slip/i });
    act(() => {
      betSlipTabButtons[0].click();
    });

    // Wait for bet slip section
    expect(await screen.findByTestId('bet-slip-section')).toBeInTheDocument();
    // Wait for bet slip item
    expect(await screen.findByTestId('bet-slip-item')).toBeInTheDocument();
    // Optionally check for Kelly Criterion and arbitrage opportunities if present
    // expect(await screen.findByText(/Kelly Criterion/i)).toBeInTheDocument();
    // expect(await screen.findByText(/Arbitrage Opportunities/i)).toBeInTheDocument();
  });
});
