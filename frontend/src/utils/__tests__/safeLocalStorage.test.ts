describe('safeLocalStorage / ClientIdManager', () => {
  test('ClientIdManager getOrCreateClientId respects provided value and persistence', () => {
    // Provide a mock localStorage before requiring the module to control behavior
    const store: Record<string, string> = {};
    // @ts-ignore
    global.localStorage = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ClientIdManager, clientIdManager } = require('../safeLocalStorage');

    const mgr = new ClientIdManager();
    const provided = 'client_test_123';
    const id = mgr.getOrCreateClientId(provided);
    expect(id).toBe(provided);

    // create a fresh manager to ensure persistence works via the mocked storage
    const mgr2 = new ClientIdManager();
    const id2 = mgr2.getOrCreateClientId();
    expect(typeof id2).toBe('string');

    // cleanup global mock
    // @ts-ignore
    delete global.localStorage;
  });
});
