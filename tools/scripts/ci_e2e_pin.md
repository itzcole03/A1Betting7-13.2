# CI snippet: pin Playwright to instrumented static/proxy server

This file documents the recommended steps used by the draft workflow `.github/workflows/e2e-pin-proxy.yml`.

Purpose

- Ensure Playwright hits the instrumented `serve-dist-fixed.cjs` proxy (so `frontend/test-results/proxy.log` collects API events) and avoid accidental Vite dev server origins during E2E runs.

Example (commands used by the workflow)

1. Build frontend (in CI):

```bash
cd frontend
npm ci
npm run build
```

2. Start the instrumented proxy on a reserved port (example: 5174):

```bash
cd frontend
# keep backgrounded in CI (nohup or similar)
nohup node scripts/serve-dist-fixed.cjs 5174 > ../frontend/test-results/serve-dist-fixed-5174.log 2>&1 &
```

3. Export the base URL for Playwright so global-setup and tests use it:

```bash
export E2E_FRONTEND_BASE_URL="http://127.0.0.1:5174"
```

4. Run Playwright (optionally restricted to a folder to debug):

```bash
# from repo root
cd frontend
# run an example single-folder run; adjust the grepFolder value as-needed
npx playwright test --project=chromium --grepFolder=prediction-filtering-Advan-88e5a-r-all-filters-functionality-chromium
```

Notes & best practices

- Reserve a port for CI that doesn't overlap with Vite (5173) or other services (example used: 5174).
- Ensure the proxy process logs to `frontend/test-results/serve-dist-fixed-<port>.log` and the proxy events are appended to `frontend/test-results/proxy.log` so the correlator can find them.
- In GitHub Actions, use `$GITHUB_ENV` to set `E2E_FRONTEND_BASE_URL` for subsequent steps.
- This snippet is intentionally minimal — adapt the Playwright invocation and test-folder selection for your CI layout.
