/**
 * Master Service Registry - Consolidates ALL services from frontend, prototype, and backend
 * This creates a unified interface to access all functionality across the entire workspace
 */

// Import ALL unified services
import ApiService from './unified/ApiService';
import { UnifiedAnalyticsService } from './unified/UnifiedAnalyticsService';
import { UnifiedBettingService } from './unified/UnifiedBettingService';
import { UnifiedDataService } from './unified/UnifiedDataService';
import { UnifiedPredictionService } from './unified/UnifiedPredictionService';
import { UnifiedNotificationService } from './unified/UnifiedNotificationService';
import { UnifiedStateService } from './unified/UnifiedStateService';
import { UnifiedCache } from './unified/UnifiedCache';
import { UnifiedErrorService } from './unified/UnifiedErrorService';
import { UnifiedLogger } from './unified/UnifiedLogger';
import { UnifiedWebSocketService } from './unified/UnifiedWebSocketService';

// Import specific feature services
import { injuryService } from './injuryService';
import { lineupService } from './lineupService';

// Import prototype services (temporarily commented out for debugging)
// import { enhancedDataSources } from '../../../prototype/src/services/enhancedDataSources';
// import { realDataService } from '../../../prototype/src/services/realDataService';
// import { predictionEngine } from '../../../prototype/src/services/predictionEngine';
// import { realTimeDataAggregator } from '../../../prototype/src/services/realTimeDataAggregator';

