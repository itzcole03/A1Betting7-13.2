/**
 * Minimal MasterServiceRegistry
 * - Keeps API surface used across the frontend
 * - Uses `any` for external service types to avoid large refactors
 * - Uses `enhancedLogger` for logging
 */

import { enhancedLogger } from '../utils/enhancedLogger';
// UnifiedServiceRegistryExternal import removed: we return a loose `unknown`
// adapter from `toUnifiedRegistry()` to avoid private-constructor type errors.
import UnifiedRegistryAdapter from './UnifiedRegistryAdapter';

// Local interface matching the public surface of the external
// `UnifiedServiceRegistry` class. Using an interface avoids TypeScript's
// private/member class-compatibility checks when we provide a runtime
// adapter object to legacy unified services.
export interface ExternalUnifiedServiceRegistry {
  register(name: string, service: unknown): void;
  get<T = unknown>(name: string): T | undefined;
  has(name: string): boolean;
  unregister(name: string): boolean;
  getAllServices(): Map<string, unknown>;
  clear(): void;
  services?: Map<string, unknown>;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastCheck: Date;
  errorCount: number;
  uptime: number;
}

export interface ServiceMetrics {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  errorsLast24h: number;
  cacheHitRate: number;
  dataQuality: number;
}

export interface ServiceConfiguration {
  enableCaching: boolean;
  enableRetries: boolean;
  maxRetries: number;
  timeout: number;
  enableMetrics: boolean;
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

class MasterServiceRegistry {
  private static instance: MasterServiceRegistry;
  private services: Map<string, unknown> = new Map();
  private serviceHealth: Map<string, ServiceHealth> = new Map();
  private serviceMetrics: Map<string, ServiceMetrics> = new Map();
  public readonly configuration: ServiceConfiguration;
  public verboseLogging: boolean = process.env.NODE_ENV === 'development';
  private isInitialized = false;

  private constructor() {
    this.configuration = {
      enableCaching: true,
      enableRetries: true,
      maxRetries: 3,
      timeout: 30000,
      enableMetrics: true,
      enableLogging: true,
      logLevel: 'info',
    };
  }


  static getInstance(): MasterServiceRegistry {
    if (!MasterServiceRegistry.instance) {
      MasterServiceRegistry.instance = new MasterServiceRegistry();
    }
    return MasterServiceRegistry.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    // For now, initialization is lightweight. Services can register themselves.
    this.isInitialized = true;
    this.log('info', 'MasterServiceRegistry initialized');
  }

  public registerService(name: string, service: unknown): void {
    this.services.set(name, service);
    this.serviceMetrics.set(name, {
      totalRequests: 0,
      successRate: 100,
      averageResponseTime: 0,
      errorsLast24h: 0,
      cacheHitRate: 0,
      dataQuality: 100,
    });
    this.serviceHealth.set(name, {
      name,
      status: 'healthy',
      responseTime: 0,
      lastCheck: new Date(),
      errorCount: 0,
      uptime: 100,
    });
  }

  getService<T = unknown>(name: string): T | null {
    return (this.services.get(name) as T) || null;
  }

  getAllServices(): Map<string, unknown> {
    return new Map(this.services);
  }

  // Convenience getters return `any` to avoid introducing large type changes here
  get api(): unknown {
    return this.getService('api');
  }

  get analytics(): unknown {
    return this.getService('analytics');
  }

  get betting(): unknown {
    return this.getService('betting');
  }

  get data(): unknown {
    return this.getService('data');
  }

  get cache(): unknown {
    return this.getService('cache');
  }

  get logger(): unknown {
    return this.getService('logger');
  }

  get notifications(): unknown {
    return this.getService('notifications');
  }

