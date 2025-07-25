import { getLocation, getQueryParams, navigateTo, reloadPage } from '../location';

describe('location utils', () => {
  it('getLocation should return window.location', () => {
    expect(getLocation()).toBe(window.location);
  });

  it('getQueryParams should parse query parameters correctly', () => {
    expect(getQueryParams('?name=test&age=30')).toEqual({ name: 'test', age: '30' });
    expect(getQueryParams('')).toEqual({});
    expect(getQueryParams('?param1=value1&param2=&param3=value3')).toEqual({
      param1: 'value1',
      param2: '',
      param3: 'value3',
    });
  });

  it('navigateTo should be callable', () => {
    expect(() => navigateTo('http://example.com/new-page')).not.toThrow();
  });

  it('reloadPage should be callable', () => {
    expect(() => reloadPage()).not.toThrow();
  });
});
