// Centralized DB error handler for Knex/SQLite
const logger = require('./logger');

function handleDbError(error, context = {}) {
  logger.error('DB Error: %s', error.message, {
    stack: error.stack,
    ...context,
  });
  // Optionally, add retry logic or custom error codes here
  return {
    code: 'DB_ERROR',
    message: error.message,
    details: context,
  };
}

module.exports = handleDbError;
