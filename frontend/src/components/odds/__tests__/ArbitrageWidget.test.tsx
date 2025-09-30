import { render, waitFor } from '@testing-library/react';
import ArbitrageWidget from '../../odds/ArbitrageWidget';

// Mock fetch globally
(global as any).fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({
    data: [{
      selection_key: 'player:MLB:AaronJudge:HR',
      sport: 'MLB',
      market: 'player_props',
      over_book: 'FanDuel',
      under_book: 'DraftKings',
      over_american: -110,
      under_american: 105,
      margin_pct: 1.23,
      stake_over: 48.8,
      stake_under: 51.2,
      total_stake: 100,
      guaranteed_return: 101.25,
      guaranteed_profit: 1.25,
      last_updated: new Date().toISOString()
    }],
    count: 1
  })
});

describe('ArbitrageWidget', () => {
  test('renders arbitrage widget title', async () => {
    const { getByText } = render(<ArbitrageWidget sport="MLB" market="player_props" />);
    await waitFor(() => {
      expect(getByText(/Arbitrage/)).toBeInTheDocument();
    });
  });
});
