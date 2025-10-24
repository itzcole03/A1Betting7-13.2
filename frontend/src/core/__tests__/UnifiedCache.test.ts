type MockManager = {
  set: jest.Mock<void, [string, string, unknown, number?]>;
  get: jest.Mock<unknown | null, [string, string]>;
  remove: jest.Mock<boolean, [string, string]>;
  clear: jest.Mock<void, [string?]>;
  has: jest.Mock<boolean, [string, string]>;
};

jest.mock('../../services/ConsolidatedCacheManager', () => {
  const manager: MockManager = {
    set: jest.fn<void, [string, string, unknown, number?]>(),
    get: jest.fn<unknown | null, [string, string]>(),
    remove: jest.fn<boolean, [string, string]>(),
    clear: jest.fn<void, [string?]>(),
    has: jest.fn<boolean, [string, string]>(),
  };

  const cacheSet = jest.fn((category: string, key: string, value: unknown, ttl?: number) => {
    manager.set(category, key, value, ttl);
  });

  const cacheGet = jest.fn((category: string, key: string) => {
    return manager.get(category, key);
  });

  const cacheRemove = jest.fn((category: string, key: string) => {
    return manager.remove(category, key);
  });

  const cacheClear = jest.fn((category?: string) => {
    manager.clear(category);
  });

  return {
    __esModule: true as const,
    CacheCategory: {
      API_RESPONSES: 'api_responses',
      ANALYSIS: 'analysis',
      PREDICTIONS: 'predictions',
    },
    ConsolidatedCacheManager: jest.fn(),
    cacheSet,
    cacheGet,
    cacheRemove,
    cacheClear,
    getCacheManager: jest.fn(() => manager),
    __mockManager: manager,
  };
});

describe('UnifiedCache facade', () => {
  const canonical = jest.requireMock('../../services/ConsolidatedCacheManager');
  const legacy = jest.requireActual('../UnifiedCache/index');
  const moduleUnderTest = jest.requireActual('../UnifiedCache');

  const {
    CacheCategory,
    cacheSet,
    cacheGet,
    cacheRemove,
    cacheClear,
    set,
    get,
    remove,
    del,
    clear,
    has,
    getInstance,
    default: defaultExport,
  } = moduleUnderTest;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('re-exports the canonical helpers directly', () => {
    expect(CacheCategory).toBe(canonical.CacheCategory);
    expect(set).toBe(canonical.cacheSet);
    expect(cacheSet).toBe(canonical.cacheSet);
    expect(get).toBe(canonical.cacheGet);
    expect(cacheGet).toBe(canonical.cacheGet);
    expect(remove).toBe(canonical.cacheRemove);
    expect(cacheRemove).toBe(canonical.cacheRemove);
    expect(clear).toBe(canonical.cacheClear);
    expect(cacheClear).toBe(canonical.cacheClear);
  });

  it('delegates has() through the canonical cache manager', () => {
    const manager = canonical.__mockManager as MockManager;
    manager.has.mockReturnValueOnce(true);

    expect(has(CacheCategory.API_RESPONSES, 'key')).toBe(true);
    expect(manager.has).toHaveBeenCalledWith(CacheCategory.API_RESPONSES, 'key');
  });

  it('returns the canonical cache manager instance', () => {
    const instance = getInstance();
    expect(instance).toBe(canonical.__mockManager);
  });

  it('exposes a frozen default facade that mirrors the direct exports', () => {
    expect(Object.isFrozen(defaultExport)).toBe(true);
    expect(defaultExport.set).toBe(set);
    expect(defaultExport.get).toBe(get);
    expect(defaultExport.remove).toBe(remove);
    expect(defaultExport.delete).toBe(del);
    expect(defaultExport.clear).toBe(clear);
    expect(defaultExport.has).toBe(has);
    expect(defaultExport.getInstance).toBe(getInstance);
    expect(defaultExport.categories).toBe(CacheCategory);
  });

  it('retains the legacy directory re-export identity', () => {
    expect(legacy.default).toBe(defaultExport);
    expect(legacy.set).toBe(set);
    expect(legacy.get).toBe(get);
  });

  it('provides del alias that points to remove()', () => {
    expect(del).toBe(remove);
    del(CacheCategory.PREDICTIONS, 'prediction');
    expect(canonical.cacheRemove).toHaveBeenCalledWith(CacheCategory.PREDICTIONS, 'prediction');
  });
});
