// Beast mode test script for notifications and auto-update IPC
const { ipcRenderer } = require('electron');

async function testNotifications() {
  console.log('--- NOTIFICATIONS TESTS ---');
  await ipcRenderer.invoke('showNotification', {
    title: 'Test Info',
    body: 'This is an info notification.',
    type: 'info',
  });
  await ipcRenderer.invoke('showNotification', {
    title: 'Test Warning',
    body: 'This is a warning notification.',
    type: 'warning',
  });
  await ipcRenderer.invoke('showNotification', {
    title: 'Test Error',
    body: 'This is an error notification.',
    type: 'error',
  });
}

async function testAutoUpdate() {
  console.log('--- AUTO-UPDATE TESTS ---');
  await ipcRenderer.invoke('checkForUpdate');
  // Simulate update events (actual update requires release server)
  await ipcRenderer.invoke('quitAndInstall');
}

(async () => {
  await testNotifications();
  await testAutoUpdate();
})();
