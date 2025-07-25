# Components Directory

# Components Directory (Post-Consolidation)

This directory now contains only production-ready, deduplicated React UI components, organized by feature and domain.

- **All legacy, backup, and variant files have been removed or archived.**
- **Only canonical, universal, or mega components are exported from each folder's `index.ts`.**
- **Imports throughout the codebase must use only the new, consolidated exports.**

## Structure

- Subfolders group related components (e.g., `analytics/`, `betting/`, `ml/`, `prediction/`, etc.).
- Shared UI elements (buttons, cards, modals, etc.) are in `ui/`, `base/`, `shared/ui/`, or `common/`.
- Each major folder has an `index.ts` that exports only the canonical, production-ready components.
- All components are written in TypeScript/TSX unless otherwise noted.
- Test files are in `__tests__/` subfolders.

## Migration Guide

1. **Import only from the relevant `index.ts` files in each folder.**
2. **Do not import from legacy, backup, or variant files.**
3. **If you need a UI primitive, use the canonical export from `ui/`, `base/`, `shared/ui/`, or `common/`.**
4. **For feature or mega components, import from `features/` or `mega/`.**
5. **If you find a duplicate or legacy file, archive or delete it.**

## Best Practices

- Keep all exports in `index.ts` up to date with only the canonical components.
- Run tests after any major refactor or deduplication.
- Update this README and the migration guide as the structure evolves.
