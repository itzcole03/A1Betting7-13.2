// Test script for IPC handlers with simulated API failures
const { ipcMain } = require('electron');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const { RateLimiterMemory } = require('rate-limiter-flexible');

// Mock axios
const mock = new MockAdapter(axios);

// Simulate API failure for ESPN
mock.onGet(/site\.api\.espn\.com/).reply(500, { error: 'Simulated ESPN API failure' });
// Simulate API failure for SportsRadar
mock.onGet(/api\.sportradar\.com/).reply(500, { error: 'Simulated SportsRadar API failure' });
// Simulate API failure for Odds API
mock.onGet(/api\.the-odds-api\.com/).reply(500, { error: 'Simulated Odds API failure' });
// Simulate API failure for OpticOdds
mock.onGet(/api\.opticodds\.com/).reply(500, { error: 'Simulated OpticOdds API failure' });
// Simulate API failure for SportsDataIO
mock.onGet(/api\.sportsdata\.io/).reply(500, { error: 'Simulated SportsDataIO API failure' });

// Simulate IPC calls (example)
async function testFetchESPNData() {
  const result = await ipcMain.handle('fetchESPNData', null, {
    userId: 'testuser',
    sport: 'football',
    league: 'nfl',
    eventId: '12345',
  });
  console.log('fetchESPNData result:', result);
}

async function testFetchSportsRadarData() {
  const result = await ipcMain.handle('fetchSportsRadarData', null, {
    userId: 'testuser',
    endpoint: 'nfl/events',
    params: {},
    apiKey: 'fakekey',
  });
  console.log('fetchSportsRadarData result:', result);
}

async function testFetchOdds() {
  const result = await ipcMain.handle('fetchOdds', null, {
    userId: 'testuser',
    userSecret: 'secret',
    sport: 'football',
    region: 'us',
    market: 'h2h',
  });
  console.log('fetchOdds result:', result);
}

async function testFetchOpticOdds() {
  const result = await ipcMain.handle('fetchOpticOdds', null, {
    userId: 'testuser',
    params: {},
  });
  console.log('fetchOpticOdds result:', result);
}

async function testFetchSportsDataIO() {
  const result = await ipcMain.handle('fetchSportsDataIO', null, {
    userId: 'testuser',
    params: {},
  });
  console.log('fetchSportsDataIO result:', result);
}

async function runTests() {
  await testFetchESPNData();
  await testFetchSportsRadarData();
  await testFetchOdds();
  await testFetchOpticOdds();
  await testFetchSportsDataIO();
}

runTests();
