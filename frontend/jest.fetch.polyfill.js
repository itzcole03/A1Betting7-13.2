// Polyfill global.fetch and globalThis.fetch for Jest (Node 18+ and jsdom) using node-fetch v2 (CommonJS)
const fetch = require('node-fetch');
global.fetch = fetch;
global.Request = fetch.Request;
global.Response = fetch.Response;
globalThis.fetch = fetch;
globalThis.Request = fetch.Request;
globalThis.Response = fetch.Response;
