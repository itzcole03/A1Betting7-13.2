import {
  hasArrayItems,
  safeArrayFirst,
  safeArrayGet,
  safeArrayLast,
  safeArrayLength,
  wrapSafeArray,
} from '../safeArrayAccess';

describe('safeArrayAccess utilities', () => {
  test('safeArrayGet/first/last/length behave correctly', () => {
    const arr = [1, 2, 3];
    expect(safeArrayGet(arr, 1)).toBe(2);
    expect(safeArrayGet(arr, 10)).toBeUndefined();
    expect(safeArrayFirst(arr)).toBe(1);
    expect(safeArrayLast(arr)).toBe(3);
    expect(safeArrayLength(arr)).toBe(3);
    expect(hasArrayItems(arr)).toBe(true);

    const w = wrapSafeArray(arr);
    expect(w.get(0)).toBe(1);
    expect(w.first()).toBe(1);
    expect(w.last()).toBe(3);
    expect(w.length).toBe(3);
    expect(w.toArray()).toEqual(arr);
  });
});