  // Execute a method across all registered services if present
  async executeAcrossServices(methodName: string, ...args: unknown[]): Promise<Map<string, unknown>> {
    const results = new Map<string, unknown>();
    for (const [name, svc] of this.services.entries()) {
  const service = svc as unknown as Record<string, unknown>;
      if (service && typeof service[methodName] === 'function') {
        try {
          const res = await service[methodName](...args);
          results.set(name, { success: true, data: res });
        } catch (err) {
          results.set(name, { success: false, error: (err as Error).message });
          this.log('error', `Service ${name} failed to execute ${methodName}`, err as Error);
        }
      }
    }
    return results;
  }

  async refreshAllData(): Promise<void> {
    await this.executeAcrossServices('refresh');
  }

  async clearAllCaches(): Promise<void> {
    await this.executeAcrossServices('clearCache');
  }

  updateConfiguration(config: Partial<ServiceConfiguration>): void {
    Object.assign(this.configuration, config);
    for (const [name, svc] of this.services.entries()) {
  const service = svc as unknown as Record<string, unknown>;
      if (service && typeof service.updateConfiguration === 'function') {
        try {
          service.updateConfiguration(this.configuration);
        } catch (err) {
          this.log('warn', `Failed to update configuration for ${name}`, err as Error);
        }
      }
    }
  }

  getConfiguration(): ServiceConfiguration {
    return { ...this.configuration };
  }

  getSystemStatistics() {
    const health = Array.from(this.serviceHealth.values());
    const metrics = Array.from(this.serviceMetrics.values());
    const totalServices = health.length;
    const healthyServices = health.filter(h => h.status === 'healthy').length;
    const degradedServices = health.filter(h => h.status === 'degraded').length;
    const downServices = health.filter(h => h.status === 'down').length;
    const averageResponseTime = totalServices ? health.reduce((s, h) => s + Math.max(0, h.responseTime), 0) / totalServices : 0;
    const totalRequests = metrics.reduce((s, m) => s + (m.totalRequests || 0), 0);
    const overallSuccessRate = metrics.length ? metrics.reduce((s, m) => s + (m.successRate || 0), 0) / metrics.length : 100;
    return {
      totalServices,
      healthyServices,
      degradedServices,
      downServices,
      averageResponseTime,
      totalRequests,
      overallSuccessRate,
    };
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, err?: unknown): void {
    if (!this.configuration.enableLogging) return;
    try {
  const logger = this.getService('logger') as unknown as Record<string, unknown> | null;
      if (logger && typeof logger[level] === 'function') {
        logger[level](message, err);
        return;
      }
    } catch {
      // fall through to enhancedLogger
    }

    // enhancedLogger expects: (component, action, message, metadata?, error?)
    const component = 'MasterServiceRegistry';
    const action = '';
    const metadata = undefined as unknown as Record<string, unknown> | undefined;

    switch (level) {
      case 'debug':
        enhancedLogger.debug(component, action, message, metadata, err as Error | undefined);
        break;
      case 'info':
        enhancedLogger.info(component, action, message);
        break;
      case 'warn':
        enhancedLogger.warn(component, action, message, metadata, err as Error | undefined);
        break;
      case 'error':
        enhancedLogger.error(component, action, message, metadata, err as Error | undefined);
        break;
    }
  }

  async shutdown(): Promise<void> {
    for (const [name, svc] of this.services.entries()) {
  const service = svc as unknown as Record<string, unknown>;
      try {
        if (service && typeof service.shutdown === 'function') {
          await service.shutdown();
        }
      } catch (err) {
        this.log('error', `Failed to shutdown service: ${name}`, err as Error);
      }
    }
    this.services.clear();
    this.serviceHealth.clear();
    this.serviceMetrics.clear();
    this.isInitialized = false;
  }

