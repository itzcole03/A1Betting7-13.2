/**
 * Core Functionality Stability Service
 * Monitors and enhances stability of critical A1Betting features:
 * - Data feeds and sports services
 * - Prediction and AI services
 * - Arbitrage detection
 * Implements recommendations from the A1Betting Analysis Report
 */

import { demoMonitoringService } from './demoMonitoringService';
import { webVitalsService } from './webVitalsService';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
  responseTime: number;
  errorCount: number;
  errorRate: number;
}

interface StabilityMetrics {
  dataFeeds: ServiceHealth;
  predictions: ServiceHealth;
  arbitrage: ServiceHealth;
  overall: 'excellent' | 'good' | 'fair' | 'poor';
  demoMode: boolean;
  uptime: number;
}

interface StabilityAlert {
  service: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

class CoreFunctionalityService {
  private metrics: StabilityMetrics = {
    dataFeeds: {
      name: 'Data Feeds',
      status: 'healthy',
      lastCheck: new Date(),
      responseTime: 0,
      errorCount: 0,
      errorRate: 0,
    },
    predictions: {
      name: 'Predictions',
      status: 'healthy',
      lastCheck: new Date(),
      responseTime: 0,
      errorCount: 0,
      errorRate: 0,
    },
    arbitrage: {
      name: 'Arbitrage',
      status: 'healthy',
      lastCheck: new Date(),
      responseTime: 0,
      errorCount: 0,
      errorRate: 0,
    },
    overall: 'excellent',
    demoMode: true, // Start in demo mode by default
    uptime: 0,
  };

  private alerts: StabilityAlert[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private startTime = Date.now();

  constructor() {
    this.initializeStabilityMonitoring();
  }

  /**
   * Initialize stability monitoring
   */
  private initializeStabilityMonitoring(): void {
    console.log('[CoreStability] Initializing stability monitoring');
    
    // Start monitoring critical services
    this.startMonitoring();
    
    // Monitor for backend connectivity
    this.checkBackendConnectivity();
    
    // Set up error tracking
    this.setupErrorTracking();
    
    // Initialize demo mode by default
    this.enableDemoMode();
  }

  /**
   * Start continuous monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    
    // Check services every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks();
      this.updateOverallStatus();
      this.checkStabilityThresholds();
    }, 30000);

    this.addAlert({
      service: 'Core System',
      severity: 'info',
      message: 'Stability monitoring started',
      timestamp: new Date(),
      resolved: false,
    });

    console.log('[CoreStability] Monitoring started');
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('[CoreStability] Monitoring stopped');
  }

  /**
   * Perform health checks on core services
   */
  private async performHealthChecks(): Promise<void> {
    const startTime = Date.now();

    try {
      // Check PropOllama service (AI chat)
      await this.checkPropOllamaHealth();
      
      // Check Sports service (data feeds)
      await this.checkSportsServiceHealth();
      
      // Check arbitrage service
      await this.checkArbitrageServiceHealth();
      
      // Update uptime
      this.metrics.uptime = (Date.now() - this.startTime) / 1000;
      
    } catch (error) {
      console.warn('[CoreStability] Health check error:', error);
      this.handleHealthCheckError(error);
    }
  }

  /**
   * Check PropOllama service health
   */
  private async checkPropOllamaHealth(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test PropOllama health endpoint
      const response = await fetch('/api/propollama/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        this.updateServiceHealth('predictions', 'healthy', responseTime);
      } else {
        this.updateServiceHealth('predictions', 'degraded', responseTime);
        this.addAlert({
          service: 'PropOllama',
          severity: 'warning',
          message: `PropOllama service returned ${response.status}`,
          timestamp: new Date(),
          resolved: false,
        });
      }
    } catch (error) {
      // Service unavailable - activate demo mode
      this.updateServiceHealth('predictions', 'down', 5000);
      this.enableDemoMode();
      
      console.info('[CoreStability] PropOllama unavailable, demo mode active');
    }
  }

  /**
   * Check Sports service health
   */
  private async checkSportsServiceHealth(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test sports activation endpoint
      const response = await fetch('/api/sports/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sports: ['mlb'] }),
        signal: AbortSignal.timeout(3000),
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        this.updateServiceHealth('dataFeeds', 'healthy', responseTime);
        this.metrics.demoMode = false;
      } else {
        this.updateServiceHealth('dataFeeds', 'degraded', responseTime);
      }
    } catch (error) {
      // Expected in demo mode - not an error
      this.updateServiceHealth('dataFeeds', 'down', 3000);
      this.enableDemoMode();
      
      console.info('[CoreStability] Sports service unavailable, demo mode active');
    }
  }

