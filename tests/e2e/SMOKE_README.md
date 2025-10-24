Puppeteer smoke script

This repo includes a lightweight Puppeteer-based smoke script that loads the PropFinder dashboard and captures the API response.

Usage (local dev server must be running):

Windows PowerShell

```powershell
$env:FRONTEND_URL='http://127.0.0.1:5173'
node scripts/headless_capture.js
```

Or via npm script from repo root:

```powershell
npm run smoke:puppeteer
```

To save output to file:

```powershell
$env:FRONTEND_URL='http://127.0.0.1:5173'
node scripts/headless_capture.js > tests/e2e/reports/smoke.json
```

Notes:
- The script will inject a minimal localStorage token/user by default so the SPA boots into the dashboard. Use --skip-inject to avoid storing localStorage.
- Output is a JSON object with keys: frontend_url, api_captured_status, api_captured_body, debug_globals, direct_fetch, console_logs, page_errors.
