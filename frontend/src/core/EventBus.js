// CommonJS shim for Jest resolution. Lightweight EventBus for tests.
class EventBus {
  constructor() {
    this.handlers = new Map();
  }
  on(event, handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event).add(handler);
  }
  off(event, handler) {
    if (!this.handlers.has(event)) return;
    if (handler) this.handlers.get(event).delete(handler);
    else this.handlers.set(event, new Set());
  }
  emit(event, ...args) {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const h of Array.from(set)) {
      try { h(...args); } catch (e) { /* swallow */ }
    }
  }
}

const _eventBus = new EventBus();

module.exports = { EventBus, _eventBus };
