import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
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
  jest.spyOn(global, 'fetch').mockImplementation((url: RequestInfo, options?: RequestInit) => {
    if (typeof url === 'string' && url.includes('/mlb/todays-games')) {
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
    return (global.fetch as any).origFetch(url, options);
  });
};

describe('PropOllamaUnified', () => {
  it('loads and sorts best bets by confidence', async () => {
    const mlbMockData = [
      {
        id: 'game1-judge',
        player: 'Aaron Judge',
        team: 'New York Yankees',
        matchup: 'NYY @ BOS',
        stat: 'Total Runs',
        line: 8.5,
        overOdds: 120,
        underOdds: -110,
        confidence: 0.8,
        expected_value: 2.1,
        sport: 'MLB',
        gameTime: '2025-08-01T19:00:00Z',
        pickType: 'over',
      },
      {
        id: 'game1-devers',
        player: 'Rafael Devers',
        team: 'Boston Red Sox',
        matchup: 'NYY @ BOS',
        stat: 'Hits',
        line: 1.5,
        overOdds: 105,
        underOdds: -120,
        confidence: 0.7,
        expected_value: 1.8,
        sport: 'MLB',
        gameTime: '2025-08-01T19:00:00Z',
        pickType: 'over',
      },
    ];
    (FeaturedPropsService.fetchFeaturedProps as jest.Mock).mockResolvedValue(mlbMockData);
    (FeaturedPropsService.fetchBatchPredictions as jest.Mock).mockResolvedValue(mlbMockData);
    // Debug: log the mock data used for this test
    // eslint-disable-next-line no-console
    console.log('[TEST DEBUG] mlbMockData:', JSON.stringify(mlbMockData));
    render(
      <CompositeProvider>
        <PropOllamaUnified />
      </CompositeProvider>
    );
    const mlbTab = await screen.findByRole('tab', { name: /MLB/i });
    mlbTab.click();
    // Wait for both cards to be present and assert their order and content
    await waitFor(async () => {
      const wrappers = await screen.findAllByTestId('prop-card-wrapper');
      expect(wrappers.length).toBeGreaterThanOrEqual(2);
      wrappers.forEach((wrapper, i) => {
        // Debug: print card HTML and player name
        // eslint-disable-next-line no-console
        console.log(`Card ${i} HTML:`, wrapper.outerHTML);
        const playerDiv = wrapper.querySelector('div.text-white.font-bold.text-lg.leading-tight');
        // eslint-disable-next-line no-console
        console.log(`Card ${i} player:`, playerDiv && playerDiv.textContent);
      });
      const cardTitles = wrappers.map(
        wrapper =>
          wrapper.querySelector('div.text-white.font-bold.text-lg.leading-tight')?.textContent || ''
      );
      expect(cardTitles).toContainEqual(expect.stringMatching(/Aaron Judge/i));
      expect(cardTitles).toContainEqual(expect.stringMatching(/Rafael Devers/i));
      // Assert order if needed
      expect(cardTitles[0]).toMatch(/Aaron Judge/i);
      expect(cardTitles[1]).toMatch(/Rafael Devers/i);
    });
  });

  it('shows confidence badge and bar', async () => {
    // (moved below, after cards is defined)
    // (moved below, after cards is defined)
    mockUpcomingGames();
    const mlbMockData = [
    const mlbTab = await screen.findByRole('tab', { name: /MLB/i });
      {
        id: 'game1-judge',
        player: 'Aaron Judge',
        team: 'New York Yankees',
        matchup: 'NYY @ BOS',
        stat: 'Total Runs',
        line: 8.5,
        overOdds: 120,
        underOdds: -110,
        confidence: 0.8,
        expected_value: 2.1,
        sport: 'MLB',
        gameTime: '2025-08-01T19:00:00Z',
        pickType: 'over',
      },
      {
        id: 'game1-devers',
        player: 'Rafael Devers',
        team: 'Boston Red Sox',
        matchup: 'NYY @ BOS',
        stat: 'Hits',
        line: 1.5,
        overOdds: 105,
        underOdds: -120,
        confidence: 0.7,
        expected_value: 1.8,
        sport: 'MLB',
        gameTime: '2025-08-01T19:00:00Z',
        pickType: 'over',
      },
    ];
    (FeaturedPropsService.fetchFeaturedProps as jest.Mock).mockResolvedValue(mlbMockData);
    (FeaturedPropsService.fetchBatchPredictions as jest.Mock).mockResolvedValue(mlbMockData);
    render(
      <CompositeProvider>
        <PropOllamaUnified />
      </CompositeProvider>
    );
    const mlbTab = await screen.findByRole('tab', { name: /MLB/i });
    mlbTab.click();
    // Wait for both cards to be present and assert their badges
    await waitFor(async () => {
      const wrappers = await screen.findAllByTestId('prop-card-wrapper');
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
      // Debug: log the badge text and card HTML
      // eslint-disable-next-line no-console
      console.log('Card 0 badge:', badge0 && badge0.textContent);
      // eslint-disable-next-line no-console
      console.log('Card 1 badge:', badge1 && badge1.textContent);
      // eslint-disable-next-line no-console
      console.log('Card 0 HTML (badge):', wrappers[0].outerHTML);
      // eslint-disable-next-line no-console
      console.log('Card 1 HTML (badge):', wrappers[1].outerHTML);
      expect(badge0 && badge0.textContent).toMatch(/C/); // Grade should be C (for confidence level)
      expect(badge1 && badge1.textContent).toMatch(/C/); // Grade should be C (for confidence level)
      expect(badge0).toBeTruthy();
      expect(badge1).toBeTruthy();
      if (badge0 && badge0.textContent && badge1 && badge1.textContent) {
        expect(badge0.textContent.trim()).toBe('C');
        expect(badge1.textContent.trim()).toBe('C');
      }
    });
  });

  it('expand/collapse explanation', async () => {
    mockUpcomingGames();
    const mlbMockData = [
    const mlbTab = await screen.findByRole('tab', { name: /MLB/i });
      {
        id: 'game1-judge',
        player: 'Aaron Judge',
        team: 'New York Yankees',
        matchup: 'NYY @ BOS',
        stat: 'Total Runs',
        line: 8.5,
        overOdds: 120,
        underOdds: -110,
        confidence: 0.8,
        expected_value: 2.1,
        sport: 'MLB',
        gameTime: '2025-08-01T19:00:00Z',
        pickType: 'over',
      },
    ];
    (FeaturedPropsService.fetchFeaturedProps as jest.Mock).mockResolvedValue(mlbMockData);
    (FeaturedPropsService.fetchBatchPredictions as jest.Mock).mockResolvedValue(mlbMockData);
    render(
      <CompositeProvider>
        <PropOllamaUnified />
      </CompositeProvider>
    );
    await waitFor(() => expect(screen.getAllByText(/Aaron Judge/).length).toBeGreaterThan(0));
    // Simulate clicking the card to expand (since expand is onClick on card div)
    const cardsExpand = screen.getAllByTestId('prop-card');
    cardsExpand[0].click();
    // Wait for analysis node to appear (AI's Take)
    await waitFor(() => {
      const expandedCards = screen.getAllByTestId('prop-card');
      expect(expandedCards.length).toBeGreaterThan(0);
    });
    // Check if AI analysis text exists
    await waitFor(() => {
      // Look for either AI's Take or Deep AI Analysis text
      const hasAIText =
        screen.queryByText(/AI's Take/i) ||
        screen.queryByText(/Deep AI Analysis/i) ||
        screen.queryByText(/Analysis/i);
      expect(hasAIText).toBeInTheDocument();
    });
  });

  it('handles empty state', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: [] });
    render(
      <CompositeProvider>
        <PropOllamaUnified />
      </CompositeProvider>
    );
    await waitFor(() => screen.getByText(/No props available|No props found|No props selected/i));
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
});

