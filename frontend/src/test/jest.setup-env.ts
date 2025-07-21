// Polyfill TextEncoder and TextDecoder before any other code
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'TextEncode... Remove this comment to see the full error message
import { TextDecoder, TextEncoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
