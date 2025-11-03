import { formatDateTime, formatRelativeTime } from '../timeUtils';

describe('timeUtils formatting', () => {
  test('formatRelativeTime for just now and minutes ago', () => {
    const justNow = Date.now();
    expect(formatRelativeTime(justNow)).toMatch(/(just now|seconds ago|minutes ago)/);

    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    expect(formatRelativeTime(tenMinutesAgo)).toMatch(/10 .*minutes ago/);

    const dt = new Date(2020, 0, 1, 12, 0, 0);
    const formatted = formatDateTime(dt);
    expect(typeof formatted).toBe('string');
  });
});
