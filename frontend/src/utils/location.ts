// Utility functions for interacting with window.location, abstracted for robust mocking in tests and SSR safety.

/**
 * Returns the current window.location object.
 * Throws if called outside a browser environment (SSR/test safe).
 * Useful for mocking in tests and SSR safety.
 * @returns {Location} The window.location object.
 * @throws {Error} If called outside a browser environment.
 */
export const getLocation = (): Location => {
  if (typeof window === 'undefined' || !window.location) {
    throw new Error('getLocation: Can only be used in a browser environment.');
  }
  return window.location;
};

/**
 * Parses a query string (or the current URL's query string) into an object.
 * Handles empty, malformed, or repeated parameters robustly.
 * SSR/test safe: if window is not defined and no search is provided, returns empty object.
 *
 * @param {string} [search] - Optional query string (e.g., '?foo=1&bar=2'). If omitted, uses window.location.search.
 * @returns {Record<string, string>} An object mapping query parameter names to values. If a parameter appears multiple times, the last value is used.
 */
export const getQueryParams = (search?: string): Record<string, string> => {
  let queryString = '';
  if (search !== undefined) {
    queryString = search.replace(/^\?/, '');
  } else if (typeof window !== 'undefined' && window.location) {
    queryString = window.location.search.replace(/^\?/, '');
  } else {
    // SSR/test environment: no window, no search provided
    return {};
  }
  if (!queryString) return {};
  // URLSearchParams handles malformed input gracefully; last value wins for repeated keys
  return Object.fromEntries(new URLSearchParams(queryString));
};

/**
 * Navigates the browser to the specified URL.
 * Throws if called outside a browser environment (SSR/test safe).
 * @param url - The URL to navigate to. Should be a valid absolute or relative URL.
 * @throws {Error} If called outside a browser environment or if the URL is invalid.
 */
export const navigateTo = (url: string): void => {
  if (typeof window === 'undefined' || !window.location) {
    throw new Error('navigateTo: Can only be used in a browser environment.');
  }
  try {
    // Validate URL (relative or absolute)
     
    new URL(url, window.location.origin);
  } catch {
    throw new Error(`navigateTo: Invalid URL: ${url}`);
  }
  window.location.assign(url);
};

/**
 * Reloads the current page.
 * Throws if called outside a browser environment (SSR/test safe).
 * @throws {Error} If called outside a browser environment.
 */
export const reloadPage = (): void => {
  if (typeof window === 'undefined' || !window.location) {
    throw new Error('reloadPage: Can only be used in a browser environment.');
  }
  window.location.reload();
};
