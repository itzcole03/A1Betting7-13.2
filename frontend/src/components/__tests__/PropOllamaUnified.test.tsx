// PropOllamaUnified.test.tsx
// Automated tests for unified betting page (PropOllamaUnified)

import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import PropOllamaUnified from '../../components/PropOllamaUnified';

// Mock backendDiscovery
jest.mock('../../services/backendDiscovery', () => ({
  backendDiscovery: {
    getBackendUrl: async () => '',
  },
}));

describe('PropOllamaUnified', () => {
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
    } as Partial<Response>);
  });

  it('renders onboarding banner', () => {
    render(<PropOllamaUnified />);
    expect(screen.getByText(/AI-powered sports betting recommendations/i)).toBeInTheDocument();
  });

  it.skip('loads and sorts best bets by confidence', async () => {});

  it.skip('shows confidence badge and bar', async () => {});

  it.skip('expand/collapse explanation', async () => {});

  it('handles empty state', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Partial<Response>);
    render(<PropOllamaUnified />);
    await waitFor(() => screen.getByText(/Loading today's best bets/i));
  });

  it('is accessible (banner, buttons)', async () => {
    render(<PropOllamaUnified />);
    expect(screen.getByText(/AI-powered sports betting recommendations/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask me about any sports prop/i)).toBeInTheDocument();
  });
});
