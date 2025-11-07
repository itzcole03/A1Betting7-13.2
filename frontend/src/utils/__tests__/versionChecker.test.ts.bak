describe('versionChecker (smoke)', () => {
  test('checkCompatibility returns a CompatibilityResult when backend responds', async () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        data: {
          app: '7.13.2',
          semantic: { major: 7, minor: 13, patch: 2 },
          features: [],
          build: { timestamp: new Date().toISOString(), environment: 'test' },
        },
      }),
    });

    const globalWithFetch = globalThis as typeof globalThis & { fetch?: typeof fetch };
    Object.defineProperty(globalWithFetch, 'fetch', {
      configurable: true,
      writable: true,
      value: mockFetch as unknown as typeof fetch,
    });

    const { versionChecker } = await import('../versionChecker');

    const res = await versionChecker.checkCompatibility({ requireExactMatch: false });

    expect(res).toBeDefined();
    expect(typeof res.compatible).toBe('boolean');

    if (originalFetch === undefined) {
      Reflect.deleteProperty(globalWithFetch, 'fetch');
    } else {
      Object.defineProperty(globalWithFetch, 'fetch', {
        configurable: true,
        writable: true,
        value: originalFetch,
      });
    }
  });
});

describe('versionChecker', () => {
  let APP_VERSION: string;

  beforeAll(async () => {
    ({ APP_VERSION } = await import('../versionChecker'));
  });

  test('APP_VERSION is a non-empty string', () => {
    expect(typeof APP_VERSION).toBe('string');
    expect(APP_VERSION.length).toBeGreaterThan(0);
  });
});
