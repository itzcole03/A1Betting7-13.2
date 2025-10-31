# Top Warnings Triage (pytest run)

Generated: 2025-10-29
Scope: Triage top warnings produced by the full pytest run. This file records the prioritized warnings, concrete explanation, recommended fixes, example locations from the test run, estimated effort, and suggested follow-up PRs.

## Summary (high-level)

- Full test run: 1368 passed, 7 skipped, 418 warnings.
- No failing tests present.
- Major warning types:
  1. session.execute() deprecation / SQLModel vs SQLAlchemy usage
  2. Pydantic deprecations (datetime.utcnow() usage; json_encoders deprecated)
  3. RuntimeWarnings: "coroutine ... was never awaited"
  4. Pytest config warnings (Unknown config option: `env`)
  5. Misc: Deprecations in third-party libs (httpx content API) and pytest warnings about asyncio marks on non-async tests

---

## 1) session.execute() deprecation / SQLModel vs SQLAlchemy

- Why it matters: SQLModel exposes `Session.exec()`/`AsyncSession.exec()` returning model objects directly. Many places in codebase still call `session.execute(...)` causing deprecation warnings and potential API confusion. Replacing `execute()` with `exec()` is safe only when the session is SQLModel's session type (or a wrapper that exposes `exec`). For raw SQLAlchemy AsyncSession, keep `execute()`.

- Example warnings from run:

  - `tests/backend/routes/test_odds_history_route_db_enabled.py` warns to use `session.exec()`.
  - `backend/services/odds_snapshot_service.py:49` warns for `await session.execute(text("DELETE FROM oddssnapshotrecord"))`.

- Recommended fix (conservative):

  1. Use the classifier output (tools/classify_session_execute_output.json) to pick files classified as SQLModel-only or clearly using `sqlmodel.AsyncSession` and replace `await session.execute(<select ...>)` with `await session.exec(<select ...>)`.
  2. For raw `text(...)` or DDL/DELETE statements (that call `execute(text(...))`), keep `execute()` because `exec()` may not be intended for ad-hoc SQL text — confirm the session object supports the pattern before change.
  3. For mixed files, inspect how `session` is obtained (import path) and only change when it's unambiguously SQLModel.

- Files to inspect first (low-risk):

  - `backend/services/odds_snapshot_service.py` (already contains exec in other places — inspect and convert consistent uses)
  - Any file marked SQLModel in `tools/classify_session_execute_output.json`.

- Estimated effort: 0.5–2 hours for a 4-file batch (includes local focused tests).

- Tests to run after changes: focused tests interacting with DB for altered modules (unit tests under `tests/backend/services` and route tests referencing the service).

---

## 2) Pydantic deprecations: `datetime.utcnow()` & `json_encoders`

- Why it matters: Pydantic v2 prefers timezone-aware datetimes and new serialization hooks; current code often uses `datetime.utcnow()` (naive UTC) and older `json_encoders` patterns.

- Example warnings from run:

  - Many tests show: `DeprecationWarning: datetime.datetime.utcnow() is deprecated... Use timezone-aware objects to represent datetimes in UTC`.
  - `pydantic._internal._generate_schema.py:298: PydanticDeprecatedSince20: 'json_encoders' is deprecated.`

- Recommended fix (conservative, phased):

  1. Add a small shared helper `backend/utils/safe_serialize.py` providing:
     - safe_now_utc() -> returns timezone-aware UTC datetime
     - safe_model_dump(obj) -> tries `model.model_dump()` falling back to `model.dict()` or `.dict()` shim if necessary (to keep compatibility until all code migrated)
  2. For model defaults/validators using `datetime.utcnow()`, replace with `safe_now_utc()` (fast PRs in batches of 4–6 files).
  3. Audit uses of `json_encoders` and adopt Pydantic v2 serialization hooks where needed, or wrap them behind the helper.

- Files likely impacted (search results needed):

  - backend models, tests creating model instances with default timestamps.

- Estimated effort: 1–3 days (for conservative, well-tested migration across codebase); start with a small batch and unit tests.

---

## 3) RuntimeWarnings: "coroutine 'X' was never awaited"

- Why it matters: These often point to background tasks, mocked coroutines, or middleware that return coroutines but are used without awaiting — they can leak resources or hide bugs.

