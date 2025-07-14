// test/ipcHandlers.spec.js
const { expect } = require('chai');
const { ipcRenderer } = require('electron');

describe('IPC Handlers', function () {
  it('should fetch ESPN data successfully', async function () {
    const result = await ipcRenderer.invoke('fetchESPNData', {
      userId: 'testuser',
      sport: 'football',
      league: 'nfl',
      eventId: '12345',
    });
    expect(result).to.have.property('success', true);
    expect(result.data).to.exist;
  });

  it('should fetch SportsRadar data successfully', async function () {
    const result = await ipcRenderer.invoke('fetchSportsRadarData', {
      userId: 'testuser',
      endpoint: 'nfl/events',
      params: {},
      apiKey: 'fakekey',
    });
    expect(result).to.have.property('success', true);
    expect(result.data).to.exist;
  });

  it('should fetch Odds data successfully', async function () {
    const result = await ipcRenderer.invoke('fetchOdds', {
      userId: 'testuser',
      userSecret: 'secret',
      sport: 'football',
      region: 'us',
      market: 'h2h',
    });
    expect(result).to.have.property('success', true);
    expect(result.data).to.exist;
  });

  it('should fetch OpticOdds data successfully', async function () {
    const result = await ipcRenderer.invoke('fetchOpticOdds', {
      userId: 'testuser',
      params: {},
    });
    expect(result).to.have.property('success', true);
    expect(result.data).to.exist;
  });

  it('should fetch SportsDataIO data successfully', async function () {
    const result = await ipcRenderer.invoke('fetchSportsDataIO', {
      userId: 'testuser',
      params: {},
    });
    expect(result).to.have.property('success', true);
    expect(result.data).to.exist;
  });
});
