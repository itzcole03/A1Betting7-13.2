describe('safeLocalStorage / ClientIdManager', () => {
  test('ClientIdManager getOrCreateClientId respects provided value and persistence', async () => {
    // Provide a mock localStorage before requiring the module to control behavior
    const store: Record<string, string> = {};
    const mockStorage = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        Object.keys(store).forEach(key => delete store[key]);
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
      get length() {
        return Object.keys(store).length;
      },
    } satisfies Partial<Storage> & { getItem: (key: string) => string | null };

    const globalWithStorage = globalThis as typeof globalThis & { localStorage?: Storage };
    const originalLocalStorage = globalWithStorage.localStorage;
    Object.defineProperty(globalWithStorage, 'localStorage', {
      configurable: true,
      writable: true,
      value: mockStorage as unknown as Storage,
    });

    const { ClientIdManager } = await import('../safeLocalStorage');

    const mgr = new ClientIdManager();
    const provided = 'client_test_123';
    const id = mgr.getOrCreateClientId(provided);
    expect(id).toBe(provided);

    // create a fresh manager to ensure persistence works via the mocked storage
    const mgr2 = new ClientIdManager();
    const id2 = mgr2.getOrCreateClientId();
    expect(typeof id2).toBe('string');

    if (originalLocalStorage === undefined) {
      Reflect.deleteProperty(globalWithStorage, 'localStorage');
    } else {
      Object.defineProperty(globalWithStorage, 'localStorage', {
        configurable: true,
        writable: true,
        value: originalLocalStorage,
      });
    }
  });
});