  /**
   * Check arbitrage service health
   */
  private async checkArbitrageServiceHealth(): Promise<void> {
    // Since real arbitrage engine is not implemented, use mock health
    const startTime = Date.now();
    
    try {
      // Simulate arbitrage calculation test
      const mockResponseTime = Math.random() * 100 + 50; // 50-150ms
      
      this.updateServiceHealth('arbitrage', 'healthy', mockResponseTime);
      
      // Simulate occasional degradation for testing
      if (Math.random() < 0.1) { // 10% chance
        this.updateServiceHealth('arbitrage', 'degraded', mockResponseTime * 2);
        this.addAlert({
          service: 'Arbitrage',
          severity: 'info',
          message: 'Arbitrage calculation slightly slower than expected',
          timestamp: new Date(),
          resolved: false,
        });
      }
    } catch (error) {
      this.updateServiceHealth('arbitrage', 'down', 5000);
    }
  }

  /**
   * Update service health metrics
   */
  private updateServiceHealth(
    service: keyof Pick<StabilityMetrics, 'dataFeeds' | 'predictions' | 'arbitrage'>,
    status: ServiceHealth['status'],
    responseTime: number
  ): void {
    const serviceHealth = this.metrics[service];
    
    // Update basic metrics
    serviceHealth.status = status;
    serviceHealth.lastCheck = new Date();
    serviceHealth.responseTime = responseTime;
    
    // Update error tracking
    if (status === 'down') {
      serviceHealth.errorCount++;
    } else if (status === 'healthy' && serviceHealth.errorCount > 0) {
      // Service recovered
      this.resolveServiceAlerts(serviceHealth.name);
    }
    
    // Calculate error rate (over last 10 checks)
    serviceHealth.errorRate = Math.min(serviceHealth.errorCount / 10, 1);
  }

  /**
   * Update overall system status
   */
  private updateOverallStatus(): void {
    const services = [this.metrics.dataFeeds, this.metrics.predictions, this.metrics.arbitrage];
    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const downCount = services.filter(s => s.status === 'down').length;
    
    if (healthyCount === 3) {
      this.metrics.overall = 'excellent';
    } else if (healthyCount === 2) {
      this.metrics.overall = 'good';
    } else if (downCount <= 1) {
      this.metrics.overall = 'fair';
    } else {
      this.metrics.overall = 'poor';
    }
  }

  /**
   * Check stability thresholds and create alerts
   */
  private checkStabilityThresholds(): void {
    const services = [this.metrics.dataFeeds, this.metrics.predictions, this.metrics.arbitrage];
    
    services.forEach(service => {
      // Response time threshold
      if (service.responseTime > 2000 && service.status === 'healthy') {
        this.addAlert({
          service: service.name,
          severity: 'warning',
          message: `${service.name} response time is ${service.responseTime}ms`,
          timestamp: new Date(),
          resolved: false,
        });
      }
      
      // Error rate threshold
      if (service.errorRate > 0.3) {
        this.addAlert({
          service: service.name,
          severity: 'error',
          message: `${service.name} error rate is ${(service.errorRate * 100).toFixed(1)}%`,
          timestamp: new Date(),
          resolved: false,
        });
      }
    });
    
    // Overall system health alert
    if (this.metrics.overall === 'poor') {
      this.addAlert({
        service: 'System',
        severity: 'critical',
        message: 'Multiple core services are experiencing issues',
        timestamp: new Date(),
        resolved: false,
      });
    }
  }

  /**
   * Enable demo mode
   */
  private enableDemoMode(): void {
    if (!this.metrics.demoMode) {
      this.metrics.demoMode = true;
      this.addAlert({
        service: 'System',
        severity: 'info',
        message: 'Demo mode activated - using mock data',
        timestamp: new Date(),
        resolved: false,
      });
      
      console.log('[CoreStability] Demo mode enabled');
    }
  }

