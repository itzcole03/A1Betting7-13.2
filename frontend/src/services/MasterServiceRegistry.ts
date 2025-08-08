/**
 * Master Service Registry - Consolidates ALL services from frontend, prototype, and backend
 * This creates a unified interface to access all functionality across the entire workspace
 */

// Import ALL unified services
import ApiService from './unified/ApiService';
import { UnifiedAnalyticsService } from './unified/UnifiedAnalyticsService';
import { UnifiedBettingService } from './unified/UnifiedBettingService';
import { UnifiedCache } from './unified/UnifiedCache';
import { UnifiedDataService } from './unified/UnifiedDataService';
import { UnifiedErrorService } from './unified/UnifiedErrorService';
import { UnifiedLogger } from './unified/UnifiedLogger';
import { UnifiedNotificationService } from './unified/UnifiedNotificationService';
import { UnifiedPredictionService } from './unified/UnifiedPredictionService';
import { UnifiedStateService } from './unified/UnifiedStateService';
import { UnifiedWebSocketService } from './unified/UnifiedWebSocketService';

// Import specific feature services
import { PlayerDataService } from './data/PlayerDataService';
import { _injuryService } from './injuryService';
import { _lineupService } from './lineupService';

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
import { SecurityService } from './unified/SecurityService';

/**
 * Health status for a registered service.
 */
