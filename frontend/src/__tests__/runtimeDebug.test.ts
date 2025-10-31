describe('runtimeDebug (smoke)', () => {
  // Require the module here to avoid top-level side-effects and keep symmetry
  // with the earlier smoke tests that require inside each test.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const runtimeDebug = require('../runtimeDebug');
  test('triggerTestError throws when NODE_ENV=development', () => {
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // require inside test to avoid top-level side-effects during module load in other tests
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('../runtimeDebug');

    expect(typeof mod.triggerTestError).toBe('function');
    expect(() => mod.triggerTestError()).toThrow();

    process.env.NODE_ENV = oldEnv;
  });

  test('captureBootstrapError is callable and does not throw', () => {
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('../runtimeDebug');

    expect(typeof mod.captureBootstrapError).toBe('function');
    expect(() => mod.captureBootstrapError()).not.toThrow();

    process.env.NODE_ENV = oldEnv;
  });
});

describe('runtimeDebug (smoke)', () => {
  const OLD_ENV = process.env.NODE_ENV;

  beforeAll(() => {
    // Ensure development branch executes helpers when called
    process.env.NODE_ENV = 'development';
  });

  afterAll(() => {
    process.env.NODE_ENV = OLD_ENV;
  });

  test('exports helper functions', () => {
    expect(typeof runtimeDebug.triggerTestError).toBe('function');
    expect(typeof runtimeDebug.captureBootstrapError).toBe('function');
  });

  test('triggerTestError throws when called in development', () => {
    // triggerTestError intentionally throws — ensure it throws an Error
    expect(() => runtimeDebug.triggerTestError()).toThrow();
  });
});
