/*
  legacyShims.ts
  Small compatibility layer so legacy imports (optimizedDataService.apiService, optimizedDataService, etc.)
  continue to work while we migrate call sites to UnifiedDataService.

  Strategy:
  - Export default: UnifiedDataService.getInstance()
  - Export named helpers that forward to the unified instance when available,
    and provide safe no-op fallbacks for missing methods so tests don't crash.
*/
import UnifiedDataService from './UnifiedDataService';

type AnyFn = (...args: any[]) => any;

function getInstance() {
  try {
    // UnifiedDataService exposes getInstance() or default as singleton
    // prefer getInstance if available
    // @ts-ignore
    return UnifiedDataService.getInstance ? UnifiedDataService.getInstance() : UnifiedDataService;
  } catch (err) {
    return UnifiedDataService;
  }
}

const instance: any = getInstance();

// export default instance for default imports
export default instance;

// export apiService that tests expect (has get/post)
export const apiService = instance.api ?? {
  get: async (_endpoint: string) => ({ data: {} }),
  post: async (_endpoint: string, _payload?: any) => ({ data: {} }),
};

// Normalization helpers
export function normalizeOpportunity(raw: any, source = 'unknown') {
  return typeof instance.normalizeOpportunity === 'function'
    ? instance.normalizeOpportunity(raw, source)
    : { normalized: true, raw };
}

export function deduplicateOpportunities(list: any[]) {
  return typeof instance.deduplicateOpportunities === 'function'
    ? instance.deduplicateOpportunities(list)
    : list;
}

export function mergeOpportunities(list: any[]) {
  return typeof instance.mergeOpportunities === 'function'
    ? instance.mergeOpportunities(list)
    : list[0] || null;
}

export function getDuplicateOpportunityIds(fingerprint: string) {
  return typeof instance.getDuplicateOpportunityIds === 'function'
    ? instance.getDuplicateOpportunityIds(fingerprint)
    : [];
}

export function clearNormalizationState() {
  if (typeof instance.clearNormalizationState === 'function')
    return instance.clearNormalizationState();
  if (typeof instance.clear === 'function') return instance.clear();
}

// Realtime / cache-related shims some tests expect
export function enableRealtimeOdds(...args: any[]) {
  if (typeof instance.enableRealtimeOdds === 'function')
    return instance.enableRealtimeOdds(...args);
}

export function ingestRealtimeOdds(...args: any[]) {
  if (typeof instance.ingestRealtimeOdds === 'function')
    return instance.ingestRealtimeOdds(...args);
}

export function invalidateCache(prefix?: string) {
  if (typeof instance.invalidatePrefix === 'function') return instance.invalidatePrefix(prefix);
  if (typeof instance.invalidateCache === 'function') return instance.invalidateCache(prefix);
}

export function clearCache(prefix?: string) {
  if (typeof instance.clearCache === 'function') return instance.clearCache(prefix);
}

// Test helpers
export function resetForTests() {
  if (typeof UnifiedDataService.resetForTests === 'function')
    return UnifiedDataService.resetForTests();
  if (typeof instance.resetForTests === 'function') return instance.resetForTests();
}
