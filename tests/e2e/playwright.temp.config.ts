import { defineConfig, devices } from '@playwright/test';

// Temporary config used by the automated triage runner. Keeps artifacts in a
// predictable folder and always preserves outputs so we can extract traces.
export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/e2e/tmp/playwright-report' }],
    ['json', { outputFile: 'tests/e2e/tmp/test-results.json' }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:5173',
    storageState: 'tests/e2e/auth.json',
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
  outputDir: 'tests/e2e/tmp/test-results',
  preserveOutput: 'always',
});
// Temporary Playwright configuration for local runs (testDir='.')
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory (point at current directory where specs live)
  testDir: '.',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { outputFolder: 'tests/e2e/reports/html' }],
    ['json', { outputFile: 'tests/e2e/reports/test-results.json' }],
    ['junit', { outputFile: 'tests/e2e/reports/junit.xml' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      'X-E2E-Test': 'true',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  globalSetup: require.resolve('./global-setup.ts'),
  globalTeardown: require.resolve('./global-teardown.ts'),

  timeout: 60000,
  expect: { timeout: 5000 },
  outputDir: 'tests/e2e/test-results',
  snapshotDir: 'tests/e2e/screenshots',
  preserveOutput: 'failures-only',
});
