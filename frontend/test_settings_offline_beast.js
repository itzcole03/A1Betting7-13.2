// Beast mode test script for offline mode and settings IPC handlers
const { ipcRenderer } = require('electron');

async function testOfflineMode() {
  console.log('--- OFFLINE MODE TESTS ---');
  // Initial status
  let status = await ipcRenderer.invoke('getOfflineStatus');
  console.log('Initial offline status:', status);

  // Toggle offline
  await ipcRenderer.invoke('setOfflineStatus', true);
  status = await ipcRenderer.invoke('getOfflineStatus');
  console.log('Offline status after set true:', status);

  // Queue requests
  for (let i = 0; i < 3; i++) {
    await ipcRenderer.invoke('setSetting', `offline_test_${i}`, `value_${i}`);
    // Simulate queuing (would be handled in offlineManager in real app)
  }
  await ipcRenderer.invoke('syncQueuedRequests');
  console.log('Queued requests synced');

  // Set back online
  await ipcRenderer.invoke('setOfflineStatus', false);
  status = await ipcRenderer.invoke('getOfflineStatus');
  console.log('Offline status after set false:', status);
}

async function testSettingsManagement() {
  console.log('--- SETTINGS MANAGEMENT TESTS ---');
  // Normal set/get
  await ipcRenderer.invoke('setSetting', 'theme', 'dark');
  let theme = await ipcRenderer.invoke('getSetting', 'theme');
  console.log('Theme setting:', theme);

  // Edge case: missing key
  let missing = await ipcRenderer.invoke('getSetting', 'nonexistent_key');
  console.log('Missing key:', missing);

  // Edge case: large value
  const largeValue = 'x'.repeat(10000);
  await ipcRenderer.invoke('setSetting', 'large_setting', largeValue);
  let large = await ipcRenderer.invoke('getSetting', 'large_setting');
  console.log('Large setting:', large ? large.value.length : 'not found');

  // Edge case: invalid type
  try {
    await ipcRenderer.invoke('setSetting', 'invalid_type', { obj: 1 });
  } catch (err) {
    console.log('Invalid type error:', err.message);
  }
}

(async () => {
  await testOfflineMode();
  await testSettingsManagement();
})();
