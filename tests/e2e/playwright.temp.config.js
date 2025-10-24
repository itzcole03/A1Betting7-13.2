const { devices } = require('@playwright/test');
const path = require('path');

// Resolve paths relative to this config file to avoid nesting when tests are
// executed from different working directories.
const root = __dirname;
const tmpReportDir = path.resolve(root, 'tmp', 'playwright-report');
const tmpJson = path.resolve(root, 'tmp', 'test-results.json');
const tmpResults = path.resolve(root, 'tmp', 'test-results');
const storageStatePath = path.resolve(root, 'auth.json');

module.exports = {
  testDir: '.',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: tmpReportDir }],
    ['json', { outputFile: tmpJson }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:5173',
    storageState: storageStatePath,
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  outputDir: tmpResults,
  preserveOutput: 'always',
};
