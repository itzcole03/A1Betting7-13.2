// IPC handlers for offline mode and settings management
const { ipcMain } = require('electron');
const offlineManager = require('./utils/offlineManager');
const settings = require('./utils/settings');

// Offline mode IPC
ipcMain.handle('getOfflineStatus', async () => {
  return offlineManager.getOfflineStatus();
});

ipcMain.handle('setOfflineStatus', async (event, status) => {
  offlineManager.setOffline(status);
  return { success: true, status };
});

ipcMain.handle('syncQueuedRequests', async () => {
  await offlineManager.syncQueuedRequests();
  return { success: true };
});

// Settings IPC
ipcMain.handle('getSetting', async (event, key) => {
  const value = await settings.getSetting(key);
  return { key, value };
});

ipcMain.handle('setSetting', async (event, key, value) => {
  const success = await settings.setSetting(key, value);
  return { success };
});
