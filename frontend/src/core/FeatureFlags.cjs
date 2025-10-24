// Minimal FeatureFlags shim (CommonJS) for smoke tests
const flags = new Map();

function set(key, value) {
  flags.set(String(key), value);
}

function get(key) {
  return flags.get(String(key));
}

function isEnabled(key) {
  return !!flags.get(String(key));
}

module.exports = { set, get, isEnabled };
