import pluginSystem, { PluginSystem } from '../PluginSystem';

describe('PluginSystem', () => {
  let system: PluginSystem;

  beforeEach(() => {
    system = PluginSystem.getInstance();
    system.reset({ reason: 'test_setup', source: 'jest' });
    jest.restoreAllMocks();
  });

  afterEach(() => {
    system.reset({ reason: 'test_teardown', source: 'jest' });
    jest.restoreAllMocks();
  });

  it('registers plugins, runs lifecycle hooks, and toggles enabled state', () => {
    const setup = jest.fn();
    const onEnable = jest.fn();
    const onDisable = jest.fn();

    const registered = system.register(
      {
        id: 'alpha-plugin',
        setup,
        onEnable,
        onDisable,
        metadata: { origin: 'unit-test' },
      },
      { source: 'spec' }
    );

    expect(setup).toHaveBeenCalledWith({
      pluginId: 'alpha-plugin',
      reason: 'register',
      source: 'spec',
    });
    expect(onEnable).toHaveBeenCalledWith({
      pluginId: 'alpha-plugin',
      reason: 'enable',
      source: 'spec',
    });
    expect(registered?.enabled).toBe(true);
    expect(registered?.state).toBe('ready');
    expect(system.isEnabled('alpha-plugin')).toBe(true);

    const disableResult = system.disable('alpha-plugin', { source: 'spec' });
    expect(disableResult).toBe(true);
    expect(onDisable).toHaveBeenCalledWith({
      pluginId: 'alpha-plugin',
      reason: 'disable',
      source: 'spec',
    });
    expect(system.isEnabled('alpha-plugin')).toBe(false);

    const plugin = system.getPlugin('alpha-plugin');
    expect(plugin?.lastDisabledAt).toEqual(expect.any(Number));
    expect(plugin?.metadata.origin).toBe('unit-test');
  });

  it('captures setup errors and prevents enablement when plugin is in error state', () => {
    const systemLogger = (system as unknown as { logger: { warn: (...args: unknown[]) => void } })
      .logger;
    const warnSpy = jest.spyOn(systemLogger, 'warn').mockImplementation(() => {});

    const registered = system.register(
      {
        id: 'faulty-plugin',
        setup: () => {
          throw new Error('boom');
        },
        onEnable: jest.fn(),
      },
      { source: 'spec' }
    );

    expect(registered?.state).toBe('error');
    expect(registered?.enabled).toBe(false);
    expect(registered?.lastError).toMatchObject({ message: 'boom' });
    expect(warnSpy).toHaveBeenCalledWith('PluginSystem lifecycle hook failed', {
      pluginId: 'faulty-plugin',
      phase: 'setup',
      error: expect.objectContaining({ message: 'boom' }),
    });

    expect(system.enable('faulty-plugin', { source: 'spec' })).toBe(false);
  });

  it('invokes disable, reset, and teardown hooks during system reset', () => {
    const onDisable = jest.fn();
    const onReset = jest.fn();
    const teardown = jest.fn();

    system.register(
      {
        id: 'beta-plugin',
        setup: jest.fn(),
        onEnable: jest.fn(),
        onDisable,
        onReset,
        teardown,
      },
      { source: 'spec' }
    );

    system.reset({ source: 'spec', reason: 'shutdown' });

    expect(onDisable).toHaveBeenCalledWith({
      pluginId: 'beta-plugin',
      reason: 'disable',
      source: 'spec',
    });
    expect(onReset).toHaveBeenCalledWith({
      pluginId: 'beta-plugin',
      reason: 'shutdown',
      source: 'spec',
    });
    expect(teardown).toHaveBeenCalledWith({
      pluginId: 'beta-plugin',
      reason: 'shutdown',
      source: 'spec',
    });
    expect(system.getRegisteredIds()).toEqual([]);
  });

  it('exposes default pluginSystem singleton aligned with getInstance', () => {
    expect(pluginSystem).toBe(PluginSystem.getInstance());
  });
});
