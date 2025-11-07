import { UnifiedDataService } from './unified/UnifiedDataService';
import { enhancedLogger } from '../utils/enhancedLogger';

interface ServiceHealthMetrics {
  serviceName: string;
  responseTime: number;
  errorRate: number;
  successRate: number;
  cacheHitRate: number;
  lastHealthCheck: Date;
  status: 'healthy' | 'degraded' | 'unhealthy';
  errors: string[];
}

interface HealthCheckResult {
  success: boolean;
  responseTime: number;
  error?: string;
}

interface AlertThresholds {
  maxResponseTime: number;
  maxErrorRate: number;
  minSuccessRate: number;
  minCacheHitRate: number;
}

class DataPipelineStabilityMonitor {
  private static instance: DataPipelineStabilityMonitor;
  private metrics: Map<string, ServiceHealthMetrics> = new Map();
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  private readonly DEFAULT_THRESHOLDS: AlertThresholds = {
    maxResponseTime: 5000, // 5 seconds
    maxErrorRate: 0.1,     // 10%
    minSuccessRate: 0.9,   // 90%
    minCacheHitRate: 0.7   // 70%
  };

  private constructor() {}

  static getInstance(): DataPipelineStabilityMonitor {
    if (!DataPipelineStabilityMonitor.instance) {
      DataPipelineStabilityMonitor.instance = new DataPipelineStabilityMonitor();
    }
    return DataPipelineStabilityMonitor.instance;
  }

