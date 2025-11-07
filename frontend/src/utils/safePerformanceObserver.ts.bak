/**
 * Safe PerformanceObserver utilities
 * - Guards against unsupported entry types
 * - Silences noisy warnings in older browsers/environments
 */

type EntryType =
  | 'longtask'
  | 'layout-shift'
  | 'first-input'
  | 'largest-contentful-paint'
  | 'paint'
  | 'navigation'
  | 'resource'
  | 'measure';

const SUPPORTED_TYPES: EntryType[] = [
  'longtask',
  'layout-shift',
  'first-input',
  'largest-contentful-paint',
  'paint',
  'navigation',
  'resource',
  'measure',
];

export function safeObserve(
  entryTypes: EntryType[] | ReadonlyArray<EntryType>,
  callback: PerformanceObserverCallback
): PerformanceObserver | null {
  if (typeof window === 'undefined') return null;
  if (!('PerformanceObserver' in window)) return null;

  // Filter to supported types only
  const filtered = entryTypes.filter((t) => SUPPORTED_TYPES.includes(t));
  if (filtered.length === 0) return null;

  try {
    const obs = new PerformanceObserver(callback);
    obs.observe({ entryTypes: filtered as PerformanceObserverInit['entryTypes'] });
    return obs;
  } catch {
    // Quietly ignore unsupported combinations
    return null;
  }
}

export function disconnectObserver(obs: PerformanceObserver | null | undefined): void {
  try {
    obs?.disconnect();
  } catch {
    // no-op
  }
}
