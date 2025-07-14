const fs = require('fs');
const { app, BrowserWindow } = require('electron');

console.log('==== MAIN PROCESS STARTED ====');
process.stdout.write('==== MAIN PROCESS STDOUT ====\n');
console.log('==== EARLY DIAGNOSTICS START ====');
console.log('process.cwd():', process.cwd());
console.log('__dirname:', __dirname);
try {
  const knexPath = require.resolve('knex');
  console.log('require.resolve("knex"):', knexPath);
} catch (e) {
  console.log('require.resolve("knex") failed:', e.message);
}
try {
  const nodeModulesPath = __dirname + '/node_modules';
  if (fs.existsSync(nodeModulesPath)) {
    const contents = fs.readdirSync(nodeModulesPath);
    console.log('node_modules contents:', contents);
  } else {
    console.log('node_modules directory does not exist at', nodeModulesPath);
  }
} catch (e) {
  console.log('Error reading node_modules:', e.message);
}
console.log('==== EARLY DIAGNOSTICS END ====');
console.log("STARTED MAIN PROCESS");
// ULTRA-EARLY NODE LOG: Validate entry execution
try {
  require('fs').appendFileSync(
    'entry-point.log',
    `[ENTRY] main-sportsbook-api.cjs executed at ${new Date().toISOString()}\n`
  );
} catch (e) {}
// ...existing code...
// ULTRA-EARLY NODE LOG: Validate entry execution
try {
  require('fs').appendFileSync(
    'entry-point.log',
    `[ENTRY] main-sportsbook-api.cjs executed at ${new Date().toISOString()}\n`
  );
} catch (e) {}
// Ultra-early diagnostic logging for startup crash capture
const path = require('path');
const earlyLogPath = path.join(process.cwd(), 'early-startup.log');
try {
  fs.appendFileSync(
    earlyLogPath,
    `[EARLY] main-sportsbook-api.cjs started at ${new Date().toISOString()}\n`
  );
} catch (e) {
  // Ignore
}
process.on('uncaughtException', err => {
  try {
    fs.appendFileSync(earlyLogPath, `[EARLY] uncaughtException: ${(err && err.stack) || err}\n`);
  } catch (e) {}
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  try {
    fs.appendFileSync(
      earlyLogPath,
      `[EARLY] unhandledRejection: ${(reason && reason.stack) || reason}\n`
    );
  } catch (e) {}
  process.exit(1);
});
// ---- Diagnostic logs for debugging require path issues ----
// ...existing code...
try {
  fs.writeFileSync(
    path.join(process.env.TEMP || process.cwd(), 'a1betting-debug-paths.txt'),
    `__dirname: ${__dirname}\nprocess.cwd(): ${process.cwd()}\n`,
    { flag: 'a' }
  );
  const loggerPath = path.join(__dirname, 'utils', 'logger.js');
  const loggerExists = fs.existsSync(loggerPath);
  fs.writeFileSync(
    path.join(process.env.TEMP || process.cwd(), 'a1betting-debug-paths.txt'),
    `logger.js exists at ${loggerPath}: ${loggerExists}\n`,
    { flag: 'a' }
  );
  // Minimal startup marker
  fs.writeFileSync(
    path.join(process.env.TEMP || process.cwd(), 'a1betting-debug-paths.txt'),
    `[STARTUP] main-sportsbook-api.cjs main process started at ${new Date().toISOString()}\n`,
    { flag: 'a' }
  );
} catch (e) {
  // If even this fails, show a dialog (if possible)
  try {
    require('electron').dialog.showErrorBox(
      'Startup Error',
      'Failed to write startup log: ' + (e && e.message)
    );
  } catch (_) {}
}
let logger;
try {
  logger = require('./utils/logger');
  // Log successful logger load
  fs.writeFileSync(
    path.join(process.env.TEMP || process.cwd(), 'a1betting-debug-paths.txt'),
    `[STARTUP] logger loaded successfully at ${new Date().toISOString()}\n`,
    { flag: 'a' }
  );
} catch (e) {
  fs.writeFileSync(
    path.join(process.env.TEMP || process.cwd(), 'a1betting-debug-paths.txt'),
    `Failed to require ./utils/logger: ${e && e.message}\n`,
    { flag: 'a' }
  );
  try {
    require('electron').dialog.showErrorBox(
      'Startup Error',
      'Failed to load logger: ' + (e && e.message)
    );
  } catch (_) {}
  throw e;
}

