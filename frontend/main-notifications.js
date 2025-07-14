// IPC handler for notifications
const { ipcMain } = require('electron');
const { showNotification } = require('./utils/notifications');
const { validateIPCInput } = require('./utils/ipcValidator');
const logger = require('./utils/logger');

ipcMain.handle('showNotification', async (event, { title, body, type }) => {
  const schema = { title: 'string', body: 'string', type: 'string' };
  const input = { title, body, type };
  if (!validateIPCInput(schema, input)) {
    logger.warn('Rejected invalid notification IPC input', input);
    return { success: false, error: 'Invalid input' };
  }
  showNotification(input);
  return { success: true };
});
