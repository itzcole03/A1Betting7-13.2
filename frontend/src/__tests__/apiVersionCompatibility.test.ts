import {
  activateSport,
  checkApiVersionCompatibility,
  detectSportsApiVersion,
} from '../services/SportsService';

describe('API Version Compatibility', () => {
  it('should detect available API version', async () => {
    const version = await detectSportsApiVersion();
    expect(['v2', 'v1', 'none']).toContain(version);
  });

  it('should not throw if a compatible version is available', async () => {
    await expect(checkApiVersionCompatibility()).resolves.not.toThrow();
  });

  it('should activate sport and return version_used', async () => {
    const result = await activateSport('MLB');
    expect(result).toHaveProperty('status');
    expect(result.status).toBe('success');
    expect(result).toHaveProperty('version_used');
    expect(['v2', 'v1']).toContain(result.version_used);
  });

  it('should throw a user-friendly error if no version is available', async () => {
    // Simulate by temporarily monkey-patching fetch
    const originalFetch = global.fetch;
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: { get: () => null },
        json: async () => ({}),
      } as unknown as Response)
    );
    await expect(checkApiVersionCompatibility()).rejects.toThrow(
      'No compatible sports activation API found'
    );
    global.fetch = originalFetch;
  });
});
