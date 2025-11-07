import React from 'react';
import { render, waitFor } from '@testing-library/react';
import OddsConsensusWidget from '../OddsConsensusWidget';

// Mock fetch
const mockFetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({
    data: [
      {
        selection_key: 'player:MLB:AaronJudge:HR',
        sport: 'MLB',
        market: 'player_props',
        line: 0.5,
        consensus_implied_prob: 0.55,
        consensus_american: -122,
        books: 4,
        last_updated: new Date().toISOString(),
        ev_edge_pct: null,
        projection_prob: null
      }
    ],
    count: 1
  })
});

global.fetch = mockFetch as any;

describe('OddsConsensusWidget', () => {
  it('renders and displays consensus data', async () => {
    const { getByText, getAllByTestId } = render(<OddsConsensusWidget sport="MLB" market="player_props" />);

    await waitFor(() => {
      expect(getByText(/Consensus Odds/i)).toBeInTheDocument();
      const rows = getAllByTestId('consensus-row');
      expect(rows.length).toBeGreaterThan(0);
    });
  });
});
