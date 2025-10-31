import { _generateUniqueId } from '../../utils/helpers';

describe('helpers._generateUniqueId', () => {
  it('returns a string and is unique across calls', () => {
    const a = _generateUniqueId();
    const b = _generateUniqueId();
    expect(typeof a).toBe('string');
    expect(typeof b).toBe('string');
    expect(a).not.toBe(b);
  });
});
