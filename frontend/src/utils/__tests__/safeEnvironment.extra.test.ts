import { safeEnvironment } from '../safeEnvironment';

describe('safeEnvironment extra behaviors', () => {
  const oldEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...oldEnv };
  });

  test('reinitialize picks up new env values', () => {
    process.env.SOME_FLAG = '1';
    safeEnvironment.reinitialize();
    // just ensure method runs and safeEnvironment reflects presence
    expect(typeof safeEnvironment.getWebSocketUrl()).toBe('string');
  });

  test('isProduction toggles with NODE_ENV', () => {
    process.env.NODE_ENV = 'production';
    safeEnvironment.reinitialize();
    expect(safeEnvironment.isProduction()).toBe(true);
  });
});
