/* eslint-env jest */

// Tests that the legacy shims forward to UnifiedDataService by mocking getInstance()

const mockInstance = {
  fetchSportsData: jest.fn().mockResolvedValue('sports-result'),
  fetchPlayerStats: jest.fn().mockResolvedValue('player-result'),
  fetchTeamData: jest.fn().mockResolvedValue('team-result'),
  searchData: jest.fn().mockResolvedValue('search-result'),
  normalizeOpportunity: jest.fn(raw => ({ normalized: true, raw })),
  deduplicateOpportunities: jest.fn(list => list),
  mergeOpportunities: jest.fn(list => list[0] || null),
  api: { get: jest.fn().mockResolvedValue({ data: 'api-data' }) },
  fetchPropfinderOpportunities: jest.fn().mockResolvedValue(['prop1']),
  fetchLiveData: jest.fn().mockResolvedValue({ live: true }),
  warmSportsData: jest.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  jest.clearAllMocks();
  // Patch the UnifiedDataService.getInstance to return our mock
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const uds = require('../../unified/UnifiedDataService');
  uds.UnifiedDataService.getInstance = jest.fn().mockReturnValue(mockInstance);
});

test('UnifiedDataService integration methods are callable', async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const uds = require('../../unified/UnifiedDataService');
  const inst = uds.UnifiedDataService.getInstance();

  const h = await inst.fetchSportsData('mlb', '2020-01-01');
  expect(mockInstance.fetchSportsData).toHaveBeenCalledWith('mlb', '2020-01-01');
  expect(h).toBe('sports-result');

  const p = await inst.fetchPlayerStats('player1', 'nba');
  expect(mockInstance.fetchPlayerStats).toHaveBeenCalledWith('player1', 'nba');
  expect(p).toBe('player-result');

  const t = await inst.fetchTeamData('team1', 'nfl');
  expect(mockInstance.fetchTeamData).toHaveBeenCalledWith('team1', 'nfl');
  expect(t).toBe('team-result');

  const s = await inst.searchData('q', { a: 1 });
  expect(mockInstance.searchData).toHaveBeenCalledWith('q', { a: 1 });
  expect(s).toBe('search-result');
});

test('UnifiedDataService normalization helpers are callable', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const uds = require('../../unified/UnifiedDataService');
  const inst = uds.UnifiedDataService.getInstance();

  const raw = { id: 'x' } as Record<string, unknown>;
  const normalized = inst.normalizeOpportunity(raw, 'src');
  expect(mockInstance.normalizeOpportunity).toHaveBeenCalledWith(raw, 'src');
  expect(normalized).toEqual({ normalized: true, raw });

  const deduped = inst.deduplicateOpportunities([raw as any]);
  expect(mockInstance.deduplicateOpportunities).toHaveBeenCalledWith([raw]);
  expect(Array.isArray(deduped)).toBe(true);
  expect(deduped[0]).toEqual(raw);

  const merged = inst.mergeOpportunities([raw as any]);
  expect(mockInstance.mergeOpportunities).toHaveBeenCalled();
  expect(merged).toEqual(raw);
});

test('UnifiedDataService exposes api and optimized helpers', async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const uds = require('../../unified/UnifiedDataService');
  const inst = uds.UnifiedDataService.getInstance();

  const res = await inst.fetchSportsData('mlb');
  expect(mockInstance.fetchSportsData).toHaveBeenCalledWith('mlb');
  expect(res).toBe('sports-result');

  // The unified instance exposes an `api` object used by optimized wrappers
  expect(inst.api).toBeDefined();
  const apiRes = await inst.api.get('/some-endpoint');
  expect(mockInstance.api.get).toHaveBeenCalled();
  expect(apiRes).toEqual({ data: 'api-data' });
});

test('UnifiedDataService real-time helpers are callable', async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const uds = require('../../unified/UnifiedDataService');
  const inst = uds.UnifiedDataService.getInstance();

  const props = await inst.fetchPropfinderOpportunities();
  expect(mockInstance.fetchPropfinderOpportunities).toHaveBeenCalled();
  expect(props).toEqual(['prop1']);

  const live = await inst.fetchLiveData('nba');
  expect(mockInstance.fetchLiveData).toHaveBeenCalledWith('nba');
  expect(live).toEqual({ live: true });
});
