/**
 * Safe object utilities to prevent "Cannot convert undefined or null to object" errors
 * These utilities provide defensive guards for common object operations during app bootstrap
 */

/**
 * Ensures a value is a valid object for Object.keys(), Object.entries(), Object.values() operations
 * Returns empty object if value is null/undefined, preserves other values
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ensureObject(value: any): Record<string, unknown> {
  if (value === null || value === undefined) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('[ObjectGuards] Converted null/undefined to empty object:', {
        originalValue: value,
        stack: new Error().stack?.split('\n').slice(1, 4).join('\n')
      });
    }
    return {};
  }
  return value;
}

/**
 * Safe wrapper for Object.keys() that handles null/undefined values
 */
export function safeObjectKeys(obj: unknown): string[] {
  if (obj === null || obj === undefined) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('[ObjectGuards] safeObjectKeys called with null/undefined:', {
        value: obj,
        stack: new Error().stack?.split('\n').slice(1, 4).join('\n')
      });
    }
    return [];
  }
  return Object.keys(ensureObject(obj));
}

/**
 * Safe wrapper for Object.entries() that handles null/undefined values
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeObjectEntries(obj: any): [string, any][] {
  if (obj === null || obj === undefined) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('[ObjectGuards] safeObjectEntries called with null/undefined:', {
        value: obj,
        stack: new Error().stack?.split('\n').slice(1, 4).join('\n')
      });
    }
    return [];
  }
  return Object.entries(ensureObject(obj));
}

/**
 * Safe wrapper for Object.values() that handles null/undefined values
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeObjectValues(obj: any): any[] {
  if (obj === null || obj === undefined) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('[ObjectGuards] safeObjectValues called with null/undefined:', {
        value: obj,
        stack: new Error().stack?.split('\n').slice(1, 4).join('\n')
      });
    }
    return [];
  }
  return Object.values(ensureObject(obj));
}

/**
 * Safe wrapper for Object.assign() that handles null/undefined values
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeObjectAssign(target: any, ...sources: any[]): any {
  const safeTarget = ensureObject(target);
  const safeSources = sources.map(source => ensureObject(source));
  return Object.assign(safeTarget, ...safeSources);
}

/**
 * Safe object spread - ensures the spread operation won't fail
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeSpread(obj: any): Record<string, unknown> {
  return ensureObject(obj);
}

/**
 * Safe destructuring helper - returns default values for null/undefined objects
 */
export function safeDestructure<T extends Record<string, unknown>>(
  obj: T | null | undefined,
  defaultValues: Partial<T> = {}
): T {
  if (obj === null || obj === undefined) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('[ObjectGuards] safeDestructure called with null/undefined:', {
        originalValue: obj,
        defaultValues,
        stack: new Error().stack?.split('\n').slice(1, 4).join('\n')
      });
    }
    return { ...defaultValues } as T;
  }
  return { ...defaultValues, ...obj } as T;
}

/**
 * Development helper to identify where null object usage might occur
 */
export function debugObjectOperation(operationName: string, obj: unknown, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    if (obj === null || obj === undefined) {
      // eslint-disable-next-line no-console
      console.group('[ObjectGuards] Potential Null Object Operation Detected');
      // eslint-disable-next-line no-console
      console.log('[ObjectGuards] Operation:', operationName);
      // eslint-disable-next-line no-console
      console.log('[ObjectGuards] Value:', obj);
      // eslint-disable-next-line no-console
      console.log('[ObjectGuards] Context:', context || 'unknown');
      // eslint-disable-next-line no-console
      console.log('[ObjectGuards] Stack:', new Error().stack);
      // eslint-disable-next-line no-console
      console.groupEnd();
    }
  }
}

export default {
  ensureObject,
  safeObjectKeys,
  safeObjectEntries,
  safeObjectValues,
  safeObjectAssign,
  safeSpread,
  safeDestructure,
  debugObjectOperation,
};