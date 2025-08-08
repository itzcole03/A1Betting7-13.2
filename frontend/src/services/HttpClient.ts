// HttpClient.ts - Enhanced fetch abstraction with request ID, logging, and timing
import { getRequestContext } from './RequestContextService';

export interface HttpRequestOptions extends RequestInit {
  version?: string;
  logLabel?: string;
}

import { VITE_API_URL } from '../constants';

export async function httpFetch(url: string, options: HttpRequestOptions = {}): Promise<Response> {
  const { version, logLabel, ...fetchOptions } = options;
  // Explicitly type headers as Record<string, string> for safe indexing
  const headers: Record<string, string> = {
    ...((fetchOptions.headers as Record<string, string>) || {}),
    ...getRequestContext(version),
  };
  const label = logLabel || 'HttpClient';
  const requestId = headers['X-Request-ID'];
  const start = performance.now();

  // Always prepend base URL to relative paths (starting with '/') that are not already absolute
  let finalUrl = url;
  if (url.startsWith('/') && !/^https?:\/\//.test(url)) {
    const base = VITE_API_URL || 'http://localhost:8000';
    finalUrl = base.replace(/\/$/, '') + url;
  }

  // eslint-disable-next-line no-console
  console.log(`[${label}] [${requestId}] Request:`, finalUrl, fetchOptions);
  try {
    const response = await fetch(finalUrl, { ...fetchOptions, headers });
    const duration = performance.now() - start;
    // eslint-disable-next-line no-console
    console.log(
      `[${label}] [${requestId}] Response:`,
      finalUrl,
      `Status: ${response.status}`,
      `Duration: ${duration.toFixed(1)}ms`
    );
    return response;
  } catch (error) {
    const duration = performance.now() - start;

    // Suppress "Failed to fetch" errors to avoid console noise when backend unavailable
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      // Only log as warning instead of error to reduce console noise
      console.warn(
        `[${label}] [${requestId}] Backend unavailable:`,
        finalUrl,
        `Duration: ${duration.toFixed(1)}ms`
      );
    } else {
      // eslint-disable-next-line no-console
      console.error(
        `[${label}] [${requestId}] Error:`,
        finalUrl,
        error,
        `Duration: ${duration.toFixed(1)}ms`
      );
    }
    throw error;
  }
}
