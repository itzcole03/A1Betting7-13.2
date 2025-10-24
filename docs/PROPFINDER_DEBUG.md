PropFinder Debug & Repro Guide

Purpose
-------
Quick reference to reproduce and debug PropFinder dashboard issues locally. Includes steps to surface the dashboard when app gating prevents it, how to inspect the debug globals the hook exposes, and how to run the headless capture script.

Symptoms
--------
- Dashboard shows "No opportunities match your current filters" and UI summary shows "Showing 0 of 0 opportunities (server total 0)" while you expect items.

Root causes (most common)
-------------------------
1. App gating (auth/onboarding) prevents the dashboard component from mounting, so the client never fetches data from the backend.
2. Active client-side filters or search query filtered out all server opportunities.
3. Backend is down or mis-configured (less common in local dev when backend is running). Use health checks to confirm.

Quick repro (dev)
------------------
1. Start frontend dev server (from repo root):

```pwsh
cd frontend
npm run dev
```

2. If you can't see the dashboard because the app is showing onboarding or auth pages, use the development convenience button:
- In development builds (Vite), a small "View Dashboard (Dev)" button appears in the bottom-right of the page.
- Click it to set minimal demo localStorage keys (token, user, onboardingComplete) and reload the app. This is non-production and only visible in development.

3. After the dashboard mounts, open the PropFinder Debug panel in the bottom-left (DEV-only). It shows:
- Last fetch status (ok/status/server_total)
- Last stats (summary returned by backend)
- Buttons: Re-fetch, Reload

Why this helps: the hook `usePropFinderData` exposes the last request URL and last response on the `window` object for dev debugging: `window.__propfinder_last_request_url`, `window.__propfinder_last_response`, `window.__propfinder_last_stats`, `window.__propfinder_last_fetch_status`.

Headless capture script
-----------------------
A helper script is provided to reproduce and capture the app's runtime fetch and debug globals automatically.

- Script path: `scripts/headless_capture.js`
- Usage (example):

```pwsh
node scripts/headless_capture.js --url http://localhost:5173/propfinder --headless=false --wait-for-network 5000
```

What it does:
- Injects demo localStorage keys (token, user, onboardingComplete) before navigating to the SPA (so the dashboard mounts even if auth gating is active).
- Navigates to the provided URL and waits for network activity.
- Captures the PropFinder API response and prints the last debug globals and payload to STDOUT for inspection.

Backend checks
--------------
If the dashboard still shows 0 even after forcing the dashboard to mount:
1. Verify backend health: http://127.0.0.1:8000/health (or the API_BASE_URL from `frontend/src/config/apiConfig.ts`).
2. Start the backend (repo root):

```pwsh
# Run backend FastAPI server (task provided in VS Code)
# or run directly:
python -m uvicorn backend.core.app:create_app --factory --host 127.0.0.1 --port 8000 --reload
```

3. Re-run the headless capture or use the Dev PropFinder Debug panel's Re-fetch button.

How to revert dev-only changes
-----------------------------
- The View Dashboard button and the PropFinder Debug panel are guarded behind `import.meta.env.DEV` and are development-only.
- To remove both, revert the changes in `frontend/src/App.tsx` where the Dev UI components were added. To keep them but hide them, ensure `VITE_API_BASE_URL` and env flags don't set `import.meta.env.DEV` (not recommended).

Notes & recommendations
-----------------------
- Keep the headless script and the dev debug panel as temporary developer tooling; they are low-risk and significantly speed up debugging gating issues.
- If product wants end-users to more clearly understand why a dashboard is empty, consider adding a small UX hint when `server_total > 0` but `filteredOpportunities.length === 0` telling users to clear filters or check onboarding/auth status.

Contact
-------
If you want, I can open a PR with this doc and optionally revert the dev UI changes. Tell me which you'd prefer.