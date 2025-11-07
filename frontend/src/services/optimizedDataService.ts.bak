/*
  optimizedDataService.ts — compatibility wrapper

  This file used to contain a full optimized implementation. To
  centralize migration to `UnifiedDataService` while keeping file
  locations stable for imports, we forward the legacy module
  surface to the `legacyShims` adapter.
*/
import legacy from './unified/legacyShims';

export const optimizedDataService = legacy;

// Re-export the optimized API surface if callers import `apiService`
export const apiService = (legacy as any).apiService ?? (legacy as any).api ?? undefined;

export default optimizedDataService;
