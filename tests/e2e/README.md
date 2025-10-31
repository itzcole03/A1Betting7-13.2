# End-to-End Tests (Playwright)

Short guide to run the repository E2E tests used by the team.

Environment variables

- `E2E_BASE_URL` - base URL of the running app (e.g. `http://127.0.0.1:5173`). If not set, `tests/e2e/playwright.config.ts` falls back to `http://localhost:3000`.
- `E2E_USE_MOCKS` - when set (truthy) the global-setup may spawn the mock server used by static tests.
- `E2E_MOCK_PORT` - port for the mock server (default configured in repo: 8010).

Run examples (bash)

Run a single focused spec with trace enabled (useful for triage):

```bash
cd c:/Users/bcmad/Downloads/A1Betting7-13.2
E2E_BASE_URL=http://127.0.0.1:5173 npx playwright test tests/e2e/matchup-analysis.spec.ts -c tests/e2e/playwright.config.ts --project=chromium --trace=on --workers=1
```

Run the full Chromium suite (single worker, deterministic):

```bash
E2E_BASE_URL=http://127.0.0.1:5173 npx playwright test -c tests/e2e/playwright.config.ts --project=chromium --workers=1
```

Run with the mock server enabled (global-setup will attempt to spawn it):

```bash
E2E_USE_MOCKS=1 E2E_MOCK_PORT=8010 E2E_BASE_URL=http://127.0.0.1:5173 npx playwright test -c tests/e2e/playwright.config.ts --project=chromium --workers=1
```

Artifacts

- Test artifacts (screenshots, videos, traces) are saved under `tests/e2e/test-results/` by default. Playwright's HTML report is generated into `tests/e2e/reports/html` when requested.

Troubleshooting

- If you see `page does not support tap` errors, ensure the project you run has `hasTouch` enabled in `tests/e2e/playwright.config.ts` or use a mobile project like `mobile-chrome`/`mobile-safari`.
- If tests time out waiting for selectors, try a focused run with `--debug` or capture a trace with `--trace=on`.

Contact

Open an issue in the repo or attach the generated trace.zip/screenshots from `tests/e2e/test-results/` when reporting flaky failures.
