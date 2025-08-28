// Lightweight test setup for Jest + jsdom
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

export {};
