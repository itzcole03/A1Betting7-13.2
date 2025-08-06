// RequestContextService.ts - Unified request tracing and correlation

// Simple UUID v4 generator (crypto-based if available)
export function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Returns headers with correlation/request ID and optional version info
export function getRequestContext(version?: string): Record<string, string> {
  const requestId = generateRequestId();
  const headers: Record<string, string> = {
    'X-Request-ID': requestId,
  };
  if (version) headers['X-Api-Version'] = version;
  return headers;
}

// Optional: Request timing metrics
export function timeRequest<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  return fn().then(result => ({ result, duration: performance.now() - start }));
}
