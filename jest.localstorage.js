console.log("jest.localstorage.js executed");
// jest.localstorage.js
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  clear() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = value;
  }
  removeItem(key) {
    delete this.store[key];
  }
  key(index) {
    return Object.keys(this.store)[index] || null;
  }
  get length() {
    return Object.keys(this.store).length;
  }
}
const sharedLocalStorage = new LocalStorageMock();
if (typeof global !== "undefined") {
  global.localStorage = sharedLocalStorage;
}
if (typeof window !== "undefined") {
  window.localStorage = sharedLocalStorage;
}
