// Robust, production-grade logger for Electron (user-writable logs dir)
const fs = require('fs');
const path = require('path');
let logsDir;
let electronApp = null;
try {
  // Try to require Electron's app module if available (main process)
  electronApp = require('electron').app;
} catch (e) {
  // Not running in Electron main process (dev/test)
  electronApp = null;
}
if (electronApp && typeof electronApp.getPath === 'function') {
  logsDir = path.join(electronApp.getPath('userData'), 'logs');
} else {
  logsDir = path.join(process.cwd(), 'logs');
}
// Ensure logsDir exists, robustly
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (e) {
  // Fallback: try to use process.cwd() if Electron's userData is not writable
  logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}
// Always add a fallback transport to process.cwd()/logs
const fallbackLogsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(fallbackLogsDir)) {
  fs.mkdirSync(fallbackLogsDir, { recursive: true });
}
// Robust dynamic require for asar/unpacked
let createLogger, format, transports, DailyRotateFile;
function robustRequire(moduleName) {
  // Try asar-unpacked first
  try {
    const unpackedPath = path.join(
      process.resourcesPath,
      'app.asar.unpacked',
      'node_modules',
      moduleName
    );
    return require(unpackedPath);
  } catch (e) {
    // Try normal require (should work in dev)
    try {
      return require(moduleName);
    } catch (err) {
      // Try local require from __dirname (for asar)
      try {
        const Module = require('module');
        const createRequire =
          Module.createRequire || Module.createRequireFromPath || require('create-require');
        const localRequire = createRequire(__dirname);
        return localRequire(moduleName);
      } catch (finalErr) {
        throw new Error(`Failed to load ${moduleName}: ${finalErr && finalErr.message}`);
      }
    }
  }
}
try {
  const winston = robustRequire('winston');
  createLogger = winston.createLogger;
  format = winston.format;
  transports = winston.transports;
  DailyRotateFile = robustRequire('winston-daily-rotate-file');
} catch (err) {
  throw new Error('Failed to load winston or winston-daily-rotate-file: ' + (err && err.message));
}
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'a1betting-frontend' },
  transports: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
    // Fallback transport
    new DailyRotateFile({
      filename: path.join(fallbackLogsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
    new transports.Console({ format: format.simple() }),
  ],
});
module.exports = logger;
