// HttpClient.ts - Enhanced fetch abstraction with request ID, logging, timing, and telemetry
import { getRequestContext } from './RequestContextService';
import { API_BASE_URL } from '../config/apiConfig';

export interface HttpRequestOptions extends RequestInit {
  version?: string;
  logLabel?: string;
  span_name?: string;  // For span tracking
  tags?: Record<string, string | number | boolean>;  // For request tagging
}

export interface RequestTelemetry {
  requestId: string;
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  success: boolean;
  error?: string;
  span_name?: string;
  tags?: Record<string, string | number | boolean>;
  responseSize?: number;
  requestSize?: number;
}

class HttpTelemetry {
  private requestHistory: RequestTelemetry[] = [];
  private maxHistorySize = 100;
  private activeRequests = new Map<string, RequestTelemetry>();

  startRequest(
    requestId: string,
    url: string,
    method: string,
    span_name?: string,
    tags?: Record<string, string | number | boolean>
  ): RequestTelemetry {
    const telemetry: RequestTelemetry = {
      requestId,
      url,
      method,
      startTime: performance.now(),
      success: false,
      span_name,
      tags
    };

    this.activeRequests.set(requestId, telemetry);
    return telemetry;
  }

  finishRequest(
    requestId: string,
    status?: number,
    error?: string,
    responseSize?: number,
    requestSize?: number
  ): void {
    const telemetry = this.activeRequests.get(requestId);
    if (!telemetry) return;

    const endTime = performance.now();
    telemetry.endTime = endTime;
    telemetry.duration = endTime - telemetry.startTime;
    telemetry.status = status;
    telemetry.success = !error && (!status || (status >= 200 && status < 300));
    telemetry.error = error;
    telemetry.responseSize = responseSize;
    telemetry.requestSize = requestSize;

    // Move to history
    this.activeRequests.delete(requestId);
    this.requestHistory.push(telemetry);

    // Maintain history size
    if (this.requestHistory.length > this.maxHistorySize) {
      this.requestHistory.shift();
    }
  }

  getRequestHistory(): RequestTelemetry[] {
    return [...this.requestHistory];
  }

  getActiveRequests(): RequestTelemetry[] {
    return Array.from(this.activeRequests.values());
  }

  getRequestStats(): {
    total: number;
    active: number;
    success_rate: number;
    avg_duration: number;
    error_count: number;
    recent_errors: string[];
  } {
    const total = this.requestHistory.length;
    const active = this.activeRequests.size;
    const successful = this.requestHistory.filter(r => r.success).length;
    const success_rate = total > 0 ? (successful / total) * 100 : 0;
    
    const durations = this.requestHistory
      .filter(r => r.duration !== undefined)
      .map(r => r.duration!);
    const avg_duration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;
    
    const errors = this.requestHistory.filter(r => r.error);
    const error_count = errors.length;
    const recent_errors = errors.slice(-5).map(r => r.error!);

    return {
      total,
      active,
      success_rate: Math.round(success_rate * 100) / 100,
      avg_duration: Math.round(avg_duration * 100) / 100,
      error_count,
      recent_errors
    };
  }

  // Get span-based request grouping
  getSpanSummary(): Record<string, {
    count: number;
    avg_duration: number;
    success_rate: number;
    recent_requests: RequestTelemetry[];
  }> {
    const spans: Record<string, RequestTelemetry[]> = {};
    
    this.requestHistory.forEach(req => {
      const span = req.span_name || 'default';
      if (!spans[span]) spans[span] = [];
      spans[span].push(req);
    });

    const summary: Record<string, {
      count: number;
      avg_duration: number;
      success_rate: number;
      recent_requests: RequestTelemetry[];
    }> = {};
    Object.entries(spans).forEach(([spanName, requests]) => {
      const durations = requests.filter(r => r.duration).map(r => r.duration!);
      const successful = requests.filter(r => r.success).length;
      
      summary[spanName] = {
        count: requests.length,
        avg_duration: durations.length > 0 
          ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 100) / 100
          : 0,
        success_rate: Math.round((successful / requests.length) * 100 * 100) / 100,
        recent_requests: requests.slice(-3)
      };
    });

    return summary;
  }
}

