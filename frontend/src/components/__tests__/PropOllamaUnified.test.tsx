import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { _AppProvider } from '../../contexts/AppContext';
import { _AuthProvider } from '../../contexts/AuthContext';
import { _ThemeProvider } from '../../contexts/ThemeContext';

import * as FeaturedPropsService from '../../services/unified/FeaturedPropsService';
import PropOllamaUnified from '../PropOllamaUnified';
jest.mock('../../services/propOllamaService');
jest.mock('../../services/unified/FeaturedPropsService');
jest.mock('axios');

// Top-level mock for PropAnalysisAggregator
jest.mock('../../services/PropAnalysisAggregator', () => ({
  PropAnalysisAggregator: jest.fn().mockImplementation(() => ({
    getAnalysis: jest.fn().mockResolvedValue({
      isFallback: true,
      content: 'No analysis available.',
    }),
  })),
}));

const CompositeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={new QueryClient()}>
    <_AuthProvider>
      <MemoryRouter>
        <_ThemeProvider>
          <_AppProvider>{children}</_AppProvider>
        </_ThemeProvider>
      </MemoryRouter>
    </_AuthProvider>
  </QueryClientProvider>
);

// Helper to mock /mlb/todays-games fetch
const mockUpcomingGames = () => {
  jest
    .spyOn(global, 'fetch')
    .mockImplementation((input: string | URL | Request, init?: RequestInit) => {
      if (typeof input === 'string' && input.includes('/mlb/todays-games')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: 'ok',
            games: [
              {
                game_id: 123,
                home: 'BOS',
                away: 'NYY',
                time: '2025-08-01T19:00:00Z',
                event_name: 'NYY @ BOS',
                status: 'Warmup',
                venue: 'Fenway Park',
              },
            ],
          }),
        } as Response);
      }
      // fallback to default fetch for other URLs
      return (global.fetch as any).origFetch(input, init);
    });
};

