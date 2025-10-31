# Draft PR: chore/tests-normalize-mixed-imports

Summary
-------
- Implemented a conservative detector for tests mixing CommonJS `require()` and ESM `import` (artifacts and suggestions are under `tools/suggestions/`).
- Added discoverable test wrappers so Jest can collect per-test coverage for ignored directories.
- Ran per-test targeted coverage for a set of detector candidates and collected coverage artifacts under `frontend/coverage/targeted/` and the consolidated `frontend/coverage/targeted/pr-ready/` folder.

Files added in this change
-------------------------
- `frontend/src/tests/targeted/PropOllama_UI.coverage.test.tsx` — wrapper that imports the existing UI test at `src/components/user-friendly/__tests__/PropOllama.test.tsx` so Jest will discover and execute it under coverage.
- `frontend/src/tests/targeted/PropOllama_Services.coverage.test.tsx` — wrapper that imports the existing service test at `src/services/__tests__/PropOllama.test.tsx`.

Targeted coverage artifacts (attached)
--------------------------------------
The following coverage-final.json files were collected and placed into `frontend/coverage/targeted/pr-ready/`:

- coverage-final-PlayerDashboardContainer.json
- coverage-final-PropOllama_Service.json
- coverage-final-PropOllama_UI.json
- coverage-final-PropOllamaService.json
- coverage-final-SocialSentimentAdapter.json

Notes / explanation
-------------------
- The detector script (CommonJS `.cjs` under `tools/`) emits suggestion artifacts for ambiguous fixes and applies safe single-line transformations where possible.
- Some component tests live in directories ignored by Jest `testPathIgnorePatterns`. Wrappers in `frontend/src/tests/targeted/` import those original test files — this preserves the original tests (no content changed) while allowing targeted coverage runs and producing per-test coverage artifacts.
- I did not commit the coverage output files into source control — the consolidated `pr-ready` folder lives in the workspace for PR attachment. If you want the artifacts committed to the branch, tell me and I'll add them (but they are large).

Suggested reviewer checklist
---------------------------
1. Review `tools/suggestions/` artifacts for further auto-fix guidance.
2. Inspect the wrappers in `frontend/src/tests/targeted/` (they only import existing tests). If you'd rather run the original tests directly in CI, we can relax `testPathIgnorePatterns` or move discovered tests.
3. Download and inspect the `coverage-final-*.json` artifacts in `frontend/coverage/targeted/pr-ready/` for per-test coverage deltas.

Next steps I can take (pick one or let me proceed):
- Create a small commit that adds a README entry describing the detector and wrapper approach.
- Attempt to open a draft GitHub PR from this branch automatically (requires `gh` CLI access).
- Run a second pass of the detector and create additional wrappers for other ignored tests.

Signed-off-by: test-automation-bot
