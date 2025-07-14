// PropOllamaUnified.test.tsx
// Automated tests for unified betting page (PropOllamaUnified)

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PropOllamaUnified from '../PropOllamaUnified';

// Mock backendDiscovery
jest.mock('../../services/backendDiscovery', () => ({
  backendDiscovery: {
    getBackendUrl: async () => '',
  },
}));

describe('PropOllamaUnified', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Mock fetch for /api/prizepicks/props
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
        {
          id: '2',
          player_name: 'Stephen Curry',
          sport: 'NBA',
          stat_type: 'Assists',
          line: 6.5,
          recommendation: 'UNDER',
          confidence: 78,
          reasoning: 'Defensive focus',
          expected_value: 0.08,
        },
      ],
    }) as any;
  });

  it('renders onboarding banner', () => {
    render(<PropOllamaUnified />);
    expect(screen.getByText(/AI-powered sports betting recommendations/i)).toBeInTheDocument();
  });

  it('loads and sorts best bets by confidence', async () => {
    render(<PropOllamaUnified />);
    await waitFor(() => {
      expect(screen.getByText('LeBron James')).toBeInTheDocument();
      expect(screen.getByText('Stephen Curry')).toBeInTheDocument();
    });
    const betNames = screen.getAllByText(/James|Curry/).map(el => el.textContent);
    expect(betNames[0]).toContain('LeBron'); // Highest confidence first
  });

  it('shows confidence badge and bar', async () => {
    render(<PropOllamaUnified />);
    await waitFor(() => {
      expect(screen.getByText('92%')).toBeInTheDocument();
      expect(screen.getByText('78%')).toBeInTheDocument();
    });
  });

  it('expand/collapse explanation', async () => {
    render(<PropOllamaUnified />);
    await waitFor(() => screen.getByText('Show Explanation'));
    const btn = screen.getAllByText('Show Explanation')[0];
    fireEvent.click(btn);
    expect(screen.getByText('Dominant scorer')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Hide Explanation'));
    expect(screen.queryByText('Dominant scorer')).not.toBeInTheDocument();
  });

  it('handles empty state', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [] });
    render(<PropOllamaUnified />);
    await waitFor(() => screen.getByText(/Loading today's best bets/i));
  });

  it('is accessible (banner, buttons)', async () => {
    render(<PropOllamaUnified />);
    await waitFor(() => screen.getByText('Show Explanation'));
    expect(screen.getByLabelText(/Best bet for/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confidence:/i)).toBeInTheDocument();
  });
});
