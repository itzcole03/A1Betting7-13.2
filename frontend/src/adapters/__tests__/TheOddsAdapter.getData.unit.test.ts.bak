// Ensure monitor and event bus are mocked before importing the adapter
jest.mock('@/core/UnifiedMonitor', () => ({
  UnifiedMonitor: {
    getInstance: () => ({ startTrace: () => ({}), endTrace: () => {} }),
  },
}));

jest.mock('@/unified/EventBus', () => ({
  EventBus: {
    getInstance: () => ({ publish: jest.fn() }),
  },
}));

import { TheOddsAdapter } from '../TheOddsAdapter';

describe('TheOddsAdapter.getData (no-network)', () => {
  test('returns cached data without making network calls', async () => {
    const cfg = { apiKey: 'x', baseUrl: 'http://example.local', cacheTimeout: 1000 };
    const adapter = new TheOddsAdapter(cfg as any);

    // Spy on global.fetch to ensure no network calls are made
    (global as any).fetch = jest.fn(() => Promise.reject(new Error('network must not be called')));

    const mockData = { events: [{ id: 'e1', sport: 'basketball' }] };
    // Inject cached data directly
    (adapter as any).cache = { data: mockData, timestamp: Date.now() };

    const result = await adapter.getData();
    expect(result).toBe(mockData);
    expect((global as any).fetch).not.toHaveBeenCalled();

    // Clear cache and ensure getData returns null and still does not trigger network
    adapter.clearCache();
    const result2 = await adapter.getData();
    expect(result2).toBeNull();
    expect((global as any).fetch).not.toHaveBeenCalled();
  });
});
