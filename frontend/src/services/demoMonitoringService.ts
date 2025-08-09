/**
 * Live Demo Performance Monitoring Service
 * Implements comprehensive monitoring for the A1Betting live demo
 * Tracks performance, errors, and user engagement metrics
 */

import { webVitalsService } from './webVitalsService';

interface DemoMetrics {
  performanceScore: number;
  errorCount: number;
  uptime: number;
  userEngagement: number;
  componentLoadTimes: Record<string, number>;
  memoryUsage: number;
  networkLatency: number;
}

interface DemoAlert {
  type: 'performance' | 'error' | 'engagement' | 'uptime';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  metrics?: Partial<DemoMetrics>;
}

class DemoMonitoringService {
  private metrics: DemoMetrics = {
    performanceScore: 100,
    errorCount: 0,
    uptime: 0,
    userEngagement: 100,
    componentLoadTimes: {},
    memoryUsage: 0,
    networkLatency: 0,
  };

  private alerts: DemoAlert[] = [];
  private startTime = Date.now();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor() {
    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring services
   */
  private initializeMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Start monitoring loop
    this.startMonitoring();

    // Monitor page visibility for engagement tracking
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Monitor errors
    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));

    // Monitor performance
    this.setupPerformanceObserver();

    console.log('[DemoMonitor] Monitoring service initialized');
  }

  /**
   * Start continuous monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.checkThresholds();
    }, 5000); // Check every 5 seconds

    this.addAlert({
      type: 'uptime',
      severity: 'low',
      message: 'Demo monitoring started',
      timestamp: new Date(),
    });
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

    console.log('[DemoMonitor] Monitoring stopped');
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    // Update uptime
    this.metrics.uptime = (Date.now() - this.startTime) / 1000;

    // Update memory usage
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }

    // Calculate performance score based on Web Vitals
    this.calculatePerformanceScore();

    // Update network latency estimation
    this.updateNetworkLatency();
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(): void {
    const vitals = webVitalsService.getMetrics();
    let score = 100;

    // Penalize based on Web Vitals thresholds
    if (vitals.LCP && vitals.LCP > 2500) score -= 20;
    if (vitals.FID && vitals.FID > 100) score -= 15;
    if (vitals.CLS && vitals.CLS > 0.1) score -= 15;
    if (vitals.TTFB && vitals.TTFB > 600) score -= 10;

    // Penalize for errors
    score -= Math.min(this.metrics.errorCount * 5, 30);

    // Penalize for high memory usage
    if (this.metrics.memoryUsage > 0.8) score -= 10;

    this.metrics.performanceScore = Math.max(score, 0);
  }

  /**
   * Update network latency estimation
   */
  private updateNetworkLatency(): void {
    if ('connection' in navigator && (navigator as any).connection) {
      const connection = (navigator as any).connection;
      this.metrics.networkLatency = connection.rtt || 0;
    }
  }

  /**
   * Check performance thresholds and create alerts
   */
  private checkThresholds(): void {
    // Performance score threshold
    if (this.metrics.performanceScore < 60) {
      this.addAlert({
        type: 'performance',
        severity: 'high',
        message: `Performance score dropped to ${this.metrics.performanceScore}`,
        timestamp: new Date(),
        metrics: { performanceScore: this.metrics.performanceScore },
      });
    }

    // Error count threshold
    if (this.metrics.errorCount > 5) {
      this.addAlert({
        type: 'error',
        severity: 'medium',
        message: `Error count reached ${this.metrics.errorCount}`,
        timestamp: new Date(),
        metrics: { errorCount: this.metrics.errorCount },
      });
    }

    // Memory usage threshold
    if (this.metrics.memoryUsage > 0.9) {
      this.addAlert({
        type: 'performance',
        severity: 'critical',
        message: `Memory usage at ${(this.metrics.memoryUsage * 100).toFixed(1)}%`,
        timestamp: new Date(),
        metrics: { memoryUsage: this.metrics.memoryUsage },
      });
    }
  }

  /**
   * Handle JavaScript errors
   */
  private handleError(event: ErrorEvent): void {
    this.metrics.errorCount++;
    
    // Don't alert for known non-critical errors
    const nonCriticalErrors = [
      'ResizeObserver loop limit exceeded',
      'Script error',
      'WebSocket',
      'Failed to fetch',
      'item is not defined', // Known issue from cache
    ];

    const isNonCritical = nonCriticalErrors.some(error => 
      event.message.includes(error)
    );

    if (!isNonCritical) {
      this.addAlert({
        type: 'error',
        severity: 'medium',
        message: `JavaScript error: ${event.message}`,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    this.metrics.errorCount++;

    // Check if it's a non-critical rejection
    const reason = event.reason?.toString() || '';
    const nonCriticalReasons = [
      'WebSocket',
      'Failed to fetch',
      'Network request failed',
      'AbortError',
    ];

    const isNonCritical = nonCriticalReasons.some(err => reason.includes(err));

    if (!isNonCritical) {
      this.addAlert({
        type: 'error',
        severity: 'medium',
        message: `Unhandled promise rejection: ${reason}`,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle page visibility changes for engagement tracking
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.metrics.userEngagement = Math.max(this.metrics.userEngagement - 5, 0);
    } else {
      this.metrics.userEngagement = Math.min(this.metrics.userEngagement + 10, 100);
    }
  }

  /**
   * Setup performance observer for monitoring component load times
   */
  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'measure') {
            this.metrics.componentLoadTimes[entry.name] = entry.duration;
          }
        });
      });

      observer.observe({ entryTypes: ['measure', 'navigation'] });
    }
  }

  /**
   * Track component load time
   */
  public trackComponentLoad(componentName: string, startTime: number): void {
    const loadTime = performance.now() - startTime;
    this.metrics.componentLoadTimes[componentName] = loadTime;

    // Alert for slow components
    if (loadTime > 1000) {
      this.addAlert({
        type: 'performance',
        severity: 'medium',
        message: `Slow component load: ${componentName} took ${loadTime.toFixed(0)}ms`,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Add a new alert
   */
  private addAlert(alert: DemoAlert): void {
    this.alerts.unshift(alert);
    
    // Keep only last 20 alerts
    if (this.alerts.length > 20) {
      this.alerts = this.alerts.slice(0, 20);
    }

    // Log critical alerts
    if (alert.severity === 'critical') {
      console.error('[DemoMonitor] CRITICAL:', alert.message);
    } else if (alert.severity === 'high') {
      console.warn('[DemoMonitor] HIGH:', alert.message);
    }
  }

  /**
   * Get current metrics
   */
  public getMetrics(): DemoMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent alerts
   */
  public getAlerts(severity?: DemoAlert['severity']): DemoAlert[] {
    if (severity) {
      return this.alerts.filter(alert => alert.severity === severity);
    }
    return [...this.alerts];
  }

  /**
   * Get demo health status
   */
  public getHealthStatus(): {
    status: 'excellent' | 'good' | 'fair' | 'poor';
    score: number;
    summary: string;
  } {
    const score = this.metrics.performanceScore;
    
    let status: 'excellent' | 'good' | 'fair' | 'poor';
    let summary: string;

    if (score >= 90) {
      status = 'excellent';
      summary = 'Demo performing excellently';
    } else if (score >= 75) {
      status = 'good';
      summary = 'Demo performing well';
    } else if (score >= 60) {
      status = 'fair';
      summary = 'Demo performance needs attention';
    } else {
      status = 'poor';
      summary = 'Demo experiencing performance issues';
    }

    return { status, score, summary };
  }

  /**
   * Generate monitoring report
   */
  public generateReport(): string {
    const health = this.getHealthStatus();
    const criticalAlerts = this.getAlerts('critical').length;
    const highAlerts = this.getAlerts('high').length;

    return `
Demo Monitoring Report
======================
Health Status: ${health.status.toUpperCase()} (${health.score}/100)
Summary: ${health.summary}

Metrics:
- Uptime: ${(this.metrics.uptime / 60).toFixed(1)} minutes
- Errors: ${this.metrics.errorCount}
- Memory Usage: ${(this.metrics.memoryUsage * 100).toFixed(1)}%
- User Engagement: ${this.metrics.userEngagement}%

Alerts:
- Critical: ${criticalAlerts}
- High: ${highAlerts}
- Total: ${this.alerts.length}

Performance:
${Object.entries(this.metrics.componentLoadTimes)
  .map(([name, time]) => `- ${name}: ${time.toFixed(0)}ms`)
  .join('\n')}
`;
  }

  /**
   * Reset metrics and alerts
   */
  public reset(): void {
    this.metrics = {
      performanceScore: 100,
      errorCount: 0,
      uptime: 0,
      userEngagement: 100,
      componentLoadTimes: {},
      memoryUsage: 0,
      networkLatency: 0,
    };
    this.alerts = [];
    this.startTime = Date.now();

    console.log('[DemoMonitor] Metrics reset');
  }
}

// Export singleton instance
export const demoMonitoringService = new DemoMonitoringService();

// Export types for external use
export type { DemoMetrics, DemoAlert };
