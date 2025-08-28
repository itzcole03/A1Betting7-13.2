// Lightweight test shim for jsdom: provide HTMLCanvasElement.getContext and URL stubs
// Keep this file plain JS to avoid TypeScript/ESLint import-time rules during Jest setup

// Provide a minimal 2D context mock so Chart.js-based components can call getContext safely.
if (typeof HTMLCanvasElement !== 'undefined' && !HTMLCanvasElement.prototype.getContext) {
  HTMLCanvasElement.prototype.getContext = function (type) {
    if (type === '2d') {
      return {
        fillRect: () => {},
        clearRect: () => {},
        getImageData: (x, y, w, h) => ({ data: new Array(w * h * 4) }),
        putImageData: () => {},
        createImageData: () => [],
        setTransform: () => {},
        drawImage: () => {},
        save: () => {},
        rotate: () => {},
        translate: () => {},
        scale: () => {},
        measureText: () => ({ width: 0 }),
        transform: () => {},
        fillText: () => {},
      };
    }
    return null;
  };
}

// Stub URL.createObjectURL for CSV/download tests
if (typeof URL !== 'undefined' && !URL.createObjectURL) {
  URL.createObjectURL = function () {
    return 'blob:fake-url';
  };
  URL.revokeObjectURL = function () {};
}

// Deterministic performance & navigation entries for tests that read performance API
if (typeof performance !== 'undefined') {
  // Ensure navigation entries exist for code that reads performance.getEntriesByType('navigation')[0]
  try {
    // Force a safe implementation that returns an array for 'navigation'
    performance.getEntriesByType = function (type) {
      if (type === 'navigation') return [{ type: 'navigate', startTime: 0, entryType: 'navigation' }];
      // For other types, return an empty array (safe default)
      return [];
    };
  } catch (err) {
    // ignore when performance is immutable in some environments
  }

  // Provide a deterministic performance.now for tests (monotonic counter)
  // Only override if not already mocked by tests
  if (typeof performance.now === 'function' && !performance.now.__jestMocked) {
    let _counter = 1000;
    const origNow = performance.now.bind(performance);
    performance.now = () => {
      _counter += 50; // increment by 50ms per call
      return _counter;
    };
    // keep a reference to original if needed by other libs
    performance.__origNow = origNow;
  }
}

// Minimal deterministic Date.now shim for tests that expect stable timestamps
if (typeof Date !== 'undefined' && typeof Date.now === 'function') {
  const origDateNow = Date.now.bind(Date);
  let _base = origDateNow();
  Date.now = () => {
    _base += 50;
    return _base;
  };
  Date.__origNow = origDateNow;
}

// Lightweight WebSocket mock used by tests that access internal handlers
if (typeof global !== 'undefined' && typeof global.WebSocket === 'undefined') {
  class MockWebSocket {
    constructor(url) {
      this.url = url;
      this.readyState = 0; // CONNECTING
      this._listeners = {};
      // Expose hooks used in tests as functions
      this._onopen = () => {};
      this._onclose = () => {};
      this._onerror = () => {};
      this._onmessage = () => {};

      // simulate immediate open
      setTimeout(() => {
        this.readyState = 1; // OPEN
        if (typeof this._onopen === 'function') this._onopen({ type: 'open' });
        this._emit('open', { type: 'open' });
      }, 0);
    }

    send(data) {
      // echo for tests
      setTimeout(() => this._emit('message', { data }), 0);
    }

    close(code = 1000, reason = '') {
      this.readyState = 3; // CLOSED
      if (typeof this._onclose === 'function') this._onclose({ code, reason, wasClean: true });
      this._emit('close', { code, reason });
    }

    addEventListener(event, cb) {
      (this._listeners[event] = this._listeners[event] || []).push(cb);
    }

    removeEventListener(event, cb) {
      if (!this._listeners[event]) return;
      this._listeners[event] = this._listeners[event].filter((f) => f !== cb);
    }

    _emit(event, payload) {
      (this._listeners[event] || []).forEach((cb) => cb(payload));
    }
  }

  global.WebSocket = MockWebSocket;
}

// Mock localStorage for tests that expect client ID persistence
if (typeof global !== 'undefined' && typeof global.localStorage === 'undefined') {
  const localStorageMock = {
    store: {},
    getItem(key) {
      return this.store[key] || null;
    },
    setItem(key, value) {
      this.store[key] = value.toString();
    },
    removeItem(key) {
      delete this.store[key];
    },
    clear() {
      this.store = {};
    }
  };
  global.localStorage = localStorageMock;
}

// Silence specific jsdom warnings that pollute test logs
if (typeof global !== 'undefined' && global.console) {
  const _warn = global.console.warn;
  const _error = global.console.error;
  const _log = global.console.log;
  
  global.console.warn = (...args) => {
    const msg = args[0] || '';
    if (typeof msg === 'string' && msg.includes('Not implemented: HTMLCanvasElement.prototype.getContext')) {
      return;
    }
    return _warn.apply(global.console, args);
  };
  
  global.console.error = (...args) => {
    // Allow all error messages through but ensure they don't break the test
    return _error.apply(global.console, args);
  };
  
  global.console.log = (...args) => {
    // Allow all log messages through
    return _log.apply(global.console, args);
  };
}
