/**
 * ServiceManager - Central service orchestration for A1Betting Platform
 * Manages service lifecycle, dependencies, and health monitoring
 */

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  latency: number;
  errorRate: number;
}

export interface ServiceConfig {
  name: string;
  enabled: boolean;
  dependencies: string[];
  healthCheck: () => Promise<boolean>;
  initialize: () => Promise<void>;
  shutdown: () => Promise<void>;
}

class ServiceManager {
  private services: Map<string, ServiceConfig> = new Map();
  private healthStatus: Map<string, ServiceHealth> = new Map();
  private initialized = false;

  async registerService(config: ServiceConfig): Promise<void> {
    this.services.set(config.name, config);
    this.healthStatus.set(config.name, {
      name: config.name,
      status: 'unhealthy',
      lastCheck: new Date(),
      latency: 0,
      errorRate: 0,
    });
  }

  async initializeServices(): Promise<void> {
    if (this.initialized) return;

    const _initOrder = this.getInitializationOrder();

    for (const _serviceName of initOrder) {
      const _service = this.services.get(serviceName);
      if (service?.enabled) {
        try {
          await service.initialize();
          await this.updateHealthStatus(serviceName);
        } catch (error) {
          console.error(`Failed to initialize service ${serviceName}:`, error);
        }
      }
    }

    this.initialized = true;
    this.startHealthMonitoring();
  }

  async shutdownServices(): Promise<void> {
    const _shutdownOrder = this.getInitializationOrder().reverse();

    for (const _serviceName of shutdownOrder) {
      const _service = this.services.get(serviceName);
      if (service) {
        try {
          await service.shutdown();
        } catch (error) {
          console.error(`Failed to shutdown service ${serviceName}:`, error);
        }
      }
    }

    this.initialized = false;
  }

  private getInitializationOrder(): string[] {
    const _visited = new Set<string>();
    const _visiting = new Set<string>();
    const _order: string[] = [];

    const _visit = (serviceName: string) => {
      if (visiting.has(serviceName)) {
        throw new Error(`Circular dependency detected: ${serviceName}`);
      }

      if (visited.has(serviceName)) return;

      visiting.add(serviceName);

      const _service = this.services.get(serviceName);
      if (service) {
        for (const _dependency of service.dependencies) {
          visit(dependency);
        }
      }

      visiting.delete(serviceName);
      visited.add(serviceName);
      order.push(serviceName);
    };

    for (const _serviceName of this.services.keys()) {
      visit(serviceName);
    }

    return order;
  }

  private async updateHealthStatus(serviceName: string): Promise<void> {
    const _service = this.services.get(serviceName);
    if (!service) return;

    const _startTime = Date.now();

    try {
      const _isHealthy = await service.healthCheck();
      const _latency = Date.now() - startTime;

      this.healthStatus.set(serviceName, {
        name: serviceName,
        status: isHealthy ? 'healthy' : 'degraded',
        lastCheck: new Date(),
        latency,
        errorRate: 0,
      });
    } catch (error) {
      const _latency = Date.now() - startTime;

      this.healthStatus.set(serviceName, {
        name: serviceName,
        status: 'unhealthy',
        lastCheck: new Date(),
        latency,
        errorRate: 1,
      });
    }
  }

  private startHealthMonitoring(): void {
    setInterval(async () => {
      for (const _serviceName of this.services.keys()) {
        await this.updateHealthStatus(serviceName);
      }
    }, 30000); // Check every 30 seconds
  }

  getServiceHealth(serviceName?: string): ServiceHealth | ServiceHealth[] {
    if (serviceName) {
      return (
        this.healthStatus.get(serviceName) || {
          name: serviceName,
          status: 'unhealthy',
          lastCheck: new Date(),
          latency: 0,
          errorRate: 1,
        }
      );
    }

    return Array.from(this.healthStatus.values());
  }

  getOverallHealth(): 'healthy' | 'degraded' | 'unhealthy' {
    const _statuses = Array.from(this.healthStatus.values());

    if (statuses.every(s => s.status === 'healthy')) return 'healthy';
    if (statuses.some(s => s.status === 'unhealthy')) return 'unhealthy';
    return 'degraded';
  }

  async restartService(serviceName: string): Promise<void> {
    const _service = this.services.get(serviceName);
    if (!service) throw new Error(`Service ${serviceName} not found`);

    await service.shutdown();
    await service.initialize();
    await this.updateHealthStatus(serviceName);
  }
}

export default new ServiceManager();
