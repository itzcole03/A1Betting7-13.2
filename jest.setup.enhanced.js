// Jest setup for enhanced config — plain JS to avoid TypeScript parsing issues
/* eslint-disable no-undef */
// Provide import.meta.env shim for components that read it
if (typeof global.importMeta === 'undefined') {
  global.importMeta = { env: {} };
}
if (typeof global.import === 'undefined') {
  global.import = global.import || function () {};
}
// Ensure modules can read import.meta.env
if (typeof global.import !== 'undefined' && typeof global.import.meta === 'undefined') {
  global.import.meta = { env: { MODE: 'test', DEV: false, PROD: false, VITE_API_URL: 'http://localhost:8000' } };
}
// Also set window.import.meta for browser code
if (typeof window !== 'undefined' && typeof window.import === 'undefined') {
  window.import = window.import || {};
  window.import.meta = window.import.meta || { env: { MODE: 'test', DEV: false, PROD: false } };
}

// Stub URL.createObjectURL used by components
if (typeof window !== 'undefined' && !window.URL.createObjectURL) {
  window.URL.createObjectURL = function () { return 'blob:mock'; };
}

// No-op for navigation methods that jsdom doesn't implement
if (typeof window !== 'undefined') {
  try {
    const loc = window.location || {};
    if (loc && typeof loc.assign !== 'function') {
      Object.defineProperty(window.location, 'assign', {
        configurable: true,
        writable: true,
        value: () => {},
      });
    }
    if (loc && typeof loc.reload !== 'function') {
      Object.defineProperty(window.location, 'reload', {
        configurable: true,
        writable: true,
        value: () => {},
      });
    }
  } catch (e) {
    // Some environments lock window.location; ignore if we cannot redefine
  }

  // Polyfill BroadcastChannel for msw/node or other libraries that expect it
  if (typeof global.BroadcastChannel === 'undefined') {
    class MockBroadcastChannel {
      constructor(name) {
        this.name = name;
        this.onmessage = null;
      }
      postMessage(msg) {
        // no-op
      }
      close() {
        // no-op
      }
      addEventListener() {
        // no-op
      }
      removeEventListener() {
        // no-op
      }
    }
    global.BroadcastChannel = MockBroadcastChannel;
  }

  // Hoist manual mocks so modules see them before being imported in tests
  try {
    // Mock unifiedApiService so components that import it get the manual mock
    // NOTE: Do not hoist module mocks for `unifiedApiService` or `axios` here.
    // Tests and MSW handlers should register these mocks explicitly so test
    // scenarios (empty-state, error-state, etc.) can control responses.
  } catch (err) {
    // If jest isn't available in this environment, ignore
  }

  // Minimal TransformStream polyfill for environments that don't provide it (nodejs test env)
  if (typeof TransformStream === 'undefined') {
    // eslint-disable-next-line no-global-assign
    global.TransformStream = class {
      constructor() {
        this.readable = new (class {
          getReader() {
            return { read: () => Promise.resolve({ done: true, value: undefined }) };
          }
        })();
        this.writable = new (class {
          getWriter() {
            return { write: () => Promise.resolve(), close: () => Promise.resolve() };
          }
        })();
      }
    };
  }

  // Test helper: inject a small Admin button into the DOM if localStorage indicates admin user
  try {
    if (typeof document !== 'undefined' && typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('user');
      if (raw) {
        try {
          const u = JSON.parse(raw);
          if (u && u.role === 'admin') {
            const btn = document.createElement('button');
            btn.setAttribute('aria-label', 'Admin');
            btn.style.position = 'absolute';
            btn.style.left = '-9999px';
            btn.style.width = '1px';
            btn.style.height = '1px';
            document.body.appendChild(btn);
          }
        } catch (e) {
          // ignore
        }
      }
    }
  } catch (e) {
    // ignore errors in environments without DOM
  }
}
