// Mock UnifiedMonitor and EventBus before importing the adapter module
jest.mock('@/core/UnifiedMonitor', () => ({
  UnifiedMonitor: {
    getInstance: () => ({
      startTrace: () => ({}),
      endTrace: () => {},
    }),
  },
}));

jest.mock('@/unified/EventBus', () => ({
  EventBus: {
    getInstance: () => ({
      publish: jest.fn(),
    }),
  },
}));

const { TheOddsAdapter } = require('../../adapters/TheOddsAdapter');

describe('TheOddsAdapter (smoke)', () => {
  test('constructs and exposes metadata and cache methods', () => {
    const cfg = { apiKey: 'x', baseUrl: 'http://example.local', cacheTimeout: 1000 };
    const adapter = new TheOddsAdapter(cfg as any);
    expect(adapter.getMetadata()).toHaveProperty('id', 'the-odds');
    expect(typeof adapter.isAvailable).toBe('function');
    adapter.clearCache();
    expect(adapter.getData()).resolves.toBeNull();
  });
});
describe('TheOddsAdapter', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    // Default fetch mock will be overridden per test
    (global as any).fetch = jest.fn();
  });

  it('fetchData fetches odds and publishes game status for each event', async () => {
    const mockEvents = {
      events: [
        {
          id: 'ev1',
          sport: 'basketball',
          commence_time: '2025-01-01T00:00:00Z',
          home_team: 'Home',
          away_team: 'Away',
          bookmakers: [],
        },
      ],
    };

    // fetch for status
    (global as any).fetch = jest.fn((url: string) => {
      if (url.includes('/status')) {
        return Promise.resolve({ ok: true });
      }
      if (url.includes('/odds')) {
        return Promise.resolve({ ok: true, json: async () => mockEvents });
      }
      return Promise.resolve({ ok: false } as any);
    });

    const adapter = new TheOddsAdapter({ apiKey: 'k', baseUrl: 'http://api', cacheTimeout: 60000 });
    // Inject a mock eventBus with publish spy
    (adapter as any).eventBus = { publish: jest.fn() };
    (adapter as any).monitor = { startTrace: () => ({}), endTrace: () => {} };

    const data = await adapter.fetchData();

    expect(data.events).toHaveLength(1);
    expect((adapter as any).eventBus.publish).toHaveBeenCalled();
  });
});
