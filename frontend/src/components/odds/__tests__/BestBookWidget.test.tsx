import React from 'react';
import { render, waitFor } from '@testing-library/react';
import BestBookWidget from '../BestBookWidget';

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
        best_american: -105,
        best_book: 'FanDuel',
        books_considered: 4,
        last_updated: new Date().toISOString()
      }
    ],
    count: 1
  })
});

global.fetch = mockFetch as any;

describe('BestBookWidget', () => {
  it('renders and displays best book data', async () => {
    const { getByText } = render(<BestBookWidget sport="MLB" market="player_props" />);
    await waitFor(() => {
      expect(getByText(/Best Book Odds/i)).toBeInTheDocument();
    });
  });
});
