const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  const outResp = 'tmp_headless_response.json';
  const outConsole = 'tmp_headless_console.txt';
  const outShot = 'tmp_headless.png';
  const url = 'http://127.0.0.1:5173/propfinder';

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Inject onboarding-localStorage overrides + a fetch/XHR wrapper before any page scripts run
  // This attempts to reproduce an interactive user's state so the dashboard mounts
  await page.evaluateOnNewDocument(() => {
    try {
      // heuristically set many possible onboarding keys to 'true' so the SPA will skip any intro
      const onboardingKeys = [
        'propfinder.onboardingCompleted',
        'propfinder:onboardingCompleted',
        'propfinder_onboarding_complete',
        'onboarding_complete',
        'onboardingCompleted',
        'hasSeenOnboarding',
        'pf_onboarding_complete',
        'propfinder.onboardComplete',
        'PropFinder.Onboarding.Completed',
        'ui:tutorial_shown',
        'welcome_shown'
      ];
      onboardingKeys.forEach(k => {
        try { localStorage.setItem(k, 'true'); } catch (e) {}
      });
      // some apps use sessionStorage or cookies
      try { sessionStorage.setItem('propfinder.onboarding', 'true'); } catch (e) {}
      try { document.cookie = 'propfinder_onboarding=true; path=/'; } catch (e) {}
    } catch (e) {
      // ignore any errors here - best-effort
    }
    try {
      // Simulate an authenticated user session so the App renders dashboard instead of onboarding
      const AUTH_KEYS = ['token', 'auth_token', 'access_token'];
      try {
        AUTH_KEYS.forEach(k => localStorage.setItem(k, 'FAKE_TOKEN_123'));
        // minimal user object stored under 'user' key as the authService expects
        const fakeUser = { id: '1', email: 'dev@local', role: 'admin' };
        localStorage.setItem('user', JSON.stringify(fakeUser));
      } catch (e) {
        // ignore storage errors
      }
    } catch (e) {}

    (function () {
      const originalFetch = window.fetch.bind(window);
      const recorded = [];
      window.__capturedFetches = recorded;

      window.fetch = async function (input, init) {
        try {
          const url = typeof input === 'string' ? input : input.url;
          const res = await originalFetch(input, init);
          try {
            const clone = res.clone();
            const ct = clone.headers.get('content-type') || '';
            if (ct.includes('application/json') && url.includes('/api/propfinder/opportunities')) {
              clone.text().then(text => {
                recorded.push({ url, status: res.status, body: text });
              }).catch(() => {});
            } else {
              recorded.push({ url, status: res.status });
            }
          } catch (e) {
            // ignore
          }
          return res;
        } catch (e) {
          throw e;
        }
      };

      // XHR wrapper
      const OriginalXHR = window.XMLHttpRequest;
      function WrappedXHR() {
        const xhr = new OriginalXHR();
        const open = xhr.open;
        xhr.open = function (method, url) {
          this._url = url;
          return open.apply(this, arguments);
        };
        xhr.addEventListener('load', function () {
          try {
            if (this._url && this._url.includes('/api/propfinder/opportunities')) {
              let body = null;
              try { body = this.responseText; } catch (e) { body = null; }
              window.__capturedFetches.push({ url: this._url, status: this.status, body });
            }
          } catch (e) {}
        });
        return xhr;
      }
      window.XMLHttpRequest = WrappedXHR;
    })();
  });

  const consoleMessages = [];
  page.on('console', msg => {
    try {
      const text = msg.text();
      consoleMessages.push(text);
      // also log to stdout for immediate visibility
      console.log('[PAGE CONSOLE]', text);
    } catch (e) {
      console.log('[PAGE CONSOLE] <unserializable>');
    }
  });

  let apiResponseBody = null;

  page.on('response', async (response) => {
    try {
      const req = response.request();
      const url = req.url();
      if (url.includes('/api/propfinder/opportunities')) {
        const ct = response.headers()['content-type'] || '';
        if (ct.includes('application/json')) {
          const text = await response.text();
          try {
            apiResponseBody = JSON.parse(text);
          } catch (e) {
            apiResponseBody = { parseError: e.message, text };
          }
        } else {
          apiResponseBody = { status: response.status(), headers: response.headers() };
        }
        console.log('[CAPTURED API RESPONSE] status=', response.status(), 'url=', url);
      }
    } catch (e) {
      console.error('response handler error', e.message);
    }
  });

  try {
  await page.setViewport({ width: 1280, height: 900 });
  // Open the specific PropFinder route to ensure the dashboard is mounted
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

  // Give the SPA a bit more time to load deferred chunks and run fetches
  await page.waitForTimeout(4000);

  // Force a hard reload (bypass cache) and wait again for network to settle
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForTimeout(3000);

    // Try to locate the stats element text on the page to extract server total
    const statsText = await page.evaluate(() => {
      try {
        const el = document.querySelector('[data-testid="propfinder-killer-heading"]');
        const p = document.querySelector('p');
        return {
          heading: el ? el.innerText : null,
          firstParagraph: p ? p.innerText : null,
          htmlSnapshot: document.documentElement.innerHTML.slice(0, 1000)
        };
      } catch (e) {
        return { error: e.message };
      }
    });

    // Read diagnostic variable exposed by the hook (if present)
    const windowPayload = await page.evaluate(() => {
      try {
        return window.__propfinder_last_response || null;
      } catch (e) {
        return { error: String(e) };
      }
    });

    if (windowPayload) {
      fs.writeFileSync(outResp, JSON.stringify(windowPayload, null, 2));
    }

    // save screenshot
    await page.screenshot({ path: outShot, fullPage: false });

    // write console and response files
    fs.writeFileSync(outConsole, consoleMessages.join('\n'));
    fs.writeFileSync(outResp, JSON.stringify(apiResponseBody, null, 2));

    console.log('\n--- HEADLESS CHECK SUMMARY ---');
    console.log('Saved screenshot:', outShot);
    console.log('Saved console log:', outConsole);
    console.log('Saved API response JSON:', outResp);
    console.log('Page stats sample:', statsText);

    if (apiResponseBody && apiResponseBody.data && Array.isArray(apiResponseBody.data.opportunities)) {
      console.log('API opportunities count:', apiResponseBody.data.opportunities.length);
    } else if (apiResponseBody && apiResponseBody.opportunities) {
      console.log('API opportunities count (root):', apiResponseBody.opportunities.length);
    } else {
      console.log('No JSON opportunities captured by headless script');
    }
  } catch (err) {
    console.error('Headless check failed:', err.message);
  } finally {
    await browser.close();
  }
})();
