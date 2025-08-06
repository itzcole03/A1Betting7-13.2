// Auto-update handler using electron-updater
const { autoUpdater } = require('electron-updater');
const { ipcMain } = require('electron');
const logger = require('./utils/logger');

// Listen for update events and log them
autoUpdater.on('checking-for-update', () => {
  logger.info('Checking for update...');
});
autoUpdater.on('update-available', info => {
  logger.info('Update available', info);
});
autoUpdater.on('update-not-available', info => {
  logger.info('No update available', info);
});
autoUpdater.on('error', err => {
  logger.error('Auto-update error: %s', err.message, { stack: err.stack });
});
autoUpdater.on('download-progress', progress => {
  logger.info('Download progress', progress);
});
autoUpdater.on('update-downloaded', info => {
  logger.info('Update downloaded', info);
});

// IPC handlers
ipcMain.handle('checkForUpdate', async () => {
  autoUpdater.checkForUpdates();
  return { success: true };
});
ipcMain.handle('quitAndInstall', async () => {
  autoUpdater.quitAndInstall();
  return { success: true };
});