it('renders MLB odds and props as cards when backend returns MLB data', async () => {
    mockUpcomingGames();
    const mlbMockData = [
    {
      id: 'game1-judge',
      player: 'Aaron Judge',
      team: 'New York Yankees',
      sport: 'MLB',
      stat: 'Total Runs',
      line: 8.5,
      matchup: 'NYY @ BOS',
      confidence: 0.8,
      expected_value: 2.1,
    },
    {
      id: 'game1-devers',
      player: 'Rafael Devers',
      team: 'Boston Red Sox',
      sport: 'MLB',
      stat: 'Hits',
      line: 1.5,
      matchup: 'NYY @ BOS',
      confidence: 0.7,
      expected_value: 1.8,
    },
  ];
  (FeaturedPropsService.fetchFeaturedProps as jest.Mock).mockResolvedValue(mlbMockData);
  (FeaturedPropsService.fetchBatchPredictions as jest.Mock).mockResolvedValue(mlbMockData);
  render(
    <CompositeProvider>
      <PropOllamaUnified />
    </CompositeProvider>
  );
  // Set sport filter to 'MLB' to ensure both cards are visible
  mockUpcomingGames();
  const mlbTab = await screen.findByRole('tab', { name: /MLB/i });
  mlbTab.click();
  await waitFor(() => {
    const propCards = screen.getAllByTestId('prop-card-wrapper');
    expect(propCards.length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/BOS/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Aaron Judge/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Rafael Devers/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Total Runs/i)).toBeInTheDocument();
  });
});
