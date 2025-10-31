describe('safeEnvironment', () => {
  test('getWebSocketUrl and isTestEnvironment behave with mocked env', () => {
    // Set NODE_ENV to test and JEST_WORKER_ID to simulate test env before require
    const oldNode = process.env.NODE_ENV;
    const oldJest = process.env.JEST_WORKER_ID;
    process.env.NODE_ENV = 'test';
    process.env.JEST_WORKER_ID = '1';

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { safeEnvironment, SafeEnvironment } = require('../safeEnvironment');

    expect(typeof safeEnvironment.getWebSocketUrl()).toBe('string');
    expect(safeEnvironment.isTestEnvironment()).toBe(true);

    // Reinitialize to ensure reinitialize doesn't throw
    safeEnvironment.reinitialize();

    // restore
    if (oldNode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = oldNode;
    if (oldJest === undefined) delete process.env.JEST_WORKER_ID;
    else process.env.JEST_WORKER_ID = oldJest;
  });
});
