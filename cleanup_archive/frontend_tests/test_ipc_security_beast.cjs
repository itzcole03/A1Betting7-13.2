// Beast mode test script for IPC validation
const { ipcRenderer } = require('electron');

async function testIPCValidation() {
  console.log('--- IPC SECURITY TESTS ---');
  // Valid input
  let result = await ipcRenderer.invoke('showNotification', {
    title: 'Valid',
    body: 'Valid input',
    type: 'info',
  });
  console.log('Valid notification:', result);

  // Missing key
  try {
    await ipcRenderer.invoke('showNotification', {
      title: 'Missing',
      // body missing
      type: 'info',
    });
  } catch (err) {
    console.log('Missing key error:', err.message);
  }

  // Type mismatch
  try {
    await ipcRenderer.invoke('showNotification', {
      title: 'Type',
      body: 12345, // should be string
      type: 'info',
    });
  } catch (err) {
    console.log('Type mismatch error:', err.message);
  }
}

(async () => {
  await testIPCValidation();
})();
