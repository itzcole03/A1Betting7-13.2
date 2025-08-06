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
    // Wait for visibleProjections to be logged in the component
    // Wait for both player names to appear in the DOM (at least one match for each)
    const judgeMatches = await screen.findAllByText(/Aaron Judge/i);
    const deversMatches = await screen.findAllByText(/Rafael Devers/i);
    expect(judgeMatches.length).toBeGreaterThan(0);
    expect(deversMatches.length).toBeGreaterThan(0);
    // Wait for both cards to be present and assert their order and content
    await waitFor(() => {
      const wrappers = screen.getAllByTestId('prop-card-wrapper');
      expect(wrappers.length).toBeGreaterThanOrEqual(2);
      // Debug: print card titles
      wrappers.forEach((wrapper, i) => {
        const title = wrapper.querySelector('div.text-white.font-bold.text-lg.leading-tight');
        // eslint-disable-next-line no-console
        console.log(`Card ${i} title (wrapper):`, title && title.textContent);
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
    render(
      <CompositeProvider>
        <PropOllamaUnified />
      </CompositeProvider>
    );
    const mlbTab = await screen.findByRole('tab', { name: /MLB/i });
    mlbTab.click();
    // Wait for both player names to appear in the DOM (at least one match for each)
    const judgeMatches = await screen.findAllByText(/Aaron Judge/i);
    const deversMatches = await screen.findAllByText(/Rafael Devers/i);
    expect(judgeMatches.length).toBeGreaterThan(0);
    expect(deversMatches.length).toBeGreaterThan(0);
    // Wait for both cards to be present and assert their badges
    await waitFor(() => {
      const wrappers = screen.getAllByTestId('prop-card-wrapper');
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
      const badge0 = wrappers[0].querySelector('.bg-black.text-green-400');
      const badge1 = wrappers[1].querySelector('.bg-black.text-green-400');
      expect(badge0 && badge0.textContent).toMatch(/C/); // Grade should be C (for confidence level)
      expect(badge1 && badge1.textContent).toMatch(/C/); // Grade should be C (for confidence level)
      // Debug: log the full HTML of both cards
      // eslint-disable-next-line no-console
      console.log('Card 0 HTML (badge):', wrappers[0].outerHTML);
      // eslint-disable-next-line no-console
      console.log('Card 1 HTML (badge):', wrappers[1].outerHTML);
      // The badge is a div with class 'w-24 h-24 ... text-green-400' and contains the score
      // We'll use querySelector to directly target the badge and check its textContent
      // To ensure correct sorting, check the card titles first
      const card0TitleBadge = wrappers[0].querySelector(
        '.text-white.font-bold.text-lg.leading-tight'
      );
      const card1TitleBadge = wrappers[1].querySelector(
        '.text-white.font-bold.text-lg.leading-tight'
      );
      // Debug: log the text content of both card titles
      // eslint-disable-next-line no-console
      console.log('Card 0 title (badge):', card0TitleBadge && card0TitleBadge.textContent);
      // eslint-disable-next-line no-console
      console.log('Card 1 title (badge):', card1TitleBadge && card1TitleBadge.textContent);
      expect(card0TitleBadge && card0TitleBadge.textContent).toMatch(/Aaron Judge/i);
      expect(card1TitleBadge && card1TitleBadge.textContent).toMatch(/Rafael Devers/i);
      // Now check the badges in the same order
      expect(badge0).toBeTruthy();
      expect(badge1).toBeTruthy();
      // Additional assertions for badge text
      if (badge0 && badge0.textContent && badge1 && badge1.textContent) {
        expect(badge0.textContent.trim()).toBe('C');
        expect(badge1.textContent.trim()).toBe('C');
      }
    });
  });

  it('expand/collapse explanation', async () => {
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
