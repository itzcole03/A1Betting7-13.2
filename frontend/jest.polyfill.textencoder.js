// TextEncoder/TextDecoder polyfill for Jest

const { TextEncoder, TextDecoder } = require('util');

// Make TextEncoder and TextDecoder available globally
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// Additional polyfills that might be needed
if (typeof global.ReadableStream === 'undefined') {
  const { ReadableStream } = require('web-streams-polyfill');
  global.ReadableStream = ReadableStream;
}

if (typeof global.WritableStream === 'undefined') {
  const { WritableStream } = require('web-streams-polyfill');
  global.WritableStream = WritableStream;
}

if (typeof global.TransformStream === 'undefined') {
  const { TransformStream } = require('web-streams-polyfill');
  global.TransformStream = TransformStream;
}
