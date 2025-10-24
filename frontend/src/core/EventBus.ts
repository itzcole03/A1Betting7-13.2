// Lightweight EventBus used by shims and utilities. Provides simple pub/sub helpers.
type Handler = (...args: unknown[]) => void | Promise<void>;

interface HandlerEntry {
  original: Handler;
  invoke: Handler;
  once: boolean;
  signal?: AbortSignal;
  abortListener?: () => void;
}

interface SubscribeOptions {
  signal?: AbortSignal;
  once?: boolean;
}

class EventBus {
  private static instance: EventBus | null = null;
  private handlers: Map<string, Set<HandlerEntry>> = new Map();

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on(event: string, handler: Handler, options: SubscribeOptions = {}): () => void {
    const { signal, once } = options;

    if (signal?.aborted) {
      return () => {
        /* noop - listener never registered */
      };
    }

    const entries = this.getOrCreateEntries(event);

    const entry: HandlerEntry = {
      original: handler,
      invoke: handler,
      once: Boolean(once),
    };

    if (once) {
      entry.invoke = (...args: unknown[]) => {
        this.off(event, handler);
        return handler(...args);
      };
    }

    if (signal) {
      const abortListener = (): void => {
        this.off(event, handler);
      };
      signal.addEventListener('abort', abortListener, { once: true });
      entry.signal = signal;
      entry.abortListener = abortListener;
    }

    entries.add(entry);
    return () => this.off(event, handler);
  }

  subscribe(event: string, handler: Handler, options: SubscribeOptions = {}): () => void {
    return this.on(event, handler, options);
  }

  off(event: string, handler?: Handler): void {
    const entries = this.handlers.get(event);
    if (!entries) return;

    if (handler) {
      let removed = false;
      for (const entry of Array.from(entries)) {
        if (entry.original === handler) {
          this.detachAbort(entry);
          entries.delete(entry);
          removed = true;
        }
      }
      if (removed && entries.size === 0) {
        this.handlers.delete(event);
      }
      return;
    }

    for (const entry of entries) {
      this.detachAbort(entry);
    }
    this.handlers.delete(event);
  }

  emit(event: string, ...args: unknown[]): void {
    const entries = this.handlers.get(event);
    if (!entries) return;
    for (const entry of Array.from(entries)) {
      try {
        const result = entry.invoke(...args);
        if (result && typeof (result as Promise<unknown>).then === 'function') {
          (result as Promise<unknown>).catch(() => undefined);
        }
      } catch {
        // swallow errors during tests
      }
    }
  }

  async emitAsync(event: string, ...args: unknown[]): Promise<void> {
    const entries = this.handlers.get(event);
    if (!entries) return;
    for (const entry of Array.from(entries)) {
      try {
        await entry.invoke(...args);
      } catch {
        // swallow errors during tests
      }
    }
  }

  async publish(
    event: string | { type: string; payload?: unknown },
    payload?: unknown
  ): Promise<void> {
    const type = typeof event === 'string' ? event : event.type;
    const data = typeof event === 'string' ? payload : event.payload ?? payload;
    await this.emitAsync(type, data);
  }

  cleanup(event?: string): void {
    if (typeof event === 'string') {
      this.clearEvent(event);
      return;
    }
    for (const key of Array.from(this.handlers.keys())) {
      this.clearEvent(key);
    }
  }

  reset(): void {
    this.cleanup();
  }

  listenerCount(event?: string): number {
    if (typeof event === 'string') {
      return this.handlers.get(event)?.size ?? 0;
    }
    let total = 0;
    for (const set of this.handlers.values()) {
      total += set.size;
    }
    return total;
  }

  hasListeners(event?: string): boolean {
    if (typeof event === 'string') {
      return this.listenerCount(event) > 0;
    }
    return this.listenerCount() > 0;
  }

  private getOrCreateEntries(event: string): Set<HandlerEntry> {
    let entries = this.handlers.get(event);
    if (!entries) {
      entries = new Set();
      this.handlers.set(event, entries);
    }
    return entries;
  }

  private clearEvent(event: string): void {
    const entries = this.handlers.get(event);
    if (!entries) return;
    for (const entry of entries) {
      this.detachAbort(entry);
    }
    this.handlers.delete(event);
  }

  private detachAbort(entry: HandlerEntry): void {
    if (entry.signal && entry.abortListener) {
      try {
        entry.signal.removeEventListener('abort', entry.abortListener);
      } catch {
        // ignore removal issues
      }
    }
  }
}

const _eventBus = EventBus.getInstance();

export { EventBus, _eventBus };
export default _eventBus;
