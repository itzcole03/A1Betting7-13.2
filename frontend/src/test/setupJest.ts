// frontend/src/test/setupJest.ts
class LocalStorageMock implements Storage {
  private store: Record<string, string> = {};
  get length() {
    return Object.keys(this.store).length;
  }
  clear() {
    this.store = {};
  }
  getItem(key: string) {
    return this.store[key] || null;
  }
  setItem(key: string, value: string) {
    this.store[key] = value;
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  key(index: number) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}
/**
 * @jest-environment node
 * @jest-globals
 * @global
 * Globals: global, window, localStorage
 */

// @ts-expect-error: Assigning LocalStorageMock to global for Jest environment
if (typeof global !== 'undefined') {
  // @ts-expect-error: Assigning LocalStorageMock to global for Jest environment
  global.localStorage = new LocalStorageMock();
}
// @ts-expect-error: Assigning LocalStorageMock to window for browser environment
if (typeof window !== 'undefined') {
  // @ts-expect-error: Assigning LocalStorageMock to window for browser environment
  window.localStorage = new LocalStorageMock();
}
