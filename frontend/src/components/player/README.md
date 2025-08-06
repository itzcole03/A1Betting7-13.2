# Player Dashboard Modular Components

## Loading & Accessibility Contract

All modular dashboard sections (`PlayerOverview`, `PlayerStatTrends`, `PlayerPropHistory`) support a `loading` prop and implement a section-specific skeleton loader. The contract is as follows:

- When `loading` is `true` (or no data is available), the component renders a visually distinct skeleton loader.
- Each skeleton loader uses `aria-busy='true'` and a descriptive `aria-label` for accessibility.
- The main dashboard container sets `aria-busy` and `aria-live` to ensure assistive technology announces loading state changes.
- All sections are always rendered, so layout does not shift during loading.
- After loading, the full interactive UI is accessible by keyboard and screen reader.

## Example Usage

```tsx
<PlayerOverview player={player} loading={loading} />
<PlayerStatTrends player={player} loading={loading} />
<PlayerPropHistory player={player} loading={loading} />
```

## Accessibility Checklist

- [x] Skeletons use `aria-busy` and `aria-label`.
- [x] Main content region uses `aria-busy` and `aria-live`.
- [x] No layout shift between loading and loaded states.
- [x] Keyboard and screen reader navigation supported after load.

---

_Last updated: 2025-08-06 by Copilot Agent_
