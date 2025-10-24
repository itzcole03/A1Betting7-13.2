# Shims priority for stabilizing frontend imports

Top priorities:

1. GuardedImport (ensure optional dynamic imports never crash the app)
2. UnifiedCache (in-memory fallback for cache consumers)
3. UnifiedLogger (consistent logging API for dev and prod)

CI checks to add:

- unified_shims smoke runner (fails on missing basic APIs)
- type-check of the `frontend/src/core` folder

When opening PRs that touch core shims, keep changes small and add a smoke test that proves the shim works in isolation.
