// Enhanced Jest Polyfills for Phase 4 Testing
const { TextEncoder, TextDecoder } = require('util');

// Text Encoding API polyfill
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Uint8Array polyfill
global.Uint8Array = global.Uint8Array || Array;

// ArrayBuffer polyfill
if (typeof global.ArrayBuffer === 'undefined') {
  global.ArrayBuffer = Array;
}

// Blob polyfill
global.Blob = global.Blob || class Blob {
  constructor(parts = [], options = {}) {
    this.parts = parts;
    this.type = options.type || '';
    this.size = parts.reduce((acc, part) => acc + (part.length || 0), 0);
  }
  
  slice(start = 0, end = this.size, contentType = '') {
    return new Blob(this.parts.slice(start, end), { type: contentType });
  }
  
  text() {
    return Promise.resolve(this.parts.join(''));
  }
  
  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(this.size));
  }
  
  stream() {
    return {
      getReader() {
        return {
          read() {
            return Promise.resolve({ done: true, value: undefined });
          },
        };
      },
    };
  }
};

// URL polyfill
if (typeof global.URL === 'undefined') {
  global.URL = class URL {
    constructor(url, base) {
      this.href = url;
      this.origin = 'http://localhost:3000';
      this.protocol = 'http:';
      this.host = 'localhost:3000';
      this.hostname = 'localhost';
      this.port = '3000';
      this.pathname = '/';
      this.search = '';
      this.hash = '';
    }
    
    toString() {
      return this.href;
    }
    
    static createObjectURL() {
      return 'blob:mock-url';
    }
    
    static revokeObjectURL() {
      // Mock implementation
    }
  };
}

// URLSearchParams polyfill
if (typeof global.URLSearchParams === 'undefined') {
  global.URLSearchParams = class URLSearchParams {
    constructor(init = '') {
      this.params = new Map();
      if (typeof init === 'string') {
        init.split('&').forEach(pair => {
          const [key, value] = pair.split('=');
          if (key) this.params.set(decodeURIComponent(key), decodeURIComponent(value || ''));
        });
      }
    }
    
    append(name, value) {
      this.params.set(name, value);
    }
    
    delete(name) {
      this.params.delete(name);
    }
    
    get(name) {
      return this.params.get(name);
    }
    
    has(name) {
      return this.params.has(name);
    }
    
    set(name, value) {
      this.params.set(name, value);
    }
    
    toString() {
      const pairs = [];
      for (const [key, value] of this.params) {
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
      return pairs.join('&');
    }
  };
}

// Headers polyfill
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init = {}) {
      this.headers = new Map();
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      }
    }
    
    append(name, value) {
      this.headers.set(name.toLowerCase(), value);
    }
    
    delete(name) {
      this.headers.delete(name.toLowerCase());
    }
    
    get(name) {
      return this.headers.get(name.toLowerCase());
    }
    
    has(name) {
      return this.headers.has(name.toLowerCase());
    }
    
    set(name, value) {
      this.headers.set(name.toLowerCase(), value);
    }
    
    forEach(callback) {
      this.headers.forEach((value, key) => callback(value, key, this));
    }
    
    *[Symbol.iterator]() {
      for (const [key, value] of this.headers) {
        yield [key, value];
      }
    }
  };
}

// Request polyfill
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init.method || 'GET';
      this.headers = new Headers(init.headers);
      this.body = init.body || null;
      this.mode = init.mode || 'cors';
      this.credentials = init.credentials || 'same-origin';
      this.cache = init.cache || 'default';
      this.redirect = init.redirect || 'follow';
      this.referrer = init.referrer || '';
      this.integrity = init.integrity || '';
    }
    
    clone() {
      return new Request(this.url, {
        method: this.method,
        headers: this.headers,
        body: this.body,
        mode: this.mode,
        credentials: this.credentials,
        cache: this.cache,
        redirect: this.redirect,
        referrer: this.referrer,
        integrity: this.integrity,
      });
    }
  };
}

// Response polyfill
if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body = null, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new Headers(init.headers);
      this.ok = this.status >= 200 && this.status < 300;
      this.redirected = false;
      this.type = 'basic';
      this.url = '';
    }
    
    clone() {
      return new Response(this.body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers,
      });
    }
    
    async json() {
      return JSON.parse(this.body || '{}');
    }
    
    async text() {
      return this.body || '';
    }
    
    async blob() {
      return new Blob([this.body || '']);
    }
    
    async arrayBuffer() {
      return new ArrayBuffer(0);
    }
    
    static error() {
      return new Response(null, { status: 0, statusText: '' });
    }
    
    static redirect(url, status = 302) {
      return new Response(null, { status, headers: { Location: url } });
    }
  };
}

// FormData polyfill
if (typeof global.FormData === 'undefined') {
  global.FormData = class FormData {
    constructor() {
      this.data = new Map();
    }
    
    append(name, value, filename) {
      this.data.set(name, { value, filename });
    }
    
    delete(name) {
      this.data.delete(name);
    }
    
    get(name) {
      return this.data.get(name)?.value;
    }
    
    has(name) {
      return this.data.has(name);
    }
    
    set(name, value, filename) {
      this.data.set(name, { value, filename });
    }
    
    *[Symbol.iterator]() {
      for (const [key, { value }] of this.data) {
        yield [key, value];
      }
    }
  };
}

// AbortController polyfill
if (typeof global.AbortController === 'undefined') {
  global.AbortController = class AbortController {
    constructor() {
      this.signal = {
        aborted: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };
    }
    
    abort() {
      this.signal.aborted = true;
    }
  };
}

// MessageChannel polyfill
if (typeof global.MessageChannel === 'undefined') {
  global.MessageChannel = class MessageChannel {
    constructor() {
      this.port1 = {
        postMessage: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        start: jest.fn(),
        close: jest.fn(),
      };
      this.port2 = {
        postMessage: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        start: jest.fn(),
        close: jest.fn(),
      };
    }
  };
}

// CustomEvent polyfill
if (typeof global.CustomEvent === 'undefined') {
  global.CustomEvent = class CustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
      this.bubbles = options.bubbles || false;
      this.cancelable = options.cancelable || false;
      this.composed = options.composed || false;
    }
  };
}

// Event polyfill
if (typeof global.Event === 'undefined') {
  global.Event = class Event {
    constructor(type, options = {}) {
      this.type = type;
      this.bubbles = options.bubbles || false;
      this.cancelable = options.cancelable || false;
      this.composed = options.composed || false;
      this.defaultPrevented = false;
      this.eventPhase = 0;
      this.isTrusted = false;
      this.timeStamp = Date.now();
    }
    
    preventDefault() {
      this.defaultPrevented = true;
    }
    
    stopPropagation() {
      // Mock implementation
    }
    
    stopImmediatePropagation() {
      // Mock implementation
    }
  };
}

// Worker polyfill
if (typeof global.Worker === 'undefined') {
  global.Worker = class Worker {
    constructor(scriptURL) {
      this.scriptURL = scriptURL;
      this.onmessage = null;
      this.onerror = null;
    }
    
    postMessage(message) {
      // Mock implementation
    }
    
    terminate() {
      // Mock implementation
    }
    
    addEventListener(type, listener) {
      // Mock implementation
    }
    
    removeEventListener(type, listener) {
      // Mock implementation
    }
  };
}