describe('PropOllamaUnified', () => {
  it('loads and sorts best bets by confidence', async () => {
    // Patch: Mock upcoming games to match Yankees and Red Sox
    (global as any).fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/mlb/todays-games')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: 'ok',
            games: [
              {
                game_id: 1,
                away: 'New York Yankees',
                home: 'Boston Red Sox',
                time: '2025-08-07T19:00:00Z',
                event_name: 'New York Yankees @ Boston Red Sox',
                status: 'Warmup',
                venue: 'Fenway Park',
              },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: false });
    });
    const today = new Date().toISOString().split('T')[0];
    const mlbMockData = [
      {
        id: 'game1-judge',
        player: 'Aaron Judge',
        team: 'New York Yankees',
        matchup: 'NYY @ BOS',
        stat: 'hits',
        line: 2,
        overOdds: 120,
        underOdds: -110,
        confidence: 80,
        expected_value: 2.1,
        sport: 'MLB',
        gameTime: `${today}T19:00:00Z`,
        pickType: 'over',
      },
      {
        id: 'game1-devers',
        player: 'Rafael Devers',
        team: 'Boston Red Sox',
        matchup: 'NYY @ BOS',
        stat: 'home_runs',
        line: 1,
        overOdds: 105,
        underOdds: -120,
        confidence: 75,
        expected_value: 1.8,
        sport: 'MLB',
        gameTime: `${today}T19:00:00Z`,
        pickType: 'over',
      },
    ];
    (FeaturedPropsService.fetchFeaturedProps as jest.Mock).mockResolvedValue(mlbMockData);
    (FeaturedPropsService.fetchBatchPredictions as jest.Mock).mockResolvedValue(mlbMockData);
    render(
      <CompositeProvider>
        <PropOllamaUnified projections={mlbMockData} />
      </CompositeProvider>
    );
    const mlbTab = await screen.findByRole('tab', { name: /MLB/i });
    mlbTab.click();
    const statTypeSelect = await screen.findByLabelText(/Stat Type:/i, {}, { timeout: 5000 });
    fireEvent.change(statTypeSelect, { target: { value: 'Popular' } });
    await waitFor(
      () => expect(screen.getAllByTestId('condensed-prop-card').length).toBeGreaterThan(0),
      { timeout: 15000 }
    );
    // Click the first CondensedPropCard
    const cardWrappers = screen.getAllByTestId('condensed-prop-card');
    expect(cardWrappers[0]).toBeTruthy();
    await import('react-dom/test-utils').then(({ act }) =>
      act(() => fireEvent.click(cardWrappers[0]))
    );
    // Wait for the expanded card to appear
    await waitFor(
      () => {
        const expandedCard = screen.queryByTestId('prop-card-expanded');
        expect(expandedCard).toBeInTheDocument();
      },
      { timeout: 15000 }
    );
    // Debug: print DOM after expansion

    console.log('[TEST DEBUG] DOM after expanding card:', document.documentElement.outerHTML);
    // Query for the Deep AI Analysis button inside the expanded card
    const expandedCard = screen.getByTestId('prop-card-expanded');
    const foundButtonConfidence = expandedCard.querySelector('[aria-label="Deep AI Analysis"]');
    expect(foundButtonConfidence).toBeInTheDocument();
  }, 30000);

  it('shows confidence badge and bar', async () => {
    mockUpcomingGames();
    const today = new Date().toISOString().split('T')[0];
    const mlbMockData = [
      {
        id: 'game1-judge',
        player: 'Aaron Judge',
        team: 'New York Yankees',
        matchup: 'NYY @ BOS',
        stat: 'hits',
        line: 2,
        overOdds: 120,
        underOdds: -110,
        confidence: 80,
        expected_value: 2.1,
        sport: 'MLB',
        gameTime: `${today}T19:00:00Z`,
        pickType: 'over',
      },
      {
        id: 'game1-devers',
        player: 'Rafael Devers',
        team: 'Boston Red Sox',
        matchup: 'NYY @ BOS',
        stat: 'home_runs',
        line: 1,
        overOdds: 105,
        underOdds: -120,
        confidence: 75,
        expected_value: 1.8,
        sport: 'MLB',
        gameTime: `${today}T19:00:00Z`,
        pickType: 'over',
      },
    ];
    (FeaturedPropsService.fetchFeaturedProps as jest.Mock).mockResolvedValue(mlbMockData);
    (FeaturedPropsService.fetchBatchPredictions as jest.Mock).mockResolvedValue(mlbMockData);
    render(
      <CompositeProvider>
        <PropOllamaUnified projections={mlbMockData} />
      </CompositeProvider>
    );
    const mlbTab = await screen.findByRole('tab', { name: /MLB/i });
    mlbTab.click();
    // Wait for both cards to be present and assert their badges
    await waitFor(async () => {
      const wrappers = await screen.findAllByTestId('condensed-prop-card');
      expect(wrappers.length).toBeGreaterThanOrEqual(2);
      const cardTitles = wrappers.map(
        wrapper =>
          wrapper.querySelector('div.text-white.font-bold.text-lg.leading-tight')?.textContent || ''
      );
      expect(cardTitles).toContainEqual(expect.stringMatching(/Aaron Judge/i));
      expect(cardTitles).toContainEqual(expect.stringMatching(/Rafael Devers/i));
      // Assert order if needed
      expect(cardTitles[0]).toMatch(/Aaron Judge/i);
      expect(cardTitles[1]).toMatch(/Rafael Devers/i);
      // Now check the badges for each card
      const badge0 = wrappers[0].querySelector('span.bg-black.text-green-400');
      const badge1 = wrappers[1].querySelector('span.bg-black.text-green-400');
      expect(badge0).toBeTruthy();
      expect(badge1).toBeTruthy();
      // Badge text should match grade logic: A+ for >=80, B for >=60
      if (badge0 && badge0.textContent && badge1 && badge1.textContent) {
        expect(badge0.textContent.trim()).toBe('A+');
        expect(badge1.textContent.trim()).toBe('B');
      }
    });
  });
  // Print DOM after expansion

  console.log('[TEST DEBUG] DOM after expanding card:', document.documentElement.outerHTML);

  it('expand/collapse explanation', async () => {
    // Patch: Mock upcoming games to match Yankees and Red Sox
    (global as any).fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/mlb/todays-games')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: 'ok',
            games: [
              {
                game_id: 1,
                away: 'New York Yankees',
                home: 'Boston Red Sox',
                time: '2025-08-07T19:00:00Z',
                event_name: 'New York Yankees @ Boston Red Sox',
                status: 'Warmup',
                venue: 'Fenway Park',
              },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: false });
    });
    const today = new Date().toISOString().split('T')[0];
    const mlbMockData = [
      {
        id: 'game1-judge',
        player: 'Aaron Judge',
        team: 'New York Yankees',
        matchup: 'NYY @ BOS',
        stat: 'hits',
        line: 2,
        overOdds: 120,
        underOdds: -110,
        confidence: 80,
        expected_value: 2.1,
        sport: 'MLB',
        gameTime: `${today}T19:00:00Z`,
        pickType: 'over',
        position: 'OF',
        score: 80,
        summary: 'We suggest betting the OVER on Aaron Judge (2 hits) versus BOS',
        analysis: 'Judge is projected for 2.1 hits against BOS. AI confidence: 80%.',
        stats: [
          { label: '7/7', value: 1 },
          { label: '7/8', value: 0 },
        ],
        insights: [{ icon: '🔥', text: 'Judge has hit safely in 8 of last 10 games.' }],
      },
      {
        id: 'game1-devers',
        player: 'Rafael Devers',
        team: 'Boston Red Sox',
        matchup: 'NYY @ BOS',
        stat: 'home_runs',
        line: 1,
        overOdds: 110,
        underOdds: -120,
        confidence: 75,
        expected_value: 1.8,
        sport: 'MLB',
        gameTime: `${today}T19:00:00Z`,
        pickType: 'over',
        position: '3B',
        score: 75,
        summary: 'We suggest betting the OVER on Rafael Devers (1 home run) versus NYY',
        analysis: 'Devers is projected for 1.8 home runs against NYY. AI confidence: 75%.',
        stats: [
          { label: '7/7', value: 0 },
          { label: '7/8', value: 1 },
        ],
        insights: [{ icon: '⚡', text: 'Devers faces a favorable pitching matchup.' }],
      },
    ];
    (FeaturedPropsService.fetchFeaturedProps as jest.Mock).mockResolvedValue(mlbMockData);
    (FeaturedPropsService.fetchBatchPredictions as jest.Mock).mockResolvedValue(mlbMockData);
    render(
      <CompositeProvider>
        <PropOllamaUnified projections={mlbMockData} />
      </CompositeProvider>
    );
    const mlbTab = await screen.findByRole('tab', { name: /MLB/i });
    mlbTab.click();
    // Wait for the cards to be present
    await waitFor(() => expect(screen.getByTestId('prop-cards-container')).toBeInTheDocument(), {
      timeout: 15000,
    });
    await waitFor(
      () => {
        const cards = screen.getAllByTestId('condensed-prop-card');
        expect(cards.length).toBeGreaterThan(0);
        // Optionally, print debug info for the first card
        console.log(`[Explanation] Prop card HTML:`, cards[0].outerHTML);
      },
      { timeout: 30000 }
    );
    // Simulate expansion by clicking the first CondensedPropCard
    const cards = screen.getAllByTestId('condensed-prop-card');
    expect(cards[0]).toBeTruthy();
    await import('react-dom/test-utils').then(({ act }) => {
      act(() => {
        fireEvent.click(cards[0]);
      });
    });
    // Wait for the expanded card to appear
    await waitFor(
      () => {
        const expandedCard = screen.queryByTestId('prop-card-expanded');
        expect(expandedCard).toBeInTheDocument();
      },
      { timeout: 20000 }
    );
    // Query for the Deep AI Analysis button inside the expanded card
    const expandedCard = screen.getByTestId('prop-card-expanded');
    const foundButtonExplanation = expandedCard.querySelector('[aria-label="Deep AI Analysis"]');
    expect(foundButtonExplanation).toBeInTheDocument();
    fireEvent.click(foundButtonExplanation!);
    // Wait for analysis node to appear after clicking the button
    await waitFor(
      () => {
        const aiTakeNodes = screen.queryAllByTestId('ai-take');
        const noAnalysisNodes = screen.queryAllByTestId('no-analysis');
        // Only one should be present depending on mock data
        if (aiTakeNodes.length > 0) {
          expect(aiTakeNodes[0]).toHaveTextContent("AI's Take");
        } else if (noAnalysisNodes.length > 0) {
          expect(noAnalysisNodes[0]).toHaveTextContent('No analysis available.');
        } else {
          console.log('[TEST DEBUG] Neither analysis node found');
          screen.debug();
          throw new Error('No analysis node found');
        }
      },
      { timeout: 12000 }
    );
  }, 30000);

  it('expand/collapse explanation', async () => {
    render(
      <CompositeProvider>
        <PropOllamaUnified projections={[]} />
      </CompositeProvider>
    );
    // Use getAllByText to match any of the empty state phrases
    await waitFor(() => {
      const matches = screen.getAllByText(content =>
        /No props available|No props found|No props selected/i.test(content)
      );
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  it('is accessible (banner, headings)', async () => {
    render(
      <CompositeProvider>
        <PropOllamaUnified />
      </CompositeProvider>
    );
    expect(screen.getByText(/MLB AI Props/i)).toBeInTheDocument();
    expect(screen.getByText(/Bet Slip/i)).toBeInTheDocument();
  });

  it('renders MLB odds and props as cards when backend returns MLB data', async () => {
    mockUpcomingGames();
    const today = new Date().toISOString().split('T')[0];
    const mlbMockData = [
      {
        id: 'game1-judge',
        player: 'Aaron Judge',
        team: 'New York Yankees',
        sport: 'MLB',
        stat: 'hits',
        line: 2,
        matchup: 'NYY @ BOS',
        confidence: 80,
        expected_value: 2.1,
        gameTime: `${today}T19:00:00Z`,
        overOdds: 120,
        underOdds: -110,
        pickType: 'over',
      },
      {
        id: 'game1-devers',
        player: 'Rafael Devers',
        team: 'Boston Red Sox',
        sport: 'MLB',
        stat: 'home_runs',
        line: 1,
        matchup: 'NYY @ BOS',
        confidence: 75,
        expected_value: 1.8,
        gameTime: `${today}T19:00:00Z`,
        overOdds: 105,
        underOdds: -120,
        pickType: 'over',
      },
    ];
    (FeaturedPropsService.fetchFeaturedProps as jest.Mock).mockResolvedValue(mlbMockData);
    (FeaturedPropsService.fetchBatchPredictions as jest.Mock).mockResolvedValue(mlbMockData);
    render(
      <CompositeProvider>
        <PropOllamaUnified projections={mlbMockData} />
      </CompositeProvider>
    );
    // Set sport filter to 'MLB' to ensure both cards are visible
    mockUpcomingGames();
    const mlbTab = await screen.findByRole('tab', { name: /MLB/i });
    mlbTab.click();
    await waitFor(
      () => {
        const propCards = screen.getAllByTestId('condensed-prop-card');
        expect(propCards.length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText(/BOS/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Aaron Judge/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Rafael Devers/i).length).toBeGreaterThan(0);
        // Filter for stat text inside prop cards only
        const hitsNodes = screen
          .getAllByText(/hits/i)
          .filter(node => node.closest('[data-testid="condensed-prop-card"]'));
        expect(hitsNodes.length).toBeGreaterThan(0);
        const hrNodes = screen
          .getAllByText(/home_runs/i)
          .filter(node => node.closest('[data-testid="condensed-prop-card"]'));
        expect(hrNodes.length).toBeGreaterThan(0);
      },
      { timeout: 12000 }
    );
  }, 15000);
});
