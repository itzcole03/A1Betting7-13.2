const loadRuntimeDebug = async () => {
  jest.resetModules();
  return import('../runtimeDebug');
};

describe('runtimeDebug (development helpers)', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (typeof originalNodeEnv === 'undefined') {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
    jest.resetModules();
  });

  test('triggerTestError throws when NODE_ENV=development', async () => {
    process.env.NODE_ENV = 'development';
    const mod = await loadRuntimeDebug();

    expect(typeof mod.triggerTestError).toBe('function');
    expect(() => mod.triggerTestError()).toThrow();
  });

  test('captureBootstrapError can be invoked without throwing', async () => {
    process.env.NODE_ENV = 'development';
    const mod = await loadRuntimeDebug();

    expect(typeof mod.captureBootstrapError).toBe('function');
    expect(() => mod.captureBootstrapError()).not.toThrow();
  });

  test('module exports helper functions in development', async () => {
    process.env.NODE_ENV = 'development';
    const mod = await loadRuntimeDebug();

    expect(typeof mod.triggerTestError).toBe('function');
    expect(typeof mod.captureBootstrapError).toBe('function');
  });
});
