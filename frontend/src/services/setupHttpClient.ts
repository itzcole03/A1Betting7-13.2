import { API_BASE_URL } from '../config/apiConfig';
import { httpFetch, HttpRequestOptions } from './HttpClient';

/**
 * Patches the global fetch implementation so that any relative or same-origin requests
 * automatically flow through our httpFetch wrapper. This guarantees auth headers,
 * request tracing, and consistent credentials behaviour without requiring every
 * call site to opt-in manually.
 */
(function installHttpClientPatch() {
  if (typeof window === 'undefined') {
    return;
  }

  const globalWindow = window as typeof window & {
    __A1_HTTP_CLIENT_PATCHED__?: boolean;
  };

  if (globalWindow.__A1_HTTP_CLIENT_PATCHED__) {
    return;
  }

  const originalFetch = window.fetch.bind(window);
  let inHttpFetch = false;
  const apiBase = API_BASE_URL.replace(/\/$/, '');

  const toHeaderRecord = (headers?: HeadersInit): Record<string, string> | undefined => {
    if (!headers) return undefined;

    if (headers instanceof Headers) {
      const record: Record<string, string> = {};
      headers.forEach((value, key) => {
        record[key] = value;
      });
      return record;
    }

    if (Array.isArray(headers)) {
      return headers.reduce<Record<string, string>>((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
    }

    return { ...headers };
  };

  const shouldUseHttpClient = (url: string): boolean => {
    if (!url) return false;

    // Relative URLs should always use httpFetch so the base URL and auth headers apply.
    if (!/^https?:\/\//i.test(url)) {
      return true;
    }

    try {
      const parsed = new URL(url);
      const originMatch = parsed.origin === window.location.origin;
      const apiMatch = parsed.href.startsWith(apiBase);
      return originMatch || apiMatch;
    } catch (error) {
      // If the URL constructor fails (e.g. invalid URL), defer to httpFetch to handle it.
      return true;
    }
  };

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' || input instanceof URL ? String(input) : input.url;

    if (inHttpFetch) {
      return originalFetch(input as RequestInfo, init);
    }

    if (!shouldUseHttpClient(url)) {
      return originalFetch(input as RequestInfo, init);
    }

    // When the caller passed a Request object, clone its properties into a RequestInit
    // so httpFetch receives equivalent options.
    let requestInit: HttpRequestOptions | undefined;
    if (input instanceof Request) {
      const headers: Record<string, string> = {};
      input.headers.forEach((value, key) => {
        headers[key] = value;
      });

      requestInit = {
        method: input.method,
        headers,
        body: input.bodyUsed ? undefined : input.body,
        credentials: input.credentials === 'omit' ? undefined : input.credentials,
        cache: input.cache,
        redirect: input.redirect,
        referrer: input.referrer === 'about:client' ? undefined : input.referrer,
        referrerPolicy: input.referrerPolicy,
        integrity: input.integrity,
        keepalive: input.keepalive,
        mode: input.mode,
        signal: input.signal,
      };
    } else if (init) {
      requestInit = init as HttpRequestOptions;
    }

    if (init) {
      const mergedHeaders = {
        ...(requestInit?.headers as Record<string, string> | undefined),
        ...(toHeaderRecord(init.headers) ?? {}),
      };

      requestInit = {
        ...requestInit,
        ...init,
        headers: Object.keys(mergedHeaders).length > 0 ? mergedHeaders : requestInit?.headers,
      };
    }

    inHttpFetch = true;
    const fetchPromise = Promise.resolve().then(() => httpFetch(url, requestInit));
    return fetchPromise.finally(() => {
      inHttpFetch = false;
    });
  };

  globalWindow.__A1_HTTP_CLIENT_PATCHED__ = true;
})();
