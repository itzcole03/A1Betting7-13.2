import { SportsRadarAdapter } from '../SportsRadarAdapter';

describe('SportsRadarAdapter', () => {
  it('fetchGameData / fetchInjuryData / fetchTeamRoster return safe defaults', async () => {
    const adapter = new SportsRadarAdapter({ baseUrl: 'http://api' } as any);

    const game = await adapter.fetchGameData('game1');
    expect(game).toBeNull();

    const injuries = await adapter.fetchInjuryData('player1');
    expect(Array.isArray(injuries)).toBe(true);
    expect(injuries).toHaveLength(0);

    const roster = await adapter.fetchTeamRoster('team1');
    expect(Array.isArray(roster)).toBe(true);
    expect(roster).toHaveLength(0);
  });
});
