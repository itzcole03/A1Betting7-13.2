// IPC handler for performance monitoring
const { ipcMain } = require('electron');

function getPerformanceStats() {
  const memory = process.memoryUsage();
  const cpu = process.cpuUsage();
  const uptime = process.uptime();
  return { memory, cpu, uptime };
}

ipcMain.handle('getPerformanceStats', async () => {
  return getPerformanceStats();
});
