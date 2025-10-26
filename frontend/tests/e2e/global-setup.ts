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
  process.env.VITE_BACKEND_URL = 'http://localhost:8000';

  // Wait for services to be ready
  await waitForServices();

  // Setup test data
  await setupTestData();

  // Create a storageState (auth/onboarding) so tests start with onboarding dismissed
  await createStorageState((global as any).__e2e_frontend_port || 5173);

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
      const response = await fetch('http://localhost:8000/api/testing/ready');
      if (response.ok) {
        // eslint-disable-next-line no-console
        console.log('✅ Backend ready (testing probe)');
        break;
      }
    } catch (_error) {
      if (i === maxRetries - 1) {
        throw new Error('Backend service failed to start');
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  // Wait for frontend. Vite may bind to 5173 or fallback to another nearby port
  // (5174, etc.). Probe a small port range and return the first responsive port.
  // Honor explicit override via E2E_FRONTEND_BASE_URL to force the instrumented
  // static/proxy server (useful in CI). Otherwise probe candidate ports.
  // eslint-disable-next-line no-console
  console.log('⏳ Waiting for frontend service...');
  let frontendPort = 5173;
  const candidatePorts = [5173, 5174, 5175, 5176];
  let frontendReady = false;

  // If a base URL override is provided, prefer it and validate it before
  // falling back to autodiscovery. This makes CI deterministic when you start
  // the instrumented static server on a known address.
  const forcedBase = process.env.E2E_FRONTEND_BASE_URL;
  if (forcedBase) {
    try {
      const u = new URL(forcedBase);
      // prefer supplied port if present, otherwise derive
      const p = u.port ? Number(u.port) : u.protocol === 'http:' ? 80 : 443;
      frontendPort = p;
      // quick probe to ensure the forced base is serving
      for (let i = 0; i < 10; i++) {
        try {
          const response = await fetch(`http://localhost:${frontendPort}`);
          if (response.ok) {
            // eslint-disable-next-line no-console
            console.log(`✅ Using forced frontend base ${forcedBase} -> port ${frontendPort}`);
            frontendReady = true;
            break;
          }
        } catch (_err) {
          // retry
        }
        await new Promise(r => setTimeout(r, 500));
      }
      if (!frontendReady) {
        // eslint-disable-next-line no-console
        console.warn(
          `⚠️  E2E_FRONTEND_BASE_URL=${forcedBase} not reachable; falling back to autodiscovery`
        );
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('⚠️  Invalid E2E_FRONTEND_BASE_URL, ignoring:', String(e));
    }
  }

  for (const p of candidatePorts) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(`http://localhost:${p}`);
        if (response.ok) {
          // Inspect the returned HTML to determine if this is a Vite dev server.
          // Vite dev servers include the client script path "/@vite/client" and
          // other dev-only markers in index.html. Our instrumented static server
          // (the one that reverse-proxies /api and persists proxy logs) serves
          // built assets and will NOT include the Vite client. Prefer a
          // non-Vite server when available so Playwright uses the instrumented
          // proxy rather than a Vite dev server that may bypass it.
          let isViteDev = false;
          try {
            const ct = response.headers.get('content-type') || '';
            if (ct.includes('text/html')) {
              const txt = await response.text();
              if (txt.includes('/@vite/client') || txt.includes('import.meta.hot')) {
                isViteDev = true;
              }
            }
          } catch {
            // ignore inspection failures and fall back to accepting the port
          }

          if (isViteDev && !process.env.E2E_ALLOW_VITE) {
            // eslint-disable-next-line no-console
            console.log(
              `ℹ️  Detected Vite dev server at port ${p}; skipping (set E2E_ALLOW_VITE=1 to override)`
            );
            // treat as not-ready so we continue searching other candidate ports
            break;
          }

          // eslint-disable-next-line no-console
          console.log(
            `✅ Frontend service ready at port ${p}` +
              (isViteDev ? ' (vite dev server accepted)' : '')
          );
          frontendPort = p;
          frontendReady = true;
          break;
        }
      } catch (_error) {
        // ignore and retry
      }
      if (i === maxRetries - 1) {
        // move to next candidate port
        break;
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
    if (frontendReady) break;
  }
  if (!frontendReady) throw new Error('Frontend service failed to start on checked ports');

  // Pass found frontend port to subsequent setup steps
  (global as any).__e2e_frontend_port = frontendPort;
  // Verify the static server is proxying /api to the backend successfully.
  // This prevents races where the static server is serving assets but not
  // yet able to forward API requests during SPA boot.
  // eslint-disable-next-line no-console
  console.log('⏳ Verifying frontend proxy to backend via /api/health...');
  const proxyMaxAttempts = 20;
  let proxyOk = false;
  for (let attempt = 1; attempt <= proxyMaxAttempts; attempt++) {
    try {
      const pRes = await fetch(`http://localhost:${frontendPort}/api/health`, { method: 'GET' });
      if (pRes && pRes.ok) {
        // eslint-disable-next-line no-console
        console.log(`✅ Frontend proxy /api/health ok (port=${frontendPort}, attempt=${attempt})`);
        proxyOk = true;
        break;
      }
    } catch (e) {
      // ignore and retry
    }
    await new Promise(r => setTimeout(r, 250 * attempt));
  }
  if (!proxyOk) {
    // If proxy check fails, surface a clear error so CI artifacts include
    // the reason and Playwright doesn't proceed into flaky runs.
    throw new Error(`Frontend proxy to backend failed on port ${frontendPort}`);
  }
  // Persist discovered frontend port so tests can read it and use absolute URLs.
  try {
    const fs = require('fs');
    const portPath = 'tests/e2e/frontend_port.json';
    const baseWrite = process.env.E2E_FRONTEND_BASE_URL
      ? { base: process.env.E2E_FRONTEND_BASE_URL }
      : { port: frontendPort };
    fs.writeFileSync(portPath, JSON.stringify(baseWrite), 'utf8');
  } catch (e) {
    // ignore file write errors; tests will fallback to 5173
  }
}

async function setupTestData() {
  // eslint-disable-next-line no-console
  console.log('📊 Setting up test data...');

  try {
    // Activate MLB sport
    await fetch('http://localhost:8000/api/sports/activate/MLB', {
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

async function createStorageState(frontendPort: number = 5173) {
  // eslint-disable-next-line no-console
  console.log('💾 Creating Playwright storageState with onboarding/demo flags...');

  const statePath = 'tests/e2e/auth.json';
  const browser = await chromium.launch();
  // Allow explicit override of the frontend base URL for deterministic CI runs
  const baseUrl = process.env.E2E_FRONTEND_BASE_URL || `http://localhost:${frontendPort}`;
  const context = await browser.newContext({ baseURL: baseUrl });
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
        // Ensure navigation is open for E2E runs by default so tests that
        // expect a visible navigation start consistently. This value is read
        // by the app on mount (see UserFriendlyApp) when present.
        localStorage.setItem('e2e_nav_open', '1');
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

    // Ensure primary navigation is open for E2E runs. Some builds render the
    // navigation collapsed by default (mobile/layout variations). Click the
    // toggle if present so tests that expect an open nav have a consistent start.
    try {
      const navToggleSelector =
        '[aria-label="Open Navigation"], [title="Open Navigation"], button:has-text("Open Navigation")';
      const navPanelSelector =
        '[data-testid="primary-nav"], nav, .navigation, .sidebar, .header-nav';

      for (let attempt = 0; attempt < 3; attempt++) {
        const navToggle = await page.$(navToggleSelector);
        if (navToggle) {
          try {
            await navToggle.click({ force: true });
          } catch {
            // ignore click failures
          }
        }

        // Wait briefly for the nav panel to appear
        try {
          const navVisible = await page.waitForSelector(navPanelSelector, { timeout: 1500 });
          if (navVisible) break;
        } catch {
          // not visible yet; try again
        }

        // small backoff before retrying
        await page.waitForTimeout(300);
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
            'http://localhost:8000/api/propfinder/opportunities?limit=5'
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
        // Also POST the snapshot to the backend test fixture endpoint so the
        // server-side shim returns the same deterministic data. This keeps
        // frontend and backend fixtures aligned for Playwright runs.
        try {
          // POST the snapshot to the backend test fixture endpoint with retries.
          // This ensures the exact backend instance used by Playwright is seeded
          // and avoids races where the POST hits a not-yet-ready process.
          const seedUrl = 'http://localhost:8000/api/testing/propfinder/seed';
          const maxSeedAttempts = 10;
          let seeded = false;
          for (let attempt = 1; attempt <= maxSeedAttempts; attempt++) {
            try {
              const res = await fetch(seedUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: snapshot,
              });
              if (res.ok) {
                try {
                  const json = await res.json();
                  const seededFlag = json?.data?.seeded ?? json?.seeded ?? false;
                  const count = json?.data?.count ?? json?.count ?? 0;
                  if (seededFlag || (typeof count === 'number' && count > 0)) {
                    seeded = true;
                    // eslint-disable-next-line no-console
                    console.log(`✅ Seeded backend fixture (attempt ${attempt}) -> count=${count}`);
                    break;
                  }
                } catch {
                  // Non-JSON response is still considered a success if status ok
                  seeded = true;
                  break;
                }
              }
            } catch (e) {
              // ignore and retry
            }
            // backoff between attempts
            await new Promise(r => setTimeout(r, 500 * attempt));
          }
          if (!seeded) {
            // If the POST didn't convincingly indicate seeded, poll the
            // seed_status endpoint on the backend and block until the
            // exact Playwright-started backend reports the fixture is loaded.
            // Increase attempts and backoff to reduce races on slower CI.
            try {
              const statusUrl = 'http://localhost:8000/api/testing/propfinder/seed_status';
              const maxStatusAttempts = 30;
              for (let sAttempt = 1; sAttempt <= maxStatusAttempts; sAttempt++) {
                try {
                  const sres = await fetch(statusUrl);
                  if (sres.ok) {
                    const j = await sres.json();
                    const seededFlag = j?.data?.seeded ?? j?.seeded ?? false;
                    if (seededFlag) {
                      seeded = true;
                      // eslint-disable-next-line no-console
                      console.log(
                        `✅ seed_status reports seeded (sAttempt=${sAttempt}/${maxStatusAttempts})`
                      );
                      break;
                    }
                  }
                } catch (e) {
                  // ignore transient errors
                }
                // Exponential-ish backoff to be gentle on the backend
                await new Promise(r => setTimeout(r, Math.min(2000, 100 * sAttempt)));
              }
            } catch (e) {
              // ignore
            }
          }
          if (!seeded) {
            // eslint-disable-next-line no-console
            console.warn(
              '⚠️  Failed to seed backend fixture after retries; proceeding with localStorage fallback'
            );
          }
        } catch (e) {
          // ignore failures here; localStorage fallback still helps
        }
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
    // Before we persist storageState, ensure the seeded data is visible via the
    // frontend proxy so the browser context will see the same fixture when
    // tests start. This avoids races where the backend is seeded but the
    // static server hasn't fully begun proxying API paths.
    if (propfinderReady && frontendPort) {
      try {
        const probeUrl = `http://localhost:${frontendPort}/api/propfinder/opportunities?limit=5`;
        const maxProbe = 20;
        let probeOk = false;
        for (let i = 1; i <= maxProbe; i++) {
          try {
            const r = await fetch(probeUrl);
            if (r && r.ok) {
              try {
                const j = await r.json();
                const count = j?.data?.length ?? (Array.isArray(j) ? j.length : 0);
                if (count && Number(count) > 0) {
                  probeOk = true;
                  // eslint-disable-next-line no-console
                  console.log(`✅ Proxy-visible propfinder has data (attempt=${i})`);
                  break;
                }
              } catch {
                // Non-JSON response but OK status is acceptable
                probeOk = true;
                break;
              }
            }
          } catch {
            // ignore transient
          }
          // small backoff
          await new Promise(r => setTimeout(r, 300 * i));
        }
        if (!probeOk) {
          // warn but continue — storageState will still be helpful in most cases
          // and we don't want to fail test setup entirely for slow CI.
          // eslint-disable-next-line no-console
          console.warn(
            '⚠️  Proxy probe did not observe seeded propfinder data before storageState write'
          );
        }
      } catch (e) {
        // ignore and continue to write storage state
      }
    }

    await context.storageState({ path: statePath });
    // eslint-disable-next-line no-console
    console.log('✅ storageState written to', statePath, 'propfinderReady=', propfinderReady);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('⚠️  Failed to create storageState:', String(err));
  } finally {
    await browser.close();
  }
}

export default globalSetup;
