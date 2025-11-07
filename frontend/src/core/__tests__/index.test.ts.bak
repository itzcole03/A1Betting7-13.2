jest.mock('../UnifiedMonitor', () => ({
  UnifiedMonitor: class MockUnifiedMonitor {},
}));

jest.mock('../core', () => ({
  coreManifest: { version: 'test', surfaces: {} },
  FeatureComponent: () => null,
  MasterIntegrationProvider: ({ children }: { children?: unknown }) => children ?? null,
  useMasterIntegration: () => ({}),
}));

let coreEntry: typeof import('../index');

beforeAll(async () => {
  coreEntry = await import('../index');
});

const FORBIDDEN_EXPORTS = [
  'UnifiedBettingSystem',
  'createUnifiedBettingSystem',
  'UltimateBrain',
  'FinalPredictionEngine',
];

describe('core/index surface', () => {
  it('does not expose heavy facades via the barrel', () => {
    for (const forbidden of FORBIDDEN_EXPORTS) {
      expect(Object.prototype.hasOwnProperty.call(coreEntry, forbidden)).toBe(false);
    }
  });

  it('exposes curated helpers for downstream consumers', () => {
    expect(typeof coreEntry.createSystemErrorWithContext).toBe('function');
    expect(typeof coreEntry.ensureCanonicalError).toBe('function');
    expect(typeof coreEntry.coreManifest).toBe('object');
    expect(typeof coreEntry.UnifiedErrorHandler).toBe('function');
  });

  it('maintains access to lightweight primitives', () => {
    expect(typeof coreEntry.EventBus).toBe('function');
    expect(typeof coreEntry.UnifiedMonitor).toBe('function');
  });
});
