/**
 * Higher-order function that adds request correlation to any service method
 * that makes API calls
 */
export function withRequestCorrelation<T extends (...args: any[]) => Promise<any>>(apiCall: T): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    // The original function handles request correlation through httpFetch
    return apiCall(...args) as ReturnType<T>;
  }) as T;
}
