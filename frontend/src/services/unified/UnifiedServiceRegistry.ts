/**
 * Unified Service Registry
 * Central registry for managing service instances and dependencies
 */

export class UnifiedServiceRegistry {
  private static instance: UnifiedServiceRegistry;
  private services: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): UnifiedServiceRegistry {
    if (!UnifiedServiceRegistry.instance) {
      UnifiedServiceRegistry.instance = new UnifiedServiceRegistry();
    }
    return UnifiedServiceRegistry.instance;
  }

  register(name: string, service: any): void {
    this.services.set(name, service);
  }

  get<T>(name: string): T | undefined {
    return this.services.get(name) as T;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }

  unregister(name: string): boolean {
    return this.services.delete(name);
  }

  getAllServices(): Map<string, any> {
    return new Map(this.services);
  }

  clear(): void {
    this.services.clear();
  }
}

export default UnifiedServiceRegistry;
