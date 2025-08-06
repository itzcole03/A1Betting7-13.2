// Automated tests for IPC handlers in main-sportsbook-api.cjs
const { expect } = require('chai');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const { ipcMain } = require('electron');

// Mock axios
const mock = new MockAdapter(axios);

// Simulate API success and failure for each endpoint
mock.onGet(/site\.api\.espn\.com/).replyOnce(200, { data: 'ESPN success' });
mock.onGet(/site\.api\.espn\.com/).reply(500, { error: 'ESPN fail' });
mock.onGet(/api\.sportradar\.com/).replyOnce(200, { data: 'SportsRadar success' });
mock.onGet(/api\.sportradar\.com/).reply(500, { error: 'SportsRadar fail' });
mock.onGet(/api\.the-odds-api\.com/).replyOnce(200, { data: 'Odds success' });
mock.onGet(/api\.the-odds-api\.com/).reply(500, { error: 'Odds fail' });
mock.onGet(/api\.opticodds\.com/).replyOnce(200, { data: 'OpticOdds success' });
mock.onGet(/api\.opticodds\.com/).reply(500, { error: 'OpticOdds fail' });
mock.onGet(/api\.sportsdata\.io/).replyOnce(200, { data: 'SportsDataIO success' });
mock.onGet(/api\.sportsdata\.io/).reply(500, { error: 'SportsDataIO fail' });

const { ipcRenderer } = require('electron');

// Test ESPN handler
async function testESPNHandler() {
  const result = await ipcRenderer.invoke('fetchESPNData', {
    userId: 'testuser',
    sport: 'football',
    league: 'nfl',
    eventId: '12345',
  });
  expect(result.success).to.be.true;
  expect(result.data).to.equal('ESPN success');
}

// Test SportsRadar handler
async function testSportsRadarHandler() {
  const result = await ipcRenderer.invoke('fetchSportsRadarData', {
    userId: 'testuser',
    endpoint: 'nfl/events',
    params: {},
    apiKey: 'fakekey',
  });
  expect(result.success).to.be.true;
  expect(result.data).to.equal('SportsRadar success');
}

// Test Odds handler
async function testOddsHandler() {
  const result = await ipcRenderer.invoke('fetchOdds', {
    userId: 'testuser',
    userSecret: 'secret',
    sport: 'football',
    region: 'us',
    market: 'h2h',
  });
  expect(result.success).to.be.true;
  expect(result.data).to.equal('Odds success');
}

// Test OpticOdds handler
async function testOpticOddsHandler() {
  const result = await ipcRenderer.invoke('fetchOpticOdds', {
    userId: 'testuser',
    params: {},
  });
  expect(result.success).to.be.true;
  expect(result.data).to.equal('OpticOdds success');
}

// Test SportsDataIO handler
async function testSportsDataIOHandler() {
  const result = await ipcRenderer.invoke('fetchSportsDataIO', {
    userId: 'testuser',
    params: {},
  });
  expect(result.success).to.be.true;
  expect(result.data).to.equal('SportsDataIO success');
}

async function runAllTests() {
  await testESPNHandler();
  await testSportsRadarHandler();
  await testOddsHandler();
  await testOpticOddsHandler();
  await testSportsDataIOHandler();
  console.log('All IPC handler tests passed!');
}

runAllTests();
