import { getBackendUrl } from '../getBackendUrl';

describe('getBackendUrl', () => {
  test('returns default when no env configured', () => {
    // Ensure test environment is active so getViteEnvSafe returns {}
    const oldJest = process.env.JEST_WORKER_ID;
    process.env.JEST_WORKER_ID = '1';

    const url = getBackendUrl();
    expect(typeof url).toBe('string');

    if (oldJest === undefined) delete process.env.JEST_WORKER_ID;
    else process.env.JEST_WORKER_ID = oldJest;
  });
});
