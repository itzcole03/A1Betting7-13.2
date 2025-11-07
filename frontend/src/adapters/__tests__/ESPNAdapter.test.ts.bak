import { ESPNAdapter } from '../ESPNAdapter';

describe('ESPNAdapter (smoke)', () => {
  test('metadata and simple methods', async () => {
    const mockEventBus = { emit: jest.fn() } as any;
    const adapter = new ESPNAdapter(mockEventBus);
    expect(adapter.getMetadata()).toHaveProperty('id', 'espn');
    expect(await adapter.isAvailable()).toBe(true);
    adapter.clearCache();
    expect(adapter.getData()).resolves.toBeNull();
  });
});
describe('ESPNAdapter', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('fetches games and headlines and emits an update', async () => {
    const emit = jest.fn();
    const eventBus: any = { emit };

    // Mock global.fetch to respond differently based on url
    (global as any).fetch = jest.fn((url: string) => {
      if (url.includes('scoreboard')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            events: [
              {
                id: 'game1',
                competitions: [
                  {
                    competitors: [
                      { homeAway: 'home', team: { displayName: 'Home' } },
                      { homeAway: 'away', team: { displayName: 'Away' } },
                    ],
                  },
                ],
                date: '2025-01-01T00:00:00Z',
                status: { type: { name: 'scheduled' } },
              },
            ],
          }),
        });
      }
      // RSS headlines
      if (url.includes('/espn/rss')) {
        return Promise.resolve({
          ok: true,
          text: async () =>
            '<rss><item><title>Headline</title><link>http://</link><pubDate>now</pubDate></item></rss>',
        });
      }
      return Promise.resolve({ ok: false } as any);
    });

    const adapter = new ESPNAdapter(eventBus as any);
    const data = await adapter.fetch();

    expect(data.games).toHaveLength(1);
    expect(data.games[0].homeTeam).toBe('Home');
    expect(data.headlines).toHaveLength(1);
    expect(emit).toHaveBeenCalledWith('espn-updated', expect.any(Object));
  });
});
