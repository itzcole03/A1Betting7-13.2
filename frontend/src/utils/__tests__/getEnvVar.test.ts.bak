import { getEnvVar } from '../../utils/getEnvVar';

describe('getEnvVar', () => {
  it('reads from process.env when present and falls back otherwise', () => {
    process.env.TEST_ENV_VAR = 'hello-world';
    expect(getEnvVar('TEST_ENV_VAR', 'fallback')).toBe('hello-world');
    delete process.env.TEST_ENV_VAR;
    expect(getEnvVar('MISSING_KEY', 'fallback')).toBe('fallback');
  });
});
