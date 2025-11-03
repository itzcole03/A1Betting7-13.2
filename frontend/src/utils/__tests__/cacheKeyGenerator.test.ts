import {
  extractParamsFromUrl,
  generateCacheKey,
  generateETagCacheKey,
  normalizeUrl,
} from '../cacheKeyGenerator';

describe('cacheKeyGenerator', () => {
  test('generateCacheKey produces stable keys regardless of param order', () => {
    const a = { b: 2, a: 1 };
    const k1 = generateCacheKey('/api/foo', a);
    const k2 = generateCacheKey('/api/foo', { a: 1, b: 2 });
    expect(k1).toBe(k2);

    const et = generateETagCacheKey('/api/foo', a, 'etag123');
    expect(et).toContain('@etag123');

    const params = extractParamsFromUrl('http://localhost/?x=1&y=%5B1,2%5D');
    // extractParamsFromUrl may parse numbers; accept either number or string
    expect(String(params.x)).toBe('1');
    expect(params.y).toBeDefined();

    const norm = normalizeUrl('http://localhost/path?b=2&a=1');
    expect(norm).toContain('a=1');
    expect(norm).toContain('b=2');
  });
});
