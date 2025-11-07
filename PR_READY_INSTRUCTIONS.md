PR: refactor/phase-2-consolidation — Ready-to-Push Instructions

## Summary

This branch contains the consolidation edits and a few small compatibility shims to keep the repo testable while we progressively remove legacy code. All backend tests pass locally (1377 passed, 7 skipped). Before opening a PR you'll likely want to run the frontend checks in your environment and/or CI.

## Recommended local push + PR workflow

Run these commands from the repo root (Windows/Bash shell):

```bash
# Ensure you're on the target branch
git checkout refactor/phase-2-consolidation

# Stage any remaining local changes (if you made more edits)
git add -A

git commit -m "refactor: consolidate data services (phase-2) + compat shims" || echo "No changes to commit"

# Push the branch to origin
git push origin refactor/phase-2-consolidation

# Create a draft PR with the GitHub CLI (optional reviewers and assignees)
# Replace <ORG/REPO> with the remote repo if necessary. If you have permissions, this will open a PR in draft mode.

# Create draft PR
gh pr create --title "refactor: consolidation (phase-2)" \
  --body-file PR_DRAFT_refactor_phase-2_consolidation.md \
  --head refactor/phase-2-consolidation \
  --base main \
  --draft

# If you want the PR ready for review instead of draft, remove --draft
# and optionally add reviewers: --reviewer alice,bob
```

## What to run locally before opening the PR (recommended)

- Run the frontend type-check (from repo root):

```bash
cd frontend
npm ci
npm run type-check
npm test        # optional, slower
cd -
```

- Re-run backend tests or targeted clusters if you made further edits:

```bash
pytest -q
# or a focused test group
pytest tests/backend/routes/test_auth_routes.py -q
```

## Notes & PR guidance

- The PR draft file `PR_DRAFT_refactor_phase-2_consolidation.md` is included in the repo root and contains: summary, test results, risk notes, and a suggested checklist.
- Consider marking the PR as draft initially so maintainers can review the shim approach (especially the `exec` shim in `backend/services/auth_service.py`).
- If CI runs linters (ruff/mypy/eslint), address those failures in followup commits. I can help prepare fixes for lint warnings if you want me to run them locally and iterate.

If you'd like I can:

- Attempt to run the `gh pr create` command from here (I will try but may need your local GH auth), or
- Prepare a small follow-up patch to remove/rename any leftover `*.bak` files matching a given pattern, or
- Run linters (ruff/flake8/mypy) and propose fixes for warnings.

Tell me which of the above (open PR, run linters, or .bak cleanup) you want me to do next and I will proceed.
