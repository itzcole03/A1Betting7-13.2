// Minimal in-memory UnifiedCache shim (CommonJS)
const store = new Map();

function nowMs() {
  return Date.now();
}

function set(key, value, ttlMs) {
  const expires = ttlMs ? nowMs() + Number(ttlMs) : null;
  store.set(String(key), { value, expires });
}

function get(key) {
  const e = store.get(String(key));
  if (!e) return undefined;
  if (e.expires && nowMs() > e.expires) {
    store.delete(String(key));
    return undefined;
  }
  return e.value;
}

function has(key) {
  return get(key) !== undefined;
}

function del(key) {
  return store.delete(String(key));
}

function clear() {
  store.clear();
}

module.exports = { set, get, has, delete: del, del, clear, size: () => store.size };
