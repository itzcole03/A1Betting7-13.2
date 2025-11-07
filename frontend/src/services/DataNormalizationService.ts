/*
  DataNormalizationService — thin wrapper forwarding to unified shim

  This preserves the original module path while delegating the
  implementation to `legacyShims`, enabling incremental migration and
  keeping tests and call-sites stable.
*/
import legacy from './unified/legacyShims';

const norm = {
  normalizeOpportunity: (...args: any[]) => (legacy as any).normalizeOpportunity?.(...args),
  deduplicateOpportunities: (...args: any[]) => (legacy as any).deduplicateOpportunities?.(...args),
  mergeOpportunities: (...args: any[]) => (legacy as any).mergeOpportunities?.(...args),
  getDuplicates: (...args: any[]) => (legacy as any).getDuplicateOpportunityIds?.(...args),
  clearCache: (...args: any[]) => (legacy as any).clearNormalizationState?.(...args),
};

export default norm;

export function getDataNormalizationService() {
  return norm;
}

export const dataNormalizationService = getDataNormalizationService();
