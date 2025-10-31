describe('versionChecker (smoke)', () => {
  test('checkCompatibility returns a CompatibilityResult when backend responds', async () => {
    // Mock fetch before requiring module so auto-init doesn't hit network unexpectedly
    // @ts-ignore
    global.fetch = jest.fn().mockResolvedValueOnce({
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

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { versionChecker } = require('../versionChecker');

    const res = await versionChecker.checkCompatibility({ requireExactMatch: false });

    expect(res).toBeDefined();
    expect(typeof res.compatible).toBe('boolean');

    // cleanup mock
    // @ts-ignore
    global.fetch = undefined;
  });
});

describe('versionChecker', () => {
  // Require the module to avoid duplicate import/require declarations
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { APP_VERSION } = require('../versionChecker');

  test('APP_VERSION is a non-empty string', () => {
    expect(typeof APP_VERSION).toBe('string');
    expect(APP_VERSION.length).toBeGreaterThan(0);
  });
});
