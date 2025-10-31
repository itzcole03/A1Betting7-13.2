import { DailyFantasyAdapter } from '../DailyFantasyAdapter';

describe('DailyFantasyAdapter', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    (global as any).fetch = jest.fn();
  });

  it('fetchData returns parsed projections and publishes updates', async () => {
    const mockData = {
      projections: [
        {
          name: 'John Doe',
          team: 'T1',
          position: 'G',
          opp_team: 'T2',
          game_date: '2025-01-01',
          is_home: true,
          pts: 20,
          reb: 5,
          ast: 7,
          stl: 1,
          blk: 0,
          three_pt: 2,
          min: 30,
        },
      ],
    };

    (global as any).fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: async () => mockData })
    );

    const adapter = new DailyFantasyAdapter({
      apiKey: 'k',
      baseUrl: 'http://api',
      cacheTimeout: 60000,
    });
    (adapter as any).eventBus = { publish: jest.fn() };
    (adapter as any).monitor = { startTrace: () => 't', endTrace: () => {} };

    const data = await adapter.fetchData();

    expect(data.projections).toHaveLength(1);
    expect((adapter as any).eventBus.publish).toHaveBeenCalled();
    expect(data.projections[0].name).toBe('John Doe');
  });
});
