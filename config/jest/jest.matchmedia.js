// Robust matchMedia mock for Jest (framer-motion, Mantine, etc.)
class MediaQueryListMock {
  constructor(query) {
    this.matches = false;
    this.media = query;
    this.onchange = null;
  }
  addListener = jest.fn(); // Deprecated
  removeListener = jest.fn(); // Deprecated
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn();
}

const matchMediaMock = (query) => new MediaQueryListMock(query);

if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: matchMediaMock,
  });
}
if (typeof global !== "undefined") {
  Object.defineProperty(global, "matchMedia", {
    writable: true,
    configurable: true,
    value: matchMediaMock,
  });
}
