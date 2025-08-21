// Minimal EventBus used by tests. Provides on/off/emit for simple mocking.
type Handler = (...args: unknown[]) => void;

class EventBus {
  private handlers: Map<string, Set<Handler>> = new Map();

  on(event: string, handler: Handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler?: Handler) {
    if (!this.handlers.has(event)) return;
    if (handler) this.handlers.get(event)!.delete(handler);
    else this.handlers.set(event, new Set());
  }

  emit(event: string, ...args: unknown[]) {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const h of Array.from(set)) {
      try {
        h(...args);
      } catch {
        // swallow errors during tests
      }
    }
  }
}

const _eventBus = new EventBus();

export { EventBus, _eventBus };
export default _eventBus;
