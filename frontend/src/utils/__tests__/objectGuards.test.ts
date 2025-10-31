describe('objectGuards utilities', () => {
  test('ensureObject and safe wrappers handle null/undefined', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {
      ensureObject,
      safeObjectKeys,
      safeObjectEntries,
      safeObjectValues,
      safeObjectAssign,
      safeDestructure,
    } = require('../objectGuards');

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
