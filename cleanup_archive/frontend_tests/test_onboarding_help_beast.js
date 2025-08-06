// Beast mode test script for onboarding/help IPC
const { ipcRenderer } = require('electron');

async function testHelpContent() {
  console.log('--- ONBOARDING/HELP TESTS ---');
  const help = await ipcRenderer.invoke('getHelpContent', 'OFFLINE_AND_SETTINGS.md');
  console.log('Help content (OFFLINE_AND_SETTINGS.md):', help.slice(0, 200));
  const notifications = await ipcRenderer.invoke('getHelpContent', 'NOTIFICATIONS_AND_UPDATE.md');
  console.log('Help content (NOTIFICATIONS_AND_UPDATE.md):', notifications.slice(0, 200));
}

(async () => {
  await testHelpContent();
})();
