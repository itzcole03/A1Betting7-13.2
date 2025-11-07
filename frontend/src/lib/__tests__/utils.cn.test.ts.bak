import { cn } from '../../lib/utils';

describe('cn helper', () => {
  it('merges class names and returns a string', () => {
    const res = cn('foo', 'bar', 'baz');
    expect(typeof res).toBe('string');
    expect(res).toContain('foo');
    expect(res).toContain('bar');
    expect(res).toContain('baz');
  });
});
