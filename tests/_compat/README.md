tests/\_compat — Test-only compatibility shims

## Purpose

This directory centralizes minimal, import-time-safe shim implementations used
by the test-suite and by archived/legacy modules that would otherwise import
heavy optional dependencies at module import time.

## Why these exist

- Many legacy modules import ML or heavy dependencies (torch, geometric, LLM
  clients) at import time. That makes pytest collection and lightweight
  runs brittle in CI or on developer machines without those deps.
- These shims provide tiny, deterministic placeholders for those modules so
  tests and import-scans can run reliably.

## What lives here

- `llm_engine.py` — minimal LLM placeholder exposing `llm_engine` with an
  async `generate()` coroutine.
- `prediction_utils.py` — tiny prediction utility helpers (score, normalize,
  confidence heuristics) for import-time usage in archived code.
- `torch/` — a tiny, non-numeric placeholder providing `Tensor`, `tensor()`,
  a minimal `nn` namespace and a light `geometric` placeholder.
- `testing_compat_shims_minimal.py` — a small FastAPI router that provides a
  deterministic subset of PropFinder endpoints used by integration tests and
  Playwright flows.

## Rollback / removal instructions

If you want to remove these shims and restore the original implementations,
follow these steps:

1. Run the test-suite locally and ensure there's a branch with the current
   shims saved. Example:

   git checkout -b remove-test-shims

2. Replace the re-export wrapper modules in the project root with the
   original module body (or delete the wrappers if the original packages
   are available in your environment). Files to restore:

   - `utils/llm_engine.py`
   - `utils/prediction_utils.py`
   - `torch/__init__.py`

   If you previously only updated these files to re-export from
   `tests/_compat`, revert those changes (e.g. via `git checkout -- <file>`)
   or restore from the upstream branch.

3. Remove the `tests/_compat` directory and commit the change.

4. Run the full pytest suite. If failures appear, diagnose missing optional
   dependencies or add per-test skip markers until replacements are added.

## Notes and rationale

full behavior of the real libraries. They exist solely to keep import-time
behavior deterministic during testing.
re-exports to make the change reversible and low-risk. The wrappers include
small fallbacks to remain import-safe if `tests/_compat` is not present.

## CI guard

This repo includes a small CI guard that runs `tools/check_shims.py` on PRs
and pushes to ensure heavy optional libraries (torch, tensorflow, ray,
torch_geometric) are not imported at module import time outside of
`tests/_compat`. The workflow lives at `.github/workflows/shims-guard.yml`.

If you intentionally need a heavy import at module-level, add an explicit
exception in `tools/check_shims.py` or move the import to a runtime (function)
scope, or place a tiny shim under `tests/_compat` and re-export from a
lightweight wrapper.

## Contact / owner

If you want these removed or replaced with fuller-featured mocks, contact the
repo owner or the feature lead and include a test-plan that covers the
critical integration tests (PropFinder endpoints, LLM usage paths, and any
code that uses `torch.geometric`).
