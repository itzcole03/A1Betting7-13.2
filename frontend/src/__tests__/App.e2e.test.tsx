// App.e2e.test.tsx
// E2E-style tests for critical user journeys: navigation, betting, streaming, settings

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock backendDiscovery for betting page
jest.mock('../services/backendDiscovery', () => ({
  backendDiscovery: {
    getBackendUrl: async () => '',
  },
}));

// Mock fetch for betting page
beforeEach(() => {
  jest.resetAllMocks();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => [
      {
        id: '1',
        player_name: 'LeBron James',
        sport: 'NBA',
        stat_type: 'Points',
        line: 25.5,
        recommendation: 'OVER',
        confidence: 92,
        reasoning: 'Dominant scorer',
        expected_value: 0.18,
      },
    ],
  }) as any;
});

describe('App E2E', () => {
  it('navigates between betting, live stream, and settings pages', async () => {
    render(<App />);
    // Betting page (default)
    await waitFor(() => screen.getByText('LeBron James'));
    expect(screen.getByText(/AI-powered sports betting recommendations/i)).toBeInTheDocument();
    // Simulate navigation to live stream page
    fireEvent.click(screen.getByText(/Live|Stream/i));
    await waitFor(() => screen.getByText(/How to Use:/i));
    expect(screen.getByText(/StreamEast Live Sports/i)).toBeInTheDocument();
    // Simulate navigation to settings page
    fireEvent.click(screen.getByText(/Settings/i));
    await waitFor(() => screen.getByText(/Theme/i));
    expect(screen.getByText(/Theme/i)).toBeInTheDocument();
  });

  it('betting page displays best bets and explanations', async () => {
    render(<App />);
    await waitFor(() => screen.getByText('LeBron James'));
    expect(screen.getByText('LeBron James')).toBeInTheDocument();
    expect(screen.getByText('Show Explanation')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Show Explanation'));
    expect(screen.getByText('Dominant scorer')).toBeInTheDocument();
  });

  it('live stream page displays iframe', async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Live|Stream/i));
    await waitFor(() => screen.getByTitle('StreamEast Live Sports'));
    expect(screen.getByTitle('StreamEast Live Sports')).toBeInTheDocument();
  });

  it('settings page displays theme selection', async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Settings/i));
    await waitFor(() => screen.getByText(/Theme/i));
    expect(screen.getByText(/Theme/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Light|Dark|System/i)).toBeInTheDocument();
  });
});