let Knex, knexConfig, knex;
try {
  Knex = require('knex');
  knexConfig = require('./knexfile');
  knex = Knex(knexConfig);
  console.log('Knex loaded successfully.');
} catch (e) {
  console.error('FATAL: Failed to require or initialize knex:', e.message);
  try {
    require('fs').appendFileSync('early-startup.log', `[FATAL] Failed to require or initialize knex: ${e.message}\n`);
  } catch (_) {}
  process.exit(1);
}

// --- Backend Launch Logic ---
const { spawn } = require('child_process');
const projectRoot = path.resolve(__dirname, '..');
const backendProcess = spawn(
  'python',
  ['-m', 'backend.main'],
  {
    cwd: projectRoot,
    env: { ...process.env, PYTHONPATH: projectRoot }
  }
);
backendProcess.stdout.on('data', (data) => {
  logger.info(`[Backend] ${data}`);
});
backendProcess.stderr.on('data', (data) => {
  logger.error(`[Backend ERROR] ${data}`);
});
backendProcess.on('close', (code) => {
  logger.info(`[Backend] process exited with code ${code}`);
});
// --- End Backend Launch Logic ---
// ---- Robust runtime error/crash reporting ----
const { ipcMain } = require('electron');
process.on('uncaughtException', error => {
  logger.error('Uncaught Exception:', error);
  // Optionally send crash report to remote server or save to file
  if (app && typeof app.quit === 'function') {
    app.quit();
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Optionally send crash report to remote server or save to file
  if (app && typeof app.quit === 'function') {
    app.quit();
  } else {
    process.exit(1);
  }
});
// IPC handler for extensibility hooks (plugin/module support)
ipcMain.handle('runExtensibilityHook', async (event, payload) => {
  const schema = Joi.object({
    hook: Joi.string().min(3).max(64).required(),
    args: Joi.object().optional(),
  });
  const { error, value } = schema.validate(payload);
  if (error) {
    logger.warn('Invalid runExtensibilityHook input: %s', error.message);
    return { error: 'Invalid input', details: error.details };
  }
  try {
    // Example: dynamic plugin/module registry
    if (global.pluginRegistry && typeof global.pluginRegistry[value.hook] === 'function') {
      const result = await global.pluginRegistry[value.hook](value.args || {});
      return { success: true, result };
    } else {
      logger.warn('Extensibility hook not found: %s', value.hook);
      return { error: 'Hook not found.' };
    }
  } catch (err) {
    logger.error('Extensibility hook error: %s', err.message);
    return { error: 'Hook execution failed.' };
  }
});
// IPC handler for backup/export
ipcMain.handle('exportData', async (event, payload) => {
  const schema = Joi.object({
    userId: Joi.string().alphanum().min(3).max(64).optional(),
    type: Joi.string().valid('settings', 'bets', 'metrics', 'all').required(),
  });
  const { error, value } = schema.validate(payload);
  if (error) {
    logger.warn('Invalid exportData input: %s', error.message);
    return { error: 'Invalid input', details: error.details };
  }
  // Example: fetch and export data
  try {
    let exportData = {};
    if (value.type === 'settings') {
      exportData.settings = value.userId
        ? await knex('user_settings').where({ userId: value.userId }).first()
        : await knex('app_settings').first();
    }
    if (value.type === 'bets' || value.type === 'all') {
      exportData.bets = value.userId
        ? await knex('bets').where({ userId: value.userId })
        : await knex('bets');
    }
    if (value.type === 'metrics' || value.type === 'all') {
      exportData.metrics = value.userId
        ? await knex('user_metrics').where({ userId: value.userId }).first()
        : await knex('app_metrics').first();
    }
    return { success: true, export: exportData };
  } catch (err) {
    logger.error('Export data error: %s', err.message);
    return { error: 'Export failed.' };
  }
});
// IPC handler for metrics
ipcMain.handle('getMetrics', async (event, payload) => {
  const schema = Joi.object({
    userId: Joi.string().alphanum().min(3).max(64).optional(),
    range: Joi.string().valid('24h', '7d', '30d').optional(),
  });
  const { error, value } = schema.validate(payload || {});
  if (error) {
    logger.warn('Invalid getMetrics input: %s', error.message);
    return { error: 'Invalid input', details: error.details };
  }
  // Example: fetch metrics from DB or cache
  try {
    let metrics;
    if (value.userId) {
      metrics = await knex('user_metrics').where({ userId: value.userId }).first();
    } else {
      metrics = await knex('app_metrics').first();
    }
    return { success: true, metrics: metrics || {} };
  } catch (err) {
    logger.error('Metrics fetch error: %s', err.message);
    return { error: 'Metrics unavailable.' };
  }
});
// IPC handler for auto-update
ipcMain.handle('checkForUpdates', async (event, payload) => {
  const schema = Joi.object({
    userId: Joi.string().alphanum().min(3).max(64).optional(),
    currentVersion: Joi.string().max(32).required(),
  });
  const { error, value } = schema.validate(payload);
  if (error) {
    logger.warn('Invalid checkForUpdates input: %s', error.message);
    return { error: 'Invalid input', details: error.details };
  }
  // Simulate update check (replace with real logic)
  const latestVersion = '7.13.2';
  const updateAvailable = value.currentVersion !== latestVersion;
  return {
    success: true,
    updateAvailable,
    latestVersion,
    changelogUrl: 'https://a1betting.com/changelog',
  };
});
// IPC handler for notifications
ipcMain.handle('sendNotification', async (event, payload) => {
  const schema = Joi.object({
    userId: Joi.string().alphanum().min(3).max(64).optional(),
    type: Joi.string().valid('info', 'warning', 'error', 'success').required(),
    message: Joi.string().max(256).required(),
    meta: Joi.object().unknown(true).optional(),
  });
  const { error, value } = schema.validate(payload);
  if (error) {
    logger.warn('Invalid sendNotification input: %s', error.message);
    return { error: 'Invalid input', details: error.details };
  }
  // Log notification and return to frontend
  logger.info('Notification: %s [%s] %j', value.message, value.type, value.meta || {});
  // Optionally, persist notification in DB
  try {
    await knex('notifications').insert({
      userId: value.userId || null,
      type: value.type,
      message: value.message,
      meta: JSON.stringify(value.meta || {}),
      created_at: new Date(),
    });
  } catch (err) {
    logger.error('Notification DB error: %s', err.message);
  }
  return { success: true };
});
// IPC handler for getting settings
ipcMain.handle('getSettings', async (event, payload) => {
  const schema = Joi.object({
    userId: Joi.string().alphanum().min(3).max(64).optional(),
  });
  const { error, value } = schema.validate(payload || {});
  if (error) {
    logger.warn('Invalid getSettings input: %s', error.message);
    return { error: 'Invalid input', details: error.details };
  }
  // Example: fetch settings from DB or config
  try {
    let settings;
    if (value.userId) {
      settings = await knex('user_settings').where({ userId: value.userId }).first();
    } else {
      settings = await knex('app_settings').first();
    }
    return { success: true, settings: settings || {} };
  } catch (err) {
    logger.error('Settings fetch error: %s', err.message);
    return { error: 'Settings unavailable.' };
  }
});

// IPC handler for updating settings
ipcMain.handle('updateSettings', async (event, payload) => {
  const schema = Joi.object({
    userId: Joi.string().alphanum().min(3).max(64).optional(),
    settings: Joi.object().unknown(true).required(),
  });
  const { error, value } = schema.validate(payload);
  if (error) {
    logger.warn('Invalid updateSettings input: %s', error.message);
    return { error: 'Invalid input', details: error.details };
  }
  try {
    if (value.userId) {
      await knex('user_settings').update(value.settings).where({ userId: value.userId });
    } else {
      await knex('app_settings').update(value.settings);
    }
    return { success: true };
  } catch (err) {
    logger.error('Settings update error: %s', err.message);
    return { error: 'Settings update failed.' };
  }
});
// IPC handler for onboarding/help
ipcMain.handle('getOnboardingHelp', async (event, payload) => {
  const schema = Joi.object({
    userId: Joi.string().alphanum().min(3).max(64).optional(),
    context: Joi.string().max(128).optional(),
  });
  const { error, value } = schema.validate(payload || {});
  if (error) {
    logger.warn('Invalid getOnboardingHelp input: %s', error.message);
    return { error: 'Invalid input', details: error.details };
  }
  // Example help content, could be dynamic/contextual
  const helpContent = {
    title: 'Welcome to A1Betting!',
    steps: [
      'Create your account and set a secure password.',
      'Connect your sportsbook APIs in Settings.',
      'Explore live odds and betting opportunities.',
      'Use the dashboard for analytics and ML-powered predictions.',
      'Access help and support anytime from the Help menu.',
    ],
    links: [
      { label: 'User Guide', url: 'https://a1betting.com/guide' },
      { label: 'Support', url: 'https://a1betting.com/support' },
    ],
  };
  return { success: true, help: helpContent };
});
const Joi = require('joi');
// IPC handler for backend health check and monitoring
ipcMain.handle('healthCheck', async () => {
  const checks = {};
  // Check DB connection
  try {
    await knex.raw('select 1+1 as result');
    checks.database = 'ok';
  } catch (err) {
    checks.database = 'error';
    logger.error('Health check DB error: %s', err.message);
  }
  // Check ESPN API
  try {
    await espnLimiter.schedule(() => axios.get(ESPN_API_URL));
    checks.espn = 'ok';
  } catch (err) {
    checks.espn = 'error';
    logger.error('Health check ESPN error: %s', err.message);
  }
  // Check SportsRadar API
  try {
    await sportsRadarLimiter.schedule(() => axios.get(SPORTSRADAR_API_URL));
    checks.sportsRadar = 'ok';
  } catch (err) {
    checks.sportsRadar = 'error';
    logger.error('Health check SportsRadar error: %s', err.message);
  }
  // Check Odds API
  try {
    await oddsApiLimiter.schedule(() => axios.get(ODDS_API_URL));
    checks.oddsApi = 'ok';
  } catch (err) {
    checks.oddsApi = 'error';
    logger.error('Health check Odds API error: %s', err.message);
  }
  // Check OpticOdds API
  try {
    await opticOddsLimiter.schedule(() => axios.get(OPTIC_ODDS_URL));
    checks.opticOdds = 'ok';
  } catch (err) {
    checks.opticOdds = 'error';
    logger.error('Health check OpticOdds error: %s', err.message);
  }
  // Check SportsDataIO API
  try {
    await sportsDataIOLimiter.schedule(() => axios.get(SPORTS_DATA_IO_URL));
    checks.sportsDataIO = 'ok';
  } catch (err) {
    checks.sportsDataIO = 'error';
    logger.error('Health check SportsDataIO error: %s', err.message);
  }
  return checks;
});
// Electron main process: Sportsbook API integration
const axios = require('axios');
const crypto = require('crypto');
const Bottleneck = require('bottleneck');
const { RateLimiterMemory } = require('rate-limiter-flexible');

function createWindow() {
  const isDev = process.env.NODE_ENV === 'development';
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // best practice: use preload for IPC
      contextIsolation: true,
      preload: require('path').join(__dirname, 'public', 'preload.js'),
    },
    show: false, // show after ready-to-show for smooth UX
  });

  // Load the main UI (React app)
  const startUrl = isDev
    ? 'http://localhost:8173'
    : `file://${require('path').join(__dirname, 'dist', 'index.html')}`;
  win.loadURL(startUrl);

  win.once('ready-to-show', () => {
    win.show();
  });

  win.on('closed', () => {
    // Clean up if needed
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ---- API Rate Limiters ----
const espnLimiter = new Bottleneck({ maxConcurrent: 2, minTime: 500 });
const sportsRadarLimiter = new Bottleneck({ maxConcurrent: 2, minTime: 500 });
const oddsApiLimiter = new Bottleneck({ maxConcurrent: 2, minTime: 500 });
const opticOddsLimiter = new Bottleneck({ maxConcurrent: 2, minTime: 500 });
const sportsDataIOLimiter = new Bottleneck({ maxConcurrent: 2, minTime: 500 });

// ---- Per-user Rate Limiter ----
const userRateLimiter = new RateLimiterMemory({ points: 30, duration: 60 }); // 30 requests per minute per user

// ---- API Endpoint URLs ----
const ODDS_API_URL = 'https://api.the-odds-api.com/v4/sports';
const OPTIC_ODDS_URL = 'https://api.opticodds.com/v1/odds';
const SPORTS_DATA_IO_URL = 'https://api.sportsdata.io/v4/sports';
const ESPN_API_URL = 'https://site.api.espn.com/apis/site/v2/sports';
const SPORTSRADAR_API_URL = 'https://api.sportradar.com';

// ---- Helper Functions ----
// Exponential backoff retry for API calls
async function retryWithBackoff(fn, retries = 3, baseDelay = 500) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= retries) throw err;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      logger.warn(
        'Retrying API call after %d ms (attempt %d/%d): %s',
        delay,
        attempt,
        retries,
        err.message
      );
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

// ---- IPC Handlers ----
ipcMain.handle('fetchOpticOdds', async (event, payload) => {
  const schema = Joi.object({
    userId: Joi.string().alphanum().min(3).max(64).required(),
    params: Joi.object().unknown(true).required(),
  });
  const { error, value } = schema.validate(payload);
  if (error) {
    logger.warn('Invalid fetchOpticOdds input: %s', error.message);
    return { error: 'Invalid input', details: error.details };
  }
  const { userId, params } = value;
  try {
    await userRateLimiter.consume(userId);
    const response = await opticOddsLimiter.schedule(() =>
      retryWithBackoff(() => axios.get(OPTIC_ODDS_URL, { params }))
    );
    logger.info('Fetched OpticOdds data for userId: %s', userId);
    return { success: true, data: response.data };
  } catch (e) {
    if (e instanceof RateLimiterMemory.RateLimiterRes) {
      logger.warn('OpticOdds rate limit exceeded for userId: %s', userId);
      return {
        error: 'Rate limit exceeded',
        retryAfter: e.msBeforeNext / 1000,
        rateLimit: {
          limit: 30,
          remaining: e.remainingPoints,
          reset: Math.ceil((Date.now() + e.msBeforeNext) / 1000),
        },
      };
    }
    logger.error('OpticOdds API error: %s', e.message, { params, userId, stack: e.stack });
    // Graceful degradation: fallback to cached data if available
    try {
      const cached = await knex('opticodds_cache').where({ userId }).first();
      if (cached && cached.data) {
        logger.info('Serving OpticOdds cached data for userId: %s', userId);
        return { success: true, data: JSON.parse(cached.data), fallback: true };
      }
    } catch (cacheErr) {
      logger.error('OpticOdds cache error: %s', cacheErr.message, { userId });
    }
    return { error: 'OpticOdds API unavailable. Please try again later.' };
  }
});

ipcMain.handle('fetchSportsDataIO', async (event, payload) => {
  const schema = Joi.object({
    userId: Joi.string().alphanum().min(3).max(64).required(),
    params: Joi.object().unknown(true).required(),
  });
  const { error, value } = schema.validate(payload);
  if (error) {
    logger.warn('Invalid fetchSportsDataIO input: %s', error.message);
    return { error: 'Invalid input', details: error.details };
  }
  const { userId, params } = value;
  try {
    await userRateLimiter.consume(userId);
    const response = await sportsDataIOLimiter.schedule(() =>
      retryWithBackoff(() => axios.get(SPORTS_DATA_IO_URL, { params }))
    );
    logger.info('Fetched SportsDataIO data for userId: %s', userId);
    return { success: true, data: response.data };
  } catch (e) {
    if (e instanceof RateLimiterMemory.RateLimiterRes) {
      logger.warn('SportsDataIO rate limit exceeded for userId: %s', userId);
      return {
        error: 'Rate limit exceeded',
        retryAfter: e.msBeforeNext / 1000,
        rateLimit: {
          limit: 30,
          remaining: e.remainingPoints,
          reset: Math.ceil((Date.now() + e.msBeforeNext) / 1000),
        },
      };
    }
    logger.error('SportsDataIO API error: %s', e.message, { params, userId, stack: e.stack });
    // Graceful degradation: fallback to cached data if available
    try {
      const cached = await knex('sportsdataio_cache').where({ userId }).first();
      if (cached && cached.data) {
        logger.info('Serving SportsDataIO cached data for userId: %s', userId);
        return { success: true, data: JSON.parse(cached.data), fallback: true };
      }
    } catch (cacheErr) {
      logger.error('SportsDataIO cache error: %s', cacheErr.message, { userId });
    }
    return { error: 'SportsDataIO API unavailable. Please try again later.' };
  }
});

//

// IPC handler for ESPN live game data
ipcMain.handle('fetchESPNData', async (event, payload) => {
  const schema = Joi.object({
    userId: Joi.string().alphanum().min(3).max(64).required(),
    sport: Joi.string().min(2).max(32).required(),
    league: Joi.string().min(2).max(32).required(),
    eventId: Joi.string().alphanum().min(3).max(64).required(),
  });
  const { error, value } = schema.validate(payload);
  if (error) {
    logger.warn('Invalid fetchESPNData input: %s', error.message);
    return { error: 'Invalid input', details: error.details };
  }
  const { userId, sport, league, eventId } = value;
  try {
    await userRateLimiter.consume(userId);
    const url = `${ESPN_API_URL}/${sport}/${league}/events/${eventId}`;
    const response = await espnLimiter.schedule(() => retryWithBackoff(() => axios.get(url)));
    logger.info('Fetched ESPN data for event: %s', eventId);
    return { success: true, data: response.data };
  } catch (e) {
    if (e instanceof RateLimiterMemory.RateLimiterRes) {
      logger.warn('ESPN rate limit exceeded for userId: %s', userId);
      return {
        error: 'Rate limit exceeded',
        retryAfter: e.msBeforeNext / 1000,
        rateLimit: {
          limit: 30,
          remaining: e.remainingPoints,
          reset: Math.ceil((Date.now() + e.msBeforeNext) / 1000),
        },
      };
    }
    logger.error('ESPN API error: %s', e.message, { sport, league, eventId, stack: e.stack });
    // Graceful degradation: fallback to cached data if available
    try {
      const cached = await knex('espn_cache').where({ eventId }).first();
      if (cached && cached.data) {
        logger.info('Serving ESPN cached data for event: %s', eventId);
        return { success: true, data: JSON.parse(cached.data), fallback: true };
      }
    } catch (cacheErr) {
      logger.error('ESPN cache error: %s', cacheErr.message, { eventId });
    }
    return { error: 'ESPN API unavailable. Please try again later.' };
  }
});

ipcMain.handle('fetchSportsRadarData', async (event, payload) => {
  const schema = Joi.object({
    userId: Joi.string().alphanum().min(3).max(64).required(),
    endpoint: Joi.string().min(2).max(64).required(),
    params: Joi.object().unknown(true).required(),
    apiKey: Joi.string().min(16).max(128).required(),
  });
  const { error, value } = schema.validate(payload);
  if (error) {
    logger.warn('Invalid fetchSportsRadarData input: %s', error.message);
    return { error: 'Invalid input', details: error.details };
  }
  const { userId, endpoint, params, apiKey } = value;
  try {
    await userRateLimiter.consume(userId);
    const url = `${SPORTSRADAR_API_URL}/${endpoint}`;
    const response = await sportsRadarLimiter.schedule(() =>
      retryWithBackoff(() => axios.get(url, { params: { ...params, api_key: apiKey } }))
    );
    logger.info('Fetched SportsRadar data for endpoint: %s', endpoint);
    return { success: true, data: response.data };
  } catch (e) {
    if (e instanceof RateLimiterMemory.RateLimiterRes) {
      logger.warn('SportsRadar rate limit exceeded for userId: %s', userId);
      return {
        error: 'Rate limit exceeded',
        retryAfter: e.msBeforeNext / 1000,
        rateLimit: {
          limit: 30,
          remaining: e.remainingPoints,
          reset: Math.ceil((Date.now() + e.msBeforeNext) / 1000),
        },
      };
    }
    logger.error('SportsRadar API error: %s', e.message, { endpoint, params, stack: e.stack });
    // Graceful degradation: fallback to cached data if available
    try {
      const cached = await knex('sportsradar_cache').where({ endpoint }).first();
      if (cached && cached.data) {
        logger.info('Serving SportsRadar cached data for endpoint: %s', endpoint);
        return { success: true, data: JSON.parse(cached.data), fallback: true };
      }
    } catch (cacheErr) {
      logger.error('SportsRadar cache error: %s', cacheErr.message, { endpoint });
    }
    return { error: 'SportsRadar API unavailable. Please try again later.' };
  }
});

async function getUserApiKey(userId, userSecret) {
  try {
    const user = await knex('users').where({ id: userId }).first();
    if (!user || !user.api_key_encrypted) return null;
    // Decrypt using same logic as main-api-key.js
    const [ivHex, tagHex, encryptedHex] = user.api_key_encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const key = crypto.createHash('sha256').update(userSecret).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    handleDbError(error, { userId });
    return null;
  }
}

ipcMain.handle('fetchOdds', async (event, payload) => {
  const schema = Joi.object({
    userId: Joi.string().alphanum().min(3).max(64).required(),
    userSecret: Joi.string().min(8).max(128).required(),
    sport: Joi.string().min(2).max(32).required(),
    region: Joi.string().min(2).max(16).optional(),
    market: Joi.string().min(2).max(32).optional(),
  });
  const { error, value } = schema.validate(payload);
  if (error) {
    logger.warn('Invalid fetchOdds input: %s', error.message);
    return { error: 'Invalid input', details: error.details };
  }
  const { userId, userSecret, sport, region, market } = value;
  const apiKey = await getUserApiKey(userId, userSecret);
  if (!apiKey) {
    logger.warn('API key not found for userId: %s', userId);
    return { error: 'API key not found' };
  }
  try {
    await userRateLimiter.consume(userId);
    const response = await oddsApiLimiter.schedule(() =>
      retryWithBackoff(() =>
        axios.get(`${ODDS_API_URL}/${sport}/odds`, {
          params: {
            apiKey,
            regions: region || 'us',
            markets: market || 'h2h,spreads,totals',
          },
        })
      )
    );
    logger.info('Fetched odds for sport: %s, userId: %s', sport, userId);
    return { success: true, data: response.data };
  } catch (e) {
    if (e instanceof RateLimiterMemory.RateLimiterRes) {
      logger.warn('Odds API rate limit exceeded for userId: %s', userId);
      return {
        error: 'Rate limit exceeded',
        retryAfter: e.msBeforeNext / 1000,
        rateLimit: {
          limit: 30,
          remaining: e.remainingPoints,
          reset: Math.ceil((Date.now() + e.msBeforeNext) / 1000),
        },
      };
    }
    logger.error('Odds API error: %s', e.message, { sport, userId, stack: e.stack });
    // Graceful degradation: fallback to cached data if available
    try {
      const cached = await knex('odds_cache').where({ sport }).first();
      if (cached && cached.data) {
        logger.info('Serving Odds cached data for sport: %s', sport);
        return { success: true, data: JSON.parse(cached.data), fallback: true };
      }
    } catch (cacheErr) {
      logger.error('Odds cache error: %s', cacheErr.message, { sport });
    }
    return { error: 'Odds API unavailable. Please try again later.' };
  }
});
