// IPC input validation utility
const logger = require('./logger');

function validateIPCInput(schema, input) {
  for (const key in schema) {
    if (!(key in input)) {
      logger.warn('IPC validation failed: missing key', { key, input });
      return false;
    }
    if (typeof input[key] !== schema[key]) {
      logger.warn('IPC validation failed: type mismatch', {
        key,
        expected: schema[key],
        actual: typeof input[key],
        input,
      });
      return false;
    }
  }
  return true;
}

module.exports = { validateIPCInput };
