// Minimal UnifiedLogger runtime shim (CommonJS)
function formatMessage(level, component, message, meta) {
  const ts = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${ts}] [${level}] [${component}] ${message}${metaStr}`;
}

function getLogger(component = 'app') {
  return {
    info: (msg, meta) => console.log(formatMessage('INFO', component, msg, meta)),
    warn: (msg, meta) => console.warn(formatMessage('WARN', component, msg, meta)),
    error: (msg, meta) => console.error(formatMessage('ERROR', component, msg, meta)),
    debug: (msg, meta) => console.debug(formatMessage('DEBUG', component, msg, meta)),
  };
}

module.exports = { getLogger };
