import { normalizeDataSource, type DataSource, type DataSourceHealth } from '../DataSource';

describe('normalizeDataSource', () => {
  it('provides fallbacks for minimal implementations', async () => {
    const fetchData = jest.fn().mockResolvedValue({ payload: 'ok' });

    const source: DataSource<{ payload: string }> = {
      id: 'minimal',
      type: 'test',
      fetchData,
    };

    const normalized = normalizeDataSource(source);

    expect(normalized.id).toBe('minimal');
    expect(normalized.priority).toBe('normal');

    await expect(normalized.connect()).resolves.toBe(true);
    await expect(normalized.disconnect()).resolves.toBe(true);

    await expect(normalized.fetchData()).resolves.toEqual({ payload: 'ok' });
    expect(fetchData).toHaveBeenCalledTimes(1);

    const health = await normalized.getHealth();
    expect(health.status).toBe('ready');
    expect(typeof health.lastChecked).toBe('number');
    expect(normalized.isConnected()).toBe(true);

    const metadata = normalized.getMetadata();
    expect(metadata).toMatchObject({ id: 'minimal', type: 'test', priority: 'normal' });
  });

  it('honours custom implementations when provided', async () => {
    const connect = jest.fn().mockResolvedValue(false);
    const disconnect = jest.fn().mockResolvedValue(true);
    const refresh = jest.fn().mockResolvedValue('refreshed');
    const ping = jest.fn().mockResolvedValue(42);
    const getHealth = jest.fn(
      async (): Promise<DataSourceHealth> => ({
        status: 'ready',
        latencyMs: 42,
        lastChecked: 123,
      })
    );
    const fetch = jest.fn().mockResolvedValue('data');

    const source: DataSource<string> = {
      id: 'custom',
      type: 'analytics',
      priority: 'high',
      fetchData: fetch,
      connect,
      disconnect,
      refresh,
      ping,
      getHealth,
      isConnected: () => false,
      getMetadata: () => ({ region: 'us-east-1' }),
    };

    const normalized = normalizeDataSource(source);

    await expect(normalized.connect()).resolves.toBe(false);
    await expect(normalized.disconnect()).resolves.toBe(true);
    await expect(normalized.refresh()).resolves.toBe('refreshed');
    await expect(normalized.ping()).resolves.toBe(42);
    await expect(normalized.fetchData()).resolves.toBe('data');

    expect(connect).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(ping).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);

    await expect(normalized.getHealth()).resolves.toEqual({
      status: 'ready',
      latencyMs: 42,
      lastChecked: 123,
    });

    expect(normalized.isConnected()).toBe(false);
    expect(normalized.priority).toBe('high');
    expect(normalized.getMetadata()).toMatchObject({
      id: 'custom',
      type: 'analytics',
      region: 'us-east-1',
      priority: 'high',
    });
  });

  it('supports adapters that expose only fetch', async () => {
    const fetch = jest.fn().mockResolvedValue(7);

    const source: DataSource<number> = {
      id: 'legacy',
      type: 'legacy-source',
      fetch,
    };

    const normalized = normalizeDataSource(source);

    await expect(normalized.fetchData()).resolves.toBe(7);
    await expect(normalized.refresh()).resolves.toBe(7);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('throws when required identifiers are missing', () => {
    expect(() => normalizeDataSource({} as DataSource)).toThrow(
      'normalizeDataSource requires an object with stable id and type properties'
    );
  });

  it('throws when fetch implementation is absent', () => {
    expect(() =>
      normalizeDataSource({
        id: 'broken',
        type: 'invalid',
      } as DataSource)
    ).toThrow('does not implement fetchData');
  });
});
