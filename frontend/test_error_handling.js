// Test script to simulate IPC calls and error scenarios
const { ipcRenderer } = require('electron');

async function testFetchOddsError() {
  // Simulate missing API key
  const result = await ipcRenderer.invoke('fetchOdds', {
    userId: 'nonexistent',
    userSecret: 'wrongsecret',
    sport: 'soccer',
    region: 'us',
    market: 'h2h',
  });
  console.log('fetchOdds error test:', result);
}

async function testPredictionError() {
  // Simulate invalid model name
  const result = await ipcRenderer.invoke('predict-ensemble', [1, 2, 3], ['invalid_model']);
  console.log('predict-ensemble error test:', result);
}

(async () => {
  await testFetchOddsError();
  await testPredictionError();
})();
