import {
  ensureObject,
  safeDestructure,
  safeObjectAssign,
  safeObjectEntries,
  safeObjectKeys,
  safeObjectValues,
} from '../objectGuards';

describe('objectGuards utilities', () => {
  test('ensureObject and safe wrappers handle null/undefined', () => {
    expect(ensureObject(null)).toEqual({});
    expect(safeObjectKeys(null)).toEqual([]);
    expect(safeObjectEntries(null)).toEqual([]);
    expect(safeObjectValues(null)).toEqual([]);

    const assigned = safeObjectAssign({ a: 1 }, { b: 2 });
    expect(assigned).toHaveProperty('a');
    expect(assigned).toHaveProperty('b');

    const d = safeDestructure(null, { foo: 'bar' });
    expect(d.foo).toBe('bar');
  });
});