  /**
   * Provide a lightweight adapter that matches the external UnifiedServiceRegistry
   * shape. We return it with a cast to the external type to minimize refactor scope.
   */
  // Return a runtime-compatible adapter but expose it with a loose type to
  // avoid TypeScript private-member/class-compatibility errors when passing
  // this adapter into existing unified services. Call sites may cast when
  // they require the concrete `UnifiedServiceRegistry` type.
  public toUnifiedRegistry(): ExternalUnifiedServiceRegistry & { services: Map<string, unknown>; getAllServices(): Map<string, unknown> } {
    const adapter = new UnifiedRegistryAdapter(this);

    // Create a plain object that matches the public shape of the external
    // `UnifiedServiceRegistry` so TypeScript structural checks succeed.
  const unifiedLike = {
      register: (name: string, service: unknown) => adapter.register(name, service),
      get: <T = unknown>(name: string) => adapter.get<T>(name),
      has: (name: string) => adapter.has(name),
      unregister: (name: string) => adapter.unregister(name),
      getAllServices: () => adapter.getAllServices(),
      clear: () => adapter.clear(),
      services: adapter.services,
  } as unknown as ExternalUnifiedServiceRegistry & { services: Map<string, unknown>; getAllServices(): Map<string, unknown> };

    return unifiedLike;
  }

  // Provide a temporary alias for use by legacy unified services that expect
  // the external `UnifiedServiceRegistry` shape. This is intentionally loose
  // while we migrate callers; we'll tighten types in a follow-up.
  // Return the runtime adapter cast to the external `UnifiedServiceRegistry` shape.
  // We cast via `unknown` to avoid private-constructor/class-compatibility checks
  // while keeping the getter typed as the external interface for call sites.
  // Loosen to `any` temporarily to avoid private-member/class incompatibility
  // when passing the runtime adapter to legacy unified services. This is
  // intentionally narrow and will be tightened after remaining call-sites
  // are migrated or explicitly cast.
  private get thisAsUnifiedRegistry(): any {
  // Return the adapter but keep callers type-stable by allowing a local cast
  // at the call-site. Some legacy unified services require the concrete
  // external class-type; callers should cast like:
  //   this.thisAsUnifiedRegistry as unknown as ExternalUnifiedServiceRegistry
  return this.toUnifiedRegistry() as unknown as ExternalUnifiedServiceRegistry & { services: Map<string, unknown>; getAllServices(): Map<string, unknown> };
  }
}

// Adapter class removed — use `toUnifiedRegistry()` to provide a compatible wrapper.


export const _masterServiceRegistry = MasterServiceRegistry.getInstance();

export const _getService = <T = unknown>(name: string): T | null => {
  return _masterServiceRegistry.getService<T>(name);
};

export const _services = {
  get api() {
    return _masterServiceRegistry.api;
  },
  get analytics() {
    return _masterServiceRegistry.analytics;
  },
  get betting() {
    return _masterServiceRegistry.betting;
  },
  get data() {
    return _masterServiceRegistry.data;
  },
  get cache() {
    return _masterServiceRegistry.cache;
  },
  get logger() {
    return _masterServiceRegistry.logger;
  },
  get notifications() {
    return _masterServiceRegistry.notifications;
  },
};

export { MasterServiceRegistry };
export default _masterServiceRegistry;

// Provide a minimal adapter shape expected by some legacy callers.
// Keep this local and narrow to avoid a large refactor.
// Adapter that implements the project's external UnifiedServiceRegistry class
// The UnifiedServiceRegistryAdapter class has been removed as it incorrectly extended a class with a private constructor.

// Compatibility exports for legacy callers that reference `UnifiedServiceRegistryAdapter`.
export type UnifiedServiceRegistryAdapter = ExternalUnifiedServiceRegistry & { services: Map<string, unknown>; getAllServices(): Map<string, unknown> };

// Return `any` here to avoid propagating structural-check issues to legacy callers.
// Callers that need concrete typing can cast locally to the exact external type.
export function createUnifiedServiceRegistryAdapter(): UnifiedServiceRegistryAdapter {
  return _masterServiceRegistry.toUnifiedRegistry() as unknown as UnifiedServiceRegistryAdapter;
}