// Global telemetry instance
const httpTelemetry = new HttpTelemetry();

export async function httpFetch(url: string, options: HttpRequestOptions = {}): Promise<Response> {
  const { version, logLabel, span_name, tags, ...fetchOptions } = options;
  // Explicitly type headers as Record<string, string> for safe indexing
  const headers: Record<string, string> = {
    ...((fetchOptions.headers as Record<string, string>) || {}),
    ...getRequestContext(version),
  };
  const label = logLabel || 'HttpClient';
  const requestId = headers['X-Request-ID'];
  const method = fetchOptions.method || 'GET';

  // Always prepend base URL to relative paths (starting with '/') that are not already absolute
  let finalUrl = url;
  if (url.startsWith('/') && !/^https?:\/\//.test(url)) {
    const base = API_BASE_URL;
    finalUrl = base.replace(/\/$/, '') + url;
  }

  // Calculate request size (approximate)
  let requestSize = 0;
  if (fetchOptions.body) {
    if (typeof fetchOptions.body === 'string') {
      requestSize = new Blob([fetchOptions.body]).size;
    } else if (fetchOptions.body instanceof FormData) {
      requestSize = 0; // FormData size is difficult to calculate
    } else {
      requestSize = 0; // Other body types
    }
  }

  // Start telemetry tracking
  const telemetry = httpTelemetry.startRequest(
    requestId,
    finalUrl,
    method,
    span_name,
    tags
  );

  // Enhanced logging with span context
  const logPrefix = `[${label}] [${requestId}]`;
  const spanInfo = span_name ? ` [${span_name}]` : '';
  // eslint-disable-next-line no-console
  console.log(`${logPrefix}${spanInfo} Request:`, finalUrl, fetchOptions);

  try {
    const response = await fetch(finalUrl, { ...fetchOptions, headers });
    
    // Calculate response size from content-length header
    const responseSize = response.headers.get('content-length') 
      ? parseInt(response.headers.get('content-length')!, 10)
      : undefined;

    // Finish telemetry tracking
    httpTelemetry.finishRequest(
      requestId,
      response.status,
      undefined,
      responseSize,
      requestSize
    );

    // eslint-disable-next-line no-console
    console.log(
      `${logPrefix}${spanInfo} Response:`,
      finalUrl,
      `Status: ${response.status}`,
      `Duration: ${telemetry.duration?.toFixed(1)}ms`,
      responseSize ? `Size: ${responseSize}b` : ''
    );

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Finish telemetry tracking with error
    httpTelemetry.finishRequest(
      requestId,
      undefined,
      errorMessage,
      undefined,
      requestSize
    );

    // Suppress "Failed to fetch" errors to avoid console noise when backend unavailable
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      // Only log as warning instead of error to reduce console noise
      // eslint-disable-next-line no-console
      console.warn(
        `${logPrefix}${spanInfo} Backend unavailable:`,
        finalUrl,
        `Duration: ${telemetry.duration?.toFixed(1)}ms`
      );
    } else {
      // eslint-disable-next-line no-console
      console.error(
        `${logPrefix}${spanInfo} Error:`,
        finalUrl,
        error,
        `Duration: ${telemetry.duration?.toFixed(1)}ms`
      );
    }
    throw error;
  }
}

// Telemetry access functions for debugging and monitoring
export function getHttpTelemetryStats() {
  return httpTelemetry.getRequestStats();
}

export function getHttpRequestHistory() {
  return httpTelemetry.getRequestHistory();
}

export function getActiveHttpRequests() {
  return httpTelemetry.getActiveRequests();
}

export function getHttpSpanSummary() {
  return httpTelemetry.getSpanSummary();
}

// Global telemetry access for debugging in browser console
if (typeof window !== 'undefined') {
  (window as unknown as {
    httpTelemetry: {
      stats: () => ReturnType<typeof getHttpTelemetryStats>;
      history: () => RequestTelemetry[];
      active: () => RequestTelemetry[];
      spans: () => ReturnType<typeof getHttpSpanSummary>;
    };
  }).httpTelemetry = {
    stats: getHttpTelemetryStats,
    history: getHttpRequestHistory,
    active: getActiveHttpRequests,
    spans: getHttpSpanSummary
  };
}
