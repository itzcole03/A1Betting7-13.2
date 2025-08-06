// HttpClient.ts - Enhanced fetch abstraction with request ID, logging, and timing
import { getRequestContext } from './RequestContextService';

export interface HttpRequestOptions extends RequestInit {
  version?: string;
  logLabel?: string;
}

export async function httpFetch(url: string, options: HttpRequestOptions = {}): Promise<Response> {
  const { version, logLabel, ...fetchOptions } = options;
  const headers = {
    ...(fetchOptions.headers || {}),
    ...getRequestContext(version),
  };
  const label = logLabel || 'HttpClient';
  const requestId = headers['X-Request-ID'];
  const start = performance.now();
  // eslint-disable-next-line no-console
  console.log(`[${label}] [${requestId}] Request:`, url, fetchOptions);
  try {
    const response = await fetch(url, { ...fetchOptions, headers });
    const duration = performance.now() - start;
    // eslint-disable-next-line no-console
    console.log(
      `[${label}] [${requestId}] Response:`,
      url,
      `Status: ${response.status}`,
      `Duration: ${duration.toFixed(1)}ms`
    );
    return response;
  } catch (error) {
    const duration = performance.now() - start;
    // eslint-disable-next-line no-console
    console.error(
      `[${label}] [${requestId}] Error:`,
      url,
      error,
      `Duration: ${duration.toFixed(1)}ms`
    );
    throw error;
  }
}
