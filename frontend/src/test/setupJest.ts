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
// @ts-ignore
if (typeof global !== 'undefined') {
  // @ts-ignore
  global.localStorage = new LocalStorageMock();
}
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.localStorage = new LocalStorageMock();
}
