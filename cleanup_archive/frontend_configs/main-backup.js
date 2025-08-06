// IPC handler for backup/restore
const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');

const dbPath = path.join(require('electron').app.getPath('userData'), 'a1betting.db');

ipcMain.handle('backupDB', async () => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Save Backup',
    defaultPath: 'a1betting-backup.db',
  });
  if (filePath) {
    try {
      fs.copyFileSync(dbPath, filePath);
      logger.info('Backup created', { filePath });
      return { success: true };
    } catch (err) {
      logger.error('Backup error: %s', err.message, { filePath });
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: 'No file selected' };
});

ipcMain.handle('restoreDB', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Restore Backup',
    filters: [{ name: 'DB Files', extensions: ['db'] }],
    properties: ['openFile'],
  });
  if (filePaths && filePaths[0]) {
    try {
      fs.copyFileSync(filePaths[0], dbPath);
      logger.info('Backup restored', { filePath: filePaths[0] });
      return { success: true };
    } catch (err) {
      logger.error('Restore error: %s', err.message, { filePath: filePaths[0] });
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: 'No file selected' };
});
