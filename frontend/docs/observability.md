# Observability and Performance Instrumentation

This project centralizes performance observation and reliability monitoring to reduce console noise, avoid deprecated API usage, and ensure idempotent initialization under React StrictMode/HMR.

## Safe Performance Observer Wrapper

All direct `new PerformanceObserver(...)` usage is consolidated in `src/utils/safePerformanceObserver.ts`.

- `safeObserve(entryTypes, callback)`: Filters unsupported entry types and gracefully no-ops in SSR/JSDOM/older browsers. Returns a `PerformanceObserver | null`.
- `disconnectObserver(observer)`: Safely disconnects an observer; idempotent and guards thrown errors.

Usage:

```ts
import { safeObserve, disconnectObserver } from '@/utils/safePerformanceObserver';

const obs = safeObserve(['layout-shift', 'longtask'], (list) => {
  // handle entries
});

// later
disconnectObserver(obs);
```

Verification:

- Unit tests: `src/utils/__tests__/safePerformanceObserver.test.ts`
- Code scan: Only one `new PerformanceObserver` call exists (in the wrapper)

## Reliability Orchestrator

`bootstrapApp.ts` initializes reliability monitoring once and now emits a one-time log when started:

- Message: `🛡️ Reliability monitoring started (bootstrap)`
- Suppressed in `NODE_ENV=test` to keep CI output clean

See `src/bootstrap/bootstrapApp.ts` and tests in `src/bootstrap/__tests__/bootstrapApp.test.ts`.

## Web Vitals

Use `webVitalsService.init()` for core web vitals; it is idempotent and integrates with deduplication logic to avoid duplicate LCP/CLS/INP/TTFB events.
