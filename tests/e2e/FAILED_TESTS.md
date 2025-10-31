# Failing / Flaky E2E Tests (collected)

This file is an index of failing or flaky end-to-end tests observed during runs. Use this to triage and create issues with artifacts.

Recent failures (see `tests/e2e/test-results/` for screenshots, videos, traces):

- Matchup Analysis suite

  - Symptoms: missing <select> elements, select.selectOption failing with "options[0].label: expected string, got object", unexpected page heading like "PropFinder🎯LIVE" instead of route title.
  - Suggested fixes: make `tests/e2e/utils/pageObjects.ts` tolerant of custom dropdowns (done); ensure mock server returns expected player names; add longer waits or explicit API wait.

- Navigation flows

  - Symptoms: timeouts during navigation, `net::ERR_ADDRESS_IN_USE`, page/context closed errors.
  - Suggested fixes: check for leftover mock/static servers binding ports, restart dev server, run single-worker runs, and capture trace.zip.

- Mobile / Tap interactions
  - Symptoms: "The page does not support tap. Use hasTouch context option to enable touch support." on some projects.
  - Suggested fixes: enable hasTouch for desktop projects where appropriate (we added hasTouch=true to desktop projects in config).

Next steps:

1. Re-run targeted failing spec with `--trace=on` to capture network and DOM timeline.
2. Attach trace.zip and a screenshot to the issue created for the failing test.
3. If failures are due to mock payload mismatches, update `frontend/tests/e2e/mock-server.cjs` or the static stub.
