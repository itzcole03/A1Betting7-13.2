describe('constants (smoke)', () => {
  test('basic constants are exported', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const constants = require('../constants');

    expect(constants).toBeDefined();
    expect(typeof constants._APP_NAME).toBe('string');
    expect(typeof constants._DEFAULT_THEME).toBe('string');
    expect(typeof constants._MAX_PARLAY_LEGS).toBe('number');
  });
});

describe('constants', () => {
  // Use require to avoid duplicate-declaration when test environment
  // sets up mocks before module load.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { _APP_NAME, _DEFAULT_THEME, _MAX_PARLAY_LEGS } = require('../constants');

  test('exports expected app constants', () => {
    expect(typeof _APP_NAME).toBe('string');
    expect(_APP_NAME.length).toBeGreaterThan(0);

    expect(typeof _DEFAULT_THEME).toBe('string');
    expect(['dark', 'light']).toContain(_DEFAULT_THEME);

    expect(typeof _MAX_PARLAY_LEGS).toBe('number');
    expect(_MAX_PARLAY_LEGS).toBeGreaterThanOrEqual(1);
  });
});
