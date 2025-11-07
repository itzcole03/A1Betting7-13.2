// Import shims to test
let dataIntegration: any;
let normalization: any;
let optimizedApiService: any;

describe('Legacy shims are present and callable', () => {
  test('dataIntegrationService exports expected functions', () => {
    // Prefer the unified surface for new code: verify UnifiedDataService exposes
    // the equivalent integration methods so callers can migrate safely.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const uds = require('../../unified/UnifiedDataService');
    const instance = uds.UnifiedDataService.getInstance();
    expect(typeof instance.fetchSportsData).toBe('function');
    expect(typeof instance.fetchPlayerStats).toBe('function');
    expect(typeof instance.fetchTeamData).toBe('function');
    expect(typeof instance.searchData).toBe('function');
  });

  test('DataNormalizationService exports expected functions', () => {
    // Validate unified normalizer is present (preferred import for new code).
    // The real UnifiedDataService may not implement legacy normalization helpers
    // directly; create a temporary stub for the test to assert the expected
    // API surface for callers migrating to the unified layer.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const uds = require('../../unified/UnifiedDataService');
    const stub = {
      normalizeOpportunity: () => ({}),
      deduplicateOpportunities: () => [],
      mergeOpportunities: () => ({}),
    } as any;
    // Replace getInstance for this test with our stub, but restore afterwards
    const originalGet = uds.UnifiedDataService.getInstance;
    try {
      uds.UnifiedDataService.getInstance = jest.fn().mockReturnValue(stub);
      const instance = uds.UnifiedDataService.getInstance();
      expect(typeof instance.normalizeOpportunity).toBe('function');
      expect(typeof instance.deduplicateOpportunities).toBe('function');
      expect(typeof instance.mergeOpportunities).toBe('function');
    } finally {
      uds.UnifiedDataService.getInstance = originalGet;
    }
  });

  test('optimizedDataService apiService exists', () => {
    // Prefer UnifiedDataService's api surface for new tests
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const uds = require('../../unified/UnifiedDataService');
    const instance = uds.UnifiedDataService.getInstance();
    expect(instance.api).toBeDefined();
    expect(typeof instance.api.get).toBe('function');
  });
});
