// Global setup for Playwright tests
// Sets up test environment and mock data

import { FullConfig, chromium } from '@playwright/test';
import { readFile } from 'fs/promises';
import * as path from 'path';

async function globalSetup(_config: FullConfig) {
  // eslint-disable-next-line no-console
  console.log('🚀 Starting Playwright global setup...');

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.VITE_TESTING = 'true';
  process.env.VITE_BACKEND_URL = 'http://127.0.0.1:8000';

  // Wait for services to be ready
  await waitForServices();

  // Setup test data
  await setupTestData();

  // Create a storageState (auth/onboarding) so tests start with onboarding dismissed
  await createStorageState();

  // eslint-disable-next-line no-console
  console.log('✅ Playwright global setup complete');
}

async function waitForServices() {
  const maxRetries = 30;
  const retryDelay = 1000;

  // Wait for backend
  // eslint-disable-next-line no-console
  console.log('⏳ Waiting for backend service...');
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('http://127.0.0.1:8000/health');
      if (response.ok) {
        // eslint-disable-next-line no-console
        console.log('✅ Backend service ready');
        break;
      }
    } catch (_error) {
      if (i === maxRetries - 1) {
        throw new Error('Backend service failed to start');
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  // Wait for frontend
  // eslint-disable-next-line no-console
  console.log('⏳ Waiting for frontend service...');
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('http://127.0.0.1:5173');
      if (response.ok) {
        // eslint-disable-next-line no-console
        console.log('✅ Frontend service ready');
        break;
      }
    } catch (_error) {
      if (i === maxRetries - 1) {
        throw new Error('Frontend service failed to start');
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

async function setupTestData() {
  // eslint-disable-next-line no-console
  console.log('📊 Setting up test data...');

  try {
    // Activate MLB sport
    await fetch('http://127.0.0.1:8000/api/sports/activate/MLB', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    // Setup test user preferences (if applicable)
    // Add any other test data setup here

    // eslint-disable-next-line no-console
    console.log('✅ Test data setup complete');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('⚠️  Test data setup failed, continuing with defaults:', error);
  }
}

async function createStorageState() {
  // eslint-disable-next-line no-console
  console.log('💾 Creating Playwright storageState with onboarding/demo flags...');

  const statePath = 'tests/e2e/auth.json';
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:5173' });
  const page = await context.newPage();

  try {
    await page.goto('/', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});

    // Set localStorage keys that indicate onboarding/demo state
    await page.evaluate(() => {
      try {
        // Use the same keys the app's dev global button uses so the SPA
        // boots into the demo/dashboard experience.
        localStorage.setItem('token', 'dev-demo-token');
        localStorage.setItem('access_token', 'dev-demo-token');
        localStorage.setItem('accessToken', 'dev-demo-token');
        localStorage.setItem(
          'user',
          JSON.stringify({ id: 'dev', email: 'dev@local', role: 'admin' })
        );
        // Some code paths expect onboardingComplete to be '1'
        localStorage.setItem('onboardingComplete', '1');
        localStorage.setItem('e2e_demo_mode', 'true');
        localStorage.setItem('e2e_test_mode', 'true');
        // Do NOT force-show-all in storageState so filtering tests behave normally.
        // Keep override disabled by default; tests rely on client-side filtering.
        localStorage.setItem('__propfinder_force_show_all', '0');
        localStorage.setItem('demo_user', JSON.stringify({ id: 'e2e_demo', name: 'E2E Demo' }));
      } catch (e) {
        // ignore
      }
    });

    // Reload so SPA picks up the localStorage values and any route guards update
    await page.reload({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});

    // Ensure the tests/e2e directory exists (storage API will create file path)
    // Save storage state for reuse by tests
    // Attempt to click the dev global dashboard button if present to ensure
    // the SPA transitions into the demo/dashboard experience used by tests.
    try {
      const devBtn =
        (await page.$('[data-testid="dev-view-dashboard-global"]')) ||
        (await page.$('[data-testid="dev-view-dashboard"]'));
      if (devBtn) {
        // Some builds render it but mark it not visible — try a force click.
        try {
          await devBtn.click({ force: true });
        } catch {
          /* ignore */
        }
        // Give the app time to transition
        await page.waitForTimeout(500);
      }
    } catch {
      // ignore
    }

    // Wait for either the propfinder API to return data or the prop list to appear
    let propfinderReady = false;

    // First, poll the backend directly (node-side) to avoid relying on Vite proxy.
    try {
      for (let i = 0; i < 20; i++) {
        try {
          const backendRes = await fetch(
            'http://127.0.0.1:8000/api/propfinder/opportunities?limit=5'
          );
          if (backendRes.ok) {
            const json = await backendRes.json();
            const count = json?.data?.length ?? (Array.isArray(json) ? json.length : 0);
            if (count && Number(count) > 0) {
              propfinderReady = true;
              break;
            }
          }
        } catch {
          // ignore transient
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch {
      // ignore
    }

    // If backend had no data, also check the rendered page for the prop list as a last resort
    if (!propfinderReady) {
      try {
        for (let i = 0; i < 12; i++) {
          const hasList = await page.$('[data-testid="prop-list"]');
          if (hasList) {
            propfinderReady = true;
            break;
          }
          await page.waitForTimeout(500);
        }
      } catch {
        // ignore
      }
    }

    // If backend had no data, populate a small debug snapshot into localStorage
    // so headless tests have deterministic UI data to exercise.
    if (!propfinderReady) {
      try {
        const debugPath = path.resolve(process.cwd(), 'debug-propfinder.json');
        const snapshot = await readFile(debugPath, 'utf8');
        // write snapshot into localStorage so the app's hook will pick it up
        await page.evaluate((s: string) => {
          try {
            localStorage.setItem('propfinder.debug_snapshot', s);
          } catch (e) {
            // ignore
          }
        }, snapshot);
        // Give the app a short moment to ingest if it's already mounted
        await page.waitForTimeout(250);
        // Mark ready for the purposes of storageState
        propfinderReady = true;
        // eslint-disable-next-line no-console
        console.log('ℹ️  Wrote debug snapshot into localStorage for storageState');
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('⚠️  Failed to load debug snapshot:', e);
      }
    }

    // Save storage state for reuse by tests
    await context.storageState({ path: statePath });
    // eslint-disable-next-line no-console
    console.log('✅ storageState written to', statePath, 'propfinderReady=', propfinderReady);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('⚠️  Failed to create storageState:', err?.message || err);
  } finally {
    await browser.close();
  }
}

export default globalSetup;
