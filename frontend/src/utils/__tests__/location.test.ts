describe('location utils', () => {
  test('getQueryParams parses a provided query string', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getQueryParams } = require('../location');

    expect(getQueryParams('?a=1&b=two')).toEqual({ a: '1', b: 'two' });
    expect(getQueryParams('')).toEqual({});
  });
  // Note: navigateTo/reloadPage perform real navigation via window.location
  // which is not fully implemented in the jsdom test environment. We avoid
  // exercising those helpers here to keep the test deterministic. They can be
  // covered later with a small mocked/location shim if needed.
});
describe('location utils (dynamic require)', () => {
  test('getQueryParams parses a query string', () => {
    const { getQueryParams } = require('../location');
    const qs = '?a=1&b=hello';
    const parsed = getQueryParams(qs);
    expect(parsed.a).toBe('1');
    expect(parsed.b).toBe('hello');
  });

  test('getLocation and navigation helpers are callable', () => {
    const { getLocation, navigateTo, reloadPage } = require('../location');
    expect(getLocation()).toBe(window.location);
    expect(() => navigateTo('http://example.com/new-page')).not.toThrow();
    expect(() => reloadPage()).not.toThrow();
  });
});
