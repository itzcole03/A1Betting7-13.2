const { SocialSentimentAdapter } = require('../../adapters/SocialSentimentAdapter');

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
import { beforeEach, describe, expect, it } from '@jest/globals';
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
    expect(Array.isArray(_data as unknown[])).toBe(true);
    expect((_data as unknown[]).length).toBeGreaterThan(0);
    expect((_data as Array<Record<string, unknown>>)[0]).toHaveProperty('player');
    expect((_data as Array<Record<string, unknown>>)[0]).toHaveProperty('sentiment');
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
