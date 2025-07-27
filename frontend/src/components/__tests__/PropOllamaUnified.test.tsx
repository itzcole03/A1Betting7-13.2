import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { _AppProvider } from '../../contexts/AppContext';
import { _AuthProvider } from '../../contexts/AuthContext';
import { _ThemeProvider } from '../../contexts/ThemeContext';
import propOllamaService from '../../services/propOllamaService';
import PropOllamaUnified from '../PropOllamaUnified';
jest.mock('../../services/propOllamaService');
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
  it.skip('loads and sorts best bets by confidence', async () => {});

  it.skip('shows confidence badge and bar', async () => {});

  it.skip('expand/collapse explanation', async () => {});

  it('handles empty state', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { messages: [] } });
    (propOllamaService.sendChatMessage as jest.Mock).mockResolvedValueOnce({ best_bets: [] });
    render(
      <CompositeProvider>
        <PropOllamaUnified />
      </CompositeProvider>
    );
    await waitFor(() => screen.getByText(/No analyst conversation yet/i));
  });

  it('is accessible (banner, buttons)', async () => {
    render(
      <CompositeProvider>
        <PropOllamaUnified />
      </CompositeProvider>
    );
    expect(
      screen.getByText(/Elite Sports Analyst AI - Ensemble Betting Insights/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Ask about betting strategy, player props, or insights/i)
    ).toBeInTheDocument();
  });
});