  async startMonitoring(intervalMs: number = 60000): Promise<void> {
    if (this.isMonitoring) {
      enhancedLogger.warn('DataPipelineStabilityMonitor', 'startMonitoring', 'Data pipeline monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    enhancedLogger.info('DataPipelineStabilityMonitor', 'startMonitoring', 'Starting data pipeline stability monitoring...');

    // Initial health check
    await this.performHealthChecks();

    // Set up periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthChecks();
      } catch (error) {
        enhancedLogger.error('DataPipelineStabilityMonitor', 'monitorInterval', 'Error during health check', undefined, error as unknown as Error);
      }
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  this.isMonitoring = false;
  enhancedLogger.info('DataPipelineStabilityMonitor', 'stopMonitoring', 'Data pipeline monitoring stopped');
  }

  private async performHealthChecks(): Promise<void> {
    const services = [
      { name: 'UnifiedDataService', service: UnifiedDataService.getInstance() }
    ];

    const healthCheckPromises = services.map(({ name, service }) =>
      this.checkServiceHealth(name, service)
    );

    await Promise.allSettled(healthCheckPromises);
    this.analyzeAndAlert();
  }

  private async checkServiceHealth(serviceName: string, service: unknown): Promise<void> {
    const startTime = Date.now();
    let result: HealthCheckResult;

    try {
      // Perform a lightweight health check based on service type
      if (serviceName === 'UnifiedDataService') {
        result = await this.healthCheckUnifiedDataService(service);
      } else {
        result = { success: false, responseTime: 0, error: 'Unknown service' };
      }
    } catch (error) {
      result = {
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    this.updateMetrics(serviceName, result);
  }

  private async healthCheckUnifiedDataService(service: unknown): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      // Test basic functionality that was fixed in the constructor
      const testCacheKey = 'health-check-test';
      const testData = { test: true, timestamp: Date.now() };
      
      // Test cache operations (this validates the constructor fix)
      const svc = service as { cacheData?: (k: string, v: unknown, ttl?: number) => Promise<void>; getCachedData?: (k: string) => Promise<unknown> };
      if (typeof svc.cacheData !== 'function' || typeof svc.getCachedData !== 'function') {
        throw new Error('UnifiedDataService does not expose required cache methods');
      }

      await svc.cacheData(testCacheKey, testData, 1000);
      const cachedData = await svc.getCachedData(testCacheKey);
      
      const cachedObj = cachedData as Record<string, unknown> | undefined;
      if (!cachedObj || cachedObj['test'] !== true) {
        throw new Error('Cache operations failed');
      }

      return {
        success: true,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }


  private updateMetrics(serviceName: string, result: HealthCheckResult): void {
    const existing = this.metrics.get(serviceName);
    const now = new Date();

    if (!existing) {
      this.metrics.set(serviceName, {
        serviceName,
        responseTime: result.responseTime,
        errorRate: result.success ? 0 : 1,
        successRate: result.success ? 1 : 0,
        cacheHitRate: 0.8, // Default assumption
        lastHealthCheck: now,
        status: this.determineHealthStatus(result.responseTime, result.success ? 0 : 1, result.success ? 1 : 0),
        errors: result.error ? [result.error] : []
      });
      return;
    }

    // Calculate rolling averages (simple weighted average)
    const weight = 0.2; // 20% weight for new data
    existing.responseTime = existing.responseTime * (1 - weight) + result.responseTime * weight;
    existing.errorRate = existing.errorRate * (1 - weight) + (result.success ? 0 : 1) * weight;
    existing.successRate = existing.successRate * (1 - weight) + (result.success ? 1 : 0) * weight;
    existing.lastHealthCheck = now;
    existing.status = this.determineHealthStatus(existing.responseTime, existing.errorRate, existing.successRate);

    if (result.error) {
      existing.errors.push(result.error);
      // Keep only last 10 errors
      if (existing.errors.length > 10) {
        existing.errors = existing.errors.slice(-10);
      }
    }
  }

  private determineHealthStatus(responseTime: number, errorRate: number, successRate: number): 'healthy' | 'degraded' | 'unhealthy' {
    const thresholds = this.DEFAULT_THRESHOLDS;

    if (errorRate > thresholds.maxErrorRate || successRate < thresholds.minSuccessRate) {
      return 'unhealthy';
    }

    if (responseTime > thresholds.maxResponseTime) {
      return 'degraded';
    }

    return 'healthy';
  }

  private analyzeAndAlert(): void {
    const unhealthyServices: string[] = [];
    const degradedServices: string[] = [];

    this.metrics.forEach((metrics, serviceName) => {
      if (metrics.status === 'unhealthy') {
        unhealthyServices.push(serviceName);
      } else if (metrics.status === 'degraded') {
        degradedServices.push(serviceName);
      }
    });

    if (unhealthyServices.length > 0) {
      enhancedLogger.error('DataPipelineStabilityMonitor', 'analyzeAndAlert', `🚨 CRITICAL: Unhealthy services detected: ${unhealthyServices.join(', ')}`);
      this.sendAlert('critical', `Unhealthy services: ${unhealthyServices.join(', ')}`);
    }

    if (degradedServices.length > 0) {
      enhancedLogger.warn('DataPipelineStabilityMonitor', 'analyzeAndAlert', `⚠️ WARNING: Degraded services detected: ${degradedServices.join(', ')}`);
      this.sendAlert('warning', `Degraded services: ${degradedServices.join(', ')}`);
    }

    if (unhealthyServices.length === 0 && degradedServices.length === 0) {
      enhancedLogger.info('DataPipelineStabilityMonitor', 'analyzeAndAlert', '✅ All data pipeline services are healthy');
    }
  }

  private sendAlert(level: 'critical' | 'warning', message: string): void {
    // In a real implementation, this would integrate with alerting systems
    const timestamp = new Date().toISOString();
    const alertMessage = `[${level.toUpperCase()}] ${timestamp}: ${message}`;
    
    if (level === 'critical') {
      enhancedLogger.error('DataPipelineStabilityMonitor', 'sendAlert', alertMessage);
    } else {
      enhancedLogger.warn('DataPipelineStabilityMonitor', 'sendAlert', alertMessage);
    }

    // Store alert for dashboard display
    if (typeof window !== 'undefined' && window.localStorage) {
      const alerts = JSON.parse(localStorage.getItem('pipeline-alerts') || '[]');
      alerts.push({ level, message, timestamp });
      
      // Keep only last 50 alerts
      if (alerts.length > 50) {
        alerts.splice(0, alerts.length - 50);
      }
      
      localStorage.setItem('pipeline-alerts', JSON.stringify(alerts));
    }
  }

  getHealthReport(): Record<string, ServiceHealthMetrics> {
    const report: Record<string, ServiceHealthMetrics> = {};
    this.metrics.forEach((metrics, serviceName) => {
      report[serviceName] = { ...metrics };
    });
    return report;
  }

  getOverallHealthStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Array.from(this.metrics.values()).map(m => m.status);
    
    if (statuses.includes('unhealthy')) {
      return 'unhealthy';
    }
    
    if (statuses.includes('degraded')) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  // Method to validate UnifiedDataService constructor fix specifically
  async validateUnifiedDataServiceFix(): Promise<boolean> {
    try {
      const service = UnifiedDataService.getInstance();
      
      // Test that the service was properly initialized with the registry
      if (!service) {
        enhancedLogger.error('DataPipelineStabilityMonitor', 'validateUnifiedDataServiceFix', 'UnifiedDataService instance not available');
        return false;
      }

      // Test cache operations that previously failed due to constructor issues
      const testKey = 'constructor-fix-validation';
      const testData = { validated: true, timestamp: Date.now() };
      
      await service.cacheData(testKey, testData, 5000);
      const retrieved = await service.getCachedData(testKey);
      
    if (!retrieved || (retrieved as unknown as Record<string, unknown>)['validated'] !== true) {
        enhancedLogger.error('DataPipelineStabilityMonitor', 'validateUnifiedDataServiceFix', 'UnifiedDataService cache operations failed - constructor fix may not be working');
        return false;
      }

      enhancedLogger.info('DataPipelineStabilityMonitor', 'validateUnifiedDataServiceFix', '✅ UnifiedDataService constructor fix validated successfully');
      return true;
    } catch (error) {
      enhancedLogger.error('DataPipelineStabilityMonitor', 'validateUnifiedDataServiceFix', '❌ UnifiedDataService constructor fix validation failed', undefined, error as unknown as Error);
      return false;
    }
  }
}

export default DataPipelineStabilityMonitor;
