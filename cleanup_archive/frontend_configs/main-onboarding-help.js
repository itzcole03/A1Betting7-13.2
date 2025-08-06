// IPC handler for onboarding/help content
const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

function getHelpContent(filename) {
  try {
    const filePath = path.join(__dirname, filename);
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return 'Help content not available.';
  }
}

ipcMain.handle('getHelpContent', async (event, filename) => {
  return getHelpContent(filename);
});