export interface ServiceHealth {
  /** Service name */
  name: string;
  /** Health status */
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
      '[DEBUG] MasterServiceRegistry.initializeUnifiedServices this.configuration:',
      this.configuration,
      typeof (this.configuration as any)?.getApiUrl
    );
    // Register errors and state first for notification service dependency
    const _unifiedServices = [
      { name: 'api', service: ApiService },
      { name: 'errors', service: UnifiedErrorService.getInstance() },
      { name: 'state', service: UnifiedStateService.getInstance() },
      {
        name: 'notifications',
        service: (() => {
          try {
            return new UnifiedNotificationService(this);
          } catch (err) {
            // Fallback stub for missing dependencies
            return {
              notifyUser: () => {},
              dismissNotification: () => {},
              markAsRead: () => {},
              clearAll: () => {},
              getUnreadCount: () => 0,
              notify: () => {},
            };
          }
        })(),
      },
      { name: 'analytics', service: UnifiedAnalyticsService.getInstance(this) },
      { name: 'betting', service: UnifiedBettingService.getInstance() },
      { name: 'data', service: UnifiedDataService.getInstance() },
      { name: 'predictions', service: UnifiedPredictionService.getInstance() },
      { name: 'cache', service: UnifiedCache.getInstance() },
      { name: 'logger', service: UnifiedLogger.getInstance() },
      { name: 'websocket', service: UnifiedWebSocketService.getInstance() },
      { name: 'security', service: SecurityService.getInstance() },
    ];

    for (const { name, service } of _unifiedServices) {
      try {
        if ((service as any).initialize) {
          await (service as any).initialize();
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
    const _featureServices = [
      { name: 'injuries', service: _injuryService },
      { name: 'lineups', service: _lineupService },
      { name: 'playerData', service: PlayerDataService.getInstance() },
    ];

    for (const { name, service } of _featureServices) {
      try {
        console.log(`[MasterServiceRegistry] Initializing feature service: ${name}`);

        if ((service as any).initialize) {
          await (service as any).initialize();
        }
        this.registerService(name, service);
        this.updateServiceHealth(name, 'healthy', 0);

        console.log(`[MasterServiceRegistry] Successfully initialized feature service: ${name}`);
      } catch (error) {
        console.error(`[MasterServiceRegistry] Failed to initialize feature service: ${name}`, error);

        // Check if this is the "item is not defined" error
        if (error instanceof ReferenceError && error.message.includes('item')) {
          console.error(`[MasterServiceRegistry] ReferenceError in ${name} service:`, {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }

        this.log('error', `Failed to initialize feature service: ${name}`, error);
        this.updateServiceHealth(name, 'degraded', -1);
      }
    }
  }

  private async initializePrototypeServices(): Promise<void> {
    // import { enhancedDataSources } from '../../../prototype/src/services/enhancedDataSources';
    // import { realDataService } from '../../../prototype/src/services/realDataService';
    // import { predictionEngine } from '../../../prototype/src/services/predictionEngine';
    // import { realTimeDataAggregator } from '../../../prototype/src/services/realTimeDataAggregator';
    const _prototypeServices: { name: string; service: unknown }[] = [
      // { name: 'enhancedDataSources', service: enhancedDataSources },
      // { name: 'realDataService', service: realDataService },
      // { name: 'predictionEngine', service: predictionEngine },
      // { name: 'realTimeAggregator', service: realTimeDataAggregator },
    ];

    for (const { name, service } of _prototypeServices) {
      try {
        if ((service as any).initialize) {
          await (service as any).initialize();
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
    // import { AnalyticsService } from './AnalyticsService';
    // import { BettingService } from './BettingService';
    // import { CacheService } from './CacheService';
    // import { PredictionService } from './predictionService';
    // import { NotificationService } from './notificationService';
    // import { PerformanceTrackingService } from './PerformanceTrackingService';
    // import { SecurityService } from './SecurityService';
    const _specializedServices: { name: string; service: unknown }[] = [
      // { name: 'analyticsSpecialized', service: new AnalyticsService() },
      // { name: 'bettingSpecialized', service: new BettingService() },
      // { name: 'cacheSpecialized', service: new CacheService() },
      // { name: 'predictionSpecialized', service: new PredictionService() },
      // { name: 'notificationSpecialized', service: new NotificationService() },
      // { name: 'performance', service: new PerformanceTrackingService() },
      { name: 'security', service: SecurityService.getInstance() },
    ];

    for (const { name, service } of _specializedServices) {
      try {
        if ((service as any).initialize) {
          await (service as any).initialize();
        }
        this.registerService(name, service);
        this.updateServiceHealth(name, 'healthy', 0);
      } catch (error) {
        this.log('warn', `Specialized service not available: ${name}`, error);
        this.updateServiceHealth(name, 'degraded', -1);
      }
    }
  }

  public registerService(name: string, service: unknown): void {
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

  public updateServiceHealth(
    name: string,
    status: ServiceHealth['status'],
    responseTime: number
  ): void {
    const _existing = this.serviceHealth.get(name) || { errorCount: 0, uptime: 100 };
    this.serviceHealth.set(name, {
      name,
      status,
      responseTime: Math.max(0, responseTime),
      lastCheck: new Date(),
      errorCount: _existing.errorCount,
      uptime: status === 'healthy' ? _existing.uptime : Math.max(0, _existing.uptime - 1),
    });
  }

  private setupHealthMonitoring(): void {
    setInterval(async () => {
      for (const [name, service] of this.services.entries()) {
        try {
          const _startTime = Date.now();

          // Perform health check with timeout
          if ((service as any).healthCheck) {
            await Promise.race([
              (service as any).healthCheck(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Health check timeout')), 5000)
              )
            ]);
          } else if ((service as any).ping) {
            await Promise.race([
              (service as any).ping(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Ping timeout')), 3000)
              )
            ]);
          }

          const _responseTime = Date.now() - _startTime;
          this.updateServiceHealth(name, 'healthy', _responseTime);
        } catch (error) {
          // Log health check failures as warnings since they're non-critical
          this.log('warn', `Service health check failed: ${name}`, error);
          this.updateServiceHealth(name, 'degraded', -1);
          const _health = this.serviceHealth.get(name);
          if (_health) {
            _health.errorCount += 1;
          }
        }
      }
    }, 60000); // Check every minute
  }

  private setupMetricsCollection(): void {
    setInterval(() => {
      for (const [name, service] of this.services.entries()) {
        if ((service as any).getMetrics) {
          try {
            const _metrics = (service as any).getMetrics();
            this.serviceMetrics.set(name, {
              ...this.serviceMetrics.get(name)!,
              ..._metrics,
            });
          } catch (error) {
            this.log('warn', `Failed to collect metrics for service: ${name}`, error);
          }
        }
      }
    }, 30000); // Collect every 30 seconds
  }

  // Service access methods
  getService<T = unknown>(name: string): T | null {
    return (this.services.get(name) as T) || null;
  }

  getAllServices(): Map<string, unknown> {
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
  get api(): any {
    return this.getService('api')!;
  }

  get analytics(): UnifiedAnalyticsService {
    return this.getService<UnifiedAnalyticsService>('analytics')!;
  }

  get betting(): UnifiedBettingService {
    return this.getService<UnifiedBettingService>('betting')!;
  }

  get data(): UnifiedDataService {
    return this.getService<UnifiedDataService>('data')!;
  }

  get predictions(): UnifiedPredictionService {
    return this.getService<UnifiedPredictionService>('predictions')!;
  }

  get injuries(): typeof _injuryService {
    return this.getService<typeof _injuryService>('injuries')!;
  }

  get lineups(): typeof _lineupService {
    return this.getService<typeof _lineupService>('lineups')!;
  }

  get cache(): UnifiedCache {
    return this.getService<UnifiedCache>('cache')!;
  }

  get logger(): UnifiedLogger {
    return this.getService<UnifiedLogger>('logger')!;
  }

  get notifications(): UnifiedNotificationService {
    return this.getService<UnifiedNotificationService>('notifications')!;
  }

  get websocket(): UnifiedWebSocketService {
    return this.getService<UnifiedWebSocketService>('websocket')!;
  }

  get security(): SecurityService {
    return this.getService<SecurityService>('security')!;
  }

  // Service orchestration methods
  async executeAcrossServices(
    methodName: string,
    ...args: unknown[]
  ): Promise<Map<string, unknown>> {
    const _results = new Map();

    for (const [name, service] of this.services.entries()) {
      if ((service as any)[methodName] && typeof (service as any)[methodName] === 'function') {
        try {
          const _result = await (service as any)[methodName](...args);
          _results.set(name, { success: true, data: _result });
        } catch (error) {
          _results.set(name, { success: false, error: (error as Error).message });
          this.log('error', `Service ${name} failed to execute ${methodName}`, error);
        }
      }
    }

    return _results;
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
    Object.assign(this.configuration, config);

    // Apply configuration to all services
    for (const [name, service] of this.services.entries()) {
      if ((service as any).updateConfiguration) {
        try {
          (service as any).updateConfiguration(this.configuration);
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
    const _healthArray = Array.from(this.serviceHealth.values());
    const _metricsArray = Array.from(this.serviceMetrics.values());

    const _totalServices = _healthArray.length;
    const _healthyServices = _healthArray.filter(h => h.status === 'healthy').length;
    const _degradedServices = _healthArray.filter(h => h.status === 'degraded').length;
    const _downServices = _healthArray.filter(h => h.status === 'down').length;

    const _averageResponseTime =
      _healthArray.reduce((sum, h) => sum + Math.max(0, h.responseTime), 0) / _totalServices;
    const _totalRequests = _metricsArray.reduce((sum, m) => sum + m.totalRequests, 0);
    const _overallSuccessRate =
      _metricsArray.reduce((sum, m) => sum + m.successRate, 0) / _metricsArray.length;

    return {
      totalServices: _totalServices,
      healthyServices: _healthyServices,
      degradedServices: _degradedServices,
      downServices: _downServices,
      averageResponseTime: _averageResponseTime,
      totalRequests: _totalRequests,
      overallSuccessRate: _overallSuccessRate,
    };
  }

  // Logging
  private log(level: string, message: string, data?: unknown): void {
    if (this.configuration.enableLogging) {
      const _logger = this.getService<UnifiedLogger>('logger');
      if (_logger && (_logger as any)[level]) {
        (_logger as any)[level](message, data);
      } else {
        // Only log debug/info if verboseLogging is enabled
        if (['debug', 'info'].includes(level) && !this.verboseLogging) return;
        switch (level) {
          case 'debug':
            console.debug(`[MasterServiceRegistry] ${message}`, data || '');
            break;
          case 'info':
            console.info(`[MasterServiceRegistry] ${message}`, data || '');
            break;
          case 'warn':
            console.warn(`[MasterServiceRegistry] ${message}`, data || '');
            break;
          case 'error':
            console.error(`[MasterServiceRegistry] ${message}`, data || '');
            break;
          default:
            console.log(`[MasterServiceRegistry] ${message}`, data || '');
        }
      }
    }
  }

  // Cleanup
  async shutdown(): Promise<void> {
    for (const [name, service] of this.services.entries()) {
      try {
        if ((service as any).shutdown) {
          await (service as any).shutdown();
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
export const _masterServiceRegistry = MasterServiceRegistry.getInstance();

// Export convenience function for service access
export const _getService = <T = unknown>(name: string): T | null => {
  return _masterServiceRegistry.getService<T>(name);
};

// Export common services for direct access
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
  get predictions() {
    return _masterServiceRegistry.predictions;
  },
  get injuries() {
    return _masterServiceRegistry.injuries;
  },
  get lineups() {
    return _masterServiceRegistry.lineups;
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
  get websocket() {
    return _masterServiceRegistry.websocket;
  },
  get security() {
    return _masterServiceRegistry.security;
  },
};

export { MasterServiceRegistry };
export default _masterServiceRegistry;
