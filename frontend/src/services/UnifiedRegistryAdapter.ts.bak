import { MasterServiceRegistry } from './MasterServiceRegistry';

/** Public-facing shape mirrors the external UnifiedServiceRegistry */
export type RegistryValue = unknown;

/**
 * Lightweight adapter that provides the public API expected by unified services.
 * Delegates calls to the central MasterServiceRegistry instance.
 */
export class UnifiedRegistryAdapter {
  // expose services map publicly to match external registry shape
  public services: Map<string, RegistryValue>;

  private registry: MasterServiceRegistry;

  constructor(registry: MasterServiceRegistry) {
    this.registry = registry;
    // Initialize public services map from the master registry
    this.services = new Map(this.registry.getAllServices());
  }

  register(name: string, service: RegistryValue): void {
    this.registry.registerService(name, service);
    this.services.set(name, service);
  }

  get<T = RegistryValue>(name: string): T | undefined {
    return (this.registry.getService<T>(name) as T) ?? undefined;
  }

  has(name: string): boolean {
    return this.registry.getAllServices().has(name);
  }

  unregister(name: string): boolean {
    const ok = this.registry.getAllServices().delete(name);
    this.services.delete(name);
    return ok;
  }

  getAllServices(): Map<string, RegistryValue> {
    return new Map(this.registry.getAllServices());
  }

  clear(): void {
    for (const k of Array.from(this.registry.getAllServices().keys())) {
      this.registry.registerService(k, undefined as unknown as RegistryValue);
      this.services.delete(k);
    }
  }
}

export default UnifiedRegistryAdapter;
