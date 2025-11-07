import { renderHook, act } from '@testing-library/react';
import { useEVOpportunities } from '../useEVOpportunities';

// Mock timer
jest.useFakeTimers();

// Mock fetch
const mockPayload = {
  data: [
    { id: '1', sport: 'MLB', market: 'K', line: 6.5, fair_odds: -115, market_odds: -110, edge_pct: 3.2, implied_prob: 0.524, fair_prob: 0.535, source_book: 'FD', timestamp: new Date().toISOString() }
  ]
};

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => mockPayload
}) as any;

describe('useEVOpportunities', () => {
  it('fetches opportunities once and stores data', async () => {
    const { result } = renderHook(() => useEVOpportunities({ sport: 'MLB', minEdge: 2, refreshMs: 60000 }));
    expect(result.current.loading).toBe(true);
    await act(async () => {});
    expect(result.current.loading).toBe(false);
    expect(result.current.data.length).toBeGreaterThan(0);
  });

  it('polls on interval', async () => {
  renderHook(() => useEVOpportunities({ sport: 'MLB', minEdge: 2, refreshMs: 10000 }));
    await act(async () => {});
    expect(fetch).toHaveBeenCalledTimes(1);
  await act(async () => { jest.advanceTimersByTime(10000); });
    expect(fetch).toHaveBeenCalledTimes(2);
    // No state change logging difference expected because same payload
  await act(async () => { jest.advanceTimersByTime(10000); });
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
