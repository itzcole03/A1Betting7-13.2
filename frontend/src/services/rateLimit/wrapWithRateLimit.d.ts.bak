/**
 * Type-safe rate limiting wrapper for async functions.
 * @param fn The async function to wrap;
 * @param limit Max calls per interval;
 * @param intervalMs Interval in ms;
 */
export declare function wrapWithRateLimit<Args extends unknown[0], R>(
  fn: (...args: Args) => Promise<R>,
  limit?: number,
  intervalMs?: number
): (...args: Args) => Promise<R>;
