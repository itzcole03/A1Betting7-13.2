import { safeDestructure, safeObjectAssign, safeObjectEntries, safeSpread } from '../objectGuards';

describe('objectGuards additional behaviors', () => {
  test('safeSpread returns a safe object when passed null/objects', () => {
    const a = { x: 1 };
    const res = safeSpread(a);
    expect(res.x).toBe(1);
    const empty = safeSpread(null);
    expect(typeof empty).toBe('object');
  });

  test('safeObjectAssign shallow-assigns sources onto target', () => {
    const res = safeObjectAssign({ a: { b: 1 } }, { a: { c: 2 } });
    // shallow assign replaces nested object a with the source's a
    expect(res.a.c).toBe(2);
    expect(res.a.b).toBeUndefined();
  });

  test('safeDestructure falls back to defaults', () => {
    const out = safeDestructure<{ foo: string; nested: { n: number } }>(null, {
      foo: 'bar',
      nested: { n: 1 },
    });
    expect(out.foo).toBe('bar');
    expect(out.nested.n).toBe(1);
  });

  test('safeObjectEntries returns entries for objects and empty for non-objects', () => {
    expect(safeObjectEntries({ a: 1 }).length).toBeGreaterThan(0);
    expect(safeObjectEntries(null)).toEqual([]);
  });
});
