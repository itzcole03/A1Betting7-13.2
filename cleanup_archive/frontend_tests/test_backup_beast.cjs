// Beast mode test script for backup/restore IPC
const { ipcRenderer } = require('electron');

async function testBackupRestore() {
  console.log('--- BACKUP/RESTORE TESTS ---');
  // Backup DB
  let backup = await ipcRenderer.invoke('backupDB');
  console.log('Backup result:', backup);
  // Restore DB
  let restore = await ipcRenderer.invoke('restoreDB');
  console.log('Restore result:', restore);
}

(async () => {
  await testBackupRestore();
})();
