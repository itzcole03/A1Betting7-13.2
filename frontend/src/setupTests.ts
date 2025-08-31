// Lightweight test setup for Jest + jsdom
// Note: jest-dom import removed from enhanced setup to avoid resolution issues in test harness
// - Provide a minimal getContext implementation to avoid jsdom "Not implemented: getContext" errors
// - Stub URL.createObjectURL to avoid errors in export CSV tests

// Provide a basic 2D context mock
if (typeof HTMLCanvasElement !== 'undefined' && !HTMLCanvasElement.prototype.getContext) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (HTMLCanvasElement.prototype as any).getContext = function (type: string) {
    if (type === '2d') {
      return {
        fillRect: () => {},
        clearRect: () => {},
        getImageData: (x: number, y: number, w: number, h: number) => ({ data: new Array(w * h * 4) }),
        putImageData: () => {},
        createImageData: () => [],
        setTransform: () => {},
        drawImage: () => {},
        save: () => {},
        fillText: () => {},
        restore: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        stroke: () => {},
        translate: () => {},
        scale: () => {},
        rotate: () => {},
        arc: () => {},
      };
    }
    return null;
  };
}

// Stub createObjectURL and revoke for tests
if (typeof URL !== 'undefined' && !URL.createObjectURL) {
  // @ts-ignore
  URL.createObjectURL = (blob: Blob) => 'blob://test';
  // @ts-ignore
  URL.revokeObjectURL = (url: string) => {};
}

// Silence console warnings from navigation/getContext in some jest environments
const _consoleWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const msg = String(args[0] ?? '');
  if (msg.includes('Not implemented: navigation') || msg.includes('Not implemented: HTMLCanvasElement.prototype.getContext')) {
    return;
  }
  _consoleWarn(...args);
};

// Suppress framer-motion DOM prop warnings in tests by filtering props
try {
  // @ts-ignore
  const originalCreateElement = document.createElement;
  // Wrap createElement to remove whileHover/whileTap attributes when added to DOM
  // This is a lightweight compatibility shim for framer-motion in jsdom tests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (document as any).createElement = function (tagName: string, options?: any) {
    const el = originalCreateElement.call(document, tagName, options);
    const originalSetAttribute = el.setAttribute.bind(el);
    el.setAttribute = function (name: string, value: string) {
      if (name === 'whilehover' || name === 'whiletap' || name === 'whileHover' || name === 'whileTap') {
        return;
      }
      return originalSetAttribute(name, value);
    };
    return el;
  };
} catch (e) {
  // ignore in environments we cannot patch
}

// Jest environment: mock navigation functions that jsdom doesn't implement
if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
  // Preserve original descriptors if present
  try {
    // Replace assign and reload with jest.fn() so tests can assert calls without throwing
    // @ts-ignore
    if (!window.location.assign || typeof window.location.assign !== 'function') {
      // @ts-ignore
      window.location.assign = (url: string) => {
        // mimic behavior: no-op in test
      };
    }
    // @ts-ignore
    if (!window.location.reload || typeof window.location.reload !== 'function') {
      // @ts-ignore
      window.location.reload = () => {
        // no-op in tests
      };
    }
  } catch (e) {
    // ignore modification errors in some environments
  }
}

// Helper to reset window.location mocks between tests (call from tests if needed)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const __resetLocationMocks = () => {
  try {
    // @ts-ignore
    if (window?.location?.assign && (window.location.assign as any).mockReset) (window.location.assign as any).mockReset();
    // @ts-ignore
    if (window?.location?.reload && (window.location.reload as any).mockReset) (window.location.reload as any).mockReset();
  } catch (_) {}
};

export {};
