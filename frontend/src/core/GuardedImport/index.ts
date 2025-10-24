// Canonical guardedImport implementation for smoke tests
export interface GuardedImportOptions<T = any> {
  timeoutMs?: number;
  fallback?: T;
}

export default async function guardedImport<T = any>(
  modulePath: string,
  opts: GuardedImportOptions<T> = {}
): Promise<T | undefined> {
  const { timeoutMs = 500, fallback } = opts;

  if (!modulePath) return fallback;

  let timer: any = null;

  try {
    // Attempt a dynamic import which works in ESM environments.
    const p = import(/* webpackIgnore: true */ modulePath) as Promise<any>;

    if (timeoutMs && timeoutMs > 0) {
      const timeoutPromise = new Promise<undefined>(resolve => {
        timer = setTimeout(() => resolve(undefined), timeoutMs);
      });

      const result = await Promise.race([p, timeoutPromise]);
      if (timer) clearTimeout(timer);
      return result === undefined ? fallback : (result as T);
    }

    const result = await p;
    if (timer) clearTimeout(timer);
    return (result && (result.default ?? result)) as T;
  } catch (err) {
    if (timer) clearTimeout(timer);
    // eslint-disable-next-line no-console
    console.warn('[guardedImport] import failed:', modulePath, err && (err as Error).message);
    return fallback;
  }
}
