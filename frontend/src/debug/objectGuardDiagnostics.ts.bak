/**
 * Object Guard Diagnostics - Minimally invasive runtime error detection
 * 
 * Provides safe object operations with detailed error tracking for
 * "Cannot convert undefined or null to object" runtime errors.
 * 
 * Usage: Wrap suspicious object operations during development to identify
 * the exact source of null/undefined object access errors.
 * 
 * TO REMOVE: After confirming the runtime error source, remove this file
 * and all its usages. This is temporary instrumentation only.
 * 
 * @module debug/objectGuardDiagnostics
 */

import { recordEvent, getRecent } from './runtimeEventBuffer';

/**
 * Guard function that ensures a value is safe for Object operations
 * 
 * If value is null or undefined:
 * - Logs detailed diagnostic info  
 * - Records event for error correlation
 * - Returns empty object to prevent runtime error
 * 
 * @param label Diagnostic label for tracking
 * @param value Value to guard
 * @returns Safe value for Object operations
 */
export function guardObject<T>(label: string, value: T): T | Record<string, unknown> {
  if (value === null || value === undefined) {
    const stack = new Error().stack || 'No stack available';
    const diagnostic = {
      label,
      typeof: typeof value,
      time: Date.now(),
      stack,
    };
    
    // eslint-disable-next-line no-console
    console.error('[NullObjectAccess]', diagnostic);
    recordEvent('NullObjectAccess', diagnostic);
    
    // Return empty object to prevent runtime error
    return {} as Record<string, unknown>;
  }
  
  return value;
}

/**
 * Safe wrapper for Object.keys() with error context
 */
export function wrapKeys<T extends object>(
  label: string,
  obj: T,
  fn: (keys: string[]) => unknown
): unknown {
  try {
    const guardedObj = guardObject(label, obj);
    return fn(Object.keys(guardedObj as object));
  } catch (error) {
    const enhancedError = new Error(
      `${(error as Error).message} [PostGuardFailure] at ${label}`
    );
    enhancedError.stack = (error as Error).stack;
    throw enhancedError;
  }
}

/**
 * Safe wrapper for Object.entries() with error context
 */
export function wrapEntries<T extends object>(
  label: string,
  obj: T,
  fn: (entries: [string, unknown][]) => unknown
): unknown {
  try {
    const guardedObj = guardObject(label, obj);
    return fn(Object.entries(guardedObj as object));
  } catch (error) {
    const enhancedError = new Error(
      `${(error as Error).message} [PostGuardFailure] at ${label}`
    );
    enhancedError.stack = (error as Error).stack;
    throw enhancedError;
  }
}

/**
 * Safe wrapper for Object.values() with error context  
 */
export function wrapValues<T extends object>(
  label: string,
  obj: T,
  fn: (values: unknown[]) => unknown
): unknown {
  try {
    const guardedObj = guardObject(label, obj);
    return fn(Object.values(guardedObj as object));
  } catch (error) {
    const enhancedError = new Error(
      `${(error as Error).message} [PostGuardFailure] at ${label}`
    );
    enhancedError.stack = (error as Error).stack;
    throw enhancedError;
  }
}

/**
 * Clear the event buffer (for testing)
 */
export function clearEvents(): void {
  // No longer used, delegated to runtimeEventBuffer
}