// Import individual specialized services (temporarily commented out for debugging)
// import { AnalyticsService } from './AnalyticsService';
// import { BettingService } from './BettingService';
// import { CacheService } from './CacheService';
// import { PredictionService } from './predictionService';
// import { NotificationService } from './notificationService';
// import { PerformanceTrackingService } from './PerformanceTrackingService';
// import { SecurityService } from './SecurityService';

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
  private services: Map<string, any> = new Map();
  private serviceHealth: Map<string, ServiceHealth> = new Map();
  private serviceMetrics: Map<string, ServiceMetrics> = new Map();
  private configuration: ServiceConfiguration;
  private isInitialized = false;

  constructor() {
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

    try {
      // Initialize all unified services
      await this.initializeUnifiedServices();

      // Initialize feature-specific services
      await this.initializeFeatureServices();

      // Initialize prototype services
      await this.initializePrototypeServices();

      // Initialize specialized services
      await this.initializeSpecializedServices();

      // Set up health monitoring
      this.setupHealthMonitoring();

      // Set up metrics collection
      this.setupMetricsCollection();

      this.isInitialized = true;
      this.log('info', 'Master Service Registry initialized successfully');
    } catch (error) {
      this.log('error', 'Failed to initialize Master Service Registry', error);
      throw error;
    }
  }

  private async initializeUnifiedServices(): Promise<void> {
    console.log(
      '[DEBUG] MasterServiceRegistry.initializeUnifiedServices this.config:',
      this.config,
      typeof this.config?.getApiUrl
    );
    const unifiedServices = [
      { name: 'api', service: ApiService },
      { name: 'analytics', service: UnifiedAnalyticsService.getInstance(this.configuration) },
      { name: 'betting', service: UnifiedBettingService.getInstance() },
      { name: 'data', service: UnifiedDataService.getInstance() },
      { name: 'predictions', service: UnifiedPredictionService.getInstance() },
      { name: 'notifications', service: UnifiedNotificationService.getInstance() },
      { name: 'state', service: UnifiedStateService.getInstance() },
      { name: 'cache', service: UnifiedCache.getInstance() },
      { name: 'errors', service: UnifiedErrorService.getInstance() },
      { name: 'logger', service: UnifiedLogger.getInstance() },
      { name: 'websocket', service: UnifiedWebSocketService.getInstance() },
    ];

    for (const { name, service } of unifiedServices) {
      try {
        if (service.initialize) {
          await service.initialize();
        }
        this.registerService(name, service);
        this.updateServiceHealth(name, 'healthy', 0);
      } catch (error) {
        this.log('error', `Failed to initialize unified service: ${name}`, error);
        this.updateServiceHealth(name, 'down', -1);
      }
    }
  }

  private async initializeFeatureServices(): Promise<void> {
    const featureServices = [
      { name: 'injuries', service: injuryService },
      { name: 'lineups', service: lineupService },
    ];

    for (const { name, service } of featureServices) {
      try {
        if (service.initialize) {
          await service.initialize();
        }
        this.registerService(name, service);
        this.updateServiceHealth(name, 'healthy', 0);
      } catch (error) {
        this.log('error', `Failed to initialize feature service: ${name}`, error);
        this.updateServiceHealth(name, 'degraded', -1);
      }
    }
  }

  private async initializePrototypeServices(): Promise<void> {
    const prototypeServices = [
      { name: 'enhancedDataSources', service: enhancedDataSources },
      { name: 'realDataService', service: realDataService },
      { name: 'predictionEngine', service: predictionEngine },
      { name: 'realTimeAggregator', service: realTimeDataAggregator },
    ];

    for (const { name, service } of prototypeServices) {
      try {
        if (service.initialize) {
          await service.initialize();
        }
        this.registerService(name, service);
        this.updateServiceHealth(name, 'healthy', 0);
      } catch (error) {
        this.log('warn', `Prototype service not available: ${name}`, error);
        this.updateServiceHealth(name, 'down', -1);
      }
    }
  }

  private async initializeSpecializedServices(): Promise<void> {
    const specializedServices = [
      { name: 'analyticsSpecialized', service: new AnalyticsService() },
      { name: 'bettingSpecialized', service: new BettingService() },
      { name: 'cacheSpecialized', service: new CacheService() },
      { name: 'predictionSpecialized', service: new PredictionService() },
      { name: 'notificationSpecialized', service: new NotificationService() },
      { name: 'performance', service: new PerformanceTrackingService() },
      { name: 'security', service: new SecurityService() },
    ];

    for (const { name, service } of specializedServices) {
      try {
        if (service.initialize) {
          await service.initialize();
        }
        this.registerService(name, service);
        this.updateServiceHealth(name, 'healthy', 0);
      } catch (error) {
        this.log('warn', `Specialized service not available: ${name}`, error);
        this.updateServiceHealth(name, 'degraded', -1);
      }
    }
  }

  private registerService(name: string, service: any): void {
    this.services.set(name, service);
    this.initializeServiceMetrics(name);
  }

  private initializeServiceMetrics(name: string): void {
    this.serviceMetrics.set(name, {
      totalRequests: 0,
      successRate: 100,
      averageResponseTime: 0,
      errorsLast24h: 0,
      cacheHitRate: 0,
      dataQuality: 100,
    });
  }

  private updateServiceHealth(
    name: string,
    status: ServiceHealth['status'],
    responseTime: number
  ): void {
    const existing = this.serviceHealth.get(name);
    this.serviceHealth.set(name, {
      name,
      status,
      responseTime: Math.max(0, responseTime),
      lastCheck: new Date(),
      errorCount: existing?.errorCount || 0,
      uptime:
        status === 'healthy' ? existing?.uptime || 100 : Math.max(0, (existing?.uptime || 100) - 1),
    });
  }

  private setupHealthMonitoring(): void {
    setInterval(async () => {
      for (const [name, service] of this.services.entries()) {
        try {
          const startTime = Date.now();

          // Perform health check
          if (service.healthCheck) {
            await service.healthCheck();
          } else if (service.ping) {
            await service.ping();
          }

          const responseTime = Date.now() - startTime;
          this.updateServiceHealth(name, 'healthy', responseTime);
        } catch (error) {
          this.updateServiceHealth(name, 'degraded', -1);
          const health = this.serviceHealth.get(name);
          if (health) {
            health.errorCount += 1;
          }
        }
      }
    }, 60000); // Check every minute
  }

  private setupMetricsCollection(): void {
    setInterval(() => {
      for (const [name, service] of this.services.entries()) {
        if (service.getMetrics) {
          try {
            const metrics = service.getMetrics();
            this.serviceMetrics.set(name, {
              ...this.serviceMetrics.get(name)!,
              ...metrics,
            });
          } catch (error) {
            this.log('warn', `Failed to collect metrics for service: ${name}`, error);
          }
        }
      }
    }, 30000); // Collect every 30 seconds
  }

  // Service access methods
  getService<T = any>(name: string): T | null {
    return this.services.get(name) || null;
  }

  getAllServices(): Map<string, any> {
    return new Map(this.services);
  }

  getServiceHealth(name?: string): ServiceHealth[] | ServiceHealth | null {
    if (name) {
      return this.serviceHealth.get(name) || null;
    }
    return Array.from(this.serviceHealth.values());
  }

  getServiceMetrics(name?: string): ServiceMetrics[] | ServiceMetrics | null {
    if (name) {
      return this.serviceMetrics.get(name) || null;
    }
    return Array.from(this.serviceMetrics.values());
  }

  // Convenience methods for common services
  get api(): ApiService {
    return this.getService('api');
  }

  get analytics(): UnifiedAnalyticsService {
    return this.getService('analytics');
  }

  get betting(): UnifiedBettingService {
    return this.getService('betting');
  }

  get data(): UnifiedDataService {
    return this.getService('data');
  }

  get predictions(): UnifiedPredictionService {
    return this.getService('predictions');
  }

  get injuries(): typeof injuryService {
    return this.getService('injuries');
  }

  get lineups(): typeof lineupService {
    return this.getService('lineups');
  }

  get cache(): UnifiedCacheService {
    return this.getService('cache');
  }

  get logger(): UnifiedLogger {
    return this.getService('logger');
  }

  get notifications(): UnifiedNotificationService {
    return this.getService('notifications');
  }

  get websocket(): UnifiedWebSocketService {
    return this.getService('websocket');
  }

  // Service orchestration methods
  async executeAcrossServices(methodName: string, ...args: any[]): Promise<Map<string, any>> {
    const results = new Map();

    for (const [name, service] of this.services.entries()) {
      if (service[methodName] && typeof service[methodName] === 'function') {
        try {
          const result = await service[methodName](...args);
          results.set(name, { success: true, data: result });
        } catch (error) {
          results.set(name, { success: false, error: error.message });
          this.log('error', `Service ${name} failed to execute ${methodName}`, error);
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

  async optimizeAllServices(): Promise<void> {
    await this.executeAcrossServices('optimize');
  }

  // Configuration management
  updateConfiguration(config: Partial<ServiceConfiguration>): void {
    this.configuration = { ...this.configuration, ...config };

    // Apply configuration to all services
    for (const [name, service] of this.services.entries()) {
      if (service.updateConfiguration) {
        try {
          service.updateConfiguration(this.configuration);
        } catch (error) {
          this.log('warn', `Failed to update configuration for service: ${name}`, error);
        }
      }
    }
  }

  getConfiguration(): ServiceConfiguration {
    return { ...this.configuration };
  }

  // System-wide statistics
  getSystemStatistics(): {
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    downServices: number;
    averageResponseTime: number;
    totalRequests: number;
    overallSuccessRate: number;
  } {
    const healthArray = Array.from(this.serviceHealth.values());
    const metricsArray = Array.from(this.serviceMetrics.values());

    const totalServices = healthArray.length;
    const healthyServices = healthArray.filter(h => h.status === 'healthy').length;
    const degradedServices = healthArray.filter(h => h.status === 'degraded').length;
    const downServices = healthArray.filter(h => h.status === 'down').length;

    const averageResponseTime =
      healthArray.reduce((sum, h) => sum + Math.max(0, h.responseTime), 0) / totalServices;
    const totalRequests = metricsArray.reduce((sum, m) => sum + m.totalRequests, 0);
    const overallSuccessRate =
      metricsArray.reduce((sum, m) => sum + m.successRate, 0) / metricsArray.length;

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

  // Logging
  private log(level: string, message: string, data?: any): void {
    if (this.configuration.enableLogging) {
      const logger = this.getService('logger');
      if (logger && logger[level]) {
        logger[level](message, data);
      } else {
        console[level as keyof Console](`[MasterServiceRegistry] ${message}`, data || '');
      }
    }
  }

  // Cleanup
  async shutdown(): Promise<void> {
    for (const [name, service] of this.services.entries()) {
      try {
        if (service.shutdown) {
          await service.shutdown();
        }
      } catch (error) {
        this.log('error', `Failed to shutdown service: ${name}`, error);
      }
    }

    this.services.clear();
    this.serviceHealth.clear();
    this.serviceMetrics.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const masterServiceRegistry = MasterServiceRegistry.getInstance();

// Export convenience function for service access
export const getService = <T = any>(name: string): T | null => {
  return masterServiceRegistry.getService<T>(name);
};

// Export common services for direct access
export const services = {
  get api() {
    return masterServiceRegistry.api;
  },
  get analytics() {
    return masterServiceRegistry.analytics;
  },
  get betting() {
    return masterServiceRegistry.betting;
  },
  get data() {
    return masterServiceRegistry.data;
  },
  get predictions() {
    return masterServiceRegistry.predictions;
  },
  get injuries() {
    return masterServiceRegistry.injuries;
  },
  get lineups() {
    return masterServiceRegistry.lineups;
  },
  get cache() {
    return masterServiceRegistry.cache;
  },
  get logger() {
    return masterServiceRegistry.logger;
  },
  get notifications() {
    return masterServiceRegistry.notifications;
  },
  get websocket() {
    return masterServiceRegistry.websocket;
  },
};

export default masterServiceRegistry;
