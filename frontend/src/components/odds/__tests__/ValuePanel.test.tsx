import React from 'react';
import { render, waitFor } from '@testing-library/react';
import ValuePanel from '../ValuePanel';

// Mock child widgets (lightweight) to avoid network complexity in this test
jest.mock('../OddsConsensusWidget', () => ({ sport }: { sport: string }) => <div>Consensus Odds ({sport})</div>);
jest.mock('../BestBookWidget', () => ({ sport }: { sport: string }) => <div>Best Book Odds ({sport})</div>);
jest.mock('../ArbitrageWidget', () => ({ sport }: { sport: string }) => <div>Arbitrage ({sport})</div>);

global.fetch = jest.fn().mockImplementation((url: string) => {
  if (url.startsWith('/api/odds/arbitrage/summary')) {
    return Promise.resolve({
      ok: true,
      json: async () => ({ status: 'ok', data: { count: 0, avg_margin_pct: 0, max_margin_pct: 0, top_opportunity: null, books_involved: 0, unique_selections: 0 } })
    }) as any;
  }
  return Promise.resolve({ ok: true, json: async () => ({}) }) as any;
}) as any;

describe('ValuePanel', () => {
  it('renders widgets and summary heading', async () => {
    const { getByText } = render(<ValuePanel sport="MLB" />);
    await waitFor(() => getByText(/Consensus Odds/i));
    await waitFor(() => getByText(/Best Book Odds/i));
    await waitFor(() => getByText(/Arbitrage Summary/i));
  });
});
