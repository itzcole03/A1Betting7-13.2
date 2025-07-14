// IPC handler for analytics events
const { ipcMain } = require('electron');
const { trackEvent } = require('./utils/analytics');

ipcMain.handle('trackEvent', async (event, eventName, data) => {
  trackEvent(eventName, data);
  return { success: true };
});
