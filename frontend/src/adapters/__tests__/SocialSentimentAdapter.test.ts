import { beforeEach, describe, expect, it } from '@jest/globals';
describe('SocialSentimentAdapter', () => {
  // @ts-expect-error TS(2304): Cannot find name 'SocialSentimentAdapter'.
  let adapter: SocialSentimentAdapter;

  beforeEach(() => {
    // @ts-expect-error TS(2304): Cannot find name 'SocialSentimentAdapter'.
    adapter = new SocialSentimentAdapter();
    adapter.clearCache();
  });

  it('should be available', async () => {
    expect(await adapter.isAvailable()).toBe(true);
  });

  it('should fetch sentiment data and cache it', async () => {
    const data = await adapter.fetch();
    const cached = await adapter.getData();
    expect(Array.isArray(data as unknown[])).toBe(true);
    expect((data as unknown[]).length).toBeGreaterThan(0);
    expect((data as Record<string, unknown>)[0]).toHaveProperty('player');
    expect((data as Record<string, unknown>)[0]).toHaveProperty('sentiment');
    // Should be cached;
    expect(cached).toBe(data);
  });

  it('should clear cache', async () => {
    await adapter.fetch();
    adapter.clearCache();
    // Use getData() to check cache is cleared
    const cleared = await adapter.getData();
    expect(cleared).toBeNull();
  });
});
