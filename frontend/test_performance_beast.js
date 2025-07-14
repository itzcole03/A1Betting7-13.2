// Beast mode test script for performance monitoring IPC
const { ipcRenderer } = require('electron');

async function testPerformanceStats() {
  console.log('--- PERFORMANCE MONITORING TESTS ---');
  const stats = await ipcRenderer.invoke('getPerformanceStats');
  console.log('Performance stats:', stats);
}

(async () => {
  await testPerformanceStats();
})();