- Examples from run:

  - `tests/ingestion/test_nba_ingestion_pipeline.py` shows `AsyncMockMixin._execute_mock_call` coroutine never awaited.
  - `tests/security/test_security_headers_core.py` shows `SecurityHeadersMiddleware.dispatch` was never awaited when invoked synchronously in tests.
  - `backend/services/cache_instrumentation.py` background periodic cleanup coroutine not awaited in test-run context.

- Recommended fix (targeted per-case):

  1. For AsyncMock stubs in tests: ensure their mocked methods are async mocks (use `AsyncMock`) and that tests `await` calls where needed; adjust test helper mixins to `await` or explicitly close/unawait when test intends to run sync.
  2. For middleware dispatch tests: when invoking middleware directly in unit tests, ensure `await middleware.dispatch(...)` is used, or call the sync wrapper if testing the sync path.
  3. For background coroutines started by classes (e.g., periodic cleanup): make test setups provide an event loop or mock the background-start logic to avoid launching coroutines during import/test collection.

- Files/areas to inspect first:

  - `tests/ingestion/conftest.py` & `tests/ingestion/test_nba_ingestion_pipeline.py`
  - `tests/security/test_security_headers_core.py`
  - `backend/services/cache_instrumentation.py`

- Estimated effort: 0.5–2 days triage and small fixes across tests.

---

## 4) Pytest config warning: Unknown config option: `env`

- Why it matters: Pytest reports an unknown config option; it's harmless but noisy and may mask misconfiguration.

- Recommended fix:

  1. Inspect `pytest.ini`, `pyproject.toml`, or other pytest config files for an `env` key. If `env` was meant for another tool (tox, or pytest-env plugin), move it to the appropriate plugin config or install/enable the plugin. Alternatively remove or move the key.

- Files to inspect: repository root `pytest.ini` or `pyproject.toml`.

- Estimated effort: 15–30 minutes.

---

## 5) Misc / other warnings

- `httpx` deprecation (use `content=` for raw bytes/text) — update test invocations that call `httpx` request building directly.
- `pytest` warns about `@pytest.mark.asyncio` on tests that are not async — remove the mark on those tests (found in test run).

---

## Suggested follow-up plan (concrete)

1. Create small PRs (4–6 files) per category. Priority order:
   - Fix pytest config `env` (quick win)
   - session.execute -> exec safe batch for SQLModel-typed modules (low-risk)
   - Fix top coroutine warnings in tests (ingestion and security middleware tests)
   - Add `backend/utils/safe_serialize.py` and start Pydantic UTC fixes in models with tests
2. For each PR:
   - Keep changes small and focused (1-4 files)
   - Add focused unit tests (or run existing targeted tests) before full pytest
   - Run `pytest -q tests/<affected_module>` locally, then run full test suite
3. CI: add a lightweight lint job to fail on new `session.execute(` in production modules or new `.dict()` usage without a `# ok:legacy-dict` comment (optional rule to avoid false positives)

---

## Example quick commands to run locally

```bash
# run the tests that showed the coroutine warnings
pytest -q tests/ingestion/test_nba_ingestion_pipeline.py -q
pytest -q tests/security/test_security_headers_core.py -q

# run focused DB tests for odds_snapshot_service after a change
pytest -q tests/backend/services/test_odds_snapshot_flag_flow.py -q
```

---

## Artifacts created by this triage

- `tools/triage/top_warnings_report.md` (this file) — a prioritized triage and actionable steps
- Suggested immediate PRs:
  - PR-1: `chore/fix-pytest-config-env` — adjust pytest config to remove/relocate `env` key (15–30m)
  - PR-2: `chore/exec-sweep-batch-1` — safe execute->exec replacements in 4 SQLModel files (0.5–2h plus test runs)
  - PR-3: `chore/fix-await-warnings` — ensure AsyncMock and middleware tests await coroutines (1–2 days)
  - PR-4: `feat/safe-serialize` — add `backend/utils/safe_serialize.py` and migrate 4 model usages (1–2 days)

If you want, I can prepare PR-1 now (quick) and/or PR-2 (select 4 safe files from the classifier output and create the patch + run focused tests). Tell me which PR to start first.

---

## Closing notes

If you want I can also open a small
