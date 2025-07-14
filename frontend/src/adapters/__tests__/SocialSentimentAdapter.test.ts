import { SocialSentimentAdapter } from '@/adapters/SocialSentimentAdapter';

describe('SocialSentimentAdapter', () => {
  let adapter: SocialSentimentAdapter;

  beforeEach(() => {
    adapter = new SocialSentimentAdapter();
    adapter.clearCache();
  });

  it('should be available', async () => {
    expect(await adapter.isAvailable()).toBe(true);
  });

  it('should fetch sentiment data and cache it', async () => {
    const data = await adapter.fetch();
    const cached = await adapter.getData();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('player');
    expect(data[0]).toHaveProperty('sentiment');
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
