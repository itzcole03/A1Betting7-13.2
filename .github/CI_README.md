# Codemod + Tests CI

This repository includes a conservative codemod and a CI job that runs on pull requests.

What the workflow does

- Runs a dry-run of the conservative UTC codemod (prints diffs if any) so reviewers can see proposed timezone-aware changes.
- Runs the full pytest suite to validate no regressions are introduced.

Why this is safe

- The codemod is conservative and uses a skip list for high-risk files. The CI runs it in dry-run mode only. Apply steps are gated to human review.

How to use locally

1. Dry-run the codemod locally:

```bash
python tools/replace_utc_ast_codemod.py --dry-run backend
```

2. Apply the codemod for a safe batch (creates .bak backups):

```bash
python tools/replace_utc_ast_codemod.py --apply backend
```

3. Run tests locally before pushing:

```bash
python -m pytest -q
```

CI notes

- The workflow is intentionally permissive when installing dependencies (best-effort). If your project has a specific dev environment (Poetry, pipenv), update the workflow to use that setup step.

If you'd like a stricter CI (fail when codemod would change files), I can add a follow-up job that fails when the codemod reports candidates.
