/**
 * Safe Array Access Utilities
 * Prevents MobX array out-of-bounds errors by checking length before accessing indices
 */

/**
 * Safely access an array element at the given index
 * Returns undefined if index is out of bounds or array is null/undefined
 */
export function safeArrayGet<T>(array: T[] | null | undefined, index: number): T | undefined {
  if (!array || !Array.isArray(array)) {
    return undefined;
  }
  
  if (index < 0 || index >= array.length) {
    return undefined;
  }
  
  return array[index];
}

/**
 * Safely get the first element of an array
 */
export function safeArrayFirst<T>(array: T[] | null | undefined): T | undefined {
  return safeArrayGet(array, 0);
}

/**
 * Safely get the last element of an array
 */
export function safeArrayLast<T>(array: T[] | null | undefined): T | undefined {
  if (!array || !Array.isArray(array) || array.length === 0) {
    return undefined;
  }
  return array[array.length - 1];
}

/**
 * Safely slice an array
 */
export function safeArraySlice<T>(
  array: T[] | null | undefined, 
  start?: number, 
  end?: number
): T[] {
  if (!array || !Array.isArray(array)) {
    return [];
  }
  
  return array.slice(start, end);
}

/**
 * Safely map over an array with bounds checking
 */
export function safeArrayMap<T, U>(
  array: T[] | null | undefined,
  callback: (item: T, index: number) => U
): U[] {
  if (!array || !Array.isArray(array)) {
    return [];
  }
  
  return array.map(callback);
}

/**
 * Safely filter an array
 */
export function safeArrayFilter<T>(
  array: T[] | null | undefined,
  predicate: (item: T, index: number) => boolean
): T[] {
  if (!array || !Array.isArray(array)) {
    return [];
  }
  
  return array.filter(predicate);
}

/**
 * Check if array has items without triggering MobX warnings
 */
export function hasArrayItems<T>(array: T[] | null | undefined): boolean {
  return Boolean(array && Array.isArray(array) && array.length > 0);
}

/**
 * Get array length safely
 */
export function safeArrayLength<T>(array: T[] | null | undefined): number {
  if (!array || !Array.isArray(array)) {
    return 0;
  }
  return array.length;
}

/**
 * Create a safe array wrapper for MobX arrays
 */
export class SafeArrayWrapper<T> {
  private array: T[] | null | undefined;

  constructor(array: T[] | null | undefined) {
    this.array = array;
  }

  get(index: number): T | undefined {
    return safeArrayGet(this.array, index);
  }

  first(): T | undefined {
    return safeArrayFirst(this.array);
  }

  last(): T | undefined {
    return safeArrayLast(this.array);
  }

  slice(start?: number, end?: number): T[] {
    return safeArraySlice(this.array, start, end);
  }

  map<U>(callback: (item: T, index: number) => U): U[] {
    return safeArrayMap(this.array, callback);
  }

  filter(predicate: (item: T, index: number) => boolean): T[] {
    return safeArrayFilter(this.array, predicate);
  }

  get length(): number {
    return safeArrayLength(this.array);
  }

  get hasItems(): boolean {
    return hasArrayItems(this.array);
  }

  get isEmpty(): boolean {
    return !this.hasItems;
  }

  // Convert to regular array safely
  toArray(): T[] {
    return this.array ? [...this.array] : [];
  }
}

/**
 * Utility to wrap any array for safe access
 */
export function wrapSafeArray<T>(array: T[] | null | undefined): SafeArrayWrapper<T> {
  return new SafeArrayWrapper(array);
}
