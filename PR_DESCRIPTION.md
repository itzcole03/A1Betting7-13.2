# PR title

feat(legacy): opt-in deprecation hints for legacy health aliases (LEGACY_DEPRECATION_HINTS)

# PR description

## Summary

This PR introduces an opt-in environment variable, `LEGACY_DEPRECATION_HINTS`, that controls whether the legacy middleware includes deprecation metadata (`data.deprecated` and `data.forward`) in health alias responses (`/api/health`, `/health`, `/api/v2/health`). By default the middleware preserves the canonical envelope (no `deprecated`/`forward` keys). Enabling the flag allows emitting migration hints for legacy clients.

## Why

The repository previously had conflicting test expectations: most tests expect identical canonical envelopes across health aliases while one test expects a deprecation hint. Making hints opt-in preserves canonical behavior by default and allows targeted environments or tests to opt in.

## What changed

- `backend/middleware/legacy_middleware.py` — gated deprecation metadata injection on `LEGACY_DEPRECATION_HINTS` (truthy values: "1","true","yes"). Applied to early short-circuit, normalization, and final enforcement paths.
- `tests/backend/test_health_endpoints.py` — `test_legacy_health_endpoint_deprecated` temporarily enables `LEGACY_DEPRECATION_HINTS` for that test only so it can assert the deprecation fields without affecting other tests.
- `tests/backend/test_legacy_middleware_deprecation_flag.py` (new) — two tests: flag disabled -> canonical envelope; flag enabled -> deprecated/forward present.
- `docs/LEGACY_DEPRECATION_HINTS.md` (new) — short doc describing the flag, usage, and motivation.
- `CHANGELOG.md` — added unreleased entry describing the opt-in behavior and tests/docs added.

## Testing & verification

- New middleware tests: pass.
- Full test suite: pass locally (1352 passed, 7 skipped when run in the environment used for validation).

## Rollout notes

- Default behavior unchanged; enabling the flag is reversible.
- To enable hints in a given environment, set `LEGACY_DEPRECATION_HINTS=1` in config/CI.

## Suggested next steps (commands to run locally)

```bash
# create branch (if not already on it)
git checkout -b chore/shims-quickcheck

# review changes
git status
git diff

# commit and push
git add -A
git commit -m "feat(legacy): add opt-in LEGACY_DEPRECATION_HINTS for health aliases; tests/docs"
git push -u origin chore/shims-quickcheck

# open PR using GitHub CLI (optional)
gh pr create --fill --base main --head chore/shims-quickcheck
```

If you prefer, paste the PR body above into GitHub's web UI when creating the PR.
