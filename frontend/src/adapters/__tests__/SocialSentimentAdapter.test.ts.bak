import { beforeEach, describe, expect, it } from '@jest/globals';
import { SocialSentimentAdapter } from '../SocialSentimentAdapter';

describe('SocialSentimentAdapter (smoke)', () => {
  test('fetch returns an array and caches it', async () => {
    const adapter = new SocialSentimentAdapter();
    const data = await adapter.fetch();
    expect(Array.isArray(data)).toBe(true);
    const cached = await adapter.getData();
    expect(cached).toBeTruthy();
    adapter.clearCache();
    const afterClear = await adapter.getData();
    expect(afterClear).toBeNull();
  });
});
describe('SocialSentimentAdapter', () => {
  let _adapter: SocialSentimentAdapter;

  beforeEach(() => {
    _adapter = new SocialSentimentAdapter();
    _adapter.clearCache();
  });

  it('should be available', async () => {
    expect(await _adapter.isAvailable()).toBe(true);
  });

  it('should fetch sentiment data and cache it', async () => {
    const _data = await _adapter.fetch();
    const _cached = await _adapter.getData();
    expect(Array.isArray(_data)).toBe(true);
    expect(_data.length).toBeGreaterThan(0);
    const firstEntry = _data[0];
    expect(firstEntry).toHaveProperty('player');
    expect(firstEntry).toHaveProperty('sentiment');
    // Should be cached;
    expect(_cached).toBe(_data);
  });

  it('should clear cache', async () => {
    await _adapter.fetch();
    _adapter.clearCache();
    // Use getData() to check cache is cleared
    const _cleared = await _adapter.getData();
    expect(_cleared).toBeNull();
  });
});