  /**
   * Check backend connectivity
   */
  private async checkBackendConnectivity(): Promise<void> {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        this.metrics.demoMode = false;
        this.addAlert({
          service: 'Backend',
          severity: 'info',
          message: 'Backend connectivity established',
          timestamp: new Date(),
          resolved: false,
        });
      }
    } catch (error) {
      this.enableDemoMode();
    }
  }

  /**
   * Setup error tracking
   */
  private setupErrorTracking(): void {
    // Track unhandled errors that might affect core functionality
    window.addEventListener('error', (event) => {
      this.handleJavaScriptError(event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handlePromiseRejection(event.reason);
    });
  }

  /**
   * Handle JavaScript errors
   */
  private handleJavaScriptError(error: Error): void {
    // Only track errors that might affect core functionality
    const criticalErrors = [
      'PropOllama',
      'SportsService',
      'UnifiedDataService',
      'prediction',
      'arbitrage',
    ];

    const isCritical = criticalErrors.some(keyword => 
      error.message.includes(keyword) || error.stack?.includes(keyword)
    );

    if (isCritical) {
      this.addAlert({
        service: 'Core System',
        severity: 'error',
        message: `Critical JavaScript error: ${error.message}`,
        timestamp: new Date(),
        resolved: false,
      });

      // Track with demo monitoring service
      demoMonitoringService.trackComponentLoad('CoreFunctionality', Date.now());
    }
  }

  /**
   * Handle promise rejections
   */
  private handlePromiseRejection(reason: any): void {
    const reasonStr = reason?.toString() || 'Unknown';
    
    // Track API-related rejections
    if (reasonStr.includes('fetch') || reasonStr.includes('api')) {
      this.addAlert({
        service: 'API',
        severity: 'warning',
        message: `API request failed: ${reasonStr}`,
        timestamp: new Date(),
        resolved: false,
      });
    }
  }

  /**
   * Handle health check errors
   */
  private handleHealthCheckError(error: any): void {
    this.addAlert({
      service: 'Health Monitor',
      severity: 'warning',
      message: `Health check failed: ${error?.message || 'Unknown error'}`,
      timestamp: new Date(),
      resolved: false,
    });
  }

  /**
   * Add stability alert
   */
  private addAlert(alert: StabilityAlert): void {
    this.alerts.unshift(alert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50);
    }

    // Log critical alerts
    if (alert.severity === 'critical') {
      console.error('[CoreStability] CRITICAL:', alert.message);
    } else if (alert.severity === 'error') {
      console.warn('[CoreStability] ERROR:', alert.message);
    }
  }

  /**
   * Resolve alerts for a specific service
   */
  private resolveServiceAlerts(serviceName: string): void {
    this.alerts
      .filter(alert => alert.service === serviceName && !alert.resolved)
      .forEach(alert => {
        alert.resolved = true;
        console.log(`[CoreStability] Alert resolved: ${alert.message}`);
      });
  }

  /**
   * Get current stability metrics
   */
  public getMetrics(): StabilityMetrics {
    return { ...this.metrics };
  }

  /**
   * Get stability alerts
   */
  public getAlerts(severity?: StabilityAlert['severity']): StabilityAlert[] {
    if (severity) {
      return this.alerts.filter(alert => alert.severity === severity && !alert.resolved);
    }
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get stability report
   */
  public getStabilityReport(): string {
    const metrics = this.getMetrics();
    const criticalAlerts = this.getAlerts('critical').length;
    const errorAlerts = this.getAlerts('error').length;
    const warningAlerts = this.getAlerts('warning').length;

    return `
Core Functionality Stability Report
==================================
Overall Status: ${metrics.overall.toUpperCase()}
Demo Mode: ${metrics.demoMode ? 'ACTIVE' : 'INACTIVE'}
Uptime: ${(metrics.uptime / 60).toFixed(1)} minutes

Service Health:
- Data Feeds: ${metrics.dataFeeds.status.toUpperCase()} (${metrics.dataFeeds.responseTime}ms)
- Predictions: ${metrics.predictions.status.toUpperCase()} (${metrics.predictions.responseTime}ms)
- Arbitrage: ${metrics.arbitrage.status.toUpperCase()} (${metrics.arbitrage.responseTime}ms)

Active Alerts:
- Critical: ${criticalAlerts}
- Error: ${errorAlerts}
- Warning: ${warningAlerts}

Recommendations:
${metrics.demoMode ? '- Demo mode active - backend unavailable' : '- All services operational'}
${metrics.overall === 'poor' ? '- Multiple services need attention' : '- System stability is acceptable'}
${errorAlerts > 0 ? '- Review error alerts for service issues' : '- No critical errors detected'}
`;
  }

  /**
   * Force demo mode (for testing)
   */
  public forceDemoMode(): void {
    this.enableDemoMode();
  }

  /**
   * Reset stability metrics
   */
  public reset(): void {
    this.metrics = {
      dataFeeds: {
        name: 'Data Feeds',
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 0,
        errorCount: 0,
        errorRate: 0,
      },
      predictions: {
        name: 'Predictions',
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 0,
        errorCount: 0,
        errorRate: 0,
      },
      arbitrage: {
        name: 'Arbitrage',
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 0,
        errorCount: 0,
        errorRate: 0,
      },
      overall: 'excellent',
      demoMode: true,
      uptime: 0,
    };
    
    this.alerts = [];
    this.startTime = Date.now();
    
    console.log('[CoreStability] Metrics reset');
  }
}

// Export singleton instance
export const coreFunctionalityService = new CoreFunctionalityService();

// Export types
export type { StabilityMetrics, StabilityAlert, ServiceHealth };
