const puppeteer = require('puppeteer');

(async () => {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173/';
  const HEADLESS = process.env.HEADLESS !== 'false';
  const browser = await puppeteer.launch({ headless: HEADLESS, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);

    const argv = process.argv.slice(2).map(a => a.toLowerCase());
    const SKIP_INJECT = process.env.SKIP_INJECT === 'true' || argv.includes('--skip-inject');
    if (!SKIP_INJECT) {
      await page.evaluateOnNewDocument(() => {
        try {
          localStorage.setItem('token', 'headless-test-token');
          localStorage.setItem('user', JSON.stringify({ id: 'headless-user', email: 'dev@local', role: 'admin' }));
          localStorage.setItem('onboardingComplete', 'true');
        } catch (e) {
          // ignore
        }
      });
    } else {
      console.log('Skipping localStorage injection (--skip-inject or SKIP_INJECT=true)');
    }

    const consoleLogs = [];
    const pageErrors = [];
    const badResponses = [];

    page.on('console', msg => {
      try { consoleLogs.push({ type: msg.type(), text: msg.text() }); } catch (e) {}
    });
    page.on('pageerror', err => { try { pageErrors.push(String(err && err.stack ? err.stack : err)); } catch (e) {} });

    // Log any non-2xx responses for debugging
    page.on('response', async (response) => {
      try {
        const status = response.status();
        if (status >= 400) {
          const url = response.url();
          let body = null;
          try {
            body = await response.text();
          } catch (e) {
            body = '<unreadable body>';
          }
          badResponses.push({ url, status, body: body ? body.slice(0, 2000) : null });
        }
      } catch (e) {
        // ignore
      }
    });

    const apiUrlPartial = '/api/propfinder/opportunities';
    let apiResponseBody = null;
    let apiResponseStatus = null;

    const responsePromise = page.waitForResponse(response => {
      try { return response.url().includes(apiUrlPartial) && response.status() === 200; } catch (e) { return false; }
    }, { timeout: 30000 }).then(async resp => {
      apiResponseStatus = resp.status();
      try { apiResponseBody = await resp.json(); } catch (e) { try { apiResponseBody = await resp.text(); } catch (e2) { apiResponseBody = null; } }
    }).catch(() => null);

    const targetUrl = FRONTEND_URL.endsWith('/') ? `${FRONTEND_URL}propfinder` : `${FRONTEND_URL}/propfinder`;
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    try { await page.waitForSelector('[data-testid="propfinder-killer-heading"]', { timeout: 20000 }); } catch (e) {}

    if (SKIP_INJECT) {
      try {
        const devButton = await page.$('[data-testid="dev-view-dashboard"]') || await page.$('[data-testid="dev-view-dashboard-global"]');
        if (devButton) {
          console.log('Dev view button present; clicking to enable demo dashboard');
          await devButton.click();
          try { await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }); } catch (e) {}
        }
      } catch (e) {}
    }

    await responsePromise;

    const debugGlobals = await page.evaluate(() => {
      try {
        return {
          last_request_url: (window.__propfinder_last_request_url),
          last_request_params: (window.__propfinder_last_request_params),
          last_fetch_status: (window.__propfinder_last_fetch_status),
          last_response: (window.__propfinder_last_response),
          last_stats: (window.__propfinder_last_stats),
        };
      } catch (e) { return { error: String(e) }; }
    });

    let directFetchBody = null;
    try {
      directFetchBody = await page.evaluate(async (url) => {
        if (!url) return null;
        try {
          const res = await fetch(url, { credentials: 'same-origin' });
          if (!res.ok) return { status: res.status, body: await res.text() };
          try { const json = await res.json(); return { status: res.status, body: json }; } catch (e) { return { status: res.status, body: await res.text() }; }
        } catch (e) { return { error: String(e) }; }
      }, debugGlobals.last_request_url || null);
    } catch (e) {}

    const out = {
      frontend_url: FRONTEND_URL,
      api_captured_status: apiResponseStatus,
      api_captured_body: apiResponseBody !== null ? apiResponseBody : null,
      debug_globals: debugGlobals,
      direct_fetch: directFetchBody,
      console_logs: consoleLogs,
      page_errors: pageErrors,
      bad_responses: badResponses,
    };

    console.log(JSON.stringify(out, null, 2));
  } catch (err) {
    console.error('ERROR', err && err.stack ? err.stack : err);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();