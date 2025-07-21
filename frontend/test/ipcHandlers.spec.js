// test/ipcHandlers.spec.js
describe('IPC Handlers', function () {
const { ipcRenderer } = require('electron');

describe('IPC Handlers', () => {
  test('should fetch ESPN data successfully', async () => {
    const result = await ipcRenderer.invoke('fetchESPNData', {
      userId: 'testuser',
      sport: 'football',
      league: 'nfl',
      eventId: '12345',
    });
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  test('should fetch SportsRadar data successfully', async () => {
    const result = await ipcRenderer.invoke('fetchSportsRadarData', {
      userId: 'testuser',
      endpoint: 'nfl/events',
      params: {},
      apiKey: 'fakekey',
    });
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  test('should fetch Odds data successfully', async () => {
    const result = await ipcRenderer.invoke('fetchOdds', {
      userId: 'testuser',
      userSecret: 'secret',
      sport: 'football',
      region: 'us',
      market: 'h2h',
    });
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  test('should fetch OpticOdds data successfully', async () => {
    const result = await ipcRenderer.invoke('fetchOpticOdds', {
      userId: 'testuser',
      params: {},
    });
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  test('should fetch SportsDataIO data successfully', async () => {
    const result = await ipcRenderer.invoke('fetchSportsDataIO', {
      userId: 'testuser',
      params: {},
    });
    expect(result).to.have.property('success', true);
    expect(result.data).to.exist;
  });
});
