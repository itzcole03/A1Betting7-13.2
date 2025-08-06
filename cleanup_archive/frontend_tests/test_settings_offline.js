// Test script for offline mode and settings IPC handlers
const { ipcRenderer } = require('electron');

async function testOfflineStatus() {
  const status = await ipcRenderer.invoke('getOfflineStatus');
  console.log('Offline status:', status);
  await ipcRenderer.invoke('setOfflineStatus', true);
  const newStatus = await ipcRenderer.invoke('getOfflineStatus');
  console.log('Offline status after set:', newStatus);
  await ipcRenderer.invoke('syncQueuedRequests');
  console.log('Queued requests synced');
}

async function testSettings() {
  await ipcRenderer.invoke('setSetting', 'theme', 'dark');
  const theme = await ipcRenderer.invoke('getSetting', 'theme');
  console.log('Theme setting:', theme);
}

(async () => {
  await testOfflineStatus();
  await testSettings();
})();
