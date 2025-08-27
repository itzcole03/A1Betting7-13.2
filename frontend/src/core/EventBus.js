// Lightweight EventBus used in the frontend. This file uses pure ESM exports
// so Vite/dev server and the browser can import named exports reliably.
export class EventBus {
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
      try { h(...args); } catch (err) { void err; }
    }
  }
}

export const _eventBus = new EventBus();

// Default export for convenience
export default _eventBus;
