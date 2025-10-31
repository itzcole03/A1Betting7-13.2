/* eslint-disable @typescript-eslint/no-var-requires */
const {
  generateCacheKey,
  generateETagCacheKey,
  extractParamsFromUrl,
  normalizeUrl,
} = require('../cacheKeyGenerator');

describe('cacheKeyGenerator extra behaviors', () => {
  test('generateCacheKey is stable across param order', () => {
    const a = { b: 2, a: 1 };
    const b = { a: 1, b: 2 };
    const k1 = generateCacheKey('/api/test', a);
    const k2 = generateCacheKey('/api/test', b);
    expect(k1).toBe(k2);
  });

  test('generateETagCacheKey appends etag when provided', () => {
    const base = generateCacheKey('/api/x', { q: 1 });
    const etagKey = generateETagCacheKey('/api/x', { q: 1 }, 'v1');
    expect(etagKey).toBe(`${base}@v1`);
  });

  test('extractParamsFromUrl parses JSON parameters and strings', () => {
    const url = '/path?arr=%5B1%2C2%5D&foo=bar'; // arr=[1,2]
    const params = extractParamsFromUrl(url);
    expect(Array.isArray(params.arr)).toBe(true);
    expect(params.foo).toBe('bar');
  });

  test('normalizeUrl orders params consistently', () => {
    const u1 = '/path?b=2&a=1';
    const u2 = '/path?a=1&b=2';
    expect(normalizeUrl(u1)).toBe(normalizeUrl(u2));
  });
});
