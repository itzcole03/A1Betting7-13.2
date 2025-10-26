import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.E2E_FRONTEND_BASE_URL ?? 'http://localhost:5173',
    // Reuse a storage state created in global setup so onboarding / demo flags
    // are pre-populated for all test contexts.
    storageState: 'tests/e2e/auth.json',

    /* Always collect a trace (includes network) so trace-based correlator can extract request/response events) */
    trace: 'on',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // If an external front-end base URL is provided via E2E_FRONTEND_BASE_URL
  // (for example, when CI starts an instrumented proxy outside Playwright),
  // avoid starting the Playwright-managed frontend webServer. This prevents
  // Playwright from launching its own server (which could bind to 5173 and
  // lead tests to bypass the instrumented proxy). When the env var is set,
  // Playwright will still run the backend webServer entry so the backend
  // process is available for tests.
  webServer: process.env.E2E_FRONTEND_BASE_URL
    ? [
        {
          // Only start the backend server; frontend is provided externally.
          command:
            'cd .. & npx kill-port 8000 & set PYTHONPATH=.&& python -m uvicorn backend.core.app:create_app --factory --host 127.0.0.1 --port 8000',
          url: 'http://localhost:8000/api/testing/ready',
          reuseExistingServer: false,
          timeout: 60 * 1000,
        },
      ]
    : [
        {
          // Full local flow: build the frontend and serve the static dist
          // using the in-repo static server. This is the deterministic
          // default for developer runs where E2E_FRONTEND_BASE_URL is not
          // provided.
          command: 'cd . && npm run build && node scripts/serve-dist-fixed.cjs 5173',
          url: 'http://localhost:5173',
          env: {
            BACKEND_URL: 'http://localhost:8000',
          },
          reuseExistingServer: false,
          timeout: 4 * 60 * 1000,
        },
        {
          // Start the backend service when Playwright manages the frontend
          // process too. Keeps backend lifecycle aligned with frontend.
          command:
            'cd .. & npx kill-port 8000 & set PYTHONPATH=.&& python -m uvicorn backend.core.app:create_app --factory --host 127.0.0.1 --port 8000',
          url: 'http://localhost:8000/api/testing/ready',
          reuseExistingServer: false,
          timeout: 60 * 1000,
        },
      ],

  /* Timeout settings */
  timeout: 30 * 1000,
  expect: {
    timeout: 10 * 1000,
  },

  /* Global setup and teardown (ESM-safe resolution) */
  // Use import.meta.url to build file paths in an ES module context.
  globalSetup: fileURLToPath(new URL('./tests/e2e/global-setup', import.meta.url)),
  globalTeardown: fileURLToPath(new URL('./tests/e2e/global-teardown', import.meta.url)),
});
