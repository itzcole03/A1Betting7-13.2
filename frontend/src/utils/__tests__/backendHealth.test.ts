/* eslint-disable @typescript-eslint/no-var-requires */
// Tests for backendHealthChecker: healthy flow and failure/caching
import { backendHealthChecker } from '../backendHealth';

describe('BackendHealthChecker (integration-style, mocked fetch)', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    // rely on default jsdom hostname (typically 'localhost') so we hit local logic
    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
    backendHealthChecker.clearCache();
  });

  afterEach(() => {
    fetchMock.mockRestore?.();
    delete (global as any).fetch;
  });

  it('returns healthy result when fetch responds ok and caches result', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ version: '1.2.3' }) });

    const res1 = await backendHealthChecker.checkCheatsheetsAPI();
    expect(res1.isHealthy).toBe(true);
    expect(res1.version).toBe('1.2.3');

    // call again should use cache and not call fetch a second time
    const res2 = await backendHealthChecker.checkCheatsheetsAPI();
    expect(res2.isHealthy).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns failure when fetch rejects and caches failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));

    const res = await backendHealthChecker.checkCheatsheetsAPI();
    expect(res.isHealthy).toBe(false);
    expect(res.error).toBeDefined();

    // subsequent call should return cached failure
    const res2 = await backendHealthChecker.checkCheatsheetsAPI();
    expect(res2.isHealthy).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
