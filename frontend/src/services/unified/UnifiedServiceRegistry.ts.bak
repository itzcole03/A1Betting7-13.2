/**
 * Unified Service Registry
 * Central registry for managing service instances and dependencies
 */

export class UnifiedServiceRegistry {
  private static instance: UnifiedServiceRegistry;
  public services: Map<string, any> = new Map();
  private events: Map<string, Set<(...args: unknown[]) => void>> = new Map();

  private constructor() {}

  static getInstance(): UnifiedServiceRegistry {
    if (!UnifiedServiceRegistry.instance) {
      UnifiedServiceRegistry.instance = new UnifiedServiceRegistry();
    }
    return UnifiedServiceRegistry.instance;
  }

  register(name: string, service: any): void {
    this.services.set(name, service);
    this.emit('register', { name, service });
  }

  get<T>(name: string): T | undefined {
    return this.services.get(name) as T;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }

  unregister(name: string): boolean {
    const existed = this.services.delete(name);
    if (existed) {
      this.emit('unregister', { name });
    }
    return existed;
  }

  getAllServices(): Map<string, any> {
    return new Map(this.services);
  }

  clear(): void {
    this.services.clear();
    this.emit('clear');
  }

  on(event: string, listener: (...args: unknown[]) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(listener);
  }

  off(event: string, listener: (...args: unknown[]) => void): void {
    const listeners = this.events.get(event);
    if (!listeners) {
      return;
    }
    listeners.delete(listener);
    if (listeners.size === 0) {
      this.events.delete(event);
    }
  }

  emit(event: string, ...args: unknown[]): void {
    const listeners = this.events.get(event);
    if (!listeners) {
      return;
    }

    // Copy to prevent mutation during iteration;
    const snapshot = Array.from(listeners);
    for (const listener of snapshot) {
      try {
        listener(...args);
      } catch {
        // Intentionally swallow listener errors to prevent cascading failures;
      }
    }
  }

  once(event: string, listener: (...args: unknown[]) => void): void {
    const wrapper = (...args: unknown[]) => {
      this.off(event, wrapper);
      listener(...args);
    };
    this.on(event, wrapper);
  }
}

export default UnifiedServiceRegistry;